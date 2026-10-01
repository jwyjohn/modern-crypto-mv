"""8-bit (NES-style) procedural score for the Modern Cryptography video — an 8-bit arrangement of Pachelbel's Canon in D (public domain).

Channels, as on a 2A03: two pulse waves (duty 12.5 / 25 / 50 %), a 4-bit stepped triangle (bass),
and an LFSR-style noise channel (drums). Envelopes are quantised to 16 volume steps.
Arrangement is driven by audio/timeline.json (export with `node scripts/export_timeline.mjs`):
120 BPM, 1 bar = 2 s = 120 frames, every shot is a whole number of bars. Scene cues become chip SFX."""
import json
import sys

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
BEAT = 0.5
BAR = 2.0
# usage: make_music.py [timeline.json] [out.wav]
TL_PATH = sys.argv[1] if len(sys.argv) > 1 else 'audio/timeline.json'
OUT_PATH = sys.argv[2] if len(sys.argv) > 2 else 'public/music.wav'
TL = json.load(open(TL_PATH))
SHOTS = TL['shots']
TOTAL = TL['total'] / 60
N = int(SR * (TOTAL + 0.5))
rng = np.random.default_rng(1949)
F32 = np.float32

OUT = np.zeros((N, 2), F32)
ECHO = np.zeros((N, 2), F32)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(t0, sig, gain=1.0, pan=0.0, echo=0.0):
    i0 = int(round(t0 * SR))
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
    if i0 >= N or len(sig) == 0:
        return
    n = min(len(sig), N - i0)
    s = sig[:n].astype(F32) * gain
    l = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    r = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    OUT[i0:i0 + n, 0] += s * l
    OUT[i0:i0 + n, 1] += s * r
    if echo:
        ECHO[i0:i0 + n, 0] += s * l * echo
        ECHO[i0:i0 + n, 1] += s * r * echo


# ------------------------------------------------------------------ chip voices

def env16(n, attack=0.005, decay=0.25, sustain=0.6, release=0.05, hold=None):
    """ADSR, quantised to 16 levels and stepped at 240 Hz (like a frame-counter envelope)."""
    t = np.arange(n) / SR
    hold = (n / SR - release) if hold is None else hold
    e = np.where(t < attack, t / max(attack, 1e-4), sustain + (1 - sustain) * np.exp(-(t - attack) / max(decay, 1e-4)))
    e = np.where(t > hold, e * np.clip(1 - (t - hold) / max(release, 1e-4), 0, 1), e)
    step = (np.floor(t * 240) / 240 * SR).astype(int).clip(0, n - 1)
    e = e[step]
    return np.round(np.clip(e, 0, 1) * 15) / 15


def pulse(f, dur, duty=0.5, vib=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    if vib:
        ph = np.cumsum(f * (1 + vib * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.25) * 3, 0, 1))) / SR
    else:
        ph = f * t
    return np.where((ph % 1.0) < duty, 1.0, -1.0)


def tri(f, dur):
    n = int(dur * SR)
    ph = (f * np.arange(n) / SR) % 1.0
    v = 1 - 4 * np.abs(ph - 0.5)
    return np.round(v * 7.5) / 7.5  # 4-bit staircase


_NOISE = np.where(rng.random(SR * 4) < 0.5, -1.0, 1.0)
_NOISE_SHORT = np.where(rng.random(93) < 0.5, -1.0, 1.0)


