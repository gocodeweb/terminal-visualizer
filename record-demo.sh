#!/bin/bash
# Record a demo GIF of terminal-visualizer using macOS screen capture.
# Run this in your Ghostty/cmux terminal to capture the pixel-perfect rendering.
#
# Usage: bash record-demo.sh

set -e

SCREENCAST="/tmp/tv-demo.mp4"
GIF_FILE="demo.gif"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TV="$SCRIPT_DIR/build/cli.js"

echo "This will:"
echo "  1. Start a macOS screen recording of this window"
echo "  2. Run 4 visualizations (press q after viewing each)"
echo "  3. Stop recording and convert to GIF"
echo ""
echo "Press Enter to start..."
read

# Get the window ID of the current terminal
WINDOW_ID=$(osascript -e 'tell application "System Events" to get id of first window of (first process whose frontmost is true)' 2>/dev/null || echo "")

# Start screen recording in background
echo "Starting screen recording..."
screencapture -v -C -G "$WINDOW_ID" "$SCREENCAST" &
CAPTURE_PID=$!
sleep 2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Bar Chart — press q when done viewing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 1

$TV <<'EOF'
{"type":"bar-chart","title":"Cloud Revenue by Quarter ($M)","data":[{"label":"Q1 2024","value":120,"color":"blue"},{"label":"Q2 2024","value":185,"color":"teal"},{"label":"Q3 2024","value":210,"color":"green"},{"label":"Q4 2024","value":280,"color":"amber"}]}
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Heatmap — press q when done viewing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 1

$TV <<'EOF'
{"type":"heatmap","title":"Git Commit Activity","xLabels":["6a","9a","12p","3p","6p","9p"],"yLabels":["Mon","Tue","Wed","Thu","Fri"],"data":[[3,12,8,16,6,2],[4,15,20,23,9,5],[6,19,28,18,15,4],[1,11,16,10,4,34],[1,4,5,12,9,5]],"colorRamp":"green"}
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Flow Diagram — press q when done viewing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 1

$TV <<'EOF'
{"type":"flow-diagram","title":"Microservice Architecture","nodes":[{"id":"gw","label":"API Gateway","description":"Routes requests","color":"blue"},{"id":"auth","label":"Auth Service","color":"purple"},{"id":"svc","label":"App Service","color":"teal"},{"id":"db","label":"PostgreSQL","color":"green"},{"id":"cache","label":"Redis","color":"amber"}],"edges":[{"from":"gw","to":"auth","label":"verify"},{"from":"gw","to":"svc","label":"route"},{"from":"svc","to":"db","label":"query"},{"from":"svc","to":"cache","label":"cache"}]}
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Sequence Diagram — press q when done viewing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 1

$TV <<'EOF'
{"type":"sequence-diagram","title":"OAuth2 Login Flow","actors":[{"id":"u","label":"Browser","color":"blue"},{"id":"a","label":"App Server","color":"teal"},{"id":"g","label":"Google Auth","color":"purple"}],"messages":[{"from":"u","to":"a","label":"Click Login"},{"from":"a","to":"g","label":"Redirect /authorize"},{"from":"g","to":"u","label":"Consent screen"},{"from":"u","to":"g","label":"Grant"},{"from":"g","to":"a","label":"Auth code","style":"dashed"},{"from":"a","to":"u","label":"Logged in!"}]}
EOF

sleep 1
echo ""
echo "Recording complete! Stopping capture..."

# Stop screen recording
kill $CAPTURE_PID 2>/dev/null
wait $CAPTURE_PID 2>/dev/null
sleep 2

# Convert MP4 to GIF
echo "Converting to GIF..."
ffmpeg -y -i "$SCREENCAST" \
  -vf "fps=12,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
  -loop 0 "$GIF_FILE" 2>/dev/null

echo "Done! GIF saved to $GIF_FILE ($(du -h "$GIF_FILE" | cut -f1))"
echo "Run: git add demo.gif && git commit -m 'Update demo GIF' && git push"
