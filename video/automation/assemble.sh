#!/usr/bin/env bash
# Join the Business Process Automation video parts into one silent clip per format:
#   intro (scenes 0-12s) + S3 recording (24.4s from its take start) + outro (scenes 35.6-42.1s),
# with 0.4s cross-fades at 11.6s and 35.6s, so output time equals scenes.html time.
#
#   bash video/automation/assemble.sh <rawDir>
#
# <rawDir> holds intro-<fmt>.mp4 and outro-<fmt>.mp4 (capture.cjs) and automation-<fmt>.webm
# (record.cjs). The take start is where the black cover lifts (found with blackdetect).
# Writes <rawDir>/joined-<fmt>.mp4, ready for video/finish.py.
set -euo pipefail
RAW="$1"
for f in 16x9 1x1; do
  start=$(ffmpeg -hide_banner -i "$RAW/automation-$f.webm" -vf "blackdetect=d=0.05:pix_th=0.05" -an -f null - 2>&1 \
    | grep -o "black_end:[0-9.]*" | head -1 | cut -d: -f2)
  echo "$f: take starts at ${start}s"
  ffmpeg -hide_banner -loglevel error -y \
    -i "$RAW/intro-$f.mp4" -ss "$start" -t 24.4 -i "$RAW/automation-$f.webm" -i "$RAW/outro-$f.mp4" \
    -filter_complex "[0:v]fps=30,settb=AVTB,format=yuv420p[a];[1:v]fps=30,settb=AVTB,format=yuv420p[b];[2:v]fps=30,settb=AVTB,format=yuv420p[c];\
[a][b]xfade=transition=fade:duration=0.4:offset=11.6[ab];[ab][c]xfade=transition=fade:duration=0.4:offset=35.6[v]" \
    -map "[v]" -an -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p -r 30 "$RAW/joined-$f.mp4"
  echo "Saved $RAW/joined-$f.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$RAW/joined-$f.mp4")s)"
done
