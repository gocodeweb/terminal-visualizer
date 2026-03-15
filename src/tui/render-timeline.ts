import blessed from 'blessed';
import type { Timeline, UserSelection } from '../types.js';
import { colorForIndex } from './theme.js';

const LANE_LABEL_W = 14;
const LANE_H = 3;

export function renderTimeline(
  screen: blessed.Widgets.Screen,
  viz: Timeline,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  // Flatten all items for navigation
  const allItems: { laneIdx: number; itemIdx: number; lane: string; item: Timeline['lanes'][0]['items'][0] }[] = [];
  for (let li = 0; li < viz.lanes.length; li++) {
    for (let ii = 0; ii < viz.lanes[li].items.length; ii++) {
      allItems.push({ laneIdx: li, itemIdx: ii, lane: viz.lanes[li].label, item: viz.lanes[li].items[ii] });
    }
  }

  let focusedIndex = 0;

  // Find time range
  let minT = Infinity, maxT = -Infinity;
  for (const lane of viz.lanes) {
    for (const item of lane.items) {
      minT = Math.min(minT, item.start);
      maxT = Math.max(maxT, item.end ?? item.start);
    }
  }
  if (!isFinite(minT)) { minT = 0; maxT = 10; }
  const timeRange = maxT - minT || 1;

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

  const colorNames: Record<string, string> = {
    purple: 'magenta', teal: 'cyan', coral: 'red', pink: 'magenta',
    gray: 'white', blue: 'blue', green: 'green', amber: 'yellow', red: 'red',
  };

  const trackW = 60;
  const itemBoxes: blessed.Widgets.BoxElement[] = [];

  for (let li = 0; li < viz.lanes.length; li++) {
    const lane = viz.lanes[li];
    const y = 1 + li * LANE_H;

    // Lane label
    blessed.box({
      parent: container,
      top: y,
      left: 1,
      width: LANE_LABEL_W,
      height: LANE_H,
      content: `\n ${lane.label}`,
      style: { fg: 'white', bold: true },
    });

    // Track background
    blessed.box({
      parent: container,
      top: y + 1,
      left: LANE_LABEL_W + 1,
      width: trackW,
      height: 1,
      content: '░'.repeat(trackW),
      style: { fg: 'gray' },
    });

    // Items
    for (let ii = 0; ii < lane.items.length; ii++) {
      const item = lane.items[ii];
      const ramp = item.color || colorForIndex(li);
      const startX = Math.floor(((item.start - minT) / timeRange) * (trackW - 1));

      const globalIdx = allItems.findIndex(a => a.laneIdx === li && a.itemIdx === ii);
      const isFocused = globalIdx === focusedIndex;

      if (item.end !== undefined) {
        const endX = Math.floor(((item.end - minT) / timeRange) * (trackW - 1));
        const barLen = Math.max(1, endX - startX);
        const box = blessed.box({
          parent: container,
          top: y + 1,
          left: LANE_LABEL_W + 1 + startX,
          width: barLen,
          height: 1,
          content: '█'.repeat(barLen),
          style: { fg: isFocused ? 'yellow' : (colorNames[ramp] || 'cyan') },
        });
        itemBoxes[globalIdx] = box;
      } else {
        // Milestone
        const box = blessed.box({
          parent: container,
          top: y + 1,
          left: LANE_LABEL_W + 1 + startX,
          width: 1,
          height: 1,
          content: '◆',
          style: { fg: isFocused ? 'yellow' : (colorNames[ramp] || 'cyan') },
        });
        itemBoxes[globalIdx] = box;
      }

      // Label above bar
      if (item.label.length <= trackW) {
        blessed.box({
          parent: container,
          top: y,
          left: LANE_LABEL_W + 1 + startX,
          width: item.label.length + 1,
          height: 1,
          content: item.label,
          style: { fg: isFocused ? 'yellow' : 'white' },
        });
      }
    }
  }

  // Axis labels
  if (viz.axisLabels && viz.axisLabels.length > 0) {
    const axisY = 1 + viz.lanes.length * LANE_H;
    const step = trackW / Math.max(viz.axisLabels.length - 1, 1);
    for (let i = 0; i < viz.axisLabels.length; i++) {
      blessed.box({
        parent: container,
        top: axisY,
        left: LANE_LABEL_W + 1 + Math.floor(i * step),
        width: viz.axisLabels[i].length + 1,
        height: 1,
        content: viz.axisLabels[i],
        style: { fg: 'gray' },
      });
    }
  }

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
    const a = allItems[idx];
    if (!a) return '';
    const dur = a.item.end !== undefined ? ` (${a.item.start}-${a.item.end})` : ` @${a.item.start}`;
    return `▶ ${a.lane}: ${a.item.label}${dur}${a.item.description ? ' - ' + a.item.description : ''}`;
  }

  function updateFocus() {
    for (let i = 0; i < itemBoxes.length; i++) {
      if (!itemBoxes[i]) continue;
      const a = allItems[i];
      const ramp = a.item.color || colorForIndex(a.laneIdx);
      itemBoxes[i].style.fg = i === focusedIndex ? 'yellow' : (colorNames[ramp] || 'cyan');
    }
    indicator.setContent(formatIndicator(focusedIndex));
    const a = allItems[focusedIndex];
    if (a) container.scrollTo(1 + a.laneIdx * LANE_H);
    screen.render();
  }

  screen.key(['down', 'j'], () => {
    if (focusedIndex < allItems.length - 1) { focusedIndex++; updateFocus(); }
  });
  screen.key(['up', 'k'], () => {
    if (focusedIndex > 0) { focusedIndex--; updateFocus(); }
  });
  screen.key(['right', 'l'], () => {
    const cur = allItems[focusedIndex];
    const next = allItems.findIndex((a, i) => i > focusedIndex && a.laneIdx === cur.laneIdx);
    if (next >= 0) { focusedIndex = next; updateFocus(); }
  });
  screen.key(['left', 'h'], () => {
    const cur = allItems[focusedIndex];
    for (let i = focusedIndex - 1; i >= 0; i--) {
      if (allItems[i].laneIdx === cur.laneIdx) { focusedIndex = i; updateFocus(); break; }
    }
  });

  return {
    widget: container,
    getSelection: () => {
      const a = allItems[focusedIndex];
      if (!a) return null;
      return {
        type: 'timeline-item',
        id: a.item.id,
        label: a.item.label,
        description: a.item.description || `${a.lane}: ${a.item.label}`,
        index: focusedIndex,
      };
    },
  };
}
