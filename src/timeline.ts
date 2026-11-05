import React from 'react';
import type {Cue} from './components/Problem';
import {FLASH, IRIS, RISE, ShotDef, SLIDE, Trans, ZOOM} from './components/Shot';
import {COL} from './theme';
import * as I from './scenes/Intro';
import * as HW from './scenes/hw';
import * as LLM from './scenes/llm';
import * as RUN from './scenes/run';
import * as GO from './scenes/go';
import * as DS from './scenes/ds';
import * as DS2 from './scenes/ds2';
import * as FIN from './scenes/fin';

export type Mood = 'intro' | 'overview' | 'title' | 'concept' | 'problem' | 'credits' | 'lockup' | 'logo';

/**
 * Pacing tiers:
 *   A = core idea, slow (0.75×)   B = standard (0.88×)   C = brisk (1.0×)
 *   T = chapter title (0.67×)     S = steady bookends: intro / overview / ending (0.85×, no emphasis windows)
 * On top of the base speed, up to three key moments per shot (`reveal` first, then `bell`, then `chime` cues)
 * get a 1 s slow window (0.4×) so they can be read. Shot length = warped length rounded up to whole bars.
 */
export type Tier = 'A' | 'B' | 'C' | 'T' | 'S';
const BASE: Record<Tier, number> = {A: 0.75, B: 0.88, C: 1.0, T: 0.67, S: 0.85};

type Entry = {id: string; C: React.FC; nat: number; mood: Mood; tin?: Trans; cues?: Cue[]; tier: Tier};
const E = (id: string, C: React.FC, nat: number, mood: Mood, tier: Tier, tin?: Trans, cues?: Cue[]): Entry => ({id, C, nat, mood, tin, cues, tier});

