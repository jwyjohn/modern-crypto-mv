import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BlockCursor} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {clamp01, COL, FONT, PX, quant} from '../theme';
import {Badge, BCell, Box, HLine, T, Tx} from './sym_lib';
import {CHAR, DDT, DIFF_SNAPS, DP, h1, LAT, LIN_TRUE_BIAS, NPAIRS, nib, SBOX, SNAP, TARGET} from './symx_spn';

export * from './symx_alg';

const INK = COL.text;

/* ====================================================================== */
/* 小节卡 · 密码分析                                                      */
/* ====================================================================== */

const KW = [
  {zh: '差分', en: 'DIFFERENTIAL', glyph: 'ΔX → ΔY', year: '1990'},
  {zh: '线性', en: 'LINEAR', glyph: 'a·x ⊕ b·y', year: '1993'},
  {zh: '代数', en: 'ALGEBRAIC', glyph: '(x + k)³', year: '1997'},
];

export const SymCryptTitle: React.FC = () => {
  const f = useF();
  const zh = '密码分析';
  const zn = Math.max(0, Math.min(zh.length, Math.floor((f - 8) / 6)));
  const rule = quant(clamp01((f - 30) / 40), 16);
  const quote = '混淆（confusion）与扩散（diffusion）';
  const qn = Math.max(0, Math.min(quote.length, Math.floor((f - 120) * 0.5)));
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      <div style={{position: 'absolute', left: 240, top: 186, fontFamily: FONT.pixel, fontSize: 24, color: COL.dim, whiteSpace: 'nowrap'}}>
        <span style={{fontFamily: FONT.press, fontSize: 16, marginRight: 18}}>I</span>对称密码 · 小节
      </div>
      <div style={{position: 'absolute', left: 240, top: 234, fontFamily: FONT.pixel, fontSize: 120, lineHeight: '132px', color: COL.text, whiteSpace: 'nowrap'}}>
        {zh.slice(0, zn)}
      </div>
      {f >= 30 && <div style={{position: 'absolute', left: 246, top: 390, fontFamily: FONT.press, fontSize: 24, color: COL.dim}}>CRYPTANALYSIS</div>}
      <div style={{position: 'absolute', left: 240, top: 456, width: 1440 * rule, height: 3, background: COL.ink}} />
      {/* three keywords */}
      {KW.map((k, i) => {
        if (f < 54 + i * 18) return null;
        const x = 240 + i * 492;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: 498, width: 444, whiteSpace: 'nowrap'}}>
            <div style={{fontFamily: FONT.press, fontSize: 16, color: COL.dim}}>{k.year}</div>
            <div style={{fontFamily: FONT.pixel, fontSize: 72, lineHeight: '84px', color: COL.text, marginTop: 12}}>{k.zh}</div>
            <div style={{fontFamily: FONT.press, fontSize: 12, color: COL.dim, marginTop: 6}}>{k.en}</div>
            <div style={{fontFamily: FONT.pixelMono, fontSize: 36, lineHeight: '48px', color: COL.sub, marginTop: 18}}>{k.glyph}</div>
          </div>
        );
      })}
      {/* epigraph */}
      {f >= 120 && (
        <div style={{position: 'absolute', left: 240, top: 822, width: 1440}}>
          <div style={{width: 48, height: PX, background: COL.ink, marginBottom: 18}} />
          <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text, whiteSpace: 'nowrap'}}>
            「{quote.slice(0, qn)}
            {qn < quote.length ? <BlockCursor f={f} size={36} on /> : '」'}
          </div>
          {qn >= quote.length && (
            <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.dim, marginTop: 12}}>—— C. E. Shannon, 1949 · 好密码的两条设计原则</div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ====================================================================== */
/* 概念 · 差分密码分析（Biham & Shamir 1990）                             */
/* ====================================================================== */

const DX = 0xb;
const greyOf = (v: number) => (v === 0 ? T.paper : v <= 2 ? T.line : v <= 4 ? T.dim : v <= 6 ? T.sub : INK);

