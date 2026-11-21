"""Add missing shared glyph outlines from the project's actual Bravura font.

Existing calibrated paths are retained byte-for-byte. Requires fontTools.
"""
from pathlib import Path
import json
import re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

root = Path(__file__).resolve().parents[2]
font = TTFont(root / "fonts/Bravura.otf")
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
target = root / "bravura-worksheet-outlines.js"
source = target.read_text()
assert font["head"].unitsPerEm == 1000
existing = set(re.findall(r"^    (\w+):", source, re.M))
added = []
for key, raw in re.findall(r'^\s*(\w+):\s*"([^"\n]+)"', (root / "bravura-symbols.js").read_text(), re.M):
    value = json.loads('"' + raw + '"')
    if key in existing or len(value) != 1 or ord(value) not in cmap:
        continue
    name = cmap[ord(value)]
    pen = SVGPathPen(glyphs)
    glyphs[name].draw(pen)
    advance = font["hmtx"][name][0]
    added.append(f"    {key}: {{ advance: {advance}, path: {json.dumps(pen.getCommands())} }},")
if added:
    marker = "  },\n};"
    assert source.count(marker) == 1
    target.write_text(source.replace(marker, "\n".join(added) + "\n" + marker))
print(f"Added {len(added)} missing Bravura outlines; retained all existing paths.")
