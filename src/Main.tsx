import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Background, CRT} from './components/Background';
import {Shots, Transitions} from './components/Shot';
import {ActHUD} from './components/ui';
import {Cast, CastCtx} from './components/pixel';
import {COL} from './theme';
import {ACT_RANGES, SHOTS, TOTAL} from './timeline';

export {TOTAL};

export const Main: React.FC<{mute?: boolean; musicSrc?: string; cast?: Cast}> = ({mute, musicSrc, cast = 'ba'}) => {
  const stops: [number, string][] = ACT_RANGES.map((a) => [a.s, a.color]);
  const hud = SHOTS.map((s) => ({id: s.id, start: s.start, end: s.end, mood: s.mood, act: s.act}));
  return (
    <CastCtx.Provider value={cast}>
    <AbsoluteFill style={{background: COL.bg}}>
      <Background stops={stops} total={TOTAL} />
      <Shots shots={SHOTS} />
      <ActHUD shots={hud} />
      <Transitions shots={SHOTS} />
      <CRT />
      {!mute && <Audio src={musicSrc ?? staticFile('music.wav')} />}
    </AbsoluteFill>
    </CastCtx.Provider>
  );
};
