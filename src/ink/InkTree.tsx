import React from 'react';
import { Box, Text } from 'ink';
import type { TreeDiagram, TreeNode } from '../types.js';
import { inkColor } from './theme.js';

interface Props {
  viz: TreeDiagram;
  focusedIndex: number;
}

interface FlatNode {
  label: string;
  description?: string;
  depth: number;
  isLast: boolean;
  prefixParts: boolean[]; // which ancestor levels have a continuing line
}

function flatten(node: TreeNode, depth: number, prefixParts: boolean[], isLast: boolean): FlatNode[] {
  const result: FlatNode[] = [{
    label: node.label,
    description: node.description,
    depth,
    isLast,
    prefixParts: [...prefixParts],
  }];
  if (node.children) {
    node.children.forEach((child, i) => {
      const childIsLast = i === node.children!.length - 1;
      result.push(...flatten(child, depth + 1, [...prefixParts, !isLast], childIsLast));
    });
  }
  return result;
}

export function InkTree({ viz, focusedIndex }: Props) {
  const flat = flatten(viz.data, 0, [], true);

  return (
    <Box flexDirection="column" paddingX={1}>
      {flat.map((node, i) => {
        const focused = i === focusedIndex;
        let prefix = '';
        for (let d = 0; d < node.depth; d++) {
          if (d < node.depth - 1) {
            prefix += node.prefixParts[d] ? '│  ' : '   ';
          } else {
            prefix += node.isLast ? '└─ ' : '├─ ';
          }
        }
        return (
          <Box key={i}>
            <Text color="gray">{prefix}</Text>
            {focused && <Text color="yellow">▶ </Text>}
            <Text color={focused ? 'yellow' : 'white'} bold={focused}>
              {node.label}
            </Text>
            {node.description && (
              <Text color="gray" dimColor> ({node.description})</Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
