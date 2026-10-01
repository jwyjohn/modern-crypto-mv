import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption} from '../components/ui';
import {clamp01, COL, FONT, rnd} from '../theme';
import {on, Tag} from './zk_util';

const INK = COL.text;
const M = FONT.pixelMono;

/* ---------- randomized response, γ = 1/4 (computed) ---------- */
const GAMMA = 0.25;
const PT = 0.5 + GAMMA; // tell the truth
const TRAIT = 0.3;
const NPOP = 4000;
const truth = (k: number) => rnd(k * 1.37 + 5) < TRAIT;
const honest = (k: number) => rnd(k * 2.71 + 9) < PT;
const answer = (k: number) => (honest(k) ? truth(k) : !truth(k));
const est = (q: number) => (q - (0.5 - GAMMA)) / (2 * GAMMA); // = 2q − 1/2
const CURVE: {n: number; e: number; p: number}[] = [];
{
  let yes = 0;
  let tr = 0;
  for (let k = 0; k < NPOP; k++) {
    if (answer(k)) yes++;
    if (truth(k)) tr++;
    if ((k + 1) % 20 === 0) CURVE.push({n: k + 1, e: est(yes / (k + 1)), p: tr / (k + 1)});
  }
}
const FINAL = CURVE[CURVE.length - 1];
const EPS_RATIO = PT / (1 - PT); // 3
const EPS = Math.log(EPS_RATIO); // ≈ 1.10
// first 200 people for the grid
const GN = 200;
const G_TRUE = new Array(GN).fill(0).filter((_, k) => truth(k)).length;
const G_YES = new Array(GN).fill(0).filter((_, k) => answer(k)).length;

const P2 = 300;
const P3 = 570;

/* ---------- phase 1: the survey ---------- */
const GX = [120, 1080];
const GY = 312;
const Grid: React.FC<{x: number; val: (k: number) => boolean; upto: number}> = ({x, val, upto}) => (
  <g>
    {new Array(GN).fill(0).map((_, k) => {
      const c = k % 20;
      const r = Math.floor(k / 20);
      if (c >= upto) return null;
      const v = val(k);
      return <rect key={k} x={x + c * 36 + 1.5} y={GY + r * 36 + 1.5} width={27} height={27} fill={v ? COL.inv : COL.panel} stroke={INK} strokeWidth={3} />;
    })}
  </g>
);
const Survey: React.FC<{f: number}> = ({f}) => {
  const cols = Math.floor(clamp01((f - 72) / 120) * 20);
  return (
    <g>
      {on(f, 6) && (
        <Txt x={960} y={204} size={36}>
          敏感问题：“你是否 X？”——200 位受访者
        </Txt>
      )}
      {on(f, 18) && (
        <Txt x={GX[0]} y={276} size={24} anchor="start" color={COL.sub}>
          {`真实答案（只有本人知道）· “是” ${G_TRUE} 人`}
        </Txt>
      )}
      {f >= 18 && <Grid x={GX[0]} val={truth} upto={20} />}
      {on(f, 48) && (
        <g>
          <Arrow pts={[[864, 492], [1050, 492]]} t={clamp01((f - 48) / 18)} color={INK} w={6} glow={false} />
          <Txt x={957} y={444} size={24}>
            掷硬币
          </Txt>
        </g>
      )}
      {on(f, 72) && (
        <Txt x={GX[1]} y={276} size={24} anchor="start" color={COL.sub}>
          {cols >= 20 ? `公开的回答 · “是” ${G_YES} 人` : '公开的回答'}
        </Txt>
      )}
      {f >= 72 && <Grid x={GX[1]} val={answer} upto={cols} />}
      {on(f, 96) && <Tag x={420} y={714} w={1080} h={78} text="以 3/4 的概率说真话，1/4 的概率反着说" size={36} inv />}
      {on(f, 210) && (
        <Txt x={960} y={828} size={24} color={COL.sub}>
          任何一个“是”都可以推给硬币：个人可否认
        </Txt>
      )}
    </g>
  );
};

