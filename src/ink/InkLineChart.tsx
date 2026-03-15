import React from 'react';
import { Box, Text } from 'ink';
import type { LineChart } from '../types.js';
import { inkColor } from './theme.js';

interface Props {
  viz: LineChart;
  focusedIndex: number;
}

const SPARK = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function sparkline(data: number[], width: number): string {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  // Resample to fit width
  const result: string[] = [];
  for (let i = 0; i < width; i++) {
    const di = Math.floor((i / width) * data.length);
    const norm = (data[di] - min) / range;
    const idx = Math.min(SPARK.length - 1, Math.floor(norm * SPARK.length));
    result.push(SPARK[idx]);
  }
  return result.join('');
}

export function InkLineChart({ viz, focusedIndex }: Props) {
  const sparkWidth = 40;

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Legend + sparklines */}
      {viz.series.map((s, i) => {
        const color = inkColor(s.color, i);
        const focused = i === focusedIndex;
        const avg = s.data.reduce((a, b) => a + b, 0) / s.data.length;
        const max = Math.max(...s.data);
        const min = Math.min(...s.data);
        return (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Box>
              {focused && <Text color="yellow">▶ </Text>}
              {!focused && <Text>  </Text>}
              <Text color={color} bold={focused}>{s.name}</Text>
              <Text color="gray"> avg:{avg.toFixed(0)} min:{min} max:{max}</Text>
            </Box>
            <Box marginLeft={2}>
              <Text color={color}>{sparkline(s.data, sparkWidth)}</Text>
            </Box>
          </Box>
        );
      })}
      {/* X-axis labels */}
      <Box marginLeft={2}>
        <Text color="gray">
          {viz.labels[0]?.padEnd(sparkWidth / 2)}
          {viz.labels[viz.labels.length - 1]}
        </Text>
      </Box>
    </Box>
  );
}