def noise(dur, period=1, short=False):
    n = int(dur * SR)
    src = _NOISE_SHORT if short else _NOISE
    idx = (np.arange(n) // max(1, period)) % len(src)
    return src[idx]


def note_pulse(m, dur, duty=0.5, decay=0.3, sustain=0.55, vib=0.0, release=0.04):
    return pulse(mtof(m), dur, duty, vib) * env16(int(dur * SR), 0.004, decay, sustain, release)


def note_tri(m, dur):
    n = int(dur * SR)
    return tri(mtof(m), dur) * env16(n, 0.002, 0.5, 0.9, 0.02)


def kick():
    d = 0.16
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 160 * np.exp(-t * 28) + 45
    ph = np.cumsum(f) / SR
    v = 1 - 4 * np.abs((ph % 1) - 0.5)
    return np.round(v * 7.5) / 7.5 * env16(n, 0.001, 0.06, 0.0, 0.01)


def snare():
    d = 0.18
    body = noise(d, 3) * env16(int(d * SR), 0.001, 0.05, 0.0, 0.01) * 0.8
    k = kick()
    body[: len(k)] += k * 0.2
    return body


def hat(open_=False):
    d = 0.12 if open_ else 0.04
    return noise(d, 1, short=True) * env16(int(d * SR), 0.001, 0.05 if open_ else 0.012, 0.0, 0.005)


def crash(d=1.2):
    return noise(d, 2) * env16(int(d * SR), 0.001, 0.35, 0.0, 0.05)


def sweep(f0, f1, dur, duty=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur)
    ph = np.cumsum(f) / SR
    return np.where((ph % 1) < duty, 1.0, -1.0) * env16(n, 0.002, dur, 0.4, 0.05)


def noise_sweep(dur, p0, p1):
    n = int(dur * SR)
    out = np.zeros(n)
    k = 0
    i = 0
    while i < n:
        p = int(p0 + (p1 - p0) * i / n)
        seg = min(n - i, 240)
        out[i:i + seg] = noise(seg / SR, max(1, p))[:seg]
        i += seg
        k += 1
    return out * env16(n, dur * 0.4, dur, 0.2, dur * 0.3)


# ------------------------------------------------------------------ keys
KEY = [0, 0, 2, 4, 5, 7, 0]  # act index: intro, I, II, III, IV, V, fin → D, D, E, F#, G, A, D


def shot_at(fr):
    for s in SHOTS:
        if s['start'] <= fr < s['end']:
            return s
    return SHOTS[-1]


# ---- percussion

def drums(t0, style, vel=1.0):
    d = BAR / 16
    if style == 'none':
        return
    if style == 'taiko':  # sparse 3+3+2 hits, epic
        for k in (0, 3, 6):
            place(t0 + k * d, kick(), 0.55 * vel)
        for k in (8, 11, 14):
            place(t0 + k * d, kick(), 0.4 * vel)
        place(t0 + 12 * d, snare(), 0.25 * vel)
        return
    if style == 'pulse':
        place(t0, kick(), 0.5 * vel)
        place(t0 + 8 * d, kick(), 0.4 * vel)
        return
    if style == 'half':
        place(t0, kick(), 0.55 * vel)
        place(t0 + 8 * d, snare(), 0.3 * vel)
        for k in range(0, 16, 4):
            place(t0 + k * d, hat(), 0.07 * vel, pan=0.2)
        return
    # 'full': kicks on 3+3+2, snare on 2 & 4, 16th hats
    for k in (0, 3, 6, 8, 11, 14):
        place(t0 + k * d, kick(), (0.55 if k in (0, 8) else 0.38) * vel)
    for k in (4, 12):
        place(t0 + k * d, snare(), 0.32 * vel)
    for k in range(16):
        place(t0 + k * d, hat(k % 4 == 2), (0.08 if k % 2 == 0 else 0.05) * vel, pan=0.25)


# ------------------------------------------------------------------ Pachelbel, Canon in D (public domain) — 8-bit
#
# Ground bass D–A–B–F#–G–D–G–A in the triangle, a three-voice strict canon in three pulse voices
# (duties 25 / 50 / 12.5 %), each entering one ground-cycle-half later, all playing the same chain of variations.
# Time scale: one ground note = 2 beats (1 s) → one cycle = 4 bars = 8 s (≈ the usual performing tempo).
# Original crotchets → half notes here, quavers → crotchets, semiquavers → quavers.

# semitones above D4 (62) for melodies; the ground in the triangle two octaves lower
GROUND = [0, -5, -3, -8, -7, -12, -7, -5]  # D A B F# G D G A (relative to D3 after the -12 below)
G_CHORD = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [4, 9, 12], [5, 9, 12], [0, 4, 7], [5, 9, 12], [7, 11, 14]]  # D A Bm F#m G D G A (as pitch classes over D)


NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def nm(n):
    """'F#5' → semitones above D4"""
    pc = NOTE[n[0]] + (1 if '#' in n else -1 if 'b' in n[1:] else 0)
    octv = int(n[-1])
    return (octv + 1) * 12 + pc - 62


def line(spec):
    """spec: list of (original beats, note name or None); original beats are doubled (crotchet → 2 beats here)"""
    out, b = [], 0.0
    for d, n in spec:
        if n is not None:
            out.append((b, d * 2, nm(n)))
        b += d * 2
    return out


q = lambda *ns: [(1, n) for n in ns]          # crotchets
e = lambda *ns: [(0.5, n) for n in ns]        # quavers
s16 = lambda *ns: [(0.25, n) for n in ns]     # semiquavers

# the canon's melody (violin line), in its original order — public domain
V = [
    line(q('F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'B4', 'C#5')),
    line(q('D5', 'C#5', 'B4', 'A4', 'G4', 'F#4', 'G4', 'E4')),
    line(e('D4', 'F#4', 'A4', 'G4', 'F#4', 'D4', 'F#4', 'E4', 'D4', 'B3', 'D4', 'A4', 'G4', 'B4', 'A4', 'G4')),
    line(e('F#4', 'D4', 'E4', 'C#5', 'D5', 'F#5', 'A5', 'A4', 'B4', 'G4', 'A4', 'F#4', 'D4', 'D5', 'D5', 'C#5')),
    line(s16('D5', 'C#5', 'D5', 'D4', 'C#4', 'A4', 'E4', 'F#4', 'D4', 'D5', 'C#5', 'B4', 'C#5', 'F#5', 'A5', 'B5',
             'G5', 'F#5', 'E5', 'G5', 'F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'G4', 'F#4', 'E4', 'G4', 'F#4', 'E4')),
    line([(0.5, 'A5'), (0.25, 'F#5'), (0.25, 'G5'), (0.5, 'A5'), (0.25, 'F#5'), (0.25, 'G5')] + s16('A5', 'A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G5') +
         [(0.5, 'F#5'), (0.25, 'D5'), (0.25, 'E5'), (0.5, 'F#5'), (0.25, 'F#4'), (0.25, 'G4')] + s16('A4', 'B4', 'A4', 'G4', 'A4', 'F#4', 'G4', 'A4')),
    line([(0.5, 'G4'), (0.25, 'B4'), (0.25, 'A4'), (0.5, 'G4'), (0.25, 'F#4'), (0.25, 'E4')] + s16('F#4', 'E4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4') +
         [(0.5, 'G4'), (0.25, 'B4'), (0.25, 'A4'), (0.5, 'B4'), (0.25, 'C#5'), (0.25, 'D5')] + s16('A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G5', 'A5')),
]


def chain(i):
    """variation for cycle i of a voice: the original sequence, then it cycles again an octave up"""
    if i < len(V):
        return V[i]
    j = (i - len(V)) % len(V)
    up = 12 if (j < 2) else 0
    return [(b, d, p + up) for b, d, p in V[j]]


DUTY = [0.25, 0.5, 0.125]
PAN = [-0.35, 0.35, 0.0]


# ------------------------------------------------------------------ arrangement: ONE continuous canon for the whole film
#
# The ground and the three canon voices run on a single global clock (cycles of 4 bars from t = 0); the melody
# never restarts at a shot boundary. Shots only set the DENSITY (how many voices sound, drums, choir, level).
# Key changes happen only at cycle boundaries (the key of the act in which the cycle starts).


def density(s, bar_in_shot, nb):
    mood, tier = s['mood'], s.get('tier', 'B')
    rev = [c[0] // 120 for c in s['cues'] if c[1] == 'reveal']
    if mood == 'intro':
        k = bar_in_shot / max(1, nb)
        return dict(voices=0 if k < 0.3 else 1 if k < 0.6 else 2, drums='none', choir=k >= 0.3, gain=0.85)
    if mood == 'question':
        return dict(voices=1, drums='none', choir=True, gain=0.85)
    if mood == 'title':
        return dict(voices=3, drums='taiko', choir=True, gain=1.0)
    if mood in ('overview', 'digest'):
        return dict(voices=3, drums='half' if bar_in_shot < 4 else 'full', choir=True, gain=0.95)
    if mood in ('credits', 'ideas', 'lockup'):
        return dict(voices=3, drums='full', choir=True, gain=1.0)
    if mood == 'logo':
        return dict(voices=2, drums='none', choir=True, gain=0.9)
    if mood == 'problem':
        after = bool(rev) and bar_in_shot >= rev[0]
        return dict(voices=2 if after else 1, drums='none', choir=after, gain=0.8)
    if mood == 'concept':
        if tier == 'A':
            return dict(voices=3, drums='full' if bar_in_shot >= 2 else 'half', choir=True, gain=1.0)
        if tier == 'C':
            return dict(voices=2, drums='half', choir=False, gain=0.85)
        return dict(voices=2, drums='half', choir=True, gain=0.9)
    return dict(voices=2, drums='half', choir=False, gain=0.9)


NBARS = int(np.ceil(TOTAL / BAR))
END_CAD = NBARS - 2  # final two bars: G – A – D
ENTRY = [1, 2, 3]  # voices enter on global cycles 1, 2, 3 and then keep going for the whole film
MAJSC = [0, 2, 4, 5, 7, 9, 11]

# ---- per-bar targets, then smoothing so sections join without jumps
TARGET = []
for bar in range(NBARS):
    s = shot_at(bar * 120)
    TARGET.append(density(s, (bar * 120 - s['start']) // 120, max(1, (s['end'] - s['start']) // 120)))
DEN = []
pv, pg = 0, 0.85
for bar, T in enumerate(TARGET):
    v = max(pv - 1, min(pv + 1, T['voices']))  # add / drop at most one voice per bar
    g = pg + (T['gain'] - pg) * 0.5  # level glides over ~2 bars
    DEN.append(dict(T, voices=v, gain=g))
    pv, pg = v, g

CYC_ACT = [shot_at(c * 4 * 120)['act'] for c in range(NBARS // 4 + 2)]


def bridge_run(t0, key_from, key_to):
    """variation as a bridge: a running scale (the canon's semiquaver figure, in quavers) climbing from the old
    key's dominant to the new key's leading tone, while the ground pivots to the new key's dominant."""
    start = 62 + key_from + 7
    target = 62 + key_to + 11 + (12 if key_to + 11 < key_from + 7 else 0)
    deg = MAJSC.index(7)
    notes = []
    p = start
    o = 0
    for k in range(7):
        notes.append(p)
        deg += 1
        if deg >= 7:
            deg -= 7
            o += 12
        p = 62 + key_from + MAJSC[deg] + o
    notes.append(target)
    for k, m in enumerate(notes):
        place(t0 + k * BEAT / 2, note_pulse(m, BEAT * 0.48, 0.25, 0.1, 0.5), 0.1 + 0.006 * k, pan=-0.15, echo=0.3)


for bar in range(NBARS):
    t0 = bar * BAR
    D = DEN[bar]
    nxt = TARGET[bar + 1] if bar + 1 < NBARS else TARGET[bar]
    cyc, bar_in_cyc = divmod(bar, 4)
    act = CYC_ACT[cyc]
    tonic = 62 + KEY[act]
    if bar >= END_CAD:
        continue
    key_change = bar_in_cyc == 3 and KEY[CYC_ACT[cyc + 1]] != KEY[act]
    # ground (two notes per bar) + its harmony; on a key change the last note pivots to the new dominant
    for h in range(2):
        k = bar_in_cyc * 2 + h
        gnote = 50 + KEY[act] + GROUND[k]
        if key_change and h == 1:
            gnote = 50 + KEY[CYC_ACT[cyc + 1]] - 5
        place(t0 + h * 2 * BEAT, note_tri(gnote, 2 * BEAT * 0.97), 0.3 * D['gain'])
        if D['choir']:
            chord_pcs = G_CHORD[k] if not (key_change and h == 1) else [KEY[CYC_ACT[cyc + 1]] - KEY[act] + i for i in (7, 11, 14)]
            for i, p in enumerate(chord_pcs):
                n = int(BEAT * 2 * SR)
                sig = pulse(mtof(tonic - 12 + p), BEAT * 2, 0.5, vib=0.003) * env16(n, 0.12, 1.0, 0.8, 0.15)
                place(t0 + h * 2 * BEAT, sig, 0.016 * D['gain'], pan=-0.3 + 0.3 * i)
    if key_change:
        bridge_run(t0, KEY[act], KEY[CYC_ACT[cyc + 1]])
    # drums, with a short fill when the drum texture is about to change
    if D['drums'] != 'none':
        drums(t0, D['drums'], 0.5 * D['gain'] + 0.1)
    if nxt['drums'] != D['drums'] or key_change:
        for j in range(4):
            place(t0 + (3 + j * 0.25) * BEAT, snare(), 0.08 + 0.04 * j, pan=0.1)
    # canon voices: global position in the variation chain, sliced to this bar
    for v in range(3):
        k = cyc - ENTRY[v]
        if k < 0 or v >= D['voices']:
            continue
        lo, hi = bar_in_cyc * 4, bar_in_cyc * 4 + 4
        for b, d, p in chain(k):
            if lo <= b < hi:
                place(t0 + (b - lo) * BEAT, note_pulse(tonic + p, d * BEAT * 0.95, DUTY[v], 0.45, 0.6, vib=0.004),
                      0.13 * D['gain'] * (1.0, 0.75, 0.7)[v], pan=PAN[v], echo=0.25 if v == 0 else 0.15)

# final cadence G – A – D over the last two bars (in the closing key)
t0 = END_CAD * BAR
tonic = 62 + KEY[SHOTS[-1]['act']]
for i, (root, ch) in enumerate([(-7, [5, 9, 12]), (-5, [7, 11, 14])]):
    place(t0 + i * 2 * BEAT, note_tri(50 + KEY[SHOTS[-1]['act']] + root, 2 * BEAT * 0.97), 0.3)
    for j, p in enumerate(ch):
        place(t0 + i * 2 * BEAT, note_pulse(tonic + p, 2 * BEAT * 0.95, 0.5, 0.5, 0.6), 0.05, pan=-0.3 + 0.3 * j)
place(t0 + BAR, note_tri(50 + KEY[SHOTS[-1]['act']] - 12, BAR * 0.98), 0.32)
for j, p in enumerate([0, 4, 7, 12, 16]):
    place(t0 + BAR + j * 0.06, note_pulse(tonic + p, BAR * 0.95, 0.25 if j else 0.5, 0.6, 0.7, vib=0.004), 0.07, pan=-0.4 + 0.2 * j, echo=0.4)

# ------------------------------------------------------------------ transitions
# (sections are joined by the continuous canon, smoothed density and bridging variations; only a soft
#  cymbal marks a new chapter title)
for i, s in enumerate(SHOTS):
    if i and s['mood'] == 'title':
        place(s['start'] / 60, crash(1.6), 0.1)

# ------------------------------------------------------------------ cues → chip SFX

for s in SHOTS:
    base = s['start'] / 60
    k = KEY[s['act']]
    for c in s['cues']:
        t = base + c[0] / 60
        typ = c[1]
        p = int(c[2]) if len(c) > 2 and c[2] is not None else None
        if typ == 'blip':
            place(t, note_pulse((p or 76) + k, 0.09, 0.25, 0.05, 0.2), 0.08, pan=float(rng.uniform(-0.4, 0.4)))
        elif typ in ('tick', 'spark'):
            place(t, hat(), 0.1, pan=float(rng.uniform(-0.5, 0.5)))
        elif typ == 'type':
            for j in range(3):
                place(t + j * 0.045, note_pulse(84 + (j % 2) * 5, 0.025, 0.5, 0.01, 0.0), 0.04, pan=0.1)
        elif typ == 'error':
            place(t, note_pulse(45, 0.12, 0.5, 0.1, 0.6), 0.12)
            place(t + 0.13, note_pulse(41, 0.2, 0.5, 0.1, 0.6), 0.12)
        elif typ in ('chime', 'coin', 'powerup'):
            for j, m in enumerate([0, 7, 12, 14]):
                place(t + j * 0.07, note_pulse(62 + 12 + k + m, 0.2, 0.25, 0.1, 0.3), 0.07, pan=0.3, echo=0.35)
        elif typ == 'bell':
            m = (p or 84) + k
            place(t, note_pulse(m, 0.7, 0.125, 0.3, 0.0), 0.09, echo=0.45)
            place(t, note_pulse(m + 12, 0.45, 0.5, 0.15, 0.0), 0.035, echo=0.45)
        elif typ in ('whoosh', 'jump'):
            place(t - 0.1, noise_sweep(0.35, 24, 2), 0.08)
        elif typ == 'riser2':
            place(t, sweep(220, 1760, 1.2, 0.25), 0.045)
        elif typ == 'step':
            place(t, note_pulse(62 + 12 + k + 7, 0.07, 0.25, 0.05, 0.2), 0.07)
            place(t + 0.08, note_pulse(62 + 12 + k + 12, 0.1, 0.25, 0.05, 0.2), 0.07)
        elif typ in ('stamp', 'hit'):
            place(t, kick(), 0.45)
            place(t, noise(0.08, 4) * env16(int(0.08 * SR), 0.001, 0.03, 0.0, 0.01), 0.13)
        elif typ == 'reveal':
            place(t - 1.0, sweep(220, 880, 1.0, 0.125), 0.045)
            place(t, crash(1.4), 0.18)
            place(t, kick(), 0.55)
            notes = [62 + KEY[s['act']] + iv for iv in (0, 4, 7, 12)]
            for j, m in enumerate(notes):
                place(t + j * 0.07, note_pulse(m, 0.6, 0.5, 0.25, 0.4), 0.08, pan=-0.3 + 0.2 * j, echo=0.4)
        elif typ == 'gliss':
            place(t, sweep(1760, 440, 0.4, 0.5), 0.045)

print('events placed')

# ------------------------------------------------------------------ mix

d = int(0.375 * SR)
for j in range(1, 5):
    sh = d * j
    g = 0.45 ** j
    ch = (j - 1) % 2
    OUT[sh:, ch] += ECHO[: N - sh, ch] * g
    OUT[sh:, 1 - ch] += ECHO[: N - sh, 1 - ch] * g * 0.3
# gentle low-pass + DC block (chip output through a TV speaker)
lp = signal.butter(2, 9000 / (SR / 2), 'low', output='sos')
hp = signal.butter(1, 30 / (SR / 2), 'high', output='sos')
mix = signal.sosfilt(hp, signal.sosfilt(lp, OUT, axis=0), axis=0)
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
fi = int(0.05 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int((TOTAL - 3.0) * SR)
mix[fo:] *= (np.linspace(1, 0, N - fo) ** 1.5)[:, None]
mix *= 10 ** (-1.0 / 20) / (np.abs(mix).max() + 1e-9)
out = mix[: int(TOTAL * SR)].astype(F32)
sf.write(OUT_PATH, out, SR, subtype='PCM_16')
print('written', len(out) / SR, 's')
