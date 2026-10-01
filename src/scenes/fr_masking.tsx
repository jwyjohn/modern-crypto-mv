import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EVE, SAGE, SpriteG} from '../components/pixel';
import {Txt} from '../components/kit';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {clamp01, COL, FONT, rnd} from '../theme';
import {Frame, Mark, on, Tag} from './zk_util';

const INK = COL.text;
const M = FONT.pixelMono;

/* ====================================================================== */
/* toy computations (all checked in code)                                  */
/* ====================================================================== */

const HW = (v: number) => {
  let c = 0;
  for (let x = v; x; x >>= 1) c += x & 1;
  return c;
};
const bin4 = (v: number) => (v & 15).toString(2).padStart(4, '0');
const hex2 = (v: number) => v.toString(16).toUpperCase().padStart(2, '0');

/* --- 1. leakage: power spikes follow HW of processed bytes --- */
const BYTES = new Array(8).fill(0).map((_, i) => Math.floor(rnd(i * 4.41 + 17) * 256));

/* --- 1b. a toy correlation (DPA/CPA) attack on a 4-bit S-box (PRESENT) --- */
const SBOX = [0xc, 0x5, 0x6, 0xb, 0x9, 0x0, 0xa, 0xd, 0x3, 0xe, 0xf, 0x8, 0x4, 0x7, 0x1, 0x2];
const KEY = 0xb;
const NT = 300;
const PTS = new Array(NT).fill(0).map((_, j) => Math.floor(rnd(j * 7.13 + 3) * 16));
const LEAK = PTS.map((p, j) => HW(SBOX[p ^ KEY]) + (rnd(j * 1.1 + 1) + rnd(j * 2.3 + 2) + rnd(j * 3.7 + 3) - 1.5) * 1.2);
const pearson = (a: number[], b: number[]) => {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (let i = 0; i < n; i++) {
    sab += (a[i] - ma) * (b[i] - mb);
    saa += (a[i] - ma) ** 2;
    sbb += (b[i] - mb) ** 2;
  }
  return sab / Math.sqrt(saa * sbb);
};
const CORR = new Array(16).fill(0).map((_, g) => pearson(PTS.map((p) => HW(SBOX[p ^ g])), LEAK));
const BEST = CORR.reduce((bi, c, i) => (Math.abs(c) > Math.abs(CORR[bi]) ? i : bi), 0);

/* --- 2. sharings of the same secret --- */
const X = 11;
const R1 = 6;
const BOOL2 = X ^ R1; // x2 so that x = x1 ⊕ x2
const ARI2 = (X - R1 + 16) % 16; // a2 so that x = a1 + a2 mod 16

/* --- 3. Goubin's B2A (k = 4) --- */
const K = 4;
const MASK = (1 << K) - 1;
const XP = X ^ R1; // x' = x ⊕ r
const GAM = 9; // fresh random γ
const psi = (xp: number, y: number) => ((xp ^ y) - y) & MASK;
const PSI_G = psi(XP, GAM);
const PSI_RG = psi(XP, R1 ^ GAM);
const A_OUT = PSI_G ^ PSI_RG ^ XP;
const B2A_OK = ((A_OUT + R1) & MASK) === X && A_OUT === ((XP ^ R1) - R1 & MASK);
// affine identity Ψ(y1 ⊕ y2) = Ψ(y1) ⊕ Ψ(y2) ⊕ Ψ(0) for every x', y1, y2 in {0,1}^4
let AFF_CHECKED = 0;
let AFF_OK = true;
for (let xp = 0; xp <= MASK; xp++)
  for (let y1 = 0; y1 <= MASK; y1++)
    for (let y2 = 0; y2 <= MASK; y2++) {
      AFF_CHECKED++;
      if (psi(xp, y1 ^ y2) !== (psi(xp, y1) ^ psi(xp, y2) ^ psi(xp, 0))) AFF_OK = false;
    }

/* ====================================================================== */

const P2 = 288;
const P3 = 534;
const P3B = 696;
const P4 = 846;

