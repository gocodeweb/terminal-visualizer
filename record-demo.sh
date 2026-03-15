#!/bin/bash
# Record a demo GIF of terminal-visualizer by capturing the current terminal window.
# Run this in your Ghostty/cmux terminal to capture the pixel-perfect rendering.
#
# Usage: bash record-demo.sh

set -e

SCREENCAST="/tmp/tv-demo.mp4"
GIF_FILE="demo.gif"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TV="$SCRIPT_DIR/build/cli.js"

echo "This will:"
echo "  1. Start a screen recording of THIS terminal window"
echo "  2. Run 4 visualizations (press q after viewing each)"
echo "  3. Stop recording and convert to GIF"
echo ""

# Get the terminal window bounds using AppleScript
echo "Detecting terminal window bounds..."
BOUNDS=$(osascript -e '
tell application "System Events"
  set frontApp to first process whose frontmost is true
  set win to first window of frontApp
  set {x, y} to position of win
  set {w, h} to size of win
  return (x as text) & " " & (y as text) & " " & (w as text) & " " & (h as text)
end tell
' 2>/dev/null)

if [ -z "$BOUNDS" ]; then
  echo "ERROR: Could not detect window bounds. Grant Accessibility permission in System Settings."
  exit 1
fi

read WIN_X WIN_Y WIN_W WIN_H <<< "$BOUNDS"

# Retina displays report logical pixels; ffmpeg captures physical pixels (2x)
SCALE=$(osascript -e 'tell application "Finder" to get bounds of window of desktop' 2>/dev/null | head -1 || echo "")
# Assume 2x Retina by default
RETINA=2
CROP_X=$((WIN_X * RETINA))
CROP_Y=$((WIN_Y * RETINA))
CROP_W=$((WIN_W * RETINA))
CROP_H=$((WIN_H * RETINA))

echo "Window: ${WIN_W}x${WIN_H} at (${WIN_X},${WIN_Y}), capture: ${CROP_W}x${CROP_H}"
echo ""
echo "Press Enter to start recording..."
read

# Record full screen, crop to terminal window in post-processing
echo "Starting screen recording..."
ffmpeg -y -f avfoundation -framerate 30 -i "Capture screen 0" \
  -c:v libx264 -preset ultrafast -pix_fmt yuv420p \
  "$SCREENCAST" </dev/null >/dev/null 2>/tmp/tv-ffmpeg.log &
CAPTURE_PID=$!
sleep 2
if ! kill -0 $CAPTURE_PID 2>/dev/null; then
  echo "ERROR: ffmpeg failed to start:"
  cat /tmp/tv-ffmpeg.log
  exit 1
fi
echo "Recording... (PID $CAPTURE_PID)"

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

# Stop ffmpeg
if kill -0 $CAPTURE_PID 2>/dev/null; then
  kill -INT $CAPTURE_PID 2>/dev/null
  for i in $(seq 1 10); do
    kill -0 $CAPTURE_PID 2>/dev/null || break
    sleep 0.5
  done
  # Force kill if still alive
  kill -0 $CAPTURE_PID 2>/dev/null && kill -9 $CAPTURE_PID 2>/dev/null
fi
wait $CAPTURE_PID 2>/dev/null || true
sleep 1

# Convert MP4 to GIF, cropping to the terminal window
if [ -f "$SCREENCAST" ]; then
  echo "Cropping to terminal window and converting to GIF..."
  ffmpeg -y -i "$SCREENCAST" \
    -vf "crop=${CROP_W}:${CROP_H}:${CROP_X}:${CROP_Y},fps=12,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
    -loop 0 "$GIF_FILE" 2>/dev/null
  echo "Done! GIF saved to $GIF_FILE ($(du -h "$GIF_FILE" | cut -f1))"
else
  echo "ERROR: Screen recording failed — no MP4 was created."
  echo "Check /tmp/tv-ffmpeg.log for details."
  echo "You may need to grant Screen Recording permission in System Settings."
fi
