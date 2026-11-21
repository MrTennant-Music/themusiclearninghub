#!/usr/bin/env python3
"""Find semantically matching spoken cues in long-context Whisper windows."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def safe_name(value: str) -> str:
    return "".join(character if character.isalnum() or character in "-_" else "_" for character in value)


def normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def candidate_indices(label: str, tokens: list[str]) -> list[int]:
    replay = next((key for key in ("1st", "2nd", "3rd", "4th") if key in label), None)
    if replay:
        ordinal = {"1st": "first", "2nd": "second", "3rd": "third", "4th": "fourth"}[replay]
        indices = []
        for index, token in enumerate(tokens):
            if token not in {"here", "heres", "he"} or ordinal not in tokens[index:index + 12]:
                continue
            if "E1" in label and not ({"1", "one"} & set(tokens[index:index + 6])):
                continue
            if "E2" in label and not ({"2", "two"} & set(tokens[index:index + 6])):
                continue
            indices.append(index)
        return indices

    if label in {"1", "2"}:
        number_tokens = {"1": {"1", "one"}, "2": {"2", "two"}}[label]
        return [
            index for index, token in enumerate(tokens)
            if token in {"here", "heres", "he"} and number_tokens & set(tokens[index:index + 6])
        ]

    part = re.match(r"\(([a-g])\)", label)
    if part:
        synonyms = {part.group(1)}
        if part.group(1) == "c":
            synonyms.add("see")
        if part.group(1) == "f":
            synonyms.add("if")
        instruction_tokens = {
            "listen", "tick", "take", "identify", "this", "question", "using",
            "write", "draw", "insert", "complete", "analyse", "analyze",
        }
        return [
            index for index, token in enumerate(tokens)
            if token in synonyms and instruction_tokens & set(tokens[index:index + 10])
        ]

    if label == "Guide":
        return [
            index for index, token in enumerate(tokens)
            if token == "listen" or (token in {"here", "heres"} and "music" in tokens[index:index + 8])
        ]
    if label == "Column C":
        return [
            index for index, token in enumerate(tokens)
            if token == "you" and "now" in tokens[index:index + 3]
        ]
    return []


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--comparison", required=True)
    parser.add_argument("--windows", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--threshold", type=float, default=0.65)
    args = parser.parse_args()

    rows = json.loads(Path(args.comparison).read_text(encoding="utf-8"))
    window_root = Path(args.windows)
    proposals = []
    unresolved = []
    for row in rows:
        if row["finalStatus"] == "pass":
            continue
        transcript_path = (
            window_root / safe_name(row["paperId"])
            / f'{safe_name(row["questionId"])}-{row["clipIndex"]}-m{row["markerIndex"]}.json'
        )
        payload = json.loads(transcript_path.read_text(encoding="utf-8"))
        words = [
            word for segment in payload["transcript"].get("segments", [])
            for word in segment.get("words", [])
        ]
        tokens = [normalise(word["word"]) for word in words]
        indices = candidate_indices(row["label"], tokens)
        if not indices:
            unresolved.append({**row, "longTranscript": payload["transcript"].get("text", "").strip()})
            continue
        index = min(indices, key=lambda candidate: abs(float(words[candidate]["absolute_start"]) - float(row["storedTime"])))
        cue_start = float(words[index]["absolute_start"])
        delta = cue_start - float(row["storedTime"])
        if abs(delta) <= args.threshold:
            continue
        proposals.append({
            **row,
            "originalStoredTime": row["storedTime"],
            "storedTime": round(cue_start, 3),
            "longCueStart": round(cue_start, 3),
            "longCueDelta": round(delta, 3),
            "longCueContext": " ".join(word["word"].strip() for word in words[index:index + 12]),
        })

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(proposals, ensure_ascii=False, indent=2), encoding="utf-8")
    output.with_name(f"{output.stem}-unresolved.json").write_text(
        json.dumps(unresolved, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({"proposals": len(proposals), "unresolved": len(unresolved)}, indent=2))


if __name__ == "__main__":
    main()
