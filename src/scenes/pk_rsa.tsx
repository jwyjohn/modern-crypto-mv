import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, BOB, LOCK, LOCK_OPEN, SpriteG} from '../components/pixel';
import {Cue, Problem, probCues} from '../components/Problem';
import {FONT, PX} from '../theme';
import {K, Person, showAt, Sup, sup, T, Tag} from './pk_common';
import {modinv, modpow, sqMul} from './pk_math';

/* ---------------- numbers (computed) ---------------- */
const p = 5;
const q = 11;
const N = p * q; // 55
const PHI = (p - 1) * (q - 1); // 40
const E = 3;
const D = modinv(E, PHI); // 27
const EQ = Math.floor(PHI / E); // 13  (40 = 13·3 + 1)
const ER = PHI % E; // 1
const M = 9;
const RAW = M ** E; // 729
const C = modpow(M, E, N); // 14
const CQ = Math.floor(RAW / N); // 13
const DEC = sqMul(C, D, N); // 14^27 mod 55 = 9
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const COPRIME = Array.from({length: N}, (_, i) => gcd(i, N) === 1);
const NCOP = COPRIME.filter(Boolean).length; // 40

const SPEC = {
  card: 330,
  reveal: 1020,
  steps: [
    {at: 0, label: '生成密钥'},
    {at: 280, label: '求私钥 d'},
    {at: 560, label: '加密'},
    {at: 800, label: '解密'},
  ],
};

export const PkRsa: React.FC = () => (
  <Problem
    no={4}
    color={K.act}
    tag="公钥密码 · RSA"
    title="教科书 RSA"
    q={[
      ['1977 年，Rivest、Shamir、Adleman 给出第一个实用的公钥加密：', {t: '公开 (N, e)，私藏 d', c: K.ink}, '。'],
      ['用最小的数字走一遍：', {t: `p = ${p}，q = ${q}，N = ${N}，e = ${E}`, m: true}, '，加密明文 ', {t: `m = ${M}`, m: true}, '。'],
    ]}
    answerText={`d = ${D}，c = ${C}，解密还原 m = ${DEC.result}`}
    brief={`p = ${p} · q = ${q} · e = ${E} · m = ${M}`}
    insight="陷门：只有知道 φ(N)（即能分解 N）才能算出 d；实用 RSA 还必须用 OAEP 随机填充"
    {...SPEC}
  >
    {(sf) => <RsaStage sf={sf} />}
  </Problem>
);

const S2 = SPEC.steps[1].at;
const S3 = SPEC.steps[2].at;
const S4 = SPEC.steps[3].at;

/* grid of Z_55 */
const GC = 11;
const CW = 60;
const GX = 120;
const GY = 336;

