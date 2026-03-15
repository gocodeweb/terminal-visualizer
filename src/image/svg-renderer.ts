import type {
  Visualization,
  BarChart,
  LineChart,
  FlowDiagram,
  TreeDiagram,
  Table,
  GridDiagram,
  Timeline,
  Heatmap,
  StackedBarChart,
  SequenceDiagram,
  TreeNode,
} from '../types.js';

const COLORS: Record<string, string> = {
  purple: '#B794F4',
  teal: '#81E6D9',
  coral: '#FC8181',
  pink: '#FBB6CE',
  gray: '#CBD5E0',
  blue: '#90CDF4',
  green: '#9AE6B4',
  amber: '#F6E05E',
  red: '#FEB2B2',
};

const COLOR_ORDER = [
  'blue', 'teal', 'coral', 'purple', 'green', 'amber', 'pink', 'red', 'gray',
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBarChartSVG(viz: BarChart): string {
  const width = 600;
  const height = 400;
  const padding = 60;
  const barWidth = Math.min(60, (width - padding * 2) / Math.max(viz.data.length, 1) - 10);
  const maxVal = Math.max(...viz.data.map(d => d.value), 1);

  let bars = '';
  viz.data.forEach((d, i) => {
    const color = COLORS[d.color || COLOR_ORDER[i % COLOR_ORDER.length]];
    const barH = (d.value / maxVal) * (height - padding * 2);
    const x = padding + i * (barWidth + 10);
    const y = height - padding - barH;
    bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${color}" rx="4"/>`;
    bars += `<text x="${x + barWidth / 2}" y="${height - padding + 20}" text-anchor="middle" font-size="12" fill="#E2E8F0">${escapeXml(d.label)}</text>`;
    bars += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="11" fill="#A0AEC0">${d.value}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#1A202C" rx="8"/>
  <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" fill="#E2E8F0" font-weight="bold">${escapeXml(viz.title)}</text>
  ${bars}
</svg>`;
}

function renderLineChartSVG(viz: LineChart): string {
  const width = 600;
  const height = 400;
  const padding = 60;
  const allValues = viz.series.flatMap(s => s.data);
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  let lines = '';
  viz.series.forEach((s, si) => {
    const color = COLORS[s.color || COLOR_ORDER[si % COLOR_ORDER.length]];
    const points = s.data
      .map((v, i) => {
        const x = padding + (i / Math.max(s.data.length - 1, 1)) * (width - padding * 2);
        const y = height - padding - ((v - minVal) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
    lines += `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#1A202C" rx="8"/>
  <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" fill="#E2E8F0" font-weight="bold">${escapeXml(viz.title)}</text>
  ${lines}
</svg>`;
}

function renderTableSVG(viz: Table): string {
  const colWidth = 120;
  const rowHeight = 30;
  const width = Math.max(400, viz.headers.length * colWidth + 40);
  const height = (viz.rows.length + 2) * rowHeight + 60;

  let cells = '';
  viz.headers.forEach((h, i) => {
    cells += `<text x="${20 + i * colWidth + colWidth / 2}" y="70" text-anchor="middle" font-size="13" fill="#90CDF4" font-weight="bold">${escapeXml(h)}</text>`;
  });

  viz.rows.forEach((row, ri) => {
    const y = 95 + ri * rowHeight;
    row.forEach((cell, ci) => {
      cells += `<text x="${20 + ci * colWidth + colWidth / 2}" y="${y}" text-anchor="middle" font-size="12" fill="#E2E8F0">${escapeXml(String(cell))}</text>`;
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#1A202C" rx="8"/>
  <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" fill="#E2E8F0" font-weight="bold">${escapeXml(viz.title)}</text>
  <line x1="20" y1="78" x2="${width - 20}" y2="78" stroke="#4A5568" stroke-width="1"/>
  ${cells}
</svg>`;
}

function renderFlowSVG(viz: FlowDiagram): string {
  const nodeW = 140;
  const nodeH = 50;
  const hGap = 80;
  const vGap = 40;

  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  viz.nodes.forEach(n => { adj.set(n.id, []); inDeg.set(n.id, 0); });
  viz.edges.forEach(e => {
    adj.get(e.from)?.push(e.to);
    inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1);
  });

  const layers = new Map<string, number>();
  const visited = new Set<string>();
  function dfs(id: string): number {
    if (layers.has(id)) return layers.get(id)!;
    if (visited.has(id)) return 0;
    visited.add(id);
    let max = -1;
    for (const c of adj.get(id) || []) max = Math.max(max, dfs(c));
    const l = max + 1;
    layers.set(id, l);
    return l;
  }
  viz.nodes.forEach(n => dfs(n.id));
  const maxL = Math.max(0, ...layers.values());
  for (const [k, v] of layers) layers.set(k, maxL - v);

  const layerGroups = new Map<number, typeof viz.nodes>();
  viz.nodes.forEach(n => {
    const l = layers.get(n.id) || 0;
    if (!layerGroups.has(l)) layerGroups.set(l, []);
    layerGroups.get(l)!.push(n);
  });

  const positions = new Map<string, { x: number; y: number }>();
  for (const [layer, nodes] of layerGroups) {
    nodes.forEach((n, i) => {
      positions.set(n.id, {
        x: 40 + layer * (nodeW + hGap),
        y: 60 + i * (nodeH + vGap),
      });
    });
  }

  const maxX = Math.max(...[...positions.values()].map(p => p.x)) + nodeW + 40;
  const maxY = Math.max(...[...positions.values()].map(p => p.y)) + nodeH + 40;

  let edges = '';
  for (const e of viz.edges) {
    const from = positions.get(e.from);
    const to = positions.get(e.to);
    if (!from || !to) continue;
    const x1 = from.x + nodeW;
    const y1 = from.y + nodeH / 2;
    const x2 = to.x;
    const y2 = to.y + nodeH / 2;
    edges += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4A5568" stroke-width="2" marker-end="url(#arrow)"/>`;
    if (e.label) {
      edges += `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}" text-anchor="middle" font-size="11" fill="#A0AEC0">${escapeXml(e.label)}</text>`;
    }
  }

  let nodesSvg = '';
  viz.nodes.forEach((n, i) => {
    const pos = positions.get(n.id);
    if (!pos) return;
    const color = COLORS[n.color || COLOR_ORDER[i % COLOR_ORDER.length]];
    nodesSvg += `<rect x="${pos.x}" y="${pos.y}" width="${nodeW}" height="${nodeH}" fill="${color}22" stroke="${color}" stroke-width="2" rx="8"/>`;
    nodesSvg += `<text x="${pos.x + nodeW / 2}" y="${pos.y + nodeH / 2 + 5}" text-anchor="middle" font-size="13" fill="#E2E8F0">${escapeXml(n.label)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}">
  <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#4A5568"/></marker></defs>
  <rect width="${maxX}" height="${maxY}" fill="#1A202C" rx="8"/>
  <text x="${maxX / 2}" y="35" text-anchor="middle" font-size="16" fill="#E2E8F0" font-weight="bold">${escapeXml(viz.title)}</text>
  ${edges}
  ${nodesSvg}
</svg>`;
}

function renderTreeSVG(viz: TreeDiagram): string {
  const nodeW = 120;
  const nodeH = 35;
  const hGap = 40;
  const vGap = 50;

  interface Positioned {
    node: TreeNode;
    x: number;
    y: number;
    children: Positioned[];
  }

  let maxX = 0;

  function layout(node: TreeNode, depth: number, yOffset: number): Positioned {
    const children: Positioned[] = [];
    let currentY = yOffset;
    if (node.children) {
      for (const child of node.children) {
        const pos = layout(child, depth + 1, currentY);
        children.push(pos);
        currentY = pos.y + nodeH + vGap;
      }
    }

    let y: number;
    if (children.length > 0) {
      y = (children[0].y + children[children.length - 1].y) / 2;
    } else {
      y = yOffset;
    }

    const x = 40 + depth * (nodeW + hGap);
    maxX = Math.max(maxX, x + nodeW);
    return { node, x, y, children };
  }

  const root = layout(viz.data, 0, 60);

  function getMaxY(p: Positioned): number {
    let max = p.y;
    for (const c of p.children) max = Math.max(max, getMaxY(c));
    return max;
  }

  const totalH = getMaxY(root) + nodeH + 60;

  let svg = '';
  function draw(p: Positioned, idx: number) {
    const color = COLORS[p.node.color || COLOR_ORDER[idx % COLOR_ORDER.length]];
    svg += `<rect x="${p.x}" y="${p.y}" width="${nodeW}" height="${nodeH}" fill="${color}22" stroke="${color}" stroke-width="2" rx="6"/>`;
    svg += `<text x="${p.x + nodeW / 2}" y="${p.y + nodeH / 2 + 4}" text-anchor="middle" font-size="12" fill="#E2E8F0">${escapeXml(p.node.label)}</text>`;
    p.children.forEach((c, ci) => {
      svg += `<line x1="${p.x + nodeW}" y1="${p.y + nodeH / 2}" x2="${c.x}" y2="${c.y + nodeH / 2}" stroke="#4A5568" stroke-width="1.5"/>`;
      draw(c, ci);
    });
  }
  draw(root, 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX + 40}" height="${totalH}" viewBox="0 0 ${maxX + 40} ${totalH}">
  <rect width="${maxX + 40}" height="${totalH}" fill="#1A202C" rx="8"/>
  <text x="${(maxX + 40) / 2}" y="35" text-anchor="middle" font-size="16" fill="#E2E8F0" font-weight="bold">${escapeXml(viz.title)}</text>
  ${svg}
</svg>`;
}

// --- Highlight support ---

const GLOW_DEFS = `<defs><filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;

function highlightRect(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" fill="none" stroke="#F6E05E" stroke-width="3" rx="6" filter="url(#glow)"/>`;
}

export interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get bounding boxes for navigable elements in a visualization.
 * Returns positions in SVG pixel coordinates.
 */
export function getElementPositions(viz: Visualization): ElementRect[] {
  switch (viz.type) {
    case 'bar-chart': {
      const padding = 60;
      const barWidth = Math.min(60, (600 - padding * 2) / Math.max(viz.data.length, 1) - 10);
      return viz.data.map((_, i) => ({
        x: padding + i * (barWidth + 10),
        y: 60,
        width: barWidth,
        height: 280,
      }));
    }
    case 'line-chart':
      return viz.series.map((_, i) => ({
        x: 60, y: 40 + i * 20, width: 480, height: 20,
      }));
    case 'table':
      return viz.rows.map((_, i) => ({
        x: 20, y: 80 + i * 30, width: Math.max(400, viz.headers.length * 120), height: 28,
      }));
    case 'tree': {
      const rects: ElementRect[] = [];
      const nodeW = 120, nodeH = 35, hGap = 40, vGap = 50;
      function walk(node: TreeNode, depth: number, yOff: number): number {
        let y = yOff;
        if (node.children && node.children.length > 0) {
          let childY = yOff;
          for (const c of node.children) {
            childY = walk(c, depth + 1, childY);
          }
          y = (yOff + childY - vGap) / 2;
        }
        rects.push({ x: 40 + depth * (nodeW + hGap), y: y + 20, width: nodeW, height: nodeH });
        return node.children ? yOff + (node.children.length) * (nodeH + vGap) : yOff + nodeH + vGap;
      }
      walk(viz.data, 0, 60);
      return rects;
    }
    case 'flow-diagram': {
      const nodeW = 140, nodeH = 50, hGap = 80, vGap = 40;
      const adj = new Map<string, string[]>();
      const inDeg = new Map<string, number>();
      viz.nodes.forEach(n => { adj.set(n.id, []); inDeg.set(n.id, 0); });
      viz.edges.forEach(e => { adj.get(e.from)?.push(e.to); inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1); });
      const layers = new Map<string, number>();
      const visited = new Set<string>();
      function dfs(id: string): number {
        if (layers.has(id)) return layers.get(id)!;
        if (visited.has(id)) return 0;
        visited.add(id);
        let max = -1;
        for (const c of adj.get(id) || []) max = Math.max(max, dfs(c));
        const l = max + 1; layers.set(id, l); return l;
      }
      viz.nodes.forEach(n => dfs(n.id));
      const maxL = Math.max(0, ...layers.values());
      for (const [k, v] of layers) layers.set(k, maxL - v);
      const layerGroups = new Map<number, typeof viz.nodes>();
      viz.nodes.forEach(n => {
        const l = layers.get(n.id) || 0;
        if (!layerGroups.has(l)) layerGroups.set(l, []);
        layerGroups.get(l)!.push(n);
      });
      const rects: ElementRect[] = [];
      for (const [layer, nodes] of layerGroups) {
        nodes.forEach((_, i) => {
          rects.push({
            x: 40 + layer * (nodeW + hGap),
            y: 60 + i * (nodeH + vGap),
            width: nodeW,
            height: nodeH,
          });
        });
      }
      return rects;
    }
    case 'grid': {
      const cellW = 50, cellH = 50, padding = 40;
      return viz.cells.map(c => ({
        x: padding + c.col * cellW,
        y: padding + 20 + c.row * cellH,
        width: cellW - 2,
        height: cellH - 2,
      }));
    }
    case 'timeline': {
      const labelW = 120, trackW = 500, padding = 40, laneH = 50;
      let minT = Infinity, maxT = -Infinity;
      for (const lane of viz.lanes) for (const item of lane.items) {
        minT = Math.min(minT, item.start); maxT = Math.max(maxT, item.end ?? item.start);
      }
      if (!isFinite(minT)) { minT = 0; maxT = 10; }
      const timeRange = maxT - minT || 1;
      const rects: ElementRect[] = [];
      viz.lanes.forEach((lane, li) => {
        lane.items.forEach(item => {
          const sx = padding + labelW + ((item.start - minT) / timeRange) * trackW;
          const ex = item.end !== undefined ? padding + labelW + ((item.end - minT) / timeRange) * trackW : sx + 12;
          rects.push({
            x: sx, y: padding + 20 + li * laneH + laneH / 2 - 10,
            width: Math.max(12, ex - sx), height: 20,
          });
        });
      });
      return rects;
    }
    case 'heatmap': {
      const cellW = 50, cellH = 35, labelW = 80, headerH = 40, padding = 40;
      const rects: ElementRect[] = [];
      for (let r = 0; r < viz.yLabels.length; r++) {
        for (let c = 0; c < viz.xLabels.length; c++) {
          rects.push({
            x: padding + labelW + c * cellW,
            y: padding + headerH + r * cellH,
            width: cellW - 2, height: cellH - 2,
          });
        }
      }
      return rects;
    }
    case 'stacked-bar-chart': {
      const barW = 50, barGap = 20, padding = 60, chartH = 250;
      return viz.categories.map((_, ci) => ({
        x: padding + ci * (barW + barGap), y: padding,
        width: barW, height: chartH,
      }));
    }
    case 'sequence-diagram': {
      const actorW = 100, actorH = 36, actorGap = 40, msgH = 40, padding = 40;
      const positions = new Map<string, number>();
      viz.actors.forEach((a, i) => positions.set(a.id, padding + i * (actorW + actorGap) + actorW / 2));
      return viz.messages.map((msg, i) => {
        const fromX = positions.get(msg.from) || 0;
        const toX = positions.get(msg.to) || 0;
        const y = padding + 20 + actorH + 20 + i * msgH;
        return {
          x: Math.min(fromX, toX) - 5, y: y - 12,
          width: Math.abs(toX - fromX) + 10, height: 20,
        };
      });
    }
  }
}

/**
 * Generate SVG with optional highlight on a specific element.
 */
export function generateSVG(viz: Visualization, options?: { highlightIndex?: number }): string {
  let svg = generateSVGBase(viz);
  if (options?.highlightIndex !== undefined) {
    const positions = getElementPositions(viz);
    const pos = positions[options.highlightIndex];
    if (pos) {
      // Insert glow defs and highlight rect before closing </svg>
      const highlight = GLOW_DEFS + highlightRect(pos.x, pos.y, pos.width, pos.height);
      svg = svg.replace('</svg>', highlight + '</svg>');
    }
  }
  return svg;
}

function generateSVGBase(viz: Visualization): string {
  switch (viz.type) {
    case 'bar-chart':
      return renderBarChartSVG(viz);
    case 'line-chart':
      return renderLineChartSVG(viz);
    case 'table':
      return renderTableSVG(viz);
    case 'tree':
      return renderTreeSVG(viz);
    case 'flow-diagram':
      return renderFlowSVG(viz);
    case 'grid':
      return renderGridSVG(viz);
    case 'timeline':
      return renderTimelineSVG(viz);
    case 'heatmap':
      return renderHeatmapSVG(viz);
    case 'stacked-bar-chart':
      return renderStackedBarSVG(viz);
    case 'sequence-diagram':
      return renderSequenceSVG(viz);
  }
}

function renderGridSVG(viz: GridDiagram): string {
  const cellW = 50;
  const cellH = 50;
  const padding = 40;
  const maxCol = Math.max(...viz.cells.map(c => c.col), 0);
  const maxRow = Math.max(...viz.cells.map(c => c.row), 0);
  const width = (maxCol + 1) * cellW + padding * 2;
  const height = (maxRow + 1) * cellH + padding * 2 + 20;

  let cells = '';
  viz.cells.forEach((c, i) => {
    const color = COLORS[c.color || COLOR_ORDER[i % COLOR_ORDER.length]];
    const x = padding + c.col * cellW;
    const y = padding + 20 + c.row * cellH;
    cells += `<rect x="${x}" y="${y}" width="${cellW - 2}" height="${cellH - 2}" fill="${color}22" stroke="${color}" stroke-width="1.5" rx="4"/>`;
    if (c.sublabel) {
      cells += `<text x="${x + cellW / 2 - 1}" y="${y + 16}" text-anchor="middle" font-size="9" fill="#A0AEC0">${escapeXml(c.sublabel)}</text>`;
    }
    cells += `<text x="${x + cellW / 2 - 1}" y="${y + cellH / 2 + 4}" text-anchor="middle" font-size="14" fill="#E2E8F0" font-weight="bold">${escapeXml(c.label)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#1A202C" rx="8"/>
  <text x="${width / 2}" y="28" text-anchor="middle" font-size="16" fill="#E2E8F0" font-weight="bold">${escapeXml(viz.title)}</text>
  ${cells}
</svg>`;
}

function renderTimelineSVG(viz: Timeline): string {
  const laneH = 50;
  const labelW = 120;
  const trackW = 500;
  const padding = 40;
  const width = labelW + trackW + padding * 2;
  const height = viz.lanes.length * laneH + padding * 2 + 20;

  let minT = Infinity, maxT = -Infinity;
  for (const lane of viz.lanes) {
    for (const item of lane.items) {
      minT = Math.min(minT, item.start);
      maxT = Math.max(maxT, item.end ?? item.start);
    }
  }
  if (!isFinite(minT)) { minT = 0; maxT = 10; }
  const timeRange = maxT - minT || 1;

  let svg = '';
  viz.lanes.forEach((lane, li) => {
    const y = padding + 20 + li * laneH;
    svg += `<text x="${padding}" y="${y + laneH / 2 + 4}" font-size="12" fill="#90CDF4">${escapeXml(lane.label)}</text>`;
    svg += `<line x1="${padding + labelW}" y1="${y + laneH / 2}" x2="${padding + labelW + trackW}" y2="${y + laneH / 2}" stroke="#2D3748" stroke-width="1"/>`;
    lane.items.forEach((item) => {
      const color = COLORS[item.color || COLOR_ORDER[li % COLOR_ORDER.length]];
      const sx = padding + labelW + ((item.start - minT) / timeRange) * trackW;
      if (item.end !== undefined) {
        const ex = padding + labelW + ((item.end - minT) / timeRange) * trackW;
        svg += `<rect x="${sx}" y="${y + laneH / 2 - 10}" width="${Math.max(2, ex - sx)}" height="20" fill="${color}" rx="4" opacity="0.8"/>`;
        svg += `<text x="${sx + 4}" y="${y + laneH / 2 + 4}" font-size="10" fill="#1A202C">${escapeXml(item.label)}</text>`;
      } else {
        svg += `<circle cx="${sx}" cy="${y + laneH / 2}" r="6" fill="${color}"/>`;
        svg += `<text x="${sx + 10}" y="${y + laneH / 2 + 4}" font-size="10" fill="#E2E8F0">${escapeXml(item.label)}</text>`;
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#1A202C" rx="8"/>
  <text x="${width / 2}" y="28" text-anchor="middle" font-size="16" fill="#E2E8F0" font-weight="bold">${escapeXml(viz.title)}</text>
  ${svg}
</svg>`;
}

function renderHeatmapSVG(viz: Heatmap): string {
  const cellW = 50;
  const cellH = 35;
  const labelW = 80;
  const headerH = 40;
  const padding = 40;
  const cols = viz.xLabels.length;
  const rows = viz.yLabels.length;
  const width = labelW + cols * cellW + padding * 2;
  const height = headerH + rows * cellH + padding * 2;
  const allValues = viz.data.flat();
  const minVal = viz.minValue ?? Math.min(...allValues);
  const maxVal = viz.maxValue ?? Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const baseColor = COLORS[viz.colorRamp || 'blue'];

  let svg = '';
  viz.xLabels.forEach((label, c) => {
    svg += `<text x="${padding + labelW + c * cellW + cellW / 2}" y="${padding + headerH - 5}" text-anchor="middle" font-size="10" fill="#90CDF4">${escapeXml(label)}</text>`;
  });
  viz.yLabels.forEach((label, r) => {
    svg += `<text x="${padding + labelW - 5}" y="${padding + headerH + r * cellH + cellH / 2 + 4}" text-anchor="end" font-size="10" fill="#90CDF4">${escapeXml(label)}</text>`;
  });
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = viz.data[r]?.[c] ?? 0;
      const norm = (val - minVal) / range;
      const x = padding + labelW + c * cellW;
      const y = padding + headerH + r * cellH;
      svg += `<rect x="${x}" y="${y}" width="${cellW - 2}" height="${cellH - 2}" fill="${baseColor}" opacity="${0.1 + norm * 0.9}" rx="3"/>`;
      svg += `<text x="${x + cellW / 2 - 1}" y="${y + cellH / 2 + 3}" text-anchor="middle" font-size="10" fill="#E2E8F0">${val}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#1A202C" rx="8"/>
  <text x="${width / 2}" y="28" text-anchor="middle" font-size="16" fill="#E2E8F0" font-weight="bold">${escapeXml(viz.title)}</text>
  ${svg}
</svg>`;
}

function renderStackedBarSVG(viz: StackedBarChart): string {
  const barW = 50;
  const barGap = 20;
  const chartH = 250;
  const padding = 60;
  const width = Math.max(400, viz.categories.length * (barW + barGap) + padding * 2);
  const height = chartH + padding * 2;
  const totals = viz.categories.map((_, ci) => viz.segments.reduce((s, seg) => s + (seg.values[ci] || 0), 0));
  const maxTotal = Math.max(...totals, 1);

  let svg = '';
  viz.categories.forEach((cat, ci) => {
    const x = padding + ci * (barW + barGap);
    let yBottom = height - padding;
    viz.segments.forEach((seg, si) => {
      const val = seg.values[ci] || 0;
      const h = (val / maxTotal) * chartH;
      yBottom -= h;
      const color = COLORS[seg.color || COLOR_ORDER[si % COLOR_ORDER.length]];
      svg += `<rect x="${x}" y="${yBottom}" width="${barW}" height="${h}" fill="${color}" rx="2"/>`;
    });
    svg += `<text x="${x + barW / 2}" y="${height - padding + 18}" text-anchor="middle" font-size="11" fill="#E2E8F0">${escapeXml(cat)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#1A202C" rx="8"/>
  <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" fill="#E2E8F0" font-weight="bold">${escapeXml(viz.title)}</text>
  ${svg}
</svg>`;
}

function renderSequenceSVG(viz: SequenceDiagram): string {
  const actorW = 100;
  const actorH = 36;
  const actorGap = 40;
  const msgH = 40;
  const padding = 40;
  const width = viz.actors.length * (actorW + actorGap) + padding * 2;
  const height = actorH + viz.messages.length * msgH + padding * 2 + 40;
  const positions = new Map<string, number>();
  viz.actors.forEach((a, i) => positions.set(a.id, padding + i * (actorW + actorGap) + actorW / 2));

  let svg = `<defs><marker id="seq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#A0AEC0"/></marker></defs>`;

  viz.actors.forEach((a, i) => {
    const cx = positions.get(a.id)!;
    const color = COLORS[a.color || COLOR_ORDER[i % COLOR_ORDER.length]];
    svg += `<rect x="${cx - actorW / 2}" y="${padding + 20}" width="${actorW}" height="${actorH}" fill="${color}22" stroke="${color}" stroke-width="2" rx="6"/>`;
    svg += `<text x="${cx}" y="${padding + 20 + actorH / 2 + 5}" text-anchor="middle" font-size="12" fill="#E2E8F0">${escapeXml(a.label)}</text>`;
    svg += `<line x1="${cx}" y1="${padding + 20 + actorH}" x2="${cx}" y2="${height - padding}" stroke="#4A5568" stroke-width="1" stroke-dasharray="4"/>`;
  });

  viz.messages.forEach((msg, i) => {
    const fromX = positions.get(msg.from);
    const toX = positions.get(msg.to);
    if (fromX === undefined || toX === undefined) return;
    const y = padding + 20 + actorH + 20 + i * msgH;
    const dash = msg.style === 'dashed' ? ' stroke-dasharray="6"' : '';
    svg += `<line x1="${fromX}" y1="${y}" x2="${toX}" y2="${y}" stroke="#A0AEC0" stroke-width="1.5"${dash} marker-end="url(#seq-arrow)"/>`;
    svg += `<text x="${(fromX + toX) / 2}" y="${y - 6}" text-anchor="middle" font-size="10" fill="#E2E8F0">${escapeXml(msg.label)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#1A202C" rx="8"/>
  <text x="${width / 2}" y="28" text-anchor="middle" font-size="16" fill="#E2E8F0" font-weight="bold">${escapeXml(viz.title)}</text>
  ${svg}
</svg>`;
}
