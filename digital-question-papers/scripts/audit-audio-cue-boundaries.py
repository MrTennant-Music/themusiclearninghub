"""Decode registered audio and retain source-hashed local cue evidence.

Signal measurements and speech recognition do not constitute listening.
Run in an isolated Python environment with numpy, imageio-ffmpeg and, for
transcription, openai-whisper. Models remain local; no audio is uploaded.
"""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess
import time

import imageio_ffmpeg
import numpy as np


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    temporary.replace(path)


def decode(track, start=None, duration=None):
    command = [imageio_ffmpeg.get_ffmpeg_exe(), '-nostdin', '-v', 'error']
    if start is not None:
        command += ['-ss', str(start)]
    command += ['-i', track['source']]
    if duration is not None:
        command += ['-t', str(duration)]
    command += ['-ac', '1', '-ar', '16000', '-f', 'f32le', '-']
    result = subprocess.run(command, capture_output=True, check=True)
    return np.frombuffer(result.stdout, dtype='<f4').copy(), result.stderr.decode(errors='replace')


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def intervals(mask, step, minimum):
    edges = np.diff(np.r_[False, mask, False].astype(np.int8))
    return [[round(a * step, 3), round(b * step, 3)]
            for a, b in zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1))
            if (b - a) * step >= minimum]


def media(track):
    samples, errors = decode(track)
    assert samples.size and np.isfinite(samples).all()
    duration = len(samples) / 16000
    blocks = samples[:len(samples) // 160 * 160].reshape(-1, 160)
    rms = np.sqrt(np.mean(blocks * blocks, axis=1))
    markers = []
    for index, marker in enumerate(track['markers']):
        stamp = float(marker['time'])
        assert 0 <= stamp < duration
        assert not index or stamp > track['markers'][index - 1]['time']
        left, right = max(0, int((stamp - 3) * 100)), min(len(rms), int((stamp + 6) * 100))
        markers.append({**marker, 'index': index, 'windowStart': left / 100,
                        'rmsDb10ms': np.round(20 * np.log10(np.maximum(rms[left:right], 1e-9)), 2).tolist()})
    return {**track, 'sourceSha256': digest(track['source']), 'bytes': Path(track['source']).stat().st_size,
            'decodedDurationSeconds': duration, 'decodedSamplesMono16k': len(samples),
            'decoderErrors': errors, 'peak': float(np.max(np.abs(samples))),
            'rms': float(np.sqrt(np.mean(samples * samples))),
            'silenceBelowMinus60DbAtLeast2s': intervals(rms < .001, .01, 2),
            'markers': markers, 'scope': 'Complete decode plus signal measurements, not audition or musical-quality certification.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--mode', choices=['media', 'transcribe'], required=True)
    parser.add_argument('--model', default='tiny.en')
    parser.add_argument('--model-dir', default='maintenance/models/whisper')
    parser.add_argument('--selection', help='Optional JSON list of paper/question/clip/marker keys')
    parser.add_argument('--lead', type=float, default=3)
    parser.add_argument('--duration', type=float, default=18)
    args = parser.parse_args()
    manifest = json.loads(Path(args.manifest).read_text())
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    if args.mode == 'media':
        records = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            for record in pool.map(media, manifest['tracks']):
                records.append(record)
                save(output / 'media.json', {'scope': 'Fresh complete file decodes and source-hashed signal evidence.', 'tracks': records})
                print(record['paperId'], record['questionId'], round(record['decodedDurationSeconds'], 3), flush=True)
        return
    import torch
    import whisper
    torch.set_num_threads(2)
    model = whisper.load_model(args.model, device='cpu', download_root=args.model_dir)
    model_hash = digest(Path(args.model_dir) / (args.model + '.pt'))
    selection = None
    if args.selection:
        selection = {tuple(row[k] for k in ['paperId', 'questionId', 'clipIndex', 'markerIndex'])
                     for row in json.loads(Path(args.selection).read_text())}
    completed = 0
    started = time.monotonic()
    for track in manifest['tracks']:
        source_hash = digest(track['source'])
        for index, marker in enumerate(track['markers']):
            key = (track['paperId'], track['questionId'], track['clipIndex'], index)
            if selection is not None and key not in selection:
                continue
            path = output / track['paperId'] / f"{track['questionId']}-{track['clipIndex']}-m{index}.json"
            start = max(0, marker['time'] - args.lead)
            signature = {'sourceSha256': source_hash, 'modelSha256': model_hash,
                         'marker': marker, 'windowStart': start, 'windowDuration': args.duration}
            if path.exists() and json.loads(path.read_text()).get('signature') == signature:
                continue
            samples, errors = decode(track, start, args.duration)
            result = model.transcribe(samples, language='en', word_timestamps=True,
                                      fp16=False, condition_on_previous_text=False, temperature=0)
            for segment in result['segments']:
                for word in segment.get('words', []):
                    word['absolute_start'] = round(start + word['start'], 3)
                    word['absolute_end'] = round(start + word['end'], 3)
            save(path, {'paperId': key[0], 'questionId': key[1], 'clipIndex': key[2],
                        'markerIndex': index, 'model': args.model, 'signature': signature,
                        'decodedWindowSha256': hashlib.sha256(samples.tobytes()).hexdigest(),
                        'decoderErrors': errors, 'transcript': result,
                        'scope': 'Fresh local ASR, not listening; timestamps and semantics require separate review.'})
            completed += 1
            if completed % 10 == 0:
                print('DONE', completed, key, 'elapsed', round(time.monotonic() - started, 1), flush=True)
        print('TRACK', track['paperId'], track['questionId'], flush=True)


if __name__ == '__main__':
    main()
