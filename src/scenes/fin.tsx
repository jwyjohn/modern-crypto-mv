import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CITES, EXTRA_CREDITS} from '../cites';
import {Txt} from '../components/kit';
import {ALICE, BlockCursor, BOB, EVE, SAGE, Sprite, YUZU} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {COL, FONT, PX, snap} from '../theme';
import {Bar, BarRow, Box, fl, Line, ramp, Stage, T, Table} from './lib';

/* ---------- the result: the bandwidth account, step by step ---------- */
const A0 = 30;
const A1 = 420;
const A2 = 660;

export const ResultCues: Cue[] = [
  [A0, 'step'],
  [A1, 'reveal'],
  [A2, 'chime'],
];

const STAGES: [string, string, number, string, boolean?][] = [
  ['起点', '约 5 GB', 21, '32'],
  ['W4（输出错误）', '约 1.7 GB', 29, '132', true],
  ['W8，修好精度', '2.57 GB', 55, '167'],
  ['把等待叠在一起', '2.57 GB', 66, '201'],
  ['Go · 直连 KFD', '2.57 GB', 68, '208'],
  ['DSpark', '1.35 GB', 58, '334'],
];

export const Result: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={72} size={48} anchor="start">
          七天的账
        </Txt>
        <Txt x={1824} y={72} size={24} anchor="end" color={T.dim}>
          LFM3-1.7B · 128k 上下文 · 单流 decode
        </Txt>
        <Txt x={96} y={138} size={24} anchor="start" color={T.dim}>
          阶段
        </Txt>
        <Txt x={720} y={138} size={24} anchor="end" color={T.dim}>
          每 token 读
        </Txt>
        <Txt x={768} y={138} size={24} anchor="start" color={T.dim}>
          带宽利用率 U（785 GB/s = 100%）
        </Txt>
        <Txt x={1824} y={138} size={24} anchor="end" color={T.dim}>
          tok/s
        </Txt>
        <rect x={96} y={162} width={1728} height={3} fill={T.ink} />
        {STAGES.map(([n, gb, u, tps, bad], i) => {
          if (!fl(f, A0 + i * 54)) return null;
          const y = 204 + i * 72;
          const c = bad ? T.red : T.ink;
          return (
            <g key={n}>
              <Txt x={96} y={y} size={36} anchor="start" color={c}>
                {n}
              </Txt>
              <Txt x={720} y={y} size={36} anchor="end" color={c} family={FONT.pixelMono}>
                {gb}
              </Txt>
              <rect x={768} y={y - 21} width={720} height={42} fill={T.paper} stroke={T.ink} strokeWidth={3} />
              <Bar x={768} y={y - 21} w={720 * (u / 100)} h={42} t={ramp(f, A0 + i * 54, 30)} color={c} />
              <Txt x={1512} y={y} size={36} anchor="start" color={c} family={FONT.pixelMono}>
                {u}%
              </Txt>
              <Txt x={1824} y={y} size={36} anchor="end" color={c} family={FONT.pixelMono}>
                {tps}
              </Txt>
            </g>
          );
        })}
        {fl(f, A1) && (
          <g>
            <Box x={96} y={636} w={1092} h={120} inv label="785 GB/s × 58% ÷ 1.35 GB ≈ 337 tok/s" sub="开头那条式子，和实测的 334 对得上" />
            <Box x={1236} y={636} w={588} h={120} label="每个字节换来的 token：翻倍" sub="利用率：还有 42% 没用上" />
          </g>
        )}
        {fl(f, A2) && (
          <Txt x={96} y={804} size={24} anchor="start" color={T.sub}>
            三根杠杆都动过：量化把每 token 从 5 GB 压到 2.57 GB，megakernel 和重叠把利用率从 21% 提到 68%，DSpark 把 2.57 GB 换成 1.35 GB
          </Txt>
        )}
        {fl(f, A2 + 40) && (
          <Txt x={96} y={846} size={24} anchor="start" color={T.dim}>
            前两行是同系列的 LFM3-VL-2B，其余都是 LFM3-1.7B
          </Txt>
        )}
      </Stage>
    </AbsoluteFill>
  );
};

