import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALICE, BOB, Sprite} from '../components/pixel';
import {COL, FONT} from '../theme';

/** 4:3 cover: the Game Development Department runs one round of speculative decoding */
const DRAFT = ['我们', '去', '公园'];
const TRUE_ = ['我们', '去', '海边'];

export const Cover: React.FC = () => (
  <AbsoluteFill style={{background: COL.bg}}>
    <div style={{position: 'absolute', left: 90, top: 96, fontFamily: FONT.pixel, fontSize: 132, lineHeight: '156px', color: COL.text}}>榨干一张 MI50</div>
    <div style={{position: 'absolute', left: 96, top: 264, fontFamily: FONT.pixel, fontSize: 72, lineHeight: '84px', color: COL.text}}>MI50老矣 尚能饭否</div>
    <div style={{position: 'absolute', left: 96, top: 372, fontFamily: FONT.press, fontSize: 24, color: COL.dim, letterSpacing: '0.1em'}}>LFM3-1.7B ON A 2018 GPU</div>
    <Sprite map={ALICE} x={120} y={540} s={24} screenX={120} />
    <Sprite map={BOB} x={1200} y={540} s={24} screenX={1200} />
    {DRAFT.map((w, i) => (
      <div key={i} style={{position: 'absolute', left: 408 + i * 264, top: 576, width: 240, height: 120, background: COL.panel, outline: `6px solid ${COL.ink}`, fontFamily: FONT.pixel, fontSize: 72, lineHeight: '120px', textAlign: 'center', color: COL.text}}>
        {w}
      </div>
    ))}
    {TRUE_.map((w, i) => (
      <div key={i} style={{position: 'absolute', left: 408 + i * 264, top: 744, width: 240, height: 120, background: i === 2 ? COL.red : COL.ink, fontFamily: FONT.pixel, fontSize: 72, lineHeight: '120px', textAlign: 'center', color: COL.invText}}>
        {w}
      </div>
    ))}
    <div style={{position: 'absolute', left: 96, top: 1032, fontFamily: FONT.pixel, fontSize: 48, lineHeight: '60px', color: COL.sub}}>tok/s = τ / R</div>
  </AbsoluteFill>
);
