import React from 'react';
import {clamp01, COL, eBack, FONT, lerp, PAL, PX, quant, rgba, shade} from '../theme';
import {PixelBox} from './pixel';
import {Arrow, bez, Pt} from './ui';

/** index of the last start <= f (or -1) and local progress */
export const stepAt = (f: number, starts: number[]) => {
  let i = -1;
  for (let k = 0; k < starts.length; k++) if (f >= starts[k]) i = k;
  return i;
};

export const popIn = (f: number, at: number, dur = 18) => quant(eBack(clamp01((f - at) / dur)), 4);

export const Txt: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  family?: string;
  opacity?: number;
  glow?: boolean;
  ls?: number;
}> = ({x, y, children, size = 36, color = COL.text, anchor = 'middle', weight = 400, family = FONT.pixel, opacity = 1, glow, ls}) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    fontFamily={family}
    fontWeight={weight}
    fontSize={size}
    fill={color}
    opacity={opacity}
    filter={glow ? 'url(#g-s)' : undefined}
    letterSpacing={ls}
    dominantBaseline="middle"
  >
    {children}
  </text>
);

/** octagonal "pixel circle" node */
const oct = (r: number) => {
  const c = Math.round((r * 0.42) / 3) * 3;
  return `${-r + c},${-r} ${r - c},${-r} ${r},${-r + c} ${r},${r - c} ${r - c},${r} ${-r + c},${r} ${-r},${r - c} ${-r},${-r + c}`;
};

export const GNode: React.FC<{
  x: number;
  y: number;
  r?: number;
  label?: React.ReactNode;
  color: string;
  fill?: number;
  scale?: number;
  opacity?: number;
  size?: number;
  ring?: number;
  sub?: React.ReactNode;
  subColor?: string;
  dark?: boolean;
}> = ({x, y, r = 36, label, color, fill = 0, scale = 1, opacity = 1, size, ring = 0, sub, subColor, dark}) => {
  if (scale <= 0.001 || opacity <= 0.001) return null;
  const sc = quant(scale, 6);
  const solid = fill > 0.5;
  return (
    <g transform={`translate(${x},${y}) scale(${sc})`} opacity={opacity} shapeRendering="crispEdges">
      {ring > 0 && ring < 1 && <polygon points={oct(r + quant(ring, 4) * 36)} fill="none" stroke={color} strokeWidth={PX} opacity={ring < 0.75 ? 1 : 0.5} />}
      <polygon points={oct(r)} fill={solid ? color : fill > 0 ? COL.panelDark : dark ? COL.inv : COL.panel} stroke={color} strokeWidth={3} />
      {label !== undefined && (
        <text y={2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={size ?? Math.round(r / 12) * 12} fill={solid ? COL.invText : dark ? COL.invText : COL.text}>
          {label}
        </text>
      )}
      {sub !== undefined && (
        <text y={r + 30} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={24} fill={subColor ?? COL.sub}>
          {sub}
        </text>
      )}
    </g>
  );
};

export const edgePts = (a: Pt, b: Pt, ra = 32, rb = 32, curve = 0): Pt[] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  if (!curve) return [[a[0] + ux * ra, a[1] + uy * ra], [b[0] - ux * rb, b[1] - uy * rb]];
  const nx = -uy;
  const ny = ux;
  const mx = (a[0] + b[0]) / 2 + nx * curve * L;
  const my = (a[1] + b[1]) / 2 + ny * curve * L;
  const s: Pt = [a[0] + ux * ra, a[1] + uy * ra];
  const e: Pt = [b[0] - ux * rb, b[1] - uy * rb];
  return bez(s, [lerp(s[0], mx, 0.66), lerp(s[1], my, 0.66)], [lerp(e[0], mx, 0.66), lerp(e[1], my, 0.66)], e, 24);
};

