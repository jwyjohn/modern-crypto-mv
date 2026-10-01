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

const Label: React.FC<{x: number; y: number; w: number; children: React.ReactNode; align?: 'left' | 'center' | 'right'}> = ({x, y, w, children, align = 'center'}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, textAlign: align}}>{children}</div>
);

/** one protocol message: a horizontal pixel arrow with a label block above it */
const Msg: React.FC<{y: number; dir: 'right' | 'left'; step: string; label: React.ReactNode; note: string}> = ({y, dir, step, label, note}) => {
  const x0 = 520;
  const x1 = 1080;
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
      <div style={{position: 'absolute', left: x0, top: y - 66, width: x1 - x0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 18, whiteSpace: 'nowrap'}}>
        <span style={{fontFamily: FONT.press, fontSize: 16, color: COL.dim}}>{step}</span>
        <span style={{fontFamily: FONT.pixelMono, fontSize: 36, lineHeight: '48px', color: COL.text, background: COL.panel, border: `3px solid ${COL.ink}`, padding: '0 14px'}}>{label}</span>
      </div>
      <div style={{position: 'absolute', left: x0, top: y + 18, width: x1 - x0, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 24, color: COL.sub}}>{note}</div>
    </>
  );
};

export const Cover: React.FC = () => (
  <AbsoluteFill style={{background: COL.bg}}>
    {/* paper dot grid */}
    <svg width={1600} height={1200} style={{position: 'absolute'}} shapeRendering="crispEdges">
      <defs>
        <pattern id="cv-dots" width={48} height={48} patternUnits="userSpaceOnUse">
          <rect x={0} y={0} width={3} height={3} fill={COL.line} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={1600} height={1200} fill="url(#cv-dots)" />
      {/* frame */}
      <rect x={36} y={36} width={1528} height={1128} fill="none" stroke={COL.ink} strokeWidth={6} />
    </svg>

    {/* title */}
    <Label x={0} y={84} w={1600}>
      <div style={{fontFamily: FONT.pixel, fontSize: 120, lineHeight: '132px', color: COL.text}}>现代密码学</div>
      <div style={{fontFamily: FONT.press, fontSize: 24, color: COL.sub, letterSpacing: '0.3em', marginTop: 12}}>MODERN CRYPTOGRAPHY</div>
    </Label>
    <Label x={0} y={300} w={1600}>
      <span style={{fontFamily: FONT.pixel, fontSize: 36, color: COL.invText, background: COL.inv, padding: '4px 24px'}}>Σ 协议 · 证明我知道 x，却不泄露 x</span>
    </Label>

    {/* main cast: prover (Momoi) and verifier (Midori) */}
    <Chara name="momoi" x={300} bottom={850} scale={8} face="right" />
    <Chara name="midori" x={1300} bottom={850} scale={8} face="left" />
    <Label x={140} y={866} w={320}>
      <div style={{fontFamily: FONT.press, fontSize: 24, color: COL.text}}>P</div>
      <div style={{fontFamily: FONT.pixel, fontSize: 24, color: COL.sub, marginTop: 6}}>证明者 · 知道 x = {X_SECRET}</div>
    </Label>
    <Label x={1140} y={866} w={320}>
      <div style={{fontFamily: FONT.press, fontSize: 24, color: COL.text}}>V</div>
      <div style={{fontFamily: FONT.pixel, fontSize: 24, color: COL.sub, marginTop: 6}}>验证者 · 只知道 X = {X_PUB}</div>
    </Label>

    {/* the three moves */}
    <Label x={520} y={402} w={560}>
      <span style={{fontFamily: FONT.pixelMono, fontSize: 24, color: COL.dim}}>
        p = {P} · g = {G} · X = gˣ = {X_PUB}
      </span>
    </Label>
    <Msg y={520} dir="right" step="1" label={<>a = gʳ = {A}</>} note={`承诺：随机 r = ${R}`} />
    <Msg y={650} dir="left" step="2" label={<>c = {C}</>} note="挑战：V 随机出题" />
    <Msg y={780} dir="right" step="3" label={<>z = r + c·x = {Z}</>} note={`回应（mod ${Q}）`} />

    {/* verification */}
    <Label x={520} y={846} w={560}>
      <span style={{fontFamily: FONT.pixelMono, fontSize: 36, lineHeight: '48px', color: COL.invText, background: COL.inv, padding: '6px 18px', whiteSpace: 'nowrap'}}>
        gᶻ = {LHS} = a·Xᶜ {LHS === RHS ? '✓' : '✗'}
      </span>
    </Label>

    {/* supporting cast */}
    <Chara name="arisu" x={250} bottom={1120} scale={4} face="right" />
    <Chara name="yuzu" x={420} bottom={1120} scale={4} face="right" />
    <Label x={500} y={1010} w={420} align="left">
      <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.text}}>模拟器：不知道 x，也能造出</div>
      <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.text}}>一模一样的对话 (a, c, z)</div>
    </Label>
    <Chara name="yuuka" x={1340} bottom={1120} scale={4} face="left" />
    <Label x={920} y={1010} w={330} align="right">
      <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.text}}>旁观者：</div>
      <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.text}}>看完全程，学不到 x</div>
    </Label>

    {/* credit */}
    <Label x={0} y={1112} w={1600} align="center">
      <span style={{fontFamily: FONT.pixel, fontSize: 24, color: COL.dim}}>像素人物：pixiv #95092393</span>
    </Label>
  </AbsoluteFill>
);
