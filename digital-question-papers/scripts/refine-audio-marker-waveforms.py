#!/usr/bin/env python3
"""Refine proposed spoken-cue starts against local waveform silence boundaries."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path


KEY_FIELDS = ("paperId", "questionId", "clipIndex", "markerIndex")


def row_key(row: dict) -> tuple:
    return tuple(row[field] for field in KEY_FIELDS)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--proposals", required=True)
    parser.add_argument("--refined", required=True)
    parser.add_argument("--ffmpeg", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--lead-in", type=float, default=0.15)
    args = parser.parse_args()

    proposals = json.loads(Path(args.proposals).read_text(encoding="utf-8"))
    refined = {
        row_key(row): row
        for row in json.loads(Path(args.refined).read_text(encoding="utf-8"))
    }
    output_rows = []
    for proposal in proposals:
        refined_row = refined.get(row_key(proposal))
        transcript_cue = float(refined_row["storedTime"] if refined_row else proposal["storedTime"])
        window_start = max(0.0, transcript_cue - 4.0)
        process = subprocess.run(
            [
                args.ffmpeg, "-hide_banner", "-nostdin", "-ss", f"{window_start:.3f}",
                "-i", proposal["source"], "-t", "6", "-af",
                "silencedetect=noise=-45dB:d=0.08", "-f", "null", "-",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        silence_ends = [
            window_start + float(match)
            for match in re.findall(r"silence_end: ([0-9.]+)", process.stderr)
        ]
        nearby_ends = [boundary for boundary in silence_ends if abs(boundary - transcript_cue) <= 1.5]
        waveform_cue = min(nearby_ends, key=lambda boundary: abs(boundary - transcript_cue)) if nearby_ends else None
        # Whisper can slightly anticipate a soft initial consonant, while an RMS
        # silence boundary can land slightly inside it. Use the earlier of the
        # two confirmed onsets, then retain the established small lead-in.
        accepted_cue = min(transcript_cue, waveform_cue) if waveform_cue is not None else transcript_cue
        output_rows.append({
            **proposal,
            "transcriptCueStart": round(transcript_cue, 3),
            "waveformCueStart": None if waveform_cue is None else round(waveform_cue, 3),
            "finalMarkerTime": round(max(0.0, accepted_cue - args.lead_in), 2),
            "refinement": "waveform" if waveform_cue is not None else "transcript",
        })

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(output_rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "corrections": len(output_rows),
        "waveformRefined": sum(row["refinement"] == "waveform" for row in output_rows),
        "transcriptFallback": sum(row["refinement"] == "transcript" for row in output_rows),
    }, indent=2))


if __name__ == "__main__":
    main()
