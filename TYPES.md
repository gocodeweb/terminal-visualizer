# Visualization Types Reference

All 10 types supported by `terminal-visualizer`. Every type requires `type` and `title` fields.

## bar-chart
```json
{"type": "bar-chart", "title": "...", "data": [{"label": "Q1", "value": 120, "color": "blue"}]}
```

## line-chart
```json
{"type": "line-chart", "title": "...", "series": [{"name": "Mobile", "data": [100, 150], "color": "blue"}], "labels": ["Jan", "Feb"]}
```

## flow-diagram
```json
{"type": "flow-diagram", "title": "...", "nodes": [{"id": "api", "label": "API", "description": "Routes requests", "color": "blue"}], "edges": [{"from": "api", "to": "db", "label": "query"}]}
```

## tree
```json
{"type": "tree", "title": "...", "data": {"label": "Root", "children": [{"label": "Child A"}, {"label": "Child B", "children": [{"label": "Grandchild"}]}]}}
```

## table
```json
{"type": "table", "title": "...", "headers": ["Name", "Score"], "rows": [["Alice", 95], ["Bob", 87]]}
```

## grid
2D spatial layouts — periodic tables, keyboard maps, game boards.
```json
{"type": "grid", "title": "...", "cells": [{"row": 0, "col": 0, "label": "H", "sublabel": "1", "description": "Hydrogen", "color": "coral"}], "legend": [{"color": "coral", "label": "Nonmetal"}]}
```

## timeline
Gantt-style temporal ranges with parallel lanes.
```json
{"type": "timeline", "title": "...", "lanes": [{"label": "Backend", "items": [{"label": "API", "start": 0, "end": 3, "color": "blue"}]}], "axisLabels": ["W1", "W2", "W3"]}
```

## heatmap
2D intensity matrix with color gradient.
```json
{"type": "heatmap", "title": "...", "xLabels": ["Mon", "Tue"], "yLabels": ["9am", "12pm"], "data": [[5, 12], [8, 3]], "colorRamp": "green"}
```

## stacked-bar-chart
Compositional bars showing segment breakdown.
```json
{"type": "stacked-bar-chart", "title": "...", "categories": ["Q1", "Q2"], "segments": [{"name": "SaaS", "values": [80, 110], "color": "blue"}, {"name": "Services", "values": [40, 55], "color": "teal"}]}
```

## sequence-diagram
Actor-to-actor message flows.
```json
{"type": "sequence-diagram", "title": "...", "actors": [{"id": "client", "label": "Client", "color": "blue"}, {"id": "api", "label": "API", "color": "teal"}], "messages": [{"from": "client", "to": "api", "label": "POST /login"}, {"from": "api", "to": "client", "label": "200 JWT", "style": "dashed"}]}
```
