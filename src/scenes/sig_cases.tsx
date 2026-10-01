import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import {ALICE, BOB, EVE, KEY, LOCK_OPEN, SpriteG} from '../components/pixel';
import {Cue, Problem, probCues} from '../components/Problem';
import {Arrow} from '../components/ui';
import {FONT, snap} from '../theme';
import {euclid, fl, Fx, hx, Mark, md, minv, Pill, sp, T} from './sig_lib';

/* ====================================================================== */
/* CASE 06 · Lamport key used twice                                       */
/* ====================================================================== */

const LXv = (i: number, b: number) => hx(`lamport-sk-${i}-${b}`, 4);
const M1 = [0, 1, 0, 1];
const M2 = [0, 1, 1, 0];
const FORGE = [0, 1, 1, 1];
/** which preimages leaked after both signatures */
const leaked = (i: number, b: number) => M1[i] === b || M2[i] === b;
/** forgeable messages: every bit pattern whose bits all leaked */
const ALL4 = new Array(16).fill(0).map((_, v) => [3, 2, 1, 0].map((s) => (v >> s) & 1));
const FORGEABLE = ALL4.filter((m) => m.every((b, i) => leaked(i, b)));
const str = (m: number[]) => m.join('');

const L2 = {
  card: 420,
  reveal: 780,
  steps: [
    {at: 0, label: '第一次签名'},
    {at: 150, label: '第二次签名'},
    {at: 330, label: '盘点泄露'},
    {at: 480, label: '可伪造集合'},
    {at: 630, label: 'Eve 伪造'},
  ],
};

export const SigLamport2: React.FC = () => (
  <Problem
    no={6}
    color={T.act}
    tag="数字签名 · 一次签名"
    title="一次签名用了两次"
    q={[
      ['Lamport 签名的一把密钥，本该只签一条消息。'],
      ['可 Alice 图省事，用同一把密钥先后签了 ', {t: '0101', m: true}, ' 和 ', {t: '0110', m: true}, '。'],
      ['每次签名都公开一半原像——两次合在一起，泄露了什么？'],
      ['Eve 收下了这两份签名，开始拼凑新的签名……'],
    ]}
    brief="同一把 Lamport 密钥签了 0101 与 0110"
    answerText={`可伪造 ${FORGEABLE.filter((m) => str(m) !== str(M1) && str(m) !== str(M2))
      .map(str)
      .join(' 与 ')}`}
    insight="两次签名在不同的位上各泄露一份原像：可伪造 01** 中的新消息 0100、0111"
    {...L2}
  >
    {(sf) => <Lamport2Stage sf={sf} />}
  </Problem>
);

const GX = (i: number) => 840 + i * 216;
const GW = 168;
const GH = 60;
const GROW = [348, 432];
const S1 = (i: number) => 30 + i * 24;
const S2 = (i: number) => 180 + i * 24;

