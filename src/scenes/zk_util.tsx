import React from 'react';
import {blink, clamp01, COL, FONT, PX, quant} from '../theme';

/* ---------- modular arithmetic (computed, never hard-coded) ---------- */

export const mod = (a: number, m: number) => ((a % m) + m) % m;
export const mpow = (b: number, e: number, m: number) => {
  let r = 1;
  let x = mod(b, m);
  let k = e;
  while (k > 0) {
    if (k & 1) r = (r * x) % m;
    x = (x * x) % m;
    k >>= 1;
  }
  return r;
};
export const minv = (a: number, m: number) => {
  const x = mod(a, m);
  for (let i = 1; i < m; i++) if ((x * i) % m === 1) return i;
  return 0;
};
/** centred representative in (-m/2, m/2] */
export const cmod = (a: number, m: number) => {
  const r = mod(a, m);
  return r > m / 2 ? r - m : r;
};

/** unicode superscript for small (possibly negative) integers */
const SUP: Record<string, string> = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻'};
export const sup = (n: number | string) =>
  String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('');

/* ---------- stepped appearance helpers (no opacity fades) ---------- */

/** visible in [at, out), blinking twice when it first appears */
export const on = (f: number, at: number, out?: number) => f >= at && (out === undefined || f < out) && (f - at >= 9 || blink(f - at, 6, 3));
/** stepped progress 0..1 */
export const sp = (f: number, at: number, dur: number, n = 8) => quant(clamp01((f - at) / dur), n);
/** snap to the 6px grid */
export const g6 = (v: number) => Math.round(v / PX) * PX;
/** typewriter slice */
export const typed = (s: string, f: number, at: number, cps = 0.9) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((f - at) * cps))));

/* ---------- minimal ink-on-paper pieces ---------- */

/** HTML card: 3px ink frame, paper fill (or inverted) */
export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  title: React.ReactNode;
  desc?: React.ReactNode;
  num?: string;
  inv?: boolean;
}> = ({x, y, w, h, title, desc, num, inv}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      boxSizing: 'border-box',
      border: `3px solid ${COL.text}`,
      background: inv ? COL.inv : COL.panel,
      padding: '12px 24px',
      whiteSpace: 'nowrap',
    }}
  >
    <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
      {num && <span style={{fontFamily: FONT.press, fontSize: 16, color: inv ? COL.invText : COL.dim}}>{num}</span>}
      <span style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: inv ? COL.invText : COL.text}}>{title}</span>
    </div>
    {desc && <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: inv ? COL.invText : COL.sub, marginTop: 6}}>{desc}</div>}
  </div>
);

/** SVG frame */
export const Frame: React.FC<{x: number; y: number; w: number; h: number; inv?: boolean; red?: boolean; dash?: boolean; fill?: string; sw?: number}> = ({x, y, w, h, inv, red, dash, fill, sw = 3}) => (
  <rect
    x={x + sw / 2}
    y={y + sw / 2}
    width={w - sw}
    height={h - sw}
    fill={fill ?? (inv ? COL.inv : COL.panel)}
    stroke={red ? COL.red : COL.text}
    strokeWidth={sw}
    strokeDasharray={dash ? '12 12' : undefined}
  />
);

/** SVG label box with centred text */
export const Tag: React.FC<{x: number; y: number; w: number; h?: number; text: React.ReactNode; size?: number; inv?: boolean; red?: boolean; family?: string}> = ({
  x,
  y,
  w,
  h = 60,
  text,
  size = 36,
  inv,
  red,
  family = FONT.pixel,
}) => (
  <g>
    <Frame x={x} y={y} w={w} h={h} inv={inv} red={red} fill={red && inv ? COL.red : undefined} />
    <text x={x + w / 2} y={y + h / 2 + 2} textAnchor="middle" dominantBaseline="middle" fontFamily={family} fontSize={size} fill={inv ? COL.invText : red ? COL.red : COL.text}>
      {text}
    </text>
  </g>
);

/** SVG speech bubble; tail points down-left to (x, y) */
export const Bubble: React.FC<{x: number; y: number; w: number; text: React.ReactNode; size?: number}> = ({x, y, w, text, size = 36}) => {
  const h = size + 30;
  const bx = g6(x + 12);
  const by = g6(y - h - 18);
  return (
    <g>
      <Frame x={bx} y={by} w={w} h={h} />
      <rect x={bx + 12} y={by + h - 3} width={18} height={6} fill={COL.panel} />
      <rect x={bx + 6} y={by + h} width={6} height={12} fill={COL.text} />
      <rect x={bx} y={by + h + 12} width={6} height={6} fill={COL.text} />
      <rect x={bx + 30} y={by + h - 3} width={6} height={6} fill={COL.text} />
      <text x={bx + w / 2} y={by + h / 2 + 2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixel} fontSize={size} fill={COL.text}>
        {text}
      </text>
    </g>
  );
};

/** ✓ (ink block) / ✗ (red block) badge */
export const Mark: React.FC<{x: number; y: number; ok: boolean; s?: number}> = ({x, y, ok, s = 48}) => (
  <g>
    <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill={ok ? COL.inv : COL.red} />
    <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixel} fontSize={Math.round((s * 0.75) / 12) * 12} fill={COL.invText}>
      {ok ? '✓' : '✗'}
    </text>
  </g>
);
