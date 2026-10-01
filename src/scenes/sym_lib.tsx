import React from 'react';
import {blink, COL, FONT, PX} from '../theme';

/** semantic tokens (with fallbacks until the paper theme lands) */
const K = COL as unknown as Record<string, string>;
export const T = {
  ink: COL.text,
  sub: COL.sub,
  dim: COL.dim,
  line: K.line ?? COL.dim,
  paper: K.panel ?? COL.bg,
  grey: K.panelDark ?? COL.dim,
  inv: K.inv ?? COL.text,
  invText: K.invText ?? COL.bg,
  red: COL.red,
  act: COL.sym,
};

export const hx = (n: number) => n.toString(16).toUpperCase().padStart(2, '0');
export const popcount = (n: number) => {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>= 1;
  }
  return c;
};

/** typed-out slice of a string */
export const typed = (s: string, f: number, at: number, cps = 0.75) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((f - at) * cps))));

/** appear at `at` with a short 3-flicker */
export const appear = (f: number, at: number) => f >= at && (f - at > 18 || blink(f - at, 6, 4));

/** a visible window [a, b) */
export const during = (f: number, a: number, b: number) => f >= a && f < b;

/** plain SVG text (pixel font, middle baseline) */
export const Tx: React.FC<{x: number; y: number; children: React.ReactNode; size?: number; c?: string; a?: 'start' | 'middle' | 'end'; mono?: boolean; press?: boolean}> = ({
  x,
  y,
  children,
  size = 36,
  c = T.ink,
  a = 'middle',
  mono,
  press,
}) => (
  <text x={x} y={y} textAnchor={a} dominantBaseline="middle" fontFamily={press ? FONT.press : mono ? FONT.pixelMono : FONT.pixel} fontSize={size} fill={c}>
    {children}
  </text>
);

/** framed box (3px ink line). inv = ink block with paper text */
export const Box: React.FC<{x: number; y: number; w: number; h: number; inv?: boolean; red?: boolean; grey?: boolean; thick?: boolean; dash?: boolean}> = ({x, y, w, h, inv, red, grey, thick, dash}) => (
  <rect
    x={x + 1.5}
    y={y + 1.5}
    width={w - 3}
    height={h - 3}
    fill={inv ? (red ? T.red : T.inv) : grey ? T.grey : T.paper}
    stroke={red ? T.red : T.ink}
    strokeWidth={thick ? PX : 3}
    strokeDasharray={dash ? '6 6' : undefined}
    shapeRendering="crispEdges"
  />
);

/** byte / bit cell */
export const BCell: React.FC<{x: number; y: number; w: number; h: number; text?: React.ReactNode; inv?: boolean; red?: boolean; grey?: boolean; empty?: boolean; size?: number}> = ({
  x,
  y,
  w,
  h,
  text,
  inv,
  red,
  grey,
  empty,
  size = 24,
}) => (
  <g>
    {empty ? (
      <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} fill="none" stroke={T.line} strokeWidth={3} strokeDasharray="6 6" shapeRendering="crispEdges" />
    ) : (
      <Box x={x} y={y} w={w} h={h} inv={inv || red} red={red} grey={grey} />
    )}
    {text !== undefined && (
      <Tx x={x + w / 2} y={y + h / 2 + 2} size={size} mono c={inv || red ? T.invText : empty ? T.dim : T.ink}>
        {text}
      </Tx>
    )}
  </g>
);

/** label box with centred text */
export const Badge: React.FC<{x: number; y: number; w: number; h?: number; text: React.ReactNode; size?: number; inv?: boolean; red?: boolean; mono?: boolean}> = ({x, y, w, h = 60, text, size = 36, inv, red, mono}) => (
  <g>
    <Box x={x} y={y} w={w} h={h} inv={inv || red} red={red} />
    <Tx x={x + w / 2} y={y + h / 2 + 2} size={size} mono={mono} c={inv || red ? T.invText : T.ink}>
      {text}
    </Tx>
  </g>
);

/** ✓ / ✗ stamp: ✓ inverted ink, ✗ red */
export const Mark: React.FC<{x: number; y: number; ok: boolean; s?: number}> = ({x, y, ok, s = 48}) => (
  <g>
    <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill={ok ? T.inv : T.red} shapeRendering="crispEdges" />
    <Tx x={x} y={y + 3} size={s >= 48 ? 36 : 24} c={T.invText}>
      {ok ? '✓' : '✗'}
    </Tx>
  </g>
);

/** small speech bubble; (x, y) = tip of the tail */
export const Bubble: React.FC<{x: number; y: number; text: string; red?: boolean; w?: number}> = ({x, y, text, red, w}) => {
  const ww = w ?? Math.max(72, text.length * 26 + 36);
  return (
    <g>
      <Box x={x - ww / 2} y={y - 60} w={ww} h={48} red={red} />
      <rect x={x - 3} y={y - 15} width={PX} height={PX * 2} fill={red ? T.red : T.ink} shapeRendering="crispEdges" />
      <Tx x={x} y={y - 35} size={24} c={red ? T.red : T.ink}>
        {text}
      </Tx>
    </g>
  );
};

/** horizontal ink line */
export const HLine: React.FC<{x1: number; x2: number; y: number; red?: boolean; dash?: boolean; w?: number}> = ({x1, x2, y, red, dash, w = 3}) => (
  <line x1={x1} y1={y} x2={x2} y2={y} stroke={red ? T.red : T.ink} strokeWidth={w} strokeDasharray={dash ? '6 6' : undefined} shapeRendering="crispEdges" />
);
