import type { ColorRamp } from '../types.js';

interface ColorSet {
  fill: number;
  stroke: number;
  text: number;
}

const RAMP: Record<ColorRamp, ColorSet> = {
  purple: { fill: 183, stroke: 98,  text: 141 },
  teal:   { fill: 115, stroke: 30,  text: 79  },
  coral:  { fill: 209, stroke: 166, text: 203 },
  pink:   { fill: 211, stroke: 162, text: 175 },
  gray:   { fill: 250, stroke: 240, text: 245 },
  blue:   { fill: 111, stroke: 25,  text: 75  },
  green:  { fill: 114, stroke: 28,  text: 70  },
  amber:  { fill: 220, stroke: 136, text: 214 },
  red:    { fill: 210, stroke: 124, text: 167 },
};

const DEFAULT_RAMP_ORDER: ColorRamp[] = [
  'blue', 'teal', 'coral', 'purple', 'green', 'amber', 'pink', 'red', 'gray',
];

export function colorFg(ramp: ColorRamp): number {
  return RAMP[ramp].text;
}

export function colorBg(ramp: ColorRamp): number {
  return RAMP[ramp].fill;
}

export function colorBorder(ramp: ColorRamp): number {
  return RAMP[ramp].stroke;
}

export function colorForIndex(index: number): ColorRamp {
  return DEFAULT_RAMP_ORDER[index % DEFAULT_RAMP_ORDER.length];
}
