import blessed from 'blessed';
import type { Heatmap, UserSelection } from '../types.js';

const CELL_W = 7;
const CELL_H = 1;
const LABEL_W = 12;

// Intensity blocks from empty to full
const BLOCKS = [' ', '░', '▒', '▓', '█'];

const RAMP_COLORS: Record<string, string[]> = {
  blue:   ['17', '19', '25', '33', '39', '75', '111'],
  green:  ['22', '28', '34', '40', '46', '82', '114'],
  red:    ['52', '88', '124', '160', '196', '203', '210'],
  amber:  ['94', '130', '136', '172', '178', '214', '220'],
  purple: ['53', '54', '91', '98', '135', '141', '183'],
  teal:   ['23', '29', '30', '36', '43', '79', '115'],
  coral:  ['131', '167', '173', '203', '209', '210', '216'],
  pink:   ['125', '126', '162', '163', '175', '211', '218'],
  gray:   ['235', '238', '240', '243', '245', '248', '250'],
};

export function renderHeatmap(
  screen: blessed.Widgets.Screen,
  viz: Heatmap,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  let focusRow = 0;
  let focusCol = 0;

  const rows = viz.data.length;
  const cols = viz.data[0]?.length || 0;

  const allValues = viz.data.flat();
  const minVal = viz.minValue ?? Math.min(...allValues);
  const maxVal = viz.maxValue ?? Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const rampName = viz.colorRamp || 'blue';
  const ramp = RAMP_COLORS[rampName] || RAMP_COLORS.blue;

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
    style: { border: { fg: 'cyan' }, label: { fg: 'white', bold: true } },
  });

  // Column headers
  for (let c = 0; c < cols; c++) {
    const lbl = (viz.xLabels[c] || '').slice(0, CELL_W - 1);
    blessed.box({
      parent: container,
      top: 0,
      left: LABEL_W + 1 + c * CELL_W,
      width: CELL_W,
      height: 1,
      content: lbl,
      align: 'center',
      style: { fg: 'cyan', bold: true },
    });
  }

  const cellBoxes: blessed.Widgets.BoxElement[][] = [];

  for (let r = 0; r < rows; r++) {
    // Row label
    const rowLabel = (viz.yLabels[r] || '').slice(0, LABEL_W - 1);
    blessed.box({
      parent: container,
      top: 1 + r * CELL_H,
      left: 1,
      width: LABEL_W,
      height: CELL_H,
      content: rowLabel,
      style: { fg: 'cyan', bold: true },
    });

    cellBoxes[r] = [];
    for (let c = 0; c < cols; c++) {
      const val = viz.data[r]?.[c] ?? 0;
      const norm = (val - minVal) / range; // 0-1
      const colorIdx = Math.min(ramp.length - 1, Math.floor(norm * (ramp.length - 1)));
      const isFocused = r === focusRow && c === focusCol;
      const valStr = String(val).slice(0, CELL_W - 2);
      const pad = CELL_W - 2 - valStr.length;
      const content = ' '.repeat(Math.floor(pad / 2)) + valStr;

      const box = blessed.box({
        parent: container,
        top: 1 + r * CELL_H,
        left: LABEL_W + 1 + c * CELL_W,
        width: CELL_W,
        height: CELL_H,
        content,
        style: {
          fg: isFocused ? 'yellow' : 'white',
          bg: isFocused ? 'black' : undefined,
          bold: isFocused,
        },
      });

      // Apply 256-color background
      const bgCode = ramp[colorIdx];
      if (!isFocused) {
        box.style.bg = bgCode as any;
      }

      cellBoxes[r][c] = box;
    }
  }

  // Legend gradient
  const legendY = 1 + rows * CELL_H + 1;
  const legendStr = `${minVal} ${BLOCKS.slice(1).join('')} ${maxVal}`;
  blessed.box({
    parent: container,
    top: legendY,
    left: LABEL_W + 1,
    width: legendStr.length + 2,
    height: 1,
    content: legendStr,
    style: { fg: 'white' },
  });

  const indicator = blessed.box({
    parent: container,
    bottom: 0,
    left: 1,
    width: '100%-4',
    height: 1,
    content: formatIndicator(),
    style: { fg: 'yellow' },
  });

  function formatIndicator(): string {
    const yL = viz.yLabels[focusRow] || `row ${focusRow}`;
    const xL = viz.xLabels[focusCol] || `col ${focusCol}`;
    const val = viz.data[focusRow]?.[focusCol] ?? 0;
    return `▶ ${yL} × ${xL}: ${val}`;
  }

  function updateFocus(prevR: number, prevC: number) {
    // Un-highlight previous
    if (cellBoxes[prevR]?.[prevC]) {
      const prevVal = viz.data[prevR]?.[prevC] ?? 0;
      const norm = (prevVal - minVal) / range;
      const colorIdx = Math.min(ramp.length - 1, Math.floor(norm * (ramp.length - 1)));
      cellBoxes[prevR][prevC].style.fg = 'white';
      cellBoxes[prevR][prevC].style.bg = ramp[colorIdx] as any;
      cellBoxes[prevR][prevC].style.bold = false;
    }
    // Highlight new
    if (cellBoxes[focusRow]?.[focusCol]) {
      cellBoxes[focusRow][focusCol].style.fg = 'yellow';
      cellBoxes[focusRow][focusCol].style.bg = 'black';
      cellBoxes[focusRow][focusCol].style.bold = true;
    }
    indicator.setContent(formatIndicator());
    container.scrollTo(1 + focusRow * CELL_H);
    screen.render();
  }

  screen.key(['right', 'l'], () => {
    if (focusCol < cols - 1) { const pr = focusRow, pc = focusCol; focusCol++; updateFocus(pr, pc); }
  });
  screen.key(['left', 'h'], () => {
    if (focusCol > 0) { const pr = focusRow, pc = focusCol; focusCol--; updateFocus(pr, pc); }
  });
  screen.key(['down', 'j'], () => {
    if (focusRow < rows - 1) { const pr = focusRow, pc = focusCol; focusRow++; updateFocus(pr, pc); }
  });
  screen.key(['up', 'k'], () => {
    if (focusRow > 0) { const pr = focusRow, pc = focusCol; focusRow--; updateFocus(pr, pc); }
  });

  return {
    widget: container,
    getSelection: () => {
      const yL = viz.yLabels[focusRow] || `row ${focusRow}`;
      const xL = viz.xLabels[focusCol] || `col ${focusCol}`;
      const val = viz.data[focusRow]?.[focusCol] ?? 0;
      return {
        type: 'heatmap-cell',
        label: `${yL} × ${xL}`,
        description: `${yL} × ${xL}: ${val}`,
        index: focusRow * cols + focusCol,
      };
    },
  };
}
