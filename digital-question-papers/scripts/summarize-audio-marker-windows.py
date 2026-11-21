#!/usr/bin/env python3
"""Summarise focused Whisper windows against their stored marker times."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--windows", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    rows = []
    for transcript_path in sorted(Path(args.windows).glob("**/*.json")):
        payload = json.loads(transcript_path.read_text(encoding="utf-8"))
        marker = payload["comparison"]
        marker_time = float(marker["storedTime"])
        segments = payload["transcript"].get("segments", [])
        words = [word for segment in segments for word in segment.get("words", [])]
        nearest_word = min(words, key=lambda word: abs(float(word["absolute_start"]) - marker_time), default=None)
        nearest_segment = min(
            segments,
            key=lambda segment: abs(float(segment["absolute_start"]) - marker_time),
            default=None,
        )
        word_delta = None if nearest_word is None else float(nearest_word["absolute_start"]) - marker_time
        segment_delta = None if nearest_segment is None else float(nearest_segment["absolute_start"]) - marker_time
        if word_delta is not None and -0.2 <= word_delta <= 0.8:
            status = "pass"
        elif word_delta is not None and -0.5 <= word_delta <= 1.5:
            status = "near"
        else:
            status = "review"
        context = " ".join(
            word["word"].strip()
            for word in words
            if marker_time - 0.75 <= float(word["absolute_start"]) <= marker_time + 5.0
        )
        rows.append({
            **marker,
            "windowTranscript": payload["transcript"].get("text", "").strip(),
            "nearestWord": None if nearest_word is None else nearest_word["word"].strip(),
            "wordStart": None if nearest_word is None else round(float(nearest_word["absolute_start"]), 3),
            "wordDelta": None if word_delta is None else round(word_delta, 3),
            "segmentStart": None if nearest_segment is None else round(float(nearest_segment["absolute_start"]), 3),
            "segmentDelta": None if segment_delta is None else round(segment_delta, 3),
            "context": context,
            "windowStatus": status,
        })

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "comparison.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    if rows:
        with (output_dir / "comparison.csv").open("w", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
    counts = {status: sum(row["windowStatus"] == status for row in rows) for status in ("pass", "near", "review")}
    summary = {"markersCompared": len(rows), "counts": counts}
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
