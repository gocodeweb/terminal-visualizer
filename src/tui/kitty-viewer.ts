/**
 * Kitty graphics viewer with worker-thread rendering.
 *
 * - Main thread: handles keyboard input + displays cached PNGs (never blocks)
 * - Worker thread: renders SVG→PNG in background (~60ms each, off main thread)
 * - Navigation is always instant: status bar updates immediately,
 *   image updates as soon as the worker delivers the frame
 */

import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import type { Visualization, UserSelection, TreeNode } from '../types.js';
import { generateSVG } from '../image/svg-renderer.js';
import { svgToPng, transmitImage, deleteImage } from '../image/kitty-renderer.js';

const IMAGE_ID = 42;

// --- Navigation state ---

interface NavState {
  get index(): number;
  total: number;
  getSelection: () => UserSelection | null;
  getIndicator: () => string;
  navigate: (dir: 'up' | 'down' | 'left' | 'right') => void;
  getNeighbors: () => number[];
}

function createNavState(viz: Visualization): NavState {
  const state = { index: 0 };

  function linear(total: number) {
    return {
      navigate: (dir: 'up' | 'down' | 'left' | 'right') => {
        if (dir === 'left' || dir === 'up') state.index = Math.max(0, state.index - 1);
        if (dir === 'right' || dir === 'down') state.index = Math.min(total - 1, state.index + 1);
      },
      getNeighbors: () => {
        const n: number[] = [];
        if (state.index > 0) n.push(state.index - 1);
        if (state.index < total - 1) n.push(state.index + 1);
        return n;
      },
    };
  }

  function grid2d(rowCount: number, colCount: number) {
    return {
      navigate: (dir: 'up' | 'down' | 'left' | 'right') => {
        const r = Math.floor(state.index / colCount), c = state.index % colCount;
        if (dir === 'right' && c < colCount - 1) state.index++;
        if (dir === 'left' && c > 0) state.index--;
        if (dir === 'down' && r < rowCount - 1) state.index += colCount;
        if (dir === 'up' && r > 0) state.index -= colCount;
      },
      getNeighbors: () => {
        const r = Math.floor(state.index / colCount), c = state.index % colCount;
        const n: number[] = [];
        if (c > 0) n.push(state.index - 1);
        if (c < colCount - 1) n.push(state.index + 1);
        if (r > 0) n.push(state.index - colCount);
        if (r < rowCount - 1) n.push(state.index + colCount);
        return n;
      },
    };
  }

  switch (viz.type) {
    case 'bar-chart': {
      const t = viz.data.length; const nav = linear(t);
      return { get index() { return state.index; }, total: t, ...nav,
        getSelection: () => { const d = viz.data[state.index]; return d ? { type: 'bar', label: d.label, index: state.index, description: `${d.label}: ${d.value}` } : null; },
        getIndicator: () => { const d = viz.data[state.index]; return d ? `[${state.index + 1}/${t}] ${d.label}: ${d.value}` : ''; },
      };
    }
    case 'line-chart': {
      const t = viz.series.length; const nav = linear(t);
      return { get index() { return state.index; }, total: t, ...nav,
        getSelection: () => { const s = viz.series[state.index]; return s ? { type: 'series', label: s.name, index: state.index, description: `Series: ${s.name}` } : null; },
        getIndicator: () => { const s = viz.series[state.index]; return s ? `[${state.index + 1}/${t}] ${s.name}` : ''; },
      };
    }
    case 'table': {
      const t = viz.rows.length; const nav = linear(t);
      return { get index() { return state.index; }, total: t, ...nav,
        getSelection: () => { const row = viz.rows[state.index]; if (!row) return null; const label = viz.headers.map((h, i) => `${h}: ${row[i]}`).join(', '); return { type: 'row', label, index: state.index, row, description: label }; },
        getIndicator: () => { const row = viz.rows[state.index]; if (!row) return ''; return `[${state.index + 1}/${t}] ${viz.headers.map((h, i) => `${h}: ${row[i]}`).join(', ')}`; },
      };
    }
    case 'tree': {
      const flat: { label: string; description?: string }[] = [];
      function walk(node: TreeNode) { flat.push({ label: node.label, description: node.description }); if (node.children) node.children.forEach(walk); }
      walk(viz.data);
      const t = flat.length; const nav = linear(t);
      return { get index() { return state.index; }, total: t, ...nav,
        getSelection: () => { const n = flat[state.index]; return n ? { type: 'tree-node', label: n.label, description: n.description || n.label, index: state.index } : null; },
        getIndicator: () => { const n = flat[state.index]; return n ? `[${state.index + 1}/${t}] ${n.label}` : ''; },
      };
    }
    case 'flow-diagram': {
      const t = viz.nodes.length; const nav = linear(t);
      return { get index() { return state.index; }, total: t, ...nav,
        getSelection: () => { const n = viz.nodes[state.index]; return n ? { type: 'node', id: n.id, label: n.label, description: n.description || n.label, index: state.index } : null; },
        getIndicator: () => { const n = viz.nodes[state.index]; return n ? `[${state.index + 1}/${t}] ${n.label}${n.description ? ' - ' + n.description : ''}` : ''; },
      };
    }
    case 'grid': {
      const cells = viz.cells; const t = cells.length;
      return { get index() { return state.index; }, total: t,
        navigate: (dir) => {
          const cur = cells[state.index]; if (!cur) return;
          const dr = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;
          const dc = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
          let best = -1, bestDist = Infinity;
          for (let i = 0; i < cells.length; i++) {
            if (i === state.index) continue; const c = cells[i];
            if (dr !== 0 && Math.sign(c.row - cur.row) !== Math.sign(dr)) continue;
            if (dc !== 0 && Math.sign(c.col - cur.col) !== Math.sign(dc)) continue;
            if (dr !== 0 && c.row === cur.row) continue;
            if (dc !== 0 && c.col === cur.col) continue;
            const dist = Math.abs(c.row - (cur.row + dr)) + Math.abs(c.col - (cur.col + dc));
            if (dist < bestDist) { bestDist = dist; best = i; }
          }
          if (best >= 0) state.index = best;
        },
        getNeighbors: () => {
          const cur = cells[state.index]; if (!cur) return [];
          const n: number[] = [];
          for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
            let best = -1, bestDist = Infinity;
            for (let i = 0; i < cells.length; i++) {
              if (i === state.index) continue; const c = cells[i];
              if (dr !== 0 && Math.sign(c.row - cur.row) !== Math.sign(dr)) continue;
              if (dc !== 0 && Math.sign(c.col - cur.col) !== Math.sign(dc)) continue;
              if (dr !== 0 && c.row === cur.row) continue;
              if (dc !== 0 && c.col === cur.col) continue;
              const dist = Math.abs(c.row - (cur.row + dr)) + Math.abs(c.col - (cur.col + dc));
              if (dist < bestDist) { bestDist = dist; best = i; }
            }
            if (best >= 0) n.push(best);
          }
          return n;
        },
        getSelection: () => { const c = cells[state.index]; return c ? { type: 'cell', id: `r${c.row}c${c.col}`, label: c.label, description: c.description || `${c.sublabel || ''} ${c.label}`.trim(), index: state.index } : null; },
        getIndicator: () => { const c = cells[state.index]; return c ? `${c.sublabel ? c.sublabel + ' ' : ''}${c.label}${c.description ? ' - ' + c.description : ''}` : ''; },
      };
    }
    case 'timeline': {
      const flat: { lane: string; item: typeof viz.lanes[0]['items'][0] }[] = [];
      for (const lane of viz.lanes) for (const item of lane.items) flat.push({ lane: lane.label, item });
      const t = flat.length; const nav = linear(t);
      return { get index() { return state.index; }, total: t, ...nav,
        getSelection: () => { const f = flat[state.index]; return f ? { type: 'timeline-item', id: f.item.id, label: f.item.label, description: f.item.description || `${f.lane}: ${f.item.label}`, index: state.index } : null; },
        getIndicator: () => { const f = flat[state.index]; if (!f) return ''; const dur = f.item.end !== undefined ? ` (${f.item.start}-${f.item.end})` : ` @${f.item.start}`; return `${f.lane}: ${f.item.label}${dur}`; },
      };
    }
    case 'heatmap': {
      const colCount = viz.xLabels.length; const rowCount = viz.yLabels.length;
      const t = rowCount * colCount; const nav = grid2d(rowCount, colCount);
      return { get index() { return state.index; }, total: t, ...nav,
        getSelection: () => { const r = Math.floor(state.index / colCount), c = state.index % colCount; const val = viz.data[r]?.[c] ?? 0; return { type: 'heatmap-cell', label: `${viz.yLabels[r]} × ${viz.xLabels[c]}`, description: `${viz.yLabels[r]} × ${viz.xLabels[c]}: ${val}`, index: state.index }; },
        getIndicator: () => { const r = Math.floor(state.index / colCount), c = state.index % colCount; const val = viz.data[r]?.[c] ?? 0; return `${viz.yLabels[r]} × ${viz.xLabels[c]}: ${val}`; },
      };
    }
    case 'stacked-bar-chart': {
      const t = viz.categories.length; const nav = linear(t);
      return { get index() { return state.index; }, total: t, ...nav,
        getSelection: () => { const cat = viz.categories[state.index]; return cat ? { type: 'category', label: cat, index: state.index, description: cat } : null; },
        getIndicator: () => { const cat = viz.categories[state.index]; if (!cat) return ''; const bd = viz.segments.map(s => `${s.name}: ${s.values[state.index] || 0}`).join(', '); return `[${state.index + 1}/${t}] ${cat} — ${bd}`; },
      };
    }
    case 'sequence-diagram': {
      const t = viz.messages.length; const nav = linear(t);
      return { get index() { return state.index; }, total: t, ...nav,
        getSelection: () => { const msg = viz.messages[state.index]; if (!msg) return null; const from = viz.actors.find(a => a.id === msg.from)?.label || msg.from; const to = viz.actors.find(a => a.id === msg.to)?.label || msg.to; return { type: 'message', id: `${msg.from}->${msg.to}`, label: msg.label, description: msg.description || `${from} → ${to}: ${msg.label}`, index: state.index }; },
        getIndicator: () => { const msg = viz.messages[state.index]; if (!msg) return ''; const from = viz.actors.find(a => a.id === msg.from)?.label || msg.from; const to = viz.actors.find(a => a.id === msg.to)?.label || msg.to; return `[${state.index + 1}/${t}] ${from} → ${to}: ${msg.label}`; },
      };
    }
  }
}

