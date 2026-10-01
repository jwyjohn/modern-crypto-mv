import React from 'react';
import {AbsoluteFill} from 'remotion';
import {MILESTONES} from '../cites';
import {Excerpt} from '../components/Excerpt';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {BlockCursor, DitherFill} from '../components/pixel';
import {ACTS} from '../components/ui';
import {clamp01, COL, FONT, PX, quant, snap} from '../theme';
import * as P from './pk';
import * as G from './sig';
import * as FR from './fr';
import {CHAINS, ChainNode, digestFrames} from './short_nodes';
import * as S from './sym';
import * as SX from './symx';
import * as Z from './zk';
import * as ZP from './zkp';

/**
 * Short version · chapter digest: every algorithm of the chapter, in order, with where it comes from
 * and what it leads to ("来龙去脉").
 *   0 – 360            numeral + name, the chapter's core sentence typed large, the lineage rail drawn
 *   360 + k·360 (6 s)  node k is "current": a live excerpt of its full-version scene, its year + name,
 *                      what it achieves (`does`) and the question it leaves open (→ `next`)
 *   last 240           the whole chain at once + the chapter's milestone years, closing bell
 * A lineage rail on the right is always visible: past nodes ink, current inverted, future dim.
 */

/* ---------- excerpt sources: shot id → scene + a 4–5 s slice that shows the key visual ---------- */
type Crop = {x: number; y: number; w: number; h: number};
const STAGE: Crop = {x: 96, y: 150, w: 1728, h: 720}; // concept scenes (caption hidden in mini mode)
const CASE: Crop = {x: 96, y: 234, w: 1728, h: 720}; // case scenes: stage below the case header bar
type Src = {C: React.FC; from: number; to: number; crop?: Crop};
export const EXCERPTS: Record<string, Src> = {
  sym_otp: {C: S.SymOtp, from: 60, to: 360},
  sym_p_twotime: {C: S.SymTwoTime, from: 600, to: 920, crop: CASE},
  sym_aes: {C: S.SymAes, from: 420, to: 740},
  sym_diff: {C: SX.SymDiff, from: 520, to: 840},
  sym_p_algebraic: {C: SX.SymAlgebraic, from: 760, to: 1080, crop: CASE},
  sym_modes: {C: S.SymModes, from: 240, to: 560},
  sym_p_birthday: {C: S.SymBirthday, from: 380, to: 700, crop: CASE},
  sym_ae: {C: S.SymAe, from: 300, to: 620},

  pk_group: {C: P.PkGroup, from: 420, to: 720},
  pk_dh: {C: P.PkDh, from: 420, to: 740},
  pk_p_rsa: {C: P.PkRsa, from: 600, to: 920, crop: CASE},
  pk_p_hastad: {C: P.PkHastad, from: 640, to: 960, crop: CASE},
  pk_ecc: {C: P.PkEcc, from: 380, to: 700},
  pk_tls: {C: P.PkTls, from: 120, to: 440},

  sig_euf: {C: G.SigEuf, from: 260, to: 580},
  sig_lamport: {C: G.SigLamport, from: 250, to: 570},
  sig_merkle: {C: G.SigMerkle, from: 200, to: 520},
  sig_schnorr: {C: G.SigSchnorr, from: 300, to: 620},
  sig_bls: {C: G.SigBls, from: 230, to: 530},

  zk_cave: {C: Z.ZkCave, from: 360, to: 680},
  zk_gi: {C: ZP.ZkGi, from: 140, to: 460},
  zk_sigma: {C: Z.ZkSigma, from: 420, to: 740},
  zk_p_fs: {C: ZP.ZkFs, from: 640, to: 960, crop: CASE},
  zk_sumcheck: {C: ZP.ZkSumcheck, from: 220, to: 540},
  zk_snark: {C: Z.ZkSnark, from: 420, to: 700},

  fr_lwe: {C: Z.ZkLwe, from: 640, to: 950},
  fr_dilithium: {C: FR.FrDilithium, from: 380, to: 700},
  fr_masking: {C: FR.FrMasking, from: 240, to: 560},
  fr_p_shamir: {C: Z.ZkShamir, from: 600, to: 920, crop: CASE},
  fr_mpc: {C: FR.FrMpc, from: 250, to: 570},
  fr_pir: {C: FR.FrPir, from: 120, to: 440},
  fr_dp: {C: FR.FrDp, from: 120, to: 440},
  fr_fhe: {C: Z.ZkFhe, from: 260, to: 580},
};

/* ---------- schedule (scene frames) ---------- */
const INTRO = 360;
const NODE = 360;
const T_HEAD = 12;
const T_CORE = 48;
const CORE_RATE = 5;
const T_FROM = 168; // "从「…」到「…」"
const T_RAIL = 200; // rail nodes appear one by one
const RAIL_GAP = 18;
// within a node
const N_NAME = 6;
const N_DOES = 48;
const N_NEXT = 180;
const N_PLAY = 12;
// finale (relative to its start)
const E_MS = 24;
const E_MS_DRAW = 96;
const E_BELL = 132;
const E_NEXT = 150;

