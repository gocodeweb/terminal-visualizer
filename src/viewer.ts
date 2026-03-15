#!/usr/bin/env node
/**
 * Standalone viewer — runs in its own terminal pane (cmux/tmux split).
 *
 * Kitty-capable terminals: pixel-perfect SVG→PNG rendering with worker-thread
 * pre-rendering for smooth navigation.
 *
 * Other terminals: Ink (React for CLI) text-based fallback.
 */

import * as fs from 'node:fs';
import type { Visualization, UserSelection } from './types.js';
import { supportsKittyGraphics } from './image/kitty-renderer.js';

const args = process.argv.slice(2);
const dataIndex = args.indexOf('--data');
const resultIndex = args.indexOf('--result');

if (dataIndex === -1 || resultIndex === -1) {
  process.stderr.write('Usage: viewer --data <path> --result <path>\n');
  process.exit(1);
}

const dataPath = args[dataIndex + 1];
const resultPath = args[resultIndex + 1];

function writeResult(selection: UserSelection | null) {
  fs.writeFileSync(resultPath, JSON.stringify(selection));
}

try {
  const visualization: Visualization = JSON.parse(
    fs.readFileSync(dataPath, 'utf-8'),
  );

  if (supportsKittyGraphics()) {
    // Pixel-perfect mode: SVG→PNG via Kitty graphics protocol
    const { runKittyViewer } = await import('./tui/kitty-viewer.js');
    runKittyViewer(visualization, writeResult);
  } else {
    // Text-based fallback: Ink (React for CLI)
    const React = (await import('react')).default;
    const { render } = await import('ink');
    const { InkViewer } = await import('./ink/InkViewer.js');

    let hasExited = false;
    const { waitUntilExit } = render(
      React.createElement(InkViewer, {
        viz: visualization,
        onSelect: (selection: UserSelection | null) => {
          if (hasExited) return;
          hasExited = true;
          writeResult(selection);
        },
      }),
      { exitOnCtrlC: false },
    );

    waitUntilExit().then(() => {
      if (!hasExited) writeResult(null);
      process.exit(0);
    });
  }
} catch (err) {
  process.stderr.write(`Viewer error: ${err}\n`);
  writeResult(null);
  process.exit(1);
}
