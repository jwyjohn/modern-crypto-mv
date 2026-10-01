import React from 'react';
import type {Cue} from './components/Problem';
import {FLASH, IRIS, RISE, ShotDef, SLIDE, Trans, ZOOM} from './components/Shot';
import {COL} from './theme';
import {Intro, IntroCues, IntroShort, IntroShortCues} from './scenes/Intro';
import {Overview, OverviewCues} from './scenes/Overview';
import * as S from './scenes/sym';
import * as SX from './scenes/symx';
import * as P from './scenes/pk';
import * as G from './scenes/sig';
import * as Z from './scenes/zk';
import * as ZP from './scenes/zkp';
import * as FR from './scenes/fr';
import * as SH from './scenes/short';
import {CHAINS, digestFrames} from './scenes/short_nodes';
import * as FIN from './scenes/fin';

export type Mood = 'intro' | 'overview' | 'title' | 'concept' | 'problem' | 'credits' | 'lockup' | 'logo' | 'question' | 'digest' | 'ideas';

/**
 * Pacing tiers (see docs/PLAN_v2.md):
 *   A = core idea, slow (0.75×)   B = standard (0.88×)   C = brisk (1.0×)
 *   T = chapter title (0.67×)     S = steady bookends: intro / overview / ending (0.85×, no emphasis windows)
 * On top of the base speed, up to three key moments per shot (`reveal` first, then `bell`, then `chime` cues)
 * get a 1 s slow window (0.4×) so they can be read. Shot length = warped length rounded up to whole bars.
 */
export type Tier = 'A' | 'B' | 'C' | 'T' | 'S';
const BASE: Record<Tier, number> = {A: 0.75, B: 0.88, C: 1.0, T: 0.67, S: 0.85};

type Entry = {id: string; C: React.FC; nat: number; mood: Mood; tin?: Trans; cues?: Cue[]; tier: Tier};
const E = (id: string, C: React.FC, nat: number, mood: Mood, tier: Tier, tin?: Trans, cues?: Cue[]): Entry => ({id, C, nat, mood, tin, cues, tier});

/* ------------------------------------------------------------------ full version */

