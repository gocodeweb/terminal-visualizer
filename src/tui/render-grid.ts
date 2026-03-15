import blessed from 'blessed';
import type { GridDiagram, UserSelection } from '../types.js';
import { colorForIndex } from './theme.js';

const CELL_W = 6;
const CELL_H = 3;

export function renderGrid(
  screen: blessed.Widgets.Screen,
  viz: GridDiagram,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  let focusedIndex = 0;
  const cells = viz.cells;

  const maxCol = Math.max(...cells.map(c => c.col), 0);
  const maxRow = Math.max(...cells.map(c => c.row), 0);

  const contentH = (maxRow + 1) * CELL_H + 2;

  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%-1',
    label: ` ${viz.title} `,
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: '▐', style: { fg: 'cyan' } },
    keys: true,
    mouse: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white', bold: true },
    },
  });

  const cellBoxes: blessed.Widgets.BoxElement[] = [];

  // Map color ramps to blessed color names for borders
  const colorNames: Record<string, string> = {
    purple: 'magenta', teal: 'cyan', coral: 'red', pink: 'magenta',
    gray: 'white', blue: 'blue', green: 'green', amber: 'yellow', red: 'red',
  };

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const ramp = cell.color || colorForIndex(i);
    const borderColor = i === focusedIndex ? 'yellow' : (colorNames[ramp] || 'cyan');

    const x = 1 + cell.col * (CELL_W + 0);
    const y = 1 + cell.row * (CELL_H + 0);

    // Build cell content: sublabel on top, label centered
    let content = '';
    if (cell.sublabel) {
      content = `${cell.sublabel}\n${cell.label}`;
    } else {
      content = `\n${cell.label}`;
    }

    const box = blessed.box({
      parent: container,
      top: y,
      left: x,
      width: CELL_W,
      height: CELL_H,
      content,
      align: 'center',
      border: { type: 'line' },
      style: {
        border: { fg: borderColor },
        fg: 'white',
        bold: i === focusedIndex,
      },
    });

    cellBoxes.push(box);
  }

  // Legend
  if (viz.legend && viz.legend.length > 0) {
    const legendY = contentH + 1;
    let legendX = 2;
    for (const item of viz.legend) {
      const color = colorNames[item.color] || 'white';
      const text = `■ ${item.label}`;
      blessed.box({
        parent: container,
        top: legendY,
        left: legendX,
        width: text.length + 2,
        height: 1,
        content: text,
        style: { fg: color },
      });
      legendX += text.length + 3;
    }
  }

  // Indicator
  const indicator = blessed.box({
    parent: container,
    bottom: 0,
    left: 1,
    width: '100%-4',
    height: 1,
    content: formatIndicator(0),
    style: { fg: 'yellow' },
  });

  function formatIndicator(idx: number): string {
    const c = cells[idx];
    if (!c) return '';
    const parts = [c.label];
    if (c.sublabel) parts.unshift(c.sublabel);
    if (c.description) parts.push(`- ${c.description}`);
    return `▶ ${parts.join(' ')}`;
  }

  function updateFocus() {
    for (let i = 0; i < cellBoxes.length; i++) {
      const ramp = cells[i].color || colorForIndex(i);
      cellBoxes[i].style.border = {
        fg: i === focusedIndex ? 'yellow' : (colorNames[ramp] || 'cyan'),
      };
      (cellBoxes[i].style as Record<string, unknown>).bold = i === focusedIndex;
    }
    indicator.setContent(formatIndicator(focusedIndex));

    // Scroll to focused cell
    const cell = cells[focusedIndex];
    if (cell) {
      container.scrollTo(1 + cell.row * (CELL_H + 0));
    }
    screen.render();
  }

  // Navigate by grid position
  function findNearest(dr: number, dc: number) {
    const cur = cells[focusedIndex];
    if (!cur) return;

    const targetRow = cur.row + dr;
    const targetCol = cur.col + dc;

    // Find exact match first
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < cells.length; i++) {
      if (i === focusedIndex) continue;
      const c = cells[i];
      // Must be in the right direction
      if (dr !== 0 && Math.sign(c.row - cur.row) !== Math.sign(dr)) continue;
      if (dc !== 0 && Math.sign(c.col - cur.col) !== Math.sign(dc)) continue;
      if (dr !== 0 && c.row === cur.row) continue;
      if (dc !== 0 && c.col === cur.col) continue;

      const dist = Math.abs(c.row - targetRow) + Math.abs(c.col - targetCol);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    if (best >= 0) {
      focusedIndex = best;
      updateFocus();
    }
  }

  screen.key(['right', 'l'], () => findNearest(0, 1));
  screen.key(['left', 'h'], () => findNearest(0, -1));
  screen.key(['down', 'j'], () => findNearest(1, 0));
  screen.key(['up', 'k'], () => findNearest(-1, 0));

  return {
    widget: container,
    getSelection: () => {
      const cell = cells[focusedIndex];
      if (!cell) return null;
      return {
        type: 'cell',
        id: `r${cell.row}c${cell.col}`,
        label: cell.label,
        description: cell.description || `${cell.sublabel || ''} ${cell.label}`.trim(),
        index: focusedIndex,
      };
    },
  };
}
