import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cue, Problem, probCues} from '../components/Problem';
import {COL} from '../theme';
import {Badge, Box, HLine, T, Tx, typed} from './sym_lib';

const INK = COL.text;

/* ====================================================================== */
/* 案例 · 代数攻击：3 轮 PURE 型 Feistel，F(x) = (x + k)³ over F_101         */
/* ====================================================================== */

const P = 101; // 101 ≡ 2 (mod 3) → x³ is a permutation of F_101
const md = (v: number) => ((v % P) + P) % P;
const cube = (v: number) => md(v * v * v);
const KEY = [23, 58, 71];
/** round: (L, R) → (R, L + (R + k)³) */
const enc = (pl: number, pr: number) => {
  let L = pl;
  let R = pr;
  const mid: number[] = [];
  for (const k of KEY) {
    const nr = md(L + cube(R + k));
    L = R;
    R = nr;
    mid.push(nr);
  }
  return {c: [L, R], x: mid[0]};
};
const PAIRS = [
  [12, 34],
  [77, 5],
];
const RUN = PAIRS.map(([l, r]) => enc(l, r));
const [C1, C2] = [RUN[0].c, RUN[1].c];
const [X1, X2] = [RUN[0].x, RUN[1].x];

/* lex Gröbner basis (k1 > k2 > x1 > x2 > k3) of equations 1,2,3,4,6 — computed offline with sympy (GF(101)) */
const G5 = [1, 28, 2, -49, 34, -31, 9]; // k3^6 … k3^0
const FACT = [
  [1, -71],
  [1, 4, -14],
  [1, -6, -1, 31],
];
const G3 = [1, 44, -28, 22]; // x1 + (k3^3 + 44k3^2 − 28k3 + 22)
const G4 = [1, -16, 18, 14]; // x2 + (k3^3 − 16k3^2 + 18k3 + 14)
const G1 = [22, 3, -7, 33, -9, -35]; // k1 + h1(k3)
const evalP = (c: number[], x: number) => c.reduce((acc, a) => md(acc * x + a), 0);
const mulP = (a: number[], b: number[]) => {
  const o = new Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => (o[i + j] = md(o[i + j] + x * y))));
  return o;
};
/* runtime checks (everything on screen is derived from these) */
const ROOTS = Array.from({length: P}, (_, r) => r).filter((r) => evalP(G5, r) === 0);
const FACT_OK = FACT.reduce(mulP).every((v, i) => v === md(G5[i]));
const K3 = ROOTS[0];
const SX1 = md(-evalP(G3, K3));
const SX2 = md(-evalP(G4, K3));
const SK1 = md(-evalP(G1, K3));
const SK2 = Array.from({length: P}, (_, k) => k).filter((k) => md(C1[0] - cube(SX1 + k) - PAIRS[0][1]) === 0)[0];
const CHECK5 = md(PAIRS[1][1] + cube(SX2 + SK2)); // must equal C2[0]
export const ALG_VERIFIED = FACT_OK && ROOTS.length === 1 && SX1 === X1 && SX2 === X2 && SK1 === KEY[0] && SK2 === KEY[1] && K3 === KEY[2] && CHECK5 === C2[0];

/* higher-order differential: Δ³ of (x+k)³ along a = (1,2,3) is 6·1·2·3 for every x, k */
const D3 = (x: number, k: number, a: number[]) => {
  let s = 0;
  for (let m = 0; m < 8; m++) {
    let off = 0;
    let bits = 0;
    a.forEach((v, i) => {
      if ((m >> i) & 1) {
        off += v;
        bits++;
      }
    });
    s += (3 - bits) % 2 ? -cube(x + off + k) : cube(x + off + k);
  }
  return md(s);
};
const HOD = [
  [5, 23],
  [40, 58],
  [88, 71],
].map(([x, k]) => ({x, k, v: D3(x, k, [1, 2, 3])}));

const EQS = [
  `(1) x₁ = ${PAIRS[0][0]} + (${PAIRS[0][1]} + k₁)³`,
  `(2) ${C1[0]} = ${PAIRS[0][1]} + (x₁ + k₂)³`,
  `(3) ${C1[1]} = x₁ + (${C1[0]} + k₃)³`,
  `(4) x₂ = ${PAIRS[1][0]} + (${PAIRS[1][1]} + k₁)³`,
  `(5) ${C2[0]} = ${PAIRS[1][1]} + (x₂ + k₂)³`,
  `(6) ${C2[1]} = x₂ + (${C2[0]} + k₃)³`,
];
const BASIS = [
  'k₁ + h₁(k₃)　　　　（h₁ 为 5 次）',
  'k₂³ + …　　　　　　（k₂ 的三次，系数含 k₃）',
  'x₁ + k₃³ + 44k₃² − 28k₃ + 22',
  'x₂ + k₃³ − 16k₃² + 18k₃ + 14',
  'k₃⁶ + 28k₃⁵ + 2k₃⁴ − 49k₃³ + 34k₃² − 31k₃ + 9',
];

