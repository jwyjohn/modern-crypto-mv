import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ActTitle} from '../components/ActTitle';
import {Txt} from '../components/kit';
import {ALICE, SAGE, YUZU} from '../components/pixel';
import {Cue, Problem, probCues, STAGE_TOP} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {COL, FONT} from '../theme';
import {Bar, BarRow, Box, fl, Line, ramp, Say, Stage, T, Table, Wire} from './lib';

export const GoTitle: React.FC = () => (
  <ActTitle
    num="04"
    zh="脱掉外壳"
    en="DOWN TO THE DRIVER"
    color={COL.ink}
    topics={['直连 KFD', 'AQL 队列', 'L2 回写', '两处竞争', '一个文件']}
    quote="kernel 已经够快了，慢的是它外面那一圈"
    by="1100 行 Go 代替整个 ROCm 用户态"
  />
);

/* ---------- IV.1 the stack ---------- */
const OLD = ['vLLM · Python', 'PyTorch', 'HIP · ROCr', 'comgr · LLVM'];
const S0 = 24;
const S1 = 180;
const S2 = 390;
const S3 = 690;

export const GoStackCues: Cue[] = [
  [S1, 'whoosh'],
  [S2, 'step'],
  [S3, 'reveal'],
];

const PACKET: [string, string, number][] = [
  ['header', 'fence · barrier', 3],
  ['workgroup', '256', 2],
  ['grid', '60 × 256', 3],
  ['kernel', '代码地址', 3],
  ['kernarg', '参数地址', 3],
];

