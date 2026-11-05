import React from 'react';
import {Txt} from '../components/kit';
import {PixelRect, SpriteG, SpriteMap} from '../components/pixel';
import {clamp01, COL, FONT, PX, quant} from '../theme';

/* ====================================================================== */
/* shared drawing idiom: paper, ink, one red. Everything sits on the 6px grid */
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
};

/** element appears at `at` with a short blink */
export const fl = (f: number, at: number) => f >= at && !(f - at < 12 && Math.floor((f - at) / 3) % 2 === 1);
/** stepped progress 0..1 */
export const ramp = (f: number, at: number, dur: number, n = 12) => quant(clamp01((f - at) / dur), n);

export const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}} shapeRendering="crispEdges">
    {children}
  </svg>
);

/** square-cornered box with centred label lines */
export const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label?: React.ReactNode;
  sub?: React.ReactNode;
  inv?: boolean;
  dark?: boolean;
  red?: boolean;
  size?: number;
  subSize?: number;
  b?: number;
  dash?: boolean;
  mono?: boolean;
}> = ({x, y, w, h, label, sub, inv, dark, red, size = 36, subSize = 24, b = 3, dash, mono}) => {
  const stroke = red ? T.red : T.ink;
  const fill = inv ? (red ? T.red : T.inv) : dark ? T.paper2 : T.paper;
  const fg = inv ? T.invText : red ? T.red : T.ink;
  const hasSub = sub !== undefined;
  return (
    <g>
      <rect x={x + b / 2} y={y + b / 2} width={w - b} height={h - b} fill={fill} stroke={stroke} strokeWidth={b} strokeDasharray={dash ? '12 6' : undefined} />
      {label !== undefined && (
        <Txt x={x + w / 2} y={y + h / 2 + (hasSub ? -subSize * 0.62 : 2)} size={size} color={fg} family={mono ? FONT.pixelMono : FONT.pixel}>
          {label}
        </Txt>
      )}
      {hasSub && (
        <Txt x={x + w / 2} y={y + h / 2 + size * 0.62} size={subSize} color={inv ? T.invText : T.sub}>
          {sub}
        </Txt>
      )}
    </g>
  );
};

/** solid or hollow bar growing from x; progress is stepped */
export const Bar: React.FC<{x: number; y: number; w: number; h?: number; t?: number; color?: string; hollow?: boolean}> = ({x, y, w, h = 30, t = 1, color = T.ink, hollow}) => {
  const ww = Math.round((w * clamp01(t)) / PX) * PX;
  if (ww <= 0) return null;
  return hollow ? <rect x={x + 1.5} y={y + 1.5} width={Math.max(ww - 3, 3)} height={h - 3} fill={T.paper} stroke={color} strokeWidth={3} /> : <rect x={x} y={y} width={ww} height={h} fill={color} />;
};

/** labelled horizontal bar: name on the left, value after the bar */
export const BarRow: React.FC<{
  x: number;
  y: number;
  name: string;
  nameW?: number;
  frac: number;
  max?: number;
  value: string;
  t?: number;
  color?: string;
  hollow?: boolean;
  h?: number;
  size?: number;
}> = ({x, y, name, nameW = 300, frac, max = 960, value, t = 1, color = T.ink, hollow, h = 36, size = 24}) => (
  <g>
    <Txt x={x + nameW - 18} y={y + h / 2} size={size} anchor="end" color={T.ink}>
      {name}
    </Txt>
    <Bar x={x + nameW} y={y} w={frac * max} h={h} t={t} color={color} hollow={hollow} />
    {t >= 1 && (
      <Txt x={x + nameW + frac * max + 18} y={y + h / 2} size={size} anchor="start" color={color === T.red ? T.red : T.sub} family={FONT.pixelMono}>
        {value}
      </Txt>
    )}
  </g>
);

/** ruled table; rows appear one after another */
export const Table: React.FC<{
  x: number;
  y: number;
  cols: number[];
  head: string[];
  rows: (string | {t: string; c?: string})[][];
  f: number;
  at: number;
  step?: number;
  rowH?: number;
  size?: number;
  align?: ('start' | 'end')[];
}> = ({x, y, cols, head, rows, f, at, step = 24, rowH = 54, size = 24, align}) => {
  const W = cols.reduce((a, b) => a + b, 0);
  const cx = (i: number) => x + cols.slice(0, i).reduce((a, b) => a + b, 0);
  const anchorOf = (i: number) => align?.[i] ?? (i === 0 ? 'start' : 'end');
  const tx = (i: number) => (anchorOf(i) === 'start' ? cx(i) + 12 : cx(i) + cols[i] - 12);
  return (
    <g>
      {fl(f, at) && (
        <g>
          {head.map((h, i) => (
            <Txt key={i} x={tx(i)} y={y + rowH / 2} size={size} anchor={anchorOf(i)} color={T.dim}>
              {h}
            </Txt>
          ))}
          <rect x={x} y={y + rowH - 3} width={W} height={3} fill={T.ink} />
        </g>
      )}
      {rows.map((r, j) =>
        fl(f, at + 12 + j * step) ? (
          <g key={j}>
            {r.map((c, i) => {
              const cell = typeof c === 'string' ? {t: c} : c;
              return (
                <Txt key={i} x={tx(i)} y={y + rowH * (j + 1.5)} size={size} anchor={anchorOf(i)} color={cell.c ?? T.ink} family={i === 0 ? FONT.pixel : FONT.pixelMono}>
                  {cell.t}
                </Txt>
              );
            })}
            <rect x={x} y={y + rowH * (j + 2) - 3} width={W} height={3} fill={T.line} />
          </g>
        ) : null,
      )}
    </g>
  );
};

