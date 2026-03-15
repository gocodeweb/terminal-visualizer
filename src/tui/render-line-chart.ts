import blessed from 'blessed';
import contrib from 'blessed-contrib';
import type { LineChart, UserSelection } from '../types.js';
import { colorForIndex } from './theme.js';

export function renderLineChart(
  screen: blessed.Widgets.Screen,
  viz: LineChart,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  let selectedSeries = 0;

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

  const lineColors = ['yellow', 'green', 'red', 'blue', 'magenta', 'cyan', 'white'];

  const lineWidget = contrib.line({
    parent: container,
    top: 1,
    left: 1,
    width: '100%-4',
    height: '100%-4',
    showLegend: true,
    wholeNumbersOnly: false,
  });

  const seriesData = viz.series.map((s, i) => ({
    title: s.name,
    x: viz.labels,
    y: s.data,
    style: { line: lineColors[i % lineColors.length] },
  }));

  lineWidget.setData(seriesData);

  const indicator = blessed.box({
    parent: container,
    bottom: 0,
    left: 1,
    width: '100%-4',
    height: 1,
    content: `▶ Series: ${viz.series[0]?.name}`,
    style: { fg: 'yellow' },
  });

  function updateIndicator() {
    const s = viz.series[selectedSeries];
    if (s) {
      const avg = s.data.reduce((a, b) => a + b, 0) / s.data.length;
      indicator.setContent(
        `▶ [${selectedSeries + 1}/${viz.series.length}] ${s.name} (avg: ${avg.toFixed(1)})`,
      );
      screen.render();
    }
  }

  screen.key(['left', 'h'], () => {
    selectedSeries = Math.max(0, selectedSeries - 1);
    updateIndicator();
  });

  screen.key(['right', 'l'], () => {
    selectedSeries = Math.min(viz.series.length - 1, selectedSeries + 1);
    updateIndicator();
  });

  return {
    widget: container,
    getSelection: () => {
      const s = viz.series[selectedSeries];
      if (!s) return null;
      return {
        type: 'series',
        label: s.name,
        index: selectedSeries,
        description: `Series: ${s.name}`,
      };
    },
  };
}
