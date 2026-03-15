# Terminal Visualizer

Use `terminal-visualizer` CLI to render interactive visualizations. Pipe JSON via Bash:

```bash
terminal-visualizer <<'EOF'
{"type": "bar-chart", "title": "Revenue", "data": [{"label": "Q1", "value": 120, "color": "blue"}]}
EOF
```

See `skill/SKILL.md` for full documentation of all 10 visualization types, color system, and routing logic.

## Install

```bash
npm install -g terminal-visualizer
terminal-visualizer install-skill
```
