import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DitherFill, SAGE, SpriteG} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption, Pt} from '../components/ui';
import {FONT, PX, snap} from '../theme';
import {Cells, K, pixLine, pixPoly, showAt, T, Tag} from './pk_common';
import {ecAdd, ecMul, ecPoints, EP, reAdd} from './pk_math';

/* ---------------- real curve y² = x³ − x + 1 ---------------- */
const A_R = -1;
const B_R = 1;
const fx = (x: number) => x * x * x + A_R * x + B_R;
// real root of x³ − x + 1 (bisection, deterministic)
const ROOT = (() => {
  let lo = -2;
  let hi = -1;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (fx(m) > 0) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
})();
const XMIN = -1.8;
const XMAX = 2.7;
const YMAX = 3.6;
const PX0 = 120;
const PY0 = 180;
const PW = 732;
const PH = 648;
const SX = PW / (XMAX - XMIN);
const SY = PH / (2 * YMAX);
const toPx = (x: number, y: number): Pt => [snap(PX0 + (x - XMIN) * SX), snap(PY0 + PH / 2 - y * SY)];
const XTOP = (() => {
  // largest x with |y| <= YMAX
  let lo = 0;
  let hi = XMAX;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (Math.sqrt(fx(m)) < YMAX - 0.05) lo = m;
    else hi = m;
  }
  return lo;
})();
const CURVE: Pt[] = (() => {
  const n = 160;
  const up: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const x = ROOT + (XTOP - ROOT) * s * s; // dense near the vertical tangent
    up.push(toPx(x, Math.sqrt(Math.max(0, fx(x)))));
  }
  const down = up.map(([x, y]): Pt => [x, snap(PY0 + PH) - (y - PY0)]).reverse();
  return pixPoly([...down, ...up.slice(1)]);
})();

const Pp: [number, number] = [-0.9, Math.sqrt(fx(-0.9))];
const Qp: [number, number] = [0.8, -Math.sqrt(fx(0.8))];
const CH = reAdd(Pp, Qp, A_R); // chord: R and P+Q
const TG = reAdd(Pp, Pp, A_R); // tangent: R' and 2P
const lineY = (m: number, x: number) => Pp[1] + m * (x - Pp[0]);
const CHORD = pixLine(toPx(-1.6, lineY(CH.m, -1.6)), toPx(CH.R[0] + 0.25, lineY(CH.m, CH.R[0] + 0.25)));
const TANG = pixLine(toPx(-1.6, lineY(TG.m, -1.6)), toPx(TG.R[0] + 0.12, lineY(TG.m, TG.R[0] + 0.12)));
const REFL1 = pixLine(toPx(CH.R[0], CH.R[1]), toPx(CH.S[0], CH.S[1]));
const REFL2 = pixLine(toPx(TG.R[0], TG.R[1]), toPx(TG.S[0], TG.S[1]));

/* ---------------- finite field curve y² = x³ + 2x + 3 over F_97 ---------------- */
const FP = 97;
const FA = 2;
const FB = 3;
const FPTS = ecPoints(FA, FB, FP);
const NE = FPTS.length + 1; // + point at infinity
const BASE: [number, number] = [0, 10];
const ORDP = (() => {
  let R: EP = BASE;
  let k = 1;
  while (R) {
    R = ecAdd(R, BASE, FA, FP);
    k++;
  }
  return k;
})();
const KS = [1, 2, 3, 6, 12, 13]; // double-and-add for 13 = 1101b
const OPS = ['', '×2', '+P', '×2', '×2', '+P'];
const KP = KS.map((k) => ecMul(k, BASE, FA, FP) as [number, number]);
const FX0 = 120;
const FY0 = 210;
const fpx = (x: number, y: number): Pt => [FX0 + x * PX, FY0 + (FP - 1 - y) * PX];
const SORTED = [...FPTS].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

/* ---------------- timing ---------------- */
const T_CHORD = 70;
const T_TAN = 270;
const T_DA = 450;
const T_FF = 570;
const T_HOP = 636;
const DT_HOP = 20;

