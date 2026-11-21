"""Validate and publish the reviewed Concept Audio Library artwork manifest.

Run with Python 3. No network requests or image changes are made. New portraits
must be reviewed and added to manifest.json before they can appear in the Hub.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / 'music-dictionary/library-portraits'
manifest = json.loads((DIRECTORY / 'manifest.json').read_text())
fields = ('src', 'kind', 'position', 'sourceUrl', 'credit', 'license')
artists = {}
for name, entry in manifest['artists'].items():
    if entry['kind'] == 'placeholder':
        continue
    source = (ROOT / entry['src'].removeprefix('./')).resolve()
    if not source.is_relative_to(DIRECTORY.resolve()) or not source.is_file():
        raise ValueError(f'Missing local artwork for {name}')
    if source.stat().st_size > 15000 or max(entry['width'], entry['height']) > 128:
        raise ValueError(f'Artwork exceeds thumbnail limits: {name}')
    if not entry.get('sourceUrl'):
        raise ValueError(f'Missing image source: {name}')
    artists[name] = {key: value for key, value in entry.items() if key in fields}
output = 'window.CONCEPT_AUDIO_ARTWORK = ' + json.dumps(
    {'artists': artists}, ensure_ascii=False, separators=(',', ':')) + ';\n'
(ROOT / 'audio-concept-library-artwork.js').write_text(output)
print(f'Published artwork for {len(artists)} artist and musical credits')
