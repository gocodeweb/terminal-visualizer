#!/bin/bash
# Install terminal-visualizer globally from GitHub
set -e

REPO="https://github.com/gocodeweb/terminal-visualizer.git"
INSTALL_DIR="${TERMINAL_VISUALIZER_HOME:-$HOME/.terminal-visualizer}"

echo "Installing terminal-visualizer to $INSTALL_DIR..."

if [ -d "$INSTALL_DIR" ]; then
  echo "Updating existing installation..."
  git -C "$INSTALL_DIR" pull --ff-only
else
  git clone "$REPO" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
npm install
npm run build
npm prune --production

# Create symlinks in a directory that's on PATH
BIN_DIR="/usr/local/bin"
if [ ! -w "$BIN_DIR" ]; then
  # Fall back to ~/.local/bin (no sudo needed)
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
