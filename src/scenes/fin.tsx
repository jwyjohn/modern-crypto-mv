import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CITES, EXTRA_CREDITS} from '../cites';
import {Txt} from '../components/kit';
import {ALICE, BlockCursor, BOB, EVE, SAGE, Sprite, YUZU} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {COL, FONT, PX, snap} from '../theme';
import {Bar, BarRow, Box, fl, Line, ramp, Stage, T, Table} from './lib';

/* ---------- the result ---------- */
const A0 = 30;
const A1 = 360;
const A2 = 660;

export const ResultCues: Cue[] = [
  [A0, 'step'],
  [A1, 'reveal'],
  [A2, 'chime'],
];

export const Result: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={60} size={48} anchor="start">
          七天的结果
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
          at={A0}
          step={24}
          rowH={48}
        />
        {fl(f, A1) && (
          <g>
            <Txt x={96} y={438} size={24} anchor="start" color={T.dim}>
              128k 上下文，一路走来
            </Txt>
            {[
              ['起点', 238, 32],
              ['megakernel + 修复', 47, 167],
              ['重叠等待', 46.5, 201],
              ['Go · KFD', 46, 208],
              ['DSpark', 44.3, 307],
            ].map(([n, a, b], i) => (
              <g key={String(n)}>
                <Txt x={96} y={492 + i * 48} size={24} anchor="start">
                  {n}
                </Txt>
                <Bar x={420} y={474 + i * 48} w={((a as number) / 238) * 540} h={36} t={ramp(f, A1 + i * 18, 30)} hollow />
                <Txt x={420 + ((a as number) / 238) * 540 + 12} y={492 + i * 48} size={24} anchor="start" family={FONT.pixelMono} color={T.sub}>
                  {a} s
                </Txt>
                <Bar x={1140} y={474 + i * 48} w={((b as number) / 311) * 540} h={36} t={ramp(f, A1 + i * 18, 30)} />
                <Txt x={1140 + ((b as number) / 311) * 540 + 12} y={492 + i * 48} size={24} anchor="start" family={FONT.pixelMono} color={T.sub}>
                  {b}
                </Txt>
              </g>
            ))}
          </g>
        )}
        {fl(f, A2) && (
          <g>
            <Txt x={96} y={768} size={24} anchor="start">
              解码的单流中位数要看第五章的说明。72 条多流里两边总体打平，把循环流分开看，正常文本 Go 快 5% 到 16%。
            </Txt>
            <Txt x={96} y={810} size={24} anchor="start" color={T.sub}>
              真实问答（MATH + GPQA，greedy）：不用 draft 293 / 291 tok/s，DSpark 639 / 508。采样路径 8k 191 → 260。文件 1.97 GB。
            </Txt>
            <Txt x={96} y={852} size={24} anchor="start" color={T.dim}>
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
  ['785 GB/s 还是 1024 GB/s？', '持续读只有理论值的 77%。换分块、在途深度、load 标志都没变化，原因没查清'],
  ['178 W', '读内存就用掉 174 W，计算只好降频。要突破得改 powerplay 或者降压，这是硬件层面的决定'],
  ['GEMV 的 int8 x', 'KL 约为 fp16 的 6 倍，top-1 多翻 1 到 4 处。要回退，驱动得先支持 scratch'],
  ['DSpark 权重还在训练', '现在用的是中途的 step 10260。新权重来了，策略要重新回放'],
  ['8 wave 重叠', '微基准证明能把内存和计算叠在一个 CU 上，估算净收益约 2%，改动太大，没有做'],
];

export const OpenCues: Cue[] = OPEN.map((_, i): Cue => [40 + i * 96, 'step']);

export const Open: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        <Txt x={96} y={96} size={48} anchor="start">
          还没解决的
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
      {fl(f, 150) && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 504, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub}}>
          先对，再快；每一步都量出来
        </div>
      )}
      {f >= 200 && CAST.map((c, i) => <Sprite key={i} map={c} x={660 + i * 120} y={636} s={PX * 1.5} screenX={660 + i * 120} />)}
    </AbsoluteFill>
  );
};

export {Box, BarRow};
