---
name: terminal-visualizer
description: Render interactive terminal visualizations. Only trigger when the user's prompt contains a "visual" keyword — visualize, visualization, visualizing, visual, visually (e.g. "Visualize our API architecture", "Create a visualization of revenue"). Do NOT trigger on unrelated words like "chart", "diagram", "compare", or "show".
---

# Terminal Visualizer

## Prerequisites

Requires `terminal-visualizer` CLI installed globally:

```bash
npm install -g terminal-visualizer
```

## When to Use

Only use `terminal-visualizer` when the user's prompt contains a **"visual"** keyword:
visualize, visualization, visualizing, visual, visually.
Do NOT trigger on generic words like "chart", "diagram", "compare", or "show".

## How to Invoke

Pipe JSON to the CLI via the Bash tool. Use a heredoc for safe JSON passing:

```bash
terminal-visualizer <<'EOF'
{
  "type": "bar-chart",
  "title": "Revenue by Quarter",
  "data": [
    { "label": "Q1", "value": 120, "color": "blue" },
    { "label": "Q2", "value": 180, "color": "green" }
  ]
}
EOF
```

The CLI opens an interactive viewer in a split pane. The user navigates with arrow keys, selects with Enter, or quits with q. The selection is returned as text in the Bash output — use it to generate follow-up visualizations.

## Visualization Types

### bar-chart
```json
{"type": "bar-chart", "title": "...", "data": [{"label": "Q1", "value": 120, "color": "blue"}]}
```

### line-chart
```json
{"type": "line-chart", "title": "...", "series": [{"name": "Mobile", "data": [100, 150], "color": "blue"}], "labels": ["Jan", "Feb"]}
```

### flow-diagram
```json
{"type": "flow-diagram", "title": "...", "nodes": [{"id": "api", "label": "API", "description": "Routes requests", "color": "blue"}], "edges": [{"from": "api", "to": "db", "label": "query"}]}
```

### tree
```json
{"type": "tree", "title": "...", "data": {"label": "Root", "children": [{"label": "Child A"}, {"label": "Child B", "children": [{"label": "Grandchild"}]}]}}
```

### table
```json
{"type": "table", "title": "...", "headers": ["Name", "Score"], "rows": [["Alice", 95], ["Bob", 87]]}
```

### grid
2D spatial layouts — periodic tables, keyboard maps, game boards.
```json
{"type": "grid", "title": "...", "cells": [{"row": 0, "col": 0, "label": "H", "sublabel": "1", "description": "Hydrogen", "color": "coral"}], "legend": [{"color": "coral", "label": "Nonmetal"}]}
```

### timeline
Gantt-style temporal ranges with parallel lanes.
```json
{"type": "timeline", "title": "...", "lanes": [{"label": "Backend", "items": [{"label": "API", "start": 0, "end": 3, "color": "blue"}]}], "axisLabels": ["W1", "W2", "W3"]}
```

### heatmap
2D intensity matrix with color gradient.
```json
{"type": "heatmap", "title": "...", "xLabels": ["Mon", "Tue"], "yLabels": ["9am", "12pm"], "data": [[5, 12], [8, 3]], "colorRamp": "green"}
```

### stacked-bar-chart
Compositional bars showing segment breakdown.
```json
{"type": "stacked-bar-chart", "title": "...", "categories": ["Q1", "Q2"], "segments": [{"name": "SaaS", "values": [80, 110], "color": "blue"}, {"name": "Services", "values": [40, 55], "color": "teal"}]}
```

### sequence-diagram
Actor-to-actor message flows.
```json
{"type": "sequence-diagram", "title": "...", "actors": [{"id": "client", "label": "Client", "color": "blue"}, {"id": "api", "label": "API", "color": "teal"}], "messages": [{"from": "client", "to": "api", "label": "POST /login"}, {"from": "api", "to": "client", "label": "200 JWT", "style": "dashed"}]}
```

## Color Ramps

`purple`, `teal`, `coral`, `pink`, `gray`, `blue`, `green`, `amber`, `red`

Assign by meaning: blue=info, green=success, amber=warning, red=danger, purple=primary, teal=secondary.

## Routing Logic

| Request Pattern | Type |
|---|---|
| "Visualize how X works" | flow-diagram |
| "Visualize components of..." | tree |
| "Visualize X vs Y" | table |
| "Visualize the data/stats" | bar-chart or line-chart |
| "Visualize the architecture" | flow-diagram |
| "Visualize the timeline" | timeline |
| "Visualize activity" | heatmap |
| "Visualize breakdown by group" | stacked-bar-chart |
| "Visualize the message flow" | sequence-diagram |
| "Visualize the periodic table" | grid |

## Guidelines

- Keep labels short (1-3 words)
- Flow diagrams: max 8-10 nodes
- Charts: round numbers
- Tables: max 8-10 columns
- Use 2-3 colors per visualization
