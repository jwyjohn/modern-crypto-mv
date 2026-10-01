import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ActTitle} from '../components/ActTitle';
import {ALICE, EVE, KEY, LOCK, SAGE, SpriteG} from '../components/pixel';
import {Cue, Problem, probCues} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {clamp01, COL, lerp, PX, quant, rnd} from '../theme';
import {appear, Badge, BCell, Box, during, hx, HLine, Mark, T, Tx, typed} from './sym_lib';

const INK = COL.text;
const ACT = COL.sym; // ink

/* ====================================================================== */
/* 章 I · 标题                                                            */
/* ====================================================================== */

export const SymTitle: React.FC = () => (
  <ActTitle
    num="01"
    zh="对称密码"
    en="SYMMETRIC CRYPTO"
    color={ACT}
    topics={['一次一密', '分组密码 AES', '差分与线性分析', '代数攻击', '工作模式', '生日界', '认证加密']}
    quote="密码系统的安全性只应依赖于密钥"
    by="Auguste Kerckhoffs, 1883"
    year={1949}
  />
);

/* ====================================================================== */
/* 概念 · 一次一密                                                        */
/* ====================================================================== */

const OTP_M = [0, 1, 1, 0, 1, 0, 0, 1];
const OTP_K = [1, 1, 0, 0, 1, 1, 0, 1];
const OTP_C = OTP_M.map((m, i) => m ^ OTP_K[i]);
const OTP_CAND = ['ATTACK AT DAWN', 'HOLD POSITION', 'RETREAT AT TEN'];

export const SymOtp: React.FC = () => {
  const f = useF();
  const CW = 78;
  const ST = 96;
  const X0 = 672;
  const yM = 300;
  const yK = 408;
  const yC = 516;
  const col = Math.floor((f - 70) / 22);
  const done = f >= 70 + 8 * 22;
  const ph2 = f >= 430;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {!ph2 && (
          <>
            <Tx x={960} y={210} size={48}>
              明文 ⊕ 密钥 = 密文
            </Tx>
            <SpriteG map={ALICE} x={168} y={312} s={9} accent={ACT} />
            <SpriteG map={KEY} x={150} y={492} s={9} accent={ACT} />
            <Tx x={X0 - 54} y={yM + CW / 2} size={36} mono c={T.sub} a="end">m</Tx>
            <Tx x={X0 - 54} y={yK + CW / 2} size={36} mono c={T.sub} a="end">k</Tx>
            <Tx x={X0 - 54} y={yC + CW / 2} size={36} mono c={INK} a="end">c</Tx>
            {OTP_M.map((_, i) => {
              const on = i === col && !done;
              const show = f >= 70 + i * 22;
              return (
                <g key={i}>
                  <BCell x={X0 + i * ST} y={yM} w={CW} h={CW} text={OTP_M[i]} inv={OTP_M[i] === 1} size={36} />
                  <BCell x={X0 + i * ST} y={yK} w={CW} h={CW} text={OTP_K[i]} inv={OTP_K[i] === 1} grey size={36} />
                  {show ? (
                    <BCell x={X0 + i * ST} y={yC} w={CW} h={CW} text={OTP_C[i]} inv={OTP_C[i] === 1} size={36} />
                  ) : (
                    <BCell x={X0 + i * ST} y={yC} w={CW} h={CW} empty size={36} />
                  )}
                </g>
              );
            })}
            {done && <SpriteG map={LOCK} x={1584} y={456} s={10} accent={ACT} />}
            <Tx x={960} y={700} size={36} c={T.sub}>相同记 0，不同记 1</Tx>
          </>
        )}
        {ph2 && (
          <>
            <Tx x={960} y={210} size={48}>同一密文，可解出任何明文</Tx>
            <SpriteG map={SAGE} x={150} y={312} s={9} accent={ACT} />
            <Badge x={700} y={282} w={520} h={72} text="c = 3F A9 2C …" size={36} mono inv />
            {OTP_CAND.map((cand, i) => {
              const y = 440 + i * 112;
              if (!appear(f, 470 + i * 34)) return null;
              return (
                <g key={i}>
                  <Badge x={372} y={y} w={300} h={60} text={`k${'₁₂₃'[i]} = c ⊕ m${'₁₂₃'[i]}`} size={28} mono />
                  <HLine x1={690} x2={936} y={y + 30} />
                  <polygon points={`936,${y + 30} 918,${y + 21} 918,${y + 39}`} fill={INK} />
                  <Badge x={960} y={y} w={456} h={60} text={`"${cand}"`} size={30} mono />
                </g>
              );
            })}
            <Tx x={960} y={812} size={30} c={T.sub}>每个明文同样可能 · Shannon 1949：|K| ≥ |M|</Tx>
          </>
        )}
      </svg>
      <Caption title="一次一密" en="ONE-TIME PAD" desc="完美保密：密文不泄露明文的任何信息，但密钥必须和消息一样长" color={ACT} />
    </AbsoluteFill>
  );
};

