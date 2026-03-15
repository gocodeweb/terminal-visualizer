#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';
import { showInteractiveTUI } from './tui/screen.js';
import { generateSVG } from './image/svg-renderer.js';
import { displayImageInTerminal } from './image/terminal-image.js';
import { saveVisualization, listVisualizations } from './utils.js';
import type { Visualization } from './types.js';

const server = new McpServer({
  name: 'terminal-visualizer',
  version: '1.0.0',
});

// --- Zod schemas for visualization types ---

const ColorRampSchema = z.enum([
  'purple', 'teal', 'coral', 'pink', 'gray', 'blue', 'green', 'amber', 'red',
]);

const TreeNodeSchema: z.ZodType<{
  label: string;
  children?: unknown[];
  description?: string;
  color?: string;
}> = z.lazy(() =>
  z.object({
    label: z.string(),
    children: z.array(TreeNodeSchema).optional(),
    description: z.string().optional(),
    color: ColorRampSchema.optional(),
  }),
);

const BarChartSchema = z.object({
  type: z.literal('bar-chart'),
  title: z.string(),
  data: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      color: ColorRampSchema.optional(),
    }),
  ),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

const LineChartSchema = z.object({
  type: z.literal('line-chart'),
  title: z.string(),
  series: z.array(
    z.object({
      name: z.string(),
      data: z.array(z.number()),
      color: ColorRampSchema.optional(),
    }),
  ),
  labels: z.array(z.string()),
});

const FlowDiagramSchema = z.object({
  type: z.literal('flow-diagram'),
  title: z.string(),
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
      color: ColorRampSchema.optional(),
    }),
  ),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string().optional(),
    }),
  ),
});

const TreeDiagramSchema = z.object({
  type: z.literal('tree'),
  title: z.string(),
  data: TreeNodeSchema,
});

const TableSchema = z.object({
  type: z.literal('table'),
  title: z.string(),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.union([z.string(), z.number()]))),
});

const GridDiagramSchema = z.object({
  type: z.literal('grid'),
  title: z.string(),
  cells: z.array(
    z.object({
      row: z.number(),
      col: z.number(),
      label: z.string(),
      sublabel: z.string().optional(),
      description: z.string().optional(),
      color: ColorRampSchema.optional(),
    }),
  ),
  legend: z.array(
    z.object({
      color: ColorRampSchema,
      label: z.string(),
    }),
  ).optional(),
});

const TimelineSchema = z.object({
  type: z.literal('timeline'),
  title: z.string(),
  lanes: z.array(
    z.object({
      label: z.string(),
      items: z.array(
        z.object({
          id: z.string().optional(),
          label: z.string(),
          start: z.number(),
          end: z.number().optional(),
          description: z.string().optional(),
          color: ColorRampSchema.optional(),
        }),
      ),
    }),
  ),
  axisLabels: z.array(z.string()).optional(),
});

const HeatmapSchema = z.object({
  type: z.literal('heatmap'),
  title: z.string(),
  xLabels: z.array(z.string()),
  yLabels: z.array(z.string()),
  data: z.array(z.array(z.number())),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  colorRamp: ColorRampSchema.optional(),
});

const StackedBarChartSchema = z.object({
  type: z.literal('stacked-bar-chart'),
  title: z.string(),
  categories: z.array(z.string()),
  segments: z.array(
    z.object({
      name: z.string(),
      values: z.array(z.number()),
      color: ColorRampSchema.optional(),
    }),
  ),
});

const SequenceDiagramSchema = z.object({
  type: z.literal('sequence-diagram'),
  title: z.string(),
  actors: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
      color: ColorRampSchema.optional(),
    }),
  ),
  messages: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string(),
      description: z.string().optional(),
      style: z.enum(['solid', 'dashed']).optional(),
      color: ColorRampSchema.optional(),
    }),
  ),
});

const VisualizationSchema = z.union([
  BarChartSchema,
  LineChartSchema,
  FlowDiagramSchema,
  TreeDiagramSchema,
  TableSchema,
  GridDiagramSchema,
  TimelineSchema,
  HeatmapSchema,
  StackedBarChartSchema,
  SequenceDiagramSchema,
]);

// --- Tool 1: visualize ---

server.registerTool(
  'visualize',
  {
    title: 'Visualize',
    description:
      'Render an interactive visualization in the terminal. Supports bar charts, line charts, flow diagrams, trees, and tables. When interactive, opens a TUI overlay where the user can navigate and select elements.',
    inputSchema: z.object({
      visualization: VisualizationSchema.describe(
        'The visualization data to render',
      ),
      interactive: z
        .boolean()
        .default(true)
        .describe(
          'If true, opens an interactive TUI. If false, renders as a static image.',
        ),
    }),
  },
  async ({ visualization, interactive }) => {
    try {
      if (interactive) {
        const selection = await showInteractiveTUI(
          visualization as Visualization,
        );

        if (selection) {
          const parts = [
            `User selected ${selection.type}: "${selection.label}"`,
          ];
          if (selection.id) parts.push(`(id: ${selection.id})`);
          if (selection.index !== undefined)
            parts.push(`(index: ${selection.index})`);
          parts.push(
            `Description: ${selection.description || selection.label}. They want to explore this further.`,
          );

          return {
            content: [{ type: 'text' as const, text: parts.join(' ') }],
          };
        } else {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'User viewed the visualization and closed it without selecting an element.',
              },
            ],
          };
        }
      } else {
        // Static mode
        const svgString = generateSVG(visualization as Visualization);
        let displayResult = '';

        try {
          const { svgToPng } = await import('./image/kitty-renderer.js');
          const pngBuffer = svgToPng(svgString);
          displayResult = await displayImageInTerminal(pngBuffer);
        } catch {
          // resvg not available — save SVG directly
          const fs = await import('node:fs');
          const path = await import('node:path');
          const { getVisualizationsDir } = await import('./utils.js');
          const dir = getVisualizationsDir();
          const safeName = visualization.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 40);
          const svgPath = path.join(dir, `${safeName}.svg`);
          fs.writeFileSync(svgPath, svgString);
          displayResult = `SVG saved to: ${svgPath}`;
        }

        saveVisualization(visualization, visualization.title);

        return {
          content: [
            {
              type: 'text' as const,
              text: `Displayed static visualization: "${visualization.title}". ${displayResult}`,
            },
          ],
        };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Visualization error:', msg);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error rendering visualization: ${msg}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// --- Tool 2: list_visualizations ---

server.registerTool(
  'list_visualizations',
  {
    title: 'List Visualizations',
    description: 'List previously saved visualizations.',
    inputSchema: z.object({}),
  },
  async () => {
    const vizList = listVisualizations();
    if (vizList.length === 0) {
      return {
        content: [
          { type: 'text' as const, text: 'No saved visualizations found.' },
        ],
      };
    }

    const lines = vizList.map((v, i) => {
      const date = v.mtime.toISOString().split('T')[0];
      const time = v.mtime.toISOString().split('T')[1]?.slice(0, 5);
      return `${i + 1}. ${v.name} (${date} ${time})`;
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Saved visualizations:\n${lines.join('\n')}`,
        },
      ],
    };
  },
);

// --- Start server ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('terminal-visualizer MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
