---
name: terminal-visualizer
description: "Render interactive terminal visualizations including bar charts, line charts, flow diagrams, trees, tables, grids, timelines, heatmaps, stacked bar charts, and sequence diagrams. Use when the user's prompt contains a 'visual' keyword — visualize, visualization, visualizing, visual, visually (e.g. 'Visualize our API architecture', 'Create a visualization of revenue'). Do NOT trigger on unrelated words like 'chart', 'diagram', 'compare', or 'show'."
---

# Terminal Visualizer

## When to Use

Only use `terminal-visualizer` when the user's prompt contains a **"visual"** keyword:
visualize, visualization, visualizing, visual, visually.
Do NOT trigger on generic words like "chart", "diagram", "compare", or "show".

## Workflow

1. **Validate prerequisites**: Ensure `terminal-visualizer` is installed (`which terminal-visualizer`). If missing, run `npm install -g terminal-visualizer`.
2. **Build JSON**: Construct a JSON object with required `type` and `title` fields, plus type-specific data. See common types below and [TYPES.md](TYPES.md) for all 10 schemas.
3. **Invoke**: Pipe JSON via heredoc to the CLI through the Bash tool:

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

4. **Handle output**: The CLI opens an interactive split-pane viewer. The user navigates with arrow keys, selects with Enter, or quits with q. The selection is returned as Bash output — use it for follow-up visualizations.
5. **On failure**: If the CLI exits non-zero, check stderr. Fix malformed JSON or missing fields, then retry.

## Common Visualization Types

### bar-chart
```json
{"type": "bar-chart", "title": "...", "data": [{"label": "Q1", "value": 120, "color": "blue"}]}
```

### flow-diagram
```json
{"type": "flow-diagram", "title": "...", "nodes": [{"id": "api", "label": "API", "description": "Routes requests", "color": "blue"}], "edges": [{"from": "api", "to": "db", "label": "query"}]}
```

### table
```json
{"type": "table", "title": "...", "headers": ["Name", "Score"], "rows": [["Alice", 95], ["Bob", 87]]}
```

See [TYPES.md](TYPES.md) for all 10 visualization types with full JSON schemas.

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
