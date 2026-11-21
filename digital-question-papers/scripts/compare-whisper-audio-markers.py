#!/usr/bin/env python3
"""Compare stored exam markers with fresh Whisper segment and word starts."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


def safe_name(value: str) -> str:
    return "".join(character if character.isalnum() or character in "-_" else "_" for character in value)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--transcripts", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    transcript_root = Path(args.transcripts)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    rows = []

    for track in manifest["tracks"]:
        transcript_path = transcript_root / safe_name(track["paperId"]) / f'{safe_name(track["questionId"])}-{track["clipIndex"]}.json'
        if not transcript_path.exists():
            continue
        payload = json.loads(transcript_path.read_text(encoding="utf-8"))
        segments = payload["transcript"].get("segments", [])
        words = [word for segment in segments for word in segment.get("words", [])]
        for marker_index, marker in enumerate(track["markers"]):
            marker_time = float(marker["time"])
            nearest_segment = min(segments, key=lambda segment: abs(float(segment["start"]) - marker_time), default=None)
            segment_delta = None if nearest_segment is None else float(nearest_segment["start"]) - marker_time
            first_word = next((word for word in words if float(word["start"]) >= marker_time), None)
            word_delta = None if first_word is None else float(first_word["start"]) - marker_time
            context_words = [word["word"].strip() for word in words if marker_time - 0.5 <= float(word["start"]) <= marker_time + 5]
            if segment_delta is not None and -0.10 <= segment_delta <= 0.65:
                status = "pass"
            elif segment_delta is not None and -0.35 <= segment_delta <= 1.25:
                status = "near"
            else:
                status = "review"
            rows.append({
                "paperId": track["paperId"],
                "questionId": track["questionId"],
                "clipIndex": track["clipIndex"],
                "markerIndex": marker_index,
                "label": marker["label"],
                "storedTime": marker_time,
                "segmentStart": None if nearest_segment is None else round(float(nearest_segment["start"]), 3),
                "segmentDelta": None if segment_delta is None else round(segment_delta, 3),
                "wordStart": None if first_word is None else round(float(first_word["start"]), 3),
                "wordDelta": None if word_delta is None else round(word_delta, 3),
                "context": " ".join(context_words),
                "status": status,
                "source": track["source"],
            })

    (output_dir / "comparison.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    with (output_dir / "comparison.csv").open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=rows[0].keys() if rows else [])
        writer.writeheader()
        writer.writerows(rows)
    counts = {status: sum(row["status"] == status for row in rows) for status in ("pass", "near", "review")}
    summary = {
        "tracksCompared": len({(row["paperId"], row["questionId"], row["clipIndex"]) for row in rows}),
        "markersCompared": len(rows),
        "counts": counts,
        "papersComplete": len({row["paperId"] for row in rows}),
    }
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
