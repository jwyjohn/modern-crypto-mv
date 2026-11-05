import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ActTitle} from '../components/ActTitle';
import {Txt} from '../components/kit';
import {EVE, SAGE} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {Caption} from '../components/ui';
import {COL, FONT} from '../theme';
import {Bar, BarRow, Box, Cells, fl, ramp, Say, Stage, T, Wire} from './lib';

export const HwTitle: React.FC = () => (
  <ActTitle
    num="01"
    zh="一张卡"
    en="THE CARD"
    color={COL.ink}
    topics={['CU 与 wave', '存储层级', '点积指令', 'Roofline', '功耗墙']}
    quote="先弄清楚硬件能做什么，再谈优化"
    by="AMD Radeon Instinct MI50 · 32 GB · 2018"
  />
);

/* ---------- I.1 from chip to wave ---------- */
const CU0 = 30;
const ZOOM = 240;
const WAVE = 420;
const BLOCK = 600;

export const HwChipCues: Cue[] = [
  [CU0, 'blip'],
  [ZOOM, 'whoosh'],
  [WAVE, 'step'],
  [BLOCK, 'reveal'],
];

export const HwChip: React.FC = () => {
  const f = useF();
  const n = Math.floor(ramp(f, CU0, 150, 60) * 60);
  const hot = f >= ZOOM;
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          Vega 20 · 60 个计算单元（CU）
        </Txt>
        {new Array(60).fill(0).map((_, i) => {
          const x = 96 + (i % 10) * 66;
          const y = 216 + Math.floor(i / 10) * 66;
          if (i >= n) return null;
          return <rect key={i} x={x} y={y} width={54} height={54} fill={hot && i === 23 ? T.inv : T.paper} stroke={T.ink} strokeWidth={3} />;
        })}
        {fl(f, 200) && (
          <g>
            <rect x={96} y={624} width={648} height={3} fill={T.ink} />
            <Txt x={96} y={660} size={24} anchor="start">
              HBM2 显存 32 GB，所有 CU 共用
            </Txt>
          </g>
        )}
        {hot && (
          <g>
            <rect x={96 + 3 * 66 + 54} y={216 + 2 * 66 + 24} width={840 - 3 * 66 - 54 + 96} height={3} fill={T.ink} />
            <Box x={840} y={174} w={984} h={456} />
            <Txt x={870} y={210} size={24} anchor="start" color={T.dim}>
              一个 CU：4 个 SIMD，每个 SIMD 16 条车道
            </Txt>
            {[0, 1, 2, 3].map((s) => (
              <g key={s}>
                <Txt x={870} y={270 + s * 84} size={24} anchor="start" family={FONT.pixelMono}>
                  SIMD{s}
                </Txt>
                <Cells x={966} y={246 + s * 84} cols={16} rows={1} size={30} gap={6} fill={(i) => (f >= WAVE && s === 0 ? T.ink : f >= BLOCK ? T.ink : i >= 0 ? T.paper2 : undefined)} />
              </g>
            ))}
            {fl(f, WAVE) && (
              <Txt x={870} y={594} size={24} anchor="start" color={T.ink}>
                wave = 64 条车道同跑一条指令，16 条车道一拍，4 拍发完
              </Txt>
            )}
          </g>
        )}
        {fl(f, BLOCK) && (
          <g>
            <Box x={96} y={702} w={840} h={120} inv label="1 block = 256 线程 = 4 个 wave" sub="一个 block 绑一个 CU" />
            <Box x={984} y={702} w={840} h={120} label="整张卡：60 block × 256 线程" sub="这里的 megakernel 就这样派发" />
          </g>
        )}
      </Stage>
      <Caption title="GPU 不是更快的 CPU" en="COMPUTE UNITS" color={T.ink} desc="它是几千条车道一起走：同一条指令，一次算 64 个数" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- I.2 memory ladder ---------- */
const RUNGS: {name: string; size: string; note: string; frac: number; red?: boolean}[] = [
  {name: 'VGPR 寄存器', size: '每 wave 256 个', note: '一条向量指令约 2.3 ns', frac: 1},
  {name: 'LDS 共享内存', size: '每 CU 64 KB，wave 之间传数据', note: '4 个 wave 同访：21 ns 一次 ≈ 9 条指令', frac: 0.74},
  {name: 'L2 缓存', size: '实测约 8 MB', note: '循环读 8 MB：1605 GB/s', frac: 0.52},
  {name: 'HBM2 显存', size: '32 GB', note: '持续读 785 GB/s（理论 1024）', frac: 0.26, red: true},
];
const R0 = 48;
const FACT = 500;
const MISS = 690;

export const HwMemCues: Cue[] = [
  [R0, 'blip'],
  [R0 + 110, 'blip'],
  [R0 + 220, 'blip'],
  [R0 + 330, 'blip'],
  [FACT, 'bell'],
  [MISS, 'reveal'],
];

export const HwMem: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          离车道越远，容量越大，也越慢
        </Txt>
        {RUNGS.map((r, i) => {
          if (!fl(f, R0 + i * 110)) return null;
          const y = 222 + i * 108;
          const w = 480 + i * 150;
          return (
            <g key={i}>
              <Box x={96} y={y} w={w} h={84} label={r.name} sub={r.size} inv={i === 3} />
              <Txt x={96 + w + 30} y={y + 42} size={24} anchor="start" color={r.red ? T.red : T.sub}>
                {r.note}
              </Txt>
            </g>
          );
        })}
        {fl(f, FACT) && (
          <g>
            <Box x={96} y={672} w={840} h={150} label="decode 每个 token 要把 1.76 GB 权重读一遍" sub="读不进缓存：权重比 L2 大 200 倍" size={24} />
          </g>
        )}
        {fl(f, MISS) && <Box x={984} y={672} w={840} h={150} inv label="所以带宽就是天花板" sub="785 GB/s 是实测，只有理论值的 77%，原因至今没查清" size={36} />}
      </Stage>
      <Caption title="存储层级" en="MEMORY HIERARCHY" color={T.ink} desc="优化大部分时候是在回答一个问题：这个数据放在哪一层" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- I.3 dot-product instructions ---------- */
const A = [12, -7, 90, 3];
const B = [55, 2, -11, 8];
const D0 = 60;
const D1 = 300;
const D2 = 570;

export const HwDotCues: Cue[] = [
  [D0, 'step'],
  [D1, 'reveal'],
  [D2, 'bell'],
];

export const HwDot: React.FC = () => {
  const f = useF();
  const k = Math.min(4, Math.floor((f - D0) / 45) + 1);
  const sum = A.slice(0, Math.max(0, k)).reduce((acc, a, i) => acc + a * B[i], 0);
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={186} size={24} anchor="start" color={T.dim}>
          神经网络里几乎全是一件事：a₀b₀ + a₁b₁ + a₂b₂ + a₃b₃ …
        </Txt>
        {f >= D0 && (
          <g>
            {A.map((a, i) => (
              <g key={i}>
                <Box x={240 + i * 132} y={222} w={120} h={72} label={a} inv={i < k} mono />
                <Box x={240 + i * 132} y={306} w={120} h={72} label={B[i]} inv={i < k} mono />
              </g>
            ))}
            <Txt x={216} y={258} size={24} anchor="end" family={FONT.pixelMono}>
              a
            </Txt>
            <Txt x={216} y={342} size={24} anchor="end" family={FONT.pixelMono}>
              b
            </Txt>
            <Wire x0={780} y0={300} x1={870} y1={300} t={ramp(f, D0, 60)} />
            <Box x={882} y={258} w={240} h={84} label={sum} mono />
          </g>
        )}
        {fl(f, D1) && (
          <g>
            <Box x={96} y={432} w={816} h={132} inv label="v_dot4：一条指令 4 组 int8 乘加" sub="全卡峰值约 47 TOPS（每秒万亿次运算）" />
            <Box x={1008} y={432} w={816} h={132} label="v_dot2：一条指令 2 组 fp16 乘加" sub="全卡峰值约 24.6 TFLOPS" />
          </g>
        )}
        {fl(f, D2) && (
          <g>
            <BarRow x={96} y={618} name="int8" nameW={150} frac={47 / 50} max={1400} value="47" t={ramp(f, D2, 48)} />
            <BarRow x={96} y={666} name="fp16" nameW={150} frac={24.6 / 50} max={1400} value="24.6" t={ramp(f, D2, 48)} hollow />
            <Txt x={96} y={744} size={24} anchor="start" color={T.sub}>
              把数据压成 int8，不只是省内存：同样的时钟多算一倍，寄存器还减半
            </Txt>
          </g>
        )}
      </Stage>
      <Caption title="点积指令" en="V_DOT4 / V_DOT2" color={T.ink} desc="后面所有矩阵运算，最后都落到这两条指令上" delay={24} />
    </AbsoluteFill>
  );
};

