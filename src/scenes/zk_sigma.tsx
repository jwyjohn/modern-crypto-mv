import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, BOB, SAGE, SpriteG} from '../components/pixel';
import {Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption, Pt} from '../components/ui';
import {clamp01, COL, FONT} from '../theme';
import {Mark, minv, mod, mpow, on, sup, Tag, typed} from './zk_util';

const INK = COL.text;
const M = FONT.pixelMono;

/* ---------- toy Schnorr group: Z_23^*, g = 2 of order 11 ---------- */
const P = 23;
const G = 2;
const Q = 11;
const SX = 7; // secret
const SXP = mpow(G, SX, P); // X = 13
const R0 = 5;
const C0 = 3;
const A0 = mpow(G, R0, P); // 9
const Z0 = mod(R0 + C0 * SX, Q); // 4
const LHS = mpow(G, Z0, P); // 16
const RHS = mod(A0 * mpow(SXP, C0, P), P); // 16
// special soundness: same a, second challenge
const C1 = 8;
const Z1 = mod(R0 + C1 * SX, Q); // 6
const INV = minv(mod(C0 - C1, Q), Q);
const EXT = mod((Z0 - Z1) * INV, Q); // 7
const DZ = mod(Z0 - Z1, Q); // 9  (= -2)
const DC = mod(C0 - C1, Q); // 6  (= -5)
// HVZK transcripts
const real = [
  [5, 3],
  [2, 6],
].map(([r, c]) => ({a: mpow(G, r, P), c, z: mod(r + c * SX, Q)}));
const sim = [
  [1, 8],
  [4, 9],
].map(([c, z]) => ({a: mod(mpow(G, z, P) * mpow(SXP, mod(-c, Q), P), P), c, z}));
const verifies = (t: {a: number; c: number; z: number}) => mpow(G, t.z, P) === mod(t.a * mpow(SXP, t.c, P), P);

const PH2 = 318;
const PH3 = 594;
const PH4 = 840;

const Tabs: React.FC<{f: number; active: number}> = ({active}) => (
  <g>
    {['① 完备性', '② 特殊可靠性', '③ 诚实验证者零知识'].map((s, i) => (
      <Tag key={i} x={96 + i * 588} y={168} w={552} h={60} text={s} inv={i === active} />
    ))}
  </g>
);

const Protocol: React.FC<{f: number}> = ({f}) => {
  const msgs: {pts: Pt[]; at: number; label: string; ly: number}[] = [
    {pts: [[372, 300], [1536, 372]], at: 60, label: `承诺  a = g^r = 2${sup(R0)} = ${A0}`, ly: 282},
    {pts: [[1536, 432], [372, 504]], at: 120, label: `挑战  c = ${C0}`, ly: 414},
    {pts: [[372, 564], [1536, 636]], at: 168, label: `响应  z = r + c·x = ${Z0} (mod ${Q})`, ly: 546},
  ];
  return (
    <g>
      {on(f, 6) && (
        <Txt x={960} y={192} size={36}>
          {`公开：g = ${G}，X = g^x = ${SXP} (mod ${P})　　P 的秘密：x = ${SX}`}
        </Txt>
      )}
      {f >= 12 && <SpriteG map={ALICE} x={168} y={324} s={12} accent={INK} />}
      {f >= 18 && <SpriteG map={BOB} x={1632} y={324} s={12} accent={COL.dim} />}
      {on(f, 24) && (
        <>
          <Txt x={228} y={528}>
            证明者 P
          </Txt>
          <Txt x={1692} y={528}>
            验证者 V
          </Txt>
        </>
      )}
      {msgs.map((m, i) => (
        <g key={i}>
          <Arrow pts={m.pts} t={clamp01((f - m.at) / 30)} color={INK} w={6} glow={false} />
          {on(f, m.at + 24) && (
            <Txt x={954} y={m.ly} size={36} family={M}>
              {m.label}
            </Txt>
          )}
        </g>
      ))}
      {on(f, 222) && <Tag x={588} y={690} w={744} h={72} text="验证：g^z = a · X^c" size={48} inv />}
      {f >= 246 && (
        <Txt x={960} y={804} size={36} family={M}>
          {typed(`2${sup(Z0)} = ${LHS}　　${A0}·${SXP}${sup(C0)} ≡ ${RHS} (mod ${P})  ✓`, f, 246, 1.2)}
        </Txt>
      )}
    </g>
  );
};

