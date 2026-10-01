import React from 'react';
import {clamp01, COL, eInOut, FONT, lerp, snap} from '../theme';
import {KEY, SpriteG, SpriteMap} from '../components/pixel';

/* ====================================================================== */
/* shared helpers for ACT 3 (signatures) — minimal pixel idiom             */
/* semantic tokens only                                                    */
/* ====================================================================== */

export const T = {
  ink: COL.text,
  sub: COL.sub,
  dim: COL.dim,
  line: COL.line,
  inv: COL.inv,
  invText: COL.invText,
  paper: COL.panel,
  paper2: COL.panelDark,
  bg: COL.bg,
  red: COL.red,
  act: COL.sig,
};

/* ---------- deterministic toy hash (FNV-1a 32 + avalanche) for on-screen hex ---------- */
export const th = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return h >>> 0;
};
export const hx = (s: string, n = 4) => th(s).toString(16).padStart(8, '0').slice(0, n);

/** scrambling hex string that settles at `at` */
export const scramble = (target: string, f: number, at: number, seed = 0) => {
  if (f >= at) return target;
  const chars = '0123456789abcdef';
  return target
    .split('')
    .map((_, i) => chars[th(`${seed}-${i}-${Math.floor(f / 3)}`) % 16])
    .join('');
};

/* ---------- modular arithmetic ---------- */
export const md = (a: number, m: number) => ((a % m) + m) % m;
export const mpow = (b: number, e: number, m: number) => {
  let r = 1;
  let x = md(b, m);
  let k = e;
  while (k > 0) {
    if (k & 1) r = (r * x) % m;
    x = (x * x) % m;
    k >>= 1;
  }
  return r;
};
export const minv = (a: number, m: number) => {
  for (let i = 1; i < m; i++) if ((md(a, m) * i) % m === 1) return i;
  return -1;
};
/** Euclid division steps a = q*b + r */
export const euclid = (a: number, b: number) => {
  const out: {a: number; q: number; b: number; r: number}[] = [];
  while (b !== 0) {
    out.push({a, q: Math.floor(a / b), b, r: a % b});
    [a, b] = [b, a % b];
  }
  return out;
};

/* ---------- timing helpers (no opacity fades) ---------- */
/** appear at `at` with a 2-blink flicker */
export const fl = (f: number, at: number) => f >= at && !(f - at < 12 && Math.floor((f - at) / 3) % 2 === 1);
/** visible window [a, b) with flicker in */
export const win = (f: number, a: number, b: number) => fl(f, a) && f < b;
/** stepped eased progress */
export const sp = (f: number, at: number, dur: number, n = 12) => Math.round(eInOut(clamp01((f - at) / dur)) * n) / n;
/** snapped lerp */
export const sl = (a: number, b: number, t: number) => snap(lerp(a, b, t));
/** typewriter slice */
export const tw = (s: string, f: number, at: number, cps = 1) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((f - at) * cps))));

/* ---------- SVG text with sub/superscript via tspans (sizes stay multiples of 12) ---------- */
export const SubT: React.FC<{
  x: number;
  y: number;
  base: string;
  sub?: string;
  sup?: string;
  tail?: string;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  family?: string;
  show?: boolean;
}> = ({x, y, base, sub, sup, tail, size = 36, color = T.ink, anchor = 'middle', family = FONT.pixelMono, show = true}) => {
  if (!show) return null;
  const ss = Math.max(24, Math.round((size * 0.62) / 12) * 12);
  const d = Math.round(size * 0.3);
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontFamily={family} fontSize={size} fill={color}>
      <tspan>{base}</tspan>
      {sub && (
        <tspan fontSize={ss} dy={d}>
          {sub}
        </tspan>
      )}
      {sup && (
        <tspan fontSize={ss} dy={sub ? -2 * d : -d}>
          {sup}
        </tspan>
      )}
      {tail && <tspan dy={sup ? d : sub ? -d : 0}>{tail}</tspan>}
    </text>
  );
};

