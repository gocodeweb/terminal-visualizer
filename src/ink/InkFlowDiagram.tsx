import React from 'react';
import { Box, Text } from 'ink';
import type { FlowDiagram } from '../types.js';
import { inkColor } from './theme.js';

interface Props {
  viz: FlowDiagram;
  focusedIndex: number;
}

export function InkFlowDiagram({ viz, focusedIndex }: Props) {
  // Build adjacency for layout
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  viz.nodes.forEach(n => { adj.set(n.id, []); inDeg.set(n.id, 0); });
  viz.edges.forEach(e => { adj.get(e.from)?.push(e.to); inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1); });

  // Layer assignment
  const layers = new Map<string, number>();
  const visited = new Set<string>();
  function dfs(id: string): number {
    if (layers.has(id)) return layers.get(id)!;
    if (visited.has(id)) return 0;
    visited.add(id);
    let max = -1;
    for (const c of adj.get(id) || []) max = Math.max(max, dfs(c));
    const l = max + 1; layers.set(id, l); return l;
  }
  viz.nodes.forEach(n => dfs(n.id));
  const maxL = Math.max(0, ...layers.values());
  for (const [k, v] of layers) layers.set(k, maxL - v);

  // Group by layer
  const layerGroups = new Map<number, typeof viz.nodes>();
  viz.nodes.forEach(n => {
    const l = layers.get(n.id) || 0;
    if (!layerGroups.has(l)) layerGroups.set(l, []);
    layerGroups.get(l)!.push(n);
  });

  // Flatten for indexing
  const nodeList = [...layerGroups.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([, nodes]) => nodes);

  // Find edges for a node
  function edgesFrom(id: string) {
    return viz.edges.filter(e => e.from === id);
  }

  return (
    <Box flexDirection="row" paddingX={1}>
      {[...layerGroups.entries()].sort(([a], [b]) => a - b).map(([layer, nodes]) => (
        <Box key={layer} flexDirection="column" marginRight={2}>
          {nodes.map(node => {
            const globalIdx = nodeList.indexOf(node);
            const focused = globalIdx === focusedIndex;
            const color = inkColor(node.color, layer);
            const edges = edgesFrom(node.id);
            return (
              <Box key={node.id} flexDirection="row" marginBottom={1}>
                <Box
                  borderStyle={focused ? 'double' : 'single'}
                  borderColor={focused ? 'yellow' : color}
                  paddingX={1}
                  width={20}
                >
                  <Box flexDirection="column">
                    <Text color={focused ? 'yellow' : 'white'} bold={focused}>
                      {node.label}
                    </Text>
                    {node.description && (
                      <Text color="gray" dimColor>{node.description}</Text>
                    )}
                  </Box>
                </Box>
                {edges.length > 0 && (
                  <Box flexDirection="column" justifyContent="center">
                    <Text color="gray">
                      ──▶ <Text dimColor>{edges[0].label || ''}</Text>
                    </Text>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
