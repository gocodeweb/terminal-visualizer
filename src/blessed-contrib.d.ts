declare module 'blessed-contrib' {
  import { Widgets } from 'blessed';

  interface BarOptions extends Widgets.BoxOptions {
    barWidth?: number;
    barSpacing?: number;
    xOffset?: number;
    maxHeight?: number;
    barBgColor?: string | string[];
  }

  interface BarWidget extends Widgets.BoxElement {
    setData(data: { titles: string[]; data: number[] }): void;
  }

  interface LineOptions extends Widgets.BoxOptions {
    showLegend?: boolean;
    wholeNumbersOnly?: boolean;
    xLabelPadding?: number;
    xPadding?: number;
    style?: Record<string, unknown>;
  }

  interface LineData {
    title: string;
    x: string[];
    y: number[];
    style?: { line?: string };
  }

  interface LineWidget extends Widgets.BoxElement {
    setData(data: LineData[]): void;
  }

  interface TableOptions extends Widgets.BoxOptions {
    keys?: boolean;
    fg?: string;
    selectedFg?: string;
    selectedBg?: string;
    interactive?: boolean;
    columnSpacing?: number;
    columnWidth?: number[];
  }

  interface TableWidget extends Widgets.BoxElement {
    setData(data: { headers: string[]; data: (string | number)[][] }): void;
    rows: Widgets.ListElement;
  }

  interface TreeOptions extends Widgets.BoxOptions {
    fg?: string;
  }

  interface TreeNode {
    extended?: boolean;
    children?: Record<string, TreeNode>;
    name?: string;
    [key: string]: unknown;
  }

  interface TreeWidget extends Widgets.BoxElement {
    setData(data: TreeNode): void;
    rows: Widgets.ListElement;
    on(event: 'select', callback: (node: Record<string, unknown>) => void): this;
    on(event: string, callback: (...args: unknown[]) => void): this;
  }

  export function bar(options?: BarOptions): BarWidget;
  export function line(options?: LineOptions): LineWidget;
  export function table(options?: TableOptions): TableWidget;
  export function tree(options?: TreeOptions): TreeWidget;
}
