import React from 'react';
import {AbsoluteFill} from 'remotion';
import {GNode, Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {FONT} from '../theme';
import {fl, Fx, Mark, md, minv, T} from './sig_lib';

/* ====================================================================== */
/* Sumcheck (LFKN 1990) over F_97, g = 2x1^3 + x1x3 + x2x3                 */
/* ====================================================================== */

const P = 97;
const g = (x1: number, x2: number, x3: number) => md(2 * x1 * x1 * x1 + x1 * x3 + x2 * x3, P);
const R = [2, 3, 6]; // verifier's random challenges
const B = [0, 1];
const HSUM = md(B.flatMap((a) => B.flatMap((b) => B.map((c) => g(a, b, c)))).reduce((s, v) => s + v, 0), P); // 12
/** round polynomials as functions */
const g1 = (X: number) => md(B.flatMap((b) => B.map((c) => g(X, b, c))).reduce((s, v) => s + v, 0), P);
const g2 = (X: number) => md(B.map((c) => g(R[0], X, c)).reduce((s, v) => s + v, 0), P);
const g3 = (X: number) => g(R[0], R[1], X);
const RP = [g1, g2, g3];
const DEG = 3;

/** coefficients (low → high) of the degree-≤3 polynomial through (0..3, h(0..3)) mod P */
const coeffs = (h: (x: number) => number) => {
  const xs = [0, 1, 2, 3];
  const out = [0, 0, 0, 0];
  xs.forEach((xi, i) => {
    // basis polynomial L_i(X) = ∏_{j≠i} (X − x_j)/(x_i − x_j)
    let poly = [1];
    let den = 1;
    xs.forEach((xj, j) => {
      if (j === i) return;
      const np = new Array(poly.length + 1).fill(0);
      poly.forEach((c, k) => {
        np[k] = md(np[k] - c * xj, P);
        np[k + 1] = md(np[k + 1] + c, P);
      });
      poly = np;
      den = md(den * (xi - xj), P);
    });
    const sc = md(h(xi) * minv(den, P), P);
    poly.forEach((c, k) => (out[k] = md(out[k] + c * sc, P)));
  });
  return out;
};
const SUP = ['', '', '²', '³'];
const polyStr = (cs: number[], v: string) => {
  const terms: string[] = [];
  for (let k = cs.length - 1; k >= 0; k--) {
    const c = cs[k];
    if (!c) continue;
    if (k === 0) terms.push(`${c}`);
    else terms.push(`${c === 1 ? '' : c}${v}${SUP[k]}`);
  }
  return terms.join(' + ') || '0';
};
const SUBS = ['₁', '₂', '₃'];
const ROWS = RP.map((h, i) => ({
  poly: `g${SUBS[i]}(X${SUBS[i]}) = ${polyStr(coeffs(h), `X${SUBS[i]}`)}`,
  h0: h(0),
  h1: h(1),
  claim: i === 0 ? HSUM : RP[i - 1](R[i - 1]),
  r: R[i],
  hr: h(R[i]),
}));
const FINAL = g(R[0], R[1], R[2]); // 46

/* timing */
const RT = [180, 330, 474];
const FIN = 612;
const SZ = 702;

/* shapes: cube → square → segment → point */
type V = {x: number; y: number; val: number; grp: number};
const shape = (f: number): V[] => {
  if (f >= FIN) return [{x: 348, y: 492, val: FINAL, grp: 0}];
  if (f >= RT[2]) return B.map((c) => ({x: 228 + c * 240, y: 492, val: g(R[0], R[1], c), grp: c}));
  if (f >= RT[1]) return B.flatMap((b) => B.map((c) => ({x: 228 + c * 240, y: 612 - b * 240, val: g(R[0], b, c), grp: b})));
  return B.flatMap((a) => B.flatMap((b) => B.map((c) => ({x: 168 + a * 240 + c * 120, y: 672 - b * 240 - c * 120, val: g(a, b, c), grp: a}))));
};
const edgesOf = (vs: V[]) => {
  const out: [V, V][] = [];
  vs.forEach((a, i) =>
    vs.forEach((b, j) => {
      if (j <= i) return;
      const d = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      if (d === 240 || d === 240 + 0 || (Math.abs(a.x - b.x) === 120 && Math.abs(a.y - b.y) === 120)) out.push([a, b]);
    }),
  );
  return out;
};

export const ZkSumcheck: React.FC = () => {
  const f = useF();
  const vs = shape(f);
  const es = edgesOf(vs);
  const groupOn = f >= RT[0] + 36 && f < RT[1];
  let label = '';
  if (f >= 120) label = `{0,1}³ 上 8 个点，和 = ${HSUM}`;
  if (groupOn) label = `x₁=0 的和 ${ROWS[0].h0}，x₁=1 的和 ${ROWS[0].h1}`;
  if (f >= RT[1]) label = `固定 x₁ = ${R[0]}：4 个点，和 = ${ROWS[1].claim}`;
  if (f >= RT[2]) label = `再固定 x₂ = ${R[1]}：2 个点，和 = ${ROWS[2].claim}`;
  if (f >= FIN) label = `只剩一个点：g(${R.join(', ')})`;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {/* claim */}
        <Fx x={96} y={192} size={36} anchor="start" parts={['声称  H = ∑', '_x∈{0,1}³', ` g(x) = ${HSUM}`]} show={fl(f, 0)} />
        <Fx x={96} y={252} size={36} anchor="start" color={T.sub} parts={['g(x₁, x₂, x₃) = 2x₁³ + x₁x₃ + x₂x₃，在 𝔽₉₇ 上']} show={fl(f, 24)} />
        {/* shape */}
        {es.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={T.dim} strokeWidth={3} />
        ))}
        {vs.map((v, i) =>
          fl(f, f < RT[0] ? 48 + i * 6 : 0) ? (
            <GNode key={`${i}-${vs.length}`} x={v.x} y={v.y} r={30} label={v.val} color={T.ink} fill={groupOn && v.grp === 1 ? 1 : f >= FIN ? 1 : 0} size={24} />
          ) : null,
        )}
        {label && (
          <Txt x={348} y={756} size={24} color={T.ink}>
            {label}
          </Txt>
        )}
        {/* table */}
        {fl(f, RT[0] - 30) && (
          <g>
            <Txt x={672} y={318} size={24} anchor="start" color={T.dim}>
              证明者发送 gᵢ
            </Txt>
            <Txt x={1272} y={318} size={24} anchor="start" color={T.dim}>
              验证者检查 gᵢ(0)+gᵢ(1)
            </Txt>
            <Txt x={1632} y={318} size={24} anchor="start" color={T.dim}>
              随机 rᵢ
            </Txt>
            <rect x={672} y={342} width={1152} height={3} fill={T.line} />
          </g>
        )}
        {ROWS.map((row, i) => {
          const y = 396 + i * 96;
          const t0 = RT[i];
          return (
            <g key={i}>
              {fl(f, t0) && (
                <Txt x={672} y={y} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
                  {row.poly}
                </Txt>
              )}
              {fl(f, t0 + 66) && (
                <g>
                  <Txt x={1272} y={y} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
                    {`${row.h0} + ${row.h1} = ${md(row.h0 + row.h1, P)}`}
                  </Txt>
                  <Mark x={1560} y={y} ok={md(row.h0 + row.h1, P) === row.claim} show={fl(f, t0 + 84)} s={4} />
                </g>
              )}
              {fl(f, t0 + 108) && (
                <g>
                  <rect x={1626} y={y - 27} width={126} height={54} fill={T.inv} />
                  <Txt x={1689} y={y + 1} size={36} color={T.invText} family={FONT.pixelMono}>
                    {`r${SUBS[i]}=${row.r}`}
                  </Txt>
                  <Txt x={1632} y={y + 48} size={24} anchor="start" color={T.sub} family={FONT.pixelMono}>
                    {`g${SUBS[i]}(${row.r}) = ${row.hr}`}
                  </Txt>
                </g>
              )}
            </g>
          );
        })}
        {fl(f, FIN) && (
          <g>
            <rect x={672} y={663} width={1152} height={3} fill={T.line} />
            <Txt x={672} y={708} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
              {`最后：V 自己算一次 g(${R.join(', ')}) = ${FINAL}`}
            </Txt>
            {fl(f, FIN + 42) && (
              <g>
                <Txt x={1416} y={708} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
                  {`= g₃(${R[2]})`}
                </Txt>
                <Mark x={1650} y={708} ok={FINAL === ROWS[2].hr} show s={4} />
              </g>
            )}
          </g>
        )}
        {fl(f, SZ) && (
          <Txt x={672} y={786} size={24} anchor="start" color={T.sub}>
            {`Schwartz–Zippel：两个不同的 ${DEG} 次多项式至多在 ${DEG} 个点相等，随机 rᵢ 撞上的概率 ≤ ${DEG}/${P}`}
          </Txt>
        )}
        {fl(f, SZ + 60) && (
          <Txt x={672} y={834} size={24} anchor="start" color={T.ink}>
            {`3 轮总出错 ≤ 3·${DEG}/${P}；真实系统用 |𝔽| ≈ 2⁶⁴ 以上，可忽略`}
          </Txt>
        )}
      </svg>
      <Caption title="Sumcheck 协议" en="SUMCHECK" desc="2ⁿ 项的求和，被一轮一轮压成一次随机点求值：验证者几乎不用干活" color={T.act} />
    </AbsoluteFill>
  );
};

export const ZkSumcheckCues: Cue[] = [
  [0, 'type'],
  [48, 'tick'],
  [120, 'blip', 67],
  ...RT.map((t, i): Cue => [t, 'whoosh', 60 + i]),
  [RT[0] + 84, 'chime'],
  [RT[1] + 84, 'tick'],
  [RT[2] + 84, 'tick'],
  ...RT.map((t, i): Cue => [t + 108, 'blip', 72 + i * 3]),
  [FIN, 'step'],
  [FIN + 42, 'bell', 76],
  [SZ + 60, 'chime'],
];
