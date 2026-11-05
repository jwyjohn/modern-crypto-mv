#!/bin/bash
# usage: scripts/sheet.sh name tok1 tok2 ...   (renders stills and tiles COLS per row, 2 by default, → out/name.jpg)
#   tok = global frame number, or  shotId:sceneFrame  (scene frames are mapped through the pacing warp)
name=$1; shift
frames=$(node scripts/at.mjs "$@")
[ -z "$NORENDER" ] && node scripts/stills.mjs $frames 2>&1 | grep -iv "^frame" | tail -3
set -- $frames
files=""; for fr in "$@"; do files="$files out/stills/f$(printf %05d $fr).jpg"; done
.venv/bin/python scripts/tile.py out/$name.jpg ${COLS:-2} $files
echo "frames: $frames"