/* ---------- phase 1: leakage ---------- */
const TX = 120;
const TW = 1080;
const TB = 420; // trace baseline
const Leakage: React.FC<{f: number}> = ({f}) => {
  const drawn = clamp01((f - 18) / 90);
  const n = Math.floor(drawn * 180);
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = TX + (i / 180) * TW;
    const slot = Math.floor(i / 22.5);
    const inSpike = i % 22.5 >= 9 && i % 22.5 < 13 && slot < 8;
    const noise = Math.round((rnd(i * 3.3 + 1) - 0.5) * 3) * 6;
    const y = inSpike ? TB - 30 - HW(BYTES[slot]) * 24 : TB + noise;
    pts.push(`${Math.round(x)},${y}`);
  }
  const bars = CORR.map((c) => Math.abs(c));
  const maxB = Math.max(...bars);
  return (
    <g>
      {on(f, 6) && (
        <Txt x={TX} y={204} size={36} anchor="start">
          芯片的功耗曲线：峰的高低跟着所处理字节的汉明重量走
        </Txt>
      )}
      <rect x={TX} y={TB + 30} width={TW} height={3} fill={COL.line} />
      {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke={INK} strokeWidth={3} />}
      {BYTES.map((b, i) =>
        n >= i * 22.5 + 13 ? (
          <Txt key={i} x={TX + ((i * 22.5 + 11) / 180) * TW} y={TB + 66} size={24} family={M} color={COL.sub}>
            {`${hex2(b)}·${HW(b)}`}
          </Txt>
        ) : null,
      )}
      {f >= 108 && <SpriteG map={EVE} x={1302} y={258} s={12} accent={INK} />}
      {on(f, 120) && (
        <Txt x={1488} y={300} size={36} anchor="start">
          攻击者：
        </Txt>
      )}
      {on(f, 132) && (
        <Txt x={1488} y={360} size={36} anchor="start">
          采集 {NT} 条曲线
        </Txt>
      )}
      {/* correlation of every key guess */}
      {on(f, 150) && (
        <Txt x={TX} y={540} size={24} anchor="start" color={COL.sub}>
          16 个密钥猜测：预测的汉明重量与实测功耗的相关系数
        </Txt>
      )}
      {f >= 162 &&
        bars.map((b, g) => {
          if (f < 162 + g * 3) return null;
          const h = Math.round(((b / maxB) * 180) / 6) * 6;
          const best = g === BEST && f >= 222;
          return (
            <g key={g}>
              <rect x={TX + g * 66} y={792 - h} width={42} height={h} fill={best ? COL.red : COL.dim} />
              <Txt x={TX + g * 66 + 21} y={822} size={24} family={M} color={best ? COL.red : COL.sub}>
                {g.toString(16).toUpperCase()}
              </Txt>
            </g>
          );
        })}
      {on(f, 222) && <Tag x={1236} y={612} w={588} h={84} text={`密钥 = ${BEST.toString(16).toUpperCase()}：被功耗泄露 ✗`} size={36} red />}
      {on(f, 246) && (
        <Txt x={1236} y={756} size={24} anchor="start" color={COL.sub}>
          差分功耗分析 · Kocher 等 1999
        </Txt>
      )}
    </g>
  );
};

