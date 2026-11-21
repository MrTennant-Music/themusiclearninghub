#!/usr/bin/env python3
"""Merge a fast all-marker audit with stronger focused rechecks."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


KEY_FIELDS = ("paperId", "questionId", "clipIndex", "markerIndex")


def row_key(row: dict) -> tuple:
    return tuple(row[field] for field in KEY_FIELDS)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--rechecks", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    baseline = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
    rechecks = {
        row_key(row): row
        for row in json.loads(Path(args.rechecks).read_text(encoding="utf-8"))
    }
    rows = []
    for row in baseline:
        recheck = rechecks.get(row_key(row))
        merged = dict(row)
        merged["baselineStatus"] = row["windowStatus"]
        merged["baselineWordDelta"] = row["wordDelta"]
        if recheck:
            merged["recheckStatus"] = recheck["windowStatus"]
            merged["recheckWordDelta"] = recheck["wordDelta"]
            merged["recheckContext"] = recheck["context"]
            merged["recheckTranscript"] = recheck["windowTranscript"]
            merged["finalStatus"] = recheck["windowStatus"]
        else:
            merged["recheckStatus"] = None
            merged["recheckWordDelta"] = None
            merged["recheckContext"] = ""
            merged["recheckTranscript"] = ""
            merged["finalStatus"] = row["windowStatus"]
        rows.append(merged)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "comparison.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    if rows:
        with (output_dir / "comparison.csv").open("w", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
    counts = {status: sum(row["finalStatus"] == status for row in rows) for status in ("pass", "near", "review")}
    summary = {"markersCompared": len(rows), "rechecks": len(rechecks), "counts": counts}
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