export const ACT_DEFS: {key: string; color: string; entries: Entry[]}[] = [
  {
    key: 'intro',
    color: COL.intro,
    entries: [E('intro', Intro, 960, 'intro', 'S', undefined, IntroCues), E('overview', Overview, 960, 'overview', 'S', ZOOM, OverviewCues)],
  },
  {
    key: 'sym',
    color: COL.sym,
    entries: [
      E('sym_title', S.SymTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('sym_otp', S.SymOtp, 720, 'concept', 'A', ZOOM, S.SymOtpCues),
      E('sym_p_twotime', S.SymTwoTime, 1440, 'problem', 'B', RISE, S.SymTwoTimeCues),
      E('sym_aes', S.SymAes, 840, 'concept', 'B', SLIDE, S.SymAesCues),
      E('sym_crypt', SX.SymCryptTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('sym_diff', SX.SymDiff, 960, 'concept', 'A', ZOOM, SX.SymDiffCues),
      E('sym_linear', SX.SymLinear, 840, 'concept', 'B', SLIDE, SX.SymLinearCues),
      E('sym_p_algebraic', SX.SymAlgebraic, 1440, 'problem', 'A', RISE, SX.SymAlgebraicCues),
      E('sym_modes', S.SymModes, 840, 'concept', 'B', ZOOM, S.SymModesCues),
      E('sym_p_birthday', S.SymBirthday, 1320, 'problem', 'B', RISE, S.SymBirthdayCues),
      E('sym_ae', S.SymAe, 720, 'concept', 'C', SLIDE, S.SymAeCues),
      E('sym_p_padding', S.SymPadding, 1560, 'problem', 'A', RISE, S.SymPaddingCues),
    ],
  },
  {
    key: 'pk',
    color: COL.pk,
    entries: [
      E('pk_title', P.PkTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('pk_dh', P.PkDh, 840, 'concept', 'A', ZOOM, P.PkDhCues),
      E('pk_group', P.PkGroup, 720, 'concept', 'B', SLIDE, P.PkGroupCues),
      E('pk_p_rsa', P.PkRsa, 1560, 'problem', 'A', RISE, P.PkRsaCues),
      E('pk_ecc', P.PkEcc, 840, 'concept', 'B', ZOOM, P.PkEccCues),
      E('pk_p_hastad', P.PkHastad, 1440, 'problem', 'B', RISE, P.PkHastadCues),
      E('pk_tls', P.PkTls, 720, 'concept', 'B', SLIDE, P.PkTlsCues),
    ],
  },
  {
    key: 'sig',
    color: COL.sig,
    entries: [
      E('sig_title', G.SigTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('sig_euf', G.SigEuf, 720, 'concept', 'A', ZOOM, G.SigEufCues),
      E('sig_lamport', G.SigLamport, 840, 'concept', 'B', SLIDE, G.SigLamportCues),
      E('sig_p_lamport2', G.SigLamport2, 1440, 'problem', 'C', RISE, G.SigLamport2Cues),
      E('sig_schnorr', G.SigSchnorr, 840, 'concept', 'A', ZOOM, G.SigSchnorrCues),
      E('sig_p_nonce', G.SigNonce, 1560, 'problem', 'A', RISE, G.SigNonceCues),
      E('sig_merkle', G.SigMerkle, 840, 'concept', 'B', SLIDE, G.SigMerkleCues),
      E('sig_bls', G.SigBls, 720, 'concept', 'B', ZOOM, G.SigBlsCues),
    ],
  },
  {
    key: 'zk',
    color: COL.zk,
    entries: [
      E('zk_title', Z.ZkTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('zk_cave', Z.ZkCave, 840, 'concept', 'A', ZOOM, Z.ZkCaveCues),
      E('zk_gi', ZP.ZkGi, 840, 'concept', 'B', SLIDE, ZP.ZkGiCues),
      E('zk_sigma', Z.ZkSigma, 960, 'concept', 'A', ZOOM, Z.ZkSigmaCues),
      E('zk_p_fs', ZP.ZkFs, 1320, 'problem', 'A', RISE, ZP.ZkFsCues),
      E('zk_sumcheck', ZP.ZkSumcheck, 840, 'concept', 'B', SLIDE, ZP.ZkSumcheckCues),
      E('zk_snark', Z.ZkSnark, 720, 'concept', 'B', ZOOM, Z.ZkSnarkCues),
    ],
  },
  {
    key: 'fr',
    color: COL.fr,
    entries: [
      E('fr_title', FR.FrTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('fr_lwe', Z.ZkLwe, 960, 'concept', 'A', ZOOM, Z.ZkLweCues),
      E('fr_dilithium', FR.FrDilithium, 840, 'concept', 'B', SLIDE, FR.FrDilithiumCues),
      E('fr_masking', FR.FrMasking, 960, 'concept', 'B', ZOOM, FR.FrMaskingCues),
      E('fr_p_shamir', Z.ZkShamir, 1440, 'problem', 'B', RISE, Z.ZkShamirCues),
      E('fr_mpc', FR.FrMpc, 960, 'concept', 'A', ZOOM, FR.FrMpcCues),
      E('fr_pir', FR.FrPir, 720, 'concept', 'C', ZOOM, FR.FrPirCues),
      E('fr_dp', FR.FrDp, 840, 'concept', 'B', SLIDE, FR.FrDpCues),
      E('fr_fhe', Z.ZkFhe, 720, 'concept', 'B', ZOOM, Z.ZkFheCues),
    ],
  },
  {
    key: 'fin',
    color: COL.ink,
    entries: [
      E('fin_credits', FIN.Credits, 1080, 'credits', 'S', IRIS(COL.ink), FIN.CreditsCues),
      E('fin_lock', FIN.LockUp, 480, 'lockup', 'S', ZOOM, FIN.LockUpCues),
      E('fin_logo', FIN.Logo, 600, 'logo', 'S', FLASH, FIN.LogoCues),
    ],
  },
];

/* ------------------------------------------------------------------ short version: its own summary film */

export const SHORT_DEFS: {key: string; color: string; entries: Entry[]}[] = [
  {
    key: 'intro',
    color: COL.intro,
    entries: [E('s_intro', IntroShort, 720, 'intro', 'C', undefined, IntroShortCues), E('s_question', SH.ShortQuestion, 720, 'question', 'C', ZOOM, SH.ShortQuestionCues)],
  },
  {key: 'sym', color: COL.sym, entries: [E('s_digest_sym', SH.DigestSym, digestFrames(CHAINS[0].nodes.length), 'digest', 'C', IRIS(COL.ink), SH.DigestSymCues)]},
  {key: 'pk', color: COL.pk, entries: [E('s_digest_pk', SH.DigestPk, digestFrames(CHAINS[1].nodes.length), 'digest', 'C', IRIS(COL.ink), SH.DigestPkCues)]},
  {key: 'sig', color: COL.sig, entries: [E('s_digest_sig', SH.DigestSig, digestFrames(CHAINS[2].nodes.length), 'digest', 'C', IRIS(COL.ink), SH.DigestSigCues)]},
  {key: 'zk', color: COL.zk, entries: [E('s_digest_zk', SH.DigestZk, digestFrames(CHAINS[3].nodes.length), 'digest', 'C', IRIS(COL.ink), SH.DigestZkCues)]},
  {key: 'fr', color: COL.fr, entries: [E('s_digest_fr', SH.DigestFr, digestFrames(CHAINS[4].nodes.length), 'digest', 'C', IRIS(COL.ink), SH.DigestFrCues)]},
  {
    key: 'fin',
    color: COL.ink,
    entries: [E('fin_logo', FIN.Logo, 600, 'logo', 'C', IRIS(COL.ink), FIN.LogoCues)],
  },
];

/* ------------------------------------------------------------------ build */

export type TShot = ShotDef & {mood: Mood; act: number; cues: Cue[]; dur: number; tier: Tier};
export type Variant = 'full' | 'short';
export type Timeline = {SHOTS: TShot[]; TOTAL: number; ACT_RANGES: {key: string; color: string; s: number; e: number}[]};


/** real-frame → scene-frame table for one shot */
export const makeWarp = (nat: number, tier: Tier, cues: Cue[]) => {
  const base = BASE[tier];
  const rank = (t: string) => (t === 'reveal' ? 0 : t === 'bell' ? 1 : t === 'chime' ? 2 : 9);
  const key = tier === 'A' || tier === 'B' ? cues.filter((c) => rank(c[1]) < 9).sort((x, y) => rank(x[1]) - rank(y[1]) || x[0] - y[0]).slice(0, 3) : [];
  const slow = key.map(([c]) => [c - 3, c + 60] as [number, number]);
  const speed = (s: number) => {
    let v = base;
    for (const [a, b] of slow) if (s >= a && s < b) v = Math.min(v, 0.4);
    return v;
  };
  const out: number[] = [];
  let s = 0;
  while (s < nat) {
    out.push(s);
    s += speed(s);
  }
  const real = Math.ceil(out.length / 120) * 120;
  while (out.length < real) out.push(nat - 1); // end hold
  return new Float32Array(out);
};

const toReal = (warp: Float32Array, c: number) => {
  let lo = 0;
  let hi = warp.length - 1;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (warp[m] >= c) hi = m;
    else lo = m + 1;
  }
  return lo;
};

const build = (defs: typeof ACT_DEFS): Timeline => {
  const SHOTS: TShot[] = [];
  let t = 0;
  defs.forEach((a) => {
    const ai = ACT_DEFS.findIndex((x) => x.key === a.key);
    a.entries.forEach((e) => {
      const cues = e.cues ?? [];
      const warp = makeWarp(e.nat, e.tier, cues);
      const dur = warp.length;
      const realCues: Cue[] = cues.map((c) => [toReal(warp, c[0]), c[1], c[2]]);
      SHOTS.push({id: e.id, C: e.C, start: t, end: t + dur, tin: e.tin, mood: e.mood, act: ai, cues: realCues, dur, tier: e.tier, warp, natural: e.nat});
      t += dur;
    });
  });
  const TOTAL = SHOTS[SHOTS.length - 1].end;
  const ACT_RANGES = defs.map((a) => {
    const ai = ACT_DEFS.findIndex((x) => x.key === a.key);
    const s = SHOTS.filter((x) => x.act === ai);
    return {key: a.key, color: a.color, s: s[0].start, e: s[s.length - 1].end};
  });
  return {SHOTS, TOTAL, ACT_RANGES};
};

export const TIMELINES: Record<Variant, Timeline> = {
  full: build(ACT_DEFS),
  short: build(SHORT_DEFS),
};

// full version as the default exports (scripts / tools)
export const {SHOTS, TOTAL, ACT_RANGES} = TIMELINES.full;

/** start frame of a shot by id (handy for stills / debugging) */
export const shotStart = (id: string, v: Variant = 'full') => TIMELINES[v].SHOTS.find((s) => s.id === id)?.start ?? 0;
/** real global frame at which a shot shows scene-frame `sf` */
export const sceneFrame = (id: string, sf: number, v: Variant = 'full') => {
  const s = TIMELINES[v].SHOTS.find((x) => x.id === id);
  return s ? s.start + (s.warp ? toReal(s.warp, sf) : sf) : 0;
};
