import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CASE_ORDER, CITES} from '../cites';
import {clamp01, COL, FONT, PX, quant} from '../theme';
import {BlockCursor, PixelBox} from './pixel';
import {useF, useShot} from './Shot';
import {ACTS} from './ui';

/**
 * "经典案例" — a narrated case study (formerly the quiz/problem template).
 * Title page (year · case · people · narration) → worked stage with narrative beats → result + lesson.
 * There are no questions, options or scores.
 */

export type Seg = string | {t: string; c?: string; m?: boolean};
export type Cue = [number, string, number?];

export type ProblemProps = {
  no: number;
  color: string;
  tag: string;
  title: string;
  /** narration lines (statement of the case — not a question) */
  q: Seg[][];
  /** legacy: if given with `answer`, options[answer] is used as the result text */
  options?: string[];
  answer?: number;
  /** the key result, shown at `reveal` */
  answerText?: string;
  brief: string;
  card?: number;
  steps?: {at: number; label: string}[];
  reveal: number;
  /** the lesson, shown under the result */
  insight?: string;
  /** ignored: course / exam sources are not shown on screen */
  src?: string;
  children: (sf: number) => React.ReactNode;
};

export const CARD = 330;

/** layout constants for case stages */
export const BOSSBAR = {y: 156, h: 54};
export const STAGE_TOP = 240;
export const STEPPER_Y = 990;

export const probCues = (p: {card?: number; reveal: number; steps?: {at: number}[]}, extra: Cue[] = []): Cue[] => {
  const card = p.card ?? CARD;
  return [
    [8, 'stamp'],
    [card - 6, 'whoosh'],
    ...(p.steps ?? []).map((s): Cue => [card + s.at, 'step']),
    [card + p.reveal, 'reveal'],
    ...extra.map((c): Cue => [c[0] + card, c[1], c[2]]),
  ];
};

/** kept for API compatibility */
export const Seal: React.FC<{size: number; text?: string; rot?: number}> = ({size, text = '案'}) => (
  <div style={{width: size, height: size, background: COL.inv, color: COL.invText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.pixel, fontSize: Math.round(size / 24) * 12}}>{text}</div>
);

const Line: React.FC<{segs: Seg[]; f: number; at: number}> = ({segs, f, at}) => {
  if (f < at) return <div style={{height: 60}} />;
  const total = segs.reduce((n, s) => n + (typeof s === 'string' ? s.length : s.t.length), 0);
  let left = Math.min(total, Math.floor((f - at) * 1.2));
  const done = left >= total;
  return (
    <div style={{fontFamily: FONT.pixel, fontSize: 36, lineHeight: '60px', color: COL.sub, whiteSpace: 'nowrap'}}>
      {segs.map((s, i) => {
        const txt = typeof s === 'string' ? s : s.t;
        const show = txt.slice(0, Math.max(0, left));
        left -= txt.length;
        if (!show) return null;
        if (typeof s === 'string') return <span key={i}>{show}</span>;
        const accent = s.c === COL.red;
        return (
          <span key={i} style={{color: accent ? COL.red : COL.text, fontFamily: s.m ? FONT.pixelMono : undefined, borderBottom: `3px solid ${accent ? COL.red : COL.text}`}}>
            {show}
          </span>
        );
      })}
      {!done && <BlockCursor f={f} size={36} color={COL.sub} on />}
    </div>
  );
};