const Lamport2Stage: React.FC<{sf: number}> = ({sf}) => {
  const f = sf;
  const forging = f >= 630;
  const sent = sp(f, 690, 30);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {/* left: the two signed messages */}
        {[M1, M2].map((m, r) =>
          fl(f, r === 0 ? 6 : 150) ? (
            <g key={r}>
              <Txt x={120} y={GROW[r]} size={36} anchor="start" color={T.ink}>
                {`第 ${r + 1} 次`}
              </Txt>
              {m.map((b, i) => {
                const on = f >= (r === 0 ? S1(i) : S2(i));
                return (
                  <g key={i}>
                    <rect x={306 + i * 66} y={GROW[r] - 27} width={54} height={54} fill={on ? T.inv : T.paper} stroke={T.ink} strokeWidth={3} />
                    <Txt x={333 + i * 66} y={GROW[r] + 2} size={36} color={on ? T.invText : T.ink} family={FONT.pixelMono}>
                      {b}
                    </Txt>
                  </g>
                );
              })}
            </g>
          ) : null,
        )}
        {/* grid header */}
        {[0, 1, 2, 3].map((i) => (
          <Txt key={i} x={GX(i)} y={282} size={24} color={T.dim} family={FONT.pixelMono}>
            {`位 ${i + 1}`}
          </Txt>
        ))}
        <Txt x={732} y={GROW[0]} size={24} color={T.dim} family={FONT.pixelMono}>
          0
        </Txt>
        <Txt x={732} y={GROW[1]} size={24} color={T.dim} family={FONT.pixelMono}>
          1
        </Txt>
        {/* grid cells */}
        {[0, 1, 2, 3].map((i) =>
          [0, 1].map((b) => {
            const by1 = M1[i] === b && f >= S1(i);
            const by2 = M2[i] === b && f >= S2(i);
            const known = by1 || by2;
            const used = forging && FORGE[i] === b;
            const X = snap(GX(i) - GW / 2);
            const Y = snap(GROW[b] - GH / 2);
            return (
              <g key={`${i}${b}`}>
                <rect x={X} y={Y} width={GW} height={GH} fill={known ? T.inv : T.paper} stroke={used ? T.red : known ? T.ink : T.dim} strokeWidth={used ? 6 : 3} strokeDasharray={known ? undefined : '9 6'} />
                <Txt x={GX(i)} y={GROW[b] + 2} size={36} color={known ? T.invText : T.dim} family={FONT.pixelMono}>
                  {known ? LXv(i, b) : '????'}
                </Txt>
              </g>
            );
          }),
        )}
        {/* knowledge per position */}
        {f >= 330 &&
          [0, 1, 2, 3].map((i) => {
            const both = leaked(i, 0) && leaked(i, 1);
            return fl(f, 330 + i * 18) ? (
              <Txt key={i} x={GX(i)} y={516} size={24} color={both ? T.ink : T.sub}>
                {both ? '0 或 1 都行' : `只能是 ${leaked(i, 0) ? 0 : 1}`}
              </Txt>
            ) : null;
          })}
        {fl(f, 420) && (
          <g>
            <Txt x={696} y={594} size={36} anchor="end" color={T.ink}>
              可签的模式
            </Txt>
            {[0, 1, 2, 3].map((i) => {
              const both = leaked(i, 0) && leaked(i, 1);
              return (
                <Txt key={i} x={GX(i)} y={594} size={48} color={T.ink} family={FONT.pixelMono}>
                  {both ? '*' : String(leaked(i, 0) ? 0 : 1)}
                </Txt>
              );
            })}
          </g>
        )}
        {/* forgeable set */}
        {fl(f, 480) && (
          <Txt x={696} y={684} size={36} anchor="end" color={T.ink}>
            可伪造
          </Txt>
        )}
        {FORGEABLE.map((m, j) => {
          const old = str(m) === str(M1) || str(m) === str(M2);
          const target = str(m) === str(FORGE);
          return (
            <Pill
              key={j}
              x={GX(j)}
              y={684}
              w={GW}
              h={GH}
              size={36}
              text={str(m)}
              mode={old ? 'ghost' : forging && target ? 'red' : 'inv'}
              show={fl(f, 480 + j * 18)}
            />
          );
        })}
        {fl(f, 560) && (
          <Txt x={(GX(0) + GX(3)) / 2} y={750} size={24} color={T.sub}>
            虚线 = 已签过；实心 = 从未签过的新消息
          </Txt>
        )}
        {/* Eve forges 0111, Bob accepts */}
        {forging && (
          <g>
            <SpriteG map={EVE} x={120} y={786} s={6} />
            <SpriteG map={BOB} x={480} y={786} s={6} accent={T.sub} />
            <Txt x={150} y={900} size={24} color={T.red}>
              Eve
            </Txt>
            <Txt x={510} y={900} size={24} color={T.sub}>
              Bob
            </Txt>
            <Arrow pts={[[204, 828], [462, 828]]} t={sent} color={T.red} w={3} head={12} glow={false} />
            {sent > 0 && sent < 1 && <Pill x={snap(240 + (420 - 240) * sent)} y={786} w={72} size={24} text="σ*" mode="red" />}
            {fl(f, 732) && (
              <g>
                <Txt x={120} y={720} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
                  Vfy(pk, 0111, σ*) = 1
                </Txt>
                <Mark x={540} y={720} ok show s={4} />
              </g>
            )}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const SigLamport2Cues: Cue[] = probCues(L2, [
  ...[0, 1, 2, 3].map((i): Cue => [S1(i), 'blip', 70 + i * 2]),
  ...[0, 1, 2, 3].map((i): Cue => [S2(i), 'blip', 74 + i * 2]),
  [420, 'chime'],
  ...[0, 1, 2, 3].map((j): Cue => [480 + j * 18, 'tick']),
  [690, 'whoosh'],
  [732, 'error'],
]);

/* ====================================================================== */
/* CASE 07 · nonce reuse                                                  */
/* ====================================================================== */

const Q = 101;
const X = 37;
const K = 58;
const C1 = 12;
const C2 = 77;
const S1v = md(K + C1 * X, Q); // 98
const S2v = md(K + C2 * X, Q); // 79
const DS = md(S1v - S2v, Q); // 19
const DCraw = C1 - C2; // -65
const DCs = String(DCraw).replace('-', '−');
const DC = md(DCraw, Q); // 36
const INV = minv(DC, Q); // 87
const XR = md(DS * INV, Q); // 37
const KR = md(S1v - C1 * XR, Q); // 58
const EU = euclid(Q, DC); // 101 = 2·36 + 29, 36 = 1·29 + 7, 29 = 4·7 + 1, 7 = 7·1 + 0
/** back-substitution coefficient: 1 = a·101 + b·36 */
const bez = (() => {
  // extended Euclid
  let [r0, r1, s0, s1, t0, t1] = [Q, DC, 1, 0, 0, 1];
  while (r1 !== 0) {
    const q = Math.floor(r0 / r1);
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
    [t0, t1] = [t1, t0 - q * t1];
  }
  return {a: s0, b: t0};
})();

const NC = {
  card: 420,
  reveal: 900,
  steps: [
    {at: 0, label: '同一个 R'},
    {at: 240, label: '两式相减'},
    {at: 420, label: '求逆元'},
    {at: 600, label: '解出 x'},
    {at: 750, label: '再求 k'},
  ],
};

export const SigNonce: React.FC = () => (
  <Problem
    no={7}
    color={T.act}
    tag="数字签名 · 实现攻击"
    title="复用的随机数"
    q={[
      ['Schnorr 与 ECDSA 签名，每次都要一个全新的随机数 k。'],
      ['2010 年，fail0verflow 发现 PS3 的固件签名每次都用同一个 k。'],
      ['用小数字重演：模 ', {t: `q = ${Q}`, m: true}, '，两份签名 ', {t: `(c₁, s₁) = (${C1}, ${S1v})`, m: true}, '、', {t: `(c₂, s₂) = (${C2}, ${S2v})`, m: true}],
      ['它们共享同一个承诺 R——仅凭公开信息，就能算出私钥 x。'],
    ]}
    brief={`s = k + c·x mod ${Q}，两份签名共用 k`}
    answerText={`x = ${XR}，k = ${KR}`}
    insight="复用 nonce = 同一承诺下的两段对话 = Σ 协议 special soundness 的提取器；2010 年索尼 PS3 的 ECDSA 私钥就这样泄露"
    {...NC}
  >
    {(sf) => <NonceStage sf={sf} />}
  </Problem>
);

const NonceStage: React.FC<{sf: number}> = ({sf}) => {
  const f = sf;
  const DX = 1032;
  const LY = [288, 360, 456, 528, 600, 672];
  const merge = sp(f, 240, 30);
  const ws = f >= 420 && f < 600 ? 'euclid' : f >= 600 ? 'key' : f >= 240 ? 'sub' : 'none';
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {/* shared commitment */}
        {fl(f, 0) && (
          <g>
            <SpriteG map={ALICE} x={132} y={264} s={6} accent={T.sub} />
            <rect x={120} y={366} width={192} height={72} fill={T.inv} />
            <Fx x={216} y={404} parts={['R = g', '^k']} color={T.invText} />
            <Txt x={216} y={474} size={24} color={T.sub}>
              两次都一样
            </Txt>
          </g>
        )}
        {/* two transcripts */}
        {[0, 1].map((j) => {
          const y = j === 0 ? 324 : 492;
          const c = j === 0 ? C1 : C2;
          const s = j === 0 ? S1v : S2v;
          return fl(f, 24 + j * 30) ? (
            <g key={j}>
                            <path d={`M312,402 L360,402 L360,${y} L402,${y}`} fill="none" stroke={T.ink} strokeWidth={3} />
              <rect x={402} y={y - 36} width={474} height={72} fill={T.paper} stroke={T.ink} strokeWidth={3} />
              <Txt x={639} y={y + 2} size={36} color={T.ink} family={FONT.pixelMono}>
                {`c${j ? '₂' : '₁'} = ${c}，s${j ? '₂' : '₁'} = ${s}`}
              </Txt>
            </g>
          ) : null;
        })}
        {/* merge arrows into the derivation */}
        {f >= 240 && (
          <g>
            <Arrow pts={[[876, 324], [942, 324], [942, LY[2]], [DX - 18, LY[2]]]} t={merge} color={T.ink} w={3} head={12} glow={false} />
            <Arrow pts={[[876, 492], [942, 492], [942, LY[2]], [DX - 18, LY[2]]]} t={merge} color={T.ink} w={3} head={12} glow={false} />
          </g>
        )}
        {/* derivation (all mod q) */}
        {fl(f, 60) && (
          <Txt x={1824} y={252} size={24} anchor="end" color={T.dim} family={FONT.pixelMono}>
            {`全部 mod ${Q}`}
          </Txt>
        )}
        <Fx x={DX} y={LY[0]} anchor="start" size={48} parts={[`${S1v} ≡ k + ${C1}·x`]} show={fl(f, 60)} />
        <Fx x={DX} y={LY[1]} anchor="start" size={48} parts={[`${S2v} ≡ k + ${C2}·x`]} show={fl(f, 96)} />
        {fl(f, 240) && <rect x={DX} y={408} width={744} height={3} fill={T.ink} />}
        <Fx x={DX} y={LY[2]} anchor="start" size={48} parts={[`${DS} ≡ ${DCs}·x ≡ ${DC}·x`]} show={fl(f, 270)} />
        <Fx x={DX} y={LY[3]} anchor="start" size={48} parts={[`${DC}`, '^−1', ` ≡ ${INV}`]} show={fl(f, 540)} />
        {fl(f, 600) && <rect x={DX - 12} y={LY[4] - 30} width={552} height={60} fill={T.inv} />}
        <Fx x={DX} y={LY[4]} anchor="start" size={48} color={T.invText} parts={[`x ≡ ${DS}·${INV} ≡ ${XR}`]} show={fl(f, 600)} />
        <Fx x={DX} y={LY[5]} anchor="start" size={48} parts={[`k ≡ ${S1v} − ${C1}·${XR} ≡ ${KR}`]} show={fl(f, 750)} />
        {/* left workspace */}
        {ws === 'sub' && fl(f, 270) && (
          <g>
            <Txt x={120} y={600} size={36} anchor="start" color={T.ink}>
              两式相减，k 被消掉
            </Txt>
            <Txt x={120} y={660} size={24} anchor="start" color={T.sub} family={FONT.pixelMono}>
              {`${DCs} + ${Q} = ${DC}`}
            </Txt>
          </g>
        )}
        {ws === 'euclid' && (
          <g>
            <Txt x={120} y={576} size={24} anchor="start" color={T.sub}>
              {`扩展欧几里得：求 ${DC} 模 ${Q} 的逆`}
            </Txt>
            {EU.slice(0, 3).map((e, j) =>
              fl(f, 432 + j * 24) ? (
                <Txt key={j} x={120} y={636 + j * 54} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
                  {`${e.a} = ${e.q}·${e.b} + ${e.r}`}
                </Txt>
              ) : null,
            )}
            {fl(f, 516) && (
              <Txt x={120} y={816} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
                {`1 = ${bez.a}·${Q} − ${-bez.b}·${DC}`}
              </Txt>
            )}
          </g>
        )}
        {ws === 'key' && (
          <g>
            <SpriteG map={KEY} x={120} y={600} s={12} />
            <SpriteG map={LOCK_OPEN} x={300} y={570} s={12} />
            <Txt x={480} y={624} size={48} anchor="start" color={T.ink}>
              私钥到手
            </Txt>
            {fl(f, 780) && (
              <g>
                <Txt x={120} y={756} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
                  {`检验：${KR} + ${C2}·${XR} ≡ ${md(KR + C2 * XR, Q)}`}
                </Txt>
                <Mark x={612} y={756} ok show={fl(f, 798)} s={4} />
              </g>
            )}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const SigNonceCues: Cue[] = probCues(NC, [
  [24, 'blip', 70],
  [54, 'blip', 74],
  [60, 'type'],
  [96, 'type'],
  [240, 'whoosh'],
  [270, 'chime'],
  [432, 'tick'],
  [456, 'tick'],
  [480, 'tick'],
  [540, 'chime'],
  [600, 'bell', 72],
  [750, 'chime'],
  [798, 'bell', 79],
]);
