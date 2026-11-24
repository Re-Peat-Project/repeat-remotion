"""Make the voiceover of the Final video from src/voiceover.json.

For every cue: text -> speech with a Microsoft Edge neural voice (edge-tts),
loudness-normalised with ffmpeg, saved as public/voice/<id>.mp3. Durations go
to public/voice/voice.json, which the video reads. Lines whose text, voice and
rate did not change are not regenerated. Fails if a line runs past its `until`.

    py -3 -m pip install edge-tts==7.3.1
    npm run voice            (or: py -3 scripts/voiceover.py [--force])
"""
import asyncio
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "voiceover.json"
OUT = ROOT / "public" / "voice"


def find_tool(name):
    if shutil.which(name):
        return name
    base = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages"
    for pkg in base.glob("Gyan.FFmpeg*"):
        for exe in pkg.glob(f"ffmpeg*/bin/{name}.exe"):
            return str(exe)
    sys.exit(f"{name} not found")


FFMPEG, FFPROBE = find_tool("ffmpeg"), find_tool("ffprobe")


def duration(path):
    r = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True, check=True)
    return round(float(r.stdout.strip()), 3)


async def tts(text, voice, rate, dest, tries=6):
    # the free service rate-limits quick bursts (HTTP 429): pause and retry
    for i in range(tries):
        try:
            await edge_tts.Communicate(text, voice, rate=rate).save(str(dest))
            return
        except Exception as e:  # noqa: BLE001 - any network or service error
            if i == tries - 1:
                raise
            wait = 5 * 2 ** i
            print(f"    voice service refused ({str(e)[:60]}); retrying in {wait} s")
            await asyncio.sleep(wait)


async def speak(text, voice, rate, dest):
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / "raw.mp3"
        await tts(text, voice, rate, raw)
        # trim leading/trailing silence, then normalise to -16 LUFS
        subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-af",
                        "silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
                        "silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
                        "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-b:a", "192k", str(dest)], check=True)


async def main(force):
    cfg = json.loads(SRC.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    index_path = OUT / "voice.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else {}
    voice, rate = cfg["voice"], cfg.get("rate", "+0%")
    new, problems = {}, []
    for cue in cfg["cues"]:
        rate_c = cue.get("rate", rate)
        key = hashlib.sha1(f"{voice}|{rate_c}|{cue['text']}".encode()).hexdigest()[:12]
        dest = OUT / f"{cue['id']}.mp3"
        old = index.get(cue["id"])
        if force or not old or old.get("hash") != key or not dest.exists():
            await speak(cue["text"], voice, rate_c, dest)
            print(f"  spoke {cue['id']}")
            await asyncio.sleep(2)  # be gentle with the service
        dur = duration(dest)
        new[cue["id"]] = {"file": f"voice/{cue['id']}.mp3", "dur": dur, "hash": key}
        room = cue["until"] - cue["at"]
        flag = "" if dur <= room else f"  <-- {dur - room:.1f} s too long"
        print(f"  {cue['id']}  {dur:5.1f} s of {room:5.1f} s{flag}")
        if flag:
            problems.append(cue["id"])
    index_path.write_text(json.dumps(new, indent=1), encoding="utf-8")
    for stale in set(index) - set(new):
        (OUT / f"{stale}.mp3").unlink(missing_ok=True)
    if problems:
        sys.exit("Too long: " + ", ".join(problems) + ". Shorten the text, or set a faster \"rate\" on the cue.")


asyncio.run(main("--force" in sys.argv))
