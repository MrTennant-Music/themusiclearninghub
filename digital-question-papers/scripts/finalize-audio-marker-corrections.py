#!/usr/bin/env python3
"""Filter refined marker proposals and combine explicitly reviewed overrides."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


KEY_FIELDS = ("paperId", "questionId", "clipIndex", "markerIndex")


def row_key(row: dict) -> tuple:
    return tuple(row.get(field, 0) for field in KEY_FIELDS)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refined", required=True)
    parser.add_argument("--manual", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--threshold", type=float, default=0.8)
    args = parser.parse_args()

    refined = json.loads(Path(args.refined).read_text(encoding="utf-8"))
    manual = json.loads(Path(args.manual).read_text(encoding="utf-8"))
    corrections = [
        row for row in refined
        if abs(float(row["transcriptCueStart"]) - float(row["originalStoredTime"])) > args.threshold
    ]
    by_key = {row_key(row): row for row in corrections}
    for row in manual:
        by_key[row_key(row)] = row
    corrections = sorted(by_key.values(), key=lambda row: row_key(row))
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(corrections, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "corrections": len(corrections),
        "papers": len({row["paperId"] for row in corrections}),
        "manualOverrides": len(manual),
    }, indent=2))


if __name__ == "__main__":
    main()
