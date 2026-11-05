import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import {EVE, SAGE} from '../components/pixel';
import {Cue, Problem, probCues, STAGE_TOP} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {COL, FONT} from '../theme';
import {Bar, BarRow, Box, Cells, fl, Line, ramp, Say, Stage, T, Table, Wire} from './lib';

/* ---------- V.4 how far from the roof ---------- */
const R0 = 30;
const R1 = 300;
const R2 = 570;

export const DsRoofCues: Cue[] = [
  [R0, 'step'],
  [R1, 'bell'],
  [R2, 'reveal'],
];

const PARTS: [string, number, number][] = [
  ['verify GEMV', 2235, 2192],
  ['drafter GEMV', 388, 262],
  ['注意力', 807, 100],
  ['norm', 379, 0],
  ['barrier 等待', 359, 0],
];

export const DsRoof: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Table
          x={96}
          y={168}
          cols={[210, 330, 240, 240, 240]}
          head={['M ≈ 3.8', '每轮要读', '下限', '实际', '利用率']}
          rows={[
            ['8k', '约 2.05 GB', '2.61 ms', '4.06 ms', {t: '64%', c: T.ink}],
            ['128k', '约 2.75 GB', '3.50 ms', '6.33 ms', {t: '55%', c: T.red}],
          ]}
          f={f}
          at={R0}
          step={30}
          size={24}
          rowH={48}
        />
        {fl(f, R0 + 80) && (
          <Txt x={1398} y={240} size={24} anchor="start" color={T.sub}>
            下限 = 读取量 / 785 GB/s
          </Txt>
        )}
        {fl(f, R1) && (
          <g>
            <Txt x={96} y={360} size={24} anchor="start" color={T.dim}>
              差距在哪（8k，µs）：灰色是实际，黑色是下限
            </Txt>
            {PARTS.map(([n, a, b], i) => (
              <g key={n}>
                <BarRow x={96} y={384 + i * 54} name={n} nameW={240} frac={a / 2300} max={720} value={`${a} / ${b}`} h={42} t={ramp(f, R1 + i * 15, 30)} color={T.dim} />
                {b > 0 && <Bar x={336} y={384 + i * 54} w={(b / 2300) * 720} h={42} t={ramp(f, R1 + i * 15 + 30, 30)} />}
              </g>
            ))}
          </g>
        )}
        {fl(f, R2) && (
          <g>
            <Box x={1272} y={384} w={552} h={126} inv label="verify GEMV 770 GB/s" sub="持续带宽的 98%，这里没有油水了" />
            <Box x={1272} y={528} w={552} h={126} red label="38% 时间内存是闲的" sub="注意力、norm、barrier 不怎么读内存" size={36} />
            <Txt x={96} y={684} size={24} anchor="start" color={T.sub}>
              想用满内存，就要让计算和读取在时间上重叠。但 draft 依赖上一轮 verify，这条链是串行的
            </Txt>
            <Txt x={96} y={726} size={24} anchor="start" color={T.sub}>
              试过让 tap 投影和后续层并行：实测没有可见改善，撤销。128k 的 K/V 读取则受 LDS 操作限制
            </Txt>
          </g>
        )}
      </Stage>
      <Caption title="离屋顶多远" en="DISTANCE TO THE ROOF" color={T.ink} desc="最贵的部分已经贴着屋顶，剩下的差距都在内存闲置的相位里" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- V.5 the itemized bill ---------- */
const STEPS: [string, string, number, number][] = [
  ['并行化', 'commit、embed、Markov 改成多 block 并行', 5.05, 4.93],
  ['Layer 表走 SMEM', 'SMEM 是标量 load，有自己的缓存，barrier 让 L1 失效也不受影响', 4.93, 4.77],
  ['累加行地址', 'GEMV 每单元 65 条标量指令降到 18 条', 4.77, 4.69],
  ['x 改 int8', 'v_dot4，指令少 25%，寄存器减半，溢出清零', 4.69, 4.47],
  ['只留一份 GEMV', '指令缓存有限：代码量也是性能', 4.47, 4.4],
  ['x 量化前移', '在 norm 写入端量化，每 block 不再各做一次', 4.4, 4.34],
  ['barrier 走 SMEM', '轮询不用排队等本 wave 在途的 load 返回', 4.34, 4.27],
  ['Q 只算一次', '和 fresh K/V 同一相位，其他 block 只读', 4.26, 4.2],
  ['少见路径外移', 'valid 判断移出热循环', 4.15, 4.06],
];
const SS = 60;
const SD = 72;

