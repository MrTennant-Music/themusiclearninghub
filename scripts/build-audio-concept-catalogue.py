"""Refresh the public metadata catalogue; never copy audio into the website."""
import argparse
import json
import re
from pathlib import Path
from audio_file_metadata import read_metadata

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path, help='Local OneDrive Audio Concept Library folder')
args = parser.parse_args()
source = args.source.resolve()
if not source.is_dir():
    parser.error('Source folder does not exist')
target = Path(__file__).resolve().parents[1] / 'audio-concept-library-data.json'
previous = json.loads(target.read_text()) if target.exists() else {'concepts': []}
previous_meta = {(c['path'], f): meta for c in previous['concepts']
                 for f, meta in c.get('fileMeta', {}).items()}
audio_types = {'.mp3', '.m4a', '.wav', '.aac', '.aiff', '.aif', '.flac', '.ogg'}
exclusions = json.loads((Path(__file__).with_name('audio-concept-catalogue-exclusions.json')).read_text())['excludedFiles']
concepts = []
clean = lambda name: re.sub(r'^\d+\.\s*', '', name)
for folder in sorted(source.glob('*/*/*')):
    if not folder.is_dir():
        continue
    parts = folder.relative_to(source).parts
    files = sorted(str(f.relative_to(folder)) for f in folder.rglob('*')
                   if f.is_file() and f.suffix.lower() in audio_types)
    concepts.append(dict(level=clean(parts[0]), category=clean(parts[1]),
                         concept=({'Harmony - Chord': 'Harmony / chord', 'Unison - Octave': 'Unison / octave'}.get(parts[2], parts[2]) if clean(parts[0]) == 'National 3' else parts[2]), path='/'.join(parts), files=files))
for folder in sorted(source.glob('*/*')):
    if not folder.is_dir():
        continue
    files = sorted(f.name for f in folder.iterdir()
                   if f.is_file() and f.suffix.lower() in audio_types)
    if files:
        parts = folder.relative_to(source).parts
        concepts.append(dict(level=clean(parts[0]), category=clean(parts[1]),
                             concept=clean(parts[1]), path='/'.join(parts), files=files))
# Preserve reviewed duplicate removals when refreshing from OneDrive.
for concept in concepts:
    concept['files'] = [f for f in concept['files']
                        if concept['path'] + '/' + f not in exclusions]
concepts.sort(key=lambda c: c['path'])
for concept in concepts:
    concept['fileMeta'] = {filename: read_metadata(source / concept['path'] / filename)
                           for filename in concept['files']}
    for filename, metadata in concept['fileMeta'].items():
        audited = previous_meta.get((concept['path'], filename), {})
        for field in ('title', 'artist', 'concepts'):
            if field in audited:
                metadata[field] = audited[field]
target.write_text(json.dumps(dict(concepts=concepts), ensure_ascii=False, indent=2) + '\n')
print(f'Catalogued {len(concepts)} concepts and {sum(len(c["files"]) for c in concepts)} recordings.')
