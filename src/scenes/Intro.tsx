import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {BlockCursor, LOCK, Sprite} from '../components/pixel';
import {ACTS} from '../components/ui';
import {COL, FONT, PX, rnd, snap} from '../theme';

const CMD = '> encrypt("hello")';
const HEX = ['8f', '3a', '9c', '01', 'e7', '5d', 'b2', '44', 'c9', '0e', '7a', 'f3', '61', 'd8', '2b', '95'];
const CMD_AT = 40;
const OUT_AT = 150;
const SCATTER = 240;
const LINES: [number, string][] = [
  [390, '两千年来，人们用替换与移位守护秘密'],
  [470, '1949 年，香农为"保密"写下数学定义'],
  [550, '从此，密码学成为一门科学'],
];
const TITLE_FULL = 650;
const TITLE_SHORT = 360;

/** Schotter-like field: a grid of ciphertext tiles; disorder grows with time and row */
const Field: React.FC<{f: number; outAt: number}> = ({f, outAt}) => {
  const t = f - SCATTER;
  if (t < 0) return null;
  const out = f >= outAt ? Math.min(1, (f - outAt) / 30) : 0;
  const tiles: React.ReactNode[] = [];
  const C = 22;
  const R = 9;
  for (let j = 0; j < R; j++)
    for (let i = 0; i < C; i++) {
      const k = j * C + i;
      const appear = 4 + Math.floor(rnd(k * 1.7) * 60);
      if (t < appear) continue;
      if (rnd(k * 9.1) < out) continue;
      const chaos = Math.min(1, (t - appear) / 90) * (0.15 + (j / R) * 0.85);
      const x = snap(60 + i * 82 + (rnd(k * 2.3) - 0.5) * 60 * chaos);
      const y = snap(150 + j * 82 + (rnd(k * 3.9) - 0.5) * 60 * chaos);
      const rot = Math.round(((rnd(k * 5.3) - 0.5) * 70 * chaos) / 15) * 15;
      tiles.push(
        <g key={k} transform={`translate(${x + 30},${y + 30}) rotate(${rot})`}>
          <rect x={-30} y={-30} width={60} height={60} fill={COL.panel} stroke={COL.ink} strokeWidth={3} />
          <text y={2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.pixelMono} fontSize={24} fill={COL.text}>
            {HEX[k % 16]}
          </text>
        </g>,
      );
    }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}} shapeRendering="crispEdges">
      {tiles}
    </svg>
  );
};

export const Intro: React.FC<{short?: boolean}> = ({short = false}) => {
  const f = useF();
  const TITLE_AT = short ? TITLE_SHORT : TITLE_FULL;

  /* ---- console ---- */
  const consoleOn = f < SCATTER + 20;
  const cn = Math.max(0, Math.min(CMD.length, Math.floor((f - CMD_AT) / 4)));
  const hn = Math.max(0, Math.min(16, Math.floor((f - OUT_AT) / 4)));

  /* ---- narration lines ---- */
  const line = short ? undefined : [...LINES].reverse().find(([at]) => f >= at && f < TITLE_AT - 10);

  /* ---- title ---- */
  const t = f - TITLE_AT;
  const tn = Math.max(0, Math.min(5, Math.floor(t / 8)));

  return (
    <AbsoluteFill>
      {consoleOn && (
        <div style={{position: 'absolute', left: 480, top: 420, fontFamily: FONT.pixelMono, fontSize: 48, lineHeight: '84px', color: COL.text}}>
          <div style={{whiteSpace: 'pre'}}>
            {CMD.slice(0, cn)}
            {f < OUT_AT && <BlockCursor f={f} size={48} on={cn > 0 && cn < CMD.length ? true : undefined} />}
          </div>
          {f >= OUT_AT && (
            <div style={{whiteSpace: 'pre', color: COL.sub, fontSize: 36}}>
              {HEX.slice(0, hn).join(' ')}
              <BlockCursor f={f} size={36} color={COL.sub} />
            </div>
          )}
        </div>
      )}

      <Field f={f} outAt={short ? TITLE_SHORT - 60 : 380} />

      {line && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{fontFamily: FONT.pixel, fontSize: 60, lineHeight: '84px', color: COL.text, whiteSpace: 'nowrap'}}>
            {line[1].slice(0, Math.floor((f - line[0]) / 2) + 1)}
            {Math.floor((f - line[0]) / 2) + 1 < line[1].length && <BlockCursor f={f} size={60} on />}
          </div>
        </AbsoluteFill>
      )}

      {t >= 0 && (
        <>
          <Sprite map={LOCK} x={900} y={150} s={12} accent={COL.ink} />
          <div style={{position: 'absolute', top: 318, width: 1920, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 168, lineHeight: '192px', color: COL.text}}>
            {'现代密码学'.slice(0, tn)}
          </div>
          {t >= 48 && <div style={{position: 'absolute', top: 534, width: 1920, textAlign: 'center', fontFamily: FONT.press, fontSize: 32, color: COL.sub, letterSpacing: '0.3em'}}>MODERN CRYPTOGRAPHY</div>}
          {t >= 70 && <div style={{position: 'absolute', left: 960 - 48, top: 618, width: 96, height: PX, background: COL.ink}} />}
          {t >= 90 && (
            <div style={{position: 'absolute', top: 690, width: 1920, display: 'flex', justifyContent: 'center', gap: 60}}>
              {ACTS.map((a, i) =>
                t >= 90 + i * 18 ? (
                  <div key={i} style={{textAlign: 'center', width: 260}}>
                    <div style={{fontFamily: FONT.press, fontSize: 32, color: COL.text}}>{a.num}</div>
                    <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '60px', color: COL.sub, marginTop: 12}}>{a.name}</div>
                  </div>
                ) : (
                  <div key={i} style={{width: 260}} />
                ),
              )}
            </div>
          )}
          {t >= 180 && <div style={{position: 'absolute', top: 900, width: 1920, textAlign: 'center', fontFamily: FONT.press, fontSize: 16, color: COL.dim, letterSpacing: '0.2em'}}>1949 — 2024</div>}
        </>
      )}
    </AbsoluteFill>
  );
};

const introCues = (TITLE_AT: number, short: boolean): Cue[] => [
  ...new Array(Math.ceil(CMD.length / 2)).fill(0).map((_, k): Cue => [CMD_AT + k * 8, 'type']),
  [CMD_AT + CMD.length * 4, 'blip', 72],
  ...new Array(8).fill(0).map((_, k): Cue => [OUT_AT + k * 8, 'tick']),
  [SCATTER, 'whoosh'],
  [SCATTER + 60, 'riser2'],
  ...(short ? [] : LINES.map(([at], i): Cue => [at, 'bell', [69, 72, 76][i]])),
  [TITLE_AT, 'reveal'],
  ...[0, 1, 2, 3, 4].map((i): Cue => [TITLE_AT + 90 + i * 18, 'blip', [72, 76, 79, 84, 88][i]]),
];

export const IntroCues = introCues(TITLE_FULL, false);
export const IntroShortCues = introCues(TITLE_SHORT, true);
export const IntroShort: React.FC = () => <Intro short />;
