import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, EVE, LOCK, SpriteG} from '../components/pixel';
import {Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption} from '../components/ui';
import {clamp01, COL, FONT} from '../theme';
import {cmod, Mark, mod, on, Tag} from './zk_util';

const INK = COL.text;
const M = FONT.pixelMono;

/* ---------- toy LWE, q = 97, n = 3, m = 4 (all computed) ---------- */
const Q = 97;
const HALF = Math.floor(Q / 2); // 48
const A = [
  [41, 7, 66],
  [23, 85, 12],
  [59, 34, 90],
  [16, 71, 48],
];
const S = [2, -1, 1];
const E = [1, -1, 0, 1];
const dot = (x: number[], y: number[]) => x.reduce((acc, v, i) => acc + v * y[i], 0);
const AS = A.map((row) => mod(dot(row, S), Q));
const B = A.map((row, i) => mod(dot(row, S) + E[i], Q));
const RV = [1, 0, 1, 1];
const E1 = [0, 1, -1];
const E2 = 1;
const RA = [0, 1, 2].map((j) => mod(dot(RV, A.map((row) => row[j])), Q));
const U = RA.map((v, j) => mod(v + E1[j], Q));
const RB = mod(dot(RV, B), Q);
const V1 = mod(RB + E2 + HALF, Q);
const V0 = mod(RB + E2, Q);
const US = mod(dot(U, S), Q);
const D1 = mod(V1 - US, Q); // ≈ 48 → 1
const D0 = mod(V0 - US, Q); // ≈ 0 → 0
const NOISE = dot(RV, E) + E2 - dot(E1, S);
const dec = (d: number) => (Math.abs(cmod(d, Q)) < Q / 4 ? 0 : 1);

const P2 = 300;
const P3 = 486;
const P4 = 786;

/* ---------- phase 1: the equation ---------- */
const CW = 84;
const CHh = 60;
const Col: React.FC<{x: number; vals: (number | string)[]; f: number; at: number; inv?: boolean; flash?: boolean}> = ({x, vals, f, at, inv, flash}) => (
  <g>
    {vals.map((v, i) => (f >= at + i * 3 ? <Tag key={i} x={x} y={360 + i * (CHh + 6) + (vals.length === 3 ? 36 : 0)} w={CW} h={CHh} text={v} family={M} inv={inv || (flash && f % 6 < 3)} /> : null))}
  </g>
);
const Equation: React.FC<{f: number}> = ({f}) => {
  const noisy = f >= 132;
  return (
    <g>
      {on(f, 6) && (
        <Txt x={180} y={288} size={48} anchor="start" family={M}>
          {noisy ? 'b = A·s + e  (mod 97)' : 'b = A·s  (mod 97)'}
        </Txt>
      )}
      {A.map((row, i) => row.map((v, j) => (f >= 12 + i * 3 + j ? <Tag key={`${i}${j}`} x={180 + j * (CW + 6)} y={360 + i * (CHh + 6)} w={CW} h={CHh} text={v} family={M} /> : null)))}
      {on(f, 24) && (
        <Txt x={477} y={459} size={48} family={M}>
          ·
        </Txt>
      )}
      <Col x={516} vals={S} f={f} at={24} />
      {noisy && (
        <>
          <Txt x={642} y={459} size={48} family={M}>
            +
          </Txt>
          <Col x={684} vals={E} f={f} at={132} inv />
        </>
      )}
      {on(f, 36) && (
        <Txt x={noisy ? 810 : 642} y={459} size={48} family={M}>
          =
        </Txt>
      )}
      <Col x={noisy ? 852 : 684} vals={noisy ? B : AS} f={f} at={36} flash={noisy && f < 150} />
      {on(f, 54) && (
        <Txt x={180} y={660} size={24} anchor="start" color={COL.sub}>
          A、b 公开 · s 是秘密 · e 是很小的噪声
        </Txt>
      )}
      {/* commentary */}
      {on(f, 66) && (
        <Txt x={1110} y={384} size={36} anchor="start">
          没有噪声：高斯消元，几步解出 s
        </Txt>
      )}
      {on(f, 90) && <Mark x={1134} y={456} ok />}
      {on(f, 150) && (
        <Txt x={1110} y={552} size={36} anchor="start">
          加一点小噪声：消元把误差越放越大
        </Txt>
      )}
      {on(f, 174) && <Mark x={1134} y={624} ok={false} />}
      {on(f, 204) && <Tag x={1110} y={696} w={708} h={84} text="Learning With Errors · Regev 2005" size={36} inv />}
    </g>
  );
};