export const Problem: React.FC<ProblemProps> = (p) => {
  const f = useF();
  const {id} = useShot();
  const cite = id ? CITES[id] : undefined;
  const card = p.card ?? CARD;
  const sf = f - card;
  const inCard = f < card;
  const revealed = sf >= p.reveal;
  const caseIdx = id ? CASE_ORDER.indexOf(id) : -1;
  const noTxt = String(caseIdx >= 0 ? caseIdx + 1 : p.no).padStart(2, '0');
  const curStep = p.steps ? p.steps.reduce((acc, s, i) => (sf >= s.at ? i : acc), -1) : -1;
  const result = p.answerText ?? (p.options && p.answer !== undefined ? p.options[p.answer] : '');
  const actIdx = ['sym', 'pk', 'sig', 'zk', 'fr'].findIndex((k) => (id ?? '').startsWith(k)) + 1 || 4;
  const act = ACTS[actIdx - 1];
  const tn = Math.max(0, Math.min(p.title.length, Math.floor((f - 30) / 4)));

  return (
    <AbsoluteFill>
      {/* ---------------- stage ---------------- */}
      {!inCard && <AbsoluteFill>{p.children(sf)}</AbsoluteFill>}

      {/* ---------------- title page ---------------- */}
      {inCard && (
        <AbsoluteFill style={{background: COL.bg}}>
          <div style={{position: 'absolute', left: 240, top: 180, width: 1440}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 24, whiteSpace: 'nowrap'}}>
              <span style={{fontFamily: FONT.press, fontSize: 16, color: COL.dim}}>CASE {noTxt}</span>
              <span style={{fontFamily: FONT.pixel, fontSize: 24, color: COL.dim}}>
                经典案例 · {act?.zh} {act?.name}
              </span>
            </div>
            {cite && f >= 12 && <div style={{fontFamily: FONT.press, fontSize: 64, lineHeight: '96px', color: COL.text, marginTop: 36}}>{cite.year}</div>}
            <div style={{fontFamily: FONT.pixel, fontSize: 96, lineHeight: '120px', color: COL.text, marginTop: 12, whiteSpace: 'nowrap'}}>{p.title.slice(0, tn)}</div>
            {cite && f >= 60 && (
              <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.dim, marginTop: 12, whiteSpace: 'nowrap'}}>
                {cite.who} · {cite.work}
              </div>
            )}
            <div style={{width: quant(clamp01((f - 70) / 30), 8) * 1440, height: 3, background: COL.ink, marginTop: 36}} />
            <div style={{marginTop: 30}}>
              {p.q.map((line, i) => (
                <Line key={i} segs={line} f={f} at={90 + i * 50} />
              ))}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ---------------- running header ---------------- */}
      {!inCard && (
        <div style={{position: 'absolute', left: 96, top: BOSSBAR.y, width: 1728, display: 'flex', alignItems: 'baseline', gap: 24, whiteSpace: 'nowrap', overflow: 'hidden', borderBottom: `3px solid ${COL.line}`, paddingBottom: 12}}>
          <span style={{fontFamily: FONT.press, fontSize: 16, color: COL.dim}}>CASE {noTxt}</span>
          <span style={{fontFamily: FONT.pixel, fontSize: 36, color: COL.text}}>{p.title}</span>
          <span style={{fontFamily: FONT.pixel, fontSize: 24, color: COL.dim, overflow: 'hidden', textOverflow: 'ellipsis'}}>{p.brief}</span>
        </div>
      )}

      {/* ---------------- narrative beats ---------------- */}
      {p.steps && !inCard && (
        <div style={{position: 'absolute', left: 96, top: STEPPER_Y, display: 'flex', alignItems: 'center', gap: 30}}>
          {p.steps.map((s, i) => {
            const on = i === curStep && !revealed;
            const done = i < curStep || revealed;
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONT.pixel,
                  fontSize: 24,
                  lineHeight: '36px',
                  color: on ? COL.invText : done ? COL.text : COL.dim,
                  background: on ? COL.inv : 'transparent',
                  padding: '0 12px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{fontFamily: FONT.press, fontSize: 12, marginRight: 12}}>{i + 1}</span>
                {s.label}
              </span>
            );
          })}
        </div>
      )}

      {/* ---------------- result + lesson ---------------- */}
      {revealed && result && (
        <div style={{position: 'absolute', right: 96, bottom: 120, maxWidth: 1140}}>
          <PixelBox color={COL.ink} fill={COL.panel} border={PX} pad="18px 30px 20px">
            <div style={{display: 'flex', alignItems: 'baseline', gap: 24, whiteSpace: 'nowrap'}}>
              <span style={{fontFamily: FONT.press, fontSize: 16, color: COL.dim}}>结果</span>
              <span style={{fontFamily: FONT.pixel, fontSize: 48, lineHeight: '60px', color: COL.text}}>{result.slice(0, Math.max(0, Math.floor((sf - p.reveal) * 1.5)))}</span>
            </div>
            {p.insight && sf - p.reveal > 30 && (
              <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.sub, marginTop: 12, maxWidth: 1080}}>
                {p.insight.slice(0, Math.floor((sf - p.reveal - 30) * 0.9))}
              </div>
            )}
          </PixelBox>
        </div>
      )}
    </AbsoluteFill>
  );
};
