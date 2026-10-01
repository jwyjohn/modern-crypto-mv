import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, BOB, EVE, SpriteG} from '../components/pixel';
import {Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {along, Caption, Pt} from '../components/ui';
import {blink, clamp01, COL, eInOut, FONT, PX, quant, rnd} from '../theme';
import {Card, g6, Mark, on, Tag} from './zk_util';

const INK = COL.text;
const RED = COL.red;

/* ---------- cave map (tile grid) ---------- */
const T = 42;
const X0 = 132;
const Y0 = 228;
const xL = X0 + 3 * T;
const xR = X0 + 15 * T;
const xM = X0 + 9 * T;
const yTop = Y0 + 2 * T;
const yBot = Y0 + 10 * T;
const GROUND = 822;
const ENT: Pt = [xM, GROUND - 42];
const FORK: Pt = [xM, yBot];
const V0: Pt = [X0 + 15 * T, GROUND - 42];
const VF: Pt = [xM, GROUND - 66];
const DEEP = {A: [X0 + 6 * T, yTop] as Pt, B: [X0 + 12 * T, yTop] as Pt};
const EXIT = {A: [X0 + 6 * T, yBot] as Pt, B: [X0 + 12 * T, yBot] as Pt};

type Side = 'A' | 'B';
type Round = {t0: number; d: number; side: Side; req: Side; cheat?: boolean};
const ROUNDS: Round[] = [
  {t0: 48, d: 222, side: 'A', req: 'B'},
  {t0: 270, d: 126, side: 'B', req: 'B'},
  {t0: 396, d: 150, side: 'A', req: 'B', cheat: true},
];
const FR0 = 552; // fast rounds 3..20
const FRS = 5.4;
const K = 20;
const CH = 702; // properties phase
const REQ: Side[] = new Array(K).fill(0).map((_, i) => (i < 2 ? 'B' : rnd(i * 7.31 + 2) < 0.5 ? 'A' : 'B'));
const roundDone = (k: number) => (k === 0 ? ROUNDS[0].t0 + ROUNDS[0].d * 0.8 : k === 1 ? ROUNDS[1].t0 + ROUNDS[1].d * 0.8 : FR0 + (k - 2) * FRS);
const barAt = (k: number) => FR0 + (k - 1) * FRS;

const inPath = (s: Side): Pt[] => (s === 'A' ? [ENT, FORK, [xL, yBot], [xL, yTop], DEEP.A] : [ENT, FORK, [xR, yBot], [xR, yTop], DEEP.B]);
const outPath = (s: Side, q: Side): Pt[] => {
  const viaR: Pt[] = [[xR, yTop], [xR, yBot]];
  const viaL: Pt[] = [[xL, yTop], [xL, yBot]];
  if (s === 'A') return q === 'A' ? [DEEP.A, ...viaL, EXIT.A] : [DEEP.A, ...viaR, EXIT.B];
  return q === 'B' ? [DEEP.B, ...viaR, EXIT.B] : [DEEP.B, ...viaL, EXIT.A];
};

const roundState = (f: number, r: Round) => {
  const u = (f - r.t0) / r.d;
  let p: Pt;
  let moving = false;
  let doorOpen = false;
  let doorFail = false;
  if (u < 0.46) {
    p = along(inPath(r.side), quant(eInOut(clamp01(u / 0.28)), 40)).p;
    moving = u < 0.28;
  } else if (!r.cheat) {
    p = along(outPath(r.side, r.req), quant(eInOut(clamp01((u - 0.46) / 0.3)), 40)).p;
    moving = u < 0.76;
    doorOpen = r.side !== r.req && u > 0.46 && u < 0.7;
  } else {
    const t = clamp01((u - 0.46) / 0.3);
    const xs = xM - 2 * T - 30;
    const x = t < 0.4 ? DEEP.A[0] + (xs - DEEP.A[0]) * quant(t / 0.4, 6) : t < 0.6 ? xs : xs - 2 * T * quant((t - 0.6) / 0.4, 4);
    p = [x, yTop];
    moving = t < 0.4;
    doorFail = t > 0.3;
  }
  const vT = quant(eInOut(clamp01((u - 0.3) / 0.12)), 10);
  const v: Pt = [V0[0] + (VF[0] - V0[0]) * vT, V0[1] + (VF[1] - V0[1]) * vT];
  return {u, p, v, moving, doorOpen, doorFail, show: u > 0.03 && u < 0.97};
};

const Person: React.FC<{p: Pt; map: string[]; accent: string; f: number; moving?: boolean; hit?: boolean}> = ({p, map, accent, f, moving, hit}) => {
  if (hit && blink(f, 6, 3)) return null;
  const bob = moving && blink(f, 12, 6) ? -PX : 0;
  return <SpriteG map={map} x={g6(p[0] - 30)} y={g6(p[1] - 42) + bob} s={PX} accent={accent} />;
};

/* ---------- the cave ---------- */
const Cave: React.FC<{f: number; door: 'closed' | 'open' | 'fail'}> = ({f, door}) => {
  const rows = Math.ceil(quant(clamp01(f / 30), 12) * 12);
  if (rows <= 0) return null;
  const H = rows * T;
  const dx = X0 + 8 * T;
  const dy = Y0 + T;
  const doorCol = door === 'fail' && blink(f, 6, 3) ? RED : INK;
  return (
    <g shapeRendering="crispEdges">
      <clipPath id="cave-reveal">
        <rect x={0} y={Y0} width={1920} height={H} />
      </clipPath>
      <g clipPath="url(#cave-reveal)">
        {/* rock */}
        <rect x={X0} y={Y0} width={18 * T} height={12 * T} fill={COL.panelDark} stroke={INK} strokeWidth={3} />
        {new Array(40).fill(0).map((_, i) => {
          const c = Math.floor(rnd(i * 3.1) * 18);
          const r = Math.floor(rnd(i * 5.7) * 12);
          return <rect key={i} x={X0 + c * T + 12} y={Y0 + r * T + 18} width={6} height={6} fill={COL.line} />;
        })}
        {/* tunnel loop */}
        <rect x={X0 + 2 * T} y={Y0 + T} width={14 * T} height={10 * T} fill={COL.panel} stroke={INK} strokeWidth={3} />
        <rect x={X0 + 4 * T} y={Y0 + 3 * T} width={10 * T} height={6 * T} fill={COL.panelDark} stroke={INK} strokeWidth={3} />
        {/* entrance */}
        <rect x={X0 + 8 * T} y={Y0 + 11 * T - 3} width={2 * T} height={T + 6} fill={COL.panel} />
        <rect x={X0 + 8 * T - 3} y={Y0 + 11 * T} width={3} height={T} fill={INK} />
        <rect x={X0 + 10 * T} y={Y0 + 11 * T} width={3} height={T} fill={INK} />
        {/* side letters */}
        <Txt x={X0 + T} y={Y0 + 6 * T} size={48} family={FONT.press} color={INK}>
          A
        </Txt>
        <Txt x={X0 + 17 * T} y={Y0 + 6 * T} size={48} family={FONT.press} color={INK}>
          B
        </Txt>
        {/* door */}
        {door === 'open' ? (
          <rect x={dx + 3} y={dy + 3} width={2 * T - 6} height={2 * T - 6} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="6 6" />
        ) : (
          <g>
            <rect x={dx} y={dy} width={6} height={2 * T} fill={doorCol} />
            <rect x={dx + 2 * T - 6} y={dy} width={6} height={2 * T} fill={doorCol} />
            {[1, 2, 3].map((i) => (
              <rect key={i} x={dx + i * 21 - 3} y={dy} width={6} height={2 * T} fill={doorCol} />
            ))}
            <rect x={dx} y={dy + T - 3} width={2 * T} height={6} fill={doorCol} />
          </g>
        )}
      </g>
      {rows >= 12 && (
        <>
          <rect x={96} y={GROUND} width={900} height={3} fill={INK} />
          <Txt x={xM} y={Y0 - 24} size={24} color={door === 'fail' ? RED : COL.sub}>
            {door === 'open' ? '口令正确 · 门开' : door === 'fail' ? '门打不开' : '魔法门'}
          </Txt>
        </>
      )}
    </g>
  );
};

/* ---------- right column ---------- */
const RX = 1020;
const RW = 804;
const STEPS = ['① Peggy 随机走进 A 或 B', '② Victor 随机喊一边', '③ Peggy 从那一边出来'];

export const ZkCave: React.FC = () => {
  const f = useF();
  const cur = ROUNDS.find((r) => f >= r.t0 && f < r.t0 + r.d);
  const st = cur ? roundState(f, cur) : null;
  const fast = !st && f >= FR0 && f < CH;
  const fastIdx = Math.min(K - 1, 2 + Math.floor(Math.max(0, f - FR0) / FRS));
  const roundNo = f < ROUNDS[1].t0 ? 1 : f < FR0 ? 2 : fastIdx + 1;
  const door: 'closed' | 'open' | 'fail' = st?.doorFail ? 'fail' : st?.doorOpen ? 'open' : 'closed';
  const phase = f < FR0 - 6 ? 'steps' : f < CH ? 'chart' : 'props';
  const activeStep = st ? (st.u < 0.3 ? 0 : st.u < 0.46 ? 1 : 2) : -1;

  // chart geometry
  const GX = 1110;
  const GW = 714;
  const GT = 384;
  const GB = 648;
  const yOf = (lg: number) => g6(GB - ((lg + 7) / 7) * (GB - GT));

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        <Cave f={f} door={door} />
        {/* people */}
        {!st && f >= 24 && f < ROUNDS[0].t0 && (
          <>
            <Person p={ENT} map={ALICE} accent={INK} f={f} />
            <Person p={V0} map={BOB} accent={COL.dim} f={f} />
          </>
        )}
        {st && cur && st.show && (
          <>
            <Person p={st.p} map={cur.cheat ? EVE : ALICE} accent={INK} f={f} moving={st.moving} hit={cur.cheat && st.doorFail && st.u < 0.7} />
            <Person p={st.v} map={BOB} accent={COL.dim} f={f} moving={st.u > 0.3 && st.u < 0.42} />
            {st.u >= 0.42 && st.u < 0.92 && <Tag x={xM + 48} y={GROUND - 84} w={264} text={`“从 ${cur.req} 出来”`} />}
            {st.u > 0.78 && <Mark x={g6(st.p[0])} y={g6(st.p[1] - 78)} ok={!cur.cheat} />}
          </>
        )}
        {fast && (
          <g>
            {blink(f, 6, 4) && <Person p={EXIT[REQ[fastIdx]]} map={ALICE} accent={INK} f={f} />}
            <Person p={VF} map={BOB} accent={COL.dim} f={f} />
            <Tag x={xM + 48} y={GROUND - 84} w={264} text={`“从 ${REQ[fastIdx]} 出来”`} />
          </g>
        )}
        {!st && f >= CH && (
          <>
            <Person p={ENT} map={ALICE} accent={INK} f={f} />
            <Person p={[ENT[0] + 96, ENT[1]]} map={BOB} accent={COL.dim} f={f} />
          </>
        )}

        {/* round counter + history */}
        {f >= 36 && (
          <g>
            <Txt x={RX} y={204} size={48} anchor="start">
              {`第 ${String(roundNo).padStart(2, '0')} 轮`}
            </Txt>
            {REQ.map((q, k) => {
              const done = f >= roundDone(k);
              const x = 1284 + k * 27;
              return <rect key={k} x={x} y={186} width={18} height={36} fill={done ? INK : COL.line} />;
            })}
          </g>
        )}

        {/* phase: protocol steps */}
        {phase === 'steps' && f >= 30 && (
          <g>
            {STEPS.map((s, i) => (
              <Tag key={i} x={RX} y={300 + i * 108} w={RW} h={84} text={s} inv={i === activeStep} />
            ))}
            {st && cur && st.u > 0.5 && (
              <Txt x={RX} y={672} size={36} anchor="start" color={cur.cheat ? RED : INK}>
                {cur.cheat ? 'Eve 没有口令：只能事先赌中，概率 1/2' : cur.side === cur.req ? '同一侧：原路返回即可' : '另一侧：用口令开门穿过去'}
              </Txt>
            )}
          </g>
        )}

        {/* phase: probability chart */}
        {phase === 'chart' && (
          <g>
            <Txt x={RX} y={300} size={36} anchor="start">
              作弊者连过 k 轮的概率
            </Txt>
            <Txt x={1824} y={300} size={36} anchor="end" family={FONT.pixelMono}>
              (1/2)^k
            </Txt>
            <rect x={GX} y={yOf(0)} width={GW} height={3} fill={COL.line} />
            <Txt x={GX - 18} y={yOf(0)} size={24} anchor="end" family={FONT.pixelMono} color={COL.sub}>
              1
            </Txt>
            {new Array(30).fill(0).map((_, i) => (
              <rect key={i} x={GX + i * 24} y={yOf(-6) - 3} width={12} height={6} fill={RED} />
            ))}
            <Txt x={GX - 18} y={yOf(-6)} size={24} anchor="end" family={FONT.pixelMono} color={RED}>
              10⁻⁶
            </Txt>
            <rect x={GX} y={GB} width={GW} height={3} fill={INK} />
            {new Array(K).fill(0).map((_, i) => {
              const k = i + 1;
              if (f < barAt(k)) return null;
              const y = yOf(-k * Math.log10(2));
              return <rect key={k} x={GX + 6 + i * 36} y={y} width={24} height={GB - y} fill={k === K ? INK : COL.dim} />;
            })}
            <Txt x={GX + 18} y={GB + 30} size={24} family={FONT.pixelMono} color={COL.sub}>
              1
            </Txt>
            <Txt x={GX + 18 + 19 * 36} y={GB + 30} size={24} family={FONT.pixelMono} color={COL.sub}>
              20
            </Txt>
            {on(f, barAt(K) + 6) && (
              <g>
                <Txt x={1824} y={414} size={36} anchor="end" family={FONT.pixelMono}>
                  2⁻²⁰ ≈ 9.5×10⁻⁷
                </Txt>
                <Txt x={1824} y={462} size={36} anchor="end">
                  不到百万分之一
                </Txt>
              </g>
            )}
          </g>
        )}
      </svg>

      {/* phase: properties */}
      {phase === 'props' && (
        <>
          {on(f, CH) && <Card x={RX} y={288} w={RW} num="01" title="完备性" desc="知道口令的 Peggy 每轮都能通过" />}
          {on(f, CH + 15) && <Card x={RX} y={432} w={RW} num="02" title="可靠性" desc="不知道口令，每轮至多 1/2 的机会蒙混" />}
          {on(f, CH + 30) && <Card x={RX} y={576} w={RW} num="03" title="零知识" desc="Victor 的录像，别人自己也能伪造" inv />}
          <FilmStrip f={f} at={CH + 48} />
        </>
      )}
      <Caption title="零知识证明" en="ZERO KNOWLEDGE" desc="作弊成功率每轮减半：20 轮后不到百万分之一" color={COL.zk} />
    </AbsoluteFill>
  );
};