/* ---------- phase 2: lattice ---------- */
const LO: [number, number] = [600, 540];
const B1: [number, number] = [90, 24];
const B2: [number, number] = [30, 78];
const latPts = (() => {
  const out: [number, number, number, number][] = [];
  for (let i = -16; i <= 16; i++)
    for (let j = -16; j <= 16; j++) {
      const x = LO[0] + i * B1[0] + j * B2[0];
      const y = LO[1] + i * B1[1] + j * B2[1];
      if (x > 132 && x < 1062 && y > 246 && y < 834) out.push([Math.round(x / 6) * 6, Math.round(y / 6) * 6, i, j]);
    }
  return out;
})();
const TGT_I = 1;
const TGT_J = 1;
const LP: [number, number] = [LO[0] + TGT_I * B1[0] + TGT_J * B2[0], LO[1] + TGT_I * B1[1] + TGT_J * B2[1]];
const TP: [number, number] = [LP[0] + 30, LP[1] - 24];
const Lattice: React.FC<{f: number}> = ({f}) => {
  const s = f - P2;
  const n = Math.floor(clamp01(s / 30) * latPts.length);
  return (
    <g>
      {latPts.slice(0, n).map(([x, y], k) => (
        <rect key={k} x={x - 6} y={y - 6} width={12} height={12} fill={COL.dim} />
      ))}
      {on(s, 36) && (
        <g>
          <rect x={LP[0] - 12} y={LP[1] - 12} width={24} height={24} fill={INK} />
          <rect x={LP[0] - 84} y={LP[1] + 24} width={66} height={36} fill={COL.bg} />
          <Txt x={LP[0] - 24} y={LP[1] + 42} size={24} anchor="end" family={M}>
            A·s
          </Txt>
        </g>
      )}
      {on(s, 60) && (
        <g>
          <rect x={TP[0] - 12} y={TP[1] - 12} width={24} height={24} fill={COL.panel} stroke={INK} strokeWidth={6} />
          <rect x={TP[0] + 24} y={TP[1] - 48} width={30} height={36} fill={COL.bg} />
          <Txt x={TP[0] + 30} y={TP[1] - 30} size={24} anchor="start" family={M}>
            b
          </Txt>
          <Arrow pts={[[LP[0] + 12, LP[1] - 10], [TP[0] - 12, TP[1] + 10]]} t={clamp01((s - 60) / 12)} color={INK} w={3} head={9} glow={false} />
        </g>
      )}
      {[
        {t: '格：整齐排列的点', at: 12, c: INK},
        {t: 'A·s 恰好落在格点上', at: 36, c: INK},
        {t: '加上 e，b 偏离了一点', at: 60, c: INK},
        {t: '求 s ≈ 找离 b 最近的格点', at: 90, c: INK},
      ].map((l, i) =>
        on(s, l.at) ? (
          <Txt key={i} x={1170} y={312 + i * 84} size={36} anchor="start" color={l.c}>
            {l.t}
          </Txt>
        ) : null,
      )}
      {on(s, 120) && (
        <Txt x={1170} y={672} size={36} anchor="start" color={COL.sub}>
          2 维一眼可见；几百维则无人能解
        </Txt>
      )}
      {on(s, 144) && <Tag x={1170} y={720} w={648} h={84} text="经典与量子算法都束手无策" size={36} inv />}
    </g>
  );
};

/* ---------- phase 3: Regev-style bit encryption ---------- */
const CX = 1446;
const CY = 528;
const RR = 228;
const Ring: React.FC<{s: number}> = ({s}) => {
  const pos = (k: number, r = RR): [number, number] => {
    const a = (k / Q) * 2 * Math.PI - Math.PI / 2;
    return [Math.round((CX + Math.cos(a) * r) / 6) * 6, Math.round((CY + Math.sin(a) * r) / 6) * 6];
  };
  const n = Math.floor(clamp01(s / 24) * Q);
  return (
    <g>
      {new Array(n).fill(0).map((_, k) => {
        const [x, y] = pos(k);
        const one = dec(k) === 1;
        return <rect key={k} x={x - (one ? 6 : 3)} y={y - (one ? 6 : 3)} width={one ? 12 : 6} height={one ? 12 : 6} fill={one ? INK : COL.dim} />;
      })}
      {on(s, 24) && (
        <g>
          <Txt x={CX} y={CY - RR - 42} size={36} family={M}>
            0
          </Txt>
          <Txt x={CX + 24} y={CY + RR + 42} size={36} family={M} anchor="start">
            {`${HALF} = ⌊q/2⌋`}
          </Txt>
          <Txt x={CX} y={CY - 48} size={36} color={COL.sub}>
            靠近 0 → 0
          </Txt>
          <Txt x={CX} y={CY + 48} size={36}>
            靠近 q/2 → 1
          </Txt>
        </g>
      )}
      {[
        {d: D1, at: 150},
        {d: D0, at: 210},
      ].map(({d, at}) => {
        if (!on(s, at)) return null;
        const [x, y] = pos(d);
        const [lx, ly] = pos(d, RR + 66);
        return (
          <g key={d}>
            <rect x={x - 15} y={y - 15} width={30} height={30} fill={COL.panel} stroke={INK} strokeWidth={6} />
            <Txt x={lx} y={ly} size={36} family={M} anchor={x < CX ? 'end' : 'start'}>
              {`${d}`}
            </Txt>
          </g>
        );
      })}
    </g>
  );
};
const Regev: React.FC<{f: number}> = ({f}) => {
  const s = f - P3;
  const rows: {t: string; at: number; size?: number; c?: string}[] = [
    {t: `加密 1 比特 m（q = ${Q}）`, at: 0, size: 48},
    {t: `u = rᵀA + e₁ = (${U.join(', ')})`, at: 36},
    {t: `v = rᵀb + e₂ + m·⌊q/2⌋`, at: 66},
    {t: `解密：d = v − u·s`, at: 120},
    {t: `m = 1：v = ${V1}，d = ${D1} ≈ ${HALF} → ${dec(D1)}`, at: 150},
    {t: `m = 0：v = ${V0}，d = ${D0} ≈ 0 → ${dec(D0)}`, at: 210},
  ];
  return (
    <g>
      {rows.map((r, i) =>
        on(s, r.at) ? (
          <Txt key={i} x={120} y={300 + i * 84 + (i >= 3 ? 36 : 0)} size={r.size ?? 36} anchor="start" family={i === 0 ? FONT.pixel : M} color={r.c ?? INK}>
            {r.t}
          </Txt>
        ) : null,
      )}
      {on(s, 240) && (
        <Txt x={120} y={816} size={24} anchor="start" color={COL.sub} family={M}>
          {`残余噪声 rᵀe + e₂ − e₁·s = ${NOISE}，远小于 q/4`}
        </Txt>
      )}
      <Ring s={s - 12} />
    </g>
  );
};