/* ---------- phase 2: masking ---------- */
const Bits: React.FC<{x: number; y: number; v: number; inv?: boolean}> = ({x, y, v, inv}) => (
  <g>
    {bin4(v)
      .split('')
      .map((b, i) => (
        <Tag key={i} x={x + i * 60} y={y} w={54} h={54} text={b} family={M} inv={inv && b === '1'} />
      ))}
  </g>
);
const Masking: React.FC<{f: number}> = ({f}) => {
  const s = f - P2;
  const col = (x: number, k: number) => {
    const at = 30 + k * 60;
    const bool = k === 0;
    return (
      <g>
        {on(s, at) && (
          <Txt x={x} y={312} size={48} anchor="start">
            {bool ? '布尔掩码' : '算术掩码'}
          </Txt>
        )}
        {on(s, at + 12) && (
          <Txt x={x} y={384} size={36} anchor="start" family={M}>
            {bool ? 'x = x₁ ⊕ x₂' : 'x = a₁ + a₂ (mod 2⁴)'}
          </Txt>
        )}
        {on(s, at + 24) && (
          <g>
            <Txt x={x} y={459} size={24} anchor="start" family={M} color={COL.sub}>
              {bool ? 'x₁' : 'a₁'}
            </Txt>
            <Bits x={x + 60} y={432} v={R1} />
            <Txt x={x + 336} y={459} size={24} anchor="start" family={M} color={COL.sub}>
              {`= ${R1}`}
            </Txt>
          </g>
        )}
        {on(s, at + 36) && (
          <g>
            <Txt x={x} y={531} size={24} anchor="start" family={M} color={COL.sub}>
              {bool ? 'x₂' : 'a₂'}
            </Txt>
            <Bits x={x + 60} y={504} v={bool ? BOOL2 : ARI2} />
            <Txt x={x + 336} y={531} size={24} anchor="start" family={M} color={COL.sub}>
              {`= ${bool ? BOOL2 : ARI2}`}
            </Txt>
          </g>
        )}
        {on(s, at + 48) && (
          <g>
            <Txt x={x} y={603} size={24} anchor="start" family={M}>
              x
            </Txt>
            <Bits x={x + 60} y={576} v={X} inv />
            <Txt x={x + 336} y={603} size={24} anchor="start" family={M}>
              {`= ${X}`}
            </Txt>
          </g>
        )}
        {on(s, at + 60) && (
          <Txt x={x} y={690} size={36} anchor="start" color={COL.sub}>
            {bool ? '适合 XOR、AES、比特切片' : '适合模运算、格密码 ML-KEM'}
          </Txt>
        )}
      </g>
    );
  };
  return (
    <g>
      {on(s, 0) && (
        <Txt x={960} y={204} size={36}>
          对策：掩码——把每个中间值拆成随机份额
        </Txt>
      )}
      {col(180, 0)}
      {on(s, 30) && <rect x={954} y={276} width={3} height={438} fill={COL.line} />}
      {col(1056, 1)}
      {on(s, 168) && <Tag x={276} y={750} w={1368} h={84} text="任何单个份额都均匀随机 · Ishai–Sahai–Wagner 2003（d-探针模型）" size={36} inv />}
    </g>
  );
};

/* ---------- phase 3: Goubin B2A ---------- */
const Goubin: React.FC<{f: number}> = ({f}) => {
  const s = f - P3;
  return (
    <g>
      {on(s, 0) && (
        <Txt x={960} y={204} size={36}>
          格密码、哈希混用两种运算 → 需要 B2A / A2B 转换
        </Txt>
      )}
      {on(s, 18) && (
        <Txt x={120} y={300} size={36} anchor="start" family={M}>
          已知 x′ = x ⊕ r 与 r，求 A 使 x = A + r (mod 2ᵏ)
        </Txt>
      )}
      {on(s, 42) && (
        <g>
          <Txt x={120} y={384} size={36} anchor="start" family={M} color={COL.red}>
            直接算 A = (x′ ⊕ r) − r
          </Txt>
          <Txt x={792} y={384} size={36} anchor="start" color={COL.red}>
            ✗ 中间值 x′ ⊕ r 就是 x 本身
          </Txt>
        </g>
      )}
      {on(s, 72) && <Tag x={120} y={444} w={1680} h={84} text="Goubin 2001：Ψ(y) = (x′ ⊕ y) − y 对 y 是 𝔽₂-仿射的" size={36} family={M} inv />}
      {on(s, 96) && (
        <Txt x={960} y={600} size={48} family={M}>
          Ψ(y₁ ⊕ y₂) = Ψ(y₁) ⊕ Ψ(y₂) ⊕ Ψ(0)
        </Txt>
      )}
      {on(s, 120) && (
        <Txt x={960} y={672} size={24} color={COL.sub}>
          {`k = 4 时全部 ${AFF_CHECKED} 种 (x′, y₁, y₂) 组合逐一验证${AFF_OK ? ' ✓' : ''}`}
        </Txt>
      )}
      {on(s, 138) && (
        <Txt x={960} y={762} size={36} family={M}>
          所以 A = Ψ(γ) ⊕ Ψ(r ⊕ γ) ⊕ x′，γ 为新鲜随机数
        </Txt>
      )}
    </g>
  );
};

