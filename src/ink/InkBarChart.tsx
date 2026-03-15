import React from 'react';
import { Box, Text } from 'ink';
import type { BarChart } from '../types.js';
import { inkColor } from './theme.js';

interface Props {
  viz: BarChart;
  focusedIndex: number;
}

export function InkBarChart({ viz, focusedIndex }: Props) {
  const maxVal = Math.max(...viz.data.map(d => d.value), 1);
  const barMaxWidth = 40;

  return (
    <Box flexDirection="column" paddingX={1}>
      {viz.data.map((d, i) => {
        const width = Math.round((d.value / maxVal) * barMaxWidth);
        const color = inkColor(d.color, i);
        const focused = i === focusedIndex;
        return (
          <Box key={i} marginBottom={0}>
            <Box width={12}>
              <Text color={focused ? 'yellow' : 'white'} bold={focused}>
                {d.label.padEnd(10)}
              </Text>
            </Box>
            <Box>
              <Text color={color}>{'█'.repeat(width)}</Text>
              <Text color="gray"> {d.value}</Text>
            </Box>
            {focused && <Text color="yellow"> ◀</Text>}
          </Box>
        );
      })}
    </Box>
  );
}