/* simulator: guess first, cut out the failed takes */
const TAKES: {g: Side; q: Side}[] = [
  {g: 'A', q: 'A'},
  {g: 'B', q: 'A'},
  {g: 'B', q: 'B'},
  {g: 'A', q: 'B'},
  {g: 'A', q: 'A'},
  {g: 'B', q: 'B'},
  {g: 'A', q: 'B'},
  {g: 'B', q: 'B'},
];
const FilmStrip: React.FC<{f: number; at: number}> = ({f, at}) => {
  if (f < at) return null;
  const cut = f >= at + 30;
  const gone = f >= at + 48;
  const close = quant(clamp01((f - at - 48) / 18), 3);
  const W = 78;
  let kept = 0;
  return (
    <div style={{position: 'absolute', left: RX, top: 738, width: RW, height: 96}}>
      {TAKES.map((t, i) => {
        const bad = t.g !== t.q;
        const x0 = i * (W + 18);
        const x1 = kept * (W + 18);
        if (!bad) kept++;
        if (f < at + i * 3) return null;
        if (bad && gone) return null;
        const x = bad ? x0 : x0 + (x1 - x0) * close;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: bad && cut ? 18 : 0,
              width: W,
              height: 54,
              boxSizing: 'border-box',
              background: COL.panel,
              border: `3px ${bad && cut ? 'dashed' : 'solid'} ${bad && cut ? RED : INK}`,
              fontFamily: FONT.pixelMono,
              fontSize: 24,
              lineHeight: '48px',
              color: bad && cut ? RED : INK,
              textAlign: 'center',
            }}
          >
            {t.g}→{t.q}
          </div>
        );
      })}
      {f >= at + 6 && f < at + 66 && (
        <div style={{position: 'absolute', left: 0, top: 66, fontFamily: FONT.pixel, fontSize: 24, lineHeight: '30px', color: COL.sub, whiteSpace: 'nowrap'}}>
          模拟器：先猜后录，<span style={{color: RED}}>猜错的片段剪掉</span>
        </div>
      )}
      {close >= 1 && on(f, at + 66) && (
        <div style={{position: 'absolute', left: 0, top: 66, fontFamily: FONT.pixel, fontSize: 24, lineHeight: '30px', color: INK, whiteSpace: 'nowrap'}}>
          剪辑后的录像 ≡ 真实录像：Victor 什么也没学到
        </div>
      )}
    </div>
  );
};

export const ZkCaveCues: Cue[] = [
  [6, 'whoosh'],
  ...ROUNDS.flatMap((r): Cue[] => [
    [r.t0 + 3, 'step'],
    [Math.round(r.t0 + r.d * 0.42), 'blip', r.req === 'A' ? 72 : 76],
    [Math.round(r.t0 + r.d * 0.79), r.cheat ? 'error' : 'chime'],
  ]),
  [Math.round(ROUNDS[0].t0 + ROUNDS[0].d * 0.5), 'bell', 79],
  ...new Array(K - 2).fill(0).map((_, i): Cue => [Math.round(barAt(i + 3)), 'tick']),
  [Math.round(barAt(K) + 6), 'bell', 84],
  [CH, 'blip', 72],
  [CH + 15, 'blip', 76],
  [CH + 30, 'blip', 79],
  [CH + 78, 'reveal'],
];
