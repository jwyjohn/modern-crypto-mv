import React from 'react';
import {AbsoluteFill} from 'remotion';
import {MILESTONES} from '../cites';
import {clamp01, COL, FONT, PX, quant} from '../theme';
import {BlockCursor} from './pixel';
import {useF} from './Shot';
import {ACTS} from './ui';

/** Chapter opening: numeral, name, milestone timeline, epigraph. Quiet and monumental. */
export const ActTitle: React.FC<{
  num: string;
  zh: string;
  en: string;
  color: string;
  topics: string[];
  quote: string;
  by: string;
  year: number;
  yearLabel?: string;
}> = ({num, zh, topics, quote, by}) => {
  const f = useF();
  const act = ACTS[Number(num) - 1];
  const ms = MILESTONES[num] ?? [];
  const n = Math.max(1, ms.length - 1);
  const X0 = 240;
  const X1 = 1680;
  const LY = 612;
  const mx = (i: number) => Math.round((X0 + (i / n) * (X1 - X0)) / PX) * PX;
  const line = quant(clamp01((f - 36) / 60), 20);
  const zn = Math.max(0, Math.min(zh.length, Math.floor((f - 10) / 5)));
  const qn = Math.max(0, Math.min(quote.length, Math.floor((f - 96) * 0.45)));

  return (
    <AbsoluteFill style={{background: COL.bg}}>
      {/* numeral + name */}
      <div style={{position: 'absolute', left: 240, top: 168, display: 'flex', alignItems: 'flex-end', gap: 60}}>
        <div style={{fontFamily: FONT.press, fontSize: 192, lineHeight: '200px', color: COL.text}}>{act?.num}</div>
        <div style={{paddingBottom: 6}}>
          <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.dim}}>{act?.zh}</div>
          <div style={{fontFamily: FONT.pixel, fontSize: 120, lineHeight: '132px', color: COL.text, whiteSpace: 'nowrap'}}>{zh.slice(0, zn)}</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 240, top: 396, fontFamily: FONT.press, fontSize: 24, color: COL.dim, opacity: f >= 30 ? 1 : 0}}>{act?.en}</div>

      {/* milestone timeline */}
      <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
        <rect x={X0} y={LY} width={(X1 - X0) * line} height={3} fill={COL.ink} />
        {ms.map(([y, label], i) => {
          if (line < i / n - 0.001) return null;
          const x = mx(i);
          return (
            <g key={i}>
              <rect x={x - 6} y={LY - 6} width={15} height={15} fill={COL.ink} />
              <text x={x + 1} y={LY - 36} textAnchor="middle" fontFamily={FONT.press} fontSize={16} fill={COL.text}>
                {y}
              </text>
              {ms.length > 6 && i % 2 === 1 && <rect x={x} y={LY + 12} width={3} height={42} fill={COL.line} />}
              <text x={x + 1} y={LY + (ms.length > 6 && i % 2 === 1 ? 84 : 48)} textAnchor="middle" fontFamily={FONT.pixel} fontSize={24} fill={COL.sub}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* topics */}
      {f >= 80 && (
        <div style={{position: 'absolute', left: 240, top: 744, fontFamily: FONT.pixel, fontSize: 24, color: COL.dim, whiteSpace: 'nowrap'}}>
          {topics.join('  ·  ')}
        </div>
      )}

      {/* epigraph */}
      {f >= 96 && (
        <div style={{position: 'absolute', left: 240, top: 822, width: 1440}}>
          <div style={{width: 48, height: PX, background: COL.ink, marginBottom: 18}} />
          <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.text, whiteSpace: 'nowrap'}}>
            「{quote.slice(0, qn)}
            {qn < quote.length ? <BlockCursor f={f} size={36} on /> : '」'}
          </div>
          {qn >= quote.length && <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.dim, marginTop: 12}}>—— {by}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};
