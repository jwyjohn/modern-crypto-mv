import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COL} from '../theme';

/** kept for API compatibility */
export const accentAt = (f: number, stops: [number, string][]) => {
  let c = stops[0][1];
  for (const [s, col] of stops) if (f >= s) c = col;
  return c;
};

/** paper page with a faint 48px pixel-dot grid — nothing else */
export const Background: React.FC<{stops: [number, string][]; total: number}> = () => (
  <AbsoluteFill style={{background: COL.bg}}>
    <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
      <defs>
        <pattern id="bg-dots" width={48} height={48} patternUnits="userSpaceOnUse">
          <rect x={0} y={0} width={3} height={3} fill={COL.line} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#bg-dots)" />
    </svg>
  </AbsoluteFill>
);

/** no CRT effect in the minimal look */
export const CRT: React.FC = () => null;
