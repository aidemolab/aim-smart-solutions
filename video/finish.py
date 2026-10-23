#!/usr/bin/env python3
"""Finish a demo screen recording: voiceover, burned-in captions and an end card.

Does what the pharma finishing step did, for any recording:

1. Splits the voiceover MP3 into spoken lines by detecting the silences between them.
2. Places each line at its requested start time. Lines never overlap (a line that
   would overlap starts after the previous one) and are never cut (if the voice
   runs past the end of the recording, the last frame is held).
3. Burns in one caption per line, shown while that line is spoken.
4. Adds an end card (navy, AIM logo, aimsmartsolutions.tech) with a 0.5s fade.
5. Normalises the voice to -16 LUFS. With --music, adds that track under the
   voice at -24 LUFS (looped or trimmed to length, faded out at the end).

Lines file: one line per voiceover sentence, in the order they are spoken:

    0.3    New market, no sales history? / Every decision feels like a guess.
    5.7    This app ranks every supplier by risk.
    card   Book a free AI opportunity call at aimsmartsolutions.tech.

The first column is the start time in seconds (or m:ss). " / " forces a caption
line break; long lines also wrap automatically. "card" plays the line over the end
card with no caption (the card is lengthened to fit). Blank lines and lines
starting with # are ignored. The voiceover must contain exactly one spoken chunk
per line; if silence detection finds more chunks, the closest pairs are merged.

Usage:
    python video/finish.py demo-16x9.mp4 voice.mp3 lines.txt -o final-16x9.mp4
    python video/finish.py demo-1x1.mp4 voice.mp3 lines.txt -o final-1x1.mp4 --music bed.mp3
    python video/finish.py ... --dry-run     # print the line placement only

Requires ffmpeg and ffprobe on PATH. Output: H.264 CRF 18, 30fps, AAC 192k.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
from dataclasses import dataclass
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEFAULT_LOGO = REPO / "public" / "aim-logo.webp"
DEFAULT_FONT = Path("C:/Windows/Fonts/arialbd.ttf")
NAVY = "0x0B1F33"
SITE = "aimsmartsolutions.tech"
FADE = 0.5  # end card cross-fade


@dataclass
class Line:
    text: str
    start: float | None  # None = over the end card
    seg: tuple[float, float] = (0.0, 0.0)  # position in the voiceover file
    at: float = 0.0  # placed start in the output

    @property
    def length(self) -> float:
        return self.seg[1] - self.seg[0]


def run(cmd: list[str], cwd: Path | None = None) -> str:
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        sys.exit(f"Command failed: {' '.join(cmd[:6])} ...\n{p.stderr[-3000:]}")
    return p.stderr + p.stdout


def probe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    data = json.loads(out)
    info = {"duration": float(data["format"]["duration"])}
    for s in data.get("streams", []):
        if s.get("codec_type") == "video":
            info["width"], info["height"] = s["width"], s["height"]
    return info


def parse_time(s: str) -> float:
    if ":" in s:
        m, sec = s.split(":", 1)
        return int(m) * 60 + float(sec)
    return float(s)


def read_lines(path: Path) -> list[Line]:
    lines = []
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        raw = raw.strip()
        if not raw or raw.startswith("#"):
            continue
        parts = raw.split(None, 1)
        if len(parts) < 2:
            sys.exit(f"Lines file: expected '<start> <text>', got: {raw!r}")
        start = None if parts[0].lower() == "card" else parse_time(parts[0])
        lines.append(Line(text=parts[1].strip(), start=start))
    if not lines:
        sys.exit("Lines file is empty")
    card = [l.start is None for l in lines]
    if True in card and not all(card[card.index(True):]):
        sys.exit("Lines file: 'card' lines must come last")
    return lines


def speech_chunks(voice: Path, noise_db: float, min_silence: float) -> list[tuple[float, float]]:
    """Spoken chunks of the voiceover, split on silences."""
    duration = probe(voice)["duration"]
    log = run(["ffmpeg", "-hide_banner", "-i", str(voice), "-af", f"silencedetect=noise={noise_db}dB:d={min_silence}", "-f", "null", "-"])
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    chunks, pos = [], 0.0
    for i, s in enumerate(starts):
        if s > pos + 0.05:
            chunks.append((max(0.0, pos), s))
        pos = ends[i] if i < len(ends) else duration
    if pos < duration - 0.05:
        chunks.append((pos, duration))
    # Keep a little air around each chunk so no syllable is clipped.
    pad = 0.05
    return [(max(0.0, a - pad), min(duration, b + pad)) for a, b in chunks]


def match_chunks(chunks: list[tuple[float, float]], n: int) -> list[tuple[float, float]]:
    """Merge the chunks separated by the shortest pauses until there is one per line."""
    if len(chunks) < n:
        sys.exit(
            f"Found {len(chunks)} spoken chunks in the voiceover but the lines file has {n} lines. "
            "Leave a clear pause between lines, or try a lower --silence (e.g. 0.2) or a higher --noise (e.g. -30)."
        )
    chunks = list(chunks)
    while len(chunks) > n:
        gaps = [chunks[i + 1][0] - chunks[i][1] for i in range(len(chunks) - 1)]
        i = gaps.index(min(gaps))
        chunks[i : i + 2] = [(chunks[i][0], chunks[i + 1][1])]
    return chunks


def place(lines: list[Line], video_len: float, gap: float) -> tuple[float, float]:
    """Set each line's output start. Returns (main length, end card length)."""
    t = 0.0
    for l in lines:
        if l.start is None:
            continue
        l.at = max(l.start, t)
        t = l.at + l.length + gap
    main_len = max(video_len, t)  # never cut a line: hold the last frame if needed
    card_at = main_len
    for l in lines:
        if l.start is None:
            l.at = card_at
            card_at += l.length + gap
    return main_len, card_at - main_len


