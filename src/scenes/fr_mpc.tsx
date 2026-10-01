import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, BOB, LOCK, SAGE, SpriteG} from '../components/pixel';
import {Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption} from '../components/ui';
import {clamp01, COL, FONT, rnd} from '../theme';
import {Frame, Mark, mod, on, Tag} from './zk_util';

const INK = COL.text;
const M = FONT.pixelMono;

/* ====================================================================== */
/* toy numbers mod 97 (all computed)                                        */
/* ====================================================================== */
const P = 97;
const SAL = [23, 41, 18]; // private inputs
const SH = SAL.map((x, i) => {
  const s1 = Math.floor(rnd(i * 3.17 + 1) * P);
  const s2 = Math.floor(rnd(i * 5.29 + 2) * P);
  return [s1, s2, mod(x - s1 - s2, P)];
}); // SH[owner][holder]
const COLSUM = [0, 1, 2].map((j) => mod(SH[0][j] + SH[1][j] + SH[2][j], P));
const TOTAL = mod(COLSUM[0] + COLSUM[1] + COLSUM[2], P);
const TRUE_TOTAL = SAL[0] + SAL[1] + SAL[2];
const AVG = TRUE_TOTAL / 3;

// Beaver multiplication of x = SAL[0], y = SAL[1]
const BX = SAL[0];
const BY = SAL[1];
const TA = 15;
const TB = 62;
const TC = mod(TA * TB, P);
const share3 = (v: number, seed: number) => {
  const s1 = Math.floor(rnd(seed * 1.91 + 7) * P);
  const s2 = Math.floor(rnd(seed * 2.63 + 9) * P);
  return [s1, s2, mod(v - s1 - s2, P)];
};
const SA = share3(TA, 1);
const SB = share3(TB, 2);
const SC = share3(TC, 3);
const D = mod(BX - TA, P);
const E = mod(BY - TB, P);
const Z = [0, 1, 2].map((i) => mod(SC[i] + D * SB[i] + E * SA[i] + (i === 0 ? D * E : 0), P));
const ZSUM = mod(Z[0] + Z[1] + Z[2], P);
const PROD = mod(BX * BY, P);
const BEAVER_OK = ZSUM === PROD;
const SUM_OK = TOTAL === TRUE_TOTAL; // total < p, so it is recovered exactly

const P2 = 216;
const P3 = 546;
const P4 = 846;

/* ---------- phase 1: the question ---------- */
const Question: React.FC<{f: number}> = ({f}) => (
  <g>
    {f >= 6 && <SpriteG map={ALICE} x={420} y={240} s={12} accent={INK} />}
    {f >= 12 && <SpriteG map={BOB} x={1380} y={240} s={12} accent={COL.dim} />}
    {f >= 24 && <SpriteG map={LOCK} x={558} y={300} s={6} accent={INK} />}
    {f >= 24 && <SpriteG map={LOCK} x={1302} y={300} s={6} accent={INK} />}
    {on(f, 30) && (
      <Txt x={960} y={300} size={60}>
        谁更富有？
      </Txt>
    )}
    {on(f, 48) && (
      <Txt x={960} y={456} size={36} color={COL.sub}>
        Yao 1982：百万富翁问题——谁也不说出自己的财产
      </Txt>
    )}
    {on(f, 96) && <Tag x={240} y={534} w={1440} h={96} text="n 方各持 xᵢ，共同算出 y = f(x₁, …, xₙ)，除 y 之外一无所知" size={36} inv />}
    {on(f, 144) && (
      <Txt x={960} y={714} size={36}>
        混淆电路 Yao 1986 · GMW 1987 · BGW 1988
      </Txt>
    )}
  </g>
);

