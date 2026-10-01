import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CITES} from '../cites';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {BlockCursor, DitherFill, LOCK, Sprite, SpriteG, useCast} from '../components/pixel';
import {ACTS} from '../components/ui';
import {clamp01, COL, FONT, PX, quant, snap} from '../theme';
import {BLOCKS} from './Overview';

/* ============================ tribute roll ============================ */

const EXTRA: {year: number; who: string; work: string}[] = [
  {year: 1883, who: 'A. Kerckhoffs', work: 'La Cryptographie Militaire'},
  {year: 1977, who: 'NBS · IBM', work: 'Data Encryption Standard'},
  {year: 1985, who: 'T. ElGamal', work: 'A Public Key Cryptosystem Based on Discrete Logarithms'},
  {year: 1985, who: 'S. Goldwasser, S. Micali & C. Rackoff', work: 'The Knowledge Complexity of Interactive Proof Systems'},
  {year: 1986, who: 'A. Fiat & A. Shamir', work: 'How to Prove Yourself'},
  {year: 1986, who: 'A. C. Yao', work: 'How to Generate and Exchange Secrets'},
  {year: 1994, who: 'P. Shor', work: 'Algorithms for Quantum Computation'},
  {year: 2024, who: 'NIST', work: 'FIPS 203 / 204 / 205 后量子标准'},
];

const ROLL = (() => {
  const seen = new Set<string>();
  const all = [...Object.values(CITES), ...EXTRA]
    .filter((c) => !['Venona 计划', 'fail0verflow'].includes(c.who))
    .map((c) => ({...c, who: c.who.replace(/^G\. Vernam 1917 · /, '')}))
    .sort((a, b) => a.year - b.year);
  return all.filter((c) => {
    const k = c.year + c.who;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
})();
const ROW = 108;

export const Credits: React.FC = () => {
  const f = useF();
  const scroll = snap(Math.max(0, f - 120) * 3.6);
  const top0 = 1080 - scroll;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {f < 200 && (
        <div style={{position: 'absolute', top: 360 - snap(Math.max(0, f - 120) * 3.6), width: 1920, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.press, fontSize: 24, color: COL.dim, letterSpacing: '0.3em'}}>TRIBUTE</div>
          <div style={{fontFamily: FONT.pixel, fontSize: 96, lineHeight: '120px', color: COL.text, marginTop: 24}}>{'致敬'.slice(0, Math.floor(f / 10) + 1)}</div>
          <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub, marginTop: 24}}>{'站在巨人的肩膀上'.slice(0, Math.max(0, Math.floor((f - 30) / 4)))}</div>
        </div>
      )}
      {ROLL.map((c, i) => {
        const y = top0 + 240 + i * ROW;
        if (y < 110 || y > 1000) return null;
        return (
          <div key={i} style={{position: 'absolute', left: 300, top: y, width: 1320, display: 'flex', alignItems: 'baseline', gap: 48, whiteSpace: 'nowrap'}}>
            <span style={{fontFamily: FONT.press, fontSize: 24, color: COL.text, width: 120}}>{c.year}</span>
            <span style={{display: 'flex', flexDirection: 'column'}}>
              <span style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text}}>{c.who}</span>
              <span style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.dim}}>{c.work}</span>
            </span>
          </div>
        );
      })}
      {/* soft cut at top & bottom with dither bands */}
      <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
        <rect x={0} y={0} width={1920} height={96} fill={COL.bg} />
        <DitherFill id="cr-t" level={0.5} x={0} y={96} w={1920} h={36} color={COL.bg} cell={6} />
        <DitherFill id="cr-b" level={0.5} x={0} y={984} w={1920} h={36} color={COL.bg} cell={6} />
        <rect x={0} y={1020} width={1920} height={60} fill={COL.bg} />
      </svg>
    </AbsoluteFill>
  );
};

export const CreditsCues: Cue[] = [
  [0, 'bell', 72],
  [30, 'type'],
  // a soft tick as each name passes the middle of the screen
  ...ROLL.map((_, i): Cue => [Math.round(120 + (720 + i * ROW) / 3.6), 'tick']).filter((c) => c[0] < 1080),
];