export const SymOtpCues: Cue[] = [
  [0, 'whoosh'],
  ...OTP_M.map((_, i): Cue => [70 + i * 22, 'blip', 72 + i * 2]),
  [70 + 8 * 22, 'chime'],
  [430, 'whoosh'],
  ...OTP_CAND.map((_, i): Cue => [470 + i * 34, 'blip', 76 + i * 3]),
  [620, 'chime'],
];

/* ====================================================================== */
/* 案例 01 · 两次一密（Venona 1943）                                      */
/* ====================================================================== */

const TT_M1 = 'ATTACK AT DAWN';
const TT_M2 = 'SELL ALL STOCK';
const TT_KEY = [...TT_M1].map((_, i) => 0x5a + (i % 7));
const TT_C1 = [...TT_M1].map((c, i) => c.charCodeAt(0) ^ TT_KEY[i]);
const TT_C2 = [...TT_M2].map((c, i) => c.charCodeAt(0) ^ TT_KEY[i]);
const TT_XOR = TT_C1.map((b, i) => b ^ TT_C2[i]); // = m1 ⊕ m2
const CRIB = 'ATTACK';

const TWO = {
  card: 330,
  reveal: 820,
  steps: [
    {at: 0, label: '两封密文'},
    {at: 240, label: '密钥抵消'},
    {at: 460, label: '拖动 crib'},
    {at: 660, label: '还原明文'},
  ],
};

export const SymTwoTime: React.FC = () => (
  <Problem
    no={1}
    color={ACT}
    tag="对称密码 · 流密码"
    title="两次一密"
    brief="密钥流复用，k 自相抵消"
    q={[
      ['1943 年，美国情报人员开始分析苏联的加密电报。'],
      ['操作员为图省事，把同一段一次性密钥流用在了多封电报上。'],
      ['分析员只需把两封密文逐位异或，', {t: '密钥便自动消失', c: ACT}, '。'],
    ]}
    answerText="c₁ ⊕ c₂ = m₁ ⊕ m₂"
    insight="密钥流一旦复用就不再是一次性密码；明文的冗余足以还原两条消息。"
    {...TWO}
  >
    {(sf) => <TwoStage sf={sf} />}
  </Problem>
);

