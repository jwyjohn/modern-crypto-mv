import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ActTitle} from '../components/ActTitle';
import {Txt} from '../components/kit';
import {ALICE, BOB} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {COL, FONT} from '../theme';
import {Bar, BarRow, Box, fl, Line, ramp, Say, Stage, T, Wire} from './lib';

export const DsTitle: React.FC = () => (
  <ActTitle
    num="05"
    zh="猜"
    en="SPECULATE WITH DSPARK"
    color={COL.ink}
    topics={['draft 与 verify', 'τ 和 R', 'DSpark drafter', '一轮的账单', 'roofline', '混沌']}
    quote="读一遍权重的钱已经付了，不如一次多验证几个"
    by="decode 物理上限的一条缝"
  />
);

/* ---------- V.1 the idea ---------- */
const DRAFT = ['我们', '去', '公园', '散步'];
const TRUTH = ['我们', '去', '海边', '吧'];
const I0 = 30;
const I1 = 220;
const I2 = 400;
const I3 = 620;
const I4 = 840;

export const DsIdeaCues: Cue[] = [
  [I0, 'step'],
  [I1, 'step'],
  [I2, 'chime'],
  [I3, 'bell'],
  [I4, 'reveal'],
];

const R_M: [string, number][] = [
  ['M=1', 3.73],
  ['M≈2', 3.84],
  ['M≈4', 4.06],
  ['M≈7', 4.91],
];