const ALG = {
  card: 330,
  reveal: 900,
  steps: [
    {at: 0, label: '写成方程'},
    {at: 210, label: '第二对明密文'},
    {at: 400, label: 'Gröbner 基'},
    {at: 600, label: '求根回代'},
    {at: 770, label: '高阶差分'},
  ],
};

export const SymAlgebraic: React.FC = () => (
  <Problem
    no={2}
    color={INK}
    tag="对称密码 · 代数攻击"
    title="代数攻击"
    brief="低次多项式：方程组直接解出密钥"
    q={[
      ['PURE 是一个 Feistel 密码，轮函数只是 ', {t: '(x + kᵢ)³', m: true}, '，'],
      ['它可证明抵抗差分与线性分析，但代数次数太低。'],
      ['把每一轮写成方程，', {t: '整个密码就是一个可解的方程组', c: COL.red}, '。'],
    ]}
    answerText="6 个方程、5 个未知数：密钥被直接解出"
    insight="3 轮 PURE 的 96 位密钥在笔记本上不到 1 秒即被解出。低代数次数很危险——AES 的 S 盒用 GF(2⁸) 求逆，次数高达 254。"
    {...ALG}
  >
    {(sf) => <AlgStage sf={sf} />}
  </Problem>
);

/* 3-round Feistel ladder on the left */
const Ladder: React.FC<{sf: number}> = ({sf}) => {
  const LX = 216;
  const RX = 456;
  const RY = [336, 486, 636];
  return (
    <g>
      <Tx x={LX} y={282} size={24} mono c={T.sub}>p_L</Tx>
      <Tx x={RX} y={282} size={24} mono c={T.sub}>p_R</Tx>
      {RY.map((y, r) => (
        <g key={r}>
          <line x1={LX} y1={r === 0 ? 300 : RY[r - 1] + 108} x2={LX} y2={y + 36} stroke={INK} strokeWidth={3} />
          <line x1={RX} y1={r === 0 ? 300 : RY[r - 1] + 108} x2={RX} y2={y + 36} stroke={INK} strokeWidth={3} />
          <Box x={270} y={y - 24} w={132} h={48} inv={sf >= 400 && sf < 600} />
          <Tx x={336} y={y + 2} size={24} mono c={sf >= 400 && sf < 600 ? T.invText : INK}>(·+k{'₁₂₃'[r]})³</Tx>
          <line x1={402} y1={y} x2={RX} y2={y} stroke={INK} strokeWidth={3} />
          <line x1={LX} y1={y} x2={270} y2={y} stroke={INK} strokeWidth={3} />
          <rect x={LX - 12} y={y - 12} width={24} height={24} fill={T.paper} stroke={INK} strokeWidth={3} />
          <Tx x={LX} y={y + 2} size={24} mono>+</Tx>
          {/* swap */}
          <line x1={LX} y1={y + 36} x2={RX} y2={y + 108} stroke={INK} strokeWidth={3} />
          <line x1={RX} y1={y + 36} x2={LX} y2={y + 108} stroke={INK} strokeWidth={3} />
        </g>
      ))}
      <Tx x={RX + 36} y={RY[0] + 114} size={24} mono a="start" c={T.red}>x</Tx>
      <Tx x={LX} y={768} size={24} mono c={T.sub}>c_L</Tx>
      <Tx x={RX} y={768} size={24} mono c={T.sub}>c_R</Tx>
    </g>
  );
};

