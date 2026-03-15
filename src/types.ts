export type ColorRamp = 'purple' | 'teal' | 'coral' | 'pink' | 'gray' | 'blue' | 'green' | 'amber' | 'red';

export interface TreeNode {
  label: string;
  children?: TreeNode[];
  description?: string;
  color?: ColorRamp;
}

export interface BarChart {
  type: 'bar-chart';
  title: string;
  data: { label: string; value: number; color?: ColorRamp }[];
  xLabel?: string;
  yLabel?: string;
}

export interface LineChart {
  type: 'line-chart';
  title: string;
  series: { name: string; data: number[]; color?: ColorRamp }[];
  labels: string[];
}

export interface FlowDiagram {
  type: 'flow-diagram';
  title: string;
  nodes: { id: string; label: string; description?: string; color?: ColorRamp }[];
  edges: { from: string; to: string; label?: string }[];
}

export interface TreeDiagram {
  type: 'tree';
  title: string;
  data: TreeNode;
}

export interface Table {
  type: 'table';
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface GridDiagram {
  type: 'grid';
  title: string;
  cells: {
    row: number;
    col: number;
    label: string;
    sublabel?: string;
    description?: string;
    color?: ColorRamp;
  }[];
  legend?: { color: ColorRamp; label: string }[];
}

export interface Timeline {
  type: 'timeline';
  title: string;
  lanes: {
    label: string;
    items: {
      id?: string;
      label: string;
      start: number;
      end?: number;
      description?: string;
      color?: ColorRamp;
    }[];
  }[];
  axisLabels?: string[];
}

export interface Heatmap {
  type: 'heatmap';
  title: string;
  xLabels: string[];
  yLabels: string[];
  data: number[][];
  minValue?: number;
  maxValue?: number;
  colorRamp?: ColorRamp;
}

export interface StackedBarChart {
  type: 'stacked-bar-chart';
  title: string;
  categories: string[];
  segments: {
    name: string;
    values: number[];
    color?: ColorRamp;
  }[];
}

export interface SequenceDiagram {
  type: 'sequence-diagram';
  title: string;
  actors: {
    id: string;
    label: string;
    description?: string;
    color?: ColorRamp;
  }[];
  messages: {
    from: string;
    to: string;
    label: string;
    description?: string;
    style?: 'solid' | 'dashed';
    color?: ColorRamp;
  }[];
}

export type Visualization =
  | BarChart | LineChart | FlowDiagram | TreeDiagram | Table | GridDiagram
  | Timeline | Heatmap | StackedBarChart | SequenceDiagram;

export interface UserSelection {
  type: string;
  id?: string;
  label: string;
  description?: string;
  index?: number;
  row?: (string | number)[];
}