const TwoStage: React.FC<{sf: number}> = ({sf}) => {
  const N = TT_M1.length;
  const CW = 78;
  const ST = 96;
  const X0 = 960 - (N * ST - (ST - CW)) / 2;
  const showXor = sf >= 240;
  const off = sf < 460 ? 5 : sf < 600 ? Math.round(lerp(5, 0, quant(clamp01((sf - 460) / 140), 5))) : 0;
  const landed = sf >= 600;
  const cribOut = [...CRIB].map((ch, i) => {
    const b = TT_XOR[i + off] ^ ch.charCodeAt(0);
    return b >= 32 && b < 127 ? String.fromCharCode(b) : '·';
  });
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        <Tx x={960} y={282} size={36}>c₁ ⊕ c₂ = (m₁⊕k) ⊕ (m₂⊕k) = m₁ ⊕ m₂</Tx>
        <SpriteG map={EVE} x={1746} y={300} s={6} accent={ACT} />
        <Tx x={X0 - 36} y={352} size={30} mono c={T.sub} a="end">c₁</Tx>
        <Tx x={X0 - 36} y={436} size={30} mono c={T.sub} a="end">c₂</Tx>
        <Tx x={X0 - 36} y={540} size={30} mono c={INK} a="end">m₁⊕m₂</Tx>
        {TT_XOR.map((xv, i) => (
          <g key={i}>
            <BCell x={X0 + i * ST} y={320} w={CW} h={64} text={hx(TT_C1[i])} grey size={24} />
            <BCell x={X0 + i * ST} y={404} w={CW} h={64} text={hx(TT_C2[i])} grey size={24} />
            {showXor ? <BCell x={X0 + i * ST} y={508} w={CW} h={64} text={hx(xv)} size={24} /> : <BCell x={X0 + i * ST} y={508} w={CW} h={64} empty size={24} />}
          </g>
        ))}
        {sf >= 400 && (
          <>
            <Tx x={X0 - 36} y={656} size={28} mono c={T.sub} a="end">crib</Tx>
            <Tx x={X0 - 36} y={744} size={28} mono c={landed ? INK : T.sub} a="end">得到</Tx>
            {[...CRIB].map((ch, i) => {
              const x = X0 + (i + off) * ST;
              return (
                <g key={i}>
                  <BCell x={x} y={624} w={CW} h={64} text={ch} inv size={28} />
                  <BCell x={x} y={712} w={CW} h={64} text={cribOut[i]} red={landed} grey={!landed} size={28} />
                </g>
              );
            })}
          </>
        )}
        {sf >= 660 && (
          <>
            <Tx x={110} y={838} size={36} mono c={INK} a="start">m₁ = {typed(TT_M1, sf, 660, 0.5)}</Tx>
            <Tx x={110} y={898} size={36} mono c={INK} a="start">m₂ = {typed(TT_M2, sf, 700, 0.5)}</Tx>
          </>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const SymTwoTimeCues: Cue[] = probCues(TWO, [
  [60, 'whoosh'],
  [240, 'chime'],
  [460, 'tick'],
  [520, 'tick'],
  [580, 'tick'],
  [600, 'reveal'],
  ...[...TT_M1].map((_, i): Cue => [660 + i * 10, 'type', 70 + i]),
]);

/* ====================================================================== */
/* 概念 · 分组密码 AES                                                    */
/* ====================================================================== */

const xtime = (a: number) => ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff;
const gmul = (a: number, b: number) => {
  let r = 0;
  while (b) {
    if (b & 1) r ^= a;
    a = xtime(a);
    b >>= 1;
  }
  return r;
};
const ginv = (a: number) => {
  if (!a) return 0;
  let r = 1;
  for (let i = 0; i < 254; i++) r = gmul(r, a);
  return r;
};
const rotl8 = (b: number, n: number) => ((b << n) | (b >> (8 - n))) & 0xff;
const sbox = (x: number) => {
  const b = ginv(x);
  return (b ^ rotl8(b, 1) ^ rotl8(b, 2) ^ rotl8(b, 3) ^ rotl8(b, 4) ^ 0x63) & 0xff;
};
const AES_STATE = new Array(16).fill(0).map((_, i) => Math.floor(rnd(i * 7.13 + 1.7) * 256));

const PHS = [
  {l: 'SubBytes', d: 'S 盒：GF(2^8) 求逆 + 仿射'},
  {l: 'ShiftRows', d: '第 r 行循环左移 r 字节'},
  {l: 'MixColumns', d: '每列在 GF(2^8) 上混合'},
  {l: 'AddRoundKey', d: '异或轮密钥 k_r'},
];

export const SymAes: React.FC = () => {
  const f = useF();
  const GX = 240;
  const GY = 300;
  const CW = 108;
  const CEL = 114;
  const avaStart = 540;
  const inAva = f >= avaStart;
  const round = Math.min(10, 1 + Math.floor(clamp01((f - 60) / 48) * 10));
  const pSub = during(f, 60, 180);
  const pMix = during(f, 300, 420);
  const pKey = during(f, 420, 540);
  const active = f < 180 ? 0 : f < 300 ? 1 : f < 420 ? 2 : 3;
  const shiftOf = (row: number) => (f >= 300 ? row : 0);
  const avaRound = Math.min(10, Math.max(0, Math.floor((f - avaStart) / 30)));
  const heat = (i: number, rr: number) => {
    const dist = (i % 4) + Math.floor(i / 4);
    const reach = clamp01((rr - dist * 0.35) / 2.5);
    return clamp01(i === 0 && rr === 0 ? 0.1 : reach * (0.32 + 0.18 * rnd(i * 3.1 + rr)));
  };
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {!inAva && (
          <>
            <Tx x={240} y={210} size={48} a="start">AES-128 · 10 轮 SPN</Tx>
            <Tx x={1680} y={210} size={32} press c={T.sub} a="end">ROUND {String(round).padStart(2, '0')}/10</Tx>
            {AES_STATE.map((bv, i) => {
              const c = i % 4;
              const r = Math.floor(i / 4);
              const val = f >= 180 ? sbox(bv) : bv;
              const dx = shiftOf(r) * 6;
              return <BCell key={i} x={GX + c * CEL - dx} y={GY + r * CEL} w={CW} h={CW} text={hx(val)} inv={pSub && c === r} grey={pMix && (c + r) % 2 === 0} size={32} />;
            })}
            {PHS.map((ph, j) => {
              const on = j === active;
              return (
                <g key={j}>
                  <Box x={900} y={300 + j * 114} w={840} h={90} inv={on} />
                  <Tx x={936} y={300 + j * 114 + 32} size={36} a="start" c={on ? T.invText : INK}>{j + 1}. {ph.l}</Tx>
                  <Tx x={936} y={300 + j * 114 + 66} size={24} a="start" c={on ? T.invText : T.sub}>{ph.d}</Tx>
                </g>
              );
            })}
            {pKey && <SpriteG map={KEY} x={300} y={772} s={9} accent={ACT} />}
          </>
        )}
        {inAva && (
          <>
            <Tx x={240} y={210} size={48} a="start">雪崩效应</Tx>
            <Tx x={1680} y={210} size={32} press c={T.sub} a="end">ROUND {String(avaRound).padStart(2, '0')}/10</Tx>
            <Tx x={960} y={282} size={30} c={T.sub}>翻转 1 个输入比特，约 {avaRound} 轮后扩散到近半数</Tx>
            {AES_STATE.map((_, i) => {
              const c = i % 4;
              const r = Math.floor(i / 4);
              const h = heat(i, avaRound);
              return <BCell key={i} x={708 + c * CEL} y={360 + r * CEL} w={CW} h={CW} text={`${Math.round(h * 100)}`} inv={h > 0.42} grey={h > 0.15 && h <= 0.42} size={32} />;
            })}
            <Tx x={960} y={852} size={24} c={T.sub}>格内为该字节比特差异百分比（实心表示已近饱和）</Tx>
          </>
        )}
      </svg>
      <Caption title="分组密码 AES" en="BLOCK CIPHER" desc="128 位分组 · 10 轮 SPN：固定密钥后，是一个看起来随机的置换" color={ACT} />
    </AbsoluteFill>
  );
};

export const SymAesCues: Cue[] = [
  [0, 'whoosh'],
  [60, 'blip', 72],
  [180, 'blip', 76],
  [300, 'blip', 79],
  [420, 'blip', 83],
  [540, 'riser2'],
  ...new Array(8).fill(0).map((_, k): Cue => [560 + k * 40, 'tick']),
  [880, 'chime'],
];

/* ====================================================================== */
/* 概念 · 工作模式                                                        */
/* ====================================================================== */

const LOCK_ART = [
  '000000011111100000000000',
  '000000110000110000000000',
  '000001100000011000000000',
  '000011000000001100000000',
  '000011000000001100000000',
  '000011000000001100000000',
  '001111111111111111110000',
  '011111111111111111111000',
  '011111111111111111111000',
  '011111112222211111111000',
  '011111112222211111111000',
  '011111112200211111111000',
  '011111112200211111111000',
  '011111112222211111111000',
  '011111111111111111111000',
  '011111111111111111111000',
  '001111111111111111110000',
  '000000000000000000000000',
];

export const SymModes: React.FC = () => {
  const f = useF();
  const COLS = 24;
  const ROWS = LOCK_ART.length;
  const P = 9;
  const OY = 270;
  const tEnc = quant(clamp01((f - 60) / 220), COLS);
  const colAt = Math.floor(tEnc * COLS);
  const W = COLS * P;
  const panel = (ox: number, mode: 'plain' | 'ecb' | 'cbc') =>
    LOCK_ART.map((rowStr, r) =>
      rowStr.split('').map((ch, c) => {
        const v = +ch;
        const encd = c <= colAt && mode !== 'plain';
        let fill: string;
        if (!encd) fill = v === 0 ? T.paper : v === 2 ? T.grey : INK;
        else if (mode === 'ecb') fill = v === 0 ? T.paper : v === 2 ? T.grey : INK;
        else {
          const n = rnd(r * 31.7 + c * 13.3 + 5);
          fill = n < 0.4 ? INK : n < 0.7 ? T.grey : T.paper;
        }
        return <rect key={`${r}-${c}`} x={ox + c * P} y={OY + r * P} width={P} height={P} fill={fill} />;
      }),
    );
  const panels = [
    {x: 186, mode: 'plain' as const, label: '明文'},
    {x: 786, mode: 'ecb' as const, label: 'ECB'},
    {x: 1386, mode: 'cbc' as const, label: 'CBC / CTR'},
  ];
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        <Tx x={960} y={210} size={42}>逐块加密：ECB 泄露结构，CBC / CTR 变噪声</Tx>
        {panels.map((p, i) => (
          <g key={i}>
            <Box x={p.x - 12} y={OY - 12} w={W + 24} h={ROWS * P + 24} red={p.mode === 'ecb'} />
            {panel(p.x, p.mode)}
            <Tx x={p.x + W / 2} y={OY + ROWS * P + 48} size={32} c={p.mode === 'ecb' ? T.red : INK}>{p.label}</Tx>
          </g>
        ))}
        {f >= 420 && (
          <g>
            <Tx x={960} y={560} size={30} c={T.sub}>CBC 链接：cᵢ = E(k, mᵢ ⊕ cᵢ₋₁)，IV 作为 c₀</Tx>
            {[0, 1, 2, 3].map((i) => {
              if (!appear(f, 460 + i * 30)) return null;
              const bx = 420 + i * 300;
              const by = 600;
              return (
                <g key={i}>
                  <Badge x={bx} y={by} w={120} h={54} text={`m${'₁₂₃₄'[i]}`} size={28} mono />
                  <Tx x={bx + 60} y={by + 88} size={30} c={T.red}>⊕</Tx>
                  <Badge x={bx + 12} y={by + 112} w={96} h={54} text="E" size={30} inv />
                  <Badge x={bx} y={by + 178} w={120} h={54} text={`c${'₁₂₃₄'[i]}`} size={28} mono inv />
                  {i < 3 && <HLine x1={bx + 120} x2={bx + 300 + 60} y={by + 205} />}
                  {i === 0 && <Tx x={bx - 54} y={by + 205} size={24} mono c={T.sub}>IV</Tx>}
                </g>
              );
            })}
          </g>
        )}
      </svg>
      <Caption title="工作模式" en="MODES OF OPERATION" desc="ECB 泄露明文结构；CBC / CTR 需要随机 IV 或 nonce" color={ACT} />
    </AbsoluteFill>
  );
};

export const SymModesCues: Cue[] = [
  [0, 'whoosh'],
  [60, 'riser2'],
  [240, 'reveal'],
  [420, 'whoosh'],
  ...[0, 1, 2, 3].map((i): Cue => [460 + i * 30, 'blip', 74 + i * 2]),
];

/* ====================================================================== */
/* 案例 02 · 生日界（Yuval 1979）                                         */
/* ====================================================================== */

const BDAYS = new Array(23).fill(0).map((_, i) => Math.floor(rnd(i * 13.7 + 13 * 3.3) * 365));
const BD_COLL = (() => {
  const seen: Record<number, number> = {};
  for (let i = 0; i < BDAYS.length; i++) {
    if (seen[BDAYS[i]] !== undefined) return [seen[BDAYS[i]], i];
    seen[BDAYS[i]] = i;
  }
  return [-1, -1];
})();
const bP = (n: number) => {
  let p = 1;
  for (let i = 1; i < n; i++) p *= 1 - i / 365;
  return 1 - p;
};

const BDAY = {
  card: 330,
  reveal: 720,
  steps: [
    {at: 0, label: '23 人同室'},
    {at: 230, label: '概率过半'},
    {at: 440, label: '推广 √N'},
    {at: 600, label: '哈希强度'},
  ],
};

export const SymBirthday: React.FC = () => (
  <Problem
    no={3}
    color={ACT}
    tag="对称密码 · 哈希函数"
    title="生日界"
    brief="约 √N 次即可找到碰撞"
    q={[
      ['1979 年，Gustav Yuval 用一个派对悖论敲打哈希函数。'],
      ['一屋 23 人，就有过半的概率出现两人同一天生日。'],
      ['把生日换成哈希输出，', {t: '碰撞来得远比想象快', c: ACT}, '。'],
    ]}
    answerText="约 2^(n/2) 次就会碰撞"
    insight="生日界：n 位哈希只有 n/2 位抗碰撞强度，256 位哈希约等于 128 位。"
    {...BDAY}
  >
    {(sf) => <BdayStage sf={sf} />}
  </Problem>
);

const BdayStage: React.FC<{sf: number}> = ({sf}) => {
  const RX = 500;
  const RY = 540;
  const RAD = 220;
  const dropN = Math.min(23, Math.floor(quant(clamp01((sf - 20) / 200), 23) * 23));
  const collShown = sf >= 230 && BD_COLL[0] >= 0;
  const ang = (d: number) => ((-90 + (d / 365) * 360) * Math.PI) / 180;
  const CX = 1040;
  const CY = 740;
  const CWd = 680;
  const CHt = 360;
  const nMax = Math.floor(quant(clamp01((sf - 240) / 180), 60) * 60);
  const px = (n: number) => CX + (n / 60) * CWd;
  const py = (p: number) => CY - p * CHt;
  const p23 = bP(23);
  const curve = (() => {
    let d = '';
    for (let n = 1; n <= Math.max(1, nMax); n++) d += `${n === 1 ? 'M' : 'L'}${px(n).toFixed(0)},${py(bP(n)).toFixed(0)} `;
    return d;
  })();
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        <Tx x={RX} y={296} size={32}>365 天的环 · 23 人</Tx>
        <circle cx={RX} cy={RY} r={RAD} fill="none" stroke={T.line} strokeWidth={3} />
        {BDAYS.slice(0, dropN).map((d, i) => {
          const a = ang(d);
          const x = RX + Math.cos(a) * RAD;
          const y = RY + Math.sin(a) * RAD;
          const isC = collShown && (i === BD_COLL[0] || i === BD_COLL[1]);
          return <rect key={i} x={x - 9} y={y - 9} width={18} height={18} fill={isC ? T.red : INK} />;
        })}
        <Tx x={RX} y={RY} size={48} mono>{dropN}/23</Tx>
        {collShown && <Tx x={RX} y={RY + RAD + 36} size={30} c={T.red}>发现碰撞</Tx>}
        {sf >= 230 && (
          <>
            <HLine x1={CX} x2={CX + CWd} y={CY} />
            <line x1={CX} y1={CY} x2={CX} y2={CY - CHt} stroke={INK} strokeWidth={3} />
            <HLine x1={CX} x2={CX + CWd} y={py(0.5)} dash red />
            <Tx x={CX - 18} y={py(0.5)} size={24} mono c={T.red} a="end">50%</Tx>
            <path d={curve} fill="none" stroke={INK} strokeWidth={PX} />
            {nMax >= 23 && (
              <>
                <rect x={px(23) - 9} y={py(p23) - 9} width={18} height={18} fill={T.red} />
                <Tx x={px(23)} y={py(p23) - 36} size={28} mono c={T.red}>n=23 → {(p23 * 100).toFixed(1)}%</Tx>
              </>
            )}
          </>
        )}
        {sf >= 440 && <Tx x={110} y={858} size={32} a="start">√N ≈ 1.17 · 2^(n/2)</Tx>}
        {sf >= 600 && <Tx x={110} y={912} size={28} mono a="start" c={T.sub}>MD5 128 位 → 2^64 · SHA-256 → 2^128</Tx>}
      </svg>
    </AbsoluteFill>
  );
};

