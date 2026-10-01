import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, BOB, SAGE, SpriteG} from '../components/pixel';
import {Txt} from '../components/kit';
import {Cue, Problem, probCues} from '../components/Problem';
import {COL, FONT} from '../theme';
import {minv, mod, on, Tag} from './zk_util';

const INK = COL.text;
const M = FONT.pixelMono;

/* ---------- F_13, f(x) = s + a x ---------- */
const PR = 13;
const S1: [number, number] = [1, 11];
const S2: [number, number] = [3, 6];
const INV2 = minv(S2[0] - S1[0], PR); // 2^-1 = 7
const SLOPE = mod((S2[1] - S1[1]) * INV2, PR); // 4
const SEC = mod(S1[1] - SLOPE * S1[0], PR); // 7
const fx = (x: number) => mod(SEC + SLOPE * x, PR);
const L1 = mod(S2[0] * minv(S2[0] - S1[0], PR), PR); // 8
const L2 = mod(S1[0] * minv(S1[0] - S2[0], PR), PR); // 6
const LAG = mod(S1[1] * L1 + S2[1] * L2, PR); // 7
const RAW = S1[1] * L1 + S2[1] * L2; // 124
// second secret for the secure-sum teaser
const SEC2 = 5;
const SLOPE2 = 2;
const gx = (x: number) => mod(SEC2 + SLOPE2 * x, PR);
const hx = (x: number) => mod(fx(x) + gx(x), PR);
// reconstruct the sum from shares 1 and 3 (computed, not assumed)
const HS = mod(hx(1) - mod((hx(3) - hx(1)) * INV2, PR) * 1, PR);

const SPEC = {
  card: 330,
  reveal: 880,
  steps: [
    {at: 0, label: '一份份额'},
    {at: 220, label: '两点定线'},
    {at: 470, label: '插值 f(0)'},
    {at: 660, label: '份额可相加'},
  ],
};

export const ZkShamir: React.FC = () => (
  <Problem
    no={8}
    color={COL.zk}
    tag="隐私计算 · 秘密共享"
    title="Shamir 秘密共享"
    q={[
      ['1979 年，Shamir 把秘密 ', {t: 's', m: true}, ' 藏进一条直线 ', {t: 'f(x) = s + a·x', m: true}, '，a 随机选取。'],
      ['第 i 个人只拿到一个点 ', {t: '(i, f(i))', m: true}, '：任意两份即可复原，单独一份一无所知。'],
      ['在有限域 ', {t: '𝔽₁₃', m: true}, ' 上，我们手里有两份：', {t: `(${S1[0]}, ${S1[1]})`, m: true}, ' 与 ', {t: `(${S2[0]}, ${S2[1]})`, m: true}, '。'],
    ]}
    brief={`(2, 3) 门限 · 𝔽₁₃ · 份额 (${S1[0]}, ${S1[1]}) 与 (${S2[0]}, ${S2[1]})`}
    answerText={`两份份额插值得 s = f(0) = ${SEC}`}
    insight="≥ t 份可插值恢复，< t 份对秘密毫无信息（信息论安全）；份额可相加 → MPC"
    {...SPEC}
  >
    {(sf) => <Stage sf={sf} />}
  </Problem>
);

/* ---------- plot ---------- */
const OX = 150;
const OY = 870;
const STEPX = 42;
const px = (x: number) => OX + x * STEPX;
const py = (y: number) => OY - y * STEPX;

const Pt: React.FC<{x: number; y: number; big?: boolean; hollow?: boolean; red?: boolean}> = ({x, y, big, hollow, red}) => {
  const s = big ? 24 : 12;
  return hollow ? (
    <rect x={px(x) - s / 2} y={py(y) - s / 2} width={s} height={s} fill={COL.panel} stroke={INK} strokeWidth={3} />
  ) : (
    <rect x={px(x) - s / 2} y={py(y) - s / 2} width={s} height={s} fill={red ? COL.red : INK} />
  );
};

