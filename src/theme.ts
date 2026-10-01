import {Easing} from 'remotion';

export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const BEAT = 30;
export const BAR = 120;

/** one "virtual pixel": the whole video is drawn on a 320×180 grid scaled ×6 */
export const PX = 6;
/** animation runs "on threes" (20 updates / s) for the 8-bit feel; see useF() */
export const STEP = 3;

/** Monochrome "paper & ink" palette. Keys are kept from the 16-colour era so sprite maps keep working,
 *  but every entry is now a grey — except `red`, the single accent (attacks / errors). Use COL tokens in scenes. */
export const PAL = {
  black: '#141414',
  navy: '#3a3a38',
  plum: '#2a2a28',
  forest: '#4a4a47',
  brown: '#6b6b67',
  slate: '#8c8c88',
  silver: '#b8b8b3',
  white: '#f6f6f2',
  red: '#c8372d',
  orange: '#6b6b67',
  yellow: '#a5a5a0',
  green: '#2a2a28',
  blue: '#5a5a56',
  lavender: '#a0a09b',
  pink: '#7a7a76',
  peach: '#e2e2dc',
};

const INK = '#141414';
const PAPER = '#f6f6f2';

export const COL = {
  /** page */
  bg: '#e8e8e3',
  panel: PAPER,
  panelDark: '#d6d6d0',
  line: '#c4c4be',
  /** ink */
  text: INK,
  ink: INK,
  sub: '#4a4a47',
  dim: '#8c8c88',
  /** inverted highlight block */
  inv: INK,
  invText: PAPER,
  /** the only accent */
  red: '#c8372d',
  /** legacy semantic names → ink */
  green: INK,
  gold: INK,
  /** chapter colours: all ink (chapters are told apart by number and texture) */
  sym: INK,
  pk: INK,
  sig: INK,
  zk: INK,
  fr: INK,
  intro: INK,
};

/** lighter tone of a colour (fills / secondary strokes) */
export const shade = (c: string) => (c === COL.red ? '#e9b3ad' : c === INK ? '#8c8c88' : '#b8b8b3');

/** fonts: everything is pixel type. Fusion Pixel (12px grid) → use sizes that are multiples of 12 */
export const FONT = {
  sans: '"Fusion Pixel", "Crypto Pixel", monospace',
  serif: '"Fusion Pixel", "Crypto Pixel", monospace',
  mono: '"Fusion Pixel Mono", "Fusion Pixel", "Crypto Pixel", monospace',
  tech: '"Fusion Pixel Mono", "Fusion Pixel", "Crypto Pixel", monospace',
  /** Press Start 2P: Latin caps / digits only, 8px grid → multiples of 8 (16, 24, 32, 48, 64, 96) */
  display: '"Press Start 2P", "Fusion Pixel", "Crypto Pixel", monospace',
  hero: '"Press Start 2P", "Fusion Pixel", "Crypto Pixel", monospace',
  pixel: '"Fusion Pixel", "Crypto Pixel", monospace',
  pixelMono: '"Fusion Pixel Mono", "Fusion Pixel", "Crypto Pixel", monospace',
  press: '"Press Start 2P", "Fusion Pixel", "Crypto Pixel", monospace',
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const eOut = Easing.bezier(0.16, 1, 0.3, 1);
export const eInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const eIn = Easing.bezier(0.7, 0, 0.84, 0);
export const eBack = Easing.bezier(0.34, 1.56, 0.64, 1);
export const eSoft = Easing.bezier(0.33, 1, 0.68, 1);

export const prog = (f: number, start: number, dur: number, e: (t: number) => number = eOut) =>
  e(clamp01((f - start) / dur));

/** snap a coordinate to the virtual pixel grid */
export const snap = (v: number, g = PX) => Math.round(v / g) * g;
/** quantise a 0..1 progress into n discrete steps (stepped / sprite-like motion) */
export const quant = (t: number, n: number) => Math.round(clamp01(t) * n) / n;
/** square-wave blink: true for `on` frames out of every `period` */
export const blink = (f: number, period = 30, on = 18) => ((f % period) + period) % period < on;

export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

/** kept for API compatibility. Alpha is quantised to 0 / 0.25 / 0.5 / 0.75 / 1 so blends stay "dithered-looking" */
export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const q = Math.round(clamp01(a) * 4) / 4;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${q})`;
};

export const mixHex = (a: string, b: string, t: number) => {
  const na = parseInt(a.replace('#', ''), 16);
  const nb = parseInt(b.replace('#', ''), 16);
  const c = (s: number) => Math.round(lerp((na >> s) & 255, (nb >> s) & 255, t));
  return `#${((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1)}`;
};

// piecewise-linear lookup over sorted keyframes
export const keyed = (f: number, keys: [number, number][], e: (t: number) => number = eInOut) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (f <= f1) return lerp(v0, v1, e((f - f0) / (f1 - f0)));
  }
  return keys[keys.length - 1][1];
};

/** 4×4 Bayer matrix, values 0..15 — for ordered-dither fades and block dissolves */
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
