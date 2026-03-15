#!/bin/bash
# Local setup — called by install.sh after clone/pull
# This file lives in the repo so updates take effect immediately
set -e

INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"

npm install
npm run build
npm prune --omit=dev

# Create symlinks in a directory that's on PATH
BIN_DIR="/usr/local/bin"
if [ ! -w "$BIN_DIR" ]; then
  BIN_DIR="$HOME/.local/bin"
  mkdir -p "$BIN_DIR"
fi
ln -sf "$INSTALL_DIR/build/cli.js" "$BIN_DIR/terminal-visualizer"
ln -sf "$INSTALL_DIR/build/cli.js" "$BIN_DIR/viz"

# Ensure BIN_DIR is on PATH
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  echo ""
  echo "NOTE: Add $BIN_DIR to your PATH:"
  echo "  export PATH=\"$BIN_DIR:\$PATH\""
fi

echo ""
echo "terminal-visualizer installed successfully!"
echo "Run: terminal-visualizer install-skill"
