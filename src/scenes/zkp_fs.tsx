import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import {EVE, SpriteG} from '../components/pixel';
import {Cue, Problem, probCues} from '../components/Problem';
import {FONT} from '../theme';
import {fl, Fx, Mark, md, minv, mpow, T} from './sig_lib';

/* ====================================================================== */
/* CASE · weak Fiat–Shamir (Bernhard–Pereira–Warinschi 2012)               */
/* order-11 subgroup of Z_23^*, generator g = 2                           */
/* ====================================================================== */

const p = 23;
const q = 11;
const g = 2;
const GRP = new Array(q).fill(0).map((_, i) => mpow(g, i, p)); // 1,2,4,8,16,9,18,13,3,6,12
/** toy hash into Z_q: H(v) = v² + 5 mod 11 */
const Hq = (v: number) => md(v * v + 5, q);
const S = 10; // attacker's free choice
const RR = 8; // attacker's free choice (any group element; no discrete log needed)
const C = Hq(RR); // 3
const GS = mpow(g, S, p); // 12
const RINV = minv(RR, p); // 3
const BASE = md(GS * RINV, p); // 13
const CINV = minv(C, q); // 4 (exponent inverse mod group order)
const XF = mpow(BASE, CINV, p); // 18
const XC = mpow(XF, C, p); // 13
const RHS = md(RR * XC, p); // 12
const VALID = RHS === GS;

const FSC = {
  card: 420,
  reveal: 720,
  steps: [
    {at: 0, label: '弱 Fiat–Shamir'},
    {at: 150, label: '先选 s 与 R'},
    {at: 270, label: '算出 c'},
    {at: 390, label: '倒推 X'},
    {at: 510, label: '验证通过'},
    {at: 600, label: '正确做法'},
  ],
};

export const ZkFs: React.FC = () => (
  <Problem
    no={8}
    color={T.act}
    tag="零知识证明 · Fiat–Shamir"
    title="Fiat–Shamir 的陷阱"
    q={[
      ['Fiat–Shamir 用哈希代替验证者出挑战。可是，哈希里该放进什么？'],
      ['2012 年，Bernhard、Pereira 与 Warinschi 检查 Helios 投票系统，'],
      ['发现它的证明只哈希了承诺 R——漏掉了要证明的陈述 X。'],
      ['用小群重演：', {t: 'ℤ₂₃* 中的 11 阶子群，g = 2', m: true}, '，验证式 ', {t: 'g^s = R·X^c', m: true}, '。'],
    ]}
    brief="弱 Fiat–Shamir：c = H(R) 漏掉了陈述 X"
    answerText={`陈述 X = ${XF} 的“证明”(R, s) = (${RR}, ${S})`}
    insight="弱 FS 没把陈述放进哈希：攻击者先造证明、后选陈述。必须用 c = H(X, R, m)；2022 年的 Frozen Heart 漏洞在多个证明库里重演了这个错误"
    {...FSC}
  >
    {(sf) => <FsStage sf={sf} />}
  </Problem>
);

const CX = (i: number) => 360 + i * 120;
const CY = 420;