export const GoStack: React.FC = () => {
  const f = useF();
  const off = ramp(f, S1, 90, 15);
  return (
    <AbsoluteFill>
      <Stage>
        {OLD.map((s, i) => {
          const dx = off * (i % 2 ? 1 : -1) * 1400;
          if (off >= 1) return null;
          return <Box key={s} x={96 + dx} y={180 + i * 66} w={576} h={60} label={s} size={24} dash={off > 0} />;
        })}
        {fl(f, S1 + 60) && <Box x={96} y={180} w={576} h={258} inv label="一个静态 Go 程序" sub="CGO_ENABLED=0 · 没有第三方依赖" />}
        <Box x={96} y={450} w={576} h={60} label="/dev/kfd · 内核驱动" size={24} />
        <Box x={96} y={516} w={576} h={60} label="MI50" size={24} dark />
        {fl(f, S2) && (
          <g>
            <Txt x={768} y={186} size={24} anchor="start" color={T.dim}>
              让 GPU 干活只需要三步
            </Txt>
            <Line x={768} y={228} text="1  ioctl：开设备、分配显存、建队列" f={f} at={S2} />
            <Line x={768} y={270} text="2  往环形队列写一个 64 字节的 AQL 包" f={f} at={S2 + 30} />
            <Line x={768} y={312} text="3  写 doorbell 寄存器，告诉命令处理器来取" f={f} at={S2 + 60} />
            {PACKET.map(([a, b, w], i) => {
              const xs = [768, 1032, 1224, 1458, 1644];
              return fl(f, S2 + 90 + i * 12) ? (
                <g key={a}>
                  <Box x={xs[i]} y={354} w={[258, 186, 228, 180, 180][i]} h={96} label={a} sub={b} size={24} inv={i === 0} />
                  {w < 0 && null}
                </g>
              ) : null;
            })}
            <Line x={768} y={492} text="kernel 仍是 HIP C++，预编译成 code object，用 go:embed 嵌进来" f={f} at={S2 + 180} color={T.sub} />
            <Line x={768} y={534} text="怎么确认对：抓 ROCr 真实发出的 ioctl 和 AQL 包，逐字段比对" f={f} at={S2 + 220} color={T.sub} />
          </g>
        )}
        {fl(f, S3) && (
          <g>
            <BarRow x={96} y={624} name="启动 vLLM" nameW={180} frac={1} max={760} value="约 38 s" t={ramp(f, S3, 24)} hollow />
            <BarRow x={96} y={672} name="启动 Go" nameW={180} frac={5 / 38} max={760} value="约 5 s" t={ramp(f, S3 + 24, 24)} />
            <Txt x={96} y={756} size={24} anchor="start" color={T.sub}>
              代价：只支持这一款 GPU，没有 scratch 内存，kernel 不能往栈上溢出寄存器
            </Txt>
          </g>
        )}
        {f >= S3 + 90 && <Say who={YUZU} x={1416} y={624} text={'我只要一个队列、\n一个设备。'} f={f} at={S3 + 90} w={252} s={6} left />}
      </Stage>
      <Caption title="直连驱动" en="TALK TO KFD DIRECTLY" color={T.ink} desc="ROCm 能做一切；这里只用到一个队列、一个设备、几个预编译的 kernel" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- IV.2 L2 writeback ---------- */
const W0 = 30;
const W1 = 270;
const W2 = 540;
const W3 = 720;

export const GoL2Cues: Cue[] = [
  [W0, 'step'],
  [W1, 'bell'],
  [W2, 'reveal'],
  [W3, 'chime'],
];

export const GoL2: React.FC = () => {
  const f = useF();
  const blink = Math.floor(f / 30) % 2 === 0;
  return (
    <AbsoluteFill>
      <Stage>
        <Box x={96} y={192} w={420} h={156} label="GPU kernel" sub="算出 1 个 token：4 字节" />
        <Box x={666} y={192} w={420} h={156} dark label="L2 缓存" sub="里面还有几 MB 的 KV 和权重" />
        <Box x={1236} y={192} w={588} h={156} label="CPU 读 token" sub="它看不见 GPU 的 L2" />
        <Wire x0={516} y0={270} x1={660} y1={270} />
        {f >= W0 && <Wire x0={1086} y0={270} x1={1230} y1={270} t={ramp(f, W0, 24)} />}
        {fl(f, W0 + 24) && (
          <g>
            <Txt x={96} y={396} size={24} anchor="start" color={T.red}>
              system scope：kernel 结束时把整个 L2 写回显存，CPU 才能安全读取
            </Txt>
            <Bar x={96} y={420} w={1728} h={42} t={ramp(f, W0 + 24, 48)} color={T.red} />
            <Txt x={960} y={441} size={24} color={T.invText}>
              每个 token 最多多花 0.9 ms
            </Txt>
          </g>
        )}
        {fl(f, W1) && (
          <g>
            <Txt x={96} y={510} size={24} anchor="start" color={T.dim}>
              可是 CPU 只要那 4 个字节
            </Txt>
            <Box x={96} y={534} w={840} h={108} inv label="token 直接写进不经缓存的主机内存" sub="GTT：GPU 能访问的主机内存。不进 L2，CPU 轮询就能看到" />
            <Box x={984} y={534} w={840} h={108} label="fence 只用 agent scope" sub="fence 决定写入要同步多远：agent 只到 GPU 自己，数据留在 L2" />
          </g>
        )}
        {fl(f, W2) && (
          <g>
            <Txt x={96} y={690} size={24} anchor="start">
              必须守住的规则
            </Txt>
            <Line x={96} y={726} text="· logits 这种大块数据，拷过去之后再写一个标记，标记到了才算到" f={f} at={W2 + 8} />
            <Line x={96} y={762} text="· 运行中要改的数据必须由 GPU 写：CPU 直接写显存（BAR）会绕过 L2，L2 里的旧值还在" f={f} at={W2 + 40} />
          </g>
        )}
        {fl(f, W3) && <Box x={1296} y={684} w={528} h={108} inv label="128k: 200.5 → 208.1" sub="驱动每 token 只多 0.04 ms" />}
        {f >= W0 && !blink && f < W1 && <rect x={870} y={348} width={12} height={36} fill={T.red} />}
      </Stage>
      <Caption title="缓存一致性" en="WHO NEEDS THE FLUSH?" color={T.ink} desc="两边的 kernel 耗时相同，decode 能超过 vLLM，主要靠省下这一次回写" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- IV.3 case: the h_old race ---------- */
const RACE = {
  card: 300,
  steps: [
    {at: 30, label: '现象'},
    {at: 240, label: '定位'},
    {at: 470, label: '修复'},
  ],
  reveal: 660,
};
export const GoRaceCues: Cue[] = probCues(RACE, [[120, 'error']]);

export const GoRace: React.FC = () => (
  <Problem
    no={2}
    color={T.ink}
    tag="竞争"
    title="第 0 层的旧值"
    q={[
      ['同一个 kernel，放到自己写的驱动下，', {t: '超过 16 个 block', m: true}, ' 就开始算错。'],
      ['ROCr 下同样的逐位比较测试却能通过。'],
    ]}
    brief="时序依赖：kernel 一直是错的，只是以前没撞上"
    {...RACE}
    answerText="预取移到 barrier 之后"
    insight="不同驱动的时序不同。能暴露问题的测试只有一种：同样的输入，多次运行，logits 逐位相同。"
  >
    {(sf) => {
      const t = (n: number) => ramp(sf, n, 30);
      return (
        <Stage>
          {sf >= 30 && (
            <g>
              <Txt x={96} y={STAGE_TOP + 18} size={24} anchor="start" color={T.dim}>
                两个 block 的时间线
              </Txt>
              <Txt x={270} y={STAGE_TOP + 72} size={24} anchor="end">
                block 0
              </Txt>
              <Bar x={288} y={STAGE_TOP + 48} w={420} h={48} t={t(30)} />
              <Txt x={498} y={STAGE_TOP + 72} size={24} color={T.invText}>
                写 h0（embedding）
              </Txt>
              <rect x={720} y={STAGE_TOP + 36} width={6} height={204} fill={T.ink} />
              <Txt x={723} y={STAGE_TOP + 258} size={24}>
                barrier
              </Txt>
              <Txt x={270} y={STAGE_TOP + 168} size={24} anchor="end">
                block k
              </Txt>
              <Bar x={288} y={STAGE_TOP + 144} w={240} h={48} t={t(60)} hollow />
              <Txt x={408} y={STAGE_TOP + 168} size={24}>
                等 barrier
              </Txt>
            </g>
          )}
          {sf >= 120 && (
            <g>
              <rect x={534} y={STAGE_TOP + 144} width={150} height={48} fill={T.red} />
              <Txt x={609} y={STAGE_TOP + 168} size={24} color={T.invText}>
                预取 h_old
              </Txt>
              <Txt x={534} y={STAGE_TOP + 216} size={24} anchor="start" color={T.red}>
                读到上一个 token 的 embedding
              </Txt>
            </g>
          )}
          {sf >= 240 && (
            <g>
              <Txt x={960} y={STAGE_TOP + 66} size={24} anchor="start">
                为了省时间，kernel 在等 barrier 之前就预取残差 h_old。
              </Txt>
              <Txt x={960} y={STAGE_TOP + 108} size={24} anchor="start">
                其他层都安全：h_old 是更早的阶段写的。
              </Txt>
              <Txt x={960} y={STAGE_TOP + 150} size={24} anchor="start" color={T.red}>
                只有第 0 层：h0 正是上一阶段由 block 0 写的。
              </Txt>
              <Txt x={960} y={STAGE_TOP + 192} size={24} anchor="start" color={T.red}>
                一整个 block 的这一 token，全算错。
              </Txt>
            </g>
          )}
          {sf >= 470 && (
            <g>
              <Txt x={96} y={STAGE_TOP + 330} size={24} anchor="start">
                只改一行：第 0 层的预取放到 barrier 之后
              </Txt>
              <BarRow x={96} y={STAGE_TOP + 354} name="kernel 耗时" nameW={210} frac={0.6} max={600} value="+0.6%" h={30} t={ramp(sf, 480, 24)} hollow />
              <Txt x={96} y={STAGE_TOP + 426} size={24} anchor="start" color={T.sub}>
                33 个测评请求的前 256 个 token，修复前后全部相同（ROCr 下）
              </Txt>
            </g>
          )}
        </Stage>
      );
    }}
  </Problem>
);

/* ---------- IV.4 case: the VM race ---------- */
const VM = {
  card: 300,
  steps: [
    {at: 30, label: '现象'},
    {at: 220, label: '根因'},
    {at: 450, label: '修复'},
  ],
  reveal: 600,
};
export const GoVmCues: Cue[] = probCues(VM, [[80, 'error']]);

export const GoVm: React.FC = () => (
  <Problem
    no={3}
    color={T.ink}
    tag="页表"
    title="偶尔卡死的启动"
    q={[
      ['在 vLLM 旁边启动时，程序偶尔', {t: '卡死', c: COL.red}, '。'],
      ['正常运行时完全没事，直到某个 wave 被抢占。'],
      ['任何进程的队列变化，都会触发抢占。'],
    ]}
    brief="用 debugfs 遍历页表，看到有一项不见了"
    {...VM}
    answerText="kfd.Open 等 200 ms"
    insight="ROCr 两次调用之间间隔够长，所以从来没遇到。它的「慢」恰好是这个竞争的解法。"
  >
    {(sf) => (
      <Stage>
        {sf >= 30 && (
          <g>
            <Box x={96} y={STAGE_TOP + 24} w={420} h={84} label="打开 render 节点" size={24} />
            <Wire x0={516} y0={STAGE_TOP + 66} x1={576} y1={STAGE_TOP + 66} />
            <Box x={582} y={STAGE_TOP + 24} w={420} h={84} inv label="ACQUIRE_VM" sub="KFD 写 trap handler 的页表项" />
            <Bar x={96} y={STAGE_TOP + 138} w={1100} h={42} t={ramp(sf, 80, 60)} color={T.red} />
            {sf >= 140 && (
              <Txt x={120} y={STAGE_TOP + 159} size={24} anchor="start" color={T.invText}>
                内核的异步页表更新还在跑，约 1 ms
              </Txt>
            )}
          </g>
        )}
        {sf >= 220 && (
          <g>
            <Txt x={96} y={STAGE_TOP + 240} size={24} anchor="start" color={T.red}>
              两者一重叠：刚写好的页目录项被覆盖了
            </Txt>
            <Line x={96} y={STAGE_TOP + 288} text="进程照常运行，因为平时用不到 trap handler（抢占时保存现场的代码）" f={sf} at={240} />
            <Line x={96} y={STAGE_TOP + 330} text="被抢占的 wave 要跳进 trap handler，取不到指令，队列随之卡死" f={sf} at={280} />
            <Line x={96} y={STAGE_TOP + 372} text="vLLM 启动时的内存压缩让 KFD 重启队列，正好触发" f={sf} at={320} />
          </g>
        )}
        {sf >= 450 && (
          <g>
            <Table
              x={1236}
              y={STAGE_TOP + 216}
              cols={[300, 288]}
              head={['只建队列的进程', 'CPF 故障']}
              rows={[
                ['修复前 约 1500 次', '2 次'],
                ['修复后 约 600 次', '0 次'],
              ]}
              f={sf}
              at={450}
              step={24}
              rowH={48}
            />
            <Txt x={1236} y={STAGE_TOP + 390} size={24} anchor="start" color={T.dim}>
              次数太少，还不能下结论
            </Txt>
          </g>
        )}
      </Stage>
    )}
  </Problem>
);

/* ---------- IV.5 one file ---------- */
const P0 = 30;
const P1 = 270;
const P2 = 510;

export const GoBinCues: Cue[] = [
  [P0, 'step'],
  [P1, 'bell'],
  [P2, 'reveal'],
];

const PL = (mib: number) => (mib / 2400) * 1560;

export const GoBin: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          Go 的链接器不接受 2 GB 以上的数据段，所以权重接在 ELF 后面，启动时映射自己
        </Txt>
        {fl(f, P0) && (
          <g>
            <Txt x={240} y={246} size={24} anchor="end">
              原来
            </Txt>
            <rect x={258} y={222} width={PL(8)} height={48} fill={T.ink} />
            <Box x={258 + PL(8)} y={222} w={PL(1490)} h={48} label="int8 权重 1.5 GB" size={24} dark />
            <Box x={258 + PL(1498)} y={222} w={PL(260)} h={48} label="LM head" size={24} />
            <Box x={258 + PL(1758)} y={222} w={PL(500)} h={48} label="embedding" size={24} dark />
            <Txt x={258 + PL(2300)} y={246} size={24} anchor="start">
              2.3 GB
            </Txt>
          </g>
        )}
        {fl(f, P1) && (
          <g>
            <Txt x={96} y={318} size={24} anchor="start" color={T.dim}>
              不存能算出来的东西
            </Txt>
            <Line x={96} y={360} text="· prefill 布局：和 decode 同一批 int8，只是排列不同。启动时现算，少存 1.5 GB" f={f} at={P1} />
            <Line x={96} y={402} text="· LM head：就是量化后的 embedding。现算，少存 260 MB" f={f} at={P1 + 40} />
            <Line x={96} y={444} text="· drafter 的 head 裁剪和 k/v 投影：从已有的行直接抄" f={f} at={P1 + 80} />
            <Line x={96} y={486} text="· 量化是逐行独立的，所以这些行和单独量化的结果逐字节相同" f={f} at={P1 + 120} color={T.sub} />
          </g>
        )}
        {fl(f, P2) && (
          <g>
            <Txt x={96} y={540} size={24} anchor="start" color={T.dim}>
              再做熵编码（Huffman，分块并行解码）
            </Txt>
            <BarRow x={96} y={564} name="int8 权重" nameW={210} frac={0.93} max={720} value="只省 7%：接近随机噪声" t={ramp(f, P2, 24)} h={30} />
            <BarRow x={96} y={606} name="embedding" nameW={210} frac={0.664} max={720} value="省 34%：BF16 转 fp16，低 3 位全是 0" t={ramp(f, P2 + 24, 24)} h={30} />
            <Txt x={240} y={702} size={24} anchor="end">
              现在
            </Txt>
            <rect x={258} y={678} width={PL(8)} height={48} fill={T.ink} />
            <Box x={258 + PL(8)} y={678} w={PL(1539)} h={48} label="权重 + DSpark drafter 1.6 GB" size={24} inv />
            <Box x={258 + PL(1547)} y={678} w={PL(332)} h={48} label="embedding" size={24} dark />
            <Txt x={258 + PL(1900)} y={702} size={36} anchor="start">
              1.97 GB
            </Txt>
            <Txt x={96} y={768} size={24} anchor="start" color={T.sub}>
              还多装了一个模型，反而小了 15%。启动从 5 秒变成 7.5 秒
            </Txt>
          </g>
        )}
      </Stage>
      <Caption title="一个文件" en="SELF-CONTAINED ELF" color={T.ink} desc="不需要 Python，不需要 ROCm，不需要 libc。拷到另一台同样的机器就能跑" delay={24} />
    </AbsoluteFill>
  );
};

export {ALICE, SAGE, FONT};