const Plot: React.FC<{sf: number}> = ({sf}) => {
  const ph = sf < 220 ? 0 : sf < 470 ? 1 : sf < 660 ? 2 : 3;
  const nFan = Math.max(0, Math.min(PR, Math.floor((sf - 40) / 6) + 1));
  const nLine = Math.max(0, Math.min(PR, Math.floor((sf - 280) / 9) + 1));
  return (
    <g>
      {/* grid */}
      {new Array(PR * PR).fill(0).map((_, k) => (
        <rect key={k} x={px(k % PR) - 3} y={py(Math.floor(k / PR)) - 3} width={6} height={6} fill={COL.line} />
      ))}
      <rect x={OX - 1} y={py(12) - 24} width={3} height={OY - py(12) + 24} fill={INK} />
      <rect x={OX} y={OY - 1} width={STEPX * 12 + 24} height={3} fill={INK} />
      <Txt x={OX + STEPX * 12 + 48} y={OY} size={24} family={M} color={COL.sub}>
        x
      </Txt>
      <Txt x={OX} y={py(12) - 48} size={24} family={M} color={COL.sub}>
        y
      </Txt>
      {[0, 1, 2, 3, 12].map((x) => (
        <Txt key={x} x={px(x)} y={OY + 30} size={24} family={M} color={COL.dim}>
          {x}
        </Txt>
      ))}
      <Txt x={OX - 6} y={312} size={36} anchor="start">
        {ph === 0 ? '只看一份：过它的直线有 13 条' : ph === 1 ? '𝔽₁₃ 里的“直线” = 13 个点' : ph === 2 ? '直线与 y 轴的交点就是秘密' : 'f(x) = 7 + 4x'}
      </Txt>

      {/* phase 0: fan of candidate lines through share 1 */}
      {ph === 0 &&
        new Array(nFan).fill(0).map((_, s) => (
          <g key={s}>
            <line x1={px(0)} y1={py(s)} x2={px(S1[0])} y2={py(S1[1])} stroke={COL.dim} strokeWidth={3} />
            <rect x={px(0) - 6} y={py(s) - 6} width={12} height={12} fill={COL.dim} />
          </g>
        ))}

      {/* phase 1+: the line over F_13 */}
      {ph >= 1 && new Array(nLine).fill(0).map((_, x) => <Pt key={x} x={x} y={fx(x)} />)}

      {/* shares */}
      {on(sf, 12) && (
        <g>
          <Pt x={S1[0]} y={S1[1]} big />
          <Txt x={px(S1[0]) + 24} y={py(S1[1]) - 30} size={24} anchor="start" family={M}>
            {`(${S1[0]}, ${S1[1]})`}
          </Txt>
        </g>
      )}
      {on(sf, 230) && (
        <g>
          <Pt x={S2[0]} y={S2[1]} big />
          <Txt x={px(S2[0]) + 24} y={py(S2[1]) + 30} size={24} anchor="start" family={M}>
            {`(${S2[0]}, ${S2[1]})`}
          </Txt>
        </g>
      )}
      {ph >= 2 && on(sf, 560) && (
        <g>
          <rect x={px(2) - 15} y={py(fx(2)) - 15} width={30} height={30} fill="none" stroke={INK} strokeWidth={3} />
          <Txt x={px(2) - 12} y={py(fx(2)) - 42} size={24} anchor="start" family={M} color={COL.sub}>
            {`第三份 (2, ${fx(2)})`}
          </Txt>
        </g>
      )}
      {ph >= 2 && on(sf, 480) && (
        <g>
          <rect x={px(0) - 18} y={py(SEC) - 18} width={36} height={36} fill={INK} />
          <Tag x={px(0) + 36} y={py(SEC) - 30} w={144} h={60} text={`s = ${SEC}`} family={M} inv />
        </g>
      )}
    </g>
  );
};

/* ---------- right-hand derivations ---------- */
const RX = 816;

const Lines: React.FC<{sf: number; at: number; rows: {t: string; size?: number; mono?: boolean; inv?: boolean; dy: number}[]}> = ({sf, at, rows}) => (
  <g>
    {rows.map((r, i) =>
      on(sf, at + i * 24) ? (
        r.inv ? (
          <Tag key={i} x={RX} y={r.dy - 42} w={720} h={84} text={r.t} size={r.size ?? 48} family={r.mono ? M : FONT.pixel} inv />
        ) : (
          <Txt key={i} x={RX} y={r.dy} size={r.size ?? 48} anchor="start" family={r.mono ? M : FONT.pixel} color={r.size === 36 && !r.mono ? COL.sub : INK}>
            {r.t}
          </Txt>
        )
      ) : null,
    )}
  </g>
);

