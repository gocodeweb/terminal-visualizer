# Terminal Visualizer

MCP server for Claude Code that renders interactive visualizations directly in the terminal. Opens a viewer in a split pane (cmux/tmux) where you can navigate elements and select them — selections feed back to Claude for follow-up exploration.

## Rendering Backends

The viewer auto-detects the best rendering backend for your terminal:

### Pixel-Perfect (Kitty Graphics Protocol)

Renders SVG→PNG images inline using the Kitty graphics protocol. A worker thread pre-renders all frames at startup so navigation is instant.

| Terminal | Support |
|----------|---------|
| **Ghostty** | Full support |
| **cmux** | Full support (Ghostty-based) |
| **Kitty** | Full support (protocol creator) |
| **WezTerm** | Full support |
| **Konsole** (KDE) | Full support |
| **Rio** | Full support |

### Text-Based Fallback (Ink)

React components rendered as rich text with Unicode characters and 256-color support.

| Terminal | Support |
|----------|---------|
| **iTerm2** | Ink (React for CLI) |
| **VS Code Terminal** | Ink (React for CLI) |
| **Alacritty** | Ink (React for CLI) |
| **Hyper** | Ink (React for CLI) |

### Legacy Fallback (Blessed)

For terminals without a split pane multiplexer, falls back to blessed TUI on `/dev/tty`.

## Visualization Types

| Type | Use case | Navigation |
|------|----------|------------|
| **bar-chart** | Distribution, ranking, comparisons | Left/Right between bars |
| **line-chart** | Trends, time series, multi-series data | Left/Right between series |
| **flow-diagram** | Architecture, pipelines, data flows | Arrow keys between nodes |
| **tree** | Hierarchies, component structures, org charts | Up/Down, Enter to expand |
| **table** | Comparisons, data grids, feature matrices | Up/Down between rows |
| **grid** | Periodic tables, keyboard layouts, calendars, game boards | Arrow keys move spatially |
| **timeline** | Gantt charts, project roadmaps, temporal ranges | Left/Right between items, Up/Down between lanes |
| **heatmap** | Commit activity, correlation matrices, intensity grids | Arrow keys move between cells |
| **stacked-bar-chart** | Composition breakdowns, revenue by segment, survey results | Left/Right between categories |
| **sequence-diagram** | Login flows, API interactions, protocol exchanges | Up/Down between messages |

## Install

```bash
git clone https://github.com/gocodeweb/terminal-visualizer.git
cd terminal-visualizer
npm install
npm run build
```

### Register with Claude Code

```bash
claude mcp add terminal-visualizer -- node /path/to/terminal-visualizer/build/index.js
```

## How It Works

1. You ask Claude to visualize something ("show me the architecture", "compare these frameworks")
2. Claude generates structured data and calls the `visualize` tool
3. A viewer opens in a **split pane** beside Claude Code
4. Navigate with arrow keys, select with Enter, quit with q
5. Your selection returns to Claude, which can drill deeper

### Split Pane Support

| Environment | Rendering |
|-------------|-----------|
| **cmux** (Ghostty-based) | `cmux new-split right` — native split pane |
| **tmux** | `tmux split-window -h` — horizontal split |
| **Other terminals** | `/dev/tty` alternate screen buffer fallback |

### Static Mode

Set `interactive: false` to render as an image instead of a TUI:
- **Kitty-capable terminals**: Inline PNG via Kitty protocol
- **iTerm2 / WezTerm**: Inline image via iTerm2 protocol
- **Other**: SVG saved to `visualizations/` directory

## Architecture

```
Claude Code
  ↓ MCP tool call
MCP Server (src/index.ts)
  ↓ spawns split pane
Viewer (src/viewer.ts)
  ↓ auto-detects terminal
  ├── Kitty? → SVG→PNG pixel graphics (src/tui/kitty-viewer.ts)
  │            Worker thread pre-renders all frames
  │            resvg-js for SVG→PNG conversion
  │            Kitty protocol for inline images
  │
  └── Other → Ink React components (src/ink/InkViewer.tsx)
               10 visualization components
               Flexbox layout via Yoga
               256-color + Unicode
```

## Project Structure

```
terminal-visualizer/
├── src/
│   ├── index.ts                  # MCP server — registers tools
│   ├── viewer.ts                 # Viewer entry — Kitty or Ink based on terminal
│   ├── render-worker.ts          # Worker thread for background SVG→PNG rendering
│   ├── types.ts                  # Visualization type definitions
│   ├── utils.ts                  # Terminal detection, file management
│   ├── tui/
│   │   ├── screen.ts             # Split pane orchestration (cmux/tmux/tty)
│   │   ├── kitty-viewer.ts       # Kitty pixel viewer with worker pre-rendering
│   │   ├── render-bar-chart.ts   # Blessed fallback renderers (10 types)
│   │   ├── render-line-chart.ts
│   │   ├── render-table.ts
│   │   ├── render-tree.ts
│   │   ├── render-flow-diagram.ts
│   │   ├── render-grid.ts
│   │   ├── render-timeline.ts
│   │   ├── render-heatmap.ts
│   │   ├── render-stacked-bar-chart.ts
│   │   ├── render-sequence-diagram.ts
│   │   └── theme.ts              # 9-color ramp → ANSI 256
│   ├── ink/
│   │   ├── InkViewer.tsx         # Main Ink app with keyboard navigation
│   │   ├── InkBarChart.tsx       # Ink renderers (10 types)
│   │   ├── InkLineChart.tsx
│   │   ├── InkTable.tsx
│   │   ├── InkTree.tsx
│   │   ├── InkFlowDiagram.tsx
│   │   ├── InkGrid.tsx
│   │   ├── InkTimeline.tsx
│   │   ├── InkHeatmap.tsx
│   │   ├── InkStackedBar.tsx
│   │   ├── InkSequenceDiagram.tsx
│   │   └── theme.ts
│   └── image/
│       ├── svg-renderer.ts       # SVG generation for all 10 types + highlight
│       ├── kitty-renderer.ts     # Kitty protocol + resvg-js SVG→PNG
│       └── terminal-image.ts     # iTerm2/Kitty/Sixel image protocols
├── CLAUDE.md                     # Instructions for Claude (design system)
├── package.json
└── tsconfig.json
```

## Tools

### `visualize`

Renders a visualization. Parameters:
- `visualization` — structured data (see CLAUDE.md for schemas)
- `interactive` — `true` (default) opens interactive viewer, `false` renders static image

### `list_visualizations`

Lists previously saved visualizations from the `visualizations/` directory.

## Design Decisions

- **Structured data, not HTML** — TUI widgets need data, not markup. Structured types map to both SVG images and React/blessed components.
- **Split pane rendering** — MCP's stdin/stdout carry JSON-RPC. Rendering in a separate pane avoids conflicts with Claude Code's terminal.
- **Three-tier rendering** — Kitty pixel graphics (best quality) → Ink React (good quality) → Blessed TUI (basic). Auto-detects the best option.
- **Worker thread pre-rendering** — SVG→PNG takes ~60ms per frame. A worker thread pre-renders all frames at startup so navigation is instant.
- **Selection as tool result** — When the user selects an element, it returns as the MCP tool result. Claude receives it and can generate follow-ups.
- **9-color design system** — Consistent palette across all visualization types.
