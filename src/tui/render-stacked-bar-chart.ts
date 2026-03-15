import blessed from 'blessed';
import contrib from 'blessed-contrib';
import type { StackedBarChart, UserSelection } from '../types.js';
import { colorForIndex } from './theme.js';

export function renderStackedBarChart(
  screen: blessed.Widgets.Screen,
  viz: StackedBarChart,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  let selectedCat = 0;
  let selectedSeg = 0;

  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%-1',
    label: ` ${viz.title} `,
    border: { type: 'line' },
    style: { border: { fg: 'cyan' }, label: { fg: 'white', bold: true } },
  });

  const colorNames: Record<string, string> = {
    purple: 'magenta', teal: 'cyan', coral: 'red', pink: 'magenta',
    gray: 'white', blue: 'blue', green: 'green', amber: 'yellow', red: 'red',
  };

  const segColors = viz.segments.map((s, i) => {
    const ramp = s.color || colorForIndex(i);
    return colorNames[ramp] || 'cyan';
  });

  const bar = contrib.bar({
    parent: container,
    top: 1,
    left: 1,
    width: '100%-4',
    height: '100%-6',
    barWidth: Math.max(4, Math.min(10, Math.floor(50 / Math.max(viz.categories.length, 1)))),
    barSpacing: Math.max(2, Math.min(6, Math.floor(24 / Math.max(viz.categories.length, 1)))),
    maxHeight: 9,
    barBgColor: segColors as any,
  }) as any;

  // Build stacked data: for the contrib bar, we show totals per category
  const totals = viz.categories.map((_, ci) =>
    viz.segments.reduce((sum, seg) => sum + (seg.values[ci] || 0), 0),
  );

  bar.setData({
    titles: viz.categories,
    data: totals,
  });

  // Legend
  let legendX = 2;
  for (let i = 0; i < viz.segments.length; i++) {
    const text = `■ ${viz.segments[i].name}`;
    blessed.box({
      parent: container,
      bottom: 2,
      left: legendX,
      width: text.length + 2,
      height: 1,
      content: text,
      style: { fg: segColors[i] },
    });
    legendX += text.length + 3;
  }

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
    const cat = viz.categories[selectedCat] || '';
    const seg = viz.segments[selectedSeg];
    if (!seg) return '';
    const val = seg.values[selectedCat] || 0;
    const total = totals[selectedCat] || 1;
    const pct = ((val / total) * 100).toFixed(1);
    return `▶ [${selectedCat + 1}/${viz.categories.length}] ${cat} → ${seg.name}: ${val} (${pct}%)`;
  }

  function update() {
    indicator.setContent(formatIndicator());
    screen.render();
  }

  screen.key(['right', 'l'], () => {
    selectedCat = Math.min(viz.categories.length - 1, selectedCat + 1);
    update();
  });
  screen.key(['left', 'h'], () => {
    selectedCat = Math.max(0, selectedCat - 1);
    update();
  });
  screen.key(['down', 'j'], () => {
    selectedSeg = Math.min(viz.segments.length - 1, selectedSeg + 1);
    update();
  });
  screen.key(['up', 'k'], () => {
    selectedSeg = Math.max(0, selectedSeg - 1);
    update();
  });

  return {
    widget: container,
    getSelection: () => {
      const cat = viz.categories[selectedCat] || '';
      const seg = viz.segments[selectedSeg];
      if (!seg) return null;
      const val = seg.values[selectedCat] || 0;
      return {
        type: 'segment',
        id: `${cat}:${seg.name}`,
        label: `${seg.name} in ${cat}`,
        description: `${seg.name} in ${cat}: ${val}`,
        index: selectedCat * viz.segments.length + selectedSeg,
      };
    },
  };
}
