import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01, COL, FONT, PX} from '../theme';
import {ShotCtx, useF} from './Shot';

/**
 * Plays a slice of another scene inside a framed panel (used by the short version's chapter digests).
 * The inner scene runs in `mini` mode (its Caption is hidden) and shows scene frames [from, to],
 * stretched over [at, at + dur] of the host shot's local time; before `at` it holds `from`, after it holds `to`.
 */
export const Excerpt: React.FC<{
  C: React.FC;
  from: number;
  to: number;
  at: number;
  dur: number;
  x: number;
  y: number;
  w: number;
  /** crop of the 1920×1080 source to show (defaults to the whole frame) */
  crop?: {x: number; y: number; w: number; h: number};
  label?: string;
}> = ({C, from, to, at, dur, x, y, w, crop = {x: 0, y: 0, w: 1920, h: 1080}, label}) => {
  const f = useF();
  const cf = useCurrentFrame();
  const inner = Math.round(from + (to - from) * clamp01((f - at) / Math.max(1, dur)));
  const scale = w / crop.w;
  const h = Math.round(crop.h * scale);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: COL.bg, outline: `3px solid ${COL.ink}`}}>
        <div style={{position: 'absolute', left: -crop.x * scale, top: -crop.y * scale, width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
          <ShotCtx.Provider value={{offset: cf - inner, dur: Math.max(to, 1), mini: true}}>
            <C />
          </ShotCtx.Provider>
        </div>
      </div>
      {label && (
        <div style={{position: 'absolute', left: 0, top: h + PX * 2, fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.dim, whiteSpace: 'nowrap'}}>{label}</div>
      )}
    </div>
  );
};