export const SymBirthdayCues: Cue[] = probCues(BDAY, [
  ...new Array(23).fill(0).map((_, i): Cue => [20 + i * 9, 'tick']),
  [230, 'reveal'],
  [240, 'riser2'],
  [440, 'chime'],
  [600, 'bell', 76],
]);

/* ====================================================================== */
/* 概念 · 认证加密                                                        */
/* ====================================================================== */

export const SymAe: React.FC = () => {
  const f = useF();
  const SCHEMES = [
    {name: 'MAC-then-Encrypt', proto: 'TLS', y: 280, secure: false, steps: ['m', 'MAC', 'ENC']},
    {name: 'Encrypt-and-MAC', proto: 'SSH', y: 440, secure: false, steps: ['m', 'ENC', 'MAC']},
    {name: 'Encrypt-then-MAC', proto: 'IPsec', y: 600, secure: true, steps: ['m', 'ENC', 'MAC']},
  ];
  const tamper = f >= 240;
  const verdict = f >= 400;
  const aead = f >= 580;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        <Tx x={960} y={210} size={42}>加密与 MAC 的三种组合</Tx>
        {tamper && <SpriteG map={EVE} x={1746} y={300} s={6} accent={ACT} />}
        {SCHEMES.map((s, i) => {
          if (!appear(f, 30 + i * 20)) return null;
          const BX = 420;
          const y = s.y;
          return (
            <g key={i}>
              <Tx x={BX - 40} y={y + 20} size={32} a="end" c={s.secure ? INK : T.sub}>{s.name}</Tx>
              <Tx x={BX - 40} y={y + 60} size={24} mono a="end" c={T.dim}>{s.proto}</Tx>
              {s.steps.map((st, k) => {
                const isBox = st === 'MAC' || st === 'ENC';
                const bx = BX + k * 234;
                return (
                  <g key={k}>
                    {isBox ? <Badge x={bx} y={y} w={138} h={54} text={st} size={28} inv={st === 'MAC' && s.secure} /> : <Tx x={bx + 40} y={y + 27} size={28} mono>{st}</Tx>}
                    {k < s.steps.length - 1 && <HLine x1={bx + (isBox ? 150 : 74)} x2={bx + 234 - 6} y={y + 27} />}
                  </g>
                );
              })}
              <Badge x={BX + 3 * 234} y={y} w={120} h={54} text="c∥t" size={26} mono />
              {verdict && <Mark x={BX + 3 * 234 + 180} y={y + 27} ok={s.secure} />}
              {verdict && s.secure && <Tx x={BX + 3 * 234 + 228} y={y + 27} size={24} a="start">先验证</Tx>}
            </g>
          );
        })}
        {aead && (
          <>
            <Tx x={960} y={748} size={32}>现代做法：AEAD 一步到位</Tx>
            <Badge x={540} y={792} w={360} h={60} text="AES-GCM" size={30} />
            <Badge x={996} y={792} w={420} h={60} text="ChaCha20-Poly1305" size={28} />
          </>
        )}
      </svg>
      <Caption title="认证加密" en="AUTHENTICATED ENCRYPTION" desc="Encrypt-then-MAC：先验证，再解密（Bellare & Namprempre 2000）" color={ACT} />
    </AbsoluteFill>
  );
};

