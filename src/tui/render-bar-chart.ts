import blessed from 'blessed';
import contrib from 'blessed-contrib';
import type { BarChart, UserSelection } from '../types.js';
import { colorBorder, colorForIndex } from './theme.js';

export function renderBarChart(
  screen: blessed.Widgets.Screen,
  viz: BarChart,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  let selectedIndex = 0;

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

  const barWidth = Math.max(4, Math.min(12, Math.floor(60 / Math.max(viz.data.length, 1))));
  const barSpacing = Math.max(2, Math.min(6, Math.floor(30 / Math.max(viz.data.length, 1))));

  const bar = contrib.bar({
    parent: container,
    top: 1,
    left: 1,
    width: '100%-4',
    height: '100%-4',
    barWidth,
    barSpacing,
    maxHeight: 9,
  });

  bar.setData({
    titles: viz.data.map(d => d.label),
    data: viz.data.map(d => d.value),
  });

  const indicator = blessed.box({
    parent: container,
    bottom: 0,
    left: 1,
    width: '100%-4',
    height: 1,
    content: `▶ [1/${viz.data.length}] ${viz.data[0]?.label}: ${viz.data[0]?.value}`,
    style: { fg: 'yellow' },
  });

  function updateIndicator() {
    const d = viz.data[selectedIndex];
    if (d) {
      indicator.setContent(`▶ [${selectedIndex + 1}/${viz.data.length}] ${d.label}: ${d.value}`);
      screen.render();
    }
  }

  screen.key(['left', 'h'], () => {
    selectedIndex = Math.max(0, selectedIndex - 1);
    updateIndicator();
  });

  screen.key(['right', 'l'], () => {
    selectedIndex = Math.min(viz.data.length - 1, selectedIndex + 1);
    updateIndicator();
  });

  return {
    widget: container,
    getSelection: () => {
      const d = viz.data[selectedIndex];
      if (!d) return null;
      return {
        type: 'bar',
        label: d.label,
        index: selectedIndex,
        description: `${d.label}: ${d.value}`,
      };
    },
  };
}