/* ---------- phase 2: additive sharing + local addition ---------- */
const CX = [834, 1158, 1482];
const CWD = 192;
const ROWY = [324, 402, 480];
const SPR = [ALICE, BOB, SAGE];
const Sharing: React.FC<{f: number}> = ({f}) => {
  const s = f - P2;
  return (
    <g>
      {[0, 1, 2].map((j) =>
        s >= j * 6 ? (
          <g key={j}>
            <SpriteG map={SPR[j]} x={CX[j] - 30} y={168} s={6} accent={j === 1 ? COL.dim : INK} />
            <Txt x={CX[j]} y={282} size={24} family={M} color={COL.sub}>
              {`P${'₁₂₃'[j]} 持有`}
            </Txt>
          </g>
        ) : null,
      )}
      {SAL.map((x, i) =>
        on(s, 18 + i * 24) ? (
          <g key={i}>
            <Txt x={300} y={ROWY[i] + 33} size={36} anchor="start" family={M}>
              {`x${'₁₂₃'[i]} = ${x}`}
            </Txt>
            <Arrow pts={[[516, ROWY[i] + 33], [CX[0] - CWD / 2 - 18, ROWY[i] + 33]]} t={clamp01((s - 30 - i * 24) / 12)} color={COL.dim} w={3} head={12} glow={false} />
            {[0, 1, 2].map((j) => (s >= 36 + i * 24 + j * 3 ? <Tag key={j} x={CX[j] - CWD / 2} y={ROWY[i]} w={CWD} h={66} text={SH[i][j]} family={M} /> : null))}
          </g>
        ) : null,
      )}
      {on(s, 108) && (
        <Txt x={120} y={204} size={36} anchor="start">
          每人拆成 3 份随机份额（mod 97）
        </Txt>
      )}
      {on(s, 132) && (
        <Txt x={300} y={606} size={24} anchor="start" color={COL.sub}>
          各自在本地相加
        </Txt>
      )}
      {[0, 1, 2].map((j) =>
        s >= 144 + j * 6 ? (
          <g key={j}>
            <rect x={CX[j] - CWD / 2} y={564} width={CWD} height={3} fill={INK} />
            <Tag x={CX[j] - CWD / 2} y={582} w={CWD} h={66} text={COLSUM[j]} family={M} inv />
          </g>
        ) : null,
      )}
      {on(s, 186) && <Tag x={300} y={696} w={1374} h={84} text={`${COLSUM.join(' + ')} ≡ ${TOTAL} (mod 97)：总和 ${TOTAL}，平均 ≈ ${AVG.toFixed(1)}`} size={36} family={M} inv />}
      {on(s, 228) && (
        <Txt x={960} y={822} size={24} color={COL.sub}>
          任何两份份额都是均匀随机数：加法不需要通信，也不泄露个人
        </Txt>
      )}
    </g>
  );
};

/* ---------- phase 3: Beaver multiplication ---------- */
const Beaver: React.FC<{f: number}> = ({f}) => {
  const s = f - P3;
  return (
    <g>
      {on(s, 0) && (
        <Txt x={120} y={204} size={36} anchor="start">
          乘法需要帮手：Beaver 三元组 (a, b, c = a·b)，事先秘密共享
        </Txt>
      )}
      {on(s, 24) && (
        <Txt x={120} y={288} size={36} anchor="start" family={M}>
          {`x = ${BX}，y = ${BY}；a = ${TA}，b = ${TB}，c = ${TC}`}
        </Txt>
      )}
      {on(s, 48) && (
        <Txt x={120} y={366} size={36} anchor="start" family={M}>
          {`公开 d = x − a = ${D}，e = y − b ≡ ${E}`}
        </Txt>
      )}
      {on(s, 66) && (
        <Txt x={1236} y={366} size={24} anchor="start" color={COL.sub}>
          a、b 均匀随机 → d、e 不泄露 x、y
        </Txt>
      )}
      {on(s, 96) && <Tag x={120} y={426} w={1110} h={96} text="[xy] = [c] + d·[b] + e·[a] + d·e" size={48} family={M} inv />}
      {on(s, 108) && (
        <Txt x={1272} y={474} size={24} anchor="start" color={COL.sub}>
          只用本地运算；d·e 由 P₁ 加上
        </Txt>
      )}
      {[0, 1, 2].map((i) =>
        s >= 144 + i * 9 ? (
          <g key={i}>
            <SpriteG map={SPR[i]} x={186 + i * 336} y={576} s={6} accent={i === 1 ? COL.dim : INK} />
            <Tag x={270 + i * 336} y={594} w={204} h={66} text={`[xy]${'₁₂₃'[i]} = ${Z[i]}`} size={24} family={M} />
          </g>
        ) : null,
      )}
      {on(s, 186) && (
        <g>
          <Txt x={1236} y={627} size={36} anchor="start" family={M}>
            {`${Z.join(' + ')} ≡ ${ZSUM}`}
          </Txt>
          <Txt x={120} y={768} size={48} anchor="start" family={M}>
            {`= ${BX} × ${BY} mod 97 = ${PROD}`}
          </Txt>
          <Mark x={858} y={768} ok={BEAVER_OK} s={60} />
        </g>
      )}
    </g>
  );
};