const nodeStart = (k: number) => INTRO + k * NODE;
const finaleStart = (n: number) => INTRO + n * NODE;

/* ---------- layout ---------- */
const LX = 96;
const EX_Y = 162;
const EX_W = 1296;
const TX_Y = 732;
const RAIL_X = 1452;
const RAIL_TOP = 168;
const RAIL_BOT = 918;

const typedN = (f: number, at: number, len: number, rate: number) => Math.max(0, Math.min(len, Math.floor((f - at) / rate)));

/* ---------- pieces ---------- */

const Head: React.FC<{f: number; act: number; core: string; small: boolean}> = ({f, act, core, small}) => {
  const a = ACTS[act];
  if (f < T_HEAD) return null;
  const nn = typedN(f, T_HEAD + 12, a.name.length, 6);
  return (
    <>
      <div style={{position: 'absolute', left: LX, top: 48, display: 'flex', alignItems: 'flex-end', gap: 30, whiteSpace: 'nowrap'}}>
        <div style={{fontFamily: FONT.press, fontSize: 48, lineHeight: '54px', color: COL.text}}>{a.num}</div>
        <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.dim}}>{a.zh}</div>
        <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text}}>{a.name.slice(0, nn)}</div>
      </div>
      {small && <div style={{position: 'absolute', right: 96, top: 66, fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.sub, whiteSpace: 'nowrap'}}>{core}</div>}
    </>
  );
};

/** opening: the chapter's core sentence, large */
const CoreIntro: React.FC<{f: number; core: string; nodes: ChainNode[]}> = ({f, core, nodes}) => {
  if (f < T_CORE - 18) return null;
  const rule = quant(clamp01((f - (T_CORE - 18)) / 18), 6);
  const n = typedN(f, T_CORE, core.length, CORE_RATE);
  const from = `从「${nodes[0].name}」到「${nodes[nodes.length - 1].name}」`;
  const fn = typedN(f, T_FROM, from.length, 2);
  return (
    <>
      <div style={{position: 'absolute', left: LX, top: 294, width: 96 * rule, height: PX, background: COL.ink}} />
      <div style={{position: 'absolute', left: LX, top: 324, fontFamily: FONT.pixel, fontSize: 60, lineHeight: '84px', color: COL.text, whiteSpace: 'nowrap'}}>
        {core.slice(0, n)}
        {f < T_FROM && <BlockCursor f={f} size={60} on={n < core.length ? true : undefined} />}
      </div>
      {f >= T_FROM && (
        <div style={{position: 'absolute', left: LX, top: 444, fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub, whiteSpace: 'nowrap'}}>
          {from.slice(0, fn)}
          <span style={{color: COL.dim}}>{fn >= from.length ? `  ·  ${nodes.length} 步` : ''}</span>
        </div>
      )}
    </>
  );
};

/** the lineage rail: every node of the chapter, top to bottom, connected by arrows */
const Rail: React.FC<{f: number; nodes: ChainNode[]; cur: number; done: boolean}> = ({f, nodes, cur, done}) => {
  const n = nodes.length;
  const pitch = snap(Math.min(132, (RAIL_BOT - RAIL_TOP - 60) / (n - 1)));
  const shown = done || cur >= 0 ? n : Math.max(0, Math.min(n, Math.floor((f - T_RAIL) / RAIL_GAP) + 1));
  if (shown <= 0) return null;
  const y = (i: number) => RAIL_TOP + i * pitch;
  const MX = RAIL_X + 6; // marker column (centre x = MX + 6)
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}} shapeRendering="crispEdges">
        {nodes.slice(0, shown).map((_, i) => {
          const past = done || i < cur;
          const isCur = !done && i === cur;
          const c = past || isCur ? COL.ink : COL.dim;
          const yy = y(i) + 18; // marker centre (aligned to the name line)
          return (
            <g key={i}>
              {/* connector + arrow head to the next node */}
              {i < shown - 1 && (
                <>
                  <rect x={MX + 5} y={yy + 15} width={3} height={pitch - 36} fill={i < cur || done ? COL.ink : COL.dim} />
                  <polygon points={`${MX - 1},${yy + pitch - 24} ${MX + 14},${yy + pitch - 24} ${MX + 6.5},${yy + pitch - 15}`} fill={i < cur || done ? COL.ink : COL.dim} />
                </>
              )}
              {isCur ? (
                <rect x={MX - 3} y={yy - 9} width={21} height={21} fill={COL.ink} />
              ) : past ? (
                <rect x={MX} y={yy - 6} width={15} height={15} fill={COL.ink} />
              ) : (
                <rect x={MX + 1.5} y={yy - 4.5} width={12} height={12} fill="none" stroke={c} strokeWidth={3} />
              )}
            </g>
          );
        })}
      </svg>
      {nodes.slice(0, shown).map((nd, i) => {
        const past = done || i < cur;
        const isCur = !done && i === cur;
        return (
          <div key={i} style={{position: 'absolute', left: RAIL_X + 48, top: y(i), whiteSpace: 'nowrap'}}>
            <div
              style={{
                display: 'inline-block',
                fontFamily: FONT.pixel,
                fontSize: 24,
                lineHeight: '36px',
                padding: '0 9px',
                marginLeft: -9,
                background: isCur ? COL.inv : undefined,
                color: isCur ? COL.invText : past ? COL.text : COL.dim,
              }}
            >
              {nd.name}
            </div>
            {pitch >= 84 && <div style={{fontFamily: FONT.press, fontSize: 12, lineHeight: '24px', color: isCur || past ? COL.sub : COL.dim, marginTop: 3}}>{nd.year}</div>}
          </div>
        );
      })}
    </>
  );
};

