import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CITES} from '../cites';
import {blink, clamp01, COL, eBack, FONT, lerp, PX, quant} from '../theme';
import {BlockCursor} from './pixel';
import {useF, useShot} from './Shot';

/* ---------- SVG helpers ---------- */

/** Legacy filter ids: `url(#g-s|g-m|g-l)` now render a soft-grey 3px offset (no blur, no glow). */
export const GlowDefs: React.FC = () => (
  <defs>
    {['g-s', 'g-m', 'g-l'].map((id) => (
      <filter key={id} id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feFlood floodColor={COL.line} result="k" />
        <feComposite in="k" in2="SourceAlpha" operator="in" result="sh" />
        <feOffset in="sh" dx={3} dy={3} result="o" />
        <feMerge>
          <feMergeNode in="o" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    ))}
  </defs>
);

export type Pt = [number, number];

export const bez = (p0: Pt, c1: Pt, c2: Pt, p1: Pt, n = 28): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
      u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
    ]);
  }
  return out;
};

const segLens = (pts: Pt[]) => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return L;
};

/** point + tangent angle at arc-length fraction t */
export const along = (pts: Pt[], t: number): {p: Pt; a: number} => {
  const L = segLens(pts);
  const total = L[L.length - 1] || 1;
  const d = clamp01(t) * total;
  for (let i = 1; i < pts.length; i++) {
    if (d <= L[i] || i === pts.length - 1) {
      const s = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
      const p: Pt = [lerp(pts[i - 1][0], pts[i][0], s), lerp(pts[i - 1][1], pts[i][1], s)];
      return {p, a: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])};
    }
  }
  return {p: pts[0], a: 0};
};

/** partial polyline path (from t0 to t1 along arc length) */
export const partial = (pts: Pt[], t1: number, t0 = 0) => {
  const L = segLens(pts);
  const total = L[L.length - 1] || 1;
  const d0 = clamp01(t0) * total;
  const d1 = clamp01(t1) * total;
  if (d1 <= d0) return '';
  const out: Pt[] = [along(pts, t0).p];
  for (let i = 1; i < pts.length - 1; i++) if (L[i] > d0 && L[i] < d1) out.push(pts[i]);
  out.push(along(pts, t1).p);
  return 'M' + out.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
};

/** pixel arrow: square caps, chunky triangular head, hard shadow */
export const Arrow: React.FC<{
  pts: Pt[];
  t: number;
  color: string;
  w?: number;
  head?: number;
  dash?: string;
  dashOffset?: number;
  glow?: boolean;
  opacity?: number;
}> = ({pts, t, color, w = 3, head = 18, dash, dashOffset, glow = false, opacity = 1}) => {
  if (t <= 0.001) return null;
  const tq = quant(t, 12);
  if (tq <= 0) return null;
  const d = partial(pts, tq);
  const {p, a} = along(pts, tq);
  const hx = (ang: number, r: number) => [p[0] + Math.cos(ang) * r, p[1] + Math.sin(ang) * r];
  const l = hx(a + Math.PI - 0.6, head);
  const r = hx(a + Math.PI + 0.6, head);
  const ww = Math.max(PX / 2, Math.round(w / 3) * 3);
  return (
    <g opacity={opacity} filter={glow ? 'url(#g-s)' : undefined} shapeRendering="crispEdges">
      <path d={d} fill="none" stroke={color} strokeWidth={ww} strokeLinecap="square" strokeLinejoin="miter" strokeDasharray={dash ?? undefined} strokeDashoffset={dashOffset} />
      {head > 1 && <polygon points={`${l[0]},${l[1]} ${p[0] + Math.cos(a) * ww * 0.5},${p[1] + Math.sin(a) * ww * 0.5} ${r[0]},${r[1]}`} fill={color} />}
    </g>
  );
};

/* ---------- Caption → narration (bottom-left, no box) ---------- */

/** narration area every concept scene reserves */
export const DIALOG = {x: 96, y: 888, w: 1728, h: 156};

export const Caption: React.FC<{
  title: string;
  en?: string;
  desc?: string;
  /** ignored: on-screen course/source tags are not shown */
  chip?: string;
  color: string;
  delay?: number;
}> = ({title, en, desc, delay = 18}) => {
  const f = useF();
  const {mini} = useShot();
  if (mini || f < delay) return null;
  const rule = quant(clamp01((f - delay) / 18), 6);
  const tn = Math.max(0, Math.min(title.length, Math.floor((f - delay) / 3)));
  const n = desc ? Math.max(0, Math.min(desc.length, Math.floor((f - delay - 30) * 0.6))) : 0;
  const done = !desc || n >= desc.length;
  return (
    <div style={{position: 'absolute', left: DIALOG.x, top: DIALOG.y, width: DIALOG.w}}>
      <div style={{width: 96 * rule, height: PX, background: COL.ink}} />
      <div style={{display: 'flex', alignItems: 'baseline', gap: 30, marginTop: 18, whiteSpace: 'nowrap'}}>
        <span style={{fontFamily: FONT.pixel, fontSize: 48, lineHeight: '60px', color: COL.text}}>{title.slice(0, tn)}</span>
        {en && tn >= title.length && <span style={{fontFamily: FONT.press, fontSize: 16, color: COL.dim, letterSpacing: '0.08em'}}>{en}</span>}
      </div>
      {desc && f >= delay + 30 && (
        <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub, marginTop: 12, whiteSpace: 'nowrap'}}>
          {desc.slice(0, n)}
          {!done && <BlockCursor f={f} size={36} color={COL.sub} on />}
        </div>
      )}
    </div>
  );
};

