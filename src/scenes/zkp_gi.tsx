import React from 'react';
import {AbsoluteFill} from 'remotion';
import {GNode, Txt} from '../components/kit';
import {ALICE, BOB, SAGE, SpriteG} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {FONT, snap} from '../theme';
import {fl, Fx, Mark, sp, T} from './sig_lib';

/* ====================================================================== */
/* Graph isomorphism: zero-knowledge proof (GMW 1986)                      */
/* ====================================================================== */

type Perm = Record<number, number>;
type Edge = [number, number];
const NODES = [1, 2, 3, 4, 5];
const G0: Edge[] = [
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 1],
  [1, 3],
];
const PI: Perm = {1: 3, 2: 5, 3: 2, 4: 1, 5: 4}; // secret: G1 = π(G0)
const RHO1: Perm = {1: 4, 2: 1, 3: 5, 4: 3, 5: 2};
const RHO2: Perm = {1: 2, 2: 4, 3: 1, 4: 5, 5: 3};
const apply = (p: Perm, es: Edge[]): Edge[] => es.map(([a, b]) => [p[a], p[b]]);
const compose = (a: Perm, b: Perm): Perm => Object.fromEntries(NODES.map((v) => [v, a[b[v]]])); // (a∘b)(v) = a(b(v))
const key = (e: Edge) => (e[0] < e[1] ? `${e[0]}-${e[1]}` : `${e[1]}-${e[0]}`);
const sameGraph = (a: Edge[], b: Edge[]) => a.length === b.length && new Set(a.map(key)).size === new Set([...a.map(key), ...b.map(key)]).size;
const G1 = apply(PI, G0);
const H1 = apply(RHO1, G1);
const H2 = apply(RHO2, G1);
const SIG1 = RHO1; // b = 1 : G1 → H1
const SIG2 = compose(RHO2, PI); // b = 0 : G0 → H2 (ρ₂∘π)
const OK1 = sameGraph(apply(SIG1, G1), H1);
const OK2 = sameGraph(apply(SIG2, G0), H2);
const permStr = (p: Perm) => NODES.map((v) => `${v}→${p[v]}`).join(' ');

/* layout */
const PX0 = 360; // G0 panel
const PXH = 960; // H panel
const PX1 = 1560; // G1 panel
const PY = 330;
const RAD = 108;
const slot = (cx: number, v: number): [number, number] => {
  const a = ((-90 + 72 * (v - 1)) * Math.PI) / 180;
  return [snap(cx + Math.cos(a) * RAD), snap(PY + Math.sin(a) * RAD)];
};

const Graph: React.FC<{pos: (v: number) => [number, number]; edges: Edge[]; label: (v: number) => number; bold?: boolean; ghost?: boolean}> = ({pos, edges, label, bold, ghost}) => (
  <g>
    {edges.map(([a, b], i) => {
      const [x1, y1] = pos(a);
      const [x2, y2] = pos(b);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ghost ? T.dim : T.ink} strokeWidth={bold ? 6 : 3} />;
    })}
    {NODES.map((v) => {
      const [x, y] = pos(v);
      return <GNode key={v} x={x} y={y} r={24} label={label(v)} color={ghost ? T.dim : T.ink} fill={ghost ? 0 : 0} />;
    })}
  </g>
);

/** copy of graph `es` (labels in panel `from`) travelling to the H panel via permutation p */
const Travel: React.FC<{from: number; es: Edge[]; p: Perm; t: number}> = ({from, es, p, t}) => {
  if (t <= 0 || t >= 1) return null;
  const pos = (v: number): [number, number] => {
    const a = slot(from, v);
    const b = slot(PXH, p[v]);
    return [snap(a[0] + (b[0] - a[0]) * t), snap(a[1] + (b[1] - a[1]) * t)];
  };
  return <Graph pos={pos} edges={es} label={(v) => (t < 0.5 ? v : p[v])} ghost />;
};

const R1 = 120; // build H1
const B1 = 216; // challenge 1
const V1 = 246; // open 1
const R2 = 348; // build H2
const B2 = 432;
const V2 = 462;
const SND = 552;
const SIM = 672;

