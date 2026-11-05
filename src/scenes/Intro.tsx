import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Txt} from '../components/kit';
import {ALICE, BlockCursor, BOB, EVE, SAGE, Sprite, YUZU} from '../components/pixel';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {ACTS} from '../components/ui';
import {COL, FONT, PX, snap} from '../theme';
import {Box, fl, ramp, Stage, T} from './lib';

const CMD = '> generate("hello")';
const CMD_AT = 40;
const WAIT_AT = 150;
const LINES: [number, string][] = [
  [420, '2018 年的数据中心显卡，早已不被官方支持'],
  [500, '一个 128000 token 的上下文，它要算四分钟'],
  [580, '七天之后，同一张卡，同一个问题'],
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
        <div style={{position: 'absolute', left: 240, top: 300, fontFamily: FONT.press, fontSize: 24, color: COL.dim, letterSpacing: '0.2em'}}>LLM INFERENCE ON A 2018 GPU</div>
        <div style={{position: 'absolute', left: 240, top: 360, fontFamily: FONT.pixel, fontSize: 144, lineHeight: '168px', color: COL.text, whiteSpace: 'nowrap'}}>
          {main.slice(0, tn)}
          {tn < main.length && <BlockCursor f={f} size={144} on />}
        </div>
        {fl(f, TITLE + 72) && (
          <div style={{position: 'absolute', left: 240, top: 564, fontFamily: FONT.pixel, fontSize: 48, lineHeight: '72px', color: COL.sub, whiteSpace: 'nowrap'}}>
            238 秒 → 44 秒 · 32 tok/s → 300 到 1000 tok/s
          </div>
        )}
        {fl(f, TITLE + 110) && (
          <div style={{position: 'absolute', left: 240, top: 660, fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.dim, whiteSpace: 'nowrap'}}>
            从硬件、模型，到每一步优化
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
        <div style={{position: 'absolute', left: 240, top: 396, fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.dim}}>等第一个 token（127872 token 的输入）</div>
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

/* ---------- overview: five chapters ---------- */
const O0 = 30;
const OE = 90;

export const OverviewCues: Cue[] = [
  ...ACTS.map((_, i): Cue => [O0 + i * OE, 'step']),
  [O0 + 5 * OE + 30, 'chime'],
];

const LINE2 = ['60 个 CU · HBM2 · 功耗墙 · Roofline', 'token · 注意力 · KV cache · 量化', 'megakernel · Flash attention · 崩坏与修复', 'KFD · AQL · L2 回写 · 两处竞争', 'DSpark · τ 和 R · 混沌'];
const WHO = [YUZU, ALICE, SAGE, EVE, BOB];

export const Overview: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Stage>
        {ACTS.map((a, i) => {
          if (!fl(f, O0 + i * OE)) return null;
          const y = 120 + i * 138;
          return (
            <g key={a.num}>
              <Box x={96} y={y} w={216} h={120} inv label={a.num} size={72} />
              <Box x={312} y={y} w={1512} h={120} />
              <Txt x={348} y={y + 42} size={48} anchor="start">
                {a.name}
              </Txt>
              <Txt x={348 + a.name.length * 48 + 36} y={y + 42} size={16} anchor="start" family={FONT.press} color={T.dim}>
                {a.en}
              </Txt>
              <Txt x={348} y={y + 90} size={24} anchor="start" color={T.sub}>
                {LINE2[i]}
              </Txt>
            </g>
          );
        })}
      </Stage>
      {ACTS.map((_, i) => (f >= O0 + i * OE ? <Sprite key={i} map={WHO[i]} x={1680} y={120 + i * 138 + 18} s={6} screenX={1680} /> : null))}
      {fl(f, O0 + 5 * OE + 30) && (
        <div style={{position: 'absolute', left: 96, top: 822, fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text, whiteSpace: 'nowrap'}}>
          每一步都有数字。数字都是在这张卡上量出来的。{ramp(f, 0, 1) > 2 ? '' : ''}
        </div>
      )}
    </AbsoluteFill>
  );
};
