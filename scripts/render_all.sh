#!/bin/bash
# renders both versions: Game Development Department cast and classic cast
set -u
cd "$(dirname "$0")/.."
mkdir -p out
for job in "MVInference MI50_MV" "MVInferenceClassic MI50_MV_classic"; do
  set -- $job
  s=$(date +%s)
  npx remotion render "$1" "out/$2.mp4" --log=error > "out/render_$1.log" 2>&1
  echo "$1 exit $? in $(( $(date +%s) - s ))s"
done
ls -la out/*.mp4