/* ---------- compared with vLLM ---------- */
const CMP0 = 30;
const CMP1 = 300;
const CMP2 = 540;

export const CompareCues: Cue[] = [
  [CMP0, 'step'],
  [CMP1, 'step'],
  [CMP2, 'chime'],
];

export const Compare: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={72} size={48} anchor="start">
          LFM3-1.7B：和 vLLM 上的同一个 kernel 比
        </Txt>
        <Table
          x={96}
          y={108}
          cols={[210, 330, 330, 426, 432]}
          head={['上下文', 'TTFT vLLM', 'TTFT 这里', 'decode vLLM（3 流中位数）', 'decode 这里（3 流中位数）']}
          rows={[
            ['1k', '0.201 s', '0.126 s', '974', '1207'],
            ['8k', '1.157 s', '1.044 s', '532', '954'],
            ['32k', '5.829 s', '5.678 s', '364', '613'],
            ['64k', '15.574 s', '15.371 s', '413', '450'],
            ['128k', '44.738 s', '44.343 s', '301', '307'],
          ]}
          f={f}
          at={CMP0}
          step={24}
          rowH={48}
        />
        {fl(f, CMP1) && (
          <g>
            <Txt x={96} y={462} size={24} anchor="start">
              单流中位数要看第五章的说明。72 条多流总体打平（均值 559 → 545），把循环流分开看，正常文本每档快 5% 到 16%。
            </Txt>
            <Txt x={96} y={510} size={24} anchor="start" color={T.dim}>
              最接近真实使用的一组：MATH + GPQA 各 20 题，greedy，长输出，自然结束
            </Txt>
            <BarRow x={96} y={540} name="不用 draft" nameW={210} frac={293 / 640} max={900} value="MATH 293 · GPQA 291 tok/s" t={ramp(f, CMP1, 24)} hollow />
            <BarRow x={96} y={588} name="vLLM DSpark" nameW={210} frac={616 / 640} max={900} value="MATH 616 · GPQA 505 tok/s" t={ramp(f, CMP1 + 24, 24)} hollow />
            <BarRow x={96} y={636} name="这里 DSpark" nameW={210} frac={639.5 / 640} max={900} value="MATH 640 · GPQA 508 tok/s" t={ramp(f, CMP1 + 48, 24)} />
          </g>
        )}
        {fl(f, CMP2) && (
          <g>
            <Txt x={96} y={732} size={24} anchor="start" color={T.sub}>
              采样路径（temperature 0.6）：8k 191 → 260，128k 151 → 189。可执行文件 1.97 GB，启动 7.5 秒。
            </Txt>
            <Txt x={96} y={774} size={24} anchor="start" color={T.dim}>
              DSpark 只在 temperature 0 时生效；默认 temperature 0.1 走采样路径，约 260 tok/s。
            </Txt>
          </g>
        )}
      </Stage>
    </AbsoluteFill>
  );
};

/* ---------- what is still open ---------- */
const OPEN: [string, string][] = [
  ['还有 42% 的带宽', '128k 每轮 6 ms，内存只忙 58%。8k 上注意力、norm、barrier 合计约 1.45 ms，都不怎么读内存'],
  ['8 个 wave 把内存和计算叠起来', '微基准证明能叠（781 → 777 GB/s，计算还有 53%），估算净收益约 2%，改动太大，没有做'],
  ['785 GB/s 还是 1024 GB/s？', '持续读只有理论值的 77%。换分块、在途深度、load 标志都没变化，原因没查清'],
  ['178 W', '读内存就用掉 174 W，计算只好降频。要突破得改 powerplay 或者降压，这是硬件层面的决定'],
  ['DSpark 权重还在训练', '现在用的是中途的 step 10260。τ 涨一点，每 token 的字节就少一点，策略要重新回放'],
];