const AlgStage: React.FC<{sf: number}> = ({sf}) => {
  const RXT = 648;
  const phase = sf < 400 ? 0 : sf < 600 ? 1 : sf < 770 ? 2 : 3;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        <Ladder sf={sf} />
        {phase === 0 && (
          <>
            <Tx x={RXT} y={282} size={28} a="start" c={T.sub}>在 F₁₀₁ 上（101 ≡ 2 mod 3，x³ 是置换）</Tx>
            {EQS.map((e, i) => {
              const at = i < 3 ? 30 + i * 40 : 230 + (i - 3) * 40;
              if (sf < at) return null;
              return (
                <Tx key={i} x={RXT} y={354 + i * 60} size={36} mono a="start" c={i === 4 ? T.sub : INK}>
                  {typed(e, sf, at, 1.2)}
                </Tx>
              );
            })}
            <Tx x={RXT} y={744} size={30} a="start" c={sf >= 330 ? INK : T.sub}>
              {sf >= 330 ? '6 个方程 · 5 个未知数（k₁ k₂ k₃ x₁ x₂）→ 可解' : sf >= 160 ? '3 个方程 · 4 个未知数：还不够' : ''}
            </Tx>
          </>
        )}
        {phase === 1 && (
          <>
            <Tx x={RXT} y={282} size={28} a="start" c={T.sub}>取方程 (1)(2)(3)(4)(6)，lex 序 Gröbner 基：</Tx>
            {BASIS.map((b, i) => {
              const at = 20 + i * 30;
              if (sf - 400 < at) return null;
              return (
                <g key={i}>
                  {i === 4 && <Box x={RXT - 18} y={354 + i * 66 - 36} w={1140} h={72} inv />}
                  <Tx x={RXT} y={354 + i * 66} size={32} mono a="start" c={i === 4 ? T.invText : INK}>
                    g{'₁₂₃₄₅'[i]} = {b}
                  </Tx>
                </g>
              );
            })}
            {sf - 400 >= 170 && <Tx x={RXT} y={744} size={30} a="start">三角形：最后一个只含 k₃ —— 一元多项式</Tx>}
          </>
        )}
        {phase === 2 && (
          <>
            <Tx x={RXT} y={282} size={28} a="start" c={T.sub}>在 F₁₀₁ 上分解 g₅：</Tx>
            <Tx x={RXT} y={348} size={32} mono a="start">
              (k₃ − {md(-FACT[0][1])})(k₃² + 4k₃ − 14)(k₃³ − 6k₃² − k₃ + 31)
            </Tx>
            {sf - 600 >= 40 && (
              <>
                <Box x={RXT - 18} y={396} w={600} h={72} inv />
                <Tx x={RXT} y={434} size={36} mono a="start" c={T.invText}>唯一的根：k₃ = {K3}</Tx>
              </>
            )}
            {sf - 600 >= 80 &&
              [
                ['x₁', SX1],
                ['x₂', SX2],
                ['k₁', SK1],
                ['k₂', SK2],
              ].map(([n, v], i) => <Badge key={i} x={RXT + i * 282} y={516} w={246} h={66} text={`${n} = ${v}`} size={32} mono />)}
            {sf - 600 >= 120 && (
              <Tx x={RXT} y={648} size={32} mono a="start">
                检验 (5)：{PAIRS[1][1]} + ({SX2} + {SK2})³ ≡ {CHECK5} {CHECK5 === C2[0] ? '✓' : '✗'}
              </Tx>
            )}
            {sf - 600 >= 140 && <Tx x={RXT} y={744} size={36} a="start">密钥 = ({SK1}, {SK2}, {K3})</Tx>}
          </>
        )}
        {phase === 3 && (
          <>
            <Tx x={RXT} y={282} size={28} a="start" c={T.sub}>另一面：高阶差分（低次数的指纹）</Tx>
            <Tx x={RXT} y={354} size={36} mono a="start">f(x) = (x + k)³ 的三阶差分恒为 6·a₁a₂a₃</Tx>
            {HOD.map((h, i) =>
              sf - 770 >= 20 + i * 16 ? (
                <Tx key={i} x={RXT} y={432 + i * 60} size={32} mono a="start" c={T.sub}>
                  x = {h.x}, k = {h.k}　→　Δ³f = {h.v}
                </Tx>
              ) : null,
            )}
            {sf - 770 >= 80 && (
              <>
                <HLine x1={RXT} x2={RXT + 1100} y={624} />
                <Tx x={RXT} y={672} size={36} a="start">与 x、k 都无关；再差分一次 → 0</Tx>
                <Tx x={RXT} y={738} size={30} a="start" c={T.sub}>零和区分器：一眼认出“不随机”</Tx>
              </>
            )}
          </>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const SymAlgebraicCues: Cue[] = probCues(ALG, [
  ...[0, 1, 2].map((i): Cue => [30 + i * 40, 'type']),
  ...[0, 1, 2].map((i): Cue => [230 + i * 40, 'type']),
  ...[0, 1, 2, 3, 4].map((i): Cue => [420 + i * 30, 'blip', 70 + i * 3]),
  [640, 'bell', 79],
  [720, 'chime'],
  ...[0, 1, 2].map((i): Cue => [790 + i * 16, 'tick']),
]);