const OneShare: React.FC<{sf: number}> = ({sf}) => (
  <g>
    {on(sf, 20) && (
      <Txt x={RX} y={312} size={48} anchor="start" family={M}>
        {`f(1) = s + a = ${S1[1]}`}
      </Txt>
    )}
    {['s', 'a'].map((lbl, row) =>
      on(sf, 40 + row * 30) ? (
        <g key={lbl}>
          <Txt x={RX} y={432 + row * 84} size={36} anchor="start" family={M}>
            {lbl}
          </Txt>
          {new Array(PR).fill(0).map((_, s) => (
            <Tag key={s} x={RX + 54 + s * 72} y={402 + row * 84} w={66} h={60} text={row === 0 ? s : mod(S1[1] - s, PR)} family={M} inv={row === 1 && sf >= 40 + 6 * s + 30} />
          ))}
        </g>
      ) : null,
    )}
    {on(sf, 130) && (
      <Txt x={RX} y={636} size={36} anchor="start" color={COL.sub}>
        每个 s 都恰好配一个 a，13 种可能同样合理
      </Txt>
    )}
    {on(sf, 160) && <Tag x={RX} y={690} w={720} h={84} text="一份份额：对秘密毫无信息" size={36} inv />}
  </g>
);

const Mpc: React.FC<{sf: number}> = ({sf}) => {
  const s = sf - 660;
  const cx = (i: number) => RX + 204 + i * 252;
  return (
    <g>
      {on(s, 0) && (
        <Txt x={RX} y={300} size={48} anchor="start">
          份额相加 → 安全求和
        </Txt>
      )}
      {[ALICE, BOB, SAGE].map((mp, i) => (s >= 12 + i * 6 ? <SpriteG key={i} map={mp} x={cx(i) - 30} y={336} s={6} accent={i === 1 ? COL.dim : INK} /> : null))}
      {[
        {lbl: `f(i)`, v: fx, note: `秘密 ${SEC}`},
        {lbl: `g(i)`, v: gx, note: `秘密 ${SEC2}`},
        {lbl: `和`, v: hx, note: ''},
      ].map((r, j) =>
        on(s, 36 + j * 24) ? (
          <g key={j}>
            <Txt x={RX} y={498 + j * 84} size={36} anchor="start" family={M} color={j === 2 ? INK : COL.sub}>
              {r.lbl}
            </Txt>
            {[1, 2, 3].map((i) => (
              <Tag key={i} x={cx(i - 1) - 60} y={468 + j * 84} w={120} h={60} text={r.v(i)} family={M} inv={j === 2} />
            ))}
          </g>
        ) : null,
      )}
      {on(s, 120) && (
        <Txt x={RX} y={738} size={36} anchor="start" family={M}>
          {`插值 → ${HS} = ${SEC} + ${SEC2}，各自的秘密仍不可见`}
        </Txt>
      )}
    </g>
  );
};

const Stage: React.FC<{sf: number}> = ({sf}) => (
  <AbsoluteFill>
    <svg width={1920} height={1080} shapeRendering="crispEdges">
      <Plot sf={sf} />
      {sf < 220 && <OneShare sf={sf} />}
      {sf >= 220 && sf < 470 && (
        <Lines
          sf={sf}
          at={240}
          rows={[
            {t: '两点确定一条直线', dy: 312},
            {t: `a = (${S2[1]} − ${S1[1]})/(${S2[0]} − ${S1[0]})`, mono: true, dy: 408},
            {t: `= ${S2[1] - S1[1]} · 2⁻¹ = ${S2[1] - S1[1]} · ${INV2}`, mono: true, dy: 492},
            {t: `≡ ${SLOPE} (mod ${PR})`, mono: true, dy: 576},
            {t: `s = ${S1[1]} − ${SLOPE} = ${SEC}`, mono: true, inv: true, dy: 690},
          ]}
        />
      )}
      {sf >= 470 && sf < 660 && (
        <Lines
          sf={sf}
          at={480}
          rows={[
            {t: '拉格朗日插值', dy: 312},
            {t: 's = y₁·λ₁ + y₂·λ₂', mono: true, dy: 408},
            {t: `λ₁ = x₂/(x₂ − x₁) = 3·2⁻¹ ≡ ${L1}`, mono: true, size: 36, dy: 492},
            {t: `λ₂ = x₁/(x₁ − x₂) = (−2)⁻¹ ≡ ${L2}`, mono: true, size: 36, dy: 564},
            {t: `s = ${S1[1]}·${L1} + ${S2[1]}·${L2} = ${RAW} ≡ ${LAG}`, mono: true, inv: true, dy: 690},
          ]}
        />
      )}
      {sf >= 660 && <Mpc sf={sf} />}
    </svg>
  </AbsoluteFill>
);

export const ZkShamirCues: Cue[] = probCues(SPEC, [
  [12, 'blip', 72],
  ...new Array(PR).fill(0).map((_, s): Cue => [40 + s * 6, 'tick']),
  [230, 'blip', 76],
  ...new Array(PR).fill(0).map((_, x): Cue => [280 + x * 9, 'blip', 60 + x * 2]),
  [336, 'chime'],
  [480, 'bell', 79],
  [576, 'chime'],
  [780, 'bell', 84],
]);