export const SymAeCues: Cue[] = [
  [0, 'whoosh'],
  [30, 'blip', 72],
  [50, 'blip', 74],
  [70, 'blip', 76],
  [240, 'error'],
  [400, 'chime'],
  [580, 'chime'],
];

/* ====================================================================== */
/* 案例 03 · CBC 填充谕言（Vaudenay 2002）                                */
/* ====================================================================== */

const PAD_PLAIN = [...'SECRET MESSAGE!!'].map((c) => c.charCodeAt(0));
const PAD_C0 = new Array(16).fill(0).map((_, i) => Math.floor(rnd(i * 5.9 + 3.1) * 256));
const PAD_C1 = new Array(16).fill(0).map((_, i) => Math.floor(rnd(i * 4.3 + 9.7) * 256));

const PADQ = {
  card: 360,
  reveal: 940,
  steps: [
    {at: 0, label: '改末字节'},
    {at: 220, label: '枚举 g'},
    {at: 480, label: '谕言说对'},
    {at: 740, label: '下一字节'},
  ],
};

export const SymPadding: React.FC = () => (
  <Problem
    no={4}
    color={ACT}
    tag="对称密码 · CBC 攻击"
    title="CBC 填充谕言"
    brief="一个比特的泄露，解开整块明文"
    q={[
      ['2002 年，Serge Vaudenay 盯上了一个只泄露一个比特的服务器。'],
      ['CBC 解密后，填充是否合法的回应，成了攻击者的谕言 oracle。'],
      ['逐字节试探，', {t: '密文被服务器自己解开', c: ACT}, '。'],
    ]}
    answerText="每字节 ≤ 256 次，整块 ≤ 4096 次"
    insight="解密端哪怕只泄露填充对错，也能逐字节还原明文——所以必须先验 MAC。"
    {...PADQ}
  >
    {(sf) => <PadStage sf={sf} />}
  </Problem>
);

