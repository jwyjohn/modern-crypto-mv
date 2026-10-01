import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import {ALICE, BOB, SAGE, SpriteG} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption} from '../components/ui';
import {FONT, snap} from '../theme';
import {fl, Fx, Mark, md, minv, Pill, sp, T} from './sig_lib';

/* ====================================================================== */
/* BLS: pairing · aggregation · threshold                                 */
/* ====================================================================== */

const P2 = 180;
const P3 = 360;
const P4 = 540;

/* toy 2-of-3 Shamir sharing in Z_11 */
const TQ = 11;
const TX = 7; // secret x = f(0)
const TA = 3; // f(z) = 7 + 3z
const SH = [1, 2, 3].map((i) => md(TX + TA * i, TQ)); // 10, 2, 5
const SET = [1, 3]; // the two parties that sign
const lam = (i: number) =>
  SET.filter((j) => j !== i).reduce((acc, j) => md(acc * j * minv(md(j - i, TQ), TQ), TQ), 1); // λ_1 = 7, λ_3 = 5
const L1 = lam(1);
const L3 = lam(3);
const EXP = L1 * SH[0] + L3 * SH[2]; // 95
const REC = md(EXP, TQ); // 7 = x

export const SigBls: React.FC = () => {
  const f = useF();
  const ph = f < P2 ? 1 : f < P3 ? 2 : f < P4 ? 3 : 4;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {ph === 1 && <Pairing f={f} />}
        {ph === 2 && <Bls f={f - P2} />}
        {ph === 3 && <Aggregate f={f - P3} />}
        {ph === 4 && <Threshold f={f - P4} />}
        {/* phase pips */}
        {[1, 2, 3, 4].map((k) => (
          <rect key={k} x={1716 + (k - 1) * 30} y={180} width={18} height={18} fill={k === ph ? T.ink : T.paper} stroke={T.ink} strokeWidth={3} />
        ))}
      </svg>
      <Caption title="BLS 签名" en="PAIRING · AGGREGATION" desc="签名可聚合、可门限：以太坊共识每轮聚合成千上万个签名" color={T.act} />
    </AbsoluteFill>
  );
};

/* ---------- 1. bilinear pairing ---------- */
const Pairing: React.FC<{f: number}> = ({f}) => (
  <g>
    {fl(f, 0) && (
      <Txt x={96} y={192} size={36} anchor="start" color={T.ink}>
        双线性配对
      </Txt>
    )}
    <Pill x={456} y={342} w={264} h={60} size={36} text="aP ∈ G₁" show={fl(f, 12)} />
    <Pill x={456} y={462} w={264} h={60} size={36} text="bQ ∈ G₂" show={fl(f, 24)} />
    <Arrow pts={[[594, 342], [690, 342], [690, 384], [846, 384]]} t={sp(f, 36, 24)} color={T.ink} w={3} head={12} glow={false} />
    <Arrow pts={[[594, 462], [690, 462], [690, 420], [846, 420]]} t={sp(f, 36, 24)} color={T.ink} w={3} head={12} glow={false} />
    {fl(f, 30) && (
      <g>
        <rect x={858} y={330} width={204} height={144} fill={T.inv} />
        <Txt x={960} y={404} size={72} color={T.invText} family={FONT.pixelMono}>
          e
        </Txt>
      </g>
    )}
    <Arrow pts={[[1074, 402], [1236, 402]]} t={sp(f, 66, 18)} color={T.ink} w={3} head={12} glow={false} />
    {fl(f, 84) && (
      <g>
        <rect x={1248} y={372} width={384} height={60} fill={T.paper} stroke={T.ink} strokeWidth={3} />
        <Fx x={1440} y={404} size={36} parts={['e(P, Q)', '^ab', ' ∈ G', '_T']} />
      </g>
    )}
    <Fx x={960} y={618} size={60} parts={['e(aP, bQ) = e(P, Q)', '^ab']} show={fl(f, 108)} />
    {fl(f, 132) && (
      <Txt x={960} y={720} size={36} color={T.sub}>
        标量可以穿过配对，跑进指数里
      </Txt>
    )}
  </g>
);

/* ---------- 2. BLS scheme ---------- */
const Bls: React.FC<{f: number}> = ({f}) => {
  const rows: [string, (string | [string, string?])[]][] = [
    ['密钥', ['sk = x，pk = g', '^x']],
    ['签名', ['σ = H(m)', '^x']],
    ['验证', ['e(σ, g) = e(H(m), pk)']],
  ];
  return (
    <g>
      {fl(f, 0) && (
        <Txt x={96} y={192} size={36} anchor="start" color={T.ink}>
          Boneh–Lynn–Shacham 2001
        </Txt>
      )}
      {fl(f, 0) && <SpriteG map={ALICE} x={168} y={282} s={12} accent={T.sub} />}
      {rows.map(([k, parts], i) =>
        fl(f, 12 + i * 24) ? (
          <g key={i}>
            <Txt x={420} y={312 + i * 84} size={36} anchor="start" color={T.sub}>
              {k}
            </Txt>
            <Fx x={552} y={312 + i * 84} size={48} anchor="start" parts={parts} />
          </g>
        ) : null,
      )}
      {fl(f, 96) && <rect x={420} y={558} width={1080} height={3} fill={T.line} />}
      <Fx x={960} y={630} size={36} parts={['e(H(m)', '^x', ', g) = e(H(m), g)', '^x', ' = e(H(m), g', '^x', ')']} show={fl(f, 96)} />
      <Mark x={1500} y={630} ok show={fl(f, 120)} s={4} />
      {fl(f, 132) && (
        <Txt x={960} y={732} size={36} color={T.ink}>
          整个签名只是一个群元素：48 字节（G₁）
        </Txt>
      )}
    </g>
  );
};