/* ---------- I.4 roofline + power ---------- */
const P0 = 36;
const P1 = 240;
const P2 = 480;
const P3 = 690;
const GX = 240;
const GY = 660;
const GW = 780;
const GH = 408;

export const HwRoofCues: Cue[] = [
  [P0, 'step'],
  [P1, 'reveal'],
  [P2, 'bell'],
  [P3, 'chime'],
];

export const HwRoof: React.FC = () => {
  const f = useF();
  const knee = GX + GW * 0.45;
  const t = ramp(f, P0, 120, 24);
  return (
    <AbsoluteFill>
      <Stage>
        <rect x={GX} y={GY - GH} width={3} height={GH} fill={T.ink} />
        <rect x={GX} y={GY} width={GW} height={3} fill={T.ink} />
        <Txt x={GX - 18} y={GY - GH + 18} size={24} anchor="end">
          性能
        </Txt>
        <Txt x={GX + GW} y={GY + 36} size={24} anchor="end">
          每读 1 字节要做多少计算
        </Txt>
        {/* the roof */}
        {new Array(24).fill(0).map((_, i) => {
          const u = (i + 1) / 24;
          if (u > t) return null;
          const x = GX + u * GW;
          const y = x < knee ? GY - ((x - GX) / (knee - GX)) * (GH - 60) : GY - GH + 60;
          return <rect key={i} x={Math.round(x / 6) * 6 - 18} y={Math.round(y / 6) * 6} width={33} height={6} fill={T.ink} />;
        })}
        {fl(f, P1) && (
          <g>
            <Txt x={GX + 60} y={GY - 300} size={24} anchor="start">
              斜坡：内存带宽限制
            </Txt>
            <Txt x={knee + 30} y={GY - GH + 30} size={24} anchor="start">
              屋顶：计算能力限制
            </Txt>
            <rect x={GX + GW * 0.12} y={GY - (GH - 60) * 0.27 - 9} width={18} height={18} fill={T.red} />
            <Txt x={GX + GW * 0.12 + 30} y={GY - (GH - 60) * 0.27} size={24} anchor="start" color={T.red}>
              decode 的 GEMV
            </Txt>
            <rect x={GX + GW * 0.7} y={GY - GH + 60 - 9} width={18} height={18} fill={T.red} />
            <Txt x={GX + GW * 0.7} y={GY - GH + 96} size={24} anchor="start" color={T.red}>
              prefill 的注意力
            </Txt>
          </g>
        )}
        {fl(f, P2) && (
          <g>
            <Box x={1080} y={204} w={744} h={108} inv label="功耗墙 178 W" sub="power1_cap_max 也是 178 W，调不上去" />
            <BarRow x={1080} y={336} name="只读内存" nameW={180} frac={174 / 178} max={360} value="174 W" t={ramp(f, P2, 30)} />
            <BarRow x={1080} y={384} name="sclk 空载" nameW={180} frac={1} max={360} value="1800 MHz" t={ramp(f, P2 + 30, 30)} hollow />
            <BarRow x={1080} y={432} name="sclk 负载" nameW={180} frac={1530 / 1800} max={360} value="1530 MHz" t={ramp(f, P2 + 60, 30)} color={T.red} />
          </g>
        )}
        {f >= P3 && <Say who={EVE} x={1080} y={504} text={'内存把电用完了，\n计算只好降频 15%。\n省能量的指令，能换回频率。'} f={f} at={P3} w={540} />}
      </Stage>
      <Caption title="Roofline" en="THE ROOF" color={T.ink} desc="离屋顶多远，就是还能优化多少。屋顶之上，什么技巧都没用" delay={24} />
    </AbsoluteFill>
  );
};

export {SAGE, Bar};
