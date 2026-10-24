#!/usr/bin/env python3
"""Finish a demo screen recording: voiceover, captions, intro card, zooms and an end card.

1. Splits the voiceover MP3 into spoken lines (see --split and --segments).
2. Places each line at its requested start. Lines never overlap (a line that would
   overlap starts --gap seconds after the previous one ends) and are never cut (if
   the voice runs past the end of the recording, its last frame is held).
3. Burns in one caption per line while it is spoken, except on the intro and end cards,
   which already carry their text.
4. Optional intro card (--intro): navy, AIM logo, headline and subline, fading into the
   recording over 0.5s. Its length is max(7s, first intro line + 0.6s).
5. Optional eased zooms (--zoom) onto parts of the recording, e.g. a new table row.
6. End card (navy, AIM logo, aimsmartsolutions.tech) with a 0.5s fade, at least 3s.
   --card-head adds a headline above the address; --card-site changes the address.
   --no-caption 2,3 leaves those lines (1-based) uncaptioned, e.g. a title scene.
7. Normalises the voice to -16 LUFS. With --music, adds that track at -24 LUFS.

Lines file: one line per voiceover sentence, in the order they are spoken:

    intro    Worried about supplier risk? AIM Smart Solutions builds ...
    0.3      Here's a real example: every supplier scored on risk.
    11.5     Add a new supplier, and its risk score appears instantly.
    after+1  Watch your at-risk spend update in real time.
    card     Your suppliers. Your data. Your dashboard. Try the demo at aimsmartsolutions.tech.

Start column:
    <seconds> or m:ss  time in the recording (the output adds the intro length, if any)
    after+<s>          <s> seconds after the previous line ends
    intro              over the intro card, from 0.4s (needs --intro)
    card               over the end card (the card is lengthened to fit)
" / " forces a caption line break; long lines also wrap. Blank lines and # comments
are ignored. "intro" lines come first and "card" lines last.

Usage:
    python video/finish.py demo-16x9.mp4 voice.mp3 lines.txt -o final-16x9.mp4
    python video/finish.py demo.mp4 voice.mp3 lines.txt --split longest \\
        --intro "Smart dashboards for supply chain risk" \\
        --zoom 22.4,26.4,180,420,1200,675 -o final.mp4
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
DEFAULT_SUB_FONT = Path("C:/Windows/Fonts/arial.ttf")
NAVY = "0x0B1F33"
SUBLINE_COLOUR = "0xCBD5E1"
SITE = "aimsmartsolutions.tech"
DEFAULT_SUBLINE = "Any industry. Your data. Clear decisions."
FADE = 0.5  # intro and end card cross-fades
INTRO_MIN, INTRO_VOICE_AT, INTRO_TAIL = 7.0, 0.4, 0.6
EASE = 0.6  # zoom ease in/out time


@dataclass
class Line:
    text: str
    kind: str  # "intro", "time", "after" or "card"
    value: float = 0.0  # recording time for "time", delay for "after"
    seg: tuple[float, float] = (0.0, 0.0)  # position in the voiceover file
    asked: float = 0.0  # requested output start
    at: float = 0.0  # placed output start
    nocap: bool = False  # set by --no-caption

    @property
    def length(self) -> float:
        return self.seg[1] - self.seg[0]

    @property
    def captioned(self) -> bool:
        return self.kind not in ("intro", "card") and not self.nocap


@dataclass
class Zoom:
    start: float
    end: float
    x: float
    y: float
    w: float
    h: float


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
        key, text = parts[0].lower(), parts[1].strip()
        if key in ("intro", "card"):
            lines.append(Line(text, key))
        elif key.startswith("after+"):
            lines.append(Line(text, "after", float(key[6:])))
        else:
            lines.append(Line(text, "time", parse_time(key)))
    if not lines:
        sys.exit("Lines file is empty")
    kinds = [l.kind for l in lines]
    n_intro = kinds.count("intro")
    if kinds[:n_intro] != ["intro"] * n_intro:
        sys.exit("Lines file: 'intro' lines must come first")
    if "card" in kinds and not all(k == "card" for k in kinds[kinds.index("card"):]):
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


def match_chunks(chunks: list[tuple[float, float]], n: int, mode: str) -> list[tuple[float, float]]:
    """One chunk per line.

    merge:   merge the chunks separated by the shortest pauses until there are n.
    longest: split only at the n-1 longest pauses (for voiceovers with long pauses
             between lines and short ones inside them).
    """
    if len(chunks) < n:
        sys.exit(
            f"Found {len(chunks)} spoken chunks in the voiceover but the lines file has {n} lines. "
            "Leave a clear pause between lines, or try a lower --silence (e.g. 0.2) or a higher --noise (e.g. -30)."
        )
    gaps = [chunks[i + 1][0] - chunks[i][1] for i in range(len(chunks) - 1)]
    if mode == "longest":
        cuts = sorted(sorted(range(len(gaps)), key=lambda i: gaps[i], reverse=True)[: n - 1])
        if n > 1 and len(gaps) >= n:
            kept = min(gaps[i] for i in cuts)
            dropped = max(gaps[i] for i in range(len(gaps)) if i not in cuts)
            if kept - dropped < 0.15:
                print(f"  Warning: ambiguous split (shortest line pause {kept:.2f}s vs longest pause inside a line {dropped:.2f}s)")
        out, first = [], 0
        for c in cuts + [len(chunks) - 1]:
            out.append((chunks[first][0], chunks[c][1]))
            first = c + 1
        return out
    chunks = list(chunks)
    while len(chunks) > n:
        gaps = [chunks[i + 1][0] - chunks[i][1] for i in range(len(chunks) - 1)]
        i = gaps.index(min(gaps))
        chunks[i : i + 2] = [(chunks[i][0], chunks[i + 1][1])]
    return chunks


def parse_segments(spec: str) -> list[tuple[float, float]]:
    """'0-8.5,9.0-13.4' -> [(0, 8.5), (9.0, 13.4)]"""
    out = []
    for part in spec.split(","):
        a, b = part.split("-")
        out.append((float(a), float(b)))
    return out


def place(lines: list[Line], video_len: float, gap: float) -> tuple[float, float, float]:
    """Set each line's output start. Returns (intro length, main end, end card voice length)."""
    intro_lines = [l for l in lines if l.kind == "intro"]
    intro = 0.0
    t = 0.0
    if intro_lines:
        t = INTRO_VOICE_AT
        for l in intro_lines:
            l.asked = l.at = t
            t = l.at + l.length + gap
        intro = max(INTRO_MIN, intro_lines[-1].at + intro_lines[-1].length - INTRO_VOICE_AT + INTRO_TAIL)
    prev_end = t - gap if intro_lines else 0.0
    for l in lines:
        if l.kind == "time":
            l.asked = intro + l.value
        elif l.kind == "after":
            l.asked = prev_end + l.value
        else:
            continue
        l.at = max(l.asked, t)
        prev_end = l.at + l.length
        t = prev_end + gap
    main_end = max(intro + video_len, t - gap)  # never cut a line: hold the last frame if needed
    card_at = main_end
    for l in lines:
        if l.kind == "card":
            l.asked = l.at = card_at
            card_at += l.length + gap
    return intro, main_end, max(0.0, card_at - main_end - gap)