/* ---------- 3. aggregation ---------- */
const NS = 6;
const SPR = [ALICE, BOB, SAGE, ALICE, BOB, SAGE];
const Aggregate: React.FC<{f: number}> = ({f}) => {
  const slide = sp(f, 60, 30);
  const merged = f >= 93;
  return (
    <g>
      {fl(f, 0) && (
        <Txt x={96} y={192} size={36} anchor="start" color={T.ink}>
          聚合
        </Txt>
      )}
      {SPR.map((m, j) => {
        const x = 480 + j * 192;
        return fl(f, j * 6) ? (
          <g key={j}>
            <SpriteG map={m} x={x - 30} y={228} s={6} accent={T.sub} />
            {!merged && (
              <Pill
                x={snap(x + (960 - x) * slide)}
                y={snap(360 + (480 - 360) * slide)}
                w={96}
                h={54}
                size={36}
                text={`σ${'₁₂₃₄₅₆'[j]}`}
                mode="line"
                show={fl(f, 18 + j * 6)}
              />
            )}
          </g>
        ) : null;
      })}
      {merged && (
        <g>
          <rect x={612} y={444} width={696} height={72} fill={T.inv} />
          <Fx x={960} y={482} size={36} color={T.invText} parts={['σ', '_agg', ' = σ₁·σ₂·σ₃·σ₄·σ₅·σ₆']} />
        </g>
      )}
      {fl(f, 108) && (
        <Txt x={960} y={576} size={36} color={T.sub}>
          n 个签名乘成一个，仍然只有 48 字节
        </Txt>
      )}
      <Fx x={960} y={672} size={36} parts={['e(σ', '_agg', ', g) = ∏ e(H(m', '_i', '), pk', '_i', ')']} show={fl(f, 126)} />
      {fl(f, 150) && (
        <Txt x={960} y={768} size={24} color={T.sub}>
          一次配对等式验完全部签名
        </Txt>
      )}
    </g>
  );
};

/* ---------- 4. threshold ---------- */
const Threshold: React.FC<{f: number}> = ({f}) => {
  const px = [480, 960, 1440];
  return (
    <g>
      {fl(f, 0) && (
        <Txt x={96} y={192} size={36} anchor="start" color={T.ink}>
          门限 2-of-3
        </Txt>
      )}
      <Fx x={960} y={192} size={36} parts={[`f(z) = ${TX} + ${TA}z  mod ${TQ}，x = f(0) = ${TX}`]} show={fl(f, 6)} />
      {px.map((x, k) => {
        const signs = SET.includes(k + 1);
        return fl(f, 12 + k * 6) ? (
          <g key={k}>
            <SpriteG map={[ALICE, BOB, SAGE][k]} x={x - 30} y={246} s={6} accent={T.sub} />
            <Txt x={x} y={366} size={36} color={T.ink} family={FONT.pixelMono}>
              {`x${'₁₂₃'[k]} = ${SH[k]}`}
            </Txt>
            {fl(f, 42 + k * 6) &&
              (signs ? (
                <g>
                  <rect x={x - 144} y={426} width={288} height={60} fill={T.paper} stroke={T.ink} strokeWidth={3} />
                  <Fx x={x} y={458} size={36} parts={[`σ${'₁₂₃'[k]} = H(m)`, `^${SH[k]}`]} />
                </g>
              ) : (
                <Pill x={x} y={456} w={288} h={60} size={24} text="不在线" mode="ghost" family={FONT.pixel} />
              ))}
          </g>
        ) : null;
      })}
      <Fx x={960} y={576} size={36} parts={['σ = σ₁', `^${L1}`, ' · σ₃', `^${L3}`, `    （λ₁ = ${L1}，λ₃ = ${L3}）`]} show={fl(f, 78)} />
      <Fx
        x={960}
        y={660}
        size={36}
        parts={['= H(m)', `^${L1}·${SH[0]} + ${L3}·${SH[2]}`, ' = H(m)', `^${EXP} mod ${TQ}`, ' = H(m)', `^${REC}`, ' = H(m)', '^x']}
        show={fl(f, 102)}
      />
      <Mark x={1512} y={660} ok show={fl(f, 120)} s={4} />
      {fl(f, 132) && (
        <Txt x={960} y={756} size={36} color={T.ink}>
          任意 2 份即可在指数上插值；完整私钥从未出现
        </Txt>
      )}
    </g>
  );
};

export const SigBlsCues: Cue[] = [
  [12, 'blip', 67],
  [24, 'blip', 71],
  [36, 'whoosh'],
  [84, 'blip', 76],
  [108, 'chime'],
  [P2, 'step'],
  [P2 + 12, 'type'],
  [P2 + 96, 'type'],
  [P2 + 120, 'chime'],
  [P3, 'step'],
  [P3 + 60, 'whoosh'],
  [P3 + 93, 'bell', 72],
  [P4, 'step'],
  [P4 + 42, 'blip', 74],
  [P4 + 102, 'type'],
  [P4 + 120, 'bell', 79],
];
