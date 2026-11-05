import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import {ALICE, BlockCursor, BOB, EVE, SAGE, Sprite, YUZU} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {ACTS} from '../components/ui';
import {COL, FONT, PX, snap} from '../theme';
import {Box, fl, Stage, T} from './lib';

const CMD = '> generate("hello")';
const CMD_AT = 40;
const WAIT_AT = 150;
const LINES: [number, string][] = [
  [420, '模型是 LFM3-1.7B，显卡是 2018 年的 MI50，官方早已不再支持'],
  [500, '它有 785 GB/s 的显存带宽，这时只用上了五分之一'],
  [580, '其余的五分之四，能拿回来多少？'],
];
const TITLE = 690;

export const IntroCues: Cue[] = [
  ...new Array(CMD.length).fill(0).map((_, i): Cue => [CMD_AT + i * 5, 'type']),
  [WAIT_AT, 'blip'],
  [TITLE, 'reveal'],
];

export const Intro: React.FC = () => {
  const f = useF();
  const n = Math.max(0, Math.min(CMD.length, Math.floor((f - CMD_AT) / 5)));
  const secs = f < WAIT_AT ? 0 : Math.min(238, Math.floor(((f - WAIT_AT) / 240) * 238));
  if (f >= TITLE) {
    const tn = Math.floor((f - TITLE) / 6);
    const main = '榨干一张 MI50';
    return (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 240, top: 300, fontFamily: FONT.press, fontSize: 24, color: COL.dim, letterSpacing: '0.2em'}}>LFM3-1.7B ON A 2018 GPU</div>
        <div style={{position: 'absolute', left: 240, top: 360, fontFamily: FONT.pixel, fontSize: 144, lineHeight: '168px', color: COL.text, whiteSpace: 'nowrap'}}>
          {main.slice(0, tn)}
          {tn < main.length && <BlockCursor f={f} size={144} on />}
        </div>
        {fl(f, TITLE + 60) && (
          <div style={{position: 'absolute', left: 240, top: 534, fontFamily: FONT.pixel, fontSize: 60, lineHeight: '72px', color: COL.text, whiteSpace: 'nowrap'}}>
            MI50老矣 尚能饭否
          </div>
        )}
        {fl(f, TITLE + 100) && (
          <div style={{position: 'absolute', left: 240, top: 642, fontFamily: FONT.pixel, fontSize: 48, lineHeight: '72px', color: COL.sub, whiteSpace: 'nowrap'}}>
            显存带宽 21% → 68% · 每 token 读 5 GB → 1.35 GB
          </div>
        )}
        {fl(f, TITLE + 130) && (
          <div style={{position: 'absolute', left: 240, top: 732, fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.dim, whiteSpace: 'nowrap'}}>
            LFM3-1.7B：334 tok/s，一步一步算清楚
          </div>
        )}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 240, top: 180, fontFamily: FONT.pixelMono, fontSize: 48, lineHeight: '60px', color: COL.text, whiteSpace: 'nowrap'}}>
        {CMD.slice(0, n)}
        {f < WAIT_AT && <BlockCursor f={f} size={48} on={n < CMD.length ? true : undefined} />}
      </div>
      {f >= WAIT_AT && (
        <div style={{position: 'absolute', left: 240, top: 264, fontFamily: FONT.pixelMono, fontSize: 96, lineHeight: '120px', color: secs >= 238 ? COL.red : COL.text, whiteSpace: 'nowrap'}}>
          {String(secs).padStart(3, '0')} s
          <BlockCursor f={f} size={96} />
        </div>
      )}
      {f >= WAIT_AT + 30 && (
        <div style={{position: 'absolute', left: 240, top: 396, fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.dim}}>等第一个 token（127872 token 的输入，这次跑的是同系列的 LFM3-VL-2B）</div>
      )}
      {LINES.map(([at, s], i) =>
        f >= at ? (
          <div key={i} style={{position: 'absolute', left: 240, top: 498 + i * 72, fontFamily: FONT.pixel, fontSize: 48, lineHeight: '60px', color: COL.text, whiteSpace: 'nowrap'}}>
            {s.slice(0, Math.floor((f - at) * 0.5))}
          </div>
        ) : null,
      )}
      {f >= 400 && <Sprite map={SAGE} x={1500} y={snap(700)} s={PX * 2} />}
    </AbsoluteFill>
  );
};

/* ---------- overview: one formula, five chapters ---------- */
const O0 = 30;
const O1 = 240;
const OE = 72;

export const OverviewCues: Cue[] = [
  [O0, 'reveal'],
  ...ACTS.map((_, i): Cue => [O1 + i * OE, 'step']),
  [O1 + 5 * OE + 30, 'chime'],
];

const TERM = ['785 GB/s', '每 token 读多少', '先把该读的读对', '利用率 U', '一份字节换更多 token'];
const LINE2 = ['CU、wave、HBM2、Roofline：这条路有多宽', 'LFM3-1.7B：token、注意力、KV cache、量化。一个 token 要读 2.57 GB', 'megakernel、精度修复：少读，但不能读错', '叠起等待、GEMV、直连驱动：不让内存闲着', 'DSpark：一次读权重，验证多个 token'];
const WHO = [YUZU, ALICE, SAGE, EVE, BOB];

export const Overview: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        {fl(f, O0) && (
          <g>
            <Box x={96} y={60} w={420} h={120} inv label="tok/s" sub="每秒多少 token" size={60} />
            <Txt x={546} y={120} size={60}>
              =
            </Txt>
            <Box x={576} y={60} w={336} h={120} label="785 GB/s" sub="带宽" size={48} />
            <Txt x={942} y={120} size={60}>
              ×
            </Txt>
            <Box x={972} y={60} w={252} h={120} label="U" sub="利用率" size={60} />
            <Txt x={1254} y={120} size={60}>
              ÷
            </Txt>
            <Box x={1284} y={60} w={540} h={120} label="GB / token" sub="每提交一个 token 读多少字节" size={48} />
          </g>
        )}
        {ACTS.map((a, i) => {
          if (!fl(f, O1 + i * OE)) return null;
          const y = 216 + i * 114;
          return (
            <g key={a.num}>
              <Box x={96} y={y} w={168} h={102} inv label={a.num} size={60} />
              <Box x={264} y={y} w={1560} h={102} />
              <Txt x={294} y={y + 36} size={36} anchor="start">
                {a.name}
              </Txt>
              <Txt x={294 + a.name.length * 36 + 30} y={y + 36} size={24} anchor="start" color={T.sub}>
                {TERM[i]}
              </Txt>
              <Txt x={294} y={y + 78} size={24} anchor="start" color={T.dim}>
                {LINE2[i]}
              </Txt>
            </g>
          );
        })}
      </Stage>
      {ACTS.map((_, i) => (f >= O1 + i * OE ? <Sprite key={i} map={WHO[i]} x={1680} y={216 + i * 114 + 12} s={5} screenX={1680} /> : null))}
      {fl(f, O1 + 5 * OE + 30) && (
        <div style={{position: 'absolute', left: 96, top: 804, fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text, whiteSpace: 'nowrap'}}>
          每一步优化，都在动这条式子里的一项。数字都是在这张卡上量出来的。
        </div>
      )}
    </AbsoluteFill>
  );
};