const FsStage: React.FC<{sf: number}> = ({sf}) => {
  const f = sf;
  const strong = f >= 600;
  const hiR = f >= 150;
  const hiX = f >= 450;
  const LY = [516, 588, 660, 732];
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {/* weak vs strong */}
        {fl(f, 0) && (
          <g>
            <rect x={120} y={258} width={780} height={78} fill={T.paper} stroke={T.red} strokeWidth={6} />
            <Txt x={150} y={298} size={36} anchor="start" color={T.ink}>
              弱：
            </Txt>
            <Txt x={240} y={298} size={36} anchor="start" color={T.ink} family={FONT.pixelMono}>
              c = H(R)
            </Txt>
            <Txt x={870} y={298} size={24} anchor="end" color={T.red}>
              陈述 X 不在哈希里
            </Txt>
          </g>
        )}
        {fl(f, 30) && (
          <g>
            <rect x={1020} y={258} width={780} height={78} fill={strong ? T.inv : T.paper} stroke={strong ? T.inv : T.line} strokeWidth={3} />
            <Txt x={1050} y={298} size={36} anchor="start" color={strong ? T.invText : T.dim}>
              强：
            </Txt>
            <Txt x={1140} y={298} size={36} anchor="start" color={strong ? T.invText : T.dim} family={FONT.pixelMono}>
              c = H(X, R, m)
            </Txt>
          </g>
        )}
        {/* the group */}
        {fl(f, 60) && (
          <g>
            <Fx x={312} y={CY} size={36} anchor="end" parts={['⟨g⟩ =']} />
            {GRP.map((v, i) => {
              const isR = hiR && v === RR;
              const isX = hiX && v === XF;
              const inv = isR || isX;
              return (
                <g key={i}>
                  <rect x={CX(i) - 42} y={CY - 30} width={84} height={60} fill={inv ? (isX ? T.red : T.inv) : T.paper} stroke={isX ? T.red : T.ink} strokeWidth={3} />
                  <Txt x={CX(i)} y={CY + 2} size={36} color={inv ? T.invText : T.ink} family={FONT.pixelMono}>
                    {v}
                  </Txt>
                  {inv && (
                    <Txt x={CX(i)} y={CY + 54} size={24} color={isX ? T.red : T.ink} family={FONT.pixelMono}>
                      {isX ? 'X' : 'R'}
                    </Txt>
                  )}
                </g>
              );
            })}
          </g>
        )}
        {/* attacker */}
        {fl(f, 150) && <SpriteG map={EVE} x={120} y={510} s={12} />}
        <Fx x={312} y={LY[0]} size={48} anchor="start" parts={[`s = ${S}，R = ${RR}`]} show={fl(f, 150)} />
        {fl(f, 186) && (
          <Txt x={984} y={LY[0]} size={24} anchor="start" color={T.sub}>
            随手挑，不需要知道 log R
          </Txt>
        )}
        <Fx x={312} y={LY[1]} size={48} anchor="start" parts={[`c = H(${RR}) = ${RR}² + 5 ≡ ${C}`]} show={fl(f, 270)} />
        {fl(f, 300) && (
          <Txt x={1176} y={LY[1]} size={24} anchor="start" color={T.sub}>
            玩具哈希 H(v) = v² + 5 mod 11
          </Txt>
        )}
        <Fx
          x={312}
          y={LY[2]}
          size={48}
          anchor="start"
          parts={['X = (g', '^s', ' · R', '^−1', ')', '^1/c', ` = (${GS}·${RINV})`, `^${CINV}`, ` ≡ ${XF}`]}
          show={fl(f, 390)}
        />
        {fl(f, 420) && (
          <Txt x={1236} y={LY[2]} size={24} anchor="start" color={T.sub}>
            {`指数 mod ${q}：1/${C} ≡ ${CINV}`}
          </Txt>
        )}
        {fl(f, 510) && (
          <g>
            <Fx x={312} y={LY[3]} size={48} anchor="start" parts={['g', `^${S}`, ` = ${GS}，R·X`, `^${C}`, ` = ${RR}·${XC} ≡ ${RHS}`]} />
            <Mark x={1080} y={LY[3]} ok={VALID} show={fl(f, 534)} s={6} />
          </g>
        )}
        {/* lesson: strong FS */}
        {fl(f, 600) && (
          <g>
            <Txt x={120} y={840} size={36} anchor="start" color={T.ink}>
              强 FS：X 也进哈希
            </Txt>
            <Txt x={120} y={900} size={24} anchor="start" color={T.sub}>
              改 X 就改了 c，倒推不再成立
            </Txt>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};


export const ZkFsCues: Cue[] = probCues(FSC, [
  [60, 'tick'],
  [150, 'blip', 67],
  [270, 'type'],
  [390, 'type'],
  [450, 'error'],
  [534, 'bell', 76],
  [600, 'chime'],
]);