const RsaStage: React.FC<{sf: number}> = ({sf}) => {
  const step = sf < S2 ? 0 : sf < S3 ? 1 : sf < S4 ? 2 : 3;
  const strikeOrder = Array.from({length: N}, (_, i) => i).filter((i) => !COPRIME[i]);
  const struck = (i: number) => {
    const k = strikeOrder.indexOf(i);
    return k >= 0 && sf >= 120 + k * 5;
  };
  const blocks = Math.max(0, Math.min(CQ, Math.floor((sf - S3 - 60) / 8)));
  const decRows = DEC.rows;
  const decRowAt = (i: number) => S4 + 60 + i * 24;
  const accAt = (j: number) => S4 + 200 + j * 24;
  const BW = 66; // px per 55 units (1.2 px / unit)
  const remW = Math.round((C * BW) / N / PX) * PX;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
        {/* ---------- step 1: Z_55 grid ---------- */}
        {step === 0 &&
          Array.from({length: N}, (_, i) => {
            if (sf < 20 + i) return null;
            const x = GX + (i % GC) * CW;
            const y = GY + Math.floor(i / GC) * CW;
            const off = struck(i);
            return (
              <g key={i}>
                <rect x={x} y={y} width={CW - 6} height={CW - 6} fill={off ? K.panel2 : K.panel} stroke={off ? K.line : K.ink} strokeWidth={3} />
                <text x={x + (CW - 6) / 2} y={y + (CW - 6) / 2 + 2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={24} fill={off ? K.dim : K.ink}>
                  {i}
                </text>
              </g>
            );
          })}

        {/* ---------- step 3: 729 = 13·55 + 14 ---------- */}
        {step === 2 && (
          <g>
            {Array.from({length: blocks}, (_, k) => (
              <rect key={k} x={120 + k * BW} y={420} width={BW - 6} height={60} fill={k % 2 ? K.panel2 : K.panel} stroke={K.ink} strokeWidth={3} />
            ))}
            {sf >= S3 + 60 + CQ * 8 + 12 && <rect x={120 + CQ * BW} y={420} width={remW} height={60} fill={K.inv} />}
          </g>
        )}

        {/* ---------- sprites ---------- */}
        {step === 2 && showAt(sf, S3) && <Person map={ALICE} x={96} y={636} s={12} />}
        {step === 3 && showAt(sf, S4) && <Person map={BOB} x={96} y={636} s={12} />}
        {step === 3 && sf >= accAt(DEC.chain.length) + 12 && <SpriteG map={LOCK_OPEN} x={1680} y={606} s={6} accent={K.ink} />}
        {step === 3 && sf < accAt(DEC.chain.length) + 12 && showAt(sf, S4) && <SpriteG map={LOCK} x={1680} y={606} s={6} accent={K.ink} />}
      </svg>

      {/* ---------- step 1 text ---------- */}
      {step === 0 && (
        <>
          <T f={sf} at={0} x={120} y={252} size={48} font={FONT.pixelMono}>
            N = {p} × {q} = {N}
          </T>
          <T f={sf} at={100} x={GX + GC * CW + 48} y={GY} size={24} color={K.sub}>
            划掉 5 和 11 的倍数
          </T>
          <T f={sf} at={120 + strikeOrder.length * 5 + 12} x={GX + GC * CW + 48} y={GY + 60} size={24} color={K.sub}>
            剩下与 {N} 互素的数
          </T>
          <T f={sf} at={120 + strikeOrder.length * 5 + 24} x={GX} y={GY + 5 * CW + 36} size={48} font={FONT.pixelMono}>
            φ(N) = ({p}−1)({q}−1) = <Tag size={48}>{PHI}</Tag>
          </T>
          <T f={sf} at={120 + strikeOrder.length * 5 + 24} x={GX + GC * CW + 48} y={GY + 120} size={24} color={K.dim} font={FONT.pixelMono}>
            （数一数：{NCOP} 个）
          </T>
        </>
      )}

      {/* ---------- step 2: extended Euclid ---------- */}
      {step === 1 && (
        <>
          <T f={sf} at={S2} x={120} y={264} size={36} color={K.sub}>
            私钥 d 是 e 在模 φ(N) 下的逆元
          </T>
          <T f={sf} at={S2 + 30} x={120} y={336} size={48} font={FONT.pixelMono}>
            {E} · d ≡ 1 (mod {PHI})
          </T>
          <T f={sf} at={S2 + 80} x={120} y={432} size={48} font={FONT.pixelMono}>
            {PHI} = {EQ} × {E} + {ER}
          </T>
          <T f={sf} at={S2 + 120} x={120} y={516} size={48} font={FONT.pixelMono}>
            1 = {PHI} − {EQ} × {E}
          </T>
          <T f={sf} at={S2 + 170} x={120} y={612} size={48} font={FONT.pixelMono}>
            d ≡ −{EQ} ≡ <Tag size={48}>{D}</Tag> (mod {PHI})
          </T>
          <T f={sf} at={S2 + 210} x={120} y={708} size={36} color={K.sub} font={FONT.pixelMono}>
            验算 {E} × {D} = {E * D} = {Math.floor((E * D) / PHI)} × {PHI} + 1 ✓
          </T>
        </>
      )}

      {/* ---------- step 3: encryption ---------- */}
      {step === 2 && (
        <>
          <T f={sf} at={S3} x={120} y={264} size={36} color={K.sub}>
            Alice 只用公钥 (N, e) 加密
          </T>
          <T f={sf} at={S3 + 24} x={120} y={330} size={48} font={FONT.pixelMono}>
            c = m{sup('e')} mod N = {M}
            {sup(E)} mod {N}
          </T>
          <T f={sf} at={S3 + 60 + CQ * 8 + 12} x={120} y={510} size={36} font={FONT.pixelMono}>
            {M}
            {sup(E)} = {RAW} = {CQ} × {N} + {C}
          </T>
          <T f={sf} at={S3 + 60 + CQ * 8 + 50} x={288} y={672} size={60} font={FONT.pixelMono}>
            c = <Tag size={60}>{C}</Tag>
          </T>
        </>
      )}

      {/* ---------- step 4: decryption by square-and-multiply ---------- */}
      {step === 3 && (
        <>
          <T f={sf} at={S4} x={120} y={252} size={48} font={FONT.pixelMono}>
            m = c<Sup>d</Sup> = {C}
            {sup(D)} mod {N}
          </T>
          <T f={sf} at={S4 + 30} x={840} y={264} size={36} color={K.sub} font={FONT.pixelMono}>
            {D} = {D.toString(2)}₂
          </T>
          {decRows.map((r, i) => (
            <T key={i} f={sf} at={decRowAt(i)} x={312} y={336 + i * 54} size={36} font={FONT.pixelMono} color={r.bit ? K.ink : K.dim}>
              {C}
              {sup(r.k)} ≡ {String(r.v).padStart(2, ' ')}　{r.bit ? '✓ 取' : '· 跳过'}
            </T>
          ))}
          {DEC.chain.map((c, j) => (
            <T key={j} f={sf} at={accAt(j)} x={840} y={336 + decRows.findIndex((r) => r.k === c.k) * 54} size={36} font={FONT.pixelMono} color={K.sub}>
              → 累乘 ≡ {c.acc}
            </T>
          ))}
          <T f={sf} at={accAt(DEC.chain.length) + 12} x={1236} y={432} size={72} font={FONT.pixelMono}>
            m = <Tag size={72}>{DEC.result}</Tag>
          </T>
          <T f={sf} at={accAt(DEC.chain.length) + 24} x={1236} y={540} size={36} color={K.sub}>
            还原明文 ✓
          </T>
        </>
      )}
      {/* sprite captions */}
      {step === 2 && (
        <T f={sf} at={S3 + 12} x={96} y={816} size={24} color={K.sub}>
          Alice
        </T>
      )}
      {step === 3 && (
        <T f={sf} at={S4 + 12} x={96} y={816} size={24} color={K.sub}>
          Bob（持有 d）
        </T>
      )}
    </AbsoluteFill>
  );
};

export const PkRsaCues: Cue[] = probCues(SPEC, [
  [20, 'type'],
  [120, 'tick'],
  [196, 'chime'],
  [S2 + 80, 'type'],
  [S2 + 170, 'bell', 76],
  [S3 + 60, 'tick'],
  [S3 + 60 + CQ * 8 + 50, 'chime'],
  [S4 + 60, 'type'],
  [S4 + 200, 'tick'],
  [S4 + 200 + DEC.chain.length * 24 + 12, 'bell', 79],
]);
