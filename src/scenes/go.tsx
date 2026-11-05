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
    zh="读得满"
    en="KEEP THE MEMORY BUSY"
    color={COL.ink}
    topics={['叠起等待', '在途 load', '一处竞争', '直连 KFD', 'L2 回写']}
    quote="字节一个没少，只是不再让内存闲着"
    by="利用率 55% → 68%"
  />
);

/* ---------- the stack ---------- */
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
      <Caption title="直连驱动" en="TALK TO KFD DIRECTLY" color={T.ink} desc="kernel 之外的每一毫秒，内存都闲着。所以把外面那一圈全拿掉" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- L2 writeback ---------- */
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
        {fl(f, W3) && <Box x={1296} y={684} w={528} h={108} inv label="带宽 66% → 68%" sub="128k：200.5 → 208.1，驱动每 token 只多 0.04 ms" />}
        {f >= W0 && !blink && f < W1 && <rect x={870} y={348} width={12} height={36} fill={T.red} />}
      </Stage>
      <Caption title="缓存一致性" en="WHO NEEDS THE FLUSH?" color={T.ink} desc="两边 kernel 耗时相同。省下这次回写，利用率从 66% 到 68%" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- case: the h_old race ---------- */
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
      ['为了不让内存闲着，kernel 在等 barrier 之前就预取下一阶段的数据。'],
      ['放到自己写的驱动下，', {t: '超过 16 个 block', m: true}, ' 就开始算错。ROCr 下同样的逐位比较却能通过。'],
    ]}
    brief="预取抢跑了：kernel 一直是错的，只是以前没撞上"
    {...RACE}
    answerText="预取移到 barrier 之后"
    insight="叠起等待是有代价的：load 不能早于数据写好。能抓住这种错的测试只有一种：多次运行，logits 逐位相同。"
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

export {ALICE, SAGE, FONT, Bar, Line, Table};
