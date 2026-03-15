import React from 'react';
import { Box, Text } from 'ink';
import type { SequenceDiagram } from '../types.js';
import { inkColor } from './theme.js';

interface Props {
  viz: SequenceDiagram;
  focusedIndex: number;
}

export function InkSequenceDiagram({ viz, focusedIndex }: Props) {
  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Actor headers */}
      <Box>
        {viz.actors.map((a, i) => (
          <Box key={a.id} width={18} justifyContent="center">
            <Text color={inkColor(a.color, i)} bold>{'┌' + '─'.repeat(14) + '┐'}</Text>
          </Box>
        ))}
      </Box>
      <Box>
        {viz.actors.map((a, i) => (
          <Box key={a.id} width={18} justifyContent="center">
            <Text color={inkColor(a.color, i)} bold>{'│'}{a.label.padStart(7).padEnd(14)}{'│'}</Text>
          </Box>
        ))}
      </Box>
      <Box>
        {viz.actors.map((a, i) => (
          <Box key={a.id} width={18} justifyContent="center">
            <Text color={inkColor(a.color, i)} bold>{'└' + '─'.repeat(14) + '┘'}</Text>
          </Box>
        ))}
      </Box>
      {/* Lifelines + Messages */}
      {viz.messages.map((msg, mi) => {
        const fromIdx = viz.actors.findIndex(a => a.id === msg.from);
        const toIdx = viz.actors.findIndex(a => a.id === msg.to);
        const focused = mi === focusedIndex;
        const leftIdx = Math.min(fromIdx, toIdx);
        const rightIdx = Math.max(fromIdx, toIdx);
        const goesRight = toIdx > fromIdx;
        const lineChar = msg.style === 'dashed' ? '╌' : '─';

        return (
          <Box key={mi} flexDirection="column">
            {/* Lifeline row */}
            <Box>
              {viz.actors.map((_, ai) => (
                <Box key={ai} width={18} justifyContent="center">
                  <Text color="gray">│</Text>
                </Box>
              ))}
            </Box>
            {/* Arrow row */}
            <Box>
              {viz.actors.map((_, ai) => {
                if (ai === leftIdx) {
                  const span = rightIdx - leftIdx;
                  const arrowWidth = span * 18 - 2;
                  const arrow = goesRight
                    ? lineChar.repeat(arrowWidth - 1) + '▶'
                    : '◀' + lineChar.repeat(arrowWidth - 1);
                  return (
                    <Box key={ai} width={span * 18}>
                      <Text color={focused ? 'yellow' : 'gray'} bold={focused}>
                        {' '}{arrow}{' '}
                      </Text>
                    </Box>
                  );
                }
                if (ai > leftIdx && ai <= rightIdx) return null;
                return (
                  <Box key={ai} width={18} justifyContent="center">
                    <Text color="gray">│</Text>
                  </Box>
                );
              })}
            </Box>
            {/* Label */}
            <Box marginLeft={Math.min(fromIdx, toIdx) * 18 + 2}>
              {focused && <Text color="yellow">▶ </Text>}
              <Text color={focused ? 'yellow' : 'white'} bold={focused}>
                {msg.label}
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