const Mark: React.FC<{p: Pt; hollow?: boolean; red?: boolean}> = ({p, hollow, red}) => (
  <g>
    <rect x={p[0] - 9} y={p[1] - 9} width={18} height={18} fill={hollow ? K.panel : red ? K.red : K.inv} stroke={red ? K.red : K.ink} strokeWidth={3} />
  </g>
);

const Lbl: React.FC<{p: Pt; dx: number; dy: number; children: React.ReactNode; size?: number; anchor?: 'start' | 'end' | 'middle'}> = ({p, dx, dy, children, size = 36, anchor = 'start'}) => (
  <text x={p[0] + dx} y={p[1] + dy} textAnchor={anchor} dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={size} fill={K.ink}>
    {children}
  </text>
);

export const PkEcc: React.FC = () => {
  const f = useF();
  const real = f < T_FF - 6;
  const wipe = f >= T_FF - 18 && f < T_FF + 12;
  const curveN = Math.floor(((f - 6) / 54) * CURVE.length);
  const chordN = Math.floor(((f - T_CHORD - 40) / 40) * CHORD.length);
  const reflN = Math.floor(((f - T_CHORD - 110) / 24) * REFL1.length);
  const tanN = Math.floor(((f - T_TAN - 20) / 40) * TANG.length);
  const refl2N = Math.floor(((f - T_TAN - 80) / 24) * REFL2.length);
  const chordOn = f >= T_CHORD && f < T_TAN;
  const pP = toPx(Pp[0], Pp[1]);
  const pQ = toPx(Qp[0], Qp[1]);
  const pR = toPx(CH.R[0], CH.R[1]);
  const pS = toPx(CH.S[0], CH.S[1]);
  const pR2 = toPx(TG.R[0], TG.R[1]);
  const p2P = toPx(TG.S[0], TG.S[1]);
  const scatterN = Math.floor(((f - T_FF) / 60) * SORTED.length);
  const hop = Math.floor((f - T_HOP) / DT_HOP); // index of current multiple
  const chainOn = (i: number) => (f < T_FF ? f >= T_DA + 30 + i * 12 : hop >= i);

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
        {real && (
          <g>
            {/* axes */}
            <rect x={PX0} y={snap(PY0 + PH / 2) - 1} width={PW} height={3} fill={K.line} />
            <rect x={toPx(0, 0)[0] - 1} y={PY0} width={3} height={PH} fill={K.line} />
            <Cells cells={CURVE} color={K.ink} n={curveN} />
            {/* chord */}
            {chordOn && (
              <>
                <Cells cells={CHORD} color={K.sub} n={chordN} dash={2} />
                <Cells cells={REFL1} color={K.sub} n={reflN} dash={1} />
                {showAt(f, T_CHORD) && <Mark p={pP} />}
                {showAt(f, T_CHORD + 20) && <Mark p={pQ} />}
                {showAt(f, T_CHORD + 84) && <Mark p={pR} hollow />}
                {showAt(f, T_CHORD + 140) && <Mark p={pS} red />}
                {showAt(f, T_CHORD) && <Lbl p={pP} dx={-24} dy={-30} anchor="end">P</Lbl>}
                {showAt(f, T_CHORD + 20) && <Lbl p={pQ} dx={-24} dy={36} anchor="end">Q</Lbl>}
                {showAt(f, T_CHORD + 84) && <Lbl p={pR} dx={24} dy={30}>R</Lbl>}
                {showAt(f, T_CHORD + 140) && <Lbl p={pS} dx={24} dy={-30}>P+Q</Lbl>}
              </>
            )}
            {/* tangent */}
            {f >= T_TAN && (
              <>
                <Cells cells={TANG} color={K.sub} n={tanN} dash={2} />
                <Cells cells={REFL2} color={K.sub} n={refl2N} dash={1} />
                <Mark p={pP} />
                <Lbl p={pP} dx={-24} dy={-30} anchor="end">
                  P
                </Lbl>
                {showAt(f, T_TAN + 60) && <Mark p={pR2} hollow />}
                {showAt(f, T_TAN + 60) && <Lbl p={pR2} dx={-24} dy={0} anchor="end">R</Lbl>}
                {showAt(f, T_TAN + 110) && <Mark p={p2P} red />}
                {showAt(f, T_TAN + 110) && <Lbl p={p2P} dx={-24} dy={0} anchor="end">2P</Lbl>}
              </>
            )}
            <text x={PX0 + 12} y={PY0 + 18} dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={24} fill={K.sub}>
              实数域 · y² = x³ − x + 1
            </text>
          </g>
        )}
        {wipe && <DitherFill id="ecc-wipe" level={1 - Math.abs(f - (T_FF - 3)) / 15} color={K.bg} cell={PX * 2} x={96} y={156} w={800} h={700} />}

        {/* finite field scatter */}
        {!real && (
          <g>
            <rect x={FX0 - 6} y={FY0 - 6} width={FP * PX + 12} height={FP * PX + 12} fill="none" stroke={K.line} strokeWidth={3} />
            <rect x={FX0} y={FY0 + (FP / 2) * PX - 1} width={FP * PX} height={3} fill={K.panel2} />
            {SORTED.slice(0, Math.max(0, scatterN)).map(([x, y], i) => {
              const [px, py] = fpx(x, y);
              return <rect key={i} x={px} y={py} width={PX} height={PX} fill={K.ink} />;
            })}
            {/* double-and-add hops */}
            {KP.map((pt, i) => {
              if (hop < i) return null;
              const [px, py] = fpx(pt[0], pt[1]);
              const prev = i > 0 ? fpx(KP[i - 1][0], KP[i - 1][1]) : null;
              const cur = i === Math.min(hop, KP.length - 1);
              return (
                <g key={i}>
                  {prev && <Cells cells={pixLine([prev[0] + 3, prev[1] + 3], [px + 3, py + 3])} color={cur ? K.ink : K.line} dash={cur ? 0 : 2} />}
                  <rect x={px - 6} y={py - 6} width={18} height={18} fill={i === KP.length - 1 ? K.red : K.inv} />
                </g>
              );
            })}
            {KP.map((pt, i) => {
              if (hop < i) return null;
              const [px, py] = fpx(pt[0], pt[1]);
              const right = pt[0] < 60;
              const dy = KS[i] === 13 ? -30 : KS[i] === 6 ? 30 : 0;
              return (
                <g key={'l' + i}>
                  <rect x={right ? px + 18 : px - 18 - (`${KS[i]}P`.length * 18 + 12)} y={py - 15 + dy} width={`${KS[i]}P`.length * 18 + 12} height={36} fill={K.panel} />
                  <text x={right ? px + 24 : px - 24} y={py + 4 + dy} textAnchor={right ? 'start' : 'end'} dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={36} fill={K.ink}>
                    {KS[i] === 1 ? 'P' : `${KS[i]}P`}
                  </text>
                </g>
              );
            })}
            <text x={FX0} y={FY0 + FP * PX + 30} dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={24} fill={K.sub}>
              𝔽₉₇ · y² = x³ + 2x + 3
            </text>
          </g>
        )}
        {f >= T_TAN && f < T_FF && <SpriteG map={SAGE} x={1704} y={672} s={12} accent={K.ink} />}
      </svg>

      {/* ---------------- right panel ---------------- */}
      {f < T_TAN && (
        <>
          <T f={f} at={10} x={984} y={204} size={36} color={K.sub}>
            椭圆曲线 y² = x³ + ax + b 上的点
          </T>
          <T f={f} at={T_CHORD} x={984} y={300} size={48}>
            弦：P + Q
          </T>
          <T f={f} at={T_CHORD + 40} x={984} y={384} size={36} color={K.sub}>
            过 P、Q 的直线交曲线于第三点 R
          </T>
          <T f={f} at={T_CHORD + 140} x={984} y={456} size={36} color={K.sub}>
            关于 x 轴翻转：
          </T>
          <T f={f} at={T_CHORD + 150} x={984} y={528}>
            <Tag size={48}>P + Q = −R</Tag>
          </T>
        </>
      )}
      {f >= T_TAN && f < T_DA && (
        <>
          <T f={f} at={T_TAN} x={984} y={300} size={48}>
            切线：P + P = 2P
          </T>
          <T f={f} at={T_TAN + 30} x={984} y={384} size={36} color={K.sub}>
            Q 趋近 P，弦变成切线
          </T>
          <T f={f} at={T_TAN + 60} x={984} y={456} size={36} font={FONT.pixelMono}>
            λ = (3x₁² + a) / 2y₁
          </T>
          <T f={f} at={T_TAN + 110} x={984} y={528} size={36} color={K.sub}>
            翻转第三点 R → 得到 2P
          </T>
        </>
      )}
      {f >= T_DA && (
        <>
          <T f={f} at={T_DA} x={984} y={f < T_FF ? 300 : 204} size={48} font={FONT.pixelMono}>
            13P = ?　13 = {(13).toString(2)}₂
          </T>
          {/* chain */}
          <div style={{position: 'absolute', left: 984, top: f < T_FF ? 408 : 312, display: 'flex', alignItems: 'center', gap: 0}}>
            {KS.map((k, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div style={{width: 42, textAlign: 'center', fontFamily: FONT.pixelMono, fontSize: 24, lineHeight: '36px', color: chainOn(i) ? K.ink : K.line}}>
                    {OPS[i]}
                  </div>
                )}
                <div
                  style={{
                    width: 96,
                    height: 60,
                    boxSizing: 'border-box',
                    border: `3px solid ${chainOn(i) ? K.ink : K.line}`,
                    background: chainOn(i) && (f >= T_FF ? i === Math.min(hop, KS.length - 1) : i === KS.length - 1) ? K.inv : K.panel,
                    color: chainOn(i) && (f >= T_FF ? i === Math.min(hop, KS.length - 1) : i === KS.length - 1) ? K.invText : chainOn(i) ? K.ink : K.line,
                    fontFamily: FONT.pixelMono,
                    fontSize: 36,
                    lineHeight: '54px',
                    textAlign: 'center',
                  }}
                >
                  {k === 1 ? 'P' : `${k}P`}
                </div>
              </React.Fragment>
            ))}
          </div>
          {f < T_FF && (
            <T f={f} at={T_DA + 110} x={984} y={516} size={36} color={K.sub}>
              倍加法：5 步，而不是 12 次加法
            </T>
          )}
        </>
      )}
      {f >= T_FF && (
        <>
          <T f={f} at={T_FF + 20} x={984} y={432} size={36} color={K.sub}>
            同样的几何规则，搬到有限域上
          </T>
          <T f={f} at={T_FF + 60} x={984} y={504} size={36} font={FONT.pixelMono}>
            共 {NE} 个点 · P = ({BASE[0]}, {BASE[1]}) 阶 {ORDP}
          </T>
          {hop >= KS.length - 1 && (
            <T f={f} at={T_HOP + (KS.length - 1) * DT_HOP} x={984} y={600} size={48} font={FONT.pixelMono}>
              13P = <Tag size={48}>({KP[KP.length - 1][0]}, {KP[KP.length - 1][1]})</Tag>
            </T>
          )}
          <T f={f} at={T_HOP + (KS.length - 1) * DT_HOP + 24} x={984} y={696} size={36} color={K.sub}>
            已知 P 与 kP，求 k：椭圆曲线离散对数
          </T>
        </>
      )}
      <Caption title="椭圆曲线" en="ELLIPTIC CURVES" desc="256 位 ECC ≈ 3072 位 RSA 的安全强度" color={K.act} />
    </AbsoluteFill>
  );
};

export const PkEccCues: Cue[] = [
  [6, 'riser2'],
  [T_CHORD, 'blip', 72],
  [T_CHORD + 20, 'blip', 76],
  [T_CHORD + 84, 'tick'],
  [T_CHORD + 140, 'chime'],
  [T_TAN + 20, 'whoosh'],
  [T_TAN + 110, 'chime'],
  [T_DA + 30, 'type'],
  [T_FF, 'whoosh'],
  ...KS.map((_, i): Cue => [T_HOP + i * DT_HOP, 'blip', 67 + i * 3]),
  [T_HOP + (KS.length - 1) * DT_HOP, 'bell', 79],
];