export const DsIdea: React.FC = () => {
  const f = useF();
  const checked = f < I1 ? 0 : Math.min(4, Math.floor((f - I1) / 36) + 1);
  return (
    <AbsoluteFill>
      <Stage>
        {f >= I0 && <Say who={ALICE} x={96} y={174} text={'我猜接下来是这四个！\n（小模型，很快）'} f={f} at={I0} w={360} s={5} />}
        {f >= I0 &&
          DRAFT.map((w, i) => (
            <Box key={i} x={624 + i * 180} y={186} w={168} h={66} label={w} size={36} inv={checked > i && DRAFT[i] === TRUTH[i]} red={checked > i && DRAFT[i] !== TRUTH[i]} dark={checked <= i} />
          ))}
        {f >= I1 && <Say who={BOB} x={96} y={276} text={'一起算，逐个对答案。\n（完整模型）'} f={f} at={I1} w={360} s={5} />}
        {f >= I1 &&
          TRUTH.map((w, i) =>
            checked > i ? (
              <g key={i}>
                <Box x={624 + i * 180} y={288} w={168} h={66} label={w} size={36} dark={i === 3} />
                <Txt x={708 + i * 180} y={270} size={24} color={DRAFT[i] === TRUTH[i] ? T.ink : T.red}>
                  {DRAFT[i] === TRUTH[i] ? '✓' : '✗'}
                </Txt>
              </g>
            ) : null,
          )}
        {fl(f, I2) && (
          <g>
            <Txt x={624} y={402} size={24} anchor="start">
              第一个对不上的位置，模型自己的答案也能用
            </Txt>
            <Box x={624} y={426} w={168} h={60} label="我们" inv />
            <Box x={804} y={426} w={168} h={60} label="去" inv />
            <Box x={984} y={426} w={168} h={60} label="海边" inv />
            <Txt x={1176} y={456} size={24} anchor="start" color={T.sub}>
              一轮提交 3 个 token
            </Txt>
          </g>
        )}
        {fl(f, I3) && (
          <g>
            <Txt x={96} y={540} size={24} anchor="start" color={T.dim}>
              为什么不亏：一次验证 M 个 token，权重只读一遍（8k，每轮 ms）
            </Txt>
            {R_M.map(([n, r], i) => (
              <BarRow key={n} x={96} y={564 + i * 42} name={n} nameW={120} frac={r / 5.3} max={720} value={r.toFixed(2)} h={30} t={ramp(f, I3 + i * 18, 24)} />
            ))}
          </g>
        )}
        {fl(f, I4) && (
          <g>
            <Box x={1032} y={558} w={792} h={108} inv label="tok/s = τ / R" mono size={48} />
            <Txt x={1032} y={702} size={24} anchor="start">
              τ：每轮提交几个 token · R：每轮多少时间
            </Txt>
            <Txt x={1032} y={744} size={24} anchor="start" color={T.sub}>
              M = 4 只比 M = 1 贵 9%，猜对一半就赚了
            </Txt>
          </g>
        )}
      </Stage>
      <Caption title="draft 与 verify" en="SPECULATIVE DECODING" color={T.ink} desc="理论上结果和一个一个算相同，只是更快。上限被抬高了 τ 倍" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- V.2 the drafter ---------- */
const P = [30, 170, 330, 510, 690, 840];

export const DsDrafterCues: Cue[] = [
  [P[0], 'blip'],
  [P[1], 'step'],
  [P[2], 'step'],
  [P[3], 'bell'],
  [P[4], 'chime'],
  [P[5], 'reveal'],
];

const TAPS = [2, 6, 12, 18, 23];

export const DsDrafter: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        {/* target */}
        {fl(f, P[0]) && (
          <g>
            <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
              verify 模型的 24 层
            </Txt>
            {new Array(24).fill(0).map((_, i) => (
              <rect key={i} x={96 + i * 27} y={210} width={21} height={48} fill={TAPS.includes(i) ? T.ink : T.paper2} stroke={T.ink} strokeWidth={TAPS.includes(i) ? 0 : 3} />
            ))}
            {TAPS.map((t) => (
              <rect key={t} x={96 + t * 27 + 9} y={258} width={3} height={36} fill={T.ink} />
            ))}
            <Txt x={768} y={234} size={24} anchor="start" color={T.sub}>
              从第 2、6、12、18、23 层接出 5 路中间结果（tap）
            </Txt>
          </g>
        )}
        {fl(f, P[1]) && (
          <g>
            <rect x={96} y={294} width={630} height={3} fill={T.ink} />
            <Box x={96} y={309} w={630} h={84} label="RMS → fc（10240 → 2048）→ RMS" sub="每个已提交的 token 压成一个上下文向量" size={24} />
            <Wire x0={726} y0={351} x1={786} y1={351} />
            <Box x={792} y={309} w={510} h={84} inv label="K/V ring · 4096 个位置" sub="drafter 看最近 2048 个" size={24} />
          </g>
        )}
        {fl(f, P[2]) && (
          <g>
            <Txt x={96} y={438} size={24} anchor="start" color={T.dim}>
              3 层注意力，一次预测 9 个位置
            </Txt>
            <Box x={96} y={462} w={108} h={72} label="anchor" inv size={24} />
            {new Array(8).fill(0).map((_, i) => (
              <Box key={i} x={210 + i * 54} y={462} w={48} h={72} label="M" dark size={24} mono />
            ))}
            <Wire x0={648} y0={498} x1={708} y1={498} />
            <Box x={714} y={462} w={300} h={72} label="3 × Attention + FFN" size={24} />
            <Wire x0={1014} y0={498} x1={1074} y1={498} />
          </g>
        )}
        {fl(f, P[3]) && (
          <g>
            <Box x={1080} y={462} w={354} h={72} label="裁剪 LM head" sub="最常用的 16384 个 token" size={24} />
            <Wire x0={1434} y0={498} x1={1488} y1={498} />
            <Box x={1494} y={462} w={330} h={72} label="Markov head" sub="w1(上一 token) · w2" size={24} inv />
            <Txt x={1080} y={570} size={24} anchor="start" color={T.sub}>
              只取 13% 的词表：drafter 的 head 读得少，几乎不占带宽
            </Txt>
            <Txt x={1080} y={606} size={24} anchor="start" color={T.sub}>
              Markov：draft 前一个 token 决定后一个，一步一步串起来
            </Txt>
          </g>
        )}
        {fl(f, P[4]) && (
          <g>
            <Box x={96} y={570} w={900} h={108} label="confidence head：这一步有多大把握？" sub="分数低于 −0.4 就停，不再往后猜" size={36} />
            <Bar x={96} y={702} w={900} h={24} t={1} color={T.line} />
            {[0.92, 0.8, 0.62, 0.38, 0.2].map((v, i) => (
              <rect key={i} x={96 + i * 180} y={702} width={Math.round((v * 168) / 6) * 6} height={24} fill={v >= 0.4 ? T.ink : T.red} />
            ))}
            <Txt x={96} y={756} size={24} anchor="start" color={T.dim}>
              8k 以下最多 7 个 draft，32k 以上最多 3 个：长上下文每多一个 pass 太贵
            </Txt>
          </g>
        )}
        {fl(f, P[5]) && <Box x={1080} y={654} w={744} h={120} inv label="DSpark · 2.6 亿参数 · 只有 3 层" sub="和 verify 共用 embedding 和 head" />}
      </Stage>
      <Caption title="DSpark" en="THE DRAFTER" color={T.ink} desc="它不看文本，它看 verify 模型内部的中间状态，所以又小又准" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- V.3 one round in the kernel ---------- */
const PH: {name: string; ms: number; note: string; inv?: boolean; red?: boolean}[] = [
  {name: 'drafter', ms: 0.39, note: '上下文投影、3 层注意力、head、Markov'},
  {name: 'verify GEMV', ms: 2.24, note: '24 层权重全部读一遍', inv: true},
  {name: '注意力', ms: 0.81, note: '读 K/V，算 softmax'},
  {name: 'norm', ms: 0.38, note: '每层 4 次 RMS'},
  {name: 'barrier', ms: 0.36, note: 'GEMV 后等最慢的 block', red: true},
];
const Y0 = 30;
const Y1 = 330;
const Y2 = 570;
const Y3 = 750;

export const DsRoundCues: Cue[] = [
  [Y0, 'step'],
  [Y1, 'step'],
  [Y2, 'bell'],
  [Y3, 'reveal'],
];

export const DsRound: React.FC = () => {
  const f = useF();
  const total = PH.reduce((a, b) => a + b.ms, 0) + 0.06;
  const scale = 1728 / total;
  let x = 96;
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          8k 上下文，M ≈ 3.8，一轮约 4.2 ms（数字来自分相 trace）
        </Txt>
        {PH.map((p, i) => {
          const w = p.ms * scale;
          const xx = x;
          x += w;
          if (!fl(f, Y0 + i * 40)) return null;
          return (
            <g key={p.name}>
              <rect x={xx} y={210} width={w - 3} height={84} fill={p.inv ? T.inv : p.red ? T.red : T.paper2} stroke={T.ink} strokeWidth={p.inv || p.red ? 0 : 3} />
              {w > 250 ? (
                <Txt x={xx + w / 2} y={252} size={24} color={p.inv ? T.invText : T.ink}>
                  {p.name}
                </Txt>
              ) : null}
              <Txt x={96} y={330 + i * 36} size={24} anchor="start" family={FONT.pixelMono} color={p.red ? T.red : T.ink}>
                {p.ms.toFixed(2)} ms
              </Txt>
              <Txt x={258} y={330 + i * 36} size={24} anchor="start">
                {p.name}
              </Txt>
              <Txt x={510} y={330 + i * 36} size={24} anchor="start" color={T.sub}>
                {p.note}
              </Txt>
            </g>
          );
        })}
        {fl(f, Y1) && (
          <g>
            <Box x={1176} y={312} w={648} h={168} />
            <Txt x={1200} y={348} size={24} anchor="start">
              为什么 draft 必须在 kernel 里
            </Txt>
            <Line x={1200} y={390} text="draft 和 verify 交替 200 多次每秒" f={f} at={Y1 + 12} color={T.sub} />
            <Line x={1200} y={426} text="每次回 CPU 都要付一次 launch 的钱" f={f} at={Y1 + 42} color={T.sub} />
            <Line x={1200} y={462} text="一次 launch 最多跑 32 轮，只把 token 交给 CPU" f={f} at={Y1 + 72} color={T.sub} />
          </g>
        )}
        {fl(f, Y2) && (
          <g>
            <Txt x={96} y={528} size={24} anchor="start" color={T.dim}>
              猜错了怎么办？不用回滚
            </Txt>
            {new Array(16).fill(0).map((_, i) => (
              <rect key={i} x={96 + i * 48} y={552} width={42} height={42} fill={i < 7 ? T.ink : i < 10 ? T.red : T.paper2} stroke={T.ink} strokeWidth={i < 10 ? 0 : 3} />
            ))}
            <Line x={888} y={573} text="卷积历史按位置放进环形缓冲" f={f} at={Y2 + 12} />
            <Line x={96} y={636} text="被拒的位置（红）下一轮直接覆盖；K/V 写在临时页，提交时才拷进 KV cache" f={f} at={Y2 + 42} />
          </g>
        )}
        {fl(f, Y3) && <Box x={96} y={684} w={1728} h={108} inv label="8k：3.7 ms 一个 token → 每轮 4.1 ms 提交 2.5 个" sub="vLLM 上已经到了 528 tok/s，是原来的 1.8 倍" />}
      </Stage>
      <Caption title="一轮的账单" en="ONE ROUND OF THE MEGAKERNEL" color={T.ink} desc="draft、verify、commit 全在 GPU 上完成，CPU 只负责把 token 发出去" delay={24} />
    </AbsoluteFill>
  );
};

export {Bar};
