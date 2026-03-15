import blessed from 'blessed';
import { execSync, spawn, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as tty from 'node:tty';
import { fileURLToPath } from 'node:url';
import type { Visualization, UserSelection } from '../types.js';
import { renderBarChart } from './render-bar-chart.js';
import { renderLineChart } from './render-line-chart.js';
import { renderTable } from './render-table.js';
import { renderTree } from './render-tree.js';
import { renderFlowDiagram } from './render-flow-diagram.js';
import { renderGrid } from './render-grid.js';
import { renderTimeline } from './render-timeline.js';
import { renderHeatmap } from './render-heatmap.js';
import { renderStackedBarChart } from './render-stacked-bar-chart.js';
import { renderSequenceDiagram } from './render-sequence-diagram.js';

function renderVisualization(
  screen: blessed.Widgets.Screen,
  viz: Visualization,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  switch (viz.type) {
    case 'bar-chart':
      return renderBarChart(screen, viz);
    case 'line-chart':
      return renderLineChart(screen, viz);
    case 'table':
      return renderTable(screen, viz);
    case 'tree':
      return renderTree(screen, viz);
    case 'flow-diagram':
      return renderFlowDiagram(screen, viz);
    case 'grid':
      return renderGrid(screen, viz);
    case 'timeline':
      return renderTimeline(screen, viz);
    case 'heatmap':
      return renderHeatmap(screen, viz);
    case 'stacked-bar-chart':
      return renderStackedBarChart(screen, viz);
    case 'sequence-diagram':
      return renderSequenceDiagram(screen, viz);
  }
}

// --- Environment detection ---

function isCmux(): boolean {
  return !!process.env.CMUX_SOCKET_PATH;
}

function isTmux(): boolean {
  return !!process.env.TMUX;
}

function getViewerPath(): string {
  const thisFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(thisFile), '..', 'viewer.js');
}

function getViewerCommand(): string[] {
  return ['node', getViewerPath()];
}

function makeTempPaths() {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    dataPath: path.join(os.tmpdir(), `viz-data-${id}.json`),
    resultPath: path.join(os.tmpdir(), `viz-result-${id}.json`),
    waitChannel: `viz-${id}`,
  };
}

function readResult(resultPath: string): UserSelection | null {
  try {
    return JSON.parse(fs.readFileSync(resultPath, 'utf-8')) as UserSelection | null;
  } catch {
    return null;
  }
}

function cleanupTempFiles(...paths: string[]) {
  for (const p of paths) {
    try { fs.unlinkSync(p); } catch {}
  }
}

// --- cmux (Ghostty-based terminal) ---

async function showInCmuxSplit(
  visualization: Visualization,
): Promise<UserSelection | null> {
  const { dataPath, resultPath, waitChannel } = makeTempPaths();
  const viewerCmd = getViewerCommand();

  fs.writeFileSync(dataPath, JSON.stringify(visualization));

  // Create a split pane to the right
  const splitOut = execSync('cmux new-split right 2>&1').toString().trim();
  const surfaceMatch = splitOut.match(/surface:\d+/);
  if (!surfaceMatch) {
    console.error('cmux new-split failed:', splitOut);
    return showInCurrentTerminal(visualization);
  }
  const surface = surfaceMatch[0];

  // Run the viewer directly via respawn-pane
  const cmd = `${viewerCmd.join(' ')} --data "${dataPath}" --result "${resultPath}"; cmux wait-for -S "${waitChannel}"`;
  execSync(`cmux respawn-pane --surface "${surface}" --command ${JSON.stringify(cmd)}`);

  // Wait for the viewer to finish
  await new Promise<void>((resolve) => {
    const child = spawn('cmux', ['wait-for', waitChannel], {
      stdio: 'ignore',
    });
    child.on('close', () => resolve());
    child.on('error', () => resolve());
  });

  // Small delay to let the surface close itself via `exit`
  await new Promise(r => setTimeout(r, 100));

  // Close the surface if it's still around
  try {
    execSync(`cmux close-surface --surface "${surface}" 2>/dev/null`);
  } catch {
    // Already closed by `exit`
  }

  const result = readResult(resultPath);
  cleanupTempFiles(dataPath, resultPath);
  return result;
}

// --- tmux ---

async function showInTmuxPane(
  visualization: Visualization,
): Promise<UserSelection | null> {
  const { dataPath, resultPath, waitChannel } = makeTempPaths();
  const viewerCmd = getViewerCommand();

  fs.writeFileSync(dataPath, JSON.stringify(visualization));

  const shellCmd = [
    `${viewerCmd.join(' ')} --data "${dataPath}" --result "${resultPath}"`,
    `tmux wait-for -S "${waitChannel}"`,
  ].join('; ');

  spawnSync('tmux', [
    'split-window', '-h', '-l', '60%', '--',
    'bash', '-c', shellCmd,
  ]);

  await new Promise<void>((resolve) => {
    const child = spawn('tmux', ['wait-for', waitChannel], {
      stdio: 'ignore',
    });
    child.on('close', () => resolve());
    child.on('error', () => resolve());
  });

  const result = readResult(resultPath);
  cleanupTempFiles(dataPath, resultPath);
  return result;
}

// --- Fallback: /dev/tty overlay ---

async function showInCurrentTerminal(
  visualization: Visualization,
): Promise<UserSelection | null> {
  return new Promise((resolve) => {
    const fd = fs.openSync('/dev/tty', 'r+');
    const input = new tty.ReadStream(fd);
    const output = new tty.WriteStream(fd);

    input.setRawMode(true);

    const screen = blessed.screen({
      input,
      output,
      smartCSR: true,
      fullUnicode: true,
      mouse: true,
      terminal: process.env.TERM || 'xterm-256color',
      title: visualization.title,
    });

    const { getSelection } = renderVisualization(screen, visualization);

    blessed.box({
      parent: screen,
      bottom: 0,
      height: 1,
      width: '100%',
      content: ' ←→↑↓ navigate │ Enter select │ q quit',
      style: { fg: 'white', bg: 'black' },
    });

    let resolved = false;
    function cleanup() {
      if (resolved) return;
      resolved = true;

      try { output.write('\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l'); } catch {}
      screen.destroy();
      try { output.write('\x1b[?1049l\x1b[?25h\x1b[0m\x1bc'); } catch {}

      input.setRawMode(false);
      setTimeout(() => {
        input.destroy();
        output.destroy();
        try { fs.closeSync(fd); } catch {}
      }, 50);
    }

    screen.key(['q', 'escape'], () => {
      cleanup();
      resolve(null);
    });

    screen.key(['enter'], () => {
      // Defer so widget-level handlers (tree select, table select) run first
      process.nextTick(() => {
        const selection = getSelection();
        cleanup();
        resolve(selection);
      });
    });

    screen.render();
  });
}

// --- Main entry point: pick the best rendering strategy ---

export async function showInteractiveTUI(
  visualization: Visualization,
): Promise<UserSelection | null> {
  if (isCmux()) {
    return showInCmuxSplit(visualization);
  }
  if (isTmux()) {
    return showInTmuxPane(visualization);
  }
  return showInCurrentTerminal(visualization);
}