const Soundness: React.FC<{f: number}> = ({f}) => {
  const s = f - PH2;
  const leaf = (y: number, c: string, z: string, at: number) =>
    s >= at && (
      <g>
        <Arrow pts={[[384, 492], [576, y + 36]]} t={clamp01((s - at) / 15)} color={INK} w={3} head={12} glow={false} />
        {on(s, at + 12) && <Tag x={588} y={y} w={384} h={72} text={`${c} → ${z}`} family={M} />}
      </g>
    );
  return (
    <g>
      {on(s, 12) && (
        <Txt x={96} y={300} size={36} anchor="start" color={COL.sub}>
          同一个承诺，倒带后换个挑战
        </Txt>
      )}
      {on(s, 6) && <Tag x={120} y={456} w={264} h={72} text={`a = ${A0}`} family={M} inv />}
      {leaf(360, `c = ${C0}`, `z = ${Z0}`, 30)}
      {leaf(552, `c' = ${C1}`, `z' = ${Z1}`, 54)}
      {s >= 96 && <SpriteG map={SAGE} x={1086} y={270} s={6} accent={INK} />}
      {on(s, 96) && (
        <Txt x={1176} y={312} size={36} anchor="start">
          提取器
        </Txt>
      )}
      {[
        {t: "x = (z − z')/(c − c')", at: 108},
        {t: `= (${Z0 - Z1})/(${C0 - C1}) (mod ${Q})`, at: 138},
        {t: `≡ ${DZ} · ${DC}⁻¹ ≡ ${DZ} · ${INV}`, at: 168},
      ].map((l, i) =>
        on(s, l.at) ? (
          <Txt key={i} x={1086} y={402 + i * 84} size={i === 0 ? 48 : 36} anchor="start" family={M}>
            {l.t}
          </Txt>
        ) : null,
      )}
      {on(s, 198) && (
        <g>
          <Tag x={1086} y={630} w={420} h={84} text={`x = ${EXT}`} size={60} family={M} inv />
          <Mark x={1566} y={672} ok={EXT === SX} s={60} />
        </g>
      )}
    </g>
  );
};

const Hvzk: React.FC<{f: number}> = ({f}) => {
  const s = f - PH3;
  const col = (x: number, title: string, recipe: string, ts: {a: number; c: number; z: number}[], at: number) => (
    <g>
      {on(s, at) && (
        <Txt x={x} y={300} size={48} anchor="start">
          {title}
        </Txt>
      )}
      {on(s, at + 18) && (
        <Txt x={x} y={384} size={36} anchor="start" family={M} color={COL.sub}>
          {recipe}
        </Txt>
      )}
      {ts.map((t, i) =>
        on(s, at + 48 + i * 24) ? (
          <g key={i}>
            <Tag x={x} y={444 + i * 96} w={420} h={72} text={`(${t.a}, ${t.c}, ${t.z})`} size={48} family={M} />
            <Mark x={x + 480} y={480 + i * 96} ok={verifies(t)} />
          </g>
        ) : null,
      )}
    </g>
  );
  return (
    <g>
      {col(120, '真实对话（知道 x）', 'r → a = g^r → c → z', real, 0)}
      {col(1020, '模拟器（不知道 x）', '先选 c, z → a = g^z·X^(−c)', sim, 30)}
      {on(s, 30) && <rect x={954} y={276} width={3} height={384} fill={COL.line} />}
      {on(s, 144) && <Tag x={360} y={708} w={1200} h={84} text="≡  两边的 (a, c, z) 分布完全相同" size={48} inv />}
    </g>
  );
};

const Summary: React.FC<{f: number}> = ({f}) => {
  const s = f - PH4;
  return (
    <g>
      {[
        '① 完备性：诚实的 P 总能通过',
        '② 特殊可靠性：两个挑战即可提取出 x',
        '③ 诚实验证者零知识：对话可被模拟',
      ].map((t, i) => (on(s, 6 + i * 18) ? <Tag key={i} x={360} y={264 + i * 132} w={1200} h={96} text={t} size={48} inv={i === 2} /> : null))}
      {on(s, 72) && (
        <Txt x={960} y={720} size={36} color={COL.sub}>
          再用哈希代替验证者出挑战（Fiat–Shamir）→ Schnorr 签名
        </Txt>
      )}
    </g>
  );
};

export const ZkSigma: React.FC = () => {
  const f = useF();
  const phase = f < PH2 ? 0 : f < PH3 ? 1 : f < PH4 ? 2 : 3;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {phase === 0 && <Protocol f={f} />}
        {phase >= 1 && phase <= 2 && <Tabs f={f} active={phase} />}
        {phase === 1 && <Soundness f={f} />}
        {phase === 2 && <Hvzk f={f} />}
        {phase === 3 && <Summary f={f} />}
      </svg>
      <Caption title="Σ 协议" en="SIGMA PROTOCOLS" desc="完备性 · 特殊可靠性 · 诚实验证者零知识" color={COL.zk} />
    </AbsoluteFill>
  );
};

export const ZkSigmaCues: Cue[] = [
  [6, 'whoosh'],
  [60, 'blip', 72],
  [120, 'blip', 76],
  [168, 'blip', 79],
  [246, 'chime'],
  [PH2, 'whoosh'],
  [PH2 + 54, 'blip', 74],
  [PH2 + 108, 'type'],
  [PH2 + 198, 'bell', 84],
  [PH3, 'whoosh'],
  [PH3 + 78, 'tick'],
  [PH3 + 102, 'tick'],
  [PH3 + 144, 'bell', 79],
  [PH4, 'riser2'],
  [PH4 + 6, 'blip', 72],
  [PH4 + 24, 'blip', 76],
  [PH4 + 42, 'blip', 79],
  [PH4 + 72, 'chime'],
];
