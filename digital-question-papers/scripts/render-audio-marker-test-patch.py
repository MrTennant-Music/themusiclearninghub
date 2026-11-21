#!/usr/bin/env python3
"""Render regression-test updates for reviewed audio marker corrections."""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path


def same_number(candidate: str, expected: float) -> bool:
    return abs(float(candidate) - float(expected)) < 0.000001


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--corrections", required=True)
    parser.add_argument("--tests-dir", required=True)
    parser.add_argument("--suffix", default=".test.js")
    parser.add_argument("--allow-missing", action="store_true")
    args = parser.parse_args()

    corrections = json.loads(Path(args.corrections).read_text(encoding="utf-8"))
    tests_dir = Path(args.tests_dir).resolve()
    by_file: dict[Path, list[dict]] = defaultdict(list)
    for correction in corrections:
        path = tests_dir / f'{correction["paperId"]}{args.suffix}'
        if path.exists():
            by_file[path].append(correction)

    print("*** Begin Patch")
    for path, file_corrections in by_file.items():
        lines = path.read_text(encoding="utf-8").splitlines()
        original_lines = list(lines)
        for correction in file_corrections:
            old = float(correction["originalStoredTime"])
            changed = False
            number_pattern = re.compile(r'(?<![A-Za-z0-9_.])([0-9]+(?:\.[0-9]+)?)(?![A-Za-z0-9_.])')
            for line_index, line in enumerate(lines):
                def replace_number(match: re.Match) -> str:
                    nonlocal changed
                    if same_number(match.group(1), old):
                        changed = True
                        return str(correction["finalMarkerTime"])
                    return match.group(0)
                lines[line_index] = number_pattern.sub(replace_number, line)
            if not changed:
                if args.allow_missing:
                    continue
                raise RuntimeError(
                    f'Could not locate {correction["originalStoredTime"]} in {path.name}'
                )
        changed_lines = [index for index, (old, new) in enumerate(zip(original_lines, lines)) if old != new]
        if not changed_lines:
            continue
        print(f"*** Update File: {path}")
        for line_index in changed_lines:
            print("@@")
            print(f"-{original_lines[line_index]}")
            print(f"+{lines[line_index]}")
    print("*** End Patch")


if __name__ == "__main__":
    main()
