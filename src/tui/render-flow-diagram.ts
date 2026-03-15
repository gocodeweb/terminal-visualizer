import blessed from 'blessed';
import type { FlowDiagram, UserSelection } from '../types.js';
import { colorForIndex } from './theme.js';

interface LayoutNode {
  id: string;
  label: string;
  description?: string;
  color: string;
  layer: number;
  indexInLayer: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

function layoutNodes(viz: FlowDiagram): LayoutNode[] {
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of viz.nodes) {
    adj.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of viz.edges) {
    adj.get(edge.from)?.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
  }

  // Longest-path layering
  const layers = new Map<string, number>();
  const visited = new Set<string>();

  function dfs(nodeId: string): number {
    if (layers.has(nodeId)) return layers.get(nodeId)!;
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    let maxChildLayer = -1;
    for (const child of adj.get(nodeId) || []) {
      maxChildLayer = Math.max(maxChildLayer, dfs(child));
    }

    const layer = maxChildLayer + 1;
    layers.set(nodeId, layer);
    return layer;
  }

  // Start from roots
  const roots = viz.nodes.filter(n => (inDegree.get(n.id) || 0) === 0);
  if (roots.length === 0 && viz.nodes.length > 0) {
    dfs(viz.nodes[0].id);
  }
  for (const root of roots) {
    dfs(root.id);
  }

  // Ensure all nodes have a layer
  for (const node of viz.nodes) {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  }

  // Reverse so roots are on the left (layer 0)
  const maxLayer = Math.max(0, ...layers.values());
  for (const [id, layer] of layers) {
    layers.set(id, maxLayer - layer);
  }

  // Group by layer
  const layerGroups = new Map<number, typeof viz.nodes>();
  for (const node of viz.nodes) {
    const layer = layers.get(node.id) || 0;
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(node);
  }

  // Position nodes
  const nodeWidth = 20;
  const nodeHeight = 5;
  const hGap = 8;
  const vGap = 2;
  const startX = 2;
  const startY = 2;

  const result: LayoutNode[] = [];
  for (const [layer, nodes] of layerGroups) {
    nodes.forEach((node, idx) => {
      const ramp = node.color || colorForIndex(layer);
      result.push({
        id: node.id,
        label: node.label,
        description: node.description,
        color: ramp,
        layer,
        indexInLayer: idx,
        x: startX + layer * (nodeWidth + hGap),
        y: startY + idx * (nodeHeight + vGap),
        width: nodeWidth,
        height: nodeHeight,
      });
    });
  }

  return result;
}