def wrap(text: str, width: int) -> str:
    out = []
    for part in text.split(" / "):
        out.extend(textwrap.wrap(part.strip(), width) or [""])
    return "\n".join(out)


def write_lf(path: Path, text: str) -> None:
    # LF only: drawtext renders a CR as an extra blank line.
    path.write_text(text, encoding="utf-8", newline="\n")


def zoom_filter(zooms: list[Zoom], W: int, H: int) -> str:
    """zoompan expressions for eased zooms (times in recording seconds, rect in source pixels)."""
    def ease(z: Zoom) -> str:
        p = f"clip(min((it-{z.start:.3f})/{EASE},({z.end:.3f}-it)/{EASE}),0,1)"
        return f"({p}*{p}*(3-2*{p}))"

    zs, cxs, cys = ["1"], [f"{W / 2}"], [f"{H / 2}"]
    for z in zooms:
        factor = min(W / z.w, H / z.h)
        e = ease(z)
        zs.append(f"{factor - 1:.4f}*{e}")
        cxs.append(f"{z.x + z.w / 2 - W / 2:.1f}*{e}")
        cys.append(f"{z.y + z.h / 2 - H / 2:.1f}*{e}")
    zexpr, cx, cy = "+".join(zs), "+".join(cxs), "+".join(cys)
    x = f"clip(({cx})-iw/zoom/2,0,iw-iw/zoom)"
    y = f"clip(({cy})-ih/zoom/2,0,ih-ih/zoom)"
    return f"zoompan=z='{zexpr}':x='{x}':y='{y}':d=1:s={W}x{H}:fps=30"