export const GEdge: React.FC<{
  a: Pt;
  b: Pt;
  t?: number;
  color: string;
  w?: number;
  dir?: boolean;
  ra?: number;
  rb?: number;
  curve?: number;
  label?: React.ReactNode;
  labelOpacity?: number;
  glow?: boolean;
  dash?: string;
  opacity?: number;
}> = ({a, b, t = 1, color, w = 6, dir = false, ra = 32, rb = 32, curve = 0, label, labelOpacity = 1, glow = false, dash, opacity = 1}) => {
  const pts = edgePts(a, b, ra, rb, curve);
  const mid = pts[Math.floor(pts.length / 2)];
  const m: Pt = pts.length === 2 ? [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2] : mid;
  return (
    <g opacity={opacity}>
      <Arrow pts={pts} t={t} color={color} w={w} head={dir ? 14 : 0.01} glow={glow} dash={dash} />
      {label !== undefined && t > 0.6 && (
        <g opacity={labelOpacity * clamp01((t - 0.6) / 0.4)}>
          <rect x={m[0] - 21} y={m[1] - 18} width={42} height={36} fill={COL.panel} stroke={COL.sub} strokeWidth={3} />
          <text x={m[0]} y={m[1] + 1} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={24} fill={COL.text}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
};

export const Cell: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: React.ReactNode;
  color: string;
  fill?: number;
  size?: number;
  textColor?: string;
  opacity?: number;
  scale?: number;
  glow?: boolean;
  sub?: React.ReactNode;
  family?: string;
  dim?: boolean;
  rx?: number;
}> = ({x, y, w = 72, h = 72, text, color, fill = 0, size, textColor, opacity = 1, scale = 1, sub, family = FONT.pixelMono, dim}) => {
  if (opacity <= 0.001) return null;
  const sc = quant(scale, 6);
  const solid = fill > 0.55;
  const bg = solid ? color : fill > 0.05 ? COL.panelDark : COL.panel;
  return (
    <g transform={`translate(${x + w / 2},${y + h / 2}) scale(${sc})`} opacity={opacity} shapeRendering="crispEdges">
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={dim ? COL.line : color} />
      <rect x={-w / 2 + 3} y={-h / 2 + 3} width={w - 6} height={h - 6} fill={dim ? COL.panel : bg} />
      {text !== undefined && (
        <text
          y={2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily={family}
          fontSize={size ?? Math.max(24, Math.round((Math.min(w, h) * 0.5) / 12) * 12)}
          fill={textColor ?? (solid ? COL.invText : dim ? COL.dim : COL.text)}
        >
          {text}
        </text>
      )}
      {sub !== undefined && (
        <text y={h / 2 + 24} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={24} fill={COL.dim}>
          {sub}
        </text>
      )}
    </g>
  );
};

/** panel (was a glass card): now an RPG window */
export const Glass: React.FC<{
  x: number;
  y: number;
  w?: number;
  color: string;
  children: React.ReactNode;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({x, y, w, color, children, opacity = 1, style}) => (
  <PixelBox x={x} y={y} w={w} color={color} fill={COL.panel} opacity={opacity <= 0.02 ? 0 : 1} style={{...style}} inner={{fontFamily: FONT.pixelMono, fontSize: 36, lineHeight: '48px'}}>
    {children}
  </PixelBox>
);

export const Hi: React.FC<{c: string; children: React.ReactNode; b?: boolean}> = ({c, children, b = true}) => (
  <span style={{color: c, fontWeight: b ? 700 : undefined}}>{children}</span>
);

/** pulse travelling along a polyline */
/** pixel "comet": a blinking square packet travelling along a polyline */
export const Comet: React.FC<{pts: Pt[]; t: number; color?: string; r?: number}> = ({pts, t, color = COL.text, r = 12}) => {
  if (t <= 0 || t >= 1) return null;
  const tq = quant(t, 24);
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const d = tq * L[L.length - 1];
  let i = 1;
  while (i < pts.length - 1 && L[i] < d) i++;
  const s = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
  const x = Math.round(lerp(pts[i - 1][0], pts[i][0], s) / PX) * PX;
  const y = Math.round(lerp(pts[i - 1][1], pts[i][1], s) / PX) * PX;
  const q = Math.round(r / PX) * PX;
  return (
    <g shapeRendering="crispEdges">
      <rect x={x - q} y={y - q} width={q * 2} height={q * 2} fill={color} />
    </g>
  );
};
