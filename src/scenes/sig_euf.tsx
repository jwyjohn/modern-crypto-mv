import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import {EVE, SAGE, SpriteG} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption} from '../components/ui';
import {FONT} from '../theme';
import {Box, fl, Fx, Mark, Pill, sl, sp, T} from './sig_lib';

/* ====================================================================== */
/* EUF-CMA                                                                */
/* ====================================================================== */

const SUB = ['₁', '₂', '₃'];
const P2 = 216; // game phase starts
const PKT = 246;
const QT = [300, 360, 420]; // query start frames
const TRY = [480, 564];
const CONC = 636;

export const SigEuf: React.FC = () => {
  const f = useF();
  const ph1 = f < P2;

  /* ---------- phase 1: the interface ---------- */
  const BY = 384;
  const bx = [384, 960, 1536];
  const bw = 384;
  const skT = sp(f, 48, 36);
  const sigT = sp(f, 108, 36);
  const pkT = sp(f, 60, 54);
  const pkPath: [number, number][] = [
    [bx[0], BY + 48],
    [bx[0], 540],
    [bx[2], 540],
    [bx[2], BY + 54],
  ];

  /* ---------- phase 2: the game ---------- */
  const LX0 = 336;
  const LX1 = 1584;
  const LY = 360;
  const tryIdx = f >= TRY[1] ? 1 : f >= TRY[0] ? 0 : -1;
  const t0 = tryIdx >= 0 ? TRY[tryIdx] : 0;
  const conc = f >= CONC;
  const eveHit = (f >= TRY[0] + 42 && f < TRY[0] + 60) || (f >= TRY[1] + 42 && f < TRY[1] + 60);
  const shake = eveHit ? (Math.floor(f / 3) % 2 ? 6 : -6) : 0;

  // the one packet currently on the lane
  let lane: {x: number; text: string; mode: 'line' | 'inv' | 'red'; w: number} | null = null;
  if (f >= PKT && f < PKT + 30) lane = {x: sl(LX0 + 60, LX1 - 60, sp(f, PKT, 27)), text: 'pk', mode: 'line', w: 96};
  QT.forEach((q, i) => {
    if (f >= q && f < q + 27) lane = {x: sl(LX1 - 60, LX0 + 60, sp(f, q, 24)), text: `m${SUB[i]}`, mode: 'line', w: 96};
    if (f >= q + 27 && f < q + 54) lane = {x: sl(LX0 + 60, LX1 - 60, sp(f, q + 27, 24)), text: `σ${SUB[i]}`, mode: 'inv', w: 96};
  });
  if (tryIdx >= 0 && f < t0 + 33) lane = {x: sl(LX1 - 120, LX0 + 120, sp(f, t0, 30)), text: tryIdx === 0 ? '(m₂, σ₂)' : '(m*, σ*)', mode: tryIdx === 0 ? 'red' : 'line', w: 264};

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {ph1 && (
          <g>
            {[0, 1, 2].map((i) =>
              fl(f, 6 + i * 9) ? (
                <g key={i}>
                  <Box x={bx[i] - bw / 2} y={BY - 48} w={bw} h={96} sw={i === 2 && f >= 156 ? 6 : 3} />
                  {i === 0 ? (
                    <Fx x={bx[i]} y={BY} parts={['Gen(1', '^λ', ')']} />
                  ) : (
                    <Txt x={bx[i]} y={BY} family={FONT.pixelMono} color={T.ink}>
                      {i === 1 ? 'Sign(sk, m)' : 'Vfy(pk, m, σ)'}
                    </Txt>
                  )}
                </g>
              ) : null,
            )}
            {/* sk : Gen -> Sign */}
            <Arrow pts={[[bx[0] + bw / 2 + 12, BY + 12], [bx[1] - bw / 2 - 12, BY + 12]]} t={skT} color={T.ink} w={3} glow={false} />
            <Pill x={(bx[0] + bx[1]) / 2} y={BY - 36} w={72} text="sk" mode="inv" show={skT >= 1} />
            {/* pk : Gen -> Vfy */}
            <Arrow pts={pkPath} t={pkT} color={T.ink} w={3} glow={false} />
            <Pill x={960} y={540} w={72} text="pk" show={pkT >= 1} />
            {/* m */}
            <Pill x={bx[1]} y={BY - 102} w={48} text="m" show={fl(f, 72)} />
            <Pill x={bx[2]} y={BY - 102} w={48} text="m" show={fl(f, 78)} />
            {/* sigma : Sign -> Vfy */}
            <Arrow pts={[[bx[1] + bw / 2 + 12, BY + 12], [bx[2] - bw / 2 - 12, BY + 12]]} t={sigT} color={T.ink} w={3} glow={false} />
            <Pill x={(bx[1] + bx[2]) / 2} y={BY - 36} w={60} text="σ" mode="inv" show={sigT >= 1} />
            {/* output */}
            {fl(f, 156) && (
              <g>
                <Arrow pts={[[bx[2] + bw / 2 + 6, BY], [bx[2] + bw / 2 + 48, BY]]} t={1} color={T.ink} w={3} head={12} glow={false} />
                <Txt x={1800} y={BY} size={48} color={T.ink} family={FONT.pixelMono}>
                  1
                </Txt>
              </g>
            )}
            {fl(f, 168) && (
              <Txt x={960} y={672} size={36} color={T.sub} family={FONT.pixelMono}>
                正确性：Vfy(pk, m, Sign(sk, m)) = 1
              </Txt>
            )}
          </g>
        )}

        {!ph1 && (
          <g>
            {/* header */}
            <rect x={792} y={174} width={336} height={48} fill={T.inv} />
            <Txt x={960} y={199} size={24} color={T.invText}>
              EUF-CMA 安全实验
            </Txt>
            {/* challenger */}
            <SpriteG map={SAGE} x={168} y={258} s={12} accent={T.ink} />
            <Txt x={228} y={474} size={36} color={T.ink}>
              挑战者 𝒞
            </Txt>
            <Txt x={228} y={522} size={24} color={T.sub}>
              持有 sk
            </Txt>
            {/* adversary */}
            <g transform={`translate(${shake},0)`}>
              <SpriteG map={EVE} x={1632} y={258} s={12} />
            </g>
            <Txt x={1692} y={474} size={36} color={eveHit ? T.red : T.ink}>
              敌手 𝒜
            </Txt>
            <Txt x={1692} y={522} size={24} color={T.sub}>
              {f >= PKT + 30 ? '只拿到 pk' : '多项式时间'}
            </Txt>
            {/* lane */}
            <rect x={LX0} y={LY - 1} width={LX1 - LX0} height={3} fill={T.line} />
            {lane && <Pill size={36} h={60} x={(lane as {x: number}).x} y={LY} w={(lane as {w: number}).w} text={(lane as {text: string}).text} mode={(lane as {mode: 'line' | 'inv' | 'red'}).mode} />}
            {/* Q list */}
            {fl(f, QT[0] + 54) && (
              <g>
                <Txt x={576} y={612} size={36} anchor="end" color={T.ink} family={FONT.pixelMono}>
                  Q =
                </Txt>
                {QT.map((q, i) => {
                  const hot = tryIdx === 0 && i === 1 && f >= TRY[0] + 33;
                  const blinkOff = hot && f < TRY[0] + 60 && Math.floor(f / 6) % 2 === 1;
                  return <Pill key={i} size={36} h={60} x={672 + i * 156} y={612} w={120} text={`m${SUB[i]}`} mode={hot ? 'red' : 'line'} show={fl(f, q + 54) && !blinkOff} />;
                })}
                {fl(f, 468) && (
                  <Txt x={1104} y={612} size={36} anchor="start" color={T.dim} family={FONT.pixelMono}>
                    … （共 q 条，𝒜 自选）
                  </Txt>
                )}
              </g>
            )}
            {/* verdicts */}
            {tryIdx >= 0 && !conc && fl(f, t0 + 33) && (
              <g>
                <Txt x={792} y={720} size={36} anchor="end" color={T.ink} family={FONT.pixelMono}>
                  {tryIdx === 0 ? 'Vfy = 1' : 'm* ∉ Q'}
                </Txt>
                <Mark x={840} y={720} ok show={fl(f, t0 + 36)} s={4} />
                <Txt x={1056} y={720} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
                  {tryIdx === 0 ? 'm* ∈ Q' : 'Vfy = 0'}
                </Txt>
                <Mark x={1218} y={720} ok={false} show={fl(f, t0 + 42)} s={4} />
                {fl(f, t0 + 51) && (
                  <Txt x={960} y={792} size={36} color={T.red}>
                    {tryIdx === 0 ? '重放签过的消息，不算伪造' : '新消息却造不出合法签名'}
                  </Txt>
                )}
              </g>
            )}
            {conc && (
              <g>
                <Fx x={960} y={708} size={36} parts={['𝒜 赢  ⇔  Vfy(pk, m*, σ*) = 1  ∧  m* ∉ Q']} />
                {fl(f, CONC + 18) && (
                  <g>
                    <rect x={498} y={762} width={924} height={60} fill={T.inv} />
                    <Txt x={960} y={793} size={36} color={T.invText} family={FONT.pixelMono}>
                      安全：对任意 PPT 𝒜，Pr[𝒜 赢] ≤ negl(λ)
                    </Txt>
                  </g>
                )}
              </g>
            )}
          </g>
        )}
      </svg>
      <Caption title="EUF-CMA 安全" en="UNFORGEABILITY" desc="选择消息攻击下的存在性不可伪造：看过再多签名，也造不出新消息的签名" color={T.act} />
    </AbsoluteFill>
  );
};

export const SigEufCues: Cue[] = [
  [6, 'blip', 67],
  [15, 'blip', 71],
  [24, 'blip', 74],
  [48, 'whoosh'],
  [108, 'whoosh'],
  [156, 'chime'],
  [P2, 'step'],
  [PKT, 'whoosh'],
  ...QT.flatMap((t, i): Cue[] => [
    [t, 'tick'],
    [t + 27, 'blip', 76 + i * 3],
  ]),
  [TRY[0], 'whoosh'],
  [TRY[0] + 42, 'error'],
  [TRY[1], 'whoosh'],
  [TRY[1] + 42, 'error'],
  [CONC, 'bell', 72],
];
