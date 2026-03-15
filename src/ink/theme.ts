import type { ColorRamp } from '../types.js';

/** Map color ramp names to terminal-friendly color strings for Ink */
const INK_COLORS: Record<ColorRamp, string> = {
  blue: '#5B9BD5',
  teal: '#4EC9B0',
  green: '#6BC950',
  amber: '#D4A843',
  red: '#E06C75',
  purple: '#B07CD8',
  coral: '#E08070',
  pink: '#D670A0',
  gray: '#808080',
};

const RAMP_ORDER: ColorRamp[] = [
  'blue', 'teal', 'green', 'purple', 'amber', 'coral', 'pink', 'red', 'gray',
];

export function inkColor(ramp?: ColorRamp, index?: number): string {
  if (ramp) return INK_COLORS[ramp];
  return INK_COLORS[RAMP_ORDER[(index ?? 0) % RAMP_ORDER.length]];
}

export function rampForIndex(index: number): ColorRamp {
  return RAMP_ORDER[index % RAMP_ORDER.length];
}

/** Block characters for bar rendering */
export const BLOCKS = ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];

/** Get a block character for a fractional fill (0-1) */
export function blockChar(fraction: number): string {
  const idx = Math.min(BLOCKS.length - 1, Math.floor(fraction * BLOCKS.length));
  return BLOCKS[idx];
}