def parse_zoom(spec: str) -> Zoom:
    v = [float(x) for x in spec.split(",")]
    if len(v) != 6:
        sys.exit(f"--zoom expects start,end,x,y,w,h, got {spec!r}")
    return Zoom(*v)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("video", type=Path)
    ap.add_argument("voice", type=Path, help="voiceover MP3, lines in order with pauses between them")
    ap.add_argument("lines", type=Path, help="lines file: '<start> <caption text>' per line")
    ap.add_argument("-o", "--out", type=Path, help="output MP4 (default: <video>-final.mp4)")
    ap.add_argument("--music", type=Path, help="optional music bed, mixed at -24 LUFS under the voice")
    ap.add_argument("--intro", metavar="HEADLINE", help="add an intro card with this headline")
    ap.add_argument("--intro-sub", default=DEFAULT_SUBLINE, help=f"intro subline (default {DEFAULT_SUBLINE!r})")
    ap.add_argument("--zoom", action="append", type=parse_zoom, default=[], metavar="S,E,X,Y,W,H",
                    help="eased zoom from S to E seconds (recording time) onto the source rectangle X,Y,W,H; repeatable")
    ap.add_argument("--split", choices=["merge", "longest"], default="merge",
                    help="merge: merge the shortest pauses (default); longest: split at the N-1 longest pauses")
    ap.add_argument("--segments", help="explicit line positions in the voiceover, e.g. '0-8.5,9.0-13.4,...'")
    ap.add_argument("--logo", type=Path, default=DEFAULT_LOGO)
    ap.add_argument("--font", type=Path, default=DEFAULT_FONT, help="caption and card font (default Arial Bold)")
    ap.add_argument("--sub-font", type=Path, default=DEFAULT_SUB_FONT, help="intro subline font (default Arial)")
    ap.add_argument("--card-head", help="optional end card headline above the address (e.g. 'Try it yourself')")
    ap.add_argument("--card-site", default=SITE, help=f"end card address (default {SITE})")
    ap.add_argument("--no-caption", default="", metavar="N,N", help="1-based line numbers to leave uncaptioned")
    ap.add_argument("--card", type=float, default=3.0, help="minimum end card length in seconds (default 3)")
    ap.add_argument("--gap", type=float, default=0.25, help="minimum pause between placed lines (default 0.25s)")
    ap.add_argument("--noise", type=float, default=-35, help="silence threshold in dB (default -35)")
    ap.add_argument("--silence", type=float, default=0.3, help="minimum pause length that splits lines (default 0.3s)")
    ap.add_argument("--dry-run", action="store_true", help="print the line placement and stop")
    args = ap.parse_args()

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            sys.exit(f"{tool} not found on PATH")
    files = [args.video, args.voice, args.lines, args.logo, args.font] + ([args.sub_font] if args.intro else [])
    for p in files + ([args.music] if args.music else []):
        if not p.is_file():
            sys.exit(f"File not found: {p}")
    out = (args.out or args.video.with_name(args.video.stem + "-final.mp4")).resolve()

    vid = probe(args.video)
    W, H, V = vid["width"], vid["height"], vid["duration"]
    lines = read_lines(args.lines)
    if any(l.kind == "intro" for l in lines) and not args.intro:
        sys.exit("Lines file has 'intro' lines but no --intro headline was given")
    if args.segments:
        segs = parse_segments(args.segments)
        if len(segs) != len(lines):
            sys.exit(f"--segments has {len(segs)} entries but the lines file has {len(lines)} lines")
    else:
        segs = match_chunks(speech_chunks(args.voice, args.noise, args.silence), len(lines), args.split)
    for l, seg in zip(lines, segs):
        l.seg = seg
    for n in filter(None, args.no_caption.split(",")):
        lines[int(n) - 1].nocap = True
    intro, main_end, card_voice = place(lines, V, args.gap)
    card_len = max(args.card, card_voice + FADE)
    total = main_end + card_len
    rec_end = intro + V

    print(f"Video {W}x{H}, {V:.2f}s -> output {total:.2f}s (intro {intro:.2f}s, end card {card_len:.2f}s from {main_end:.2f}s)")
    for i, l in enumerate(lines, 1):
        moved = "" if abs(l.at - l.asked) < 0.01 else f"  (asked {l.asked:.2f}, moved to avoid overlap)"
        print(f"  {i:2}. {l.kind:5} {l.at:6.2f} -> {l.at + l.length:6.2f}  [{l.length:4.2f}s]  {l.text}{moved}")
    if main_end > rec_end + 0.01:
        print(f"  Note: the voice runs past the recording, so its last frame is held for {main_end - rec_end:.2f}s.")
    for z in args.zoom:
        print(f"  zoom {z.start:.2f}-{z.end:.2f}s (output {intro + z.start:.2f}-{intro + z.end:.2f}) x{min(W / z.w, H / z.h):.2f} "
              f"onto {z.x:.0f},{z.y:.0f} {z.w:.0f}x{z.h:.0f}")
    if args.dry_run:
        return

    # Sizes follow the pharma cut: 50px captions at 1920x1080, 46px at 1080x1080.
    wide = W / H > 1.3
    k = H / 1080
    fs, ls, bw, mb = (round(v * k) for v in ((50, 12, 25, 70) if wide else (46, 11, 23, 60)))
    chars = 52 if wide else 36
    logo_w, box_w, box_h, site_fs = (round(v * k) for v in ((640, 720, 496, 64) if wide else (560, 640, 444, 56)))
    head_fs, sub_fs = (round(v * k) for v in ((76, 44) if wide else (58, 38)))

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

        # Captions on the output timeline, drawn last so zooms and fades do not move them.
        caps = []
        for i, l in enumerate(lines):
            if not l.captioned:
                continue
            write_lf(tmp / f"cap{i}.txt", wrap(l.text, chars))
            caps.append(
                f"drawtext=fontfile=font.ttf:textfile=cap{i}.txt:fontsize={fs}:fontcolor=white:text_align=C:"
                f"line_spacing={ls}:box=1:boxcolor=black@0.62:boxborderw={bw}:x=(w-text_w)/2:y=h-text_h-{mb}:"
                f"enable='between(t,{l.at:.2f},{l.at + l.length + 0.1:.2f})'"
            )

        # End card text: the address (shrunk to fit the width), with an optional headline above it.
        write_lf(tmp / "site.txt", args.card_site)
        fit_fs = min(site_fs, int(W * 0.9 / (len(args.card_site) * 0.56)))
        if args.card_head:
            write_lf(tmp / "card_head.txt", args.card_head)
            ch_y = round(50 * k)
            card_text = (f"drawtext=fontfile=font.ttf:textfile=card_head.txt:fontsize={head_fs}:fontcolor=white:x=(w-text_w)/2:y=h/2+{ch_y},"
                         f"drawtext=fontfile=font.ttf:textfile=site.txt:fontsize={fit_fs}:fontcolor=white:"
                         f"x=(w-text_w)/2:y=h/2+{ch_y + head_fs + round(30 * k)}")
        else:
            card_text = f"drawtext=fontfile=font.ttf:textfile=site.txt:fontsize={fit_fs}:fontcolor=white:x=(w-text_w)/2:y=h/2+{site_fs}"
        box = f"drawbox=x=(iw-{box_w})/2:y=ih/2-{box_h}:w={box_w}:h={box_h}:color=white:t=fill"
        hold = main_end - rec_end + FADE
        rec = "[0:v]fps=30,settb=AVTB," + (zoom_filter(args.zoom, W, H) + ",settb=AVTB," if args.zoom else "")
        graph = [
            f"[1:v]scale={logo_w}:-1:flags=lanczos,format=rgba,split[logo_i][logo_c]",
            f"{rec}tpad=stop_mode=clone:stop_duration={hold:.3f},format=yuv420p[rec]",
            f"color=c={NAVY}:s={W}x{H}:r=30:d={card_len:.3f},{box}[cb]",
            f"[cb][logo_c]overlay=(W-w)/2:H/2-h-40,{card_text},format=yuv420p,settb=AVTB[card]",
        ]
        if args.intro:
            shutil.copy(args.sub_font, tmp / "font_sub.ttf")
            write_lf(tmp / "head.txt", args.intro)
            write_lf(tmp / "sub.txt", args.intro_sub)
            head_y = round(60 * k)
            graph += [
                f"color=c={NAVY}:s={W}x{H}:r=30:d={intro + FADE:.3f},{box}[ib]",
                f"[ib][logo_i]overlay=(W-w)/2:H/2-h-40,"
                f"drawtext=fontfile=font.ttf:textfile=head.txt:fontsize={head_fs}:fontcolor=white:x=(w-text_w)/2:y=h/2+{head_y},"
                f"drawtext=fontfile=font_sub.ttf:textfile=sub.txt:fontsize={sub_fs}:fontcolor={SUBLINE_COLOUR}:"
                f"x=(w-text_w)/2:y=h/2+{head_y + head_fs + round(34 * k)},format=yuv420p,settb=AVTB[intro]",
                f"[intro][rec]xfade=transition=fade:duration={FADE}:offset={intro:.3f}[main]",
            ]
        else:
            graph += ["[logo_i]nullsink", "[rec]null[main]"]
        graph.append(f"[main][card]xfade=transition=fade:duration={FADE}:offset={main_end:.3f}"
                     + ("," + ",".join(caps) if caps else "") + "[v]")
        run(["ffmpeg", "-hide_banner", "-y", "-i", str(args.video.resolve()), "-loop", "1", "-i", str(args.logo.resolve()),
             "-i", str(audio), "-filter_complex", ";".join(graph), "-map", "[v]", "-map", "2:a",
             "-t", f"{total:.3f}", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "30",
             "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)], cwd=tmp)

    print(f"Saved {out}")


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


if __name__ == "__main__":
    main()