/** rich SVG formula: segments, '^' prefix = superscript run, '_' prefix = subscript run */
export const Fx: React.FC<{x: number; y: number; parts: (string | [string, string?])[]; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; show?: boolean; n?: number}> = ({
  x,
  y,
  parts,
  size = 36,
  color = T.ink,
  anchor = 'middle',
  show = true,
  n,
}) => {
  if (!show) return null;
  const ss = Math.max(24, Math.round((size * 0.62) / 12) * 12);
  const d = Math.round(size * 0.32);
  let lvl = 0;
  const out: React.ReactNode[] = [];
  const lim = n ?? parts.length;
  parts.slice(0, lim).forEach((p, i) => {
    const txt = typeof p === 'string' ? p : p[0];
    const c = typeof p === 'string' ? undefined : p[1];
    let target = 0;
    let s = txt;
    if (txt.startsWith('^')) {
      target = -1;
      s = txt.slice(1);
    } else if (txt.startsWith('_')) {
      target = 1;
      s = txt.slice(1);
    }
    const dy = (target - lvl) * d;
    lvl = target;
    out.push(
      <tspan key={i} dy={dy} fontSize={target === 0 ? size : ss} fill={c}>
        {s}
      </tspan>,
    );
  });
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={size} fill={color} style={{whiteSpace: 'pre'}}>
      {out}
    </text>
  );
};

/* ---------- SVG chip: square, 3px border, no shadow ---------- */
export const Pill: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  text: React.ReactNode;
  size?: number;
  /** 'line' outlined, 'inv' ink block, 'red' attack, 'ghost' dashed */
  mode?: 'line' | 'inv' | 'red' | 'ghost';
  show?: boolean;
  family?: string;
}> = ({x, y, w, h = 48, text, size = 24, mode = 'line', show = true, family = FONT.pixelMono}) => {
  if (!show) return null;
  const X = snap(x - w / 2);
  const Y = snap(y - h / 2);
  const fill = mode === 'inv' ? T.inv : T.paper;
  const stroke = mode === 'red' ? T.red : mode === 'ghost' ? T.dim : T.ink;
  const tc = mode === 'inv' ? T.invText : mode === 'red' ? T.red : mode === 'ghost' ? T.dim : T.ink;
  return (
    <g shapeRendering="crispEdges">
      <rect x={X} y={Y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={3} strokeDasharray={mode === 'ghost' ? '9 6' : undefined} />
      <text x={X + w / 2} y={Y + h / 2 + 2} textAnchor="middle" dominantBaseline="middle" fontFamily={family} fontSize={size} fill={tc}>
        {text}
      </text>
    </g>
  );
};

/** outlined panel (svg) */
export const Box: React.FC<{x: number; y: number; w: number; h: number; show?: boolean; color?: string; fill?: string; sw?: number; dash?: boolean}> = ({
  x,
  y,
  w,
  h,
  show = true,
  color = T.ink,
  fill = T.paper,
  sw = 3,
  dash,
}) => (show ? <rect x={snap(x)} y={snap(y)} width={snap(w)} height={snap(h)} fill={fill} stroke={color} strokeWidth={sw} strokeDasharray={dash ? '9 6' : undefined} shapeRendering="crispEdges" /> : null);

/* ---------- ✓ / ✗ pixel marks ---------- */
const CHECK: SpriteMap = ['......k', '.....kk', 'k...kk.', 'kk.kk..', '.kkk...', '..k....'];
const CROSS: SpriteMap = ['r....r', 'rr..rr', '.rrrr.', '..rr..', '.rrrr.', 'rr..rr', 'r....r'];
export const Mark: React.FC<{x: number; y: number; ok: boolean; show: boolean; s?: number}> = ({x, y, ok, show, s = 6}) => {
  if (!show) return null;
  const m = ok ? CHECK : CROSS;
  const w = m[0].length * s;
  const h = m.length * s;
  return <SpriteG map={m} x={snap(x - w / 2)} y={snap(y - h / 2)} s={s} colors={{k: T.ink, r: T.red}} accent={T.sub} />;
};

/** key sprite centred at (x,y) */
export const KeyIcon: React.FC<{x: number; y: number; s?: number; show?: boolean}> = ({x, y, s = 6, show = true}) =>
  show ? <SpriteG map={KEY} x={snap(x - 6 * s)} y={snap(y - 3 * s)} s={s} /> : null;

/** horizontal rule */
export const Rule: React.FC<{x0: number; x1: number; y: number; show?: boolean; w?: number; color?: string}> = ({x0, x1, y, show = true, w = 3, color = T.line}) =>
  show ? <rect x={snap(Math.min(x0, x1))} y={snap(y)} width={Math.abs(x1 - x0)} height={w} fill={color} /> : null;

/** HTML superscript / subscript (keeps 24px pixel size) */
export const Sup: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{fontSize: 24, lineHeight: '24px', verticalAlign: '0.7em'}}>{children}</span>;
export const Sb: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{fontSize: 24, lineHeight: '24px', verticalAlign: '-0.25em'}}>{children}</span>;
