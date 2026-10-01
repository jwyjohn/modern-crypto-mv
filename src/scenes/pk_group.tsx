import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SAGE, SpriteG} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption, Pt} from '../components/ui';
import {FONT, snap} from '../theme';
import {Cells, K, pixLine, showAt, sup, T, Tag} from './pk_common';
import {modpow, order, powers, sqMul} from './pk_math';

const P = 23;
const GEN = 5;
const SUBG = 2;
const ORD5 = order(GEN, P); // 22
const ORD2 = order(SUBG, P); // 11
const POW5 = powers(GEN, P, ORD5 + 1); // 1,5,2,...,1
const POW2 = powers(SUBG, P, ORD2 + 1);
const X_SEARCH = 15;
const Y_SEARCH = modpow(GEN, X_SEARCH, P); // 19
const SM = sqMul(GEN, X_SEARCH, P);
const DIV = Array.from({length: P - 1}, (_, i) => i + 1).filter((d) => (P - 1) % d === 0);

const CX = 492;
const CY = 498;
const RAD = 282;
const NODE = 54;
const pos = (v: number): Pt => {
  const a = ((v - 1) / (P - 1)) * Math.PI * 2 - Math.PI / 2;
  return [snap(CX + Math.cos(a) * RAD), snap(CY + Math.sin(a) * RAD)];
};

/* timings */
const H1 = 30; // powers of 5
const DT1 = 9;
const H2 = 300; // powers of 2
const DT2 = 9;
const S3 = 430; // fast direction
const H4 = 546; // search
const DT4 = 6;

const hopIndex = (f: number, start: number, dt: number, n: number) => Math.max(-1, Math.min(n, Math.floor((f - start) / dt)));

