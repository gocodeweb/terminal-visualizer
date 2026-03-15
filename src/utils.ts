import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export type ImageProtocol = 'iterm2' | 'kitty' | 'sixel' | 'none';

export function detectImageProtocol(): ImageProtocol {
  const termProgram = process.env.TERM_PROGRAM || '';
  const term = process.env.TERM || '';

  if (termProgram === 'iTerm.app') return 'iterm2';
  if (termProgram === 'WezTerm') return 'iterm2';
  if (termProgram === 'ghostty') return 'kitty';
  if (term === 'xterm-kitty') return 'kitty';
  return 'none';
}

function getProjectRoot(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // build/utils.js -> project root
  return path.resolve(path.dirname(thisFile), '..');
}

export function getVisualizationsDir(): string {
  const dir = path.join(getProjectRoot(), 'visualizations');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function saveVisualization(data: object, title: string): string {
  const dir = getVisualizationsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const filename = `${timestamp}_${safeName}.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

export function listVisualizations(): { name: string; path: string; mtime: Date }[] {
  const dir = getVisualizationsDir();
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const filepath = path.join(dir, f);
      const stat = fs.statSync(filepath);
      return { name: f, path: filepath, mtime: stat.mtime };
    })
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}
