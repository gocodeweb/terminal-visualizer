import React, { useState, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import type { Visualization, UserSelection, TreeNode } from '../types.js';
import { InkBarChart } from './InkBarChart.js';
import { InkLineChart } from './InkLineChart.js';
import { InkTable } from './InkTable.js';
import { InkTree } from './InkTree.js';
import { InkFlowDiagram } from './InkFlowDiagram.js';
import { InkHeatmap } from './InkHeatmap.js';
import { InkGrid } from './InkGrid.js';
import { InkTimeline } from './InkTimeline.js';
import { InkStackedBar } from './InkStackedBar.js';
import { InkSequenceDiagram } from './InkSequenceDiagram.js';

interface InkViewerProps {
  viz: Visualization;
  onSelect: (selection: UserSelection | null) => void;
}

function getTotal(viz: Visualization): number {
  switch (viz.type) {
    case 'bar-chart': return viz.data.length;
    case 'line-chart': return viz.series.length;
    case 'table': return viz.rows.length;
    case 'tree': {
      let count = 0;
      function walk(n: TreeNode) { count++; if (n.children) n.children.forEach(walk); }
      walk(viz.data);
      return count;
    }
    case 'flow-diagram': return viz.nodes.length;
    case 'grid': return viz.cells.length;
    case 'timeline': return viz.lanes.reduce((s, l) => s + l.items.length, 0);
    case 'heatmap': return viz.yLabels.length * viz.xLabels.length;
    case 'stacked-bar-chart': return viz.categories.length;
    case 'sequence-diagram': return viz.messages.length;
  }
}

function getSelection(viz: Visualization, index: number): UserSelection | null {
  switch (viz.type) {
    case 'bar-chart': {
      const d = viz.data[index];
      return d ? { type: 'bar', label: d.label, index, description: `${d.label}: ${d.value}` } : null;
    }
    case 'line-chart': {
      const s = viz.series[index];
      return s ? { type: 'series', label: s.name, index, description: `Series: ${s.name}` } : null;
    }
    case 'table': {
      const row = viz.rows[index];
      if (!row) return null;
      const label = viz.headers.map((h, i) => `${h}: ${row[i]}`).join(', ');
      return { type: 'row', label, index, row, description: label };
    }
    case 'tree': {
      const flat: { label: string; description?: string }[] = [];
      function walk(n: TreeNode) { flat.push({ label: n.label, description: n.description }); if (n.children) n.children.forEach(walk); }
      walk(viz.data);
      const n = flat[index];
      return n ? { type: 'tree-node', label: n.label, index, description: n.description || n.label } : null;
    }
    case 'flow-diagram': {
      const n = viz.nodes[index];
      return n ? { type: 'node', id: n.id, label: n.label, index, description: n.description || n.label } : null;
    }
    case 'grid': {
      const c = viz.cells[index];
      return c ? { type: 'cell', id: `r${c.row}c${c.col}`, label: c.label, index, description: c.description || c.label } : null;
    }
    case 'timeline': {
      const flat: { lane: string; item: typeof viz.lanes[0]['items'][0] }[] = [];
      for (const lane of viz.lanes) for (const item of lane.items) flat.push({ lane: lane.label, item });
      const f = flat[index];
      return f ? { type: 'timeline-item', label: f.item.label, index, description: f.item.description || `${f.lane}: ${f.item.label}` } : null;
    }
    case 'heatmap': {
      const cols = viz.xLabels.length;
      const r = Math.floor(index / cols), c = index % cols;
      const val = viz.data[r]?.[c] ?? 0;
      return { type: 'heatmap-cell', label: `${viz.yLabels[r]} × ${viz.xLabels[c]}`, index, description: `${viz.yLabels[r]} × ${viz.xLabels[c]}: ${val}` };
    }
    case 'stacked-bar-chart': {
      const cat = viz.categories[index];
      return cat ? { type: 'category', label: cat, index, description: cat } : null;
    }
    case 'sequence-diagram': {
      const msg = viz.messages[index];
      if (!msg) return null;
      const from = viz.actors.find(a => a.id === msg.from)?.label || msg.from;
      const to = viz.actors.find(a => a.id === msg.to)?.label || msg.to;
      return { type: 'message', id: `${msg.from}->${msg.to}`, label: msg.label, index, description: `${from} → ${to}: ${msg.label}` };
    }
  }
}

function getIndicator(viz: Visualization, index: number, total: number): string {
  const sel = getSelection(viz, index);
  if (!sel) return '';
  return `[${index + 1}/${total}] ${sel.description || sel.label}`;
}

function navigate(
  viz: Visualization, index: number, total: number,
  dir: 'up' | 'down' | 'left' | 'right',
): number {
  if (viz.type === 'heatmap') {
    const cols = viz.xLabels.length;
    const rows = viz.yLabels.length;
    const r = Math.floor(index / cols), c = index % cols;
    if (dir === 'right' && c < cols - 1) return index + 1;
    if (dir === 'left' && c > 0) return index - 1;
    if (dir === 'down' && r < rows - 1) return index + cols;
    if (dir === 'up' && r > 0) return index - cols;
    return index;
  }
  if (viz.type === 'grid') {
    const cells = viz.cells;
    const cur = cells[index]; if (!cur) return index;
    const dr = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;
    const dc = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
    let best = -1, bestDist = Infinity;
    for (let i = 0; i < cells.length; i++) {
      if (i === index) continue; const c = cells[i];
      if (dr !== 0 && Math.sign(c.row - cur.row) !== Math.sign(dr)) continue;
      if (dc !== 0 && Math.sign(c.col - cur.col) !== Math.sign(dc)) continue;
      if (dr !== 0 && c.row === cur.row) continue;
      if (dc !== 0 && c.col === cur.col) continue;
      const dist = Math.abs(c.row - (cur.row + dr)) + Math.abs(c.col - (cur.col + dc));
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    return best >= 0 ? best : index;
  }
  // Default: linear navigation
  if (dir === 'up' || dir === 'left') return Math.max(0, index - 1);
  if (dir === 'down' || dir === 'right') return Math.min(total - 1, index + 1);
  return index;
}

export function InkViewer({ viz, onSelect }: InkViewerProps) {
  const total = getTotal(viz);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const { exit } = useApp();

  useInput(useCallback((input, key) => {
    if (input === 'q' || key.escape) {
      onSelect(null);
      exit();
      return;
    }
    if (key.return) {
      onSelect(getSelection(viz, focusedIndex));
      exit();
      return;
    }

    let dir: 'up' | 'down' | 'left' | 'right' | null = null;
    if (key.upArrow || input === 'k') dir = 'up';
    if (key.downArrow || input === 'j') dir = 'down';
    if (key.rightArrow || input === 'l') dir = 'right';
    if (key.leftArrow || input === 'h') dir = 'left';

    if (dir) {
      setFocusedIndex(prev => navigate(viz, prev, total, dir));
    }
  }, [viz, total, focusedIndex]));

  const indicator = getIndicator(viz, focusedIndex, total);

  return (
    <Box flexDirection="column" width="100%">
      {/* Title */}
      <Box justifyContent="center" marginBottom={1}>
        <Text color="cyan" bold>{viz.title}</Text>
      </Box>

      {/* Visualization */}
      <Box flexGrow={1}>
        {viz.type === 'bar-chart' && <InkBarChart viz={viz} focusedIndex={focusedIndex} />}
        {viz.type === 'line-chart' && <InkLineChart viz={viz} focusedIndex={focusedIndex} />}
        {viz.type === 'table' && <InkTable viz={viz} focusedIndex={focusedIndex} />}
        {viz.type === 'tree' && <InkTree viz={viz} focusedIndex={focusedIndex} />}
        {viz.type === 'flow-diagram' && <InkFlowDiagram viz={viz} focusedIndex={focusedIndex} />}
        {viz.type === 'heatmap' && <InkHeatmap viz={viz} focusedIndex={focusedIndex} />}
        {viz.type === 'grid' && <InkGrid viz={viz} focusedIndex={focusedIndex} />}
        {viz.type === 'timeline' && <InkTimeline viz={viz} focusedIndex={focusedIndex} />}
        {viz.type === 'stacked-bar-chart' && <InkStackedBar viz={viz} focusedIndex={focusedIndex} />}
        {viz.type === 'sequence-diagram' && <InkSequenceDiagram viz={viz} focusedIndex={focusedIndex} />}
      </Box>

      {/* Status bar */}
      <Box marginTop={1}>
        <Text color="yellow">▶ {indicator}</Text>
      </Box>
      <Box>
        <Text color="gray">←→↑↓ navigate │ Enter select │ q quit</Text>
      </Box>
    </Box>
  );
}