const WALK0 = 40;
const WALK = 12;
const DDT_AT = 270;
const CHAR_AT = 490;
const KEY_AT = 710;
const WIN_AT = 900;

export const SymDiff: React.FC = () => {
  const f = useF();
  const phase = f < DDT_AT ? 0 : f < CHAR_AT ? 1 : f < KEY_AT ? 2 : 3;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {phase === 0 && <DiffWalk f={f} />}
        {phase === 1 && <DiffTable f={f - DDT_AT} />}
        {phase === 2 && <DiffChar f={f - CHAR_AT} />}
        {phase === 3 && <DiffKey f={f - KEY_AT} />}
      </svg>
      <Caption title="差分密码分析" en="DIFFERENTIAL CRYPTANALYSIS" desc="成对选择明文，追踪差分：高概率路径会泄露最后一轮的子密钥" color={INK} />
    </AbsoluteFill>
  );
};

/* phase A: walk all x with ΔX = B, tally ΔY */
const DiffWalk: React.FC<{f: number}> = ({f}) => {
  const ST = 84;
  const CW = 66;
  const X0 = 960 - (16 * ST - (ST - CW)) / 2;
  const step = Math.min(16, Math.max(0, Math.floor((f - WALK0) / WALK) + 1));
  const cur = step >= 1 && step <= 16 && f < WALK0 + 16 * WALK ? step - 1 : -1;
  const tally = new Array(16).fill(0);
  for (let i = 0; i < Math.min(step, 16); i++) tally[SBOX[i] ^ SBOX[i ^ DX]]++;
  const done = f >= WALK0 + 16 * WALK;
  const BASE = 744;
  const BH = 30;
  return (
    <>
      <Tx x={960} y={200} size={48}>输入差分 ΔX = B，输出差分 ΔY 落在哪里</Tx>
      <Tx x={X0 - 30} y={292} size={28} mono c={T.sub} a="end">x</Tx>
      <Tx x={X0 - 30} y={376} size={28} mono c={T.sub} a="end">S(x)</Tx>
      {SBOX.map((s, i) => {
        const on = cur >= 0 && (i === cur || i === (cur ^ DX));
        return (
          <g key={i}>
            <BCell x={X0 + i * ST} y={260} w={CW} h={60} text={h1(i)} inv={on} size={28} />
            <BCell x={X0 + i * ST} y={344} w={CW} h={60} text={h1(s)} inv={on} grey={!on} size={28} />
          </g>
        );
      })}
      {cur >= 0 && (
        <Tx x={960} y={462} size={32} mono>
          x = {h1(cur)}, x⊕B = {h1(cur ^ DX)}　→　{h1(SBOX[cur])} ⊕ {h1(SBOX[cur ^ DX])} = {h1(SBOX[cur] ^ SBOX[cur ^ DX])}
        </Tx>
      )}
      {done && <Tx x={960} y={462} size={32}>16 个输入里，有 8 个给出 ΔY = 2</Tx>}
      {/* tally histogram */}
      <HLine x1={X0 - 12} x2={X0 + 15 * ST + CW + 12} y={BASE + 3} />
      {tally.map((n, j) => (
        <g key={j}>
          {new Array(n).fill(0).map((_, k) => (
            <rect key={k} x={X0 + j * ST + 9} y={BASE - (k + 1) * BH} width={CW - 18} height={BH - 6} fill={done && j === 2 ? T.red : INK} />
          ))}
          <Tx x={X0 + j * ST + CW / 2} y={BASE + 36} size={24} mono c={j === 2 && done ? T.red : T.sub}>{h1(j)}</Tx>
        </g>
      ))}
      {done && <Tx x={X0 + 2 * ST + CW / 2 + 96} y={BASE - 8 * BH - 6} size={36} mono c={T.red} a="start">8/16</Tx>}
    </>
  );
};

