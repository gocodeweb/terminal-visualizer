import React from 'react';
import { Box, Text } from 'ink';
import type { Heatmap } from '../types.js';

interface Props {
  viz: Heatmap;
  focusedIndex: number;
}

const HEAT = ['  ', '░░', '▒▒', '▓▓', '██'];

export function InkHeatmap({ viz, focusedIndex }: Props) {
  const cols = viz.xLabels.length;
  const allValues = viz.data.flat();
  const minVal = viz.minValue ?? Math.min(...allValues);
  const maxVal = viz.maxValue ?? Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const rampColors: Record<string, string> = {
    blue: '#5B9BD5', green: '#4EC080', red: '#E06C75',
    amber: '#D4A843', purple: '#B07CD8', teal: '#4EC9B0',
    coral: '#E08070', pink: '#D670A0', gray: '#808080',
  };
  const color = rampColors[viz.colorRamp || 'blue'] || '#5B9BD5';

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Column headers */}
      <Box>
        <Box width={6}><Text> </Text></Box>
        {viz.xLabels.map((label, c) => (
          <Box key={c} width={4}>
            <Text color="cyan" dimColor>{label.padStart(3)}</Text>
          </Box>
        ))}
      </Box>
      {/* Rows */}
      {viz.data.map((row, r) => (
        <Box key={r}>
          <Box width={6}>
            <Text color="cyan">{(viz.yLabels[r] || '').padEnd(5)}</Text>
          </Box>
          {row.map((val, c) => {
            const idx = r * cols + c;
            const focused = idx === focusedIndex;
            const norm = (val - minVal) / range;
            const heatIdx = Math.min(HEAT.length - 1, Math.floor(norm * HEAT.length));
            return (
              <Box key={c} width={4}>
                {focused ? (
                  <Text color="yellow" bold inverse>{String(val).padStart(3)} </Text>
                ) : (
                  <Text color={norm > 0.6 ? color : norm > 0.3 ? 'white' : 'gray'}>
                    {String(val).padStart(3)} </Text>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
