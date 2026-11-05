import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ActTitle} from '../components/ActTitle';
import {Txt} from '../components/kit';
import {EVE, SAGE} from '../components/pixel';
import {Cue, Problem, probCues, STAGE_TOP} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {COL, FONT, rnd} from '../theme';
import {Bar, BarRow, Box, Cells, fl, Line, ramp, Say, Stage, T, Table, Wire} from './lib';

export const RunTitle: React.FC = () => (
  <ActTitle
    num="03"
    zh="先读对"
    en="READ THE RIGHT BYTES"
    color={COL.ink}
    topics={['21% 的起点', 'megakernel', 'Flash attention', 'W8A8 GEMM', '读少了就错', '正确的基线']}
    quote="字节可以少读，但不能读错。最快的错误答案没有价值"
    by="三天，四版内核"
  />
);

/* ---------- III.1 the starting point ---------- */
const B0 = 36;
const B1 = 240;
const B2 = 480;

export const RunBaseCues: Cue[] = [
  [B0, 'stamp'],
  [B1, 'step'],
  [B2, 'reveal'],
];

const STACK = ['vLLM · Python 调度', 'PyTorch', 'rocBLAS / Triton 内核', 'ROCm · HIP · ROCr', 'KFD 驱动', 'gfx906 · 官方已不再支持'];

export const RunBase: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        {STACK.map((s, i) => (fl(f, B0 + i * 12) ? <Box key={s} x={96} y={180 + i * 66} w={624} h={60} label={s} size={24} inv={i === 5} /> : null))}
        {fl(f, B1) && (
          <g>
            <Txt x={792} y={198} size={24} anchor="start" color={T.dim}>
              第一次跑通：127872 token 的输入
            </Txt>
            <Box x={792} y={222} w={504} h={132} inv label="首 token 238 秒" sub="prefill 约 536 tok/s" />
            <Box x={1320} y={222} w={504} h={132} label="每 token 30.9 ms" sub="decode 约 32 tok/s" />
            <Txt x={792} y={402} size={24} anchor="start" color={T.dim}>
              一个 token 里，GPU 在干什么
            </Txt>
            {new Array(46).fill(0).map((_, i) => {
              const w = 6 + Math.floor(rnd(i * 3.1) * 3) * 6;
              return <rect key={i} x={792 + i * 22} y={426} width={w} height={48} fill={T.ink} />;
            })}
            <Txt x={792} y={504} size={24} anchor="start" color={T.sub}>
              每个算子一次 launch，每次都要 CPU 下发、GPU 取指、刷缓存
            </Txt>
          </g>
        )}
        {fl(f, B2) && (
          <g>
            <BarRow x={792} y={546} name="路有多宽" nameW={150} frac={1} max={720} value="785 GB/s" t={ramp(f, B2, 30)} hollow />
            <BarRow x={792} y={594} name="实际在读" nameW={150} frac={161 / 785} max={720} value="约 161 GB/s · 21%" t={ramp(f, B2 + 30, 48)} color={T.red} />
            <Txt x={792} y={666} size={24} anchor="start" color={T.sub}>
              约 5 GB（fp16 权重 3.4 GB + fp16 的 K/V 1.57 GB）÷ 30.9 ms
            </Txt>
            <Txt x={96} y={624} size={24} anchor="start" color={T.ink}>
              只用了 21%。
            </Txt>
            <Txt x={96} y={660} size={24} anchor="start" color={T.sub}>
              另外 79% 的时间，内存是闲的。
            </Txt>
          </g>
        )}
        {fl(f, B2 + 90) && <Say who={SAGE} x={96} y={702} text="路是通的，车没上路。时间都花在调度上了。" f={f} at={B2 + 90} w={720} s={5} />}
      </Stage>
      <Caption title="起点" en="WHERE WE STARTED" color={T.ink} desc="社区让这张退役的卡还能跑 vLLM。能跑，但带宽只用上了五分之一" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- III.2 megakernel ---------- */
