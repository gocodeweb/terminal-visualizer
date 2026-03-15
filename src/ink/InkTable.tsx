import React from 'react';
import { Box, Text } from 'ink';
import type { Table } from '../types.js';

interface Props {
  viz: Table;
  focusedIndex: number;
}

export function InkTable({ viz, focusedIndex }: Props) {
  // Calculate column widths
  const colWidths = viz.headers.map((h, i) => {
    const maxData = viz.rows.reduce((max, row) => Math.max(max, String(row[i] ?? '').length), 0);
    return Math.max(h.length, maxData) + 2;
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box>
        {viz.headers.map((h, i) => (
          <Box key={i} width={colWidths[i] + 2}>
            <Text color="cyan" bold>{h}</Text>
          </Box>
        ))}
      </Box>
      <Box>
        <Text color="gray">{'─'.repeat(colWidths.reduce((a, b) => a + b + 2, 0))}</Text>
      </Box>
      {/* Rows */}
      {viz.rows.map((row, ri) => {
        const focused = ri === focusedIndex;
        return (
          <Box key={ri}>
            {focused && <Text color="yellow">▶ </Text>}
            {!focused && <Text>  </Text>}
            {row.map((cell, ci) => (
              <Box key={ci} width={colWidths[ci] + 2}>
                <Text color={focused ? 'yellow' : 'white'} bold={focused}>
                  {String(cell)}
                </Text>
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