/* ============================ collapse into a lock ============================ */

export const LockUp: React.FC = () => {
  const f = useF();
  const t = quant(clamp01((f - 60) / 150), 10);
  const lockIn = f >= 220;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
        {!lockIn &&
          BLOCKS.map((b, i) => {
            const cx = 960;
            const cy = 500;
            const x = snap(b.x + (cx - 60 - b.x) * t);
            const y = snap(b.y + (cy - 60 - b.y) * t);
            const w = snap(b.w + (120 - b.w) * t);
            const h = snap(b.h + (120 - b.h) * t);
            return <rect key={i} x={x} y={y} width={w} height={h} fill={b.fill === 'ink' ? COL.ink : b.fill === 'grey' ? COL.panelDark : COL.panel} stroke={COL.ink} strokeWidth={12} />;
          })}
        {lockIn && <SpriteG map={LOCK} x={960 - 60} y={500 - 72 - (f < 240 ? 0 : 0)} s={12} accent={COL.ink} />}
        {lockIn && f < 250 && <rect x={960 - 180} y={500 - 180} width={360} height={360} fill="none" stroke={COL.ink} strokeWidth={6} />}
      </svg>
      {f >= 260 && (
        <div style={{position: 'absolute', top: 690, width: 1920, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 48, lineHeight: '60px', color: COL.text}}>
          {'所有这些思想，最终化作一把锁'.slice(0, Math.floor((f - 260) / 4))}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const LockUpCues: Cue[] = [
  [60, 'riser2'],
  [220, 'stamp'],
  [222, 'chime'],
  [260, 'type'],
];

/* ============================ closing ============================ */

export const Logo: React.FC = () => {
  const f = useF();
  const cast = useCast();
  const n = Math.max(0, Math.min(5, Math.floor(f / 8)));
  const end = quant(clamp01((f - 600) / 90), 8);
  return (
    <AbsoluteFill>
      <Sprite map={LOCK} x={900} y={168} s={12} accent={COL.ink} />
      <div style={{position: 'absolute', top: 330, width: 1920, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 168, lineHeight: '192px', color: COL.text}}>{'现代密码学'.slice(0, n)}</div>
      {f >= 50 && <div style={{position: 'absolute', top: 546, width: 1920, textAlign: 'center', fontFamily: FONT.press, fontSize: 32, color: COL.sub, letterSpacing: '0.3em'}}>MODERN CRYPTOGRAPHY</div>}
      {f >= 80 && <div style={{position: 'absolute', left: 960 - 48, top: 630, width: 96, height: PX, background: COL.ink}} />}
      {f >= 110 && (
        <div style={{position: 'absolute', top: 696, width: 1920, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 60, lineHeight: '84px', color: COL.text}}>
          {'守护每一个秘密'.slice(0, Math.floor((f - 110) / 6) + 1)}
          {Math.floor((f - 110) / 6) + 1 < 7 && <BlockCursor f={f} size={60} on />}
        </div>
      )}
      {f >= 230 && (
        <div style={{position: 'absolute', top: 852, width: 1920, display: 'flex', justifyContent: 'center', gap: 60}}>
          {ACTS.map((a, i) => (
            <span key={i} style={{fontFamily: FONT.pixel, fontSize: 24, color: COL.dim, whiteSpace: 'nowrap'}}>
              <span style={{fontFamily: FONT.press, fontSize: 16, marginRight: 12}}>{a.num}</span>
              {a.name}
            </span>
          ))}
        </div>
      )}
      {f >= 300 && <div style={{position: 'absolute', top: 942, width: 1920, textAlign: 'center', fontFamily: FONT.press, fontSize: 16, color: COL.dim, letterSpacing: '0.2em'}}>1949 — 2024</div>}
      {f >= 330 && cast === 'ba' && <div style={{position: 'absolute', top: 1002, width: 1920, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 24, color: COL.dim}}>像素人物：pixiv #95092393（Game Development Department）</div>}
      {end > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
          <DitherFill id="logo-end" level={end} color={COL.bg} cell={12} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

export const LogoCues: Cue[] = [
  [0, 'reveal'],
  [110, 'type'],
  [150, 'bell', 84],
  [230, 'blip', 72],
];
