import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {BAYER, clamp01, COL, STEP} from '../theme';

/**
 * Pixel transitions. Every cut is a HARD cut hidden under a full-screen pixel effect:
 *  - dither : 4×4-Bayer block dissolve to black and back      (ZOOM)
 *  - wipe   : chunky horizontal bars sweep across, staggered   (SLIDE)
 *  - blinds : vertical shutter columns close and open          (RISE)
 *  - box    : square iris shrinks to centre then grows out      (IRIS, coloured)
 *  - flash  : palette flash white → colour → off               (FLASH)
 * `pre` frames before the cut cover the old shot, `post` frames after it uncover the new one.
 */
export type Trans = {type: 'dither' | 'wipe' | 'blinds' | 'box' | 'flash'; pre: number; post: number; color?: string};
export const ZOOM: Trans = {type: 'dither', pre: 15, post: 15};
export const SLIDE: Trans = {type: 'wipe', pre: 15, post: 15};
export const RISE: Trans = {type: 'blinds', pre: 15, post: 15};
export const IRIS = (color: string): Trans => ({type: 'box', pre: 18, post: 24, color});
export const FLASH: Trans = {type: 'flash', pre: 6, post: 30};

/** warp[r] = scene frame shown at real local frame r (monotone, slows down / holds on key moments) */
export type ShotDef = {id: string; start: number; end: number; C: React.FC; tin?: Trans; warp?: Float32Array; natural?: number};

type Ctx = {offset: number; dur: number; mini: boolean; id?: string; warp?: Float32Array};
export const ShotCtx = createContext<Ctx>({offset: 0, dur: 600, mini: false});

/** scene-local frame: 0 == the cut point of this shot. Quantised to STEP frames ("animating on threes"). */
export const useF = () => {
  const ctx = useContext(ShotCtx);
  const r = useCurrentFrame() - ctx.offset;
  const w = ctx.warp;
  const f = w && w.length ? (r < 0 ? r : w[Math.min(w.length - 1, r)]) : r;
  return Math.floor(f / STEP) * STEP;
};
/** un-quantised scene-local frame (for the rare thing that must move every frame, e.g. scrolling) */
export const useRawF = () => useCurrentFrame() - useContext(ShotCtx).offset;
export const useShot = () => useContext(ShotCtx);

const COLS = 32;
const ROWS = 18;
const CW = 1920 / COLS;
const CH = 1080 / ROWS;

/** cover amount 0..1 → full-screen svg */
const Cover: React.FC<{t: Trans; k: number}> = ({t, k}) => {
  if (k <= 0) return null;
  const color = COL.ink;
  const cells: React.ReactNode[] = [];
  if (t.type === 'dither') {
    const L = Math.round(k * 16);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) if (BAYER[(y & 3) * 4 + (x & 3)] < L) cells.push(<rect key={`${x}-${y}`} x={x * CW} y={y * CH} width={CW + 0.5} height={CH + 0.5} fill={color} />);
  } else if (t.type === 'wipe') {
    for (let y = 0; y < ROWS; y++) {
      const w = clamp01(k * 1.6 - (y % 3) * 0.2) * 1920;
      if (w > 0) cells.push(<rect key={y} x={0} y={y * CH} width={Math.ceil(w / CW) * CW} height={CH + 0.5} fill={y % 2 ? color : COL.sub} />);
    }
  } else if (t.type === 'blinds') {
    for (let x = 0; x < COLS; x++) {
      const h = clamp01(k * 1.5 - (x % 4) * 0.12) * 1080;
      if (h > 0) cells.push(<rect key={x} x={x * CW} y={0} width={CW + 0.5} height={Math.ceil(h / CH) * CH} fill={color} />);
    }
  } else if (t.type === 'box') {
    // square iris: the "hole" shrinks as k → 1
    const r = Math.round(((1 - k) * 1100) / CW) * CW;
    const x0 = 960 - r;
    const y0 = 540 - r;
    cells.push(
      <path key="m" fillRule="evenodd" d={`M0 0 H1920 V1080 H0 Z M${x0} ${y0} H${x0 + 2 * r} V${y0 + 2 * r} H${x0} Z`} fill={COL.ink} />,
      r > 0 && <rect key="b" x={x0 - 12} y={y0 - 12} width={2 * r + 24} height={2 * r + 24} fill="none" stroke={COL.dim} strokeWidth={6} />,
    );
  } else if (t.type === 'flash') {
    cells.push(<rect key="f" x={0} y={0} width={1920} height={1080} fill={k > 0.5 ? COL.panel : COL.bg} />);
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}} shapeRendering="crispEdges">
      {cells}
    </svg>
  );
};

/** global transition overlay, drawn above all shots */
export const Transitions: React.FC<{shots: ShotDef[]}> = ({shots}) => {
  const f = useCurrentFrame();
  for (let i = 1; i < shots.length; i++) {
    const s = shots[i];
    const t = s.tin ?? ZOOM;
    const d = f - s.start;
    if (d >= -t.pre && d < t.post) {
      // quantise to 3-frame steps too
      const dq = Math.floor(d / STEP) * STEP;
      const k = dq < 0 ? clamp01((dq + t.pre + STEP) / t.pre) : 1 - clamp01((dq + STEP) / t.post);
      return <Cover t={t} k={k} />;
    }
  }
  return null;
};

export const Shots: React.FC<{shots: ShotDef[]}> = ({shots}) => (
  <>
    {shots.map((s) => (
      <Sequence key={s.id} from={s.start} durationInFrames={s.end - s.start} name={s.id}>
        <AbsoluteFill>
          <ShotCtx.Provider value={{offset: 0, dur: s.natural ?? s.end - s.start, mini: false, id: s.id, warp: s.warp}}>
            <s.C />
          </ShotCtx.Provider>
        </AbsoluteFill>
      </Sequence>
    ))}
  </>
);
