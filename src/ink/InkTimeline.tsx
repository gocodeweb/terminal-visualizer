import React from 'react';
import { Box, Text } from 'ink';
import type { Timeline } from '../types.js';
import { inkColor } from './theme.js';

interface Props {
  viz: Timeline;
  focusedIndex: number;
}

export function InkTimeline({ viz, focusedIndex }: Props) {
  let minT = Infinity, maxT = -Infinity;
  for (const lane of viz.lanes) for (const item of lane.items) {
    minT = Math.min(minT, item.start);
    maxT = Math.max(maxT, item.end ?? item.start);
  }
  if (!isFinite(minT)) { minT = 0; maxT = 10; }
  const range = maxT - minT || 1;
  const trackW = 50;

  let globalIdx = 0;

  return (
    <Box flexDirection="column" paddingX={1}>
      {viz.lanes.map((lane, li) => {
        const items = lane.items.map(item => {
          const idx = globalIdx++;
          const focused = idx === focusedIndex;
          const startX = Math.round(((item.start - minT) / range) * trackW);
          const endX = item.end !== undefined
            ? Math.round(((item.end - minT) / range) * trackW)
            : startX + 1;
          const barW = Math.max(1, endX - startX);
          const color = inkColor(item.color, li);
          return { item, idx, focused, startX, barW, color };
        });

        return (
          <Box key={li} marginBottom={1}>
            <Box width={12}>
              <Text color="cyan" bold>{lane.label}</Text>
            </Box>
            <Box flexDirection="column">
              {/* Track */}
              <Box>
                <Text color="gray">{'░'.repeat(trackW)}</Text>
              </Box>
              {/* Items overlaid */}
              {items.map(({ item, idx, focused, startX, barW, color }) => (
                <Box key={idx} marginTop={-1}>
                  <Text>{'  '.repeat(Math.floor(startX / 2))}</Text>
                  {focused && <Text color="yellow">▶</Text>}
                  <Text color={focused ? 'yellow' : color} bold={focused}>
                    {'█'.repeat(barW)}
                  </Text>
                  <Text color={focused ? 'yellow' : 'white'}> {item.label}</Text>
                </Box>
              ))}
            </Box>
          </Box>
        );
      })}
      {/* Axis labels */}
      {viz.axisLabels && (
        <Box marginLeft={12}>
          <Text color="gray">
            {viz.axisLabels[0]?.padEnd(trackW / 2)}
            {viz.axisLabels[viz.axisLabels.length - 1]}
          </Text>
        </Box>
      )}
    </Box>
  );
}
