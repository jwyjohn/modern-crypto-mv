#!/bin/bash
# renders all four versions: Blue Archive cast (short, full) and classic cast (short, full)
set -u
cd "$(dirname "$0")/.."
for job in "MVCryptoShort Crypto_MV_short" "MVCrypto Crypto_MV_full" "MVCryptoShortClassic Crypto_MV_short_classic" "MVCryptoClassic Crypto_MV_full_classic"; do
  set -- $job
  s=$(date +%s)
  npx remotion render "$1" "out/$2.mp4" --log=error > "out/render_$1.log" 2>&1
  echo "$1 exit $? in $(( $(date +%s) - s ))s"
done
ls -la out/*.mp4