/* ---------- chapter header + chronology ruler ---------- */

export type HudShot = {id: string; start: number; end: number; mood: string; act: number};
/** kept for API compatibility (no-op; ActHUD gets its shot list as a prop) */
export const registerHudShots = (_s: HudShot[]) => {};
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
/** "第一章 · 3" style position label for a shot id */
export const stageLabel = (id: string, shots: HudShot[]) => {
  const s = shots.find((x) => x.id === id);
  if (!s || s.act < 1 || s.act > 5) return '';
  const same = shots.filter((x) => x.act === s.act && (x.mood === 'concept' || x.mood === 'problem'));
  const k = same.findIndex((x) => x.id === id) + 1;
  return `${ROMAN[s.act]}.${k}`;
};

export const ACTS = [
  {num: 'I', zh: '第一章', name: '对称密码', en: 'SYMMETRIC CRYPTOGRAPHY'},
  {num: 'II', zh: '第二章', name: '公钥密码', en: 'PUBLIC-KEY CRYPTOGRAPHY'},
  {num: 'III', zh: '第三章', name: '数字签名', en: 'DIGITAL SIGNATURES'},
  {num: 'IV', zh: '第四章', name: '零知识证明', en: 'ZERO-KNOWLEDGE PROOFS'},
  {num: 'V', zh: '第五章', name: '前沿', en: 'POST-QUANTUM & PRIVACY'},
];

export const YEAR0 = 1800;
export const YEAR1 = 2030;
export const yearX = (y: number) => 96 + ((y - YEAR0) / (YEAR1 - YEAR0)) * 1728;

export const ActHUD: React.FC<{shots: HudShot[]}> = ({shots}) => {
  const f = useCurrentFrame();
  const s = shots.find((x) => f >= x.start && f < x.end);
  if (!s || s.act < 1 || s.act > 5 || (s.mood !== 'concept' && s.mood !== 'problem')) return null;
  if (f - s.start < 12) return null;
  const act = ACTS[s.act - 1];
  const cite = CITES[s.id];
  const fq = Math.floor(f / 3) * 3;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* left: chapter */}
      <div style={{position: 'absolute', left: 96, top: 36, display: 'flex', alignItems: 'baseline', gap: 18, whiteSpace: 'nowrap'}}>
        <span style={{fontFamily: FONT.press, fontSize: 16, color: COL.dim}}>{stageLabel(s.id, shots)}</span>
        <span style={{fontFamily: FONT.pixel, fontSize: 24, color: COL.text}}>
          {act.zh} · {act.name}
        </span>
      </div>
      {/* right: year · who · work */}
      {cite && (
        <div style={{position: 'absolute', right: 96, top: 36, maxWidth: 1180, display: 'flex', alignItems: 'baseline', gap: 18, whiteSpace: 'nowrap', overflow: 'hidden'}}>
          <span style={{fontFamily: FONT.press, fontSize: 16, color: COL.text}}>{cite.year}</span>
          <span style={{fontFamily: FONT.pixel, fontSize: 24, color: COL.text}}>{cite.who}</span>
          <span style={{fontFamily: FONT.pixel, fontSize: 24, color: COL.dim, overflow: 'hidden', textOverflow: 'ellipsis'}}>{cite.work}</span>
        </div>
      )}
      {/* chronology ruler */}
      <svg width={1920} height={60} style={{position: 'absolute', left: 0, top: 84}} shapeRendering="crispEdges">
        <rect x={yearX(YEAR0)} y={9} width={yearX(YEAR1) - yearX(YEAR0)} height={3} fill={COL.line} />
        {[1800, 1850, 1900, 1950, 2000].map((y) => (
          <g key={y}>
            <rect x={yearX(y)} y={3} width={3} height={15} fill={COL.line} />
            <text x={yearX(y) + 9} y={30} fontFamily={FONT.press} fontSize={12} fill={COL.dim}>
              {y}
            </text>
          </g>
        ))}
        {Object.values(CITES).map((c, i) => (
          <rect key={i} x={yearX(c.year)} y={6} width={3} height={9} fill={COL.dim} />
        ))}
        {cite && <rect x={yearX(cite.year) - 3} y={blink(fq, 60, 48) ? 0 : 3} width={9} height={blink(fq, 60, 48) ? 21 : 15} fill={COL.ink} />}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- misc ---------- */

export const Pop: React.FC<{f: number; at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({f, at, dur = 18, children, style}) => {
  const t = quant(clamp01((f - at) / dur), 3);
  if (t <= 0) return null;
  const s = t < 1 ? lerp(0.6, 1.1, eBack(t)) : 1;
  return <div style={{...style, transform: `${style?.transform ?? ''} scale(${s})`}}>{children}</div>;
};

/** camera: pixel art doesn't zoom — kept for API compatibility, renders children unscaled */
export const Cam: React.FC<{children: React.ReactNode; from?: number; to?: number; ox?: number; oy?: number}> = ({children}) => <AbsoluteFill>{children}</AbsoluteFill>;

/** typewriter text with a BLOCK cursor */
export const Typed: React.FC<{text: string; f: number; at: number; cps?: number; cursor?: boolean; style?: React.CSSProperties}> = ({text, f, at, cps = 0.6, cursor = false, style}) => {
  const n = Math.max(0, Math.min(text.length, Math.floor((f - at) * cps)));
  const size = typeof style?.fontSize === 'number' ? style.fontSize : 36;
  return (
    <span style={style}>
      {text.slice(0, n)}
      {cursor && <BlockCursor f={f} size={size} on={n < text.length ? true : undefined} color={(style?.color as string) ?? COL.text} />}
    </span>
  );
};

export {eBack};
