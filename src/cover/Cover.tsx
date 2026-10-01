import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SPRITE_IMG} from '../components/sprites_data';
import {COL, FONT} from '../theme';

/**
 * Cover still (1600×1200, 4:3): the Game Development Department running a Σ-protocol (Schnorr).
 * Toy group: p = 23, g = 2 of order 11, secret x = 7, public X = g^x = 13; r = 5, c = 3.
 */
const P = 23;
const G = 2;
const Q = 11;
const X_SECRET = 7;
const R = 5;
const C = 3;
const pow = (b: number, e: number, m: number) => {
  let r = 1;
  let x = b % m;
  let k = e;
  while (k > 0) {
    if (k & 1) r = (r * x) % m;
    x = (x * x) % m;
    k >>= 1;
  }
  return r;
};
const X_PUB = pow(G, X_SECRET, P); // 13
const A = pow(G, R, P); // 9
const Z = (R + C * X_SECRET) % Q; // 4
const LHS = pow(G, Z, P); // 16
const RHS = (A * pow(X_PUB, C, P)) % P; // 16

/** native facing of each sprite (measured from the face position) */
const NATIVE: Record<string, 'left' | 'right' | 'none'> = {momoi: 'left', midori: 'right', arisu: 'left', yuzu: 'none', yuuka: 'left'};

const Chara: React.FC<{name: string; x: number; bottom: number; scale: number; face: 'left' | 'right'}> = ({name, x, bottom, scale, face}) => {
  const sp = SPRITE_IMG[name];
  const w = sp.w * scale;
  const h = sp.h * scale;
  const mirror = NATIVE[name] !== 'none' && NATIVE[name] !== face;
  return (
    <img
      src={sp.uri}
      style={{position: 'absolute', left: x - w / 2, top: bottom - h, width: w, height: h, imageRendering: 'pixelated', transform: mirror ? 'scaleX(-1)' : undefined}}
    />
  );
};

/** one protocol message: a horizontal pixel arrow with the message above it */
const Msg: React.FC<{y: number; dir: 'right' | 'left'; label: React.ReactNode}> = ({y, dir, label}) => {
  const x0 = 540;
  const x1 = 1060;
  return (
    <>
      <svg width={1600} height={1200} style={{position: 'absolute', left: 0, top: 0}} shapeRendering="crispEdges">
        <rect x={x0} y={y} width={x1 - x0} height={6} fill={COL.ink} />
        {dir === 'right' ? (
          <polygon points={`${x1 + 18},${y + 3} ${x1 - 6},${y - 12} ${x1 - 6},${y + 18}`} fill={COL.ink} />
        ) : (
          <polygon points={`${x0 - 18},${y + 3} ${x0 + 6},${y - 12} ${x0 + 6},${y + 18}`} fill={COL.ink} />
        )}
      </svg>
      <div style={{position: 'absolute', left: x0, top: y - 72, width: x1 - x0, textAlign: 'center'}}>
        <span style={{fontFamily: FONT.pixelMono, fontSize: 48, lineHeight: '60px', color: COL.text, background: COL.panel, border: `3px solid ${COL.ink}`, padding: '0 18px', whiteSpace: 'nowrap'}}>{label}</span>
      </div>
    </>
  );
};

export const Cover: React.FC = () => (
  <AbsoluteFill style={{background: COL.bg}}>
    <svg width={1600} height={1200} style={{position: 'absolute'}} shapeRendering="crispEdges">
      <defs>
        <pattern id="cv-dots" width={48} height={48} patternUnits="userSpaceOnUse">
          <rect x={0} y={0} width={3} height={3} fill={COL.line} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={1600} height={1200} fill="url(#cv-dots)" />
      <rect x={36} y={36} width={1528} height={1128} fill="none" stroke={COL.ink} strokeWidth={6} />
    </svg>

    {/* prover (Momoi) and verifier (Midori), facing each other */}
    <Chara name="momoi" x={310} bottom={740} scale={10} face="right" />
    <Chara name="midori" x={1290} bottom={740} scale={10} face="left" />

    {/* the interaction */}
    <Msg y={330} dir="right" label={<>a = gʳ = {A}</>} />
    <Msg y={480} dir="left" label={<>c = {C}</>} />
    <Msg y={630} dir="right" label={<>z = r + c·x = {Z}</>} />
    <div style={{position: 'absolute', left: 540, top: 700, width: 520, textAlign: 'center'}}>
      <span style={{fontFamily: FONT.pixelMono, fontSize: 48, lineHeight: '60px', color: COL.invText, background: COL.inv, padding: '6px 22px', whiteSpace: 'nowrap'}}>
        gᶻ = {LHS} = a·Xᶜ {LHS === RHS ? '✓' : '✗'}
      </span>
    </div>

    {/* the rest of the department */}
    <Chara name="arisu" x={330} bottom={1120} scale={5} face="right" />
    <Chara name="yuzu" x={800} bottom={1120} scale={5} face="right" />
    <Chara name="yuuka" x={1270} bottom={1120} scale={5} face="left" />
  </AbsoluteFill>
);
