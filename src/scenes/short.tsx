import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Cue} from '../components/Problem';
import {useF} from '../components/Shot';
import {BlockCursor} from '../components/pixel';
import {ACTS} from '../components/ui';
import {COL, FONT, PX} from '../theme';
import {Digest} from './short_digest';

/* Short version — its own summary scenes (v2) */

/* ====================================================================== */
/* The framing question → five threads                                    */
/* ====================================================================== */

const Q1 = '在不可信的世界里，';
const Q2 = '怎样让两个人安全地交谈、签字、证明？';
const Q_AT = 30;
/** both lines share the left edge of the (centred) longer line, so typing never shifts the text */
const Q_LEFT = 960 - (Q2.length * 72) / 2;
const Q_RATE = 4;
const Q2_AT = Q_AT + Q1.length * Q_RATE + 24;
const Q_DONE = Q2_AT + Q2.length * Q_RATE;
/** the three verbs get inverted one by one */
const VERBS: [number, number][] = [
  [Q2.indexOf('交谈'), 2],
  [Q2.indexOf('签字'), 2],
  [Q2.indexOf('证明'), 2],
];
const V_AT = Q_DONE + 54;
const V_GAP = 27;
const THREADS = ['保密', '交换', '签名', '证明', '未来'];
const W_AT = V_AT + 3 * V_GAP + 60;
const W_GAP = 36;
const END_AT = W_AT + 5 * W_GAP + 60;
const END_TXT = '五条主线，一部现代密码学';

const QLine: React.FC<{f: number; text: string; at: number; top: number; hi?: number}> = ({f, text, at, top, hi = 0}) => {
  const n = Math.max(0, Math.min(text.length, Math.floor((f - at) / Q_RATE)));
  if (f < at) return null;
  // split into plain / inverted runs (only the first `hi` verbs are inverted)
  const inv = new Array(text.length).fill(false);
  VERBS.slice(0, hi).forEach(([s, l]) => {
    for (let k = s; k < s + l; k++) inv[k] = true;
  });
  const runs: {t: string; inv: boolean}[] = [];
  for (let k = 0; k < n; k++) {
    const last = runs[runs.length - 1];
    if (last && last.inv === inv[k]) last.t += text[k];
    else runs.push({t: text[k], inv: inv[k]});
  }
  return (
    <div style={{position: 'absolute', top, left: Q_LEFT, fontFamily: FONT.pixel, fontSize: 72, lineHeight: '96px', color: COL.text, whiteSpace: 'pre'}}>
      {runs.map((r, i) => (
        <span key={i} style={r.inv ? {background: COL.inv, color: COL.invText} : undefined}>
          {r.t}
        </span>
      ))}
      {n < text.length && <BlockCursor f={f} size={72} on />}
    </div>
  );
};

export const ShortQuestion: React.FC = () => {
  const f = useF();
  const hi = f < V_AT ? 0 : Math.min(3, 1 + Math.floor((f - V_AT) / V_GAP));
  const en = Math.max(0, Math.min(END_TXT.length, Math.floor((f - END_AT) / 4)));
  return (
    <AbsoluteFill style={{background: COL.bg}}>
      {f >= 6 && <div style={{position: 'absolute', top: 186, width: 1920, textAlign: 'center', fontFamily: FONT.press, fontSize: 16, color: COL.dim, letterSpacing: '0.3em'}}>THE QUESTION</div>}
      <QLine f={f} text={Q1} at={Q_AT} top={258} />
      <QLine f={f} text={Q2} at={Q2_AT} top={366} hi={hi} />

      {f >= W_AT - 30 && <div style={{position: 'absolute', left: 960 - 48, top: 534, width: 96, height: PX, background: COL.ink}} />}

      {/* five threads */}
      <div style={{position: 'absolute', top: 600, width: 1920, display: 'flex', justifyContent: 'center', alignItems: 'flex-start'}}>
        {THREADS.map((w, i) => {
          const on = f >= W_AT + i * W_GAP;
          return (
            <React.Fragment key={i}>
              {i > 0 && <div style={{width: 12, height: 12, marginTop: 108, marginLeft: 48, marginRight: 48, background: on ? COL.dim : COL.bg}} />}
              <div style={{width: 216, textAlign: 'center', whiteSpace: 'nowrap'}}>
                {on && (
                  <>
                    <div style={{fontFamily: FONT.press, fontSize: 24, lineHeight: '36px', color: COL.dim}}>{ACTS[i].num}</div>
                    <div style={{fontFamily: FONT.pixel, fontSize: 72, lineHeight: '96px', color: COL.text, marginTop: 12}}>{w}</div>
                    <div style={{fontFamily: FONT.pixel, fontSize: 24, lineHeight: '36px', color: COL.dim, marginTop: 12}}>{ACTS[i].name}</div>
                  </>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {f >= END_AT && (
        <div style={{position: 'absolute', top: 888, width: 1920, textAlign: 'center', fontFamily: FONT.pixel, fontSize: 36, lineHeight: '48px', color: COL.sub, whiteSpace: 'nowrap'}}>
          {END_TXT.slice(0, en)}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const ShortQuestionCues: Cue[] = [
  ...new Array(Math.ceil(Q1.length / 2)).fill(0).map((_, k): Cue => [Q_AT + k * Q_RATE * 2, 'type']),
  ...new Array(Math.ceil(Q2.length / 2)).fill(0).map((_, k): Cue => [Q2_AT + k * Q_RATE * 2, 'type']),
  [Q_DONE + 6, 'bell', 72],
  ...[0, 1, 2].map((i): Cue => [V_AT + i * V_GAP, 'blip', [67, 71, 74][i]]),
  [W_AT - 30, 'whoosh'],
  ...THREADS.map((_, i): Cue => [W_AT + i * W_GAP, 'blip', [72, 76, 79, 84, 88][i]]),
  [W_AT + 4 * W_GAP + 24, 'chime'],
  [END_AT, 'type'],
];

/* ====================================================================== */
/* Five chapter digests (see short_digest.tsx; data in short_nodes.ts)    */
/* ====================================================================== */

export const DigestSym: React.FC = () => <Digest act={0} />;
export const DigestPk: React.FC = () => <Digest act={1} />;
export const DigestSig: React.FC = () => <Digest act={2} />;
export const DigestZk: React.FC = () => <Digest act={3} />;
export const DigestFr: React.FC = () => <Digest act={4} />;
export {DigestCues, DigestFrCues, DigestPkCues, DigestSigCues, DigestSymCues, DigestZkCues} from './short_digest';