const M0 = 36;
const M1 = 300;
const M2 = 540;
const M3 = 750;

export const RunMegaCues: Cue[] = [
  [M0, 'step'],
  [M1, 'reveal'],
  [M2, 'bell'],
  [M3, 'chime'],
];

export const RunMega: React.FC = () => {
  const f = useF();
  const phase = Math.floor(((f - M2) % 240) / 40);
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          以前：每个算子一次 launch
        </Txt>
        {new Array(36).fill(0).map((_, i) => (fl(f, M0 + i * 3) ? <rect key={i} x={96 + i * 48} y={210} width={24} height={48} fill={T.ink} /> : null))}
        {fl(f, M0 + 120) && (
          <Txt x={96} y={288} size={24} anchor="start" color={T.sub}>
            空白：CPU 下发 · 等信号 · 刷缓存
          </Txt>
        )}
        {fl(f, M1) && (
          <g>
            <Txt x={96} y={342} size={24} anchor="start" color={T.dim}>
              现在：一个 token 一次 launch，24 层写在同一个 kernel 里
            </Txt>
            <Bar x={96} y={366} w={1728} h={48} t={ramp(f, M1, 60, 24)} />
          </g>
        )}
        {fl(f, M2) && (
          <g>
            <Txt x={96} y={462} size={24} anchor="start" color={T.dim}>
              全卡 60 个 block 同步走过每一阶段
            </Txt>
            {new Array(12).fill(0).map((_, b) =>
              new Array(6).fill(0).map((__, p) => {
                const x = 96 + p * 276;
                const y = 486 + b * 18;
                const t = f < M2 ? 0 : (f - M2) / 40 - p - rnd(b * 2.7) * 0.5;
                const w = Math.max(0, Math.min(1, t)) * 240;
                return w > 0 ? <rect key={`${b}-${p}`} x={x} y={y} width={Math.round(w / 6) * 6} height={12} fill={b === 0 ? T.ink : T.dim} /> : null;
              }),
            )}
            {new Array(6).fill(0).map((_, p) => (
              <rect key={p} x={96 + (p + 1) * 276 - 18} y={480} width={6} height={228} fill={phase === p ? T.red : T.line} />
            ))}
            <Txt x={96} y={738} size={24} anchor="start" color={T.red}>
              红线：grid barrier，先到的等后到的。一个 token 要过一两百次
            </Txt>
          </g>
        )}
        {fl(f, M3) && (
          <g>
            <Box x={1296} y={714} w={528} h={108} inv label="128k：30.9 → 7.6 ms/token" sub="后来 W8 版本 5.4 ms" size={36} />
          </g>
        )}
      </Stage>
      <Caption title="megakernel" en="ONE PERSISTENT LAUNCH" color={T.ink} desc="不让 CPU 插手：GPU 一口气走完全部层，内存不再为调度空等" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- III.3 flash attention ---------- */
const F0 = 30;
const F1 = 240;
const F2 = 480;
const F3 = 720;
const N = 16;

export const RunFlashCues: Cue[] = [
  [F0, 'blip'],
  [F1, 'step'],
  [F2, 'reveal'],
  [F3, 'bell'],
];

export const RunFlash: React.FC = () => {
  const f = useF();
  const tile = f >= F1 ? Math.floor((f - F1) / 24) : -1;
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          prefill：T 个 query × T 个 key
        </Txt>
        <Cells
          x={96}
          y={216}
          cols={N}
          rows={N}
          size={24}
          gap={3}
          fill={(i, j) => {
            if (j >= 8) return T.line;
            const ti = Math.floor(i / 4);
            if (f < F1) return fl(f, F0 + (i + j) * 3) ? T.paper2 : undefined;
            const done = ti < tile % 4;
            return ti === tile % 4 ? T.ink : done ? T.dim : T.paper2;
          }}
        />
        {fl(f, F0 + 90) && (
          <Txt x={96} y={666} size={24} anchor="start" color={T.sub}>
            完整矩阵 128k × 128k 根本放不下
          </Txt>
        )}
        {fl(f, F1) && (
          <g>
            <Txt x={594} y={210} size={36} anchor="start">
              不存矩阵，只留三个累加量
            </Txt>
            {[
              ['m', '目前见过的最大分数'],
              ['l', 'Σ exp(s − m)：softmax 的分母'],
              ['acc', 'Σ exp(s − m) · V：分子'],
            ].map(([a, b], i) => (
              <g key={a}>
                <Box x={594} y={246 + i * 72} w={96} h={60} label={a} inv mono />
                <Txt x={714} y={276 + i * 72} size={24} anchor="start">
                  {b}
                </Txt>
              </g>
            ))}
            <Txt x={594} y={486} size={24} anchor="start" color={T.sub}>
              key 一组一组地来，m 一变就把 l 和 acc 按比例修正。最后 acc / l 就是答案
            </Txt>
          </g>
        )}
        {fl(f, F2) && (
          <g>
            <Txt x={594} y={546} size={24} anchor="start" color={T.dim}>
              落到这张卡上
            </Txt>
            <Box x={594} y={570} w={594} h={102} inv label="QK 用 int8" sub="v_dot4：一个 lane 4 组" />
            <Box x={1212} y={570} w={612} h={102} label="PV 用 fp16" sub="v_dot2：P 必须保持精度" />
            <Line x={594} y={708} text="一个 block：16 个 query token × 1 个 kv head，K/V 直接读分页 KV" f={f} at={F2 + 20} />
          </g>
        )}
        {fl(f, F3) && (
          <g>
            <BarRow x={594} y={738} name="v3" nameW={60} frac={10.4 / 12.6} max={600} value="10.4 TFLOPS" h={24} t={ramp(f, F3, 24)} hollow />
            <BarRow x={594} y={768} name="v6" nameW={60} frac={1} max={600} value="12.6 TFLOPS" h={24} t={ramp(f, F3 + 24, 24)} />
          </g>
        )}
      </Stage>
      <Caption title="Flash attention" en="NO MATRIX, JUST RUNNING TOTALS" color={T.ink} desc="支线：prefill 撞的是算力。这是精确的注意力，128k 预填充 45 秒里它占 32 秒" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- III.4 GEMM ---------- */
const G0 = 30;
const G1 = 210;
const G2 = 450;

export const RunGemmCues: Cue[] = [
  [G0, 'blip'],
  [G1, 'step'],
  [G2, 'reveal'],
];

export const RunGemm: React.FC = () => {
  const f = useF();
  const active = f >= G0 ? Math.floor((f - G0) / 6) : 0;
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          M 个 token × N 个输出：切成 128 × 128 的小块
        </Txt>
        <Cells x={96} y={216} cols={16} rows={15} size={24} gap={6} fill={(i, j) => ((j * 16 + i) % 240 < active ? ((j * 16 + i) % 7 === 0 ? T.ink : T.dim) : T.paper2)} />
        {fl(f, G1) && (
          <g>
            <Box x={624} y={216} w={1200} h={84} label="每小块一个 block，一个 CU 只管自己的块" size={24} />
            <Txt x={624} y={342} size={24} anchor="start" color={T.dim}>
              沿 K 方向，每 128 列结算一次
            </Txt>
            <Box x={624} y={366} w={384} h={84} inv label="int32 累加 v_dot4" size={24} />
            <Wire x0={1008} y0={408} x1={1062} y1={408} />
            <Box x={1068} y={366} w={354} h={84} label="乘 sa × sb" size={24} />
            <Wire x0={1422} y0={408} x1={1476} y1={408} />
            <Box x={1482} y={366} w={342} h={84} label="累加到 fp32" size={24} />
          </g>
        )}
        {fl(f, G2) && (
          <g>
            <Txt x={624} y={498} size={24} anchor="start" color={T.dim}>
              再把小算子揉进来
            </Txt>
            <Line x={624} y={540} text="激活的量化和打包合成一个 kernel，不用单独排队" f={f} at={G2 + 10} />
            <Line x={624} y={582} text="q / k / v / gate 合并成一次 3088 行的 GEMM，不用算四次" f={f} at={G2 + 50} />
            <Line x={624} y={624} text="gate × up 的激活也融进量化这一步" f={f} at={G2 + 90} />
            <Box x={624} y={672} w={1200} h={84} inv label="28 – 33 TOPS，约峰值的 65%" />
          </g>
        )}
      </Stage>
      <Caption title="W8A8 GEMM" en="TILES ON THE CU" color={T.ink} desc="支线：prefill 的线性层全部换成 int8，算得快一倍。权重和 decode 共用一份" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- III.5 case: fast, and completely wrong ---------- */
const CASE = {
  card: 330,
  steps: [
    {at: 30, label: 'RoPE 布局'},
    {at: 300, label: 'P 按行量化'},
    {at: 540, label: 'W4 权重'},
  ],
  reveal: 800,
};
export const RunCollapseCues: Cue[] = probCues(CASE, [[150, 'error']]);

export const RunCollapse: React.FC = () => (
  <Problem
    no={1}
    color={T.red}
    tag="崩坏"
    title="快，但全错了"
    q={[
      ['第二天的数字非常漂亮：128k 上下文，', {t: '首 token 33 秒', m: true}, '，解码几百 tok/s。'],
      ['然后我们读了读它的输出：', {t: 'is is is is is is is', c: COL.red, m: true}],
      ['长上下文下模型在原地打转，而重复文本反过来放大了速度数字。'],
    ]}
    brief="拿 HF fp32（全精度参考实现）当标准，逐层查 KL"
    {...CASE}
    answerText="KL 2.80 → 约 0"
    insight="字节不是越少越好。评测必须包含正确性，没有参考答案的性能数字，什么也说明不了。"
  >
    {(sf) => (
      <Stage>
        {sf >= 30 && (
          <g>
            <Txt x={96} y={STAGE_TOP + 18} size={24} anchor="start">
              主因：LFM3 只旋转一半维度，旋转对是 (i, i + 64)
            </Txt>
            <Txt x={96} y={STAGE_TOP + 66} size={24} anchor="start" color={T.dim}>
              HF：zero-tail
            </Txt>
            <Cells x={330} y={STAGE_TOP + 54} cols={32} rows={1} size={24} gap={3} fill={(i) => ((i < 8 || (i >= 16 && i < 24)) ? T.ink : T.line)} />
            <Txt x={96} y={STAGE_TOP + 108} size={24} anchor="start" color={T.red}>
              vLLM：另一种
            </Txt>
            <Cells x={330} y={STAGE_TOP + 96} cols={32} rows={1} size={24} gap={3} fill={(i) => (i < 16 ? T.red : T.line)} />
            {sf >= 150 && (
              <Txt x={1236} y={STAGE_TOP + 84} size={24} anchor="start" color={T.red}>
                同样叫 partial RoPE，KL 2.8
              </Txt>
            )}
          </g>
        )}
        {sf >= 300 && (
          <g>
            <Txt x={96} y={STAGE_TOP + 174} size={24} anchor="start">
              第二处：softmax 概率 P 按整行最大值量化成 int8
            </Txt>
            {new Array(48).fill(0).map((_, i) => {
              const p = i === 11 ? 1 : i === 30 ? 0.5 : 0.002 + rnd(i * 1.3) * 0.004;
              const h = Math.max(3, p * 72);
              return <rect key={i} x={96 + i * 18} y={STAGE_TOP + 270 - h} width={12} height={h} fill={T.ink} />;
            })}
            {sf >= 390 &&
              new Array(48).fill(0).map((_, i) => {
                const q = i === 11 ? 1 : i === 30 ? 0.5 : 0;
                const h = Math.max(3, q * 72);
                return <rect key={i} x={1000 + i * 15} y={STAGE_TOP + 270 - h} width={9} height={h} fill={q ? T.ink : T.red} />;
              })}
            {sf >= 420 && (
              <Txt x={1000} y={STAGE_TOP + 300} size={24} anchor="start" color={T.red}>
                上下文越长，分到每个 key 的概率越小，几乎全变 0。模拟 KL 4.8
              </Txt>
            )}
          </g>
        )}
        {sf >= 540 && (
          <g>
            <Txt x={96} y={STAGE_TOP + 348} size={24} anchor="start">
              第三处：decode 权重只用 4 位（W4）。每 token 少读 0.9 GB，但模拟 KL 0.3 到 2.4
            </Txt>
            <Txt x={96} y={STAGE_TOP + 396} size={24} anchor="start" color={T.sub}>
              顺手还查到：QKVG 常量写成了 4112（应为 3088），每层多读 2 MB 权重
            </Txt>
          </g>
        )}
        {sf >= 650 && <Say who={SAGE} x={96} y={STAGE_TOP + 438} text="把精度换回来，数字会变难看。那才是真实的起点。" f={sf} at={650} w={720} s={5} />}
      </Stage>
    )}
  </Problem>
);

/* ---------- III.6 the fix ---------- */
const X0 = 30;
const X1 = 360;
const X2 = 600;
const PROMPTS: [string, number, number][] = [
  ['chat0', 0.038, 0.0002],
  ['chat1', 0.045, 0.0005],
  ['chat2', 0.147, 0.0016],
  ['long4096', 0.58, 0.025],
  ['long16384', 0.039, 0.0004],
];

export const RunFixCues: Cue[] = [
  [X0, 'step'],
  [X1, 'reveal'],
  [X2, 'bell'],
];

export const RunFix: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Table
          x={96}
          y={174}
          cols={[420, 648, 660]}
          head={['部分', 'decode', 'prefill']}
          rows={[
            ['线性层权重', 'int8，每 128 输入一个 scale', '同一份 int8'],
            ['线性层激活', 'fp16', 'int8，每 token 每 128 列一个 scale'],
            ['注意力', 'Q、K 用 int8，P 用 fp16', '同左'],
            ['KV cache', 'int8，每 token 每 head 一个 scale', '同左'],
          ]}
          f={f}
          at={X0}
          step={30}
          size={24}
          rowH={48}
          align={['start', 'start', 'start']}
        />
        {fl(f, X1) && (
          <g>
            <Txt x={96} y={456} size={24} anchor="start" color={T.dim}>
              对 HF fp32 的 decode KL：旧 → 新
            </Txt>
            {PROMPTS.map(([n, a, b], i) => (
              <g key={n}>
                <BarRow x={96} y={480 + i * 54} name={n} nameW={180} frac={Math.sqrt(a / 0.58)} max={600} value={a.toFixed(3)} h={21} t={ramp(f, X1 + i * 12, 24)} color={T.red} />
                <BarRow x={96} y={504 + i * 54} name="" nameW={180} frac={Math.max(0.01, Math.sqrt(b / 0.58))} max={600} value={b.toFixed(4)} h={21} t={ramp(f, X1 + 30 + i * 12, 24)} />
              </g>
            ))}
          </g>
        )}
        {fl(f, X2) && (
          <g>
            <Box x={1104} y={480} w={720} h={120} inv label="MATH-500 20 题 90%" sub="20+20 题里没有一题循环" />
            <Box x={1104} y={624} w={720} h={120} label="每 token 2.57 GB · 带宽 55%" sub="decode 167 tok/s，这才是真正的基线" />
          </g>
        )}
      </Stage>
      <Caption title="精度方案" en="FP16 AND INT8 ONLY" color={T.ink} desc="账单定下来了：每 token 2.57 GB。哪里能压，哪里不能压，都用 KL 量过" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- III.7 overlap the waits ---------- */
const O0 = 36;
const O1 = 300;
const O2 = 570;
const O3 = 750;

export const RunOverlapCues: Cue[] = [
  [O0, 'step'],
  [O1, 'reveal'],
  [O2, 'bell'],
  [O3, 'chime'],
];

const Lane: React.FC<{y: number; segs: [number, number, string, string?][]; t: number; label: string}> = ({y, segs, t, label}) => (
  <g>
    <Txt x={288} y={y + 24} size={24} anchor="end">
      {label}
    </Txt>
    {segs.map(([x, w, c, txt], i) => {
      const end = x + w;
      if (t * 1500 < x) return null;
      const ww = Math.min(w, t * 1500 - x);
      return (
        <g key={i}>
          <rect x={312 + x} y={y} width={ww} height={48} fill={c} stroke={T.ink} strokeWidth={c === T.paper ? 3 : 0} />
          {txt && ww >= w && (
            <Txt x={312 + x + w / 2} y={y + 25} size={24} color={c === T.ink ? T.invText : T.ink}>
              {txt}
            </Txt>
          )}
          {end}
        </g>
      );
    })}
  </g>
);

export const RunOverlap: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          每个 token 要过一两百个 barrier，每个 barrier 后面都要读内存
        </Txt>
        {f >= O0 && (
          <g>
            <Txt x={96} y={228} size={24} anchor="start" color={T.red}>
              改之前：干等，然后再发 load，再等内存返回
            </Txt>
            <Lane y={252} t={ramp(f, O0, 120, 24)} label="一个 wave" segs={[[0, 300, T.ink, '计算'], [300, 300, T.paper, '等 barrier'], [600, 360, T.paper2, '等内存'], [960, 300, T.ink, '计算']]} />
          </g>
        )}
        {f >= O1 && (
          <g>
            <Txt x={96} y={348} size={24} anchor="start">
              改之后：先报到（arrive），立刻发下一阶段的 load，再等
            </Txt>
            <Lane y={372} t={ramp(f, O1, 120, 24)} label="一个 wave" segs={[[0, 300, T.ink, '计算'], [300, 360, T.paper2, '等 barrier 也在等内存'], [660, 300, T.ink, '计算']]} />
            {fl(f, O1 + 150) && <Txt x={312 + 960 + 12} y={396} size={24} anchor="start" color={T.red}>省下的时间</Txt>}
          </g>
        )}
        {fl(f, O2) && (
          <g>
            <Txt x={96} y={510} size={24} anchor="start" color={T.dim}>
              同一个思路的其他几处
            </Txt>
            <Line x={96} y={552} text="barrier 只等 LDS，不等预取；load 指令类型也要选对（global 而不是 flat），否则还是会把在途的 load 等完" f={f} at={O2 + 8} />
            <Line x={96} y={594} text="K/V 的 load 分散到计算中间发，连续发 10 条 16 字节的 load 会把一个 wave 卡住" f={f} at={O2 + 50} />
            <Line x={96} y={636} text="采样也放进 kernel：不再让 CPU 算 argmax 和重复惩罚，每 token 省约 175 µs" f={f} at={O2 + 90} />
          </g>
        )}
        {fl(f, O3) && (
          <g>
            <BarRow x={96} y={684} name="改之前" nameW={150} frac={55 / 100} max={1200} value="带宽 55% · 166.8 tok/s" t={ramp(f, O3, 30)} hollow />
            <BarRow x={96} y={732} name="改之后" nameW={150} frac={66 / 100} max={1200} value="带宽 66% · 200.8 tok/s" t={ramp(f, O3 + 30, 30)} />
            <BarRow x={96} y={780} name="上限" nameW={150} frac={1} max={1200} value="100% · 311" h={18} t={ramp(f, O3 + 60, 30)} color={T.line} />
          </g>
        )}
      </Stage>
      <Caption title="把等待叠在一起" en="OVERLAP THE WAITS" color={T.ink} desc="等 barrier 时内存本可以在读。字节一个没少，128k decode 快了 20%" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- IV.2 GEMV at the limit ---------- */
const V0 = 36;
const V1 = 300;
const V2 = 570;
const V3 = 750;

export const RunGemvCues: Cue[] = [
  [V0, 'step'],
  [V1, 'step'],
  [V2, 'bell'],
  [V3, 'reveal'],
];

/** load requests of one wave: a request waits `lat` in memory, then the data is computed on */
const Flight: React.FC<{y: number; depth: number; t: number; label: string}> = ({y, depth, t, label}) => {
  const lat = 240;
  const comp = 60;
  const step = depth === 1 ? lat + comp : (lat + comp) / depth;
  const items: React.ReactNode[] = [];
  const end = 96 + 210 + t * 1440;
  for (let i = 0; i < 24; i++) {
    const x = 306 + i * step;
    const row = i % depth;
    if (x >= end) break;
    const yy = y + row * 24;
    items.push(<rect key={`l${i}`} x={x} y={yy} width={Math.min(lat, end - x)} height={18} fill={T.paper2} stroke={T.ink} strokeWidth={3} />);
    if (x + lat < end) items.push(<rect key={`c${i}`} x={x + lat} y={yy} width={Math.min(comp, end - x - lat)} height={18} fill={T.ink} />);
  }
  return (
    <g>
      <Txt x={288} y={y + 9 + (depth - 1) * 12} size={24} anchor="end">
        {label}
      </Txt>
      {items}
    </g>
  );
};

export const RunGemv: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          带宽 = 在途字节 ÷ 延迟。灰色是 load 在等内存，黑色是算
        </Txt>
        {f >= V0 && <Flight y={216} depth={1} t={ramp(f, V0, 120, 24)} label="在途 1 个" />}
        {f >= V0 + 90 && <Flight y={258} depth={3} t={ramp(f, V0 + 90, 120, 24)} label="在途 3 个" />}
        {fl(f, V0 + 180) && (
          <Txt x={96} y={366} size={24} anchor="start" color={T.sub}>
            发完 load 不等它，接着算上一批的数据。同样的延迟，同一段时间里读的字节多了 3 倍，一个 wave 也不用空等
          </Txt>
        )}
        {fl(f, V1) && (
          <g>
            <Txt x={96} y={420} size={24} anchor="start" color={T.dim}>
              再把 load 分给所有 block 和 CU
            </Txt>
            <Box x={96} y={444} w={558} h={126} label="w2 分 4 个 band 并行" sub="7680 列的矩阵，每个 block 只读自己那一段" size={24} />
            <Box x={681} y={444} w={558} h={126} label="行地址累加" sub="每单元 65 条标量指令降到 18 条" size={24} />
            <Box x={1266} y={444} w={558} h={126} label="x 改 int8" sub="算得快了，load 才发得及时" size={24} />
          </g>
        )}
        {fl(f, V2) && (
          <g>
            <BarRow x={96} y={606} name="早期 GEMV" nameW={180} frac={650 / 785} max={900} value="约 650 GB/s" t={ramp(f, V2, 30)} hollow />
            <BarRow x={96} y={654} name="现在 GEMV" nameW={180} frac={770 / 785} max={900} value="770 GB/s" t={ramp(f, V2 + 30, 30)} />
            <BarRow x={96} y={702} name="上限" nameW={180} frac={1} max={900} value="785 GB/s" h={18} t={ramp(f, V2 + 60, 30)} color={T.line} />
          </g>
        )}
        {fl(f, V3) && <Box x={1416} y={606} w={408} h={132} inv label="98%" sub="GEMV 这段已经贴着上限" size={60} />}
      </Stage>
      <Caption title="让 GEMV 贴着上限读" en="LOADS IN FLIGHT" color={T.ink} desc="decode 最大的一笔账做到头了。剩下的差距，都在不读内存的那些阶段" delay={24} />
    </AbsoluteFill>
  );
};

export {EVE, FONT};