/* ---------- phase 2: de-biasing ---------- */
const CX0 = 1020;
const CW = 780;
const CY0 = 300;
const CH = 420;
const cx = (n: number) => CX0 + (n / NPOP) * CW;
const cy = (v: number) => CY0 + CH - (clamp01(v / 0.6) * CH);
const Estimate: React.FC<{f: number}> = ({f}) => {
  const s = f - P2;
  const shown = Math.floor(clamp01((s - 84) / 150) * CURVE.length);
  const pts = CURVE.slice(0, shown).map((c) => `${Math.round(cx(c.n))},${Math.round(cy(c.e) / 3) * 3}`);
  return (
    <g>
      {[
        {t: '回答“是”的比例 q', at: 6, size: 36, mono: false, y: 312},
        {t: 'q = (1/2 − γ) + 2γ·p', at: 24, size: 48, mono: true, y: 396},
        {t: 'γ = 1/4：q = 1/4 + p/2', at: 48, size: 36, mono: true, y: 480},
      ].map((r, i) =>
        on(s, r.at) ? (
          <Txt key={i} x={120} y={r.y} size={r.size} anchor="start" family={r.mono ? M : FONT.pixel}>
            {r.t}
          </Txt>
        ) : null,
      )}
      {on(s, 72) && <Tag x={120} y={540} w={516} h={96} text="p ≈ 2q − 1/2" size={48} family={M} inv />}
      {on(s, 96) && (
        <Txt x={120} y={714} size={36} anchor="start" color={COL.sub}>
          个体有噪声，总体依然准确
        </Txt>
      )}
      {/* chart */}
      {s >= 12 && (
        <g>
          <rect x={CX0} y={CY0} width={3} height={CH} fill={INK} />
          <rect x={CX0} y={CY0 + CH} width={CW} height={3} fill={INK} />
          <Txt x={CX0 - 12} y={cy(0)} size={24} anchor="end" family={M} color={COL.sub}>
            0
          </Txt>
          <Txt x={CX0 - 12} y={cy(0.6)} size={24} anchor="end" family={M} color={COL.sub}>
            0.6
          </Txt>
          <Txt x={CX0 + CW} y={CY0 + CH + 30} size={24} anchor="end" family={M} color={COL.sub}>
            {`n = ${NPOP}`}
          </Txt>
          {new Array(26).fill(0).map((_, i) => (
            <rect key={i} x={CX0 + 6 + i * 30} y={Math.round(cy(TRAIT)) - 1.5} width={15} height={3} fill={COL.dim} />
          ))}
          <Txt x={CX0 + CW} y={cy(TRAIT) - 30} size={24} anchor="end" color={COL.sub}>
            真实比例 0.30
          </Txt>
        </g>
      )}
      {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke={INK} strokeWidth={3} />}
      {on(s, 240) && (
        <Txt x={CX0} y={786} size={36} anchor="start" family={M}>
          {`n = ${FINAL.n}：估计 ${FINAL.e.toFixed(3)} · 真实 ${FINAL.p.toFixed(3)}`}
        </Txt>
      )}
    </g>
  );
};

/* ---------- phase 3: ε-differential privacy ---------- */
const Definition: React.FC<{f: number}> = ({f}) => {
  const s = f - P3;
  const BW = 720;
  return (
    <g>
      {on(s, 6) && <Tag x={216} y={204} w={1488} h={96} text="Pr[M(D) ∈ S] ≤ e^ε · Pr[M(D′) ∈ S]" size={48} family={M} inv />}
      {on(s, 30) && (
        <Txt x={960} y={366} size={36}>
          D 与 D′ 只差一个人：有没有你，结果几乎一样
        </Txt>
      )}
      {[
        {l: 'P(答“是” | 真是)', v: PT, at: 66},
        {l: 'P(答“是” | 真否)', v: 1 - PT, at: 84},
      ].map((b, i) =>
        on(s, b.at) ? (
          <g key={i}>
            <Txt x={660} y={474 + i * 90} size={36} anchor="end">
              {b.l}
            </Txt>
            <rect x={720} y={450 + i * 90} width={Math.round((b.v * BW) / 6) * 6} height={48} fill={i === 0 ? INK : COL.dim} />
            <Txt x={732 + Math.round((b.v * BW) / 6) * 6} y={474 + i * 90} size={36} anchor="start" family={M}>
              {b.v === 0.75 ? '3/4' : '1/4'}
            </Txt>
          </g>
        ) : null,
      )}
      {on(s, 120) && (
        <Txt x={960} y={684} size={48} family={M}>
          {`e^ε = (1/2 + γ)/(1/2 − γ) = ${EPS_RATIO}  →  ε = ln ${EPS_RATIO} ≈ ${EPS.toFixed(2)}`}
        </Txt>
      )}
      {on(s, 168) && (
        <Txt x={960} y={786} size={36} color={COL.sub}>
          ε 越小越难认出任何一个人，代价是统计更吵
        </Txt>
      )}
    </g>
  );
};

export const FrDp: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {f < P2 && <Survey f={f} />}
        {f >= P2 && f < P3 && <Estimate f={f} />}
        {f >= P3 && <Definition f={f} />}
      </svg>
      <Caption title="差分隐私" en="DIFFERENTIAL PRIVACY" desc="给每个人的回答加噪声，统计照样准确，个人却可以否认" color={COL.fr} />
    </AbsoluteFill>
  );
};

export const FR_DP_STATS = {G_TRUE, G_YES, FINAL, EPS_RATIO, EPS};

export const FrDpCues: Cue[] = [
  [6, 'whoosh'],
  [48, 'blip', 72],
  ...new Array(5).fill(0).map((_, i): Cue => [72 + i * 24, 'tick']),
  [96, 'chime'],
  [P2, 'whoosh'],
  [P2 + 72, 'blip', 79],
  [P2 + 240, 'bell', 84],
  [P3, 'riser2'],
  [P3 + 6, 'blip', 76],
  [P3 + 120, 'reveal'],
];