export const OpenCues: Cue[] = OPEN.map((_, i): Cue => [40 + i * 96, 'step']);

export const Open: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={96} size={48} anchor="start">
          还没用上的
        </Txt>
        {OPEN.map(([a, b], i) =>
          fl(f, 40 + i * 96) ? (
            <g key={a}>
              <Txt x={96} y={186 + i * 126} size={36} anchor="start">
                {a}
              </Txt>
              <Line x={96} y={234 + i * 126} text={b} f={f} at={52 + i * 96} color={T.sub} />
              <rect x={96} y={264 + i * 126} width={1728} height={3} fill={T.line} />
            </g>
          ) : null,
        )}
      </Stage>
      {f >= 560 && <Sprite map={EVE} x={1620} y={840} s={PX} screenX={1620} />}
    </AbsoluteFill>
  );
};

/* ---------- credits ---------- */
const ROLL = (() => {
  const seen = new Set<string>();
  const all = [...Object.values(CITES), ...EXTRA_CREDITS].filter((c) => typeof c.year === 'number' && c.who !== '本项目实测' && !c.who.startsWith('Vaswani'));
  return all
    .sort((a, b) => (a.year as number) - (b.year as number))
    .filter((c) => {
      const k = `${c.year}${c.who}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
})();
const ROW = 108;

export const CreditsCues: Cue[] = [[20, 'stamp']];

export const Credits: React.FC = () => {
  const f = useF();
  const scroll = snap(Math.max(0, f - 120) * 2.7);
  const top0 = 1080 - scroll;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {f < 300 && (
        <div style={{position: 'absolute', top: 360 - snap(Math.max(0, f - 120) * 2.7), width: 1920, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.press, fontSize: 24, color: COL.dim, letterSpacing: '0.3em'}}>CREDITS</div>
          <div style={{fontFamily: FONT.pixel, fontSize: 96, lineHeight: '120px', color: COL.text, marginTop: 24}}>{'站在这些工作上'}</div>
        </div>
      )}
      {ROLL.map((c, i) => {
        const y = top0 + 240 + i * ROW;
        if (y < 60 || y > 1010) return null;
        return (
          <div key={i} style={{position: 'absolute', left: 300, top: y, width: 1320, display: 'flex', alignItems: 'baseline', gap: 48}}>
            <span style={{fontFamily: FONT.press, fontSize: 24, color: COL.text, width: 120}}>{c.year}</span>
            <span style={{display: 'flex', flexDirection: 'column'}}>
              <span style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text}}>{c.who}</span>
              <span style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.dim}}>{c.work}</span>
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- ending ---------- */
export const LogoCues: Cue[] = [
  [30, 'reveal'],
  [200, 'chime'],
];

export const Logo: React.FC = () => {
  const f = useF();
  const a = '榨干一张 MI50';
  const n = Math.max(0, Math.floor((f - 30) / 6));
  const CAST = [ALICE, BOB, SAGE, YUZU, EVE];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 120, lineHeight: '144px', color: COL.text}}>
        {a.slice(0, n)}
        {n < a.length && <BlockCursor f={f} size={120} on />}
      </div>
      {fl(f, 110) && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 480, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 60, lineHeight: '72px', color: COL.text}}>
          MI50老矣 尚能饭否
        </div>
      )}
      {fl(f, 150) && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 570, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub}}>
          LFM3-1.7B on MI50 · 785 GB/s，一步一步算清楚
        </div>
      )}
      {f >= 200 && CAST.map((c, i) => <Sprite key={i} map={c} x={660 + i * 120} y={660} s={PX * 1.5} screenX={660 + i * 120} />)}
    </AbsoluteFill>
  );
};

export {Box, BarRow};
