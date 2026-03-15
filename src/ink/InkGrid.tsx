import React from 'react';
import { Box, Text } from 'ink';
import type { GridDiagram } from '../types.js';
import { inkColor } from './theme.js';

interface Props {
  viz: GridDiagram;
  focusedIndex: number;
}

export function InkGrid({ viz, focusedIndex }: Props) {
  const maxRow = Math.max(...viz.cells.map(c => c.row), 0);
  const maxCol = Math.max(...viz.cells.map(c => c.col), 0);

  // Build a 2D map for quick lookup
  const cellMap = new Map<string, { cell: typeof viz.cells[0]; idx: number }>();
  viz.cells.forEach((cell, idx) => {
    cellMap.set(`${cell.row},${cell.col}`, { cell, idx });
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      {Array.from({ length: maxRow + 1 }, (_, r) => (
        <Box key={r}>
          {Array.from({ length: maxCol + 1 }, (_, c) => {
            const entry = cellMap.get(`${r},${c}`);
            if (!entry) return <Box key={c} width={6}><Text> </Text></Box>;
            const { cell, idx } = entry;
            const focused = idx === focusedIndex;
            const color = inkColor(cell.color, idx);
            return (
              <Box key={c} width={6}>
                <Text
                  color={focused ? 'yellow' : color}
                  bold={focused}
                  inverse={focused}
                >
                  {(cell.sublabel ? cell.sublabel + ' ' : '').slice(0, 2)}
                  {cell.label.padEnd(3).slice(0, 3)}
                </Text>
                <Text> </Text>
              </Box>
            );
          })}
        </Box>
      ))}
      {/* Legend */}
      {viz.legend && (
        <Box marginTop={1}>
          {viz.legend.map((item, i) => (
            <Box key={i} marginRight={2}>
              <Text color={inkColor(item.color)}>■</Text>
              <Text color="gray"> {item.label}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
