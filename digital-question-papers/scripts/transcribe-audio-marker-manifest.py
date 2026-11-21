#!/usr/bin/env python3
"""Transcribe one shard of the Digital Question Papers marker manifest."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
import whisper


def decode_audio(source: Path, destination: Path, ffmpeg: str) -> None:
    subprocess.run(
        [ffmpeg, "-nostdin", "-loglevel", "error", "-i", str(source), "-ac", "1", "-ar", "16000", str(destination)],
        check=True,
        capture_output=True,
    )


def read_wav(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as audio:
        samples = np.frombuffer(audio.readframes(audio.getnframes()), dtype="<i2")
    return samples.astype(np.float32) / 32768.0


def safe_name(value: str) -> str:
    return "".join(character if character.isalnum() or character in "-_" else "_" for character in value)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--model", default="small.en")
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--ffmpeg", required=True)
    parser.add_argument("--shard-index", type=int, required=True)
    parser.add_argument("--shard-count", type=int, required=True)
    args = parser.parse_args()

    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    tracks = [track for index, track in enumerate(manifest["tracks"]) if index % args.shard_count == args.shard_index]
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    model = whisper.load_model(args.model, download_root=args.model_dir)

    completed = 0
    for track in tracks:
        destination = output_dir / safe_name(track["paperId"]) / f'{safe_name(track["questionId"])}-{track["clipIndex"]}.json'
        if destination.exists():
            completed += 1
            print(f"SKIP {completed}/{len(tracks)} {destination}", flush=True)
            continue
        source = Path(track["source"])
        if not source.exists():
            raise FileNotFoundError(source)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="exam-whisper-audit-") as temporary_dir:
            decoded = Path(temporary_dir) / "audio.wav"
            decode_audio(source, decoded, args.ffmpeg)
            result = model.transcribe(
                read_wav(decoded),
                language="en",
                word_timestamps=True,
                fp16=False,
                condition_on_previous_text=False,
            )
        payload = {"track": track, "transcript": result}
        temporary_destination = destination.with_suffix(".json.tmp")
        temporary_destination.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        shutil.move(temporary_destination, destination)
        completed += 1
        print(f"DONE {completed}/{len(tracks)} {destination}", flush=True)


if __name__ == "__main__":
    main()
