#!/usr/bin/env node
/**
 * CLI entrypoint for terminal-visualizer.
 *
 * Usage:
 *   terminal-visualizer <<'EOF'
 *   {"type": "heatmap", "title": "...", ...}
 *   EOF
 *
 *   terminal-visualizer --file data.json
 *   terminal-visualizer --static < data.json
 *   terminal-visualizer install-skill
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { showInteractiveTUI } from './tui/screen.js';
import { generateSVG } from './image/svg-renderer.js';
import { displayImageInTerminal } from './image/terminal-image.js';
import type { Visualization } from './types.js';

const VALID_TYPES = [
  'bar-chart', 'line-chart', 'flow-diagram', 'tree', 'table', 'grid',
  'timeline', 'heatmap', 'stacked-bar-chart', 'sequence-diagram',
];

async function main() {
  const args = process.argv.slice(2);

  // Subcommands
  if (args[0] === 'install-skill') {
    return installSkill();
  }
  if (args[0] === '--help' || args[0] === '-h') {
    return printUsage();
  }
  if (args[0] === '--version' || args[0] === '-v') {
    const thisFile = fileURLToPath(import.meta.url);
    const pkgPath = path.resolve(path.dirname(thisFile), '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    console.log(pkg.version);
    return;
  }

  const jsonOutput = args.includes('--json');
  const staticMode = args.includes('--static');
  const fileIdx = args.indexOf('--file');
  const filePath = fileIdx >= 0 ? args[fileIdx + 1] : undefined;

  // Read input
  let input: string;
  if (filePath) {
    input = fs.readFileSync(filePath, 'utf-8');
  } else if (!process.stdin.isTTY) {
    input = await readStdin();
  } else {
    console.error('No input. Pipe JSON via stdin or use --file <path>');
    console.error('Run: terminal-visualizer --help');
    process.exit(1);
  }

  // Parse and validate
  let viz: Visualization;
  try {
    viz = JSON.parse(input);
  } catch {
    console.error('Invalid JSON input');
    process.exit(1);
  }

  if (!viz || typeof viz !== 'object' || !('type' in viz) || !VALID_TYPES.includes((viz as any).type)) {
    console.error(`Invalid visualization type. Must be one of: ${VALID_TYPES.join(', ')}`);
    process.exit(1);
  }

  if (staticMode) {
    // Static mode: render SVG→PNG, display inline
    const svgString = generateSVG(viz);
    try {
      const { svgToPng } = await import('./image/kitty-renderer.js');
      const pngBuffer = svgToPng(svgString);
      const result = await displayImageInTerminal(pngBuffer);
      console.log(`Displayed: "${viz.title}". ${result}`);
    } catch {
      console.error('Could not render image. SVG output:');
      console.log(svgString);
    }
    return;
  }

  // Interactive mode: open viewer in split pane
  const selection = await showInteractiveTUI(viz);

  if (selection) {
    if (jsonOutput) {
      console.log(JSON.stringify(selection));
    } else {
      const parts = [`User selected ${selection.type}: "${selection.label}"`];
      if (selection.id) parts.push(`(id: ${selection.id})`);
      if (selection.index !== undefined) parts.push(`(index: ${selection.index})`);
      parts.push(`Description: ${selection.description || selection.label}. They want to explore this further.`);
      console.log(parts.join(' '));
    }
  } else {
    if (jsonOutput) {
      console.log('null');
    } else {
      console.log('User viewed the visualization and closed it without selecting an element.');
    }
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

function installSkill() {
  const thisFile = fileURLToPath(import.meta.url);
  const skillSrc = path.resolve(path.dirname(thisFile), '..', 'SKILL.md');

  if (!fs.existsSync(skillSrc)) {
    console.error('Skill file not found at:', skillSrc);
    process.exit(1);
  }

  try {
    const installDir = path.resolve(path.dirname(thisFile), '..');
    execSync(`npx skills add "${installDir}" --yes --global`, { stdio: 'inherit' });
  } catch {
    console.error('Failed to install skill via npx skills add');
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
terminal-visualizer — Interactive terminal visualizations for Claude Code

Usage:
  terminal-visualizer <<'EOF'
  {"type": "bar-chart", "title": "Sales", "data": [{"label": "Q1", "value": 100}]}
  EOF

  terminal-visualizer --file data.json
  echo '{"type":"table",...}' | terminal-visualizer
  terminal-visualizer --static < data.json    # render inline image, no interaction
  terminal-visualizer install-skill           # register Claude Code skill

Options:
  --file <path>   Read visualization JSON from a file
  --static        Render as a static image (no interaction)
  --json          Output selection as JSON instead of text
  --help, -h      Show this help
  --version, -v   Show version

Visualization types:
  bar-chart, line-chart, flow-diagram, tree, table, grid,
  timeline, heatmap, stacked-bar-chart, sequence-diagram

Rendering:
  Kitty/Ghostty/WezTerm → pixel-perfect SVG→PNG images
  Other terminals → Ink (React) or blessed text-based fallback
`.trim());
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