/* ---------- phase 4: Kyber ---------- */
const Kyber: React.FC<{f: number}> = ({f}) => {
  const s = f - P4;
  return (
    <g>
      {s >= 0 && <SpriteG map={EVE} x={120} y={252} s={6} accent={INK} />}
      {on(s, 0) && (
        <Txt x={216} y={300} size={48} anchor="start">
          Shor 1994：量子计算机
        </Txt>
      )}
      {['RSA', 'Diffie–Hellman', '椭圆曲线 ECC'].map((t, i) =>
        on(s, 18 + i * 12) ? (
          <g key={i}>
            <Tag x={216} y={384 + i * 108} w={480} h={72} text={t} red />
            <Mark x={762} y={420 + i * 108} ok={false} />
          </g>
        ) : null,
      )}
      {on(s, 66) && <rect x={936} y={276} width={3} height={540} fill={COL.line} />}
      {on(s, 66) && <Tag x={1032} y={264} w={600} h={96} text="ML-KEM（Kyber）" size={48} inv />}
      {[
        {t: 'FIPS 203 · 2024 年成为标准', at: 84, m: false},
        {t: 'Module-LWE · n = 256 · q = 3329', at: 102, m: true},
        {t: 'ML-KEM-768：公钥 1184 B · 密文 1088 B', at: 120, m: false},
      ].map((l, i) =>
        on(s, l.at) ? (
          <Txt key={i} x={1032} y={432 + i * 84} size={36} anchor="start" family={l.m ? M : FONT.pixel}>
            {l.t}
          </Txt>
        ) : null,
      )}
      {s >= 138 && (
        <g>
          <SpriteG map={ALICE} x={1032} y={684} s={6} accent={INK} />
          <SpriteG map={LOCK} x={1110} y={720} s={6} accent={INK} />
        </g>
      )}
      {on(s, 138) && (
        <Txt x={1200} y={750} size={36} anchor="start">
          格上的难题：抵御量子攻击
        </Txt>
      )}
    </g>
  );
};

export const ZkLwe: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {f < P2 && <Equation f={f} />}
        {f >= P2 && f < P3 && <Lattice f={f} />}
        {f >= P3 && f < P4 && <Regev f={f} />}
        {f >= P4 && <Kyber f={f} />}
      </svg>
      <Caption title="LWE 与 Kyber" en="LEARNING WITH ERRORS" desc="给线性方程加一点噪声，就成了格上的难题——抗量子" color={COL.zk} />
    </AbsoluteFill>
  );
};

export const ZkLweCues: Cue[] = [
  [6, 'whoosh'],
  [36, 'tick'],
  [90, 'blip', 79],
  [132, 'blip', 70],
  [174, 'error'],
  [204, 'bell', 79],
  [P2, 'whoosh'],
  [P2 + 60, 'blip', 76],
  [P2 + 144, 'chime'],
  [P3, 'whoosh'],
  [P3 + 150, 'bell', 84],
  [P3 + 210, 'blip', 72],
  [P4, 'riser2'],
  [P4 + 18, 'error'],
  [P4 + 66, 'bell', 84],
  [P4 + 138, 'chime'],
];
