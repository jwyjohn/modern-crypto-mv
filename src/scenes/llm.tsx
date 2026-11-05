import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ActTitle} from '../components/ActTitle';
import {Txt} from '../components/kit';
import {ALICE, BOB, EVE} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {COL, FONT, rnd} from '../theme';
import {Bar, BarRow, Box, Cells, fl, Line, ramp, Say, Stage, T, Table, Wire} from './lib';

export const LlmTitle: React.FC = () => (
  <ActTitle
    num="02"
    zh="一个模型"
    en="THE MODEL"
    color={COL.ink}
    topics={['prefill 与 decode', '24 层结构', 'Q K V', 'KV cache', '量化']}
    quote="每生成一个 token，都要把整个模型走一遍"
    by="LiquidAI/LFM3-1.7B"
  />
);

/* ---------- II.1 the generation loop ---------- */
const WORDS = ['今天', '天气', '真', '好'];
const NEXT = ['，', '我们', '去', '公园'];
const L0 = 36;
const L1 = 200;
const L2 = 400;
const L3 = 680;

export const LlmLoopCues: Cue[] = [
  [L0, 'type'],
  [L1, 'whoosh'],
  [L2, 'chime'],
  [L3, 'reveal'],
];

export const LlmLoop: React.FC = () => {
  const f = useF();
  const k = f < L2 ? 0 : Math.min(NEXT.length, Math.floor((f - L2) / 60) + 1);
  const tx = (i: number) => 96 + i * 132;
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          文本先切成 token，每个 token 是一个编号
        </Txt>
        {WORDS.map((w, i) =>
          fl(f, L0 + i * 18) ? (
            <g key={w}>
              <Box x={tx(i)} y={216} w={120} h={72} label={w} dark={f >= L1} />
            </g>
          ) : null,
        )}
        {NEXT.slice(0, k).map((w, i) => (
          <Box key={w} x={tx(WORDS.length + i)} y={216} w={120} h={72} label={w} inv />
        ))}
        {f >= L1 && (
          <g>
            <Wire x0={480} y0={300} x1={480} y1={348} t={ramp(f, L1, 24)} />
            <Box x={96} y={354} w={768} h={102} label="模型：24 层 + LM head" sub="输入一串 token，输出下一个 token 的 128000 个分数" />
            <Wire x0={864} y0={405} x1={1008} y1={405} t={ramp(f, L1 + 30, 24)} />
            <Box x={1014} y={354} w={300} h={102} label="取最大" sub="greedy" />
            <Wire x0={1164} y0={354} x1={1164} y1={294} t={ramp(f, L1 + 54, 24)} />
          </g>
        )}
        {fl(f, L3) && (
          <g>
            <Box x={96} y={504} w={840} h={210} />
            <Txt x={120} y={546} size={36} anchor="start">
              prefill：把输入一次读完
            </Txt>
            <Line x={120} y={600} text="T 个 token 同时算，矩阵乘矩阵（GEMM）" f={f} at={L3 + 12} />
            <Line x={120} y={642} text="指标：TTFT，等第一个 token 要多久" f={f} at={L3 + 42} />
            <Line x={120} y={684} text="单位：prefill tok/s" f={f} at={L3 + 72} color={T.dim} />
            <Box x={984} y={504} w={840} h={210} />
            <Txt x={1008} y={546} size={36} anchor="start">
              decode：一个一个往外吐
            </Txt>
            <Line x={1008} y={600} text="1 个 token 过全模型，矩阵乘向量（GEMV）" f={f} at={L3 + 12} />
            <Line x={1008} y={642} text="指标：每秒吐多少 token" f={f} at={L3 + 42} />
            <Line x={1008} y={684} text="单位：decode tok/s" f={f} at={L3 + 72} color={T.dim} />
          </g>
        )}
      </Stage>
      <Caption title="推理就是一个循环" en="THE GENERATION LOOP" color={T.ink} desc="prefill 读输入，decode 写输出。两段的瓶颈完全不同，要分开优化" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- II.2 the layer stack ---------- */
const KINDS = [0, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0];
const LS = 30;
const LD = 330;
const LF = 570;

export const LlmLayersCues: Cue[] = [
  [LS, 'blip'],
  [LD, 'step'],
  [LF, 'reveal'],
];

export const LlmLayers: React.FC = () => {
  const f = useF();
  const n = Math.floor(ramp(f, LS, 120, 24) * 24);
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          LFM3-1.7B：H = 2048，24 层交替
        </Txt>
        {KINDS.map((k, i) =>
          i < n ? (
            <g key={i}>
              <rect x={96 + i * 72} y={216} width={60} height={96} fill={k === 1 ? T.inv : k === 2 ? T.paper2 : T.paper} stroke={T.ink} strokeWidth={3} />
              <Txt x={126 + i * 72} y={264} size={24} color={k === 1 ? T.invText : T.ink} family={FONT.pixelMono}>
                {k === 0 ? 'C' : k === 1 ? 'A' : 'S'}
              </Txt>
            </g>
          ) : null,
        )}
        {fl(f, LS + 130) && (
          <g>
            <rect x={96} y={342} width={30} height={30} fill={T.paper} stroke={T.ink} strokeWidth={3} />
            <Txt x={138} y={357} size={24} anchor="start">
              13 层卷积：只看前 6 个位置
            </Txt>
            <rect x={636} y={342} width={30} height={30} fill={T.inv} />
            <Txt x={678} y={357} size={24} anchor="start">
              6 层全注意力：看整段上下文
            </Txt>
            <rect x={1176} y={342} width={30} height={30} fill={T.paper2} stroke={T.ink} strokeWidth={3} />
            <Txt x={1218} y={357} size={24} anchor="start">
              5 层滑动窗口：只看最近 256 个
            </Txt>
          </g>
        )}
        {fl(f, LD) && (
          <g>
            <Txt x={96} y={420} size={24} anchor="start" color={T.dim}>
              展开一层
            </Txt>
            {[
              ['RMS 归一化', '向量除以它的均方根'],
              ['混合层', '注意力或卷积'],
              ['RMS + 残差', '加回原来的向量'],
              ['前馈层 FFN', '2048 → 7680 → 2048'],
              ['RMS + 残差', '进入下一层'],
            ].map(([a, b], i) => (
              <g key={i}>
                <Box x={96 + i * 348} y={450} w={306} h={120} label={a} sub={b} inv={i === 3} />
                {i < 4 && <Wire x0={402 + i * 348} y0={510} x1={444 + i * 348} y1={510} />}
              </g>
            ))}
          </g>
        )}
        {fl(f, LF) && (
          <g>
            <Box x={96} y={618} w={1728} h={108} inv label="FFN 一层就有两个大矩阵：15360 × 2048 和 2048 × 7680" sub="decode 大部分时间都在读这些权重" size={36} />
            <Txt x={96} y={768} size={24} anchor="start" color={T.sub}>
              所以 GEMV（权重矩阵 × 一个向量）和内存带宽，决定了 decode 的速度
            </Txt>
          </g>
        )}
      </Stage>
      <Caption title="24 层，三种" en="LAYER STACK" color={T.ink} desc="这个模型的 13 层卷积很便宜，贵的是注意力和权重本身" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- II.3 attention ---------- */
const TOK = ['猫', '坐', '在', '垫', '子', '上'];
const SCORES = [0.46, 0.05, 0.02, 0.31, 0.12, 0.04];
const A0 = 36;
const A1 = 260;
const A2 = 480;
const A3 = 720;

export const LlmAttnCues: Cue[] = [
  [A0, 'blip'],
  [A1, 'step'],
  [A2, 'reveal'],
  [A3, 'bell'],
];

export const LlmAttn: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          预测「它」的下一个词时，前面每个词该看多少？
        </Txt>
        {TOK.map((w, i) => (
          <Box key={w} x={96 + i * 120} y={222} w={108} h={66} label={w} />
        ))}
        <Box x={96 + 6 * 120} y={222} w={108} h={66} label="它" inv />
        {fl(f, A0) && (
          <g>
            <Txt x={960} y={255} size={24} anchor="start" color={T.ink}>
              Q：我在找什么（当前 token）
            </Txt>
            <Txt x={960} y={291} size={24} anchor="start" color={T.ink}>
              K：我是什么（每个历史 token）
            </Txt>
            <Txt x={960} y={327} size={24} anchor="start" color={T.ink}>
              V：我要传递什么（每个历史 token）
            </Txt>
          </g>
        )}
        {f >= A1 &&
          TOK.map((w, i) => {
            const t = ramp(f, A1 + i * 12, 60);
            return (
              <g key={i}>
                <Bar x={96 + i * 120} y={312 + (180 - 180 * SCORES[i] * 2) } w={108} h={Math.max(6, 180 * SCORES[i] * 2)} t={t} color={i === 0 || i === 3 ? T.ink : T.dim} />
              </g>
            );
          })}
        {fl(f, A1 + 60) && (
          <Txt x={96} y={516} size={24} anchor="start" color={T.sub}>
            P = softmax(Q · K / √d)，每个词一个分数，加起来等于 1
          </Txt>
        )}
        {fl(f, A2) && (
          <g>
            <Box x={96} y={546} w={840} h={84} inv label="输出 = Σ Pᵢ · Vᵢ" mono />
            <Txt x={96} y={666} size={24} anchor="start" color={T.sub}>
              上下文有 T 个 token，每个 token 都要和 T 个 K 比一遍：prefill 是 O(T²)
            </Txt>
            <Txt x={96} y={708} size={24} anchor="start" color={T.sub}>
              每个 head 独立做一次。这里 16 个 Q head 共用 4 个 K/V head（GQA），省下 3/4 的 K/V
            </Txt>
          </g>
        )}
        {fl(f, A3) && (
          <g>
            <Box x={1008} y={402} w={816} h={228} />
            <Txt x={1032} y={444} size={36} anchor="start">
              RoPE：位置怎么进来
            </Txt>
            <Txt x={1032} y={498} size={24} anchor="start">
              把 Q 和 K 的每两维看成平面上的一个点，
            </Txt>
            <Txt x={1032} y={534} size={24} anchor="start">
              按所在位置旋转一个角度。
            </Txt>
            <Txt x={1032} y={570} size={24} anchor="start" color={T.red}>
              这里后面会出大事：LFM3 只旋转一半维度。
            </Txt>
            <g transform="translate(1680,516)">
              <rect x={-60} y={0} width={120} height={3} fill={T.line} />
              <rect x={0} y={-60} width={3} height={120} fill={T.line} />
              <rect x={30} y={-36} width={12} height={12} fill={T.ink} />
              <rect x={-30} y={-42} width={12} height={12} fill={T.red} />
            </g>
          </g>
        )}
      </Stage>
      <Caption title="注意力" en="QUERY · KEY · VALUE" color={T.ink} desc="算法本身只有一行公式，贵的是要在每个位置、每个 head 上做一遍" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- II.4 KV cache and the decode floor ---------- */
const K0 = 30;
const K1 = 260;
const K2 = 470;
const K3 = 690;

export const LlmKvCues: Cue[] = [
  [K0, 'blip'],
  [K1, 'step'],
  [K2, 'bell'],
  [K3, 'reveal'],
];

export const LlmKv: React.FC = () => {
  const f = useF();
  const grow = Math.floor(ramp(f, K0, 180, 24) * 24);
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          历史 token 的 K 和 V 不会变，算一次存下来
        </Txt>
        <Cells x={96} y={216} cols={24} rows={4} size={24} gap={6} fill={(i, j) => (i < grow ? (j % 2 ? T.dim : T.ink) : T.line)} />
        <Txt x={840} y={270} size={24} anchor="start">
          ← 每个 token 一列，每个 K/V head 一行
        </Txt>
        {fl(f, K1) && (
          <g>
            <Txt x={96} y={372} size={24} anchor="start" color={T.dim}>
              一条记录 264 字节（int8）
            </Txt>
            <Box x={96} y={396} w={480} h={72} label="K · 128 字节" inv />
            <Box x={576} y={396} w={120} h={72} label="scale" size={24} />
            <Box x={696} y={396} w={480} h={72} label="V · 128 字节" dark />
            <Box x={1176} y={396} w={120} h={72} label="scale" size={24} />
            <Txt x={1326} y={432} size={24} anchor="start" color={T.sub}>
              按 32 token 一页分页存放
            </Txt>
          </g>
        )}
        {fl(f, K2) && (
          <g>
            <Txt x={96} y={510} size={24} anchor="start" color={T.dim}>
              128k 上下文，decode 一个 token 至少要读：
            </Txt>
            <BarRow x={96} y={534} name="全部权重" nameW={210} frac={1.76 / 2.57} max={1020} value="1.76 GB" t={ramp(f, K2, 36)} />
            <BarRow x={96} y={582} name="6 层 KV" nameW={210} frac={0.81 / 2.57} max={1020} value="0.81 GB" t={ramp(f, K2 + 36, 36)} hollow />
          </g>
        )}
        {fl(f, K3) && (
          <g>
            <Box x={96} y={648} w={1092} h={120} inv label="2.57 GB ÷ 785 GB/s ≈ 3.2 ms" sub="算法再巧，每个 token 也至少这么久" />
            <Box x={1236} y={648} w={588} h={120} label="≈ 311 tok/s" sub="128k 单流 decode 的物理上限" />
          </g>
        )}
      </Stage>
      <Caption title="KV cache" en="AND THE DECODE FLOOR" color={T.ink} desc="省掉了重算，却省不掉读。这条算术决定了后面每一步的方向" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- II.5 two bottlenecks ---------- */
const C0 = 36;
const C1 = 300;
const C2 = 540;

export const LlmCostCues: Cue[] = [
  [C0, 'step'],
  [C1, 'step'],
  [C2, 'reveal'],
];

export const LlmCost: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        {fl(f, C0) && (
          <g>
            <Txt x={96} y={192} size={36} anchor="start">
              prefill：撞屋顶（计算）
            </Txt>
            <Txt x={96} y={240} size={24} anchor="start" color={T.sub}>
              128k 预填充的账：
            </Txt>
            <BarRow x={96} y={270} name="注意力" nameW={150} frac={32 / 45} max={620} value="约 32 s" t={ramp(f, C0, 48)} />
            <BarRow x={96} y={318} name="线性层" nameW={150} frac={13 / 45} max={620} value="约 13 s" t={ramp(f, C0 + 48, 48)} hollow />
            <Txt x={96} y={396} size={24} anchor="start" color={T.sub}>
              上下文翻倍，注意力翻 4 倍。tps 从 8k 的 7000 掉到 128k 的 2700。
            </Txt>
          </g>
        )}
        {fl(f, C1) && (
          <g>
            <Txt x={1008} y={192} size={36} anchor="start">
              decode：撞斜坡（内存）
            </Txt>
            <Txt x={1008} y={240} size={24} anchor="start" color={T.sub}>
              8k 上下文，一轮时间的账（M ≈ 3.8）：
            </Txt>
            <BarRow x={1008} y={270} name="读权重" nameW={150} frac={2235 / 2235} max={460} value="2235 µs" t={ramp(f, C1, 48)} />
            <BarRow x={1008} y={318} name="注意力" nameW={150} frac={807 / 2235} max={460} value="807 µs" t={ramp(f, C1 + 24, 48)} hollow />
            <BarRow x={1008} y={366} name="其余" nameW={150} frac={800 / 2235} max={460} value="800 µs" t={ramp(f, C1 + 48, 48)} hollow />
          </g>
        )}
        {fl(f, C2) && (
          <g>
            <Table
              x={96}
              y={468}
              cols={[420, 660, 648]}
              head={['', 'prefill', 'decode']}
              rows={[
                ['算什么', 'GEMM：矩阵 × 矩阵', 'GEMV：矩阵 × 向量'],
                ['受限于', '计算：指令条数和时钟', '内存：每个 token 读一遍权重'],
                ['优化手段', '分块、用 int8 指令、减少开销', '并行读、减少等待、一次验证多个'],
              ]}
              f={f}
              at={C2}
              step={36}
              size={24}
              rowH={66}
            />
          </g>
        )}
      </Stage>
      <Caption title="两种瓶颈" en="TWO BOTTLENECKS" color={T.ink} desc="同一个模型，同一张卡，两段路程要用两套方法" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- II.6 quantization ---------- */
const WV = [0.12, -0.5, 0.07, 0.31, -0.02, 0.44];
const Q0 = 36;
const Q1 = 240;
const Q2 = 450;
const Q3 = 690;
const S = 0.5 / 127;

export const LlmQuantCues: Cue[] = [
  [Q0, 'blip'],
  [Q1, 'step'],
  [Q2, 'bell'],
  [Q3, 'reveal'],
];

export const LlmQuant: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          一组 128 个权重共用一个 scale（这里只画 6 个）
        </Txt>
        {WV.map((v, i) =>
          fl(f, Q0 + i * 12) ? (
            <g key={i}>
              <Box x={96 + i * 168} y={216} w={156} h={72} label={v.toFixed(2)} mono />
            </g>
          ) : null,
        )}
        {fl(f, Q1) && (
          <g>
            <Txt x={1128} y={252} size={24} anchor="start">
              scale = max|w| / 127 = 0.5 / 127
            </Txt>
            {WV.map((v, i) => (
              <g key={i}>
                <Wire x0={174 + i * 168} y0={288} x1={174 + i * 168} y1={324} t={ramp(f, Q1 + i * 6, 12)} />
                <Box x={96 + i * 168} y={330} w={156} h={72} label={Math.round(v / S)} inv mono />
              </g>
            ))}
            <Txt x={1128} y={366} size={24} anchor="start">
              q = round(w / scale)，存成 int8
            </Txt>
          </g>
        )}
        {fl(f, Q2) && (
          <g>
            <Table
              x={96}
              y={432}
              cols={[480, 420, 420]}
              head={['写法', '大小', '说明']}
              rows={[
                ['fp16', '3.4 GB', '原始精度'],
                ['W8 · 每 128 个一个 scale', '1.76 GB', '现在用的'],
                [{t: 'W4 · 每行一个 scale', c: T.red}, {t: '更小', c: T.red}, {t: '后面会崩', c: T.red}],
              ]}
              f={f}
              at={Q2}
              step={24}
              align={['start', 'end', 'end']}
              rowH={54}
            />
          </g>
        )}
        {fl(f, Q3) && (
          <g>
            <Box x={1488} y={432} w={336} h={270} />
            <Txt x={1656} y={474} size={24}>
              怎么知道压坏了没
            </Txt>
            <Txt x={1656} y={522} size={36} family={FONT.pixelMono}>
              KL
            </Txt>
            <Txt x={1656} y={576} size={24} color={T.sub}>
              两个分布差多远
            </Txt>
            <Txt x={1656} y={612} size={24} color={T.sub}>
              0 = 完全相同
            </Txt>
            <Txt x={1656} y={648} size={24} color={T.red}>
              参考：HF fp32
            </Txt>
          </g>
        )}
        {f >= Q3 && <Say who={ALICE} x={96} y={702} text={'省内存、提速度，都用 int8。\n但每次压缩，都要拿 KL 量一下。'} f={f} at={Q3 + 12} w={600} s={5} />}
      </Stage>
      <Caption title="量化" en="QUANTIZATION" color={T.ink} desc="用 8 位整数和一个比例，近似一组浮点数。代价是误差" delay={24} />
    </AbsoluteFill>
  );
};

export {BOB, EVE, rnd};
