#!/usr/bin/env python3
"""Render an apply_patch document for reviewed audio-marker corrections."""

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
    parser.add_argument("--papers-dir", required=True)
    args = parser.parse_args()

    corrections = json.loads(Path(args.corrections).read_text(encoding="utf-8"))
    papers_dir = Path(args.papers_dir).resolve()
    changes: dict[Path, dict[int, list[dict]]] = defaultdict(lambda: defaultdict(list))

    for correction in corrections:
        path = papers_dir / f'{correction["paperId"]}.js'
        lines = path.read_text(encoding="utf-8").splitlines()
        label_forms = (f'"{correction["label"]}"', f"'{correction['label']}'")
        found_line = None
        for line_index, line in enumerate(lines):
            if not any(label_form in line for label_form in label_forms):
                continue
            for candidate_index in range(line_index, min(line_index + 4, len(lines))):
                matches = re.findall(r'["\']?time["\']?\s*:\s*([0-9.]+)', lines[candidate_index])
                if any(same_number(match, correction["originalStoredTime"]) for match in matches):
                    found_line = candidate_index
                    break
            if found_line is not None:
                break
        if found_line is None:
            raise RuntimeError(
                f'Could not locate {correction["paperId"]} {correction["questionId"]} '
                f'{correction["label"]} at {correction["originalStoredTime"]}'
            )
        changes[path][found_line].append(correction)

    print("*** Begin Patch")
    for path, line_changes in changes.items():
        lines = path.read_text(encoding="utf-8").splitlines()
        print(f"*** Update File: {path}")
        for line_index, corrections_for_line in sorted(line_changes.items()):
            old_line = lines[line_index]
            new_line = old_line
            for correction in corrections_for_line:
                pattern = re.compile(r'(["\']?time["\']?\s*:\s*)([0-9.]+)')
                replaced = False

                def replace_time(match: re.Match) -> str:
                    nonlocal replaced
                    if not replaced and same_number(match.group(2), correction["originalStoredTime"]):
                        replaced = True
                        return f'{match.group(1)}{correction["finalMarkerTime"]}'
                    return match.group(0)

                new_line = pattern.sub(replace_time, new_line)
                if not replaced:
                    raise RuntimeError(f'Could not replace time on line: {old_line}')
            print("@@")
            print(f"-{old_line}")
            print(f"+{new_line}")
    print("*** End Patch")


if __name__ == "__main__":
    main()
