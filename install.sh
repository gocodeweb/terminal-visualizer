#!/bin/bash
# Install terminal-visualizer globally from GitHub
# Usage: curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash
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

# Run the repo's own setup (immune to CDN caching of this script)
cd "$INSTALL_DIR"
bash setup.sh