export const ACT_DEFS: {key: string; color: string; entries: Entry[]}[] = [
  {
    key: 'intro',
    color: COL.intro,
    entries: [E('intro', I.Intro, 900, 'intro', 'S', undefined, I.IntroCues), E('overview', I.Overview, 780, 'overview', 'S', ZOOM, I.OverviewCues)],
  },
  {
    key: 'hw',
    color: COL.ink,
    entries: [
      E('hw_title', HW.HwTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('hw_chip', HW.HwChip, 960, 'concept', 'A', ZOOM, HW.HwChipCues),
      E('hw_mem', HW.HwMem, 960, 'concept', 'A', SLIDE, HW.HwMemCues),
      E('hw_dot', HW.HwDot, 840, 'concept', 'B', ZOOM, HW.HwDotCues),
      E('hw_roof', HW.HwRoof, 960, 'concept', 'A', SLIDE, HW.HwRoofCues),
    ],
  },
  {
    key: 'llm',
    color: COL.ink,
    entries: [
      E('llm_title', LLM.LlmTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('llm_loop', LLM.LlmLoop, 960, 'concept', 'A', ZOOM, LLM.LlmLoopCues),
      E('llm_layers', LLM.LlmLayers, 840, 'concept', 'B', SLIDE, LLM.LlmLayersCues),
      E('llm_attn', LLM.LlmAttn, 1020, 'concept', 'A', ZOOM, LLM.LlmAttnCues),
      E('llm_kv', LLM.LlmKv, 960, 'concept', 'A', SLIDE, LLM.LlmKvCues),
      E('llm_cost', LLM.LlmCost, 840, 'concept', 'B', ZOOM, LLM.LlmCostCues),
      E('llm_quant', LLM.LlmQuant, 960, 'concept', 'A', SLIDE, LLM.LlmQuantCues),
    ],
  },
  {
    key: 'run',
    color: COL.ink,
    entries: [
      E('run_title', RUN.RunTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('run_base', RUN.RunBase, 840, 'concept', 'B', ZOOM, RUN.RunBaseCues),
      E('run_mega', RUN.RunMega, 960, 'concept', 'A', SLIDE, RUN.RunMegaCues),
      E('run_flash', RUN.RunFlash, 960, 'concept', 'A', ZOOM, RUN.RunFlashCues),
      E('run_gemm', RUN.RunGemm, 780, 'concept', 'B', SLIDE, RUN.RunGemmCues),
      E('run_p_collapse', RUN.RunCollapse, 1440, 'problem', 'A', RISE, RUN.RunCollapseCues),
      E('run_fix', RUN.RunFix, 840, 'concept', 'B', ZOOM, RUN.RunFixCues),
      E('run_overlap', RUN.RunOverlap, 960, 'concept', 'A', SLIDE, RUN.RunOverlapCues),
    ],
  },
  {
    key: 'go',
    color: COL.ink,
    entries: [
      E('go_title', GO.GoTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('go_stack', GO.GoStack, 960, 'concept', 'A', ZOOM, GO.GoStackCues),
      E('go_l2', GO.GoL2, 900, 'concept', 'A', SLIDE, GO.GoL2Cues),
      E('go_p_race', GO.GoRace, 1320, 'problem', 'B', RISE, GO.GoRaceCues),
      E('go_p_vm', GO.GoVm, 1200, 'problem', 'B', RISE, GO.GoVmCues),
      E('go_bin', GO.GoBin, 840, 'concept', 'B', ZOOM, GO.GoBinCues),
    ],
  },
  {
    key: 'ds',
    color: COL.ink,
    entries: [
      E('ds_title', DS.DsTitle, 240, 'title', 'T', IRIS(COL.ink)),
      E('ds_idea', DS.DsIdea, 1080, 'concept', 'A', ZOOM, DS.DsIdeaCues),
      E('ds_drafter', DS.DsDrafter, 1020, 'concept', 'A', SLIDE, DS.DsDrafterCues),
      E('ds_round', DS.DsRound, 960, 'concept', 'A', ZOOM, DS.DsRoundCues),
      E('ds_roof', DS2.DsRoof, 900, 'concept', 'B', SLIDE, DS2.DsRoofCues),
      E('ds_tricks', DS2.DsTricks, 1020, 'concept', 'A', ZOOM, DS2.DsTricksCues),
      E('ds_p_int8', DS2.DsInt8, 1320, 'problem', 'B', RISE, DS2.DsInt8Cues),
      E('ds_p_chaos', DS2.DsChaos, 1440, 'problem', 'A', RISE, DS2.DsChaosCues),
      E('ds_cross', DS2.DsCross, 900, 'concept', 'B', SLIDE, DS2.DsCrossCues),
    ],
  },
  {
    key: 'fin',
    color: COL.ink,
    entries: [
      E('fin_result', FIN.Result, 1020, 'credits', 'S', IRIS(COL.ink), FIN.ResultCues),
      E('fin_open', FIN.Open, 720, 'credits', 'S', ZOOM, FIN.OpenCues),
      E('fin_credits', FIN.Credits, 1020, 'credits', 'S', ZOOM, FIN.CreditsCues),
      E('fin_logo', FIN.Logo, 600, 'logo', 'S', FLASH, FIN.LogoCues),
    ],
  },
];

/* ------------------------------------------------------------------ build */

export type TShot = ShotDef & {mood: Mood; act: number; cues: Cue[]; dur: number; tier: Tier};

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

const build = () => {
  const SHOTS: TShot[] = [];
  let t = 0;
  ACT_DEFS.forEach((a, ai) => {
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
  const ACT_RANGES = ACT_DEFS.map((a, ai) => {
    const s = SHOTS.filter((x) => x.act === ai);
    return {key: a.key, color: a.color, s: s[0].start, e: s[s.length - 1].end};
  });
  return {SHOTS, TOTAL, ACT_RANGES};
};

export const {SHOTS, TOTAL, ACT_RANGES} = build();

/** start frame of a shot by id (handy for stills / debugging) */
export const shotStart = (id: string) => SHOTS.find((s) => s.id === id)?.start ?? 0;
/** real global frame at which a shot shows scene-frame `sf` */
export const sceneFrame = (id: string, sf: number) => {
  const s = SHOTS.find((x) => x.id === id);
  return s ? s.start + (s.warp ? toReal(s.warp, sf) : sf) : 0;
};