// --- Main viewer ---

export function runKittyViewer(
  viz: Visualization,
  writeResult: (selection: UserSelection | null) => void,
): void {
  const nav = createNavState(viz);
  const stdout = process.stdout;
  const stdin = process.stdin;
  const cols = stdout.columns || 80;
  const rows = stdout.rows || 24;
  const imgRows = rows - 2;

  // Enter alternate screen, hide cursor
  stdout.write('\x1b[?1049h\x1b[?25l');
  stdin.setRawMode(true);
  stdin.resume();

  // --- Worker thread for off-main-thread rendering ---
  const thisFile = fileURLToPath(import.meta.url);
  const workerPath = path.resolve(path.dirname(thisFile), '..', 'render-worker.js');
  const worker = new Worker(workerPath);

  // Frame cache
  const cache = new Map<number, Buffer>();
  const pending = new Set<number>();

  function requestRender(index: number) {
    if (cache.has(index) || pending.has(index)) return;
    pending.add(index);
    const svg = generateSVG(viz, { highlightIndex: index });
    worker.postMessage({ id: index, svg });
  }

  // When worker delivers a frame
  worker.on('message', (msg: { id: number; png: Buffer | null }) => {
    pending.delete(msg.id);
    if (msg.png) {
      cache.set(msg.id, Buffer.from(msg.png));
      // If this is the frame the user is currently on, display it
      if (msg.id === nav.index) {
        displayCached(msg.id);
      }
    }
  });

  function displayCached(index: number) {
    const png = cache.get(index);
    if (!png) return;
    stdout.write('\x1b[H');
    transmitImage(stdout, png, { imageId: IMAGE_ID, cols, rows: imgRows });
  }

  function updateStatusBar() {
    const statusLine = ` \x1b[33m▶ ${nav.getIndicator()}\x1b[0m`;
    const hintLine = ' \x1b[37m←→↑↓ navigate │ Enter select │ q quit\x1b[0m';
    stdout.write(`\x1b[${rows - 1};1H\x1b[K${statusLine}`);
    stdout.write(`\x1b[${rows};1H\x1b[K${hintLine}`);
  }

  // Render initial frame synchronously (show something immediately)
  const initialSvg = generateSVG(viz, { highlightIndex: 0 });
  const initialPng = svgToPng(initialSvg);
  cache.set(0, initialPng);
  displayCached(0);
  updateStatusBar();

  // Pre-render ALL frames in background — by the time user starts
  // navigating, most frames will already be cached (instant display).
  // Neighbors first, then expand outward.
  const preRenderOrder: number[] = [];
  // Start with immediate neighbors
  for (const idx of nav.getNeighbors()) {
    preRenderOrder.push(idx);
  }
  // Then all remaining frames sorted by distance from 0
  for (let i = 0; i < nav.total; i++) {
    if (i !== 0 && !preRenderOrder.includes(i)) {
      preRenderOrder.push(i);
    }
  }
  for (const idx of preRenderOrder) {
    requestRender(idx);
  }

  // Handle keyboard input — NEVER blocked by rendering
  stdin.on('data', (data: Buffer) => {
    const key = data.toString();

    // Arrow keys FIRST
    let dir: 'up' | 'down' | 'left' | 'right' | null = null;
    if (key === '\x1b[A' || key === 'k') dir = 'up';
    if (key === '\x1b[B' || key === 'j') dir = 'down';
    if (key === '\x1b[C' || key === 'l') dir = 'right';
    if (key === '\x1b[D' || key === 'h') dir = 'left';

    if (dir) {
      nav.navigate(dir);
      updateStatusBar(); // always instant

      if (cache.has(nav.index)) {
        // Cache hit — display instantly
        displayCached(nav.index);
      } else {
        // Cache miss — request from worker, will display when ready
        requestRender(nav.index);
      }

      // Pre-render neighbors
      for (const idx of nav.getNeighbors()) {
        requestRender(idx);
      }
      return;
    }

    if (key === 'q' || key === '\x03') {
      cleanup();
      writeResult(null);
      process.exit(0);
    }

    if (key === '\r' || key === '\n') {
      cleanup();
      writeResult(nav.getSelection());
      process.exit(0);
    }
  });

  function cleanup() {
    worker.terminate();
    deleteImage(stdout, IMAGE_ID);
    stdout.write('\x1b[?25h\x1b[?1049l');
    stdin.setRawMode(false);
    stdin.pause();
  }

  stdout.on('resize', () => {
    if (cache.has(nav.index)) {
      displayCached(nav.index);
    }
    updateStatusBar();
  });
}
