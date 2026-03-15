import React from 'react';
import { Box, Text } from 'ink';
import type { StackedBarChart } from '../types.js';
import { inkColor } from './theme.js';

interface Props {
  viz: StackedBarChart;
  focusedIndex: number;
}

export function InkStackedBar({ viz, focusedIndex }: Props) {
  const totals = viz.categories.map((_, ci) =>
    viz.segments.reduce((sum, seg) => sum + (seg.values[ci] || 0), 0),
  );
  const maxTotal = Math.max(...totals, 1);
  const barMaxW = 40;

  return (
    <Box flexDirection="column" paddingX={1}>
      {viz.categories.map((cat, ci) => {
        const focused = ci === focusedIndex;
        const total = totals[ci];
        return (
          <Box key={ci} marginBottom={0}>
            <Box width={10}>
              <Text color={focused ? 'yellow' : 'white'} bold={focused}>
                {cat.padEnd(8)}
              </Text>
            </Box>
            <Box>
              {viz.segments.map((seg, si) => {
                const val = seg.values[ci] || 0;
                const width = Math.max(0, Math.round((val / maxTotal) * barMaxW));
                const color = inkColor(seg.color, si);
                return (
                  <Text key={si} color={color}>{'█'.repeat(width)}</Text>
                );
              })}
              <Text color="gray"> {total}</Text>
            </Box>
            {focused && <Text color="yellow"> ◀</Text>}
          </Box>
        );
      })}
      {/* Legend */}
      <Box marginTop={1}>
        {viz.segments.map((seg, si) => (
          <Box key={si} marginRight={2}>
            <Text color={inkColor(seg.color, si)}>■</Text>
            <Text color="gray"> {seg.name}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
