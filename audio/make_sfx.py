"""8-bit (NES-style) sound effects for the film: no score, only the cues of the scenes.

Voices as on a 2A03: pulse waves (duty 12.5 / 25 / 50 %) and an LFSR-style noise channel, with envelopes
quantised to 16 volume steps. Driven by audio/timeline.json (export with `node scripts/export_timeline.mjs`):
each scene cue and each transition becomes one chip effect at its real time."""
import json
import sys

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
BEAT = 0.5
BAR = 2.0
# usage: make_sfx.py [timeline.json] [out.wav]
TL_PATH = sys.argv[1] if len(sys.argv) > 1 else 'audio/timeline.json'
OUT_PATH = sys.argv[2] if len(sys.argv) > 2 else 'public/sfx.wav'
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


# ------------------------------------------------------------------ transitions
# a soft cymbal marks a new chapter title
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
            place(t, kick(), 0.2)
            place(t, noise(0.08, 4) * env16(int(0.08 * SR), 0.001, 0.03, 0.0, 0.01), 0.07)
        elif typ == 'reveal':
            place(t - 1.0, sweep(220, 880, 1.0, 0.125), 0.03)
            place(t, crash(0.7), 0.05)
            place(t, kick(), 0.18)
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
mix *= 10 ** (-6.0 / 20) / (np.abs(mix).max() + 1e-9)  # effects alone: leave them well below full scale
out = mix[: int(TOTAL * SR)].astype(F32)
sf.write(OUT_PATH, out, SR, subtype='PCM_16')
print('written', len(out) / SR, 's')