export function renderFlowDiagram(
  screen: blessed.Widgets.Screen,
  viz: FlowDiagram,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  let focusedIndex = 0;
  const nodes = layoutNodes(viz);
  const nodeBoxes: blessed.Widgets.BoxElement[] = [];

  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%-1',
    label: ` ${viz.title} `,
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: '▐', style: { fg: 'cyan' } },
    keys: true,
    mouse: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white', bold: true },
    },
  });

  // Draw edges (behind nodes)
  for (const edge of viz.edges) {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) continue;

    const fromX = fromNode.x + fromNode.width;
    const fromY = fromNode.y + Math.floor(fromNode.height / 2);
    const toX = toNode.x;
    const toY = toNode.y + Math.floor(toNode.height / 2);

    if (fromY === toY) {
      // Same row — horizontal arrow
      const arrowLen = toX - fromX;
      if (arrowLen > 1) {
        let content = '─'.repeat(Math.max(0, arrowLen - 1)) + '▶';
        if (edge.label && arrowLen > edge.label.length + 2) {
          const pad = Math.floor((arrowLen - edge.label.length) / 2);
          content =
            '─'.repeat(Math.max(0, pad - 1)) +
            ` ${edge.label} ` +
            '─'.repeat(Math.max(0, arrowLen - pad - edge.label.length - 2)) +
            '▶';
        }
        blessed.box({
          parent: container,
          top: fromY,
          left: fromX,
          width: arrowLen,
          height: 1,
          content,
          style: { fg: 'gray' },
        });
      }
    } else {
      // Different rows — L-shaped connection
      const midX = fromX + Math.floor((toX - fromX) / 2);

      // Horizontal from source to midpoint
      if (midX > fromX) {
        blessed.box({
          parent: container,
          top: fromY,
          left: fromX,
          width: midX - fromX,
          height: 1,
          content: '─'.repeat(midX - fromX),
          style: { fg: 'gray' },
        });
      }

      // Vertical segment
      const minY = Math.min(fromY, toY);
      const maxY = Math.max(fromY, toY);
      for (let y = minY; y <= maxY; y++) {
        const ch =
          y === minY
            ? fromY < toY
              ? '┐'
              : '└'
            : y === maxY
              ? fromY < toY
                ? '└'
                : '┐'
              : '│';
        blessed.box({
          parent: container,
          top: y,
          left: midX,
          width: 1,
          height: 1,
          content: ch,
          style: { fg: 'gray' },
        });
      }

      // Horizontal from midpoint to target
      if (toX > midX + 1) {
        blessed.box({
          parent: container,
          top: toY,
          left: midX + 1,
          width: toX - midX - 1,
          height: 1,
          content: '─'.repeat(Math.max(0, toX - midX - 2)) + '▶',
          style: { fg: 'gray' },
        });
      }

      // Edge label
      if (edge.label) {
        blessed.box({
          parent: container,
          top: Math.floor((fromY + toY) / 2),
          left: midX + 1,
          width: edge.label.length + 2,
          height: 1,
          content: ` ${edge.label}`,
          style: { fg: 'white' },
        });
      }
    }
  }

  // Draw nodes
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const borderColor = i === focusedIndex ? 'yellow' : 'cyan';

    const box = blessed.box({
      parent: container,
      top: node.y,
      left: node.x,
      width: node.width,
      height: node.height,
      content: `\n  ${node.label}`,
      border: { type: 'line' },
      style: {
        border: { fg: borderColor },
        fg: 'white',
        bold: i === focusedIndex,
      },
    });

    nodeBoxes.push(box);
  }

  function updateFocus() {
    for (let i = 0; i < nodeBoxes.length; i++) {
      nodeBoxes[i].style.border = { fg: i === focusedIndex ? 'yellow' : 'cyan' };
      (nodeBoxes[i].style as Record<string, unknown>).bold = i === focusedIndex;
    }
    const node = nodes[focusedIndex];
    if (node) {
      container.scrollTo(node.y);
    }
    screen.render();
  }

  screen.key(['tab', 'right', 'l'], () => {
    focusedIndex = (focusedIndex + 1) % nodes.length;
    updateFocus();
  });

  screen.key(['S-tab', 'left', 'h'], () => {
    focusedIndex = (focusedIndex - 1 + nodes.length) % nodes.length;
    updateFocus();
  });

  screen.key(['down', 'j'], () => {
    const current = nodes[focusedIndex];
    const sameLayerNext = nodes.findIndex(
      (n, i) => i > focusedIndex && n.layer === current.layer,
    );
    if (sameLayerNext >= 0) {
      focusedIndex = sameLayerNext;
    } else {
      focusedIndex = Math.min(focusedIndex + 1, nodes.length - 1);
    }
    updateFocus();
  });

  screen.key(['up', 'k'], () => {
    const current = nodes[focusedIndex];
    let prev = -1;
    for (let i = focusedIndex - 1; i >= 0; i--) {
      if (nodes[i].layer === current.layer) {
        prev = i;
        break;
      }
    }
    if (prev >= 0) {
      focusedIndex = prev;
    } else {
      focusedIndex = Math.max(focusedIndex - 1, 0);
    }
    updateFocus();
  });

  return {
    widget: container,
    getSelection: () => {
      const node = nodes[focusedIndex];
      if (!node) return null;
      return {
        type: 'node',
        id: node.id,
        label: node.label,
        description: node.description || node.label,
      };
    },
  };
}
