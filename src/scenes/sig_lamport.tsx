import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import {ALICE, SpriteG} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption} from '../components/ui';
import {FONT, snap} from '../theme';
import {fl, hx, Mark, scramble, sp, SubT, T} from './sig_lib';

/* shared Lamport toy key material (n = 4) */
export const LX = (i: number, b: number) => hx(`lamport-sk-${i}-${b}`, 4);
export const LY = (i: number, b: number) => hx(`H:${LX(i, b)}`, 4);

const COLX = (i: number) => 600 + i * 240;
const CW = 168;
const CH = 60;
const ROW_SK = [312, 396];
const ROW_PK = [540, 624];
const ROW_SIG = 768;
const MSG = [0, 1, 0, 1];
const KEYT = (k: number) => 24 + k * 6; // sk cell appears
const HT = (k: number) => 114 + k * 15; // hash drop
const MT = 288; // message appears
const ST = (i: number) => 318 + i * 36; // sign pick
const VT = (i: number) => 492 + i * 36; // verify climb
const NOTE = 660;

type Mode = 'line' | 'inv' | 'dim' | 'bold';
const HexCell: React.FC<{x: number; y: number; text: string; mode: Mode; show: boolean}> = ({x, y, text, mode, show}) => {
  if (!show) return null;
  const X = snap(x - CW / 2);
  const Y = snap(y - CH / 2);
  const fill = mode === 'inv' ? T.inv : T.paper;
  const stroke = mode === 'dim' ? T.line : T.ink;
  const tc = mode === 'inv' ? T.invText : mode === 'dim' ? T.dim : T.ink;
  return (
    <g>
      <rect x={X} y={Y} width={CW} height={CH} fill={fill} stroke={stroke} strokeWidth={mode === 'bold' ? 6 : 3} />
      <text x={X + CW / 2} y={Y + CH / 2 + 2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={36} fill={tc}>
        {text}
      </text>
    </g>
  );
};

/** short vertical arrow in the gap between blocks, labelled H */
const HArrow: React.FC<{x: number; y0: number; y1: number; show: boolean; t: number}> = ({x, y0, y1, show, t}) =>
  show ? (
    <g>
      <Arrow pts={[[x, y0], [x, y1]]} t={t} color={T.ink} w={3} head={12} glow={false} />
      <Txt x={x + 30} y={(y0 + y1) / 2} size={24} color={T.sub} family={FONT.pixelMono}>
        H
      </Txt>
    </g>
  ) : null;

export const SigLamport: React.FC = () => {
  const f = useF();
  const vDone = fl(f, VT(3) + 42);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {/* one-way function header, then the message */}
        {f < MT && fl(f, 0) && (
          <Txt x={960} y={210} size={36} color={T.ink} family={FONT.pixelMono}>
            单向函数 H：x ⟶ H(x) 容易，反过来难
          </Txt>
        )}
        {f >= MT && (
          <g>
            <Txt x={456} y={210} size={36} anchor="end" color={T.ink} family={FONT.pixelMono}>
              m =
            </Txt>
            {MSG.map((b, i) =>
              fl(f, MT + i * 6) ? (
                <g key={i}>
                  <rect x={COLX(i) - 27} y={183} width={54} height={54} fill={f >= ST(i) ? T.inv : T.paper} stroke={T.ink} strokeWidth={3} />
                  <Txt x={COLX(i)} y={212} size={36} color={f >= ST(i) ? T.invText : T.ink} family={FONT.pixelMono}>
                    {b}
                  </Txt>
                </g>
              ) : null,
            )}
          </g>
        )}
        {/* group labels */}
        {fl(f, 18) && (
          <g>
            <Txt x={408} y={354} size={48} anchor="end" color={T.ink} family={FONT.pixelMono}>
              sk
            </Txt>
            <Txt x={480} y={ROW_SK[0]} size={24} color={T.dim} family={FONT.pixelMono}>
              0
            </Txt>
            <Txt x={480} y={ROW_SK[1]} size={24} color={T.dim} family={FONT.pixelMono}>
              1
            </Txt>
          </g>
        )}
        {fl(f, HT(0) + 12) && (
          <g>
            <Txt x={408} y={582} size={48} anchor="end" color={T.ink} family={FONT.pixelMono}>
              pk
            </Txt>
            <Txt x={480} y={ROW_PK[0]} size={24} color={T.dim} family={FONT.pixelMono}>
              0
            </Txt>
            <Txt x={480} y={ROW_PK[1]} size={24} color={T.dim} family={FONT.pixelMono}>
              1
            </Txt>
          </g>
        )}
        {fl(f, ST(0)) && (
          <g>
            <Txt x={408} y={ROW_SIG} size={48} anchor="end" color={T.ink} family={FONT.pixelMono}>
              σ
            </Txt>
            <SpriteG map={ALICE} x={192} y={726} s={6} accent={T.sub} />
          </g>
        )}
        {/* sk cells */}
        {[0, 1, 2, 3].map((i) =>
          [0, 1].map((b) => {
            const k = i * 2 + b;
            const picked = MSG[i] === b;
            const signed = f >= ST(i);
            return (
              <HexCell
                key={`s${k}`}
                x={COLX(i)}
                y={ROW_SK[b]}
                text={scramble(LX(i, b), f, KEYT(k) + 24, k)}
                mode={signed ? (picked ? 'bold' : 'dim') : 'line'}
                show={fl(f, KEYT(k))}
              />
            );
          }),
        )}
        {/* pk cells */}
        {[0, 1, 2, 3].map((i) =>
          [0, 1].map((b) => {
            const k = i * 2 + b;
            const hit = MSG[i] === b && f >= VT(i) + 24;
            return (
              <g key={`p${k}`}>
                <HexCell x={COLX(i)} y={ROW_PK[b]} text={scramble(LY(i, b), f, HT(k) + 24, k + 40)} mode={hit ? 'inv' : 'line'} show={f >= HT(k) + 12} />
                <Mark x={COLX(i) + CW / 2 + 24} y={ROW_PK[b]} ok show={hit} s={4} />
              </g>
            );
          }),
        )}
        {/* hash: sk block -> pk block */}
        {[0, 1, 2, 3].map((i) => (
          <HArrow key={`h${i}`} x={COLX(i)} y0={438} y1={498} show={f >= HT(2 * i)} t={sp(f, HT(2 * i), 15)} />
        ))}
        {/* signature: reveal the chosen preimages */}
        {[0, 1, 2, 3].map((i) => (
          <HexCell key={`g${i}`} x={COLX(i)} y={ROW_SIG} text={LX(i, MSG[i])} mode="inv" show={fl(f, ST(i) + 12)} />
        ))}
        {/* verification: hash each revealed piece, compare with pk row m_i */}
        {[0, 1, 2, 3].map((i) => (
          <HArrow key={`v${i}`} x={COLX(i)} y0={726} y1={666} show={f >= VT(i)} t={sp(f, VT(i), 18)} />
        ))}
        {/* right column notes */}
        {vDone && f < NOTE && (
          <Txt x={1488} y={ROW_SIG} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
            Vfy = 1 ✓
          </Txt>
        )}
        {fl(f, NOTE) && (
          <g>
            <Txt x={1488} y={312} size={36} anchor="start" color={T.red}>
              一半私钥已公开
            </Txt>
            <Txt x={1488} y={372} size={36} anchor="start" color={T.red}>
              只能签这一次
            </Txt>
          </g>
        )}
        {fl(f, NOTE + 60) && (
          <g>
            <rect x={1488} y={510} width={312} height={3} fill={T.line} />
            <SubT x={1488} y={558} base="实际签 H(m)" size={24} anchor="start" color={T.sub} family={FONT.pixel} />
            <Txt x={1488} y={606} size={24} anchor="start" color={T.sub} family={FONT.pixelMono}>
              n = 256 位
            </Txt>
            <Txt x={1488} y={654} size={24} anchor="start" color={T.sub} family={FONT.pixelMono}>
              pk = 16 KB
            </Txt>
            <Txt x={1488} y={702} size={24} anchor="start" color={T.sub} family={FONT.pixelMono}>
              σ = 8 KB
            </Txt>
          </g>
        )}
      </svg>
      <Caption title="Lamport 一次签名" en="ONE-TIME SIGNATURE" desc="只靠单向函数就能签名：按比特公开一半原像；但每把密钥只能用一次" color={T.act} />
    </AbsoluteFill>
  );
};

export const SigLamportCues: Cue[] = [
  [0, 'type'],
  ...[0, 2, 4, 6].map((k): Cue => [KEYT(k), 'tick']),
  ...[0, 2, 4, 6].map((k, j): Cue => [HT(k), 'blip', 64 + j * 3]),
  [MT, 'step'],
  ...[0, 1, 2, 3].map((i): Cue => [ST(i), 'blip', 72 + i * 2]),
  ...[0, 1, 2, 3].map((i): Cue => [VT(i) + 24, 'tick']),
  [VT(3) + 42, 'chime'],
  [NOTE, 'error'],
];
