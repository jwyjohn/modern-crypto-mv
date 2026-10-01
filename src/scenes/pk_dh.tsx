import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, BOB, DitherFill, EVE, LOCK, SpriteG} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption, Pt} from '../components/ui';
import {FONT, prog, PX, quant, snap} from '../theme';
import {Cells, H, K, Person, pixLine, showAt, stepAlong, sup, T, Tag} from './pk_common';
import {modpow} from './pk_math';

/* ---------------- numbers (computed) ---------------- */
const P = 23;
const G = 5;
const Aa = 6;
const Bb = 15;
const AA = modpow(G, Aa, P); // 8
const BB = modpow(G, Bb, P); // 19
const KA = modpow(BB, Aa, P); // 2
const KB = modpow(AA, Bb, P); // 2
const KG = modpow(G, Aa * Bb, P); // 2

/* ---------------- paint = dither density (n / 16) ---------------- */
// mixing two paints averages their density; the final colour (pub + a + b) / 3 is the same on both sides
const D_PUB = 3;
const D_A = 13;
const D_B = 5;
const D_MA = (D_PUB + D_A) / 2; // 8
const D_MB = (D_PUB + D_B) / 2; // 4
const D_FIN = (D_PUB + D_A + D_B) / 3; // 7
const D_EVE = (D_MA + D_MB) / 2; // 6 — Eve mixing her two jars gets a different colour

const JW = 96;
const Jar: React.FC<{id: string; x: number; y: number; d: number; s?: number; hot?: boolean}> = ({id, x, y, d, s = 1, hot}) => {
  const w = snap(JW * s);
  const X = snap(x - w / 2);
  const Y = snap(y - w / 2);
  const b = hot ? PX : 3;
  return (
    <g shapeRendering="crispEdges">
      <rect x={X + w / 4} y={Y - 12} width={w / 2} height={12} fill={K.ink} />
      <rect x={X} y={Y} width={w} height={w} fill={K.panel} />
      <DitherFill id={id} level={d / 16} color={K.ink} cell={PX} x={X + b} y={Y + b} w={w - 2 * b} h={w - 2 * b} />
      <rect x={X + b / 2} y={Y + b / 2} width={w - b} height={w - b} fill="none" stroke={K.ink} strokeWidth={b} />
    </g>
  );
};

const AX = 420;
const BX = 1500;
const R1 = 228;
const R2 = 408;
const R3 = 588;
const EVE_X = 900;
const EVE_Y = 654;

