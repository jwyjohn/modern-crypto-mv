"""Lists characters used in src/**/*.ts(x) that none of the pixel fonts can draw.
usage: .venv/bin/python scripts/check_glyphs.py [files...]"""
import glob, sys
from fontTools.ttLib import TTFont
cov = set()
for fn in ['public/fonts/FusionPixel.woff2', 'public/fonts/FusionPixelMono.woff2', 'public/fonts/CryptoPixel.ttf', 'public/fonts/PressStart2P.ttf']:
    cov |= set(TTFont(fn).getBestCmap().keys())
files = sys.argv[1:] or glob.glob('src/**/*.ts*', recursive=True)
bad = {}
for fn in files:
    for ln, line in enumerate(open(fn, encoding='utf-8'), 1):
        if line.strip().startswith('//') or line.strip().startswith('*') or line.strip().startswith('/*'):
            continue
        for ch in line:
            if ord(ch) > 127 and ord(ch) not in cov:
                bad.setdefault(ch, []).append(f'{fn}:{ln}')
for ch, locs in sorted(bad.items()):
    print(f'{ch!r} U+{ord(ch):04X}  x{len(locs)}  e.g. {locs[0]}')
print('OK' if not bad else f'{len(bad)} unsupported characters')
