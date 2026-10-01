import React from 'react';
import {SpriteG, SpriteMap} from '../components/pixel';
import {Pt} from '../components/ui';
import {COL, FONT, PX, snap} from '../theme';

/* ---------------- semantic tokens (theme-agnostic) ---------------- */
const CC = COL as unknown as Record<string, string>;
export const K = {
  bg: COL.bg,
  ink: COL.text,
  sub: COL.sub,
  dim: COL.dim,
  line: CC.line ?? COL.dim,
  inv: CC.inv ?? COL.text,
  invText: CC.invText ?? COL.bg,
  red: COL.red,
  panel: COL.panel,
  panel2: COL.panelDark,
  act: COL.pk,
};

/* ---------------- text helpers ---------------- */

const SUP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
  a: 'ᵃ',
  b: 'ᵇ',
  x: 'ˣ',
  k: 'ᵏ',
  e: 'ᵉ',
  n: 'ⁿ',
};
export const sup = (s: string | number) =>
  String(s)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('');
const SUB: Record<string, string> = {'0': '₀', '1': '₁', '2': '₂', '3': '₃', i: 'ᵢ'};
export const sub = (s: string | number) =>
  String(s)
    .split('')
    .map((c) => SUB[c] ?? c)
    .join('');

/** 8-bit appearance: visible from `at`, blinks twice while entering, gone at `out` */
export const showAt = (f: number, at: number, out = 1e9) => f >= at && f < out && !(f - at < 12 && Math.floor((f - at) / 3) % 2 === 1);

