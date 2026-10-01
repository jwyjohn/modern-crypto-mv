import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, BOB, LOCK, SpriteG} from '../components/pixel';
import {GNode, Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption, Pt} from '../components/ui';
import {clamp01, COL, FONT, rnd} from '../theme';
import {Mark, on, Tag, typed} from './zk_util';

const INK = COL.text;
const M = FONT.pixelMono;

/* x^3 + x + 5 = 35, witness x = 3 */
const WX = 3;
const V1 = WX * WX;
const V2 = V1 * WX;
const V3 = V2 + WX;
const OUT = V3 + 5;

const STAGES = ['① 程序', '② 算术电路', '③ R1CS → 多项式', '④ 承诺 + Fiat–Shamir', '⑤ 证明 π'];
const ST = [24, 102, 186, 276, 342];
const CMP = 402; // contrast phase

const Pipeline: React.FC<{f: number; cur: number}> = ({f, cur}) => (
  <g>
    {STAGES.map((s, i) =>
      f >= ST[i] - 12 || f >= CMP ? (
        <g key={i}>
          <Tag x={96 + i * 354} y={168} w={312} h={60} text={s} size={24} inv={i === cur} />
          {i < 4 && <rect x={96 + i * 354 + 318} y={195} width={30} height={6} fill={INK} />}
        </g>
      ) : null,
    )}
  </g>
);

const Program: React.FC<{s: number}> = ({s}) => (
  <g>
    <SpriteG map={ALICE} x={216} y={378} s={12} accent={INK} />
    {s >= 6 && (
      <Txt x={1056} y={456} size={96} family={M}>
        {typed(`x³ + x + 5 = ${OUT}`, s, 6, 0.6)}
      </Txt>
    )}
    {on(s, 36) && (
      <Txt x={1056} y={588} size={36}>
        “我知道一个 x 使它成立”——却不想说出 x
      </Txt>
    )}
    {s >= 48 && <SpriteG map={LOCK} x={1002} y={654} s={6} accent={INK} />}
    {on(s, 48) && (
      <Txt x={1080} y={690} size={36} anchor="start" family={M}>
        x = ?
      </Txt>
    )}
  </g>
);

const Circuit: React.FC<{s: number}> = ({s}) => {
  const Y = 456;
  const xs = [216, 576, 900, 1224, 1548];
  const out: Pt = [1740, Y];
  const gate = (i: number, lbl: string) => s >= 6 + i * 12 && <GNode key={i} x={xs[i]} y={Y} r={48} label={lbl} color={INK} size={36} fill={i === 0 ? 1 : 0} />;
  const wire = (a: Pt, b: Pt, at: number, val?: string, vy = -36) => (
    <g>
      <Arrow pts={[a, b]} t={clamp01((s - at) / 12)} color={INK} w={3} head={12} glow={false} />
      {val && on(s, at + 12) && (
        <Txt x={(a[0] + b[0]) / 2} y={a[1] + vy} size={36} family={M} color={COL.sub}>
          {val}
        </Txt>
      )}
    </g>
  );
  return (
    <g>
      {wire([xs[0] + 54, Y], [xs[1] - 54, Y], 18, `${WX}`)}
      {wire([xs[1] + 54, Y], [xs[2] - 54, Y], 30, `${V1}`)}
      {wire([xs[2] + 54, Y], [xs[3] - 54, Y], 42, `${V2}`)}
      {wire([xs[3] + 54, Y], [xs[4] - 54, Y], 54, `${V3}`)}
      {wire([xs[4] + 54, Y], [out[0] - 36, Y], 66, `${OUT}`)}
      {/* x also feeds gates 2 and 3 */}
      {s >= 30 && (
        <g>
          <polyline points={`${xs[0]},${Y + 54} ${xs[0]},${Y + 120} ${xs[2]},${Y + 120} ${xs[2]},${Y + 54}`} fill="none" stroke={COL.dim} strokeWidth={3} />
          <polyline points={`${xs[0] - 18},${Y + 54} ${xs[0] - 18},${Y + 168} ${xs[3]},${Y + 168} ${xs[3]},${Y + 54}`} fill="none" stroke={COL.dim} strokeWidth={3} />
        </g>
      )}
      {gate(0, 'x')}
      {gate(1, '×')}
      {gate(2, '×')}
      {gate(3, '+')}
      {gate(4, '+5')}
      {s >= 72 && (
        <Txt x={out[0] + 6} y={Y} size={48} family={M}>
          {OUT}
        </Txt>
      )}
      {on(s, 60) && (
        <Txt x={960} y={756} size={36}>
          程序被拆成一个个加法门、乘法门
        </Txt>
      )}
    </g>
  );
};

