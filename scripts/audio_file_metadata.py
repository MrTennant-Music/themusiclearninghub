"""Read M4A movie duration and file size without decoding or copying audio."""
import json
import struct
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed


def read_metadata(path, allow_online_only=False):
    info = path.stat()
    size = info.st_size
    duration = None
    # macOS File Provider placeholders must not trigger audio downloads.
    if not allow_online_only and getattr(info, 'st_flags', 0) & 0x40000000:
        return {'duration': None, 'size': size}
    with path.open('rb') as stream:
        def atoms(end):
            while stream.tell() + 8 <= end:
                start = stream.tell()
                length, kind = struct.unpack('>I4s', stream.read(8))
                header = 8
                if length == 1:
                    length = struct.unpack('>Q', stream.read(8))[0]
                    header = 16
                elif length == 0:
                    length = end - start
                if length < header or start + length > end:
                    break
                yield kind, start + length
                stream.seek(start + length)
        for kind, end in atoms(size):
            if kind != b'moov':
                continue
            for child, child_end in atoms(end):
                if child == b'mvhd':
                    version = stream.read(4)[0]
                    stream.read(16 if version == 1 else 8)
                    timescale = struct.unpack('>I', stream.read(4))[0]
                    ticks = struct.unpack('>Q' if version == 1 else '>I', stream.read(8 if version == 1 else 4))[0]
                    if timescale and ticks not in (0xffffffff, 0xffffffffffffffff):
                        duration = round(ticks / timescale, 3)
                    break
            break
    return {'duration': duration, 'size': size}


if __name__ == '__main__':
    source = Path(sys.argv[1])
    target = Path(__file__).resolve().parents[1] / 'audio-concept-library-data.json'
    data = json.loads(target.read_text())
    if '--download-missing' in sys.argv[2:]:
        jobs = [(concept, filename) for concept in data['concepts']
                for filename in concept['files']
                if concept.get('fileMeta', {}).get(filename, {}).get('duration') is None]
        print(f'Reading {len(jobs)} missing durations from OneDrive…', flush=True)
        with ThreadPoolExecutor(max_workers=8) as pool:
            pending = {pool.submit(read_metadata, source / concept['path'] / filename, True): (concept, filename)
                       for concept, filename in jobs}
            for count, future in enumerate(as_completed(pending), 1):
                concept, filename = pending[future]
                try:
                    concept.setdefault('fileMeta', {})[filename] = future.result()
                except (OSError, ValueError, struct.error) as error:
                    print(f'Could not read {concept["concept"]}: {filename}: {error}', flush=True)
                if count % 10 == 0 or count == len(jobs):
                    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
                    print(f'Updated {count}/{len(jobs)} excerpts.', flush=True)
        sys.exit(0)
    count = missing = 0
    for concept in data['concepts']:
        concept['fileMeta'] = {}
        for filename in concept['files']:
            path = source / concept['path'] / filename
            if not path.is_file():
                missing += 1
                continue
            concept['fileMeta'][filename] = read_metadata(path)
            count += 1
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f'Measured {count} excerpts; {missing} files unavailable locally.')