/* phase B: the full difference distribution table */
const DiffTable: React.FC<{f: number}> = ({f}) => {
  const C = 30;
  const S = 33;
  const GX = 300;
  const GY = 312;
  const rows = Math.min(16, Math.floor(f / 8) + 1);
  const best = f >= 150;
  let mx = 0;
  for (let a = 1; a < 16; a++) for (let b = 0; b < 16; b++) mx = Math.max(mx, DDT[a][b]);
  const HL: [number, number][] = [
    [0xb, 2],
    [4, 6],
    [2, 5],
  ];
  return (
    <>
      <Tx x={GX} y={200} size={48} a="start">差分分布表 DDT</Tx>
      <Tx x={GX + 8 * S} y={GY - 60} size={24} mono c={T.sub}>ΔY →</Tx>
      <Tx x={GX - 48} y={GY + 8 * S} size={24} mono c={T.sub} a="end">ΔX</Tx>
      {new Array(16).fill(0).map((_, i) => (
        <g key={'h' + i}>
          <Tx x={GX + i * S + C / 2} y={GY - 18} size={24} mono c={T.dim}>{h1(i)}</Tx>
          <Tx x={GX - 12} y={GY + i * S + C / 2 + 2} size={24} mono c={T.dim} a="end">{h1(i)}</Tx>
        </g>
      ))}
      {DDT.slice(0, rows).map((row, a) =>
        row.map((v, b) => {
          const x = GX + b * S;
          const y = GY + a * S;
          const hl = best && HL.some(([p, q]) => p === a && q === b);
          return (
            <g key={`${a}-${b}`}>
              <rect x={x} y={y} width={C} height={C} fill={greyOf(v)} stroke={hl ? T.red : T.line} strokeWidth={hl ? PX : 1} />
              {v > 0 && (
                <text x={x + C / 2} y={y + C / 2 + 2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={24} fill={v >= 6 ? T.invText : INK}>
                  {v}
                </text>
              )}
            </g>
          );
        }),
      )}
      {/* right column */}
      <Tx x={1000} y={330} size={36} a="start">每格 = 满足 S(x)⊕S(x⊕ΔX) = ΔY 的 x 个数</Tx>
      <Tx x={1000} y={390} size={30} a="start" c={T.sub}>每行之和 = 16；理想的 S 盒应当处处很小</Tx>
      {best && (
        <>
          {HL.map(([a, b], i) => (
            <g key={i}>
              <Badge x={1000} y={456 + i * 84} w={300} h={60} text={`${h1(a)} → ${h1(b)}`} size={30} mono inv={i === 0} />
              <Tx x={1330} y={486 + i * 84} size={36} mono a="start" c={i === 0 ? T.red : INK}>{DDT[a][b]}/16</Tx>
            </g>
          ))}
          <Tx x={1000} y={744} size={28} a="start" c={T.sub}>此 S 盒最大值 {mx}/16；AES 的 S 盒最大仅 4/256</Tx>
        </>
      )}
    </>
  );
};

/* phase C: characteristic through three rounds */
const ACTIVE: number[][] = [[1], [2], [1, 2]];
const PROB: string[][] = [['8/16'], ['6/16'], ['6/16', '6/16']];

const DiffChar: React.FC<{f: number}> = ({f}) => {
  const BX = 640;
  const SPX = 228;
  const BW = 132;
  const RY = [300, 450, 600];
  const UY = [258, 408, 558, 744];
  const shown = Math.min(3, Math.floor(f / 60) + 1);
  const bitX = (pos: number) => BX + Math.floor(pos / 4) * SPX + 18 + (pos % 4) * 32;
  const prod = f >= 190;
  return (
    <>
      <Tx x={960} y={196} size={48}>差分路径：三轮，概率相乘</Tx>
      {[0, 1, 2, 3].map((r) => {
        if (r > shown) return null;
        const du = CHAR.du[r];
        return (
          <g key={r}>
            <Tx x={BX - 36} y={UY[r]} size={24} mono a="end" c={r === 3 ? INK : T.sub}>
              ΔU{'₁₂₃₄'[r]} = {nib(du)}
            </Tx>
            {/* active input bits */}
            {new Array(16).fill(0).map((_, i) =>
              (du >> (15 - i)) & 1 ? <rect key={i} x={bitX(i) - 6} y={UY[r] - 6} width={12} height={12} fill={r === 3 ? T.red : INK} /> : null,
            )}
          </g>
        );
      })}
      {RY.map((y, r) => {
        if (r >= shown) return null;
        return (
          <g key={r}>
            {[0, 1, 2, 3].map((j) => {
              const on = ACTIVE[r].includes(j);
              const k = ACTIVE[r].indexOf(j);
              return (
                <g key={j}>
                  <Box x={BX + j * SPX} y={y} w={BW} h={54} inv={on} />
                  <Tx x={BX + j * SPX + BW / 2} y={y + 28} size={24} mono c={on ? T.invText : T.dim}>
                    S{r + 1}{j + 1}
                  </Tx>
                  {on && (
                    <Tx x={BX + j * SPX + BW + 12} y={y + 28} size={24} mono a="start" c={T.red}>
                      {PROB[r][k]}
                    </Tx>
                  )}
                </g>
              );
            })}
            {/* permutation wires of the active output bits */}
            {new Array(16).fill(0).map((_, i) => {
              if (!((CHAR.dv[r] >> (15 - i)) & 1)) return null;
              const j = (i % 4) * 4 + Math.floor(i / 4);
              return <line key={i} x1={bitX(i)} y1={y + 54} x2={bitX(j)} y2={UY[r + 1] - 6} stroke={INK} strokeWidth={3} />;
            })}
          </g>
        );
      })}
      {prod && (
        <g>
          <Tx x={1560} y={330} size={36} mono a="start">8/16</Tx>
          <Tx x={1560} y={390} size={36} mono a="start">× 6/16</Tx>
          <Tx x={1560} y={450} size={36} mono a="start">× (6/16)²</Tx>
          <HLine x1={1560} x2={1800} y={492} />
          <Tx x={1560} y={540} size={48} mono a="start" c={T.red}>{Math.round(CHAR.p * 1024)}/1024</Tx>
          <Tx x={1560} y={600} size={30} mono a="start" c={T.sub}>≈ {CHAR.p.toFixed(4)}</Tx>
        </g>
      )}
    </>
  );
};

/* phase D: key recovery — counters for all 256 partial subkey guesses */
const DiffKey: React.FC<{f: number}> = ({f}) => {
  const X0 = 192;
  const BW = 6;
  const BASE = 720;
  const HMAX = 360;
  const t = quant(clamp01((f - 20) / 160), DIFF_SNAPS.length - 1);
  const si = Math.round(t * (DIFF_SNAPS.length - 1));
  const cnt = DIFF_SNAPS[si];
  const final = DIFF_SNAPS[DIFF_SNAPS.length - 1];
  const top = Math.max(...final);
  const order = [...final.keys()].sort((a, b) => final[b] - final[a]);
  const second = order[1];
  const win = f >= WIN_AT - KEY_AT;
  return (
    <>
      <Tx x={960} y={196} size={48}>猜最后一轮子密钥：对的那个会“冒出来”</Tx>
      <Tx x={960} y={262} size={30} mono c={T.sub}>
        ΔP = {h1(DP).padStart(4, '0')} · 已处理 {si * SNAP} / {NPAIRS} 对明文
      </Tx>
      <HLine x1={X0 - 6} x2={X0 + 256 * BW + 6} y={BASE + 3} />
      {cnt.map((v, g) => {
        const h = Math.round(((v / top) * HMAX) / 3) * 3;
        if (h <= 0) return null;
        const isT = g === TARGET;
        return <rect key={g} x={X0 + g * BW} y={BASE - h} width={BW} height={h} fill={isT ? (win ? T.red : INK) : T.dim} />;
      })}
      <Tx x={X0} y={BASE + 36} size={24} mono a="start" c={T.sub}>00</Tx>
      <Tx x={X0 + 256 * BW} y={BASE + 36} size={24} mono a="end" c={T.sub}>FF</Tx>
      <Tx x={960} y={BASE + 36} size={24} c={T.sub}>部分子密钥猜测（K₅ 的第 2、4 个半字节）</Tx>
      {win && (
        <>
          <Badge x={X0 + TARGET * BW - 30} y={BASE - HMAX - 84} w={168} h={60} text={`0x${h1(TARGET)}`} size={30} mono red />
          <Tx x={X0 + TARGET * BW + 162} y={BASE - HMAX - 54} size={30} mono a="start">{final[TARGET]} 次</Tx>
          <Tx x={1728} y={BASE - HMAX - 54} size={24} mono a="end" c={T.sub}>
            次高 0x{h1(second)} · {final[second]} 次
          </Tx>
          <Tx x={960} y={816} size={28} c={T.sub}>
            正确子密钥的命中率 {(final[TARGET] / NPAIRS).toFixed(4)}，贴近理论值 {CHAR.p.toFixed(4)}
          </Tx>
        </>
      )}
    </>
  );
};

export const SymDiffCues: Cue[] = [
  [0, 'whoosh'],
  ...new Array(8).fill(0).map((_, k): Cue => [WALK0 + k * 2 * WALK, 'blip', 70 + k]),
  [WALK0 + 16 * WALK, 'chime'],
  [DDT_AT, 'whoosh'],
  ...new Array(4).fill(0).map((_, k): Cue => [DDT_AT + k * 32, 'tick']),
  [DDT_AT + 150, 'blip', 84],
  [CHAR_AT, 'whoosh'],
  [CHAR_AT + 60, 'step'],
  [CHAR_AT + 120, 'step'],
  [CHAR_AT + 190, 'chime'],
  [KEY_AT, 'riser2'],
  [WIN_AT, 'reveal'],
];

/* ====================================================================== */
/* 概念 · 线性密码分析（Matsui 1993）                                     */
/* ====================================================================== */

const LAT_AT = 0;
const PILE_AT = 290;
const DATA_AT = 570;
const DES_AT = 760;

const APPROX = [
  {s: 'S₁₂', a: 0xb, b: 0x4, eq: 'X₁⊕X₃⊕X₄ = Y₂'},
  {s: 'S₂₂', a: 0x4, b: 0x5, eq: 'X₂ = Y₂⊕Y₄'},
  {s: 'S₃₂', a: 0x4, b: 0x5, eq: 'X₂ = Y₂⊕Y₄'},
  {s: 'S₃₄', a: 0x4, b: 0x5, eq: 'X₂ = Y₂⊕Y₄'},
];
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
/** exact signed fraction num/den, reduced */
const frac = (num: number, den: number) => {
  const g = gcd(Math.abs(num), den) || 1;
  return `${num < 0 ? '−' : '+'}${Math.abs(num) / g}/${den / g}`;
};
const fr16 = (n: number) => frac(n, 16);
/* piling-up as an exact rational: 2^(n−1) · ∏ (LATᵢ/16) */
const EPS_NUM = 2 ** (APPROX.length - 1) * APPROX.reduce((x, p) => x * LAT[p.a][p.b], 1);
const EPS_DEN = 16 ** APPROX.length;
const EPS = EPS_NUM / EPS_DEN;

export const SymLinear: React.FC = () => {
  const f = useF();
  const phase = f < PILE_AT ? 0 : f < DATA_AT ? 1 : 2;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {phase === 0 && <LinTable f={f - LAT_AT} />}
        {phase === 1 && <LinPile f={f - PILE_AT} />}
        {phase === 2 && <LinData f={f - DATA_AT} />}
      </svg>
      <Caption title="线性密码分析" en="LINEAR CRYPTANALYSIS" desc="寻找偏离 1/2 的线性逼近：偏差 ε 越大，所需已知明文 ≈ 1/ε² 越少" color={INK} />
    </AbsoluteFill>
  );
};

