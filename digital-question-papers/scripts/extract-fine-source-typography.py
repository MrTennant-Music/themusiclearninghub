"""Extract source text/font evidence independently of application emphasis maps.

This is a comparison inventory, not a visual-review certificate. Staff engraving,
short isolated labels, source-adaptation wording and ambiguous repeats remain
separate. Each fragment retains its actual PDF character styles and page box.
"""
import hashlib
import json
import os
import re
import subprocess
import unicodedata
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / os.environ.get("AUDIT_RESULTS_FILE", "digital-question-papers/audit/2026-11-05/fine-source-typography.json")
NODE = os.environ.get("AUDIT_NODE", str(Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"))
model = json.loads(subprocess.check_output([NODE, "-e", "const path=require('node:path'),r=require('./digital-question-papers/paper-registry');process.stdout.write(JSON.stringify(Object.values(r).map(e=>{const p=require(path.resolve('digital-question-papers',e.dataFile.split('?')[0]));return{id:p.id,source:path.resolve('digital-question-papers',p.sourcePath),questions:p.questions.map(q=>q.id)};})));"], cwd=ROOT, text=True))
result = {"scope": "Independent source PDF character-font inventory. Comparison triage only; no automated source-layout certification.", "papers": []}

for paper in model:
    record = {"id": paper["id"], "source": str(Path(paper["source"]).relative_to(ROOT)), "sha256": hashlib.sha256(Path(paper["source"]).read_bytes()).hexdigest(), "fragments": [], "allFragments": []}
    question = None
    with pdfplumber.open(paper["source"]) as pdf:
        record["sourcePages"] = len(pdf.pages)
        body_right = 528
        for number, page in enumerate(pdf.pages, 1):
            mark_headers = [w for w in page.extract_words() if w["text"] == "MARKS" and w["top"] < 140 and w["x0"] > 400]
            if mark_headers:
                body_right = min(w["x0"] for w in mark_headers) - 3
            # The official-use margin, right mark column and print-only footer
            # are outside the usable question body. Do not infer their styling.
            chars = [c for c in page.chars if "trebuchet" in c["fontname"].lower() and 38 < c["x0"] < body_right and 45 < c["top"] < page.height - 45]
            lines = []
            for char in sorted(chars, key=lambda c: (round(c["top"]), c["x0"])):
                line = next((line for line in lines[-4:] if abs(line["top"] - char["top"]) < 2), None)
                if line is None:
                    line = {"top": char["top"], "chars": []}
                    lines.append(line)
                line["chars"].append(char)
            for line in sorted(lines, key=lambda line: line["top"]):
                ordered = sorted(line["chars"], key=lambda c: c["x0"])
                text = "".join(c["text"] for c in ordered)
                # Only a printed heading starts a question. Spoken replay cues
                # and copyright references also contain “Question N”.
                heading = re.fullmatch(r"\s*Question\s+(\d+)(?:\s*\([a-z0-9]+\))*\s*", text, re.I)
                if heading and not all("bold" in c["fontname"].lower() for c in ordered if c["text"].isalnum()):
                    heading = None
                if heading:
                    candidate = "q" + heading[1]
                    if candidate in paper["questions"]:
                        question = candidate
                if question is None:
                    continue
                # Separate distant table columns and printed part labels; do not
                # pretend that PDF reading order establishes a DOM sentence.
                groups = [[]]
                for char in ordered:
                    if groups[-1] and char["x0"] - groups[-1][-1]["x1"] > 24:
                        groups.append([])
                    groups[-1].append(char)
                for group in groups:
                    text = "".join(c["text"] for c in group).strip()
                    normal, bold, italic = "", "", ""
                    for char in group:
                        for letter in unicodedata.normalize("NFKC", char["text"]).lower():
                            if not letter.isascii() or not letter.isalnum():
                                continue
                            normal += letter
                            bold += "1" if re.search(r"bold", char["fontname"], re.I) else "0"
                            italic += "1" if re.search(r"italic|oblique", char["fontname"], re.I) else "0"
                    if not normal:
                        continue
                    fragment = {"question": question, "page": number, "text": text, "normal": normal, "bold": bold, "italic": italic, "box": [round(min(c["x0"] for c in group), 2), round(min(c["top"] for c in group), 2), round(max(c["x1"] for c in group), 2), round(max(c["bottom"] for c in group), 2)], "fonts": sorted({c["fontname"] for c in group})}
                    record["allFragments"].append(fragment)
                    if len(normal) >= 12:
                        record["fragments"].append(fragment)
    result["papers"].append(record)
    print(record["id"], len(record["fragments"]), "source fragments", flush=True)

OUT.write_text(json.dumps(result, indent=2) + "\n")