const Toy: React.FC<{f: number}> = ({f}) => {
  const s = f - P3B;
  const rows: {l: string; v: string; at: number; inv?: boolean}[] = [
    {l: 'x = 1011，r =', v: `${bin4(R1)}  →  x′ = ${bin4(XP)}`, at: 6},
    {l: '新鲜随机 γ =', v: bin4(GAM), at: 24},
    {l: 'Ψ(γ) = (x′ ⊕ γ) − γ =', v: bin4(PSI_G), at: 42},
    {l: 'Ψ(r ⊕ γ) =', v: bin4(PSI_RG), at: 60},
    {l: 'A = Ψ(γ) ⊕ Ψ(r ⊕ γ) ⊕ x′ =', v: `${bin4(A_OUT)} = ${A_OUT}`, at: 78, inv: true},
  ];
  return (
    <g>
      {on(s, 0) && (
        <Txt x={120} y={204} size={36} anchor="start">
          4 位小例子：全程不出现 x
        </Txt>
      )}
      {rows.map((r, i) =>
        on(s, r.at) ? (
          r.inv ? (
            <Tag key={i} x={120} y={276 + i * 84} w={1110} h={78} text={`${r.l} ${r.v}`} size={36} family={M} inv />
          ) : (
            <g key={i}>
              <Txt x={720} y={315 + i * 84} size={36} anchor="end" family={M}>
                {r.l}
              </Txt>
              <Txt x={744} y={315 + i * 84} size={36} anchor="start" family={M}>
                {r.v}
              </Txt>
            </g>
          )
        ) : null,
      )}
      {on(s, 102) && (
        <g>
          <Txt x={120} y={786} size={48} anchor="start" family={M}>
            {`A + r = ${A_OUT} + ${R1} = ${(A_OUT + R1) & MASK} = x`}
          </Txt>
          <Mark x={804} y={786} ok={B2A_OK} s={60} />
        </g>
      )}
      {on(s, 120) && (
        <Txt x={1344} y={480} size={36} anchor="start" color={COL.sub}>
          运算次数与位宽 k 无关
        </Txt>
      )}
    </g>
  );
};

/* ---------- phase 4: frontier ---------- */
const Frontier: React.FC<{f: number}> = ({f}) => {
  const s = f - P4;
  return (
    <g>
      {s >= 0 && <SpriteG map={SAGE} x={168} y={330} s={12} accent={INK} />}
      {on(s, 6) && (
        <Txt x={420} y={390} size={48} anchor="start">
          反方向 A2B：单轮仿射掩码在 k ≥ 3 时不存在
        </Txt>
      )}
      {on(s, 30) && (
        <Txt x={420} y={486} size={48} anchor="start">
          但两比特情形仍可利用（2026）
        </Txt>
      )}
      {on(s, 54) && <Frame x={420} y={570} w={1104} h={6} fill={COL.line} sw={0} />}
      {on(s, 60) && (
        <Txt x={420} y={636} size={36} anchor="start" color={COL.sub}>
          二十多年来的转换小工具，仍在不断被重新审视
        </Txt>
      )}
    </g>
  );
};

export const FrMasking: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {f < P2 && <Leakage f={f} />}
        {f >= P2 && f < P3 && <Masking f={f} />}
        {f >= P3 && f < P3B && <Goubin f={f} />}
        {f >= P3B && f < P4 && <Toy f={f} />}
        {f >= P4 && <Frontier f={f} />}
      </svg>
      <Caption title="侧信道与掩码" en="SIDE CHANNELS & MASKING" desc="功耗会泄露中间值；把它们拆成随机份额，再安全地在两种掩码间转换" color={COL.fr} />
    </AbsoluteFill>
  );
};

export const FR_MASK_STATS = {BYTES, KEY, BEST, CORR_BEST: CORR[BEST], X, R1, BOOL2, ARI2, XP, GAM, PSI_G, PSI_RG, A_OUT, B2A_OK, AFF_CHECKED, AFF_OK};

export const FrMaskingCues: Cue[] = [
  [6, 'whoosh'],
  [18, 'tick'],
  [108, 'step'],
  [162, 'tick'],
  [222, 'chime'],
  [P2, 'whoosh'],
  [P2 + 30, 'blip', 72],
  [P2 + 90, 'blip', 76],
  [P2 + 168, 'bell', 79],
  [P3, 'whoosh'],
  [P3 + 42, 'error'],
  [P3 + 96, 'blip', 79],
  [P3B, 'step'],
  [P3B + 102, 'reveal'],
  [P4, 'riser2'],
];