/** absolutely positioned pixel text (HTML) with hard black shadow */
export const T: React.FC<{
  f?: number;
  at?: number;
  out?: number;
  x: number;
  y: number;
  w?: number;
  size?: number;
  color?: string;
  font?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({f, at = 0, out, x, y, w, size = 36, color = K.ink, font = FONT.pixel, align = 'left', children, style}) => {
  if (f !== undefined && !showAt(f, at, out)) return null;
  const left = align === 'center' && w ? x - w / 2 : align === 'right' && w ? x - w : x;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top: y,
        width: w,
        textAlign: align,
        fontFamily: font,
        fontSize: size,
        lineHeight: `${size + 12}px`,
        color,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** inline coloured span */
export const H: React.FC<{c: string; children: React.ReactNode}> = ({c, children}) => <span style={{color: c}}>{children}</span>;

/** solid label tag (black text on colour) */
export const Tag: React.FC<{c?: string; fg?: string; children: React.ReactNode; size?: number; style?: React.CSSProperties}> = ({c = K.inv, fg = K.invText, children, size = 24, style}) => (
  <span style={{fontFamily: FONT.pixel, fontSize: size, lineHeight: `${size + 12}px`, color: fg, background: c, padding: '0 12px', whiteSpace: 'nowrap', display: 'inline-block', ...style}}>
    {children}
  </span>
);

/* ---------------- sprites ---------------- */

/** paint jar, A = paint colour */
export const JAR: SpriteMap = [
  '..eeeeee..',
  '.ekkkkkke.',
  '..ewwwwe..',
  '.eAAAAAAe.',
  'eAwAAAAAae',
  'eAwAAAAAae',
  'eAAAAAAAae',
  'eAAAAAAaae',
  '.eaaaaaae.',
  '..eeeeee..',
];

/** sealed envelope / packet, A = colour */
export const ENV: SpriteMap = ['AAAAAAAAAAAA', 'AwwAAAAAAwwA', 'AAwwAAAAwwAA', 'AAAAwwwwAAAA', 'AAAAAyyAAAAA', 'AAAAAAAAAAAA', 'aaaaaaaaaaaa'];

/** certificate */
export const CERT: SpriteMap = ['wwwwwwwwww', 'wkkkkkkkkw', 'wwwwwwwwww', 'wkkkkkwwww', 'wwwwwwwwww', 'wkkkwwwgGw', 'wwwwwwgggw', 'wwwwwwwgww', 'wwwwwwgwgw'];

/** person with a press-start name plate under the feet. (x,y) = top-left of sprite */
export const Person: React.FC<{map: SpriteMap; x: number; y: number; name?: string; accent?: string; s?: number; flip?: boolean; nameColor?: string}> = ({
  map,
  x,
  y,
  name,
  accent = K.act,
  s = PX,
  flip,
  nameColor = K.ink,
}) => {
  const w = map[0].length * s;
  const h = map.length * s;
  return (
    <g>
      <SpriteG map={map} x={x} y={y} s={s} accent={accent} flip={flip} />
      {name && (
        <text x={x + w / 2} y={y + h + 24} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.press} fontSize={16} fill={nameColor}>
          {name}
        </text>
      )}
    </g>
  );
};

/* ---------------- pixel geometry ---------------- */

/** grid cells (top-left corners) of a Bresenham line between two points, snapped to grid g */
export const pixLine = (a: Pt, b: Pt, g = PX): Pt[] => {
  let x0 = Math.round(a[0] / g);
  let y0 = Math.round(a[1] / g);
  const x1 = Math.round(b[0] / g);
  const y1 = Math.round(b[1] / g);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  const out: Pt[] = [];
  for (let n = 0; n < 4000; n++) {
    out.push([x0 * g, y0 * g]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
  return out;
};

/** polyline → contiguous grid cells */
export const pixPoly = (pts: Pt[], g = PX): Pt[] => {
  const out: Pt[] = [];
  for (let i = 1; i < pts.length; i++) {
    const seg = pixLine(pts[i - 1], pts[i], g);
    out.push(...(i === 1 ? seg : seg.slice(1)));
  }
  return out;
};

/** draw cells; `n` = how many to show (for draw-on), `dash` = show k on / k off */
export const Cells: React.FC<{cells: Pt[]; color: string; n?: number; size?: number; dash?: number; shadow?: boolean}> = ({cells, color, n, size = PX, dash, shadow}) => {
  const m = Math.min(cells.length, n ?? cells.length);
  const sel = cells.slice(0, Math.max(0, m)).filter((_, i) => !dash || Math.floor(i / dash) % 2 === 0);
  return (
    <g shapeRendering="crispEdges">
      {shadow && sel.map((c, i) => <rect key={'s' + i} x={c[0] + 3} y={c[1] + 3} width={size} height={size} fill={K.line} />)}
      {sel.map((c, i) => (
        <rect key={i} x={c[0]} y={c[1]} width={size} height={size} fill={color} />
      ))}
    </g>
  );
};

/** stepped position along a polyline (n discrete steps), snapped to the grid */
export const stepAlong = (pts: Pt[], t: number, n = 16): Pt => {
  const tq = Math.round(Math.max(0, Math.min(1, t)) * n) / n;
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const d = tq * L[L.length - 1];
  let i = 1;
  while (i < pts.length - 1 && L[i] < d) i++;
  const s = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
  return [snap(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * s), snap(pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * s)];
};

/** 8-bit sparkle burst (4 arms) around a point, k = 0..1 */
export const Burst: React.FC<{x: number; y: number; k: number; color?: string; r?: number}> = ({x, y, k, color = K.ink, r = 48}) => {
  if (k <= 0 || k >= 1) return null;
  const d = snap(12 + k * r);
  const sz = k < 0.5 ? 12 : 6;
  const pts: Pt[] = [
    [0, -d],
    [d, 0],
    [0, d],
    [-d, 0],
    [d * 0.7, -d * 0.7],
    [-d * 0.7, -d * 0.7],
    [d * 0.7, d * 0.7],
    [-d * 0.7, d * 0.7],
  ];
  return (
    <g shapeRendering="crispEdges">
      {pts.map((p, i) => (
        <rect key={i} x={snap(x + p[0]) - sz / 2} y={snap(y + p[1]) - sz / 2} width={sz} height={sz} fill={i < 4 ? color : K.dim} />
      ))}
    </g>
  );
};

/** raised small letter for exponents with no unicode superscript glyph (e.g. d) */
export const Sup: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{fontSize: 24, verticalAlign: 'top', lineHeight: '24px'}}>{children}</span>;
