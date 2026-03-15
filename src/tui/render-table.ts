import blessed from 'blessed';
import contrib from 'blessed-contrib';
import type { Table, UserSelection } from '../types.js';

export function renderTable(
  screen: blessed.Widgets.Screen,
  viz: Table,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  let selectedRow = 0;

  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%-1',
    label: ` ${viz.title} `,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white', bold: true },
    },
  });

  const colWidths = viz.headers.map((h, i) => {
    const maxData = viz.rows.reduce(
      (max, row) => Math.max(max, String(row[i] ?? '').length),
      0,
    );
    return Math.max(h.length, maxData) + 2;
  });

  const table = contrib.table({
    parent: container,
    top: 0,
    left: 0,
    width: '100%-2',
    height: '100%-2',
    keys: true,
    interactive: true,
    fg: 'white',
    selectedFg: 'black',
    selectedBg: 'cyan',
    columnSpacing: 3,
    columnWidth: colWidths,
  });

  table.setData({
    headers: viz.headers,
    data: viz.rows.map(row => row.map(cell => String(cell))),
  });

  table.focus();

  if (table.rows) {
    table.rows.on('select item', (_item: unknown, index: number) => {
      selectedRow = index;
    });
  }

  return {
    widget: container,
    getSelection: () => {
      const row = viz.rows[selectedRow];
      if (!row) return null;
      const label = viz.headers.map((h, i) => `${h}: ${row[i]}`).join(', ');
      return {
        type: 'row',
        label,
        index: selectedRow,
        row,
        description: label,
      };
    },
  };
}