export const ZkGi: React.FC = () => {
  const f = useF();
  const round2 = f >= R2 + 42;
  const Hedges = round2 ? H2 : H1;
  const hOn = f >= R1 + 42;
  const ok1 = OK1 && f >= V1 + 48 && f < R2;
  const ok2 = OK2 && f >= V2 + 48 && f < SND;
  const sim = f >= SIM;
  // narration lines (one at a time per slot)
  let A = '';
  let B: (string | [string, string?])[] = [];
  let C = '';
  if (f >= 60) A = '目标：让 V 相信 G₀ 与 G₁ 同构，却不泄露 π';
  if (f >= R1) A = '第 1 轮 · P 随机重排 G₁，发出同构副本 H';
  if (f >= B1) {
    A = '第 1 轮 · V 抛硬币：b = 1';
    B = ['σ = ρ ：G₁ → H'];
  }
  if (f >= V1 + 48) C = OK1 ? '边一一吻合' : '';
  if (f >= R2) {
    A = '第 2 轮 · 换新的 ρ，发出新的 H';
    B = [];
    C = '';
  }
  if (f >= B2) {
    A = '第 2 轮 · V 抛硬币：b = 0';
    B = ['σ = ρ∘π ：G₀ → H'];
  }
  if (f >= V2 + 48) C = OK2 ? '边一一吻合' : '';
  if (f >= SND) {
    A = '不知道 π 的作弊者，只能为一个 b 准备好 H';
    B = ['每轮被抓 ≥ 1/2，k 轮后蒙混 ≤ 2', '^−k'];
    C = '';
  }
  if (f >= SIM) {
    A = '模拟器 S：先猜 b′，再按 b′ 造出 H；猜错就倒带重来';
    B = ['模拟出的对话 ≡ 真实对话'];
  }
  if (f >= SIM + 90) C = 'V 除了“同构”这一比特，什么也没学到';
  const kFill = f >= SND ? Math.min(10, Math.floor((f - SND - 30) / 6)) : 0;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {/* public graphs */}
        {fl(f, 0) && (
          <g>
            <Graph pos={(v) => slot(PX0, v)} edges={G0} label={(v) => v} bold={f >= V2 && f < V2 + 60} />
            <Txt x={PX0} y={480} size={36} color={T.ink} family={FONT.pixelMono}>
              G₀
            </Txt>
            <Txt x={PX0} y={528} size={24} color={T.sub}>
              公开
            </Txt>
          </g>
        )}
        {fl(f, 24) && (
          <g>
            <Graph pos={(v) => slot(PX1, v)} edges={G1} label={(v) => v} bold={f >= V1 && f < V1 + 60} />
            <Txt x={PX1} y={480} size={36} color={T.ink} family={FONT.pixelMono}>
              G₁ = π(G₀)
            </Txt>
            <Txt x={PX1} y={528} size={24} color={T.sub}>
              π 只有 P 知道
            </Txt>
          </g>
        )}
        {/* H panel */}
        <rect x={PXH - 162} y={PY - 150} width={324} height={300} fill="none" stroke={T.line} strokeWidth={3} strokeDasharray="9 6" />
        {hOn && !(f >= R2 && f < R2 + 42) && <Graph pos={(v) => slot(PXH, v)} edges={Hedges} label={(v) => v} bold={ok1 || ok2} />}
        <Txt x={PXH} y={480} size={36} color={T.ink} family={FONT.pixelMono}>
          {hOn ? 'H = ρ(G₁)' : 'H'}
        </Txt>
        <Txt x={PXH} y={528} size={24} color={T.sub}>
          P 发出的承诺
        </Txt>
        {/* travelling copies */}
        <Travel from={PX1} es={G1} p={RHO1} t={sp(f, R1, 42, 14)} />
        <Travel from={PX1} es={G1} p={RHO1} t={sp(f, V1, 42, 14)} />
        <Travel from={PX1} es={G1} p={RHO2} t={sp(f, R2, 42, 14)} />
        <Travel from={PX0} es={G0} p={SIG2} t={sp(f, V2, 42, 14)} />
        <Mark x={PXH - 108} y={576} ok show={ok1 || ok2} s={4} />
        {/* actors */}
        <SpriteG map={sim ? SAGE : ALICE} x={120} y={612} s={12} accent={T.sub} />
        <Txt x={180} y={810} size={24} color={T.sub}>
          {sim ? '模拟器 S' : '证明者 P'}
        </Txt>
        <SpriteG map={BOB} x={1680} y={612} s={12} accent={T.sub} />
        <Txt x={1740} y={810} size={24} color={T.sub}>
          验证者 V
        </Txt>
        {/* narration rows */}
        {A && (
          <Txt x={960} y={636} size={36} color={T.ink}>
            {A}
          </Txt>
        )}
        {B.length > 0 && (
          <g>
            <rect x={600} y={690} width={720} height={66} fill={T.inv} />
            <Fx x={960} y={725} size={36} color={T.invText} parts={B} />
          </g>
        )}
        {f >= B1 && f < R2 && fl(f, V1) && (
          <Txt x={960} y={804} size={24} color={T.sub} family={FONT.pixelMono}>
            {`σ: ${permStr(SIG1)}`}
          </Txt>
        )}
        {f >= B2 && f < SND && fl(f, V2) && (
          <Txt x={960} y={804} size={24} color={T.sub} family={FONT.pixelMono}>
            {`σ: ${permStr(SIG2)}`}
          </Txt>
        )}
        {C && f < SND && (
          <Txt x={PXH + 24} y={576} size={24} color={T.ink}>
            {C}
          </Txt>
        )}
        {f >= SND && f < SIM && (
          <g>
            {new Array(10).fill(0).map((_, k) => (
              <rect key={k} x={642 + k * 60} y={786} width={42} height={30} fill={k < kFill ? T.inv : T.paper} stroke={T.ink} strokeWidth={3} />
            ))}
            {kFill >= 10 && (
              <Txt x={1284} y={801} size={24} anchor="start" color={T.ink} family={FONT.pixelMono}>
                1/1024
              </Txt>
            )}
          </g>
        )}
        {C && f >= SIM && (
          <Txt x={960} y={810} size={24} color={T.ink}>
            {C}
          </Txt>
        )}
      </svg>
      <Caption title="交互式证明" en="ZERO KNOWLEDGE · GI" desc="图同构的零知识证明：每轮只打开一半，作弊者每轮被抓一半；模拟器证明 V 一无所获" color={T.act} />
    </AbsoluteFill>
  );
};

export const ZkGiCues: Cue[] = [
  [0, 'blip', 64],
  [24, 'blip', 67],
  [R1, 'whoosh'],
  [B1, 'tick'],
  [V1, 'whoosh'],
  [V1 + 48, 'chime'],
  [R2, 'whoosh'],
  [B2, 'tick'],
  [V2, 'whoosh'],
  [V2 + 48, 'blip', 76],
  [SND, 'step'],
  [SND + 90, 'bell', 72],
  [SIM, 'riser2'],
  [SIM + 90, 'bell', 79],
];