/** node k: excerpt panel + year/name, does, → next */
const NodeView: React.FC<{f: number; k: number; nd: ChainNode; act: number}> = ({f, k, nd, act}) => {
  const s = nodeStart(k);
  const lf = f - s;
  const src = EXCERPTS[nd.shot];
  const crop = src?.crop ?? STAGE;
  const h = Math.round((crop.h * EX_W) / crop.w);
  const cover = 1 - quant(clamp01(lf / 18), 6);
  const nn = typedN(lf, N_NAME, nd.name.length, 3);
  const dn = typedN(lf, N_DOES, nd.does.length, 2);
  const xn = typedN(lf, N_NEXT + 9, nd.next.length, 3);
  return (
    <>
      {src ? (
        <Excerpt key={nd.shot} C={src.C} from={src.from} to={src.to} at={s + N_PLAY} dur={src.to - src.from} x={LX} y={EX_Y} w={EX_W} crop={crop} />
      ) : (
        <div style={{position: 'absolute', left: LX, top: EX_Y, width: EX_W, height: h, outline: `3px solid ${COL.ink}`}} />
      )}
      {cover > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}} shapeRendering="crispEdges">
          <DitherFill id={`dg-cv-${act}-${k}`} level={cover} x={LX - 3} y={EX_Y - 3} w={EX_W + 6} h={h + 6} color={COL.bg} cell={PX} />
        </svg>
      )}
      {/* year + name */}
      <div style={{position: 'absolute', left: LX, top: TX_Y, display: 'flex', alignItems: 'baseline', gap: 30, whiteSpace: 'nowrap'}}>
        <span style={{fontFamily: FONT.pixel, fontSize: 48, lineHeight: '60px', color: COL.text}}>
          {nd.name.slice(0, nn)}
          {nn < nd.name.length && <BlockCursor f={f} size={48} on />}
        </span>
        {lf >= N_NAME && <span style={{fontFamily: FONT.press, fontSize: 16, color: COL.dim}}>{nd.year}</span>}
      </div>
      {/* what it achieves */}
      {lf >= N_DOES && (
        <div style={{position: 'absolute', left: LX, top: TX_Y + 78, fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text, whiteSpace: 'nowrap'}}>
          {nd.does.slice(0, dn)}
          {dn < nd.does.length && <BlockCursor f={f} size={36} on />}
        </div>
      )}
      {/* the open question → next node */}
      {nd.next && lf >= N_NEXT && (
        <div style={{position: 'absolute', left: LX, top: TX_Y + 144, display: 'flex', alignItems: 'baseline', gap: 18, whiteSpace: 'nowrap'}}>
          <span style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text}}>→</span>
          <span style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub}}>
            {nd.next.slice(0, xn)}
            {lf >= N_NEXT + 9 && xn < nd.next.length && <BlockCursor f={f} size={36} color={COL.sub} on />}
          </span>
        </div>
      )}
    </>
  );
};

