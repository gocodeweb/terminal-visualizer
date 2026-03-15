# Visualizer MCP Tool

## When to Visualize

Use the `visualize` tool when the user asks for:
diagrams, charts, flowcharts, architecture overviews, comparisons,
data displays, hierarchies, process flows, or when spatial relationships
would explain a concept better than text.

## Tool API

Call `visualize` with a JSON `visualization` object. Always set `interactive: true` when elements are explorable.

### bar-chart

```json
{
  "type": "bar-chart",
  "title": "Revenue by Quarter",
  "data": [
    { "label": "Q1", "value": 120, "color": "blue" },
    { "label": "Q2", "value": 180, "color": "green" },
    { "label": "Q3", "value": 95, "color": "amber" },
    { "label": "Q4", "value": 210, "color": "teal" }
  ]
}
```

### line-chart

```json
{
  "type": "line-chart",
  "title": "Monthly Active Users",
  "series": [
    { "name": "Mobile", "data": [100, 150, 200, 180], "color": "blue" },
    { "name": "Desktop", "data": [80, 90, 110, 120], "color": "teal" }
  ],
  "labels": ["Jan", "Feb", "Mar", "Apr"]
}
```

### flow-diagram

```json
{
  "type": "flow-diagram",
  "title": "System Architecture",
  "nodes": [
    { "id": "api", "label": "API Gateway", "description": "Routes requests", "color": "blue" },
    { "id": "auth", "label": "Auth Service", "description": "Handles auth", "color": "purple" },
    { "id": "db", "label": "Database", "description": "PostgreSQL", "color": "teal" }
  ],
  "edges": [
    { "from": "api", "to": "auth", "label": "verify" },
    { "from": "auth", "to": "db", "label": "query" }
  ]
}
```

### tree

```json
{
  "type": "tree",
  "title": "Project Structure",
  "data": {
    "label": "Root",
    "children": [
      {
        "label": "Frontend",
        "children": [
          { "label": "Components" },
          { "label": "Pages" }
        ]
      },
      {
        "label": "Backend",
        "children": [
          { "label": "API" },
          { "label": "Models" }
        ]
      }
    ]
  }
}
```

### table

```json
{
  "type": "table",
  "title": "Team Comparison",
  "headers": ["Team", "Velocity", "Bugs", "Satisfaction"],
  "rows": [
    ["Alpha", 42, 3, "High"],
    ["Beta", 38, 7, "Medium"],
    ["Gamma", 55, 2, "High"]
  ]
}
```

### grid

Use for 2D spatial layouts — periodic tables, keyboard maps, seating charts, calendars, game boards.

```json
{
  "type": "grid",
  "title": "Periodic Table (Excerpt)",
  "cells": [
    { "row": 0, "col": 0, "label": "H", "sublabel": "1", "description": "Hydrogen", "color": "coral" },
    { "row": 0, "col": 17, "label": "He", "sublabel": "2", "description": "Helium", "color": "purple" },
    { "row": 1, "col": 0, "label": "Li", "sublabel": "3", "description": "Lithium", "color": "red" },
    { "row": 1, "col": 1, "label": "Be", "sublabel": "4", "description": "Beryllium", "color": "amber" }
  ],
  "legend": [
    { "color": "coral", "label": "Nonmetal" },
    { "color": "red", "label": "Alkali Metal" },
    { "color": "amber", "label": "Alkaline Earth" },
    { "color": "purple", "label": "Noble Gas" }
  ]
}
```

### timeline

Use for Gantt-style temporal ranges with parallel lanes.

```json
{
  "type": "timeline",
  "title": "Project Roadmap",
  "lanes": [
    { "label": "Backend", "items": [
      { "label": "API Design", "start": 0, "end": 2, "color": "blue" },
      { "label": "Implementation", "start": 2, "end": 5, "color": "teal" }
    ]},
    { "label": "Frontend", "items": [
      { "label": "Wireframes", "start": 1, "end": 3, "color": "purple" },
      { "label": "UI Build", "start": 3, "end": 6, "color": "green" }
    ]}
  ],
  "axisLabels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
}
```

### heatmap

Use for 2D intensity matrices with color gradient.

```json
{
  "type": "heatmap",
  "title": "Commit Activity by Day",
  "xLabels": ["Mon", "Tue", "Wed", "Thu"],
  "yLabels": ["Week 1", "Week 2", "Week 3"],
  "data": [
    [5, 12, 8, 3],
    [2, 18, 6, 9],
    [7, 4, 15, 11]
  ],
  "colorRamp": "blue"
}
```