export const DsTricksCues: Cue[] = [
  ...STEPS.map((_, i): Cue => [SS + i * SD, 'step']),
  [SS + STEPS.length * SD + 12, 'reveal'],
];

export const DsTricks: React.FC = () => {
  const f = useF();
  const X = 1200;
  const sc = (ms: number) => ((ms - 3.8) / (5.05 - 3.8)) * 540;
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          8k，M ≈ 3.8，每轮 ms。全是一条一条量出来的
        </Txt>
        {STEPS.map(([a, b, x0, x1], i) => {
          if (!fl(f, SS + i * SD)) return null;
          const y = 210 + i * 66;
          return (
            <g key={a}>
              <Txt x={96} y={y + 15} size={24} anchor="start">
                {a}
              </Txt>
              <Txt x={96} y={y + 45} size={24} anchor="start" color={T.dim}>
                {b}
              </Txt>
              <Bar x={X} y={y + 6} w={sc(x1)} h={36} />
              <Bar x={X + sc(x1)} y={y + 6} w={sc(x0) - sc(x1)} h={36} color={T.red} t={ramp(f, SS + i * SD, 18)} />
              <Txt x={X + sc(x0) + 12} y={y + 24} size={24} anchor="start" family={FONT.pixelMono}>
                {x1.toFixed(2)}
              </Txt>
            </g>
          );
        })}
      </Stage>
      <Caption title="逐项账单" en="NOTHING BIG, ALL MEASURED" color={T.ink} desc="没有一招定胜负。小于 1% 的差异不可靠：相同逻辑编译两次也会差这么多" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- V.6 case: int8 x ---------- */
const INT8 = {
  card: 300,
  steps: [
    {at: 30, label: '收益'},
    {at: 240, label: '代价'},
    {at: 450, label: '回到测评'},
  ],
  reveal: 640,
};
export const DsInt8Cues: Cue[] = probCues(INT8, [[240, 'error']]);

export const DsInt8: React.FC = () => (
  <Problem
    no={4}
    color={T.ink}
    tag="取舍"
    title="每一个百分点都有价格"
    q={[
      ['把 GEMV 的输入 x 从 fp16 压成 int8（每 16 列一个 scale），'],
      ['每轮快 ', {t: '8% 到 15%', m: true}, '。可这次动的是 verify：也就是答案本身。'],
    ]}
    brief="这是全片唯一一处用精度换速度的决定"
    {...INT8}
    answerText="保留 int8，解码快一倍"
    insight="-DLFM3_F16 可以回退，但 fp16 路径需要 scratch 内存，这个驱动不提供。所以回退要先补驱动。"
  >
    {(sf) => (
      <Stage>
        {sf >= 30 && (
          <g>
            <Txt x={96} y={STAGE_TOP + 18} size={24} anchor="start" color={T.dim}>
              每轮 ms
            </Txt>
            <BarRow x={96} y={STAGE_TOP + 42} name="fp16 M≈3.8" nameW={210} frac={4.4 / 5.4} max={330} value="4.40" h={30} t={ramp(sf, 40, 24)} hollow />
            <BarRow x={96} y={STAGE_TOP + 84} name="int8 M≈3.8" nameW={210} frac={4.06 / 5.4} max={330} value="4.06" h={30} t={ramp(sf, 60, 24)} />
            <BarRow x={96} y={STAGE_TOP + 126} name="fp16 M≈6.3" nameW={210} frac={5.35 / 5.4} max={330} value="5.35" h={30} t={ramp(sf, 80, 24)} hollow />
            <BarRow x={96} y={STAGE_TOP + 168} name="int8 M≈6.3" nameW={210} frac={4.76 / 5.4} max={330} value="4.76" h={30} t={ramp(sf, 100, 24)} />
          </g>
        )}
        {sf >= 240 && (
          <Table
            x={768}
            y={STAGE_TOP}
            cols={[120, 180, 450, 306]}
            head={['x 格式', 'M', 'KL 均值', 'top-1 一致（/119）']}
            rows={[
              ['fp16', '1 / 4 / 7', '0.0004', '118 / 118 / 119'],
              [{t: 'int8', c: T.red}, '1 / 4 / 7', {t: '0.0028 / 0.0028 / 0.0022', c: T.red}, {t: '118 / 115 / 115', c: T.red}],
            ]}
            f={sf}
            at={240}
            step={24}
            size={24}
            rowH={48}
          />
        )}
        {sf >= 300 && (
          <Txt x={768} y={STAGE_TOP + 174} size={24} anchor="start" color={T.sub}>
            翻转都发生在第一名和第二名本来就很接近的地方
          </Txt>
        )}
        {sf >= 450 && (
          <g>
            <Txt x={96} y={STAGE_TOP + 264} size={24} anchor="start" color={T.dim}>
              真正关心的问题：答题还对吗？（MATH-500 + GPQA 各 20 题，greedy）
            </Txt>
            <BarRow x={96} y={STAGE_TOP + 294} name="不用 draft" nameW={210} frac={ACC_ND} max={600} value={ACC_ND_TXT} h={36} t={ramp(sf, 460, 24)} hollow />
            <BarRow x={96} y={STAGE_TOP + 342} name="DSpark" nameW={210} frac={ACC_DS} max={600} value={ACC_DS_TXT} h={36} t={ramp(sf, 490, 24)} />
          </g>
        )}
      </Stage>
    )}
  </Problem>
);
const ACC_ND = 28 / 40;
const ACC_DS = 29 / 40;
const ACC_ND_TXT = '28 / 40 题 · 293 / 291 tok/s';
const ACC_DS_TXT = '29 / 40 题 · 639 / 508 tok/s';

/* ---------- V.7 case: chaos ---------- */
const CHAOS = {
  card: 330,
  steps: [
    {at: 30, label: '抽签'},
    {at: 300, label: '循环'},
    {at: 560, label: '换方法'},
  ],
  reveal: 800,
};
export const DsChaosCues: Cue[] = probCues(CHAOS, [[120, 'error']]);

const RUN_A = [1206, 954, 613, 450, 307];
const RUN_B = [706, 406, 415, 412, 493];
const TIER = ['1k', '8k', '32k', '64k', '128k'];
const LOOPY: [string, string, string][] = [
  ['1k', '438', '481'],
  ['8k', '469', '499'],
  ['32k', '417', '455'],
  ['64k', '406', '471'],
  ['128k', '317', '334'],
];

export const DsChaos: React.FC = () => (
  <Problem
    no={5}
    color={T.ink}
    tag="混沌"
    title="这个中位数是抽签"
    q={[
      ['一处几乎没影响的策略改动，1k 从 ', {t: '1206', m: true}, ' 掉到 ', {t: '706', m: true}, '，128k 从 ', {t: '307', m: true}, ' 涨到 ', {t: '493', m: true}, '。'],
      ['kernel 没变慢，而是 τ 变了：M 不同，浮点取整就不同，近似打平的位置换一条路，'],
      ['后面的文本和 τ 就全都不一样了。'],
    ]}
    brief="tok/s = τ / R：R 可以比，单条流的 τ 不能比"
    {...CHAOS}
    answerText="正常文本上 Go 快 5% 到 16%"
    insight="比较 R，用固定序列回放比较策略，用多条流看分布。3 条流的中位数可以汇报，不能用来挑配置。"
  >
    {(sf) => (
      <Stage>
        {sf >= 30 && (
          <g>
            <Txt x={96} y={STAGE_TOP + 18} size={24} anchor="start" color={T.dim}>
              同一批 prompt，几乎相同的 kernel（tok/s）
            </Txt>
            {TIER.map((t, i) => (
              <g key={t}>
                <Txt x={210} y={STAGE_TOP + 66 + i * 48} size={24} anchor="end">
                  {t}
                </Txt>
                <Bar x={228} y={STAGE_TOP + 48 + i * 48} w={(RUN_A[i] / 1300) * 480} h={18} t={ramp(sf, 40 + i * 12, 24)} />
                <Bar x={228} y={STAGE_TOP + 66 + i * 48} w={(RUN_B[i] / 1300) * 480} h={18} t={ramp(sf, 120 + i * 12, 24)} color={T.red} />
                {sf >= 120 + i * 12 + 24 && (
                  <Txt x={732} y={STAGE_TOP + 66 + i * 48} size={24} anchor="start" family={FONT.pixelMono} color={T.sub}>
                    {RUN_A[i]} / {RUN_B[i]}
                  </Txt>
                )}
              </g>
            ))}
          </g>
        )}
        {sf >= 300 && (
          <g>
            <Box x={1032} y={STAGE_TOP + 18} w={792} h={108} label="SIGNATURE SIGNATURE SIGNATURE ..." sub="截断的 agent 轨迹 + ignore_eos：模型跑过结束点，掉进循环" size={36} mono />
            <Line x={1032} y={STAGE_TOP + 162} text="这种循环 vLLM 和不用 draft 的路径上都有" f={sf} at={320} />
            <Line x={1032} y={STAGE_TOP + 204} text="好猜的循环能到 1300 tok/s，难猜的只有 250" f={sf} at={360} />
            <Line x={1032} y={STAGE_TOP + 246} text="哪条流掉进哪种循环，就是抽签" f={sf} at={400} color={T.red} />
          </g>
        )}
        {sf >= 560 && (
          <g>
            <Txt x={96} y={STAGE_TOP + 336} size={24} anchor="start" color={T.dim}>
              换成 72 条流（去掉 prompt 开头的 16 × v 个 token 造出来），把循环流分开看。非循环流均值 tok/s，vLLM → Go：
            </Txt>
            {LOOPY.map(([t, a, b], i) => (
              <g key={t}>
                <Box x={96 + i * 234} y={STAGE_TOP + 366} w={222} h={84} label={`${a} → ${b}`} sub={t} size={24} inv={sf >= 700} mono />
              </g>
            ))}
          </g>
        )}
      </Stage>
    )}
  </Problem>
);

/* ---------- V.8 crossing the block boundary ---------- */
const C0 = 30;
const C1 = 280;
const C2 = 540;

export const DsCrossCues: Cue[] = [
  [C0, 'step'],
  [C1, 'step'],
  [C2, 'reveal'],
];

const Blocks: React.FC<{y: number; a: number; m: number; clip: boolean; f: number}> = ({y, a, m, clip, f}) => {
  const end = clip ? Math.min(a + m, 32) : a + m;
  return (
    <g>
      <Cells
        x={96}
        y={y}
        cols={44}
        rows={1}
        size={30}
        gap={6}
        fill={(i) => {
          if (i < a) return T.dim;
          if (i < end) return T.ink;
          if (i < a + m) return f % 30 < 18 ? T.red : T.paper2;
          return T.paper2;
        }}
      />
      <rect x={96 + 32 * 36 - 6} y={y - 12} width={6} height={54} fill={T.red} />
    </g>
  );
};

export const DsCross: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        {fl(f, C0) && (
          <g>
            <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
              vLLM：卷积状态只能在 32 token 的 block 边界存检查点，所以 launch 必须停在边界上
            </Txt>
            <Blocks y={216} a={29} m={6} clip f={f} />
            <Txt x={96} y={276} size={24} anchor="start" color={T.red}>
              快到边界时，M 被截短（红色闪烁的部分不能验证）。这里每 32 个位置都吃一次亏
            </Txt>
          </g>
        )}
        {fl(f, C1) && (
          <g>
            <Txt x={96} y={342} size={24} anchor="start" color={T.dim}>
              Go 版本：verify 可以越过边界，launch 过界后才停
            </Txt>
            <Blocks y={372} a={29} m={6} clip={false} f={f} />
            <Line x={96} y={432} text="过界的位置落在下一页，所以先把下一页映射好" f={f} at={C1 + 12} />
            <Line x={96} y={474} text="边界处的卷积状态怎么办？kernel 收尾时从历史环里写一份（过界不超过一轮，还没被覆盖）" f={f} at={C1 + 48} />
          </g>
        )}
        {fl(f, C2) && (
          <g>
            <Table
              x={96}
              y={522}
              cols={[420, 240, 240, 180]}
              head={['固定序列回放（step10260）', 'block 截断', '跨边界', '增益']}
              rows={[
                ['8k 均值 tok/s', '595.8', '603.5', '+1.3%'],
                ['128k 均值 tok/s', '282.0', '283.6', '+0.6%'],
              ]}
              f={f}
              at={C2}
              step={24}
              rowH={48}
            />
            <Say who={SAGE} x={1200} y={546} text={'不大，但是真的。\n基准里那些翻倍的数字，\n大部分是抽签。'} f={f} at={C2 + 30} w={480} s={6} />
            <Txt x={96} y={708} size={24} anchor="start" color={T.sub}>
              验证：用跨界 kernel 留下的 K/V 和检查点热启动，和纯冷启动比 logprob，差距和无 draft 路径同量级
            </Txt>
          </g>
        )}
      </Stage>
      <Caption title="越过 block 边界" en="DON'T STOP AT THE LINE" color={T.ink} desc="只有自己管调度才做得到的一点优化。它很小，所以报告里只记它真实的大小" delay={24} />
    </AbsoluteFill>
  );
};

export {EVE, Wire, COL};
