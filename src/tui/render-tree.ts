import blessed from 'blessed';
import contrib from 'blessed-contrib';
import type { TreeDiagram, TreeNode as VizTreeNode, UserSelection } from '../types.js';

interface BlessedTreeNode {
  extended?: boolean;
  children?: Record<string, BlessedTreeNode>;
  name?: string;
  vizLabel?: string;
  vizDescription?: string;
  [key: string]: unknown;
}

function convertTree(node: VizTreeNode): BlessedTreeNode {
  const result: BlessedTreeNode = {
    extended: true,
    vizLabel: node.label,
    vizDescription: node.description,
  };

  if (node.children && node.children.length > 0) {
    result.children = {};
    for (const child of node.children) {
      result.children[child.label] = convertTree(child);
    }
  }

  return result;
}

export function renderTree(
  screen: blessed.Widgets.Screen,
  viz: TreeDiagram,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  let selectedNode: { label: string; description?: string } | null = null;

  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%-1',
    label: ` ${viz.title} `,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white', bold: true },
    },
  });

  const tree = contrib.tree({
    parent: container,
    top: 0,
    left: 0,
    width: '100%-2',
    height: '100%-2',
    fg: 'green',
  });

  const treeData = convertTree(viz.data);
  treeData.name = viz.data.label;
  tree.setData(treeData);

  tree.focus();

  tree.on('select', (node: Record<string, unknown>) => {
    selectedNode = {
      label: (node.vizLabel as string) || (node.name as string) || '',
      description: node.vizDescription as string | undefined,
    };
  });

  return {
    widget: container,
    getSelection: () => {
      if (!selectedNode) return null;
      return {
        type: 'tree-node',
        label: selectedNode.label,
        description: selectedNode.description || selectedNode.label,
      };
    },
  };
}