const LinTable: React.FC<{f: number}> = ({f}) => {
  const C = 30;
  const S = 33;
  const GX = 300;
  const GY = 312;
  const rows = Math.min(16, Math.floor((f - 20) / 8) + 1);
  const best = f >= 170;
  let mx = 0;
  for (let a = 1; a < 16; a++) for (let b = 1; b < 16; b++) mx = Math.max(mx, Math.abs(LAT[a][b]));
  const HL: [number, number][] = [
    [0xb, 4],
    [4, 5],
    [3, 9],
  ];
  return (
    <>
      <Tx x={GX} y={200} size={48} a="start">线性逼近表 LAT</Tx>
      <Tx x={GX + 8 * S} y={GY - 60} size={24} mono c={T.sub}>输出掩码 b →</Tx>
      <Tx x={GX - 48} y={GY + 8 * S} size={24} mono c={T.sub} a="end">a</Tx>
      {new Array(16).fill(0).map((_, i) => (
        <g key={'h' + i}>
          <Tx x={GX + i * S + C / 2} y={GY - 18} size={24} mono c={T.dim}>{h1(i)}</Tx>
          <Tx x={GX - 12} y={GY + i * S + C / 2 + 2} size={24} mono c={T.dim} a="end">{h1(i)}</Tx>
        </g>
      ))}
      {rows > 0 &&
        LAT.slice(0, rows).map((row, a) =>
          row.map((v, b) => {
            const x = GX + b * S;
            const y = GY + a * S;
            const av = Math.abs(v);
            const hl = best && HL.some(([p, q]) => p === a && q === b);
            return (
              <g key={`${a}-${b}`}>
                <rect x={x} y={y} width={C} height={C} fill={greyOf(av)} stroke={hl ? T.red : T.line} strokeWidth={hl ? PX : 1} />
                {av > 0 && (
                  <text x={x + C / 2} y={y + C / 2 + 2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={24} fill={av >= 6 ? T.invText : INK}>
                    {av}
                  </text>
                )}
              </g>
            );
          }),
        )}
      <Tx x={1000} y={330} size={36} a="start">逼近 a·X = b·Y 成立的次数 − 8（取绝对值）</Tx>
      <Tx x={1000} y={396} size={36} mono a="start">偏差 ε = 次数/16 − 1/2</Tx>
      {best && (
        <>
          {HL.map(([a, b], i) => (
            <g key={i}>
              <Badge x={1000} y={462 + i * 84} w={300} h={60} text={`${h1(a)} → ${h1(b)}`} size={30} mono inv={i === 2} />
              <Tx x={1330} y={492 + i * 84} size={36} mono a="start" c={i === 2 ? T.red : INK}>
                ε = {fr16(LAT[a][b])}
              </Tx>
            </g>
          ))}
          <Tx x={1000} y={744} size={28} a="start" c={T.sub}>最大 |偏差| = {mx}/16；完美随机时应为 0</Tx>
        </>
      )}
    </>
  );
};

const LinPile: React.FC<{f: number}> = ({f}) => {
  const n = Math.min(APPROX.length, Math.floor(f / 36) + 1);
  const formula = f >= 180;
  return (
    <>
      <Tx x={960} y={196} size={48}>堆积引理：把四个 S 盒的逼近串起来</Tx>
      {APPROX.slice(0, n).map((p, i) => {
        const x = 168 + i * 408;
        return (
          <g key={i}>
            <Box x={x} y={300} w={360} h={168} inv={i === 0} />
            <Tx x={x + 180} y={342} size={36} mono c={i === 0 ? T.invText : INK}>{p.s}</Tx>
            <Tx x={x + 180} y={396} size={28} mono c={i === 0 ? T.invText : T.sub}>{p.eq}</Tx>
            <Tx x={x + 180} y={444} size={30} mono c={i === 0 ? T.invText : INK}>ε = {fr16(LAT[p.a][p.b])}</Tx>
          </g>
        );
      })}
      {formula && (
        <>
          <Tx x={960} y={564} size={48} mono>ε = 2ⁿ⁻¹ · ∏ εᵢ</Tx>
          <Tx x={960} y={648} size={36} mono>
            = 2³ · (+¼)(−¼)(−¼)(−¼) = <tspan fill={T.red}>{frac(EPS_NUM, EPS_DEN)}</tspan>
          </Tx>
        </>
      )}
      {f >= 230 && (
        <Tx x={960} y={756} size={30} c={T.sub}>
          对全部 2¹⁶ 个明文实测：|偏差| = 1/{Math.round(1 / Math.abs(LIN_TRUE_BIAS))}，与引理吻合
        </Tx>
      )}
    </>
  );
};

/* two pixel bell curves: fraction of samples satisfying the approximation, random (1/2) vs biased (1/2 + ε) */
const NS = [16, 64, 256, 1024, 4096];
const LinData: React.FC<{f: number}> = ({f}) => {
  const k = Math.min(NS.length - 1, Math.max(0, Math.floor((f - 20) / 34)));
  const N = NS[k];
  const eps = Math.abs(EPS);
  const sd = 0.5 / Math.sqrt(N);
  const X0 = 300;
  const X1 = 1620;
  const lo = 0.4;
  const hi = 0.66;
  const BASE = 600;
  const H = 240;
  const BINS = 110;
  const bw = (X1 - X0) / BINS;
  const gauss = (x: number, m: number) => Math.exp(-((x - m) ** 2) / (2 * sd * sd));
  const des = f >= DES_AT - DATA_AT;
  const sep = (2 * eps * Math.sqrt(N)).toFixed(1);
  return (
    <>
      <Tx x={960} y={196} size={48}>需要多少已知明文？ N ≈ 1/ε²</Tx>
      <Tx x={X1} y={262} size={30} mono a="end" c={N === 1024 ? T.red : INK}>
        N = {N}{N === Math.round(1 / eps ** 2) ? ' = 1/ε²' : ''}
      </Tx>
      <Tx x={X0} y={262} size={24} a="start" c={T.sub}>两峰相距 ≈ {sep} 个标准差</Tx>
      <HLine x1={X0} x2={X1} y={BASE + 3} />
      {new Array(BINS).fill(0).map((_, i) => {
        const x = lo + ((i + 0.5) / BINS) * (hi - lo);
        const hr = Math.round((gauss(x, 0.5) * H) / 6) * 6;
        const hb = Math.round((gauss(x, 0.5 + eps) * H) / 6) * 6;
        return (
          <g key={i}>
            {hr > 0 && <rect x={X0 + i * bw} y={BASE - hr} width={Math.ceil(bw)} height={hr} fill={T.line} />}
            {hb > 0 && <rect x={X0 + i * bw} y={BASE - hb} width={Math.ceil(bw)} height={6} fill={INK} />}
          </g>
        );
      })}
      {[0.5, 0.5 + eps].map((m, i) => {
        const x = X0 + ((m - lo) / (hi - lo)) * (X1 - X0);
        return (
          <g key={i}>
            <line x1={x} y1={BASE + 6} x2={x} y2={BASE + 24} stroke={INK} strokeWidth={3} />
            <Tx x={x} y={BASE + 48} size={24} mono c={i ? INK : T.sub}>{i ? '1/2 + 1/32' : '1/2'}</Tx>
          </g>
        );
      })}
      <Tx x={X0} y={BASE + 96} size={24} a="start" c={T.sub}>灰：错误密钥（随机）　黑线：正确密钥（有偏）</Tx>
      {des && (
        <>
          <Box x={300} y={744} w={1320} h={84} inv />
          <Tx x={960} y={788} size={36} c={T.invText}>DES：Matsui 1994 用 2⁴³ 个已知明文恢复了密钥</Tx>
        </>
      )}
    </>
  );
};

export const SymLinearCues: Cue[] = [
  [0, 'whoosh'],
  ...new Array(4).fill(0).map((_, k): Cue => [20 + k * 32, 'tick']),
  [170, 'blip', 84],
  [PILE_AT, 'whoosh'],
  ...APPROX.map((_, i): Cue => [PILE_AT + i * 36, 'blip', 72 + i * 3]),
  [PILE_AT + 180, 'chime'],
  [DATA_AT, 'whoosh'],
  ...NS.map((_, i): Cue => [DATA_AT + 20 + i * 34, 'tick']),
  [DATA_AT + 20 + 3 * 34, 'bell', 79],
  [DES_AT, 'reveal'],
];