def wrap(text: str, width: int) -> str:
    out = []
    for part in text.split(" / "):
        out.extend(textwrap.wrap(part.strip(), width) or [""])
    return "\n".join(out)


def loudnorm(src: Path, dst: Path, target: float) -> None:
    """Two-pass EBU R128 loudness normalisation to `target` LUFS."""
    flt = f"loudnorm=I={target}:TP=-1.5:LRA=11"
    log = run(["ffmpeg", "-hide_banner", "-i", str(src), "-af", flt + ":print_format=json", "-f", "null", "-"])
    m = json.loads(log[log.rindex("{") : log.rindex("}") + 1])
    flt += (
        f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
        f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
    )
    run(["ffmpeg", "-hide_banner", "-y", "-i", str(src), "-af", flt + ",aresample=48000", "-ar", "48000", "-ac", "2", str(dst)])


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("video", type=Path)
    ap.add_argument("voice", type=Path, help="voiceover MP3, lines in order with pauses between them")
    ap.add_argument("lines", type=Path, help="lines file: '<start seconds> <caption text>' per line")
    ap.add_argument("-o", "--out", type=Path, help="output MP4 (default: <video>-final.mp4)")
    ap.add_argument("--music", type=Path, help="optional music bed, mixed at -24 LUFS under the voice")
    ap.add_argument("--logo", type=Path, default=DEFAULT_LOGO)
    ap.add_argument("--font", type=Path, default=DEFAULT_FONT, help="caption and end card font (default Arial Bold)")
    ap.add_argument("--card", type=float, default=3.0, help="minimum end card length in seconds (default 3)")
    ap.add_argument("--gap", type=float, default=0.25, help="minimum pause between placed lines (default 0.25s)")
    ap.add_argument("--noise", type=float, default=-35, help="silence threshold in dB (default -35)")
    ap.add_argument("--silence", type=float, default=0.3, help="minimum pause length that splits lines (default 0.3s)")
    ap.add_argument("--dry-run", action="store_true", help="print the line placement and stop")
    args = ap.parse_args()

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            sys.exit(f"{tool} not found on PATH")
    for p in [args.video, args.voice, args.lines, args.logo, args.font] + ([args.music] if args.music else []):
        if not p.is_file():
            sys.exit(f"File not found: {p}")
    out = (args.out or args.video.with_name(args.video.stem + "-final.mp4")).resolve()

    vid = probe(args.video)
    W, H, V = vid["width"], vid["height"], vid["duration"]
    lines = read_lines(args.lines)
    for l, seg in zip(lines, match_chunks(speech_chunks(args.voice, args.noise, args.silence), len(lines))):
        l.seg = seg
    main_len, card_voice = place(lines, V, args.gap)
    card_len = max(args.card, card_voice + FADE)
    total = main_len + card_len

    print(f"Video {W}x{H}, {V:.2f}s -> output {total:.2f}s (end card {card_len:.2f}s from {main_len:.2f}s)")
    for i, l in enumerate(lines, 1):
        moved = "" if l.start is None or abs(l.at - l.start) < 0.01 else f"  (asked {l.start:.2f}, moved to avoid overlap)"
        where = "card" if l.start is None else f"{l.at:6.2f}"
        print(f"  {i:2}. {where} -> {l.at + l.length:6.2f}  [{l.length:4.2f}s]  {l.text}{moved}")
    if main_len > V + 0.01:
        print(f"  Note: the voice runs past the recording, so its last frame is held for {main_len - V:.2f}s.")
    if args.dry_run:
        return

    # Sizes follow the pharma cut: 50px captions at 1920x1080, 46px at 1080x1080.
    wide = W / H > 1.3
    k = H / 1080
    fs, ls, bw, mb = (round(v * k) for v in ((50, 12, 25, 70) if wide else (46, 11, 23, 60)))
    chars = 52 if wide else 36
    logo_w, box_w, box_h, site_fs = (round(v * k) for v in ((640, 720, 496, 64) if wide else (560, 640, 444, 56)))

    with tempfile.TemporaryDirectory(prefix="finish-") as tmp_s:
        tmp = Path(tmp_s)
        # ffmpeg filter paths are relative to tmp, which avoids escaping Windows drive colons.
        shutil.copy(args.font, tmp / "font.ttf")

        # Voice track: each chunk at its placed time, then two-pass loudness to -16 LUFS.
        parts, labels = [], []
        for i, l in enumerate(lines):
            a, b = l.seg
            parts.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,adelay={round(l.at * 1000)}:all=1[a{i}]")
            labels.append(f"[a{i}]")
        parts.append(f"{''.join(labels)}amix=inputs={len(lines)}:normalize=0,apad,atrim=0:{total:.3f}[a]")
        run(["ffmpeg", "-hide_banner", "-y", "-i", str(args.voice.resolve()), "-filter_complex", ";".join(parts),
             "-map", "[a]", "-ar", "48000", "-ac", "2", "voice_raw.wav"], cwd=tmp)
        loudnorm(tmp / "voice_raw.wav", tmp / "voice.wav", -16)
        audio = tmp / "voice.wav"

        if args.music:
            run(["ffmpeg", "-hide_banner", "-y", "-stream_loop", "-1", "-i", str(args.music.resolve()),
                 "-af", f"atrim=0:{total:.3f},asetpts=PTS-STARTPTS", "-ar", "48000", "-ac", "2", "music_raw.wav"], cwd=tmp)
            loudnorm(tmp / "music_raw.wav", tmp / "music_norm.wav", -24)
            fade_at = max(0.0, total - 2.0)
            run(["ffmpeg", "-hide_banner", "-y", "-i", "voice.wav", "-i", "music_norm.wav", "-filter_complex",
                 f"[1:a]afade=t=in:d=0.5,afade=t=out:st={fade_at:.3f}:d=2[m];[0:a][m]amix=inputs=2:normalize=0,"
                 "alimiter=limit=0.89[a]", "-map", "[a]", "-ar", "48000", "mix.wav"], cwd=tmp)
            audio = tmp / "mix.wav"

        # Video: captions, held last frame, end card cross-fade.
        caps = []
        for i, l in enumerate(lines):
            if l.start is None:
                continue
            (tmp / f"cap{i}.txt").write_text(wrap(l.text, chars), encoding="utf-8")
            caps.append(
                f"drawtext=fontfile=font.ttf:textfile=cap{i}.txt:fontsize={fs}:fontcolor=white:text_align=C:"
                f"line_spacing={ls}:box=1:boxcolor=black@0.62:boxborderw={bw}:x=(w-text_w)/2:y=h-text_h-{mb}:"
                f"enable='between(t,{l.at:.2f},{l.at + l.length + 0.1:.2f})'"
            )
        hold = main_len - V + FADE
        graph = [
            f"[0:v]fps=30,settb=AVTB,{','.join(caps + [f'tpad=stop_mode=clone:stop_duration={hold:.3f}'])},format=yuv420p[main]",
            f"color=c={NAVY}:s={W}x{H}:r=30:d={card_len:.3f},drawbox=x=(iw-{box_w})/2:y=ih/2-{box_h}:w={box_w}:h={box_h}:color=white:t=fill[bg]",
            f"[1:v]scale={logo_w}:-1:flags=lanczos,format=rgba[logo]",
            f"[bg][logo]overlay=(W-w)/2:H/2-h-40,drawtext=fontfile=font.ttf:text={SITE}:fontsize={site_fs}:fontcolor=white:"
            f"x=(w-text_w)/2:y=h/2+{site_fs},format=yuv420p,settb=AVTB[card]",
            f"[main][card]xfade=transition=fade:duration={FADE}:offset={main_len:.3f}[v]",
        ]
        run(["ffmpeg", "-hide_banner", "-y", "-i", str(args.video.resolve()), "-loop", "1", "-i", str(args.logo.resolve()),
             "-i", str(audio), "-filter_complex", ";".join(graph), "-map", "[v]", "-map", "2:a",
             "-t", f"{total:.3f}", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "30",
             "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)], cwd=tmp)

    print(f"Saved {out}")


if __name__ == "__main__":
    main()