export const PkGroup: React.FC = () => {
  const f = useF();
  const phase = f < H2 - 12 ? 1 : f < S3 ? 2 : 3;
  // which orbit is shown and how far along
  let orbit: number[] = [];
  let k = -1;
  if (phase === 1) {
    orbit = POW5;
    k = hopIndex(f, H1, DT1, ORD5);
  } else if (phase === 2) {
    orbit = POW2;
    k = hopIndex(f, H2, DT2, ORD2);
  } else if (f >= H4) {
    orbit = POW5;
    k = hopIndex(f, H4, DT4, X_SEARCH);
  }
  const visited = new Set(orbit.slice(0, k + 1));
  const cur = k >= 0 ? orbit[Math.min(k, orbit.length - 1)] : -1;
  const searchDone = phase === 3 && k >= X_SEARCH;

  const trail: React.ReactNode[] = [];
  for (let i = 1; i <= k && i < orbit.length; i++) {
    const a = pos(orbit[i - 1]);
    const b = pos(orbit[i]);
    trail.push(<Cells key={i} cells={pixLine(a, b)} color={i === k ? K.ink : K.line} size={i === k ? 6 : 6} />);
  }

  const exprBase = phase === 2 ? SUBG : GEN;
  const exprK = Math.max(0, k);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
        {/* ring */}
        {trail}
        {Array.from({length: P - 1}, (_, i) => i + 1).map((v) => {
          if (!showAt(f, (v - 1) * 1.5)) return null;
          const [x, y] = pos(v);
          const on = visited.has(v);
          const isCur = v === cur;
          const target = phase === 3 && f >= H4 - 30 && v === Y_SEARCH;
          return (
            <g key={v}>
              <rect x={x - NODE / 2} y={y - NODE / 2} width={NODE} height={NODE} fill={on ? K.inv : K.panel} />
              <rect x={x - NODE / 2 + 1.5} y={y - NODE / 2 + 1.5} width={NODE - 3} height={NODE - 3} fill="none" stroke={target ? K.red : K.ink} strokeWidth={isCur || target ? 6 : 3} />
              <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={24} fill={on ? K.invText : K.ink}>
                {v}
              </text>
            </g>
          );
        })}
        {phase === 3 && f >= S3 && <SpriteG map={SAGE} x={1704} y={672} s={12} accent={K.ink} />}
      </svg>

      {/* ---------------- right panel ---------------- */}
      {phase < 3 && (
        <>
          <T f={f} at={6} x={1008} y={204} size={24} color={K.sub} font={FONT.pixelMono}>
            ℤ₂₃* = {'{'}1, 2, …, 22{'}'}，运算：乘法 mod 23
          </T>
          <T f={f} at={phase === 1 ? 12 : H2 - 6} x={1008} y={264} size={36} color={K.ink}>
            {phase === 1 ? `从 1 出发，反复乘 ${GEN}` : `换成反复乘 ${SUBG}`}
          </T>
          {k >= 0 && (
            <T x={1008} y={348} size={60} font={FONT.pixelMono}>
              {exprBase}
              {sup(exprK)} mod 23 = {orbit[Math.min(exprK, orbit.length - 1)]}
            </T>
          )}
          {phase === 1 && (
            <>
              <T f={f} at={H1 + ORD5 * DT1 + 6} x={1008} y={480}>
                <Tag size={36}>ord({GEN}) = {ORD5}：走遍全部 22 个元素</Tag>
              </T>
              <T f={f} at={H1 + ORD5 * DT1 + 24} x={1008} y={564} size={36} color={K.sub}>
                {GEN} 是生成元：每个元素都是 {GEN}{sup('x')}
              </T>
            </>
          )}
          {phase === 2 && (
            <>
              <T f={f} at={H2 + ORD2 * DT2 + 6} x={1008} y={480}>
                <Tag size={36} c={K.red}>
                  ord({SUBG}) = {ORD2}：只走到一半就回到 1
                </Tag>
              </T>
              <T f={f} at={H2 + ORD2 * DT2 + 30} x={1008} y={576} size={36} color={K.ink}>
                Lagrange：元素的阶整除 p − 1 = 22
              </T>
              <T f={f} at={H2 + ORD2 * DT2 + 42} x={1008} y={636} size={36} color={K.sub} font={FONT.pixelMono}>
                阶 ∈ {'{'}
                {DIV.join(', ')}
                {'}'}
              </T>
            </>
          )}
        </>
      )}
      {phase === 3 && (
        <>
          <T f={f} at={S3} x={1008} y={204} size={36} color={K.sub}>
            正向 · 快速幂（平方再乘）
          </T>
          <T f={f} at={S3 + 18} x={1008} y={264} size={36} font={FONT.pixelMono}>
            {SM.rows.map((r, i) => (
              <span key={i} style={{marginRight: 30}}>
                {GEN}
                {sup(r.k)}≡{r.v}
              </span>
            ))}
          </T>
          <T f={f} at={S3 + 54} x={1008} y={330} size={36} font={FONT.pixelMono}>
            {GEN}
            {sup(X_SEARCH)} = {SM.rows
              .filter((r) => r.bit)
              .map((r) => `${GEN}${sup(r.k)}`)
              .reverse()
              .join('·')}{' '}
            ≡ <Tag size={36}>{SM.result}</Tag>
          </T>
          <T f={f} at={S3 + 84} x={1008} y={396} size={24} color={K.sub}>
            {X_SEARCH} = {X_SEARCH.toString(2)}₂ → 3 次平方 + 3 次乘法，步数 ≈ log x
          </T>
          <T f={f} at={H4 - 30} x={1008} y={492} size={36} color={K.sub}>
            反向 · 离散对数
          </T>
          <T f={f} at={H4 - 12} x={1008} y={552} size={48} font={FONT.pixelMono}>
            log{'₅'} {Y_SEARCH} = {searchDone ? X_SEARCH : '?'}
          </T>
          {k >= 0 && (
            <T x={1008} y={624} size={24} color={searchDone ? K.ink : K.sub}>
              {searchDone ? `逐个试到第 ${X_SEARCH} 次才命中` : `试 ${GEN}${sup(k)} = ${POW5[k]} …`}
            </T>
          )}
          <T f={f} at={H4 + X_SEARCH * DT4 + 24} x={1008} y={708}>
            <Tag size={24}>p 取 2048 位：正向 ≈ 3000 次乘法</Tag>
          </T>
          <T f={f} at={H4 + X_SEARCH * DT4 + 36} x={1008} y={768}>
            <Tag size={24}>反向暴力搜索 ≈ 2²⁰⁴⁸ 步</Tag>
          </T>
        </>
      )}
      <Caption title="有限域与循环群" en="CYCLIC GROUPS" desc="g^x 好算，log 难求：离散对数假设" color={K.act} />
    </AbsoluteFill>
  );
};

export const PkGroupCues: Cue[] = [
  ...POW5.slice(1)
    .map((_, i): Cue => [H1 + (i + 1) * DT1, 'blip', 60 + i])
    .filter((_, i) => i % 3 === 0),
  [H1 + ORD5 * DT1 + 6, 'chime'],
  [H2, 'whoosh'],
  [H2 + ORD2 * DT2 + 6, 'error'],
  [S3 + 18, 'type'],
  [S3 + 54, 'bell', 76],
  ...Array.from({length: X_SEARCH}, (_, i): Cue => [H4 + (i + 1) * DT4, 'tick']).filter((_, i) => i % 5 === 4),
  [H4 + X_SEARCH * DT4, 'chime'],
  [H4 + X_SEARCH * DT4 + 24, 'whoosh'],
];