/* ---------- phase 4: close ---------- */
const Close: React.FC<{f: number}> = ({f}) => {
  const s = f - P4;
  return (
    <g>
      {on(s, 6) && (
        <Txt x={120} y={228} size={36} anchor="start">
          半诚实：照章执行，只是好奇　·　恶意：任意偏离 → 需要承诺、零知识与校验
        </Txt>
      )}
      {on(s, 36) && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <SpriteG key={i} map={i % 2 ? BOB : ALICE} x={216 + i * 96} y={420} s={6} accent={i % 2 ? COL.dim : INK} />
          ))}
          <Arrow pts={[[720, 432], [960, 372]]} t={1} color={INK} w={3} head={12} glow={false} />
          <Arrow pts={[[720, 516], [960, 576]]} t={1} color={INK} w={3} head={12} glow={false} />
          <Frame x={984} y={318} w={360} h={108} />
          <Frame x={984} y={522} w={360} h={108} />
          <Txt x={1164} y={372} size={36}>
            服务器 A
          </Txt>
          <Txt x={1164} y={576} size={36}>
            服务器 B
          </Txt>
          <Txt x={1416} y={474} size={36} anchor="start">
            互不串通
          </Txt>
        </g>
      )}
      {on(s, 60) && (
        <Txt x={960} y={720} size={36}>
          隐私统计：每人上传两份份额，服务器只能算出总和
        </Txt>
      )}
    </g>
  );
};

export const FrMpc: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {f < P2 && <Question f={f} />}
        {f >= P2 && f < P3 && <Sharing f={f} />}
        {f >= P3 && f < P4 && <Beaver f={f} />}
        {f >= P4 && <Close f={f} />}
      </svg>
      <Caption title="安全多方计算" en="SECURE MULTI-PARTY COMPUTATION" desc="各自守住输入，一起算出结果：加法本地完成，乘法借助 Beaver 三元组" color={COL.fr} />
    </AbsoluteFill>
  );
};

export const FR_MPC_STATS = {SAL, SH, COLSUM, TOTAL, SUM_OK, AVG, TA, TB, TC, D, E, SA, SB, SC, Z, ZSUM, PROD, BEAVER_OK};

export const FrMpcCues: Cue[] = [
  [6, 'whoosh'],
  [30, 'blip', 72],
  [96, 'bell', 79],
  [P2, 'whoosh'],
  ...[0, 1, 2].map((i): Cue => [P2 + 36 + i * 24, 'tick']),
  ...[0, 1, 2].map((j): Cue => [P2 + 144 + j * 6, 'blip', 72 + j * 3]),
  [P2 + 186, 'chime'],
  [P3, 'whoosh'],
  [P3 + 48, 'blip', 76],
  [P3 + 96, 'step'],
  [P3 + 186, 'reveal'],
  [P4, 'riser2'],
];