### stacked-bar-chart

Use for compositional bars showing segment breakdown.

```json
{
  "type": "stacked-bar-chart",
  "title": "Revenue by Product Line",
  "categories": ["Q1", "Q2", "Q3"],
  "segments": [
    { "name": "SaaS", "values": [80, 110, 130], "color": "blue" },
    { "name": "Services", "values": [40, 55, 45], "color": "teal" },
    { "name": "Licensing", "values": [20, 15, 25], "color": "amber" }
  ]
}
```

### sequence-diagram

Use for actor-to-actor message flows (UML sequence diagram style).

```json
{
  "type": "sequence-diagram",
  "title": "Login Flow",
  "actors": [
    { "id": "client", "label": "Client", "color": "blue" },
    { "id": "api", "label": "API Server", "color": "teal" },
    { "id": "db", "label": "Database", "color": "purple" }
  ],
  "messages": [
    { "from": "client", "to": "api", "label": "POST /login" },
    { "from": "api", "to": "db", "label": "SELECT user", "style": "solid" },
    { "from": "db", "to": "api", "label": "user row", "style": "dashed" },
    { "from": "api", "to": "client", "label": "200 + JWT", "style": "solid" }
  ]
}
```

## Color Ramps (9 available)

`purple`, `teal`, `coral`, `pink`, `gray`, `blue`, `green`, `amber`, `red`

Use 2-3 colors per visualization. Assign by meaning:
- **blue** = info, primary data
- **green** = success, positive
- **amber** = warning, attention
- **red** = danger, error, negative
- **purple** = primary, highlighted
- **teal** = secondary, supporting
- **coral** = accent
- **pink** = accent
- **gray** = neutral, disabled

## Guidelines

- Keep node labels short (1-3 words)
- Flow diagrams: max 8-10 nodes. Decompose larger flows into sub-diagrams
- Charts: round numbers for readability
- Tables: max 8-10 columns
- Always set `interactive: true` when elements are explorable
- Set `interactive: false` for static reference images

## Routing Logic

| Request Pattern           | Visualization Type |
|---------------------------|--------------------|
| "How does X work?"        | flow-diagram       |
| "Components of..."        | tree               |
| "Compare X vs Y"          | table              |
| "Show the data/stats"     | bar-chart or line-chart |
| "Architecture of..."      | flow-diagram       |
| "Breakdown of..."         | tree               |
| "Timeline / trend"        | line-chart         |
| "Distribution / ranking"  | bar-chart          |
| "Periodic table / map"    | grid               |
| "Keyboard layout"         | grid               |
| "Calendar / schedule"     | grid               |
| "Project schedule / Gantt" | timeline           |
| "Activity over time grid" | heatmap            |
| "Composition / breakdown by group" | stacked-bar-chart |
| "Message flow / interactions" | sequence-diagram |

## Interactive TUI

When `interactive: true`, the visualization opens as a full-screen TUI overlay:
- **Arrow keys / hjkl**: Navigate between elements
- **Enter**: Select the focused element (returns selection to you)
- **q / Escape**: Close without selection

The tool result tells you what the user selected so you can generate follow-up visualizations or explanations.

## Rendering Strategy

The TUI renders in a **separate split pane** to avoid conflicts with Claude Code's terminal:

| Environment | Method | How it works |
|-------------|--------|--------------|
| **cmux** (Ghostty) | `cmux new-split right` | Opens viewer in a right split, syncs via `cmux wait-for` |
| **tmux** | `tmux split-window -h` | Opens viewer in a horizontal split, syncs via `tmux wait-for` |
| **Other** | `/dev/tty` overlay | Fallback using alternate screen buffer |

## Rendering Backends

The viewer auto-detects the best rendering backend:

| Terminal | Backend | Quality |
|----------|---------|---------|
| **Ghostty / cmux** | Kitty graphics (SVG→PNG) | Pixel-perfect, HTML/CSS quality |
| **Kitty** | Kitty graphics (SVG→PNG) | Pixel-perfect |
| **WezTerm** | Kitty graphics (SVG→PNG) | Pixel-perfect |
| **iTerm2** | Ink (React for CLI) | Rich text + Unicode |
| **VS Code Terminal** | Ink (React for CLI) | Rich text + Unicode |
| **Terminal.app** | Blessed TUI | ASCII art |
| **Any other** | Blessed TUI | ASCII art |

The Kitty pixel backend renders SVGs to PNGs via `@resvg/resvg-js` and displays them inline using the Kitty graphics protocol. A worker thread pre-renders all frames at startup so navigation between elements is instant.
