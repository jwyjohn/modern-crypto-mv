import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, SpriteG} from '../components/pixel';
import {Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption} from '../components/ui';
import {clamp01, COL, FONT, rnd} from '../theme';
import {Frame, Mark, on, Tag} from './zk_util';

const INK = COL.text;
const M = FONT.pixelMono;

/* ---------- 2-server XOR PIR (computed) ---------- */
const NB = 16;
const DB = new Array(NB).fill(0).map((_, j) => (rnd(j * 3.77 + 21) < 0.5 ? 1 : 0));
const IDX = 6;
const S1 = new Array(NB).fill(0).map((_, j) => (rnd(j * 5.13 + 87) < 0.5 ? 1 : 0));
const S2 = S1.map((b, j) => (j === IDX ? 1 - b : b));
const xorSel = (sel: number[]) => sel.reduce((acc, b, j) => acc ^ (b & DB[j]), 0);
const A1 = xorSel(S1);
const A2 = xorSel(S2);
const OUT = A1 ^ A2;
const OK = OUT === DB[IDX];

const CW = 42;
const STEP = 48;
const BX = [126, 1038];
const T_Q = 96; // queries appear at client
const T_UP = 168; // queries sent
const T_ANS = 264; // servers answer
const T_DOWN = 330;
const T_RES = 390;
const T_PRIV = 474;

const Row: React.FC<{x: number; y: number; bits: number[]; h?: number; mark?: number; label?: boolean}> = ({x, y, bits, h = CW, mark, label}) => (
  <g>
    {bits.map((b, j) => (
      <g key={j}>
        <rect x={x + j * STEP + 1.5} y={y + 1.5} width={CW - 3} height={h - 3} fill={b ? COL.inv : COL.panel} stroke={j === mark ? COL.red : INK} strokeWidth={j === mark ? 6 : 3} />
        {label && (
          <text x={x + j * STEP + CW / 2} y={y + h / 2 + 2} textAnchor="middle" dominantBaseline="middle" fontFamily={M} fontSize={24} fill={b ? COL.invText : INK}>
            {b}
          </text>
        )}
      </g>
    ))}
  </g>
);

const Server: React.FC<{k: number; f: number}> = ({k, f}) => {
  const x = BX[k] - 30;
  const q = k === 0 ? S1 : S2;
  const a = k === 0 ? A1 : A2;
  return (
    <g>
      <Frame x={x} y={186} w={822} h={276} />
      <Txt x={x + 30} y={228} size={36} anchor="start">
        {`服务器 ${k + 1}`}
      </Txt>
      <Txt x={x + 792} y={228} size={24} anchor="end" color={COL.sub}>
        同一份数据库
      </Txt>
      <Row x={BX[k]} y={264} bits={DB} label />
      {f >= T_UP + 24 && <Row x={BX[k]} y={330} bits={q} h={24} />}
      {on(f, T_UP + 24) && (
        <Txt x={x + 30} y={408} size={24} anchor="start" color={COL.sub}>
          {k === 0 ? '收到 S：把选中的位异或' : '收到 S ⊕ {i}：把选中的位异或'}
        </Txt>
      )}
      {on(f, T_ANS) && <Tag x={x + 600} y={384} w={192} h={60} text={`a${k === 0 ? '₁' : '₂'} = ${a}`} family={M} inv />}
    </g>
  );
};

export const FrPir: React.FC = () => {
  const f = useF();
  const priv = f >= T_PRIV;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        <Server k={0} f={f} />
        <Server k={1} f={f} />
        {/* client */}
        {!priv && f >= 12 && <SpriteG map={ALICE} x={900} y={600} s={12} accent={INK} />}
        {on(f, 24, T_UP) && (
          <Txt x={960} y={522} size={36}>
            {`我想要第 i = ${IDX + 1} 位，但不想让服务器知道 i`}
          </Txt>
        )}
        {!priv && f >= T_Q && (
          <g>
            <Row x={BX[0]} y={600} bits={S1} h={36} />
            <Txt x={BX[0]} y={678} size={24} anchor="start" color={COL.sub}>
              S：随机子集
            </Txt>
            {f >= T_Q + 24 && <Row x={BX[1]} y={600} bits={S2} h={36} mark={IDX} />}
            {on(f, T_Q + 24) && (
              <Txt x={BX[1]} y={678} size={24} anchor="start" color={COL.sub}>
                {`S ⊕ {i}：只在第 ${IDX + 1} 位不同`}
              </Txt>
            )}
          </g>
        )}
        {!priv &&
          [0, 1].map((k) => (
            <g key={k}>
              <Arrow pts={[[BX[k] + 360, 588], [BX[k] + 360, 474]]} t={clamp01((f - T_UP) / 18)} color={INK} w={6} glow={false} />
              <Arrow pts={[[BX[k] + 456, 474], [BX[k] + 456, 588]]} t={clamp01((f - T_DOWN) / 18)} color={INK} w={6} glow={false} />
            </g>
          ))}
        {!priv && on(f, T_RES) && (
          <g>
            <Tag x={432} y={774} w={936} h={78} text={`a₁ ⊕ a₂ = ${A1} ⊕ ${A2} = ${OUT} = 第 ${IDX + 1} 位`} size={36} family={M} inv />
            <Mark x={1416} y={813} ok={OK} s={60} />
          </g>
        )}
        {/* privacy */}
        {priv && (
          <g>
            {on(f, T_PRIV) && (
              <Txt x={510} y={540} size={36}>
                服务器 1 只看到 S：均匀随机
              </Txt>
            )}
            {on(f, T_PRIV + 24) && (
              <Txt x={1422} y={540} size={36}>
                服务器 2 只看到 S ⊕ {'{i}'}：也均匀随机
              </Txt>
            )}
            {on(f, T_PRIV + 72) && <Tag x={360} y={630} w={1200} h={84} text="只要两台服务器不串通，谁也不知道 i" size={36} inv />}
            {on(f, T_PRIV + 120) && (
              <Txt x={960} y={786} size={24} color={COL.sub}>
                {`数据排成 √n × √n 的方阵，查询量可降到 O(√n)`}
              </Txt>
            )}
          </g>
        )}
      </svg>
      <Caption title="隐私信息检索" en="PRIVATE INFORMATION RETRIEVAL" desc="向服务器取数据，却不让它知道你取的是哪一条" color={COL.fr} />
    </AbsoluteFill>
  );
};

export const FR_PIR_STATS = {DB, S1, S2, A1, A2, OUT, OK};

export const FrPirCues: Cue[] = [
  [6, 'whoosh'],
  [T_Q, 'tick'],
  [T_Q + 24, 'blip', 76],
  [T_UP, 'whoosh'],
  [T_ANS, 'blip', 72],
  [T_ANS + 6, 'blip', 79],
  [T_RES, 'bell', 84],
  [T_PRIV, 'step'],
  [T_PRIV + 72, 'chime'],
];
