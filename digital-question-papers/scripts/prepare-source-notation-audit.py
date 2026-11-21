"""Render official notation at 300 dpi and calibrate vector staff systems.

This prepares independent source evidence. It does not certify note/rhythm
transcriptions, infer pitches from implemented answers, or modify paper data.
"""
from pathlib import Path
import json
import os
import subprocess
import pdfplumber
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / os.environ.get('AUDIT_OUTPUT', 'maintenance/reference/past-paper-source-audit')
PDFTOPPM = os.environ.get("PDFTOPPM", "/Users/bobbytennant/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/bin/pdftoppm")
papers = json.loads((ROOT / "digital-question-papers/audit/2026-11-05/data-checks.json").read_text())["papers"]
manifest = {"dpi": 300, "scope": "Independent source preparation; reading every note and rhythm remains a separate verification step", "papers": []}

def staves(page):
    edges = [e for e in page.edges if e.get("width", abs(e["x1"] - e["x0"])) > 80 and abs(e["top"] - e["bottom"]) < .4]
    rows = {}
    for e in edges:
        y = round((e["top"] + e["bottom"]) / 2, 1)
        rows.setdefault(y, []).append((e["x0"], e["x1"]))
    ys = sorted(rows)
    found = []
    used = set()
    for y in ys:
        if y in used:
            continue
        for second in [v for v in ys if 2 < v-y < 12]:
            gap = second-y
            lines = [y]
            for n in range(1, 5):
                nearest = min(ys, key=lambda v: abs(v-(y+n*gap)))
                if abs(nearest-(y+n*gap)) > .4:
                    break
                lines.append(nearest)
            if len(lines) != 5:
                continue
            left = max(min(x[0] for x in rows[line]) for line in lines)
            right = min(max(x[1] for x in rows[line]) for line in lines)
            if right-left < 80:
                continue
            found.append({"lineCentresPt": lines, "gapPt": round(gap, 3), "leftPt": left, "rightPt": right})
            used.update(lines)
            break
    # Filled staff rules can expose both rectangle edges. Merge corresponding
    # five-line patterns before calling them independently calibrated staves.
    merged = []
    for system in found:
        previous = next((item for item in merged if all(abs(a-b) < 1 for a,b in zip(item['lineCentresPt'], system['lineCentresPt']))), None)
        if previous:
            previous['lineCentresPt'] = [round((a+b)/2, 3) for a,b in zip(previous['lineCentresPt'], system['lineCentresPt'])]
            previous['gapPt'] = round((previous['lineCentresPt'][-1]-previous['lineCentresPt'][0])/4, 3)
        else:
            merged.append(system)
    return merged

for paper in papers:
    folder = OUT / paper["id"]
    folder.mkdir(parents=True, exist_ok=True)
    record = {"id": paper["id"], "source": paper["sourcePath"], "pages": []}
    source = (ROOT / "digital-question-papers" / paper["sourcePath"]).resolve()
    with pdfplumber.open(source) as pdf:
        for index, page in enumerate(pdf.pages):
            systems = staves(page)
            text = page.extract_text() or ""
            music_font = any(any(word in c["fontname"].lower() for word in ["opus", "music", "maestro", "bravura", "sonata"]) for c in page.chars)
            rhythm_graphic = "rhythm" in text.lower() and len(page.curves) > 10
            raster_score_candidate = any(image["width"] > 50 and image["height"] > 30 for image in page.images)
            if not (systems or music_font or rhythm_graphic or raster_score_candidate):
                continue
            number = index+1
            prefix = folder / f"source-page-{number:02d}"
            if not prefix.with_suffix(".png").exists():
                run = subprocess.run([PDFTOPPM, "-f", str(number), "-singlefile", "-r", "300", "-png", str(source), str(prefix)], capture_output=True, text=True)
                if run.returncode:
                    raise RuntimeError(run.stderr)
            image = Image.open(prefix.with_suffix(".png"))
            scale = 300/72
            for i, system in enumerate(systems):
                crop = (max(0, system["leftPt"]-15), max(0, system["lineCentresPt"][0]-45), min(page.width, system["rightPt"]+15), min(page.height, system["lineCentresPt"][-1]+45))
                file = folder / f"page-{number:02d}-system-{i+1:02d}-300dpi.png"
                image.crop(tuple(round(v*scale) for v in crop)).save(file)
                system["crop"] = str(file.relative_to(ROOT))
            record["pages"].append({"page": number, "render": str(prefix.with_suffix('.png').relative_to(ROOT)), "systems": systems, "musicFont": music_font, "rhythmGraphic": rhythm_graphic, "rasterCandidate": raster_score_candidate})
    manifest["papers"].append(record)
    (OUT / "source-notation-manifest.json").write_text(json.dumps(manifest, indent=2)+"\n")
    print(paper["id"], len(record["pages"]), "notation pages;", sum(len(p["systems"]) for p in record["pages"]), "calibrated staves", flush=True)