const PadStage: React.FC<{sf: number}> = ({sf}) => {
  const N = 16;
  const CW = 78;
  const ST = 90;
  const X0 = 960 - (N * ST - (ST - CW)) / 2;
  const phase2 = sf >= 740;
  const revealed = sf >= 940;
  const pos = phase2 ? 14 : 15;
  const pad = phase2 ? 0x02 : 0x01;
  const correct = PAD_PLAIN[pos];
  const prog1 = quant(clamp01((sf - 60) / 360), correct + 1);
  const prog2 = quant(clamp01((sf - 740) / 160), PAD_PLAIN[14] + 1);
  const g = phase2 ? Math.min(PAD_PLAIN[14], Math.floor(prog2 * (PAD_PLAIN[14] + 1))) : Math.min(correct, Math.floor(prog1 * (correct + 1)));
  const found15 = sf >= 500;
  const found14 = sf >= 900;
  const hit = (phase2 ? found14 : found15) && g >= correct;
  const recovered = (found15 ? 1 : 0) + (found14 ? 1 : 0);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        <Tx x={960} y={282} size={34}>D(k, c₁) ⊕ c₀ = m₁　（改 c₀ 就改 m₁）</Tx>
        <SpriteG map={EVE} x={120} y={316} s={6} accent={ACT} />
        <Tx x={X0 + N * ST - (ST - CW)} y={636} size={24} c={T.sub} a="end">已恢复 {recovered} / 16 字节</Tx>
        <Tx x={X0 - 36} y={352} size={28} mono c={T.sub} a="end">c₀</Tx>
        <Tx x={X0 - 36} y={442} size={28} mono c={T.sub} a="end">c₁</Tx>
        <Tx x={X0 - 36} y={560} size={28} mono c={INK} a="end">m₁</Tx>
        {PAD_C0.map((b, i) => {
          const tampered = i >= pos;
          const tv = i === pos ? b ^ g ^ pad : i > pos ? b ^ PAD_PLAIN[i] ^ pad : b;
          const cur = i === pos;
          const kn = (i === 15 && found15) || (i === 14 && found14);
          return (
            <g key={i}>
              <BCell x={X0 + i * ST} y={320} w={CW} h={64} text={hx(tampered ? tv : b)} red={cur && !hit} inv={cur && hit} grey={tampered && !cur} size={22} />
              <BCell x={X0 + i * ST} y={410} w={CW} h={64} text={hx(PAD_C1[i])} grey size={22} />
              <BCell x={X0 + i * ST} y={528} w={CW} h={64} text={kn ? String.fromCharCode(PAD_PLAIN[i]) : '?'} inv={kn} empty={!kn} size={24} />
            </g>
          );
        })}
        <Tx x={X0 + pos * ST + CW / 2} y={300} size={26} mono c={hit ? INK : T.red}>g={hx(g)}</Tx>
        {!revealed && (
          <>
            <Tx x={960} y={664} size={28} c={T.sub}>设 c₀′[{pos}] = c₀[{pos}] ⊕ g ⊕ 0x{pad === 1 ? '01' : '02'}，再问谕言</Tx>
            <Box x={770} y={712} w={380} h={90} inv red={!hit} />
            <Tx x={960} y={758} size={32} c={T.invText}>{hit ? '✓ 填充正确' : '✗ padding error'}</Tx>
          </>
        )}
        {phase2 && <Tx x={110} y={880} size={26} a="start" c={T.sub}>下一字节：目标填充变 02 02</Tx>}
      </svg>
    </AbsoluteFill>
  );
};

export const SymPaddingCues: Cue[] = probCues(PADQ, [
  [60, 'whoosh'],
  ...new Array(10).fill(0).map((_, k): Cue => [100 + k * 36, 'tick']),
  [500, 'reveal'],
  ...new Array(5).fill(0).map((_, k): Cue => [760 + k * 32, 'tick']),
  [900, 'reveal'],
]);
