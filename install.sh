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
npm install --production
npm run build

# Create symlinks in a directory that's on PATH
BIN_DIR="/usr/local/bin"
if [ ! -w "$BIN_DIR" ]; then
  echo "Need sudo to symlink into $BIN_DIR"
  sudo ln -sf "$INSTALL_DIR/build/cli.js" "$BIN_DIR/terminal-visualizer"
  sudo ln -sf "$INSTALL_DIR/build/cli.js" "$BIN_DIR/viz"
else
  ln -sf "$INSTALL_DIR/build/cli.js" "$BIN_DIR/terminal-visualizer"
  ln -sf "$INSTALL_DIR/build/cli.js" "$BIN_DIR/viz"
fi

echo ""
echo "terminal-visualizer installed successfully!"
echo "Run: terminal-visualizer install-skill"
