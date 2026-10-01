import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, BOB, SCROLL, SpriteG} from '../components/pixel';
import {Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Arrow, Caption, Pt} from '../components/ui';
import {clamp01, COL, FONT, rnd} from '../theme';
import {on, Tag} from './zk_util';

const INK = COL.text;
const M = FONT.pixelMono;

/* ---------- 1-D toy of rejection sampling (computed) ---------- */
const GAM = 12; // y uniform in [-GAM, GAM]
const BETA = 4; // max |c·s|
const BOUND = GAM - BETA; // accept iff |z| <= 8
const SHIFTS = [3, -3]; // c·s for two different secret keys
const N = 1500;
const ZMIN = -16;
const ZMAX = 16;
const hist = SHIFTS.map((sh, k) => {
  const all = new Array(ZMAX - ZMIN + 1).fill(0);
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const y = Math.floor(rnd(i * 1.618 + k * 977 + 11) * (2 * GAM + 1)) - GAM;
    const z = y + sh;
    all[z - ZMIN]++;
    if (Math.abs(z) <= BOUND) acc++;
  }
  return {all, acc};
});
const ACC_RATE = (hist[0].acc + hist[1].acc) / (2 * N);
const EXACT_RATE = (2 * BOUND + 1) / (2 * GAM + 1); // 17/25
const MAXC = Math.max(...hist.flatMap((h) => h.all));

const P2 = 276;
const P3 = 582;

/* ---------- phase 1: lattice Schnorr ---------- */
const Protocol: React.FC<{f: number}> = ({f}) => {
  const msgs: {pts: Pt[]; at: number; label: string; ly: number}[] = [
    {pts: [[372, 330], [1536, 384]], at: 48, label: '承诺  w = A·y（y 随机、较小）', ly: 318},
    {pts: [[1536, 444], [372, 498]], at: 90, label: '挑战  c（小多项式）', ly: 432},
    {pts: [[372, 558], [1536, 612]], at: 132, label: '响应  z = y + c·s', ly: 546},
  ];
  return (
    <g>
      {on(f, 6) && (
        <Txt x={960} y={204} size={36}>
          格上的 Schnorr：公开 A、t = A·s (mod q)，秘密 s 很短
        </Txt>
      )}
      {f >= 12 && <SpriteG map={ALICE} x={168} y={336} s={12} accent={INK} />}
      {f >= 18 && <SpriteG map={BOB} x={1632} y={336} s={12} accent={COL.dim} />}
      {on(f, 24) && (
        <>
          <Txt x={228} y={540}>
            签名者
          </Txt>
          <Txt x={1692} y={540}>
            验证者
          </Txt>
        </>
      )}
      {msgs.map((m, i) => (
        <g key={i}>
          <Arrow pts={m.pts} t={clamp01((f - m.at) / 24)} color={INK} w={6} glow={false} />
          {on(f, m.at + 18) && (
            <Txt x={954} y={m.ly} size={36} family={i === 2 ? M : FONT.pixel}>
              {m.label}
            </Txt>
          )}
        </g>
      ))}
      {on(f, 180) && <Tag x={498} y={690} w={924} h={84} text="验证：A·z = w + c·t，且 z 足够短" size={36} inv />}
    </g>
  );
};

