"""Review semantic cue candidates without treating ASR proximity as proof."""
import argparse
import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location('cue_proposals', Path(__file__).with_name('propose-audio-marker-corrections.py'))
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


def candidates(label, words):
    tokens = [helpers.normalise(w['word']) for w in words]
    indices = helpers.candidate_indices(label, tokens)
    # Spoken C/F are frequently decoded as their homophones. The recogniser
    # also writes replay announcements as "He does"; retain these as candidates,
    # not automatically approved edits.
    if not indices and any(n in label for n in ['1st', '2nd', '3rd', '4th']):
        relaxed = ['here' if t in {'he', 'heres', 'hereis'} else t for t in tokens]
        indices = helpers.candidate_indices(label, relaxed)
    return indices


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--transcripts', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    rows = []
    for track in json.loads(Path(args.manifest).read_text())['tracks']:
        for index, marker in enumerate(track['markers']):
            file = Path(args.transcripts) / track['paperId'] / f"{track['questionId']}-{track['clipIndex']}-m{index}.json"
            if not file.exists():
                continue
            data = json.loads(file.read_text())
            assert data['signature']['marker'] == marker
            words = [w for s in data['transcript']['segments'] for w in s.get('words', [])]
            found = candidates(marker['label'], words)
            chosen = min(found, key=lambda i: abs(words[i]['absolute_start'] - marker['time'])) if found else None
            stamp = words[chosen]['absolute_start'] if chosen is not None else None
            delta = round(stamp - marker['time'], 3) if stamp is not None else None
            rows.append({'paperId': track['paperId'], 'questionId': track['questionId'],
                         'clipIndex': track['clipIndex'], 'markerIndex': index, **marker,
                         'cueStart': stamp, 'delta': delta,
                         'needsReview': delta is None or delta < -.45 or delta > .85,
                         'cueText': ' '.join(w['word'].strip() for w in words[chosen:chosen + 16]) if chosen is not None else '',
                         'transcript': data['transcript']['text'], 'evidence': str(file)})
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(rows, indent=2) + '\n')
    selected = [r for r in rows if r['needsReview']]
    target.with_name(target.stem + '-flags.json').write_text(json.dumps(selected, indent=2) + '\n')
    print(len(rows), 'semantic rows;', len(selected), 'need review')


if __name__ == '__main__':
    main()