const R1cs: React.FC<{s: number}> = ({s}) => {
  const rows = [
    ['x · x = v₁', `${WX}·${WX} = ${V1}`],
    ['v₁ · x = v₂', `${V1}·${WX} = ${V2}`],
    ['(v₂ + x) · 1 = v₃', `${V2}+${WX} = ${V3}`],
    ['(v₃ + 5) · 1 = out', `${V3}+5 = ${OUT}`],
  ];
  return (
    <g>
      {rows.map((r, i) =>
        on(s, 6 + i * 12) ? (
          <g key={i}>
            <Txt x={360} y={312 + i * 84} size={48} anchor="start" family={M}>
              {r[0]}
            </Txt>
            <Txt x={1176} y={312 + i * 84} size={36} anchor="start" family={M} color={COL.sub}>
              {r[1]}
            </Txt>
            <Mark x={1560} y={312 + i * 84} ok s={48} />
          </g>
        ) : null,
      )}
      {on(s, 60) && <Tag x={276} y={690} w={1368} h={96} text="所有约束  ⇔  A(X)·B(X) − C(X) = H(X)·Z(X)" size={48} family={M} inv />}
    </g>
  );
};

const Commit: React.FC<{s: number}> = ({s}) => {
  // a stepped polynomial curve
  const X0 = 156;
  const W = 720;
  const pts: string[] = [];
  const yOf = (t: number) => 540 - 150 * Math.sin(t * 5.2) * (0.6 + 0.4 * Math.cos(t * 2.3));
  const n = Math.floor(clamp01(s / 24) * 60);
  for (let i = 0; i <= n; i++) {
    const t = i / 60;
    pts.push(`${X0 + t * W},${Math.round(yOf(t) / 6) * 6}`);
  }
  const tau = 0.63;
  return (
    <g>
      <rect x={X0} y={540} width={W} height={3} fill={COL.line} />
      {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke={INK} strokeWidth={6} />}
      {on(s, 30) && (
        <g>
          <rect x={X0 + tau * W - 3} y={330} width={6} height={420} fill={COL.dim} />
          <rect x={X0 + tau * W - 15} y={Math.round(yOf(tau) / 6) * 6 - 12} width={30} height={24} fill={INK} />
          <Txt x={X0 + tau * W} y={786} size={36} family={M}>
            τ
          </Txt>
        </g>
      )}
      {[
        {t: '承诺多项式（如 KZG）', at: 12, c: INK},
        {t: '挑战 τ = Hash(承诺)：去掉交互', at: 30, c: INK},
        {t: '随机点上相等 ⇒ 几乎处处相等', at: 48, c: COL.sub},
        {t: '另一条路线：Sumcheck 协议', at: 60, c: COL.sub},
      ].map((l, i) =>
        on(s, l.at) ? (
          <Txt key={i} x={1008} y={336 + i * 120} size={36} anchor="start" color={l.c}>
            {l.t}
          </Txt>
        ) : null,
      )}
    </g>
  );
};