/** a character with a speech window beside it */
export const Say: React.FC<{
  who: SpriteMap;
  x: number;
  y: number;
  text: string;
  f: number;
  at: number;
  until?: number;
  w?: number;
  left?: boolean;
  s?: number;
}> = ({who, x, y, text, f, at, until, w = 480, left, s = 6}) => {
  if (f < at || (until !== undefined && f >= until)) return null;
  const lines = text.split('\n');
  const H = lines.length * 36 + 30;
  const n = Math.max(0, Math.floor((f - at) * 0.9));
  let left_n = n;
  const bx = left ? x - w - 12 : x + 10 * s + 12;
  const by = y + 6;
  return (
    <g>
      <SpriteG map={who} x={x} y={y} s={s} screenX={x} />
      <PixelRect x={bx} y={by} w={w} h={H} color={T.ink} fill={T.paper} />
      {lines.map((l, i) => {
        const show = l.slice(0, Math.max(0, left_n));
        left_n -= l.length;
        return (
          <Txt key={i} x={bx + 18} y={by + 33 + i * 36} size={24} anchor="start" color={T.ink}>
            {show}
          </Txt>
        );
      })}
    </g>
  );
};

/** a right-pointing connector with a chunky head */
export const Wire: React.FC<{x0: number; y0: number; x1: number; y1: number; t?: number; color?: string; w?: number; head?: boolean}> = ({x0, y0, x1, y1, t = 1, color = T.ink, w = 3, head = true}) => {
  const tq = clamp01(t);
  if (tq <= 0) return null;
  const xe = x0 + (x1 - x0) * tq;
  const ye = y0 + (y1 - y0) * tq;
  const horiz = Math.abs(x1 - x0) >= Math.abs(y1 - y0);
  return (
    <g>
      {horiz ? <rect x={Math.min(x0, xe)} y={y0 - w / 2} width={Math.abs(xe - x0)} height={w} fill={color} /> : <rect x={x0 - w / 2} y={Math.min(y0, ye)} width={w} height={Math.abs(ye - y0)} fill={color} />}
      {head && tq >= 1 && (horiz ? <rect x={x1 - (x1 > x0 ? 12 : 0)} y={y1 - 6} width={12} height={12} fill={color} /> : <rect x={x1 - 6} y={y1 - (y1 > y0 ? 12 : 0)} width={12} height={12} fill={color} />)}
    </g>
  );
};

/** elbow: horizontal then vertical then horizontal */
export const Elbow: React.FC<{x0: number; y0: number; x1: number; y1: number; mid?: number; color?: string; w?: number}> = ({x0, y0, x1, y1, mid, color = T.ink, w = 3}) => {
  const m = mid ?? (x0 + x1) / 2;
  return (
    <g fill={color}>
      <rect x={Math.min(x0, m)} y={y0 - w / 2} width={Math.abs(m - x0)} height={w} />
      <rect x={m - w / 2} y={Math.min(y0, y1)} width={w} height={Math.abs(y1 - y0) + w / 2} />
      <rect x={Math.min(m, x1)} y={y1 - w / 2} width={Math.abs(x1 - m)} height={w} />
      <rect x={x1 - (x1 > m ? 12 : 0)} y={y1 - 6} width={12} height={12} />
    </g>
  );
};

/** grid of little cells, used for matrices and memory */
export const Cells: React.FC<{
  x: number;
  y: number;
  cols: number;
  rows: number;
  size?: number;
  gap?: number;
  fill?: (i: number, j: number) => string | undefined;
}> = ({x, y, cols, rows, size = 18, gap = 3, fill}) => {
  const out: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const c = fill?.(i, j);
      if (c) out.push(<rect key={`${i}-${j}`} x={x + i * (size + gap)} y={y + j * (size + gap)} width={size} height={size} fill={c} />);
    }
  return <g>{out}</g>;
};

/** a typewriter line for SVG */
export const Line: React.FC<{x: number; y: number; text: string; f: number; at: number; cps?: number; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; mono?: boolean}> = ({x, y, text, f, at, cps = 0.9, size = 24, color = T.ink, anchor = 'start', mono}) => {
  if (f < at) return null;
  return (
    <Txt x={x} y={y} size={size} anchor={anchor} color={color} family={mono ? FONT.pixelMono : FONT.pixel}>
      {text.slice(0, Math.floor((f - at) * cps))}
    </Txt>
  );
};