export const PkDh: React.FC = () => {
  const f = useF();
  const ph1 = f < 396;
  const ph2 = f >= 402;
  const wipe = f >= 390 && f < 408;

  /* ---------- phase 1 timing ---------- */
  const tPub = 24;
  const tSec = 60;
  const tMove = 110; // public copy + secret copy slide into the mix slot
  const tMix = 160;
  const tEx = 200; // exchange
  const tFin = 290;
  const tSame = 336;
  const tEve = 360;
  const mv = quant(prog(f, tMove, 42), 8);
  const ex = prog(f, tEx, 72);
  const fin = quant(prog(f, tFin, 36), 6);
  const pathAB: Pt[] = [
    [AX, R2],
    [BX, R3],
  ];
  const pathBA: Pt[] = [
    [BX, R2],
    [AX, R3],
  ];
  const pa = stepAlong(pathAB, ex, 18);
  const pb = stepAlong(pathBA, ex, 18);
  const eveLook = ex > 0.4 && ex < 0.65;

  /* ---------- phase 2 timing ---------- */
  const t2 = 410;
  const tEx2 = 560;
  const ex2 = prog(f, tEx2, 60);
  const qa = stepAlong(
    [
      [AX + 60, 456],
      [BX - 60, 456],
    ],
    ex2,
    18,
  );
  const qb = stepAlong(
    [
      [BX - 60, 516],
      [AX + 60, 516],
    ],
    ex2,
    18,
  );
  const eveLook2 = ex2 > 0.4 && ex2 < 0.65;
  const tK = 640;
  const tShared = 708;
  const tCdh = 760;

  const beam = (to: Pt) => <Cells cells={pixLine([EVE_X + 60, EVE_Y - 12], to)} color={K.red} dash={2} />;

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
        {/* persons */}
        {showAt(f, 0) && <Person map={ALICE} x={96} y={R1 - 48} s={12} name="ALICE" />}
        {showAt(f, 6) && <Person map={BOB} x={1704} y={R1 - 48} s={12} name="BOB" />}
        {showAt(f, 12) && <Person map={EVE} x={EVE_X} y={EVE_Y} s={12} name="EVE" nameColor={K.red} />}

        {/* ================= phase 1: paint ================= */}
        {ph1 && (
          <g>
            {/* public jar */}
            {showAt(f, tPub) && <Jar id="dh-pub" x={960} y={R1} d={D_PUB} />}
            {/* secrets (always kept by their owners) */}
            {showAt(f, tSec) && (
              <>
                <Jar id="dh-sa" x={AX} y={R1} d={D_A} />
                <Jar id="dh-sb" x={BX} y={R1} d={D_B} />
                <SpriteG map={LOCK} x={AX + 66} y={R1 - 72} s={3} accent={K.ink} />
                <SpriteG map={LOCK} x={BX + 66} y={R1 - 72} s={3} accent={K.ink} />
              </>
            )}
            {/* copies sliding into the mix slots */}
            {f >= tMove && f < tMix && (
              <>
                <Jar id="dh-mvp1" x={snap(960 + (AX - 960) * mv)} y={snap(R1 + (R2 - R1) * mv)} d={D_PUB} s={0.75} />
                <Jar id="dh-mvp2" x={snap(960 + (BX - 960) * mv)} y={snap(R1 + (R2 - R1) * mv)} d={D_PUB} s={0.75} />
                <Jar id="dh-mva" x={AX} y={snap(R1 + (R2 - R1) * mv)} d={D_A} s={0.75} />
                <Jar id="dh-mvb" x={BX} y={snap(R1 + (R2 - R1) * mv)} d={D_B} s={0.75} />
              </>
            )}
            {/* mixtures */}
            {f >= tMix && f < tEx && (
              <>
                <Jar id="dh-ma" x={AX} y={R2} d={D_MA} hot={f < tMix + 12} />
                <Jar id="dh-mb" x={BX} y={R2} d={D_MB} hot={f < tMix + 12} />
              </>
            )}
            {/* exchange across the public channel */}
            {f >= tEx && (
              <>
                {f < tFin && (
                  <>
                    <Cells cells={pixLine(pathAB[0], pathAB[1])} color={K.line} dash={3} />
                    <Cells cells={pixLine(pathBA[0], pathBA[1])} color={K.line} dash={3} />
                  </>
                )}
                <Jar id="dh-xa" x={pa[0]} y={pa[1]} d={f >= tFin + 36 ? D_FIN : D_MA} hot={f >= tSame} />
                <Jar id="dh-xb" x={pb[0]} y={pb[1]} d={f >= tFin + 36 ? D_FIN : D_MB} hot={f >= tSame} />
                {eveLook && beam(pa)}
                {eveLook && beam(pb)}
              </>
            )}
            {/* own secret added on arrival */}
            {f >= tFin && f < tFin + 36 && (
              <>
                <Jar id="dh-fa" x={AX} y={snap(R1 + (R3 - R1) * fin)} d={D_A} s={0.75} />
                <Jar id="dh-fb" x={BX} y={snap(R1 + (R3 - R1) * fin)} d={D_B} s={0.75} />
              </>
            )}
            {/* Eve tries to mix what she saw */}
            {showAt(f, tEve) && (
              <>
                <Jar id="dh-eve" x={EVE_X + 240} y={EVE_Y + 84} d={D_EVE} s={0.75} />
                <Cells cells={pixLine([EVE_X + 300, EVE_Y + 84], [EVE_X + 330, EVE_Y + 84])} color={K.red} />
              </>
            )}
          </g>
        )}

        {/* ================= phase 2: numbers ================= */}
        {ph2 && (
          <g>
            {f >= tEx2 && ex2 < 1 && (
              <>
                <Cells cells={pixLine([AX + 60, 456], [BX - 60, 456])} color={K.line} dash={3} />
                <Cells cells={pixLine([BX - 60, 516], [AX + 60, 516])} color={K.line} dash={3} />
                {eveLook2 && beam(qa)}
                {eveLook2 && beam(qb)}
              </>
            )}
            {showAt(f, t2 + 20) && <SpriteG map={LOCK} x={264} y={R1 - 30} s={3} accent={K.ink} />}
            {showAt(f, t2 + 26) && <SpriteG map={LOCK} x={1638} y={R1 - 30} s={3} accent={K.ink} />}
          </g>
        )}
        {wipe && <DitherFill id="dh-wipe" level={1 - Math.abs(f - 399) / 12} color={K.bg} cell={PX * 2} x={240} y={150} w={1440} h={480} />}
      </svg>

      {/* ---------- phase 1 labels ---------- */}
      {ph1 && (
        <>
          <T f={f} at={tPub + 6} x={960} w={360} align="center" y={R1 + 66} size={24} color={K.sub}>
            公开颜料
          </T>
          <T f={f} at={tSec + 6} x={AX} w={300} align="center" y={R1 + 66} size={24} color={K.sub}>
            秘密颜料 a
          </T>
          <T f={f} at={tSec + 6} x={BX} w={300} align="center" y={R1 + 66} size={24} color={K.sub}>
            秘密颜料 b
          </T>
          <T f={f} at={tSame} x={960} w={480} align="center" y={R3 - 24}>
            <Tag size={36}>两边得到同一种颜色 ✓</Tag>
          </T>
          <T f={f} at={tEx + 40} out={tEve} x={EVE_X + 168} y={EVE_Y + 60} size={24} color={K.sub}>
            截获：公开颜料 + 两罐混合色
          </T>
          <T f={f} at={tEve + 6} x={EVE_X + 360} y={EVE_Y + 54} size={36} color={K.red}>
            ✗ 拆不开，也调不出
          </T>
        </>
      )}

      {/* ---------- phase 2 labels ---------- */}
      {ph2 && (
        <>
          <T f={f} at={t2} x={960} w={720} align="center" y={R1 - 30} size={48} font={FONT.pixelMono}>
            p = {P}　g = {G}
          </T>
          <T f={f} at={t2 + 6} x={960} w={720} align="center" y={R1 + 36} size={24} color={K.sub}>
            公开参数
          </T>
          {/* Alice */}
          <T f={f} at={t2 + 20} x={312} y={R1 - 30} size={48} font={FONT.pixelMono}>
            a = {Aa}
          </T>
          <T f={f} at={t2 + 70} x={264} y={R1 + 60} size={36} font={FONT.pixelMono}>
            A = {G}
            {sup(Aa)} mod {P} = <H c={K.ink}>{AA}</H>
          </T>
          {/* Bob */}
          <T f={f} at={t2 + 26} x={1620} w={400} align="right" y={R1 - 30} size={48} font={FONT.pixelMono}>
            b = {Bb}
          </T>
          <T f={f} at={t2 + 80} x={1656} w={560} align="right" y={R1 + 60} size={36} font={FONT.pixelMono}>
            B = {G}
            {sup(Bb)} mod {P} = {BB}
          </T>
          {/* exchanged values */}
          {f >= tEx2 && ex2 < 1 && (
            <>
              <div style={{position: 'absolute', left: qa[0] - 72, top: qa[1] - 24}}>
                <Tag size={36}>A = {AA}</Tag>
              </div>
              <div style={{position: 'absolute', left: qb[0] - 84, top: qb[1] - 24}}>
                <Tag size={36}>B = {BB}</Tag>
              </div>
            </>
          )}
          {/* shared key */}
          <T f={f} at={tK} x={264} y={R3 - 60} size={36} font={FONT.pixelMono}>
            K = {BB}
            {sup(Aa)} mod {P} = {KA}
          </T>
          <T f={f} at={tK + 12} x={1656} w={560} align="right" y={R3 - 60} size={36} font={FONT.pixelMono}>
            K = {AA}
            {sup(Bb)} mod {P} = {KB}
          </T>
          <T f={f} at={tShared} x={960} w={640} align="center" y={456}>
            <Tag size={48} style={{padding: '6px 24px'}}>
              g{sup('ab')} = 5{sup(Aa * Bb)} ≡ {KG}
            </Tag>
          </T>
          <T f={f} at={tShared + 12} x={960} w={640} align="center" y={540} size={24} color={K.sub}>
            同一个共享秘密
          </T>
          <T f={f} at={tEx2 + 40} out={tCdh} x={EVE_X + 168} y={EVE_Y + 60} size={24} color={K.sub}>
            只看到 p、g、A、B
          </T>
          <T f={f} at={tCdh} x={EVE_X + 168} y={EVE_Y + 36} size={36} color={K.red} font={FONT.pixelMono}>
            g{sup('ab')} = ?
          </T>
          <T f={f} at={tCdh + 12} x={EVE_X + 168} y={EVE_Y + 96} size={24} color={K.sub}>
            CDH 假设：由 g{sup('a')}、g{sup('b')} 算 g{sup('ab')} 是困难的
          </T>
        </>
      )}
      <Caption title="Diffie–Hellman 密钥交换" en="KEY EXCHANGE" desc="在公开信道上协商出共享秘密 g^ab；安全性依赖 CDH 假设" color={K.act} />
    </AbsoluteFill>
  );
};

export const PkDhCues: Cue[] = [
  [24, 'blip', 72],
  [60, 'blip', 76],
  [110, 'whoosh'],
  [160, 'chime'],
  [200, 'whoosh'],
  [240, 'tick'],
  [326, 'blip', 79],
  [336, 'chime'],
  [360, 'error'],
  [410, 'whoosh'],
  [480, 'type'],
  [560, 'whoosh'],
  [600, 'tick'],
  [640, 'type'],
  [708, 'bell', 72],
  [760, 'error'],
];
