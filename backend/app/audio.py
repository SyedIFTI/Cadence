"""Step 1: turn any audio file into 16 kHz mono FLAC using ffmpeg.

Whisper was trained on 16 kHz mono audio. FLAC is lossless but roughly half
the size of WAV, which keeps us under Groq's upload limit.
"""
import shutil
import subprocess
from pathlib import Path

import imageio_ffmpeg


class AudioError(Exception):
    """The file could not be read as audio."""


def ffmpeg_path() -> str:
    # Prefer the system ffmpeg, else the binary bundled with imageio-ffmpeg.
    return shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()


def convert_to_16k_mono(source: Path, target: Path, max_seconds: int) -> None:
    command = [
        ffmpeg_path(), "-y", "-nostdin", "-loglevel", "error",
        "-i", str(source),
        "-vn",                      # ignore any video track
        "-ac", "1",                 # mono
        "-ar", "16000",             # 16 kHz
        "-sample_fmt", "s16",
        "-t", str(max_seconds),     # stop after the maximum length
        str(target),
    ]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=120)
    except subprocess.TimeoutExpired:
        raise AudioError("Converting this file took too long.")
    if result.returncode != 0 or not target.exists():
        raise AudioError("This file could not be read as audio. Try MP3, WAV, M4A or WebM.")