const Proof: React.FC<{s: number}> = ({s}) => (
  <g>
    {['A ∈ G₁', 'B ∈ G₂', 'C ∈ G₁'].map((t, i) => (on(s, 6 + i * 9) ? <Tag key={i} x={300 + i * 468} y={360} w={384} h={144} text={t} size={60} family={M} inv /> : null))}
    {on(s, 36) && (
      <Txt x={960} y={636} size={48}>
        Groth16：3 个群元素 = 192 字节
      </Txt>
    )}
    {on(s, 42) && (
      <Txt x={960} y={720} size={24} color={COL.sub}>
        BLS12-381 曲线上压缩表示
      </Txt>
    )}
  </g>
);

const Contrast: React.FC<{f: number}> = ({f}) => {
  const s = f - CMP;
  const COLS = 42;
  const ROWS = 24;
  const fill = clamp01((s - 18) / 150);
  return (
    <g>
      {on(s, 0) && (
        <Txt x={120} y={306} size={48} anchor="start">
          计算：上百万个门
        </Txt>
      )}
      {s >= 6 &&
        new Array(COLS * ROWS).fill(0).map((_, k) => {
          const c = k % COLS;
          const r = Math.floor(k / COLS);
          const done = rnd(k * 0.731 + 3) * 0.7 + (c / COLS) * 0.3 < fill;
          return <rect key={k} x={120 + c * 18} y={360 + r * 18} width={12} height={12} fill={done ? INK : COL.line} />;
        })}
      {on(s, 168) && (
        <g>
          <Arrow pts={[[906, 576], [1092, 576]]} t={clamp01((s - 168) / 15)} color={INK} w={6} glow={false} />
          <Txt x={999} y={528} size={24} color={COL.sub}>
            压缩
          </Txt>
        </g>
      )}
      {on(s, 186) && (
        <g>
          <Txt x={1146} y={306} size={48} anchor="start">
            证明：几百字节
          </Txt>
          <Tag x={1146} y={504} w={144} h={144} text="π" size={72} family={M} inv />
          <Txt x={1326} y={576} size={48} anchor="start" family={M}>
            192 B
          </Txt>
        </g>
      )}
      {s >= 222 && <SpriteG map={BOB} x={1152} y={684} s={6} accent={COL.dim} />}
      {on(s, 222) && (
        <g>
          <Txt x={1242} y={726} size={36} anchor="start">
            验证：3 次配对，毫秒级
          </Txt>
          <Mark x={1758} y={726} ok />
        </g>
      )}
    </g>
  );
};

export const ZkSnark: React.FC = () => {
  const f = useF();
  const cur = f >= CMP ? -1 : ST.reduce((acc, t, i) => (f >= t ? i : acc), -1);
  const s = cur >= 0 ? f - ST[cur] : 0;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        <Pipeline f={f} cur={cur} />
        {cur === 0 && <Program s={s} />}
        {cur === 1 && <Circuit s={s} />}
        {cur === 2 && <R1cs s={s} />}
        {cur === 3 && <Commit s={s} />}
        {cur === 4 && <Proof s={s} />}
        {f >= CMP && <Contrast f={f} />}
      </svg>
      <Caption title="SNARK" en="SUCCINCT ARGUMENTS" desc="计算再大，证明也只有几百字节，验证只需毫秒" color={COL.zk} />
    </AbsoluteFill>
  );
};

export const ZkSnarkCues: Cue[] = [
  [6, 'whoosh'],
  [ST[0] + 6, 'type'],
  [ST[1], 'step'],
  ...[0, 1, 2, 3, 4].map((i): Cue => [ST[1] + 6 + i * 12, 'blip', 67 + i * 3]),
  [ST[2], 'step'],
  [ST[2] + 60, 'chime'],
  [ST[3], 'step'],
  [ST[3] + 30, 'tick'],
  [ST[4], 'step'],
  [ST[4] + 36, 'bell', 84],
  [CMP, 'riser2'],
  [CMP + 168, 'whoosh'],
  [CMP + 222, 'chime'],
];
