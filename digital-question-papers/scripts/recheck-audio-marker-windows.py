#!/usr/bin/env python3
"""Re-transcribe short windows around markers flagged by the broad Whisper pass."""

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


def safe_name(value: str) -> str:
    return "".join(character if character.isalnum() or character in "-_" else "_" for character in value)


def read_wav(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as audio:
        samples = np.frombuffer(audio.readframes(audio.getnframes()), dtype="<i2")
    return samples.astype(np.float32) / 32768.0


def main() -> None:
    parser = argparse.ArgumentParser()
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--comparison")
    source_group.add_argument("--manifest")
    parser.add_argument("--model", default="small.en")
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--ffmpeg", required=True)
    parser.add_argument("--lead-in", type=float, default=3.0)
    parser.add_argument("--duration", type=float, default=12.0)
    parser.add_argument("--include-near", action="store_true")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--shard-index", type=int, required=True)
    parser.add_argument("--shard-count", type=int, required=True)
    args = parser.parse_args()

    if args.manifest:
        manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
        rows = []
        for track in manifest["tracks"]:
            for marker_index, marker in enumerate(track["markers"]):
                rows.append({
                    "paperId": track["paperId"],
                    "questionId": track["questionId"],
                    "clipIndex": track["clipIndex"],
                    "markerIndex": marker_index,
                    "label": marker["label"],
                    "storedTime": marker["time"],
                    "source": track["source"],
                    "status": "all",
                })
    else:
        comparison = json.loads(Path(args.comparison).read_text(encoding="utf-8"))
        statuses = {"review", "near"} if args.include_near else {"review"}
        rows = list(comparison) if args.all else [
            row for row in comparison
            if row.get("finalStatus", row.get("windowStatus", row.get("status"))) in statuses
        ]
    rows = [row for index, row in enumerate(rows) if index % args.shard_count == args.shard_index]
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    model = whisper.load_model(args.model, download_root=args.model_dir)

    for completed, row in enumerate(rows, start=1):
        marker_name = f'{safe_name(row["questionId"])}-{row["clipIndex"]}-m{row["markerIndex"]}.json'
        destination = output_dir / safe_name(row["paperId"]) / marker_name
        if destination.exists():
            print(f"SKIP {completed}/{len(rows)} {destination}", flush=True)
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        marker_time = float(row["storedTime"])
        window_start = max(0.0, marker_time - args.lead_in)
        with tempfile.TemporaryDirectory(prefix="exam-whisper-recheck-") as temporary_dir:
            decoded = Path(temporary_dir) / "window.wav"
            subprocess.run(
                [
                    args.ffmpeg, "-nostdin", "-loglevel", "error",
                    "-ss", f"{window_start:.3f}", "-i", row["source"],
                    "-t", f"{args.duration:.3f}", "-ac", "1", "-ar", "16000", str(decoded),
                ],
                check=True,
                capture_output=True,
            )
            result = model.transcribe(
                read_wav(decoded),
                language="en",
                word_timestamps=True,
                fp16=False,
                condition_on_previous_text=False,
            )
        for segment in result.get("segments", []):
            segment["absolute_start"] = round(window_start + float(segment["start"]), 3)
            segment["absolute_end"] = round(window_start + float(segment["end"]), 3)
            for word in segment.get("words", []):
                word["absolute_start"] = round(window_start + float(word["start"]), 3)
                word["absolute_end"] = round(window_start + float(word["end"]), 3)
        payload = {"comparison": row, "windowStart": window_start, "transcript": result}
        temporary_destination = destination.with_suffix(".json.tmp")
        temporary_destination.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        shutil.move(temporary_destination, destination)
        print(f"DONE {completed}/{len(rows)} {destination}", flush=True)


if __name__ == "__main__":
    main()