/* ---------- phase 2: the leak, and rejection ---------- */
const BW = 24;
const BS = 30;
const HX = 180;
const zx = (z: number) => HX + (z - ZMIN) * BS;
const Hist: React.FC<{k: number; base: number; s: number}> = ({k, base, s}) => {
  const grow = clamp01((s - 18 - k * 12) / 24);
  const cut = s >= 150;
  const gone = s >= 186;
  return (
    <g>
      {on(s, 6 + k * 12) && (
        <Txt x={HX} y={base - 186} size={36} anchor="start" family={M}>
          {`私钥 ${k === 0 ? 'A' : 'B'}：c·s = ${SHIFTS[k] > 0 ? '+' : '−'}${Math.abs(SHIFTS[k])}`}
        </Txt>
      )}
      <rect x={HX - 6} y={base} width={(ZMAX - ZMIN) * BS + BW + 12} height={3} fill={INK} />
      {hist[k].all.map((c, j) => {
        const z = j + ZMIN;
        if (c === 0) return null;
        const h = Math.round((c / MAXC) * 132 * grow / 6) * 6;
        if (h <= 0) return null;
        const out = Math.abs(z) > BOUND;
        if (out && gone) return null;
        return out && cut ? (
          <rect key={j} x={zx(z) + 1.5} y={base - h + 1.5} width={BW - 3} height={h - 3} fill="none" stroke={COL.red} strokeWidth={3} strokeDasharray="6 6" />
        ) : (
          <rect key={j} x={zx(z)} y={base - h} width={BW} height={h} fill={INK} />
        );
      })}
      {/* centre marker */}
      {on(s, 60) && !gone && (
        <g>
          <rect x={zx(SHIFTS[k]) + BW / 2 - 3} y={base + 6} width={6} height={24} fill={COL.red} />
          <Txt x={zx(SHIFTS[k]) + BW / 2} y={base + 48} size={24} family={M} color={COL.red}>
            {`中心 ${SHIFTS[k] > 0 ? '+' : '−'}${Math.abs(SHIFTS[k])}`}
          </Txt>
        </g>
      )}
      {gone && (
        <Txt x={zx(0) + BW / 2} y={base + 30} size={24} family={M} color={COL.sub}>
          0
        </Txt>
      )}
    </g>
  );
};
const Reject: React.FC<{f: number}> = ({f}) => {
  const s = f - P2;
  const notes: {t: string; at: number; out?: number; c?: string; y: number}[] = [
    {t: 'z 的分布中心 = c·s', at: 60, out: 150, y: 330},
    {t: '多签几次就能看出 s ✗', at: 90, out: 150, c: COL.red, y: 402},
    {t: `|z| > γ − β = ${BOUND}：丢弃，重来`, at: 150, y: 330},
    {t: `接受率 ≈ ${Math.round(ACC_RATE * 100)}%`, at: 246, y: 690},
  ];
  return (
    <g>
      <Hist k={0} base={474} s={s} />
      <Hist k={1} base={774} s={s} />
      {s >= 150 &&
        [-BOUND, BOUND].map((b) => (
          <g key={b}>
            {[474, 774].flatMap((base) =>
              new Array(5).fill(0).map((_, i) => (
                <rect key={`${base}-${i}`} x={(b < 0 ? zx(b) - 6 : zx(b) + BW + 3) - 1.5} y={base - 150 + i * 30} width={3} height={18} fill={INK} />
              )),
            )}
          </g>
        ))}
      {notes.map((n, i) =>
        on(s, n.at, n.out) ? (
          <Txt key={i} x={1260} y={n.y} size={36} anchor="start" color={n.c ?? INK}>
            {n.t}
          </Txt>
        ) : null,
      )}
      {on(s, 210) && <Tag x={1260} y={462} w={564} h={144} text="" inv />}
      {on(s, 210) && (
        <>
          <Txt x={1542} y={510} size={36} color={COL.invText}>
            拒绝之后：两把私钥
          </Txt>
          <Txt x={1542} y={558} size={36} color={COL.invText}>
            给出同一个分布
          </Txt>
        </>
      )}
    </g>
  );
};

/* ---------- phase 3: ML-DSA ---------- */
const Standard: React.FC<{f: number}> = ({f}) => {
  const s = f - P3;
  const rows = [
    {t: 'Fiat–Shamir with Aborts · Lyubashevsky 2009', at: 36, m: false},
    {t: 'Module-LWE + Module-SIS · q = 8380417', at: 60, m: true},
    {t: 'ML-DSA-44：公钥 1312 B · 签名 2420 B', at: 84, m: false},
    {t: '与 ML-KEM 一起，承担后量子迁移', at: 108, m: false},
  ];
  return (
    <g>
      {s >= 0 && <SpriteG map={ALICE} x={168} y={378} s={12} accent={INK} />}
      {s >= 18 && <SpriteG map={SCROLL} x={312} y={486} s={6} accent={INK} />}
      {on(s, 6) && <Tag x={456} y={240} w={1188} h={96} text="ML-DSA（Dilithium）· FIPS 204 · 2024" size={48} inv />}
      {rows.map((r, i) =>
        on(s, r.at) ? (
          <Txt key={i} x={456} y={420 + i * 96} size={36} anchor="start" family={r.m ? M : FONT.pixel} color={i === 3 ? COL.sub : INK}>
            {r.t}
          </Txt>
        ) : null,
      )}
    </g>
  );
};

export const FrDilithium: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {f < P2 && <Protocol f={f} />}
        {f >= P2 && f < P3 && <Reject f={f} />}
        {f >= P3 && <Standard f={f} />}
      </svg>
      <Caption title="格签名" en="FIAT–SHAMIR WITH ABORTS" desc="z 太大就重来：拒绝采样让签名不再泄露私钥" color={COL.fr} />
    </AbsoluteFill>
  );
};

/** exposed for the report / sanity checks */
export const FR_DIL_STATS = {acc: ACC_RATE, exact: EXACT_RATE};

export const FrDilithiumCues: Cue[] = [
  [6, 'whoosh'],
  [48, 'blip', 72],
  [90, 'blip', 76],
  [132, 'blip', 79],
  [180, 'chime'],
  [P2, 'whoosh'],
  [P2 + 18, 'tick'],
  [P2 + 90, 'error'],
  [P2 + 150, 'step'],
  [P2 + 186, 'tick'],
  [P2 + 210, 'reveal'],
  [P3, 'riser2'],
  [P3 + 6, 'bell', 84],
];
