import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import {ALICE, BOB, SpriteG} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption} from '../components/ui';
import {FONT} from '../theme';
import {fl, Fx, Mark, Pill, sp, T} from './sig_lib';

/* ====================================================================== */
/* Schnorr identification → Fiat–Shamir signature                          */
/* ====================================================================== */

const LANE = [270, 366, 462];
const LT = [60, 150, 240]; // message send frames
const CHK = [330, 366, 402, 438]; // algebra reveal
const FS = 486; // Fiat–Shamir phase
const SIG = 600;
const VER = 672;
const LAST = 744;

export const SigSchnorr: React.FC = () => {
  const f = useF();
  const fs = f >= FS;
  const L0 = 336;
  const L1 = 1584;
  const lanes = [
    {dir: 1, at: LT[0], w: 384, parts: ['R = g', '^k', '  (k 随机)']},
    {dir: -1, at: LT[1], w: fs ? 312 : 264, parts: [fs ? 'c = H(R, m)' : 'c  (随机挑战)']},
    {dir: 1, at: LT[2], w: 288, parts: ['s = k + c·x']},
  ];
  const nChk = f >= CHK[3] ? 12 : f >= CHK[2] ? 10 : f >= CHK[1] ? 4 : f >= CHK[0] ? 2 : 0;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {/* prover */}
        {fl(f, 0) && (
          <g>
            <SpriteG map={ALICE} x={168} y={258} s={12} accent={T.sub} />
            <Txt x={228} y={510} size={36} color={T.ink}>
              证明者 P
            </Txt>
            <Txt x={228} y={558} size={24} color={T.sub}>
              {fs ? '签名消息 m' : '知道秘密 x'}
            </Txt>
          </g>
        )}
        {/* verifier → hash */}
        {fl(f, 12) && !fs && (
          <g>
            <SpriteG map={BOB} x={1632} y={258} s={12} accent={T.sub} />
            <Txt x={1692} y={510} size={36} color={T.ink}>
              验证者 V
            </Txt>
            <Fx x={1692} y={558} size={24} color={T.sub} parts={['X = g', '^x']} />
          </g>
        )}
        {fs && fl(f, FS) && (
          <g>
            <rect x={1620} y={258} width={144} height={168} fill={T.inv} />
            <Txt x={1692} y={344} size={72} color={T.invText} family={FONT.pixelMono}>
              H
            </Txt>
            <Txt x={1692} y={510} size={36} color={T.ink}>
              哈希函数
            </Txt>
            <Txt x={1692} y={558} size={24} color={T.sub}>
              代替 V 出挑战
            </Txt>
          </g>
        )}
        {/* the three moves */}
        {lanes.map((ln, i) => {
          if (f < ln.at) return null;
          const t = sp(f, ln.at, 36);
          const from = ln.dir > 0 ? L0 : L1;
          const to = ln.dir > 0 ? L1 : L0;
          return (
            <g key={i}>
              <Arrow pts={[[from, LANE[i]], [to, LANE[i]]]} t={t} color={T.ink} w={3} head={15} glow={false} />
              {t >= 1 && (
                <g>
                  <rect x={960 - ln.w / 2} y={LANE[i] - 27} width={ln.w} height={54} fill={i === 1 && fs ? T.inv : T.paper} stroke={T.ink} strokeWidth={3} />
                  <Fx x={960} y={LANE[i] + 2} size={36} color={i === 1 && fs ? T.invText : T.ink} parts={ln.parts} />
                </g>
              )}
            </g>
          );
        })}
        {/* phase A: verifier's check */}
        {!fs && nChk > 0 && (
          <g>
            <Txt x={960} y={600} size={24} color={T.sub}>
              V 检查
            </Txt>
            <Fx x={960} y={666} size={48} n={nChk} parts={['g', '^s', ' = g', '^k + c·x', ' = g', '^k', ' · (g', '^x', ')', '^c', ' = R · X', '^c']} />
          </g>
        )}
        {!fs && fl(f, CHK[3] + 18) && (
          <g>
            <Mark x={798} y={756} ok show s={4} />
            <Txt x={984} y={756} size={36} color={T.ink}>
              等式成立，V 接受
            </Txt>
          </g>
        )}
        {/* phase B: Fiat–Shamir */}
        {fs && fl(f, SIG) && (
          <g>
            <rect x={738} y={600} width={444} height={84} fill={T.inv} />
            <Txt x={960} y={644} size={48} color={T.invText} family={FONT.pixelMono}>
              σ = (R, s)
            </Txt>
          </g>
        )}
        {fs && fl(f, VER) && <Fx x={960} y={744} size={36} color={T.ink} parts={['任何人可验：c = H(R, m)，g', '^s', ' = R · X', '^c']} />}
        {fs && fl(f, LAST) && (
          <Txt x={960} y={816} size={24} color={T.sub}>
            交互证明 ⟶ 非交互签名（Fiat–Shamir 1986 · Schnorr 1989）
          </Txt>
        )}
      </svg>
      <Caption title="Schnorr 签名" en="FIAT–SHAMIR" desc="把交互证明里的随机挑战换成哈希，就得到签名" color={T.act} />
    </AbsoluteFill>
  );
};

export const SigSchnorrCues: Cue[] = [
  [0, 'blip', 67],
  [12, 'blip', 71],
  ...LT.map((t, i): Cue => [t, 'whoosh', 60 + i]),
  ...LT.map((t, i): Cue => [t + 36, 'blip', 72 + i * 3]),
  ...CHK.map((t, i): Cue => [t, 'tick', 70 + i]),
  [CHK[3] + 18, 'chime'],
  [FS, 'riser2'],
  [SIG, 'bell', 72],
  [VER, 'type'],
  [LAST, 'chime'],
];