/** finale: the core sentence again, the chapter's milestone years, and the bridge to the next chapter */
const Finale: React.FC<{f: number; act: number; core: string; nodes: ChainNode[]}> = ({f, act, core, nodes}) => {
  const lf = f - finaleStart(nodes.length);
  const ms = MILESTONES[String(act + 1).padStart(2, '0')] ?? [];
  const X0 = 216;
  const X1 = 1272;
  const LY = 594;
  const m = Math.max(1, ms.length - 1);
  const mx = (i: number) => snap(X0 + (i / m) * (X1 - X0));
  const line = quant(clamp01((lf - E_MS) / E_MS_DRAW), 16);
  const bridge = nodes[nodes.length - 1].next;
  const bn = typedN(lf, E_NEXT, bridge.length, 3);
  const levels = ms.length > 8 ? 3 : ms.length > 5 ? 2 : 1; // stagger label depth when the strip is crowded
  return (
    <>
      <div style={{position: 'absolute', left: LX, top: 174, width: 96, height: PX, background: COL.ink}} />
      <div style={{position: 'absolute', left: LX, top: 204, fontFamily: FONT.pixel, fontSize: 60, lineHeight: '84px', color: COL.text, whiteSpace: 'nowrap'}}>{core}</div>
      <div style={{position: 'absolute', left: LX, top: 318, fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub, whiteSpace: 'nowrap'}}>
        {nodes.length} 步 · {nodes.map((x) => x.year.split(' · ')[0]).sort()[0]} — {[...nodes].map((x) => x.year.split(' · ').slice(-1)[0]).sort().slice(-1)[0]}
      </div>
      {lf >= E_MS && (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}} shapeRendering="crispEdges">
          <rect x={X0} y={LY} width={snap((X1 - X0) * line)} height={3} fill={COL.ink} />
          {ms.map(([y, label], i) => {
            if (line < i / m - 0.001) return null;
            const x = mx(i);
            const lv = i % levels;
            return (
              <g key={i}>
                <rect x={x - 6} y={LY - 6} width={15} height={15} fill={COL.ink} />
                {lv > 0 && <rect x={x} y={LY + 15} width={3} height={42 * lv} fill={COL.line} />}
                <text x={x + 1} y={LY - 30} textAnchor="middle" fontFamily={FONT.press} fontSize={16} fill={COL.text}>
                  {y}
                </text>
                <text x={x + 1} y={LY + 48 + 42 * lv} textAnchor="middle" fontFamily={FONT.pixel} fontSize={24} fill={COL.sub}>
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {bridge && lf >= E_NEXT && (
        <div style={{position: 'absolute', left: LX, top: 792, display: 'flex', alignItems: 'baseline', gap: 18, whiteSpace: 'nowrap'}}>
          <span style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text}}>→</span>
          <span style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub}}>
            {bridge.slice(0, bn)}
            {bn < bridge.length && <BlockCursor f={f} size={36} color={COL.sub} on />}
          </span>
        </div>
      )}
    </>
  );
};

export const Digest: React.FC<{act: number}> = ({act}) => {
  const f = useF();
  const {core, nodes} = CHAINS[act];
  const n = nodes.length;
  const k = f < INTRO ? -1 : Math.min(n, Math.floor((f - INTRO) / NODE));
  const fin = k >= n;
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <Head f={f} act={act} core={core} small={k >= 0 && !fin} />
      {k < 0 && <CoreIntro f={f} core={core} nodes={nodes} />}
      {k >= 0 && !fin && <NodeView key={k} f={f} k={k} nd={nodes[k]} act={act} />}
      {fin && <Finale f={f} act={act} core={core} nodes={nodes} />}
      <Rail f={f} nodes={nodes} cur={fin ? -1 : k} done={fin} />
    </AbsoluteFill>
  );
};

/* ---------- cues (scene-local) ---------- */
const digestCues = (act: number): Cue[] => {
  const {core, nodes} = CHAINS[act];
  const n = nodes.length;
  const F = finaleStart(n);
  const out: Cue[] = [
    [T_HEAD, 'blip', 64],
    ...new Array(Math.ceil(core.length / 3)).fill(0).map((_, i): Cue => [T_CORE + i * CORE_RATE * 3, 'type']),
    [T_CORE + core.length * CORE_RATE + 6, 'bell', 76],
    ...nodes.map((_, i): Cue => [T_RAIL + i * RAIL_GAP, 'tick']),
    ...nodes.flatMap((nd, i): Cue[] => {
      const s = nodeStart(i);
      return [
        [s, 'chime'],
        [s + N_NAME, 'type'],
        [s + N_DOES, 'type'],
        [s + N_DOES + 30, 'type'],
        ...(nd.next ? ([[s + N_NEXT, 'blip', 67]] as Cue[]) : []),
      ];
    }),
    [F, 'whoosh'],
    ...new Array(6).fill(0).map((_, i): Cue => [F + E_MS + i * 16, 'tick']),
    [F + E_BELL, 'bell', 84],
    ...(nodes[n - 1].next ? ([[F + E_NEXT, 'type']] as Cue[]) : []),
  ];
  return out.filter((c) => c[0] < digestFrames(n));
};

export const DigestSymCues = digestCues(0);
export const DigestPkCues = digestCues(1);
export const DigestSigCues = digestCues(2);
export const DigestZkCues = digestCues(3);
export const DigestFrCues = digestCues(4);
/** kept for the timeline until it switches to the per-chapter arrays */
export const DigestCues = DigestSymCues;
