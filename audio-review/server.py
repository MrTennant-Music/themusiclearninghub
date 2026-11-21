#!/usr/bin/env python3
"""Local-only audio review and non-destructive source preservation."""
import argparse
import contextlib
import hashlib
import json
import math
import mimetypes
import os
from pathlib import Path
import re
import secrets
import shutil
import sqlite3
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote

ROOT = Path(__file__).resolve().parents[1]
STATUSES = {'not_required', 'pending', 'keep', 'trim', 'wrong', 'poor', 'unsure', 'reject'}
USES = {'undecided', 'concept', 'exam', 'both'}
EXTENSIONS = {'.m4a', '.mp3', '.wav', '.ogg', '.flac', '.aac'}


def numbered_name(name):
    match=re.match(r'^(\d+\.\s+)(.*)$',name)
    return (match[1],match[2]) if match else ('',name)

def has_review(name):
    return numbered_name(name)[1].startswith('REVIEW ')

def approved_name(name):
    number,body=numbered_name(name)
    return number+(body[7:] if body.startswith('REVIEW ') else body)


def find_ffmpeg():
    candidates = [os.environ.get('AUDIO_REVIEW_FFMPEG'), str(ROOT / 'maintenance/audio-review/tools/ffmpeg'), shutil.which('ffmpeg')]
    candidates += [str(p) for p in Path('/private/tmp').glob('example-audio-compression-tools/imageio_ffmpeg/binaries/ffmpeg-*')]
    candidates += [str(p) for p in Path('/Applications/MediaHuman Audio Converter.app/Contents').glob('**/ffmpeg')]
    return next((p for p in candidates if p and Path(p).is_file() and os.access(p, os.X_OK)), None)


class Library:
    def __init__(self, root=ROOT, data=None, ffmpeg=None):
        self.root = Path(root).resolve()
        self.audio = self.root / 'example audio'
        self.data = Path(data or self.root / 'maintenance/audio-review')
        self.data.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.data / 'reviews.sqlite3', check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.execute('PRAGMA journal_mode=WAL')
        self.lock = threading.RLock()
        self.ffmpeg = ffmpeg or find_ffmpeg()
        self.db.executescript('''
          CREATE TABLE IF NOT EXISTS clips (
            id TEXT PRIMARY KEY, path TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'pending',
            use TEXT DEFAULT 'undecided', notes TEXT DEFAULT '', concepts TEXT DEFAULT '[]',
            start REAL DEFAULT 0, end REAL, original TEXT, exam TEXT, review_name TEXT,
            updated REAL DEFAULT 0, revision INTEGER DEFAULT 0);
          CREATE TABLE IF NOT EXISTS fingerprints (
            clip TEXT PRIMARY KEY, bytes INTEGER, mtime INTEGER, ctime INTEGER, sha256 TEXT);
          CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY, created REAL, clip TEXT, action TEXT, details TEXT);
        ''')
        self.db.commit()
        self.scan()

    def scan(self):
        with self.lock:
            for p in self.audio.rglob('*'):
                if p.is_file() and not p.is_symlink() and p.suffix.lower() in EXTENSIONS:
                    rel = str(p.relative_to(self.audio))
                    self.db.execute('INSERT OR IGNORE INTO clips(id,path) VALUES (?,?)', (hashlib.sha256(rel.encode()).hexdigest()[:24], rel))
            self.db.commit()

    def path(self, rel):
        p = (self.audio / rel).resolve()
        if not p.is_relative_to(self.audio.resolve()):
            raise ValueError('Invalid library path.')
        return p

    def row(self, ident):
        row = self.db.execute('SELECT * FROM clips WHERE id=?', (ident,)).fetchone()
        if not row:
            raise ValueError('Clip not found. Refresh the library.')
        return dict(row)

    def serialize(self, row):
        p = self.path(row['path'])
        parts = Path(row['path']).parts
        return {**row, 'name': p.name, 'level': parts[0], 'heading': parts[1] if len(parts)>2 else '',
                'concept': re.sub(r'^\d+\.\s+', '', parts[-2]) if len(parts)==3 else parts[-2], 'bytes': p.stat().st_size, 'review': has_review(p.name),
                'concepts': json.loads(row['concepts']), 'hasOriginal': bool(row['original']),
                'hasExam': bool(row['exam'])}

    def fingerprint(self, ident, p):
        stat=p.stat()
        signature=(stat.st_size,stat.st_mtime_ns,stat.st_ctime_ns)
        cached=self.db.execute('SELECT * FROM fingerprints WHERE clip=?',(ident,)).fetchone()
        if cached and (cached['bytes'],cached['mtime'],cached['ctime'])==signature:
            return cached['sha256']
        digest=hashlib.sha256()
        with p.open('rb') as stream:
            for chunk in iter(lambda:stream.read(1024*1024),b''):digest.update(chunk)
        after=p.stat()
        if (after.st_size,after.st_mtime_ns,after.st_ctime_ns)!=signature:
            return None  # Never report a duplicate from a file changing during the scan.
        value=digest.hexdigest()
        self.db.execute('INSERT OR REPLACE INTO fingerprints VALUES (?,?,?,?,?)',(ident,*signature,value))
        return value

    def catalog(self):
        with self.lock:
            result=[];groups={}
            for record in self.db.execute('SELECT * FROM clips ORDER BY path COLLATE NOCASE').fetchall():
                p=self.path(record['path'])
                if not p.is_file():continue
                item=self.serialize(dict(record));digest=self.fingerprint(item['id'],p)
                item['duplicateChecked']=bool(digest)
                item['duplicateGroup']=digest
                groups.setdefault(digest or item['id'],[]).append(item['id']);result.append(item)
            for item in result:
                peers=groups[item['duplicateGroup'] or item['id']]
                item['duplicateCount']=len(peers)
                item['duplicateCopies']=len(peers)-1
                item['duplicateIds']=[ident for ident in peers if ident!=item['id']]
            self.db.commit()
            return result

    def event(self, ident, action, details):
        self.db.execute('INSERT INTO events(created,clip,action,details) VALUES (?,?,?,?)', (time.time(), ident, action, json.dumps(details)))

    def version(self, row, body):
        if body.get('revision') != row['revision']:
            raise ValueError('This clip changed in another window. Refresh before saving.')

    def annotations(self, body):
        status, use = body.get('status', 'pending'), body.get('use', 'undecided')
        if status not in STATUSES or use not in USES:
            raise ValueError('Choose a valid decision and use.')
        concepts = body.get('concepts', [])
        if not isinstance(concepts, list) or len(concepts)>50 or not all(isinstance(c,str) and len(c)<150 for c in concepts):
            raise ValueError('Invalid concept list.')
        return status, use, str(body.get('notes', ''))[:10000], json.dumps(concepts)

    def save(self, body):
        with self.lock:
            row = self.row(body['id']); self.version(row, body)
            status, use, notes, concepts = self.annotations(body)
            src = self.path(row['path']); target = src
            review_name = row['review_name']
            if status == 'keep' and has_review(src.name):
                review_name = src.name
                target = src.with_name(approved_name(src.name))
            elif status == 'pending' and review_name and not has_review(src.name):
                target = src.with_name(review_name)
            if target != src:
                if target.exists():
                    raise ValueError('A file with the approved name already exists. No file was replaced.')
                src.rename(target)
            rel = str(target.relative_to(self.audio))
            try:
                self.db.execute('UPDATE clips SET path=?,status=?,use=?,notes=?,concepts=?,review_name=?,updated=?,revision=revision+1 WHERE id=?',
                                (rel,status,use,notes,concepts,review_name,time.time(),row['id']))
                self.event(row['id'],'review',{'before':row,'after':{**body,'path':rel}})
                self.db.commit()
            except Exception:
                self.db.rollback()
                if target != src: target.rename(src)
                raise
            return self.serialize(self.row(row['id']))

    def source(self, ident, original=False):
        with self.lock:
            row = self.row(ident)
            return Path(row['original']) if original and row['original'] else self.path(row['path'])

    def duration(self, p):
        result = subprocess.run([self.ffmpeg,'-hide_banner','-i',str(p)],capture_output=True,text=True,timeout=30)
        match = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', result.stderr)
        if not match: raise ValueError('This audio could not be read.')
        return int(match[1])*3600+int(match[2])*60+float(match[3])

    def trim(self, body):
        if not self.ffmpeg: raise ValueError('The audio converter is unavailable. Set AUDIO_REVIEW_FFMPEG to an installed ffmpeg executable and restart.')
        with self.lock:
            row=self.row(body['id']);self.version(row,body)
            start,end=float(body.get('start',0)),float(body.get('end',0))
            source=self.source(row['id'], body.get('original',False)); duration=self.duration(source)
            if not all(math.isfinite(v) for v in (start,end)) or start<0 or end-start<.1 or end>duration+.03:
                raise ValueError('Select at least 0.1 seconds inside this recording.')
            use=body.get('use',row['use'])
            if use not in USES:raise ValueError('Invalid use.')
            destination=self.path(row['path'])
            backup=Path(row['original']) if row['original'] else self.data/'originals'/(row['id']+destination.suffix)
            backup.parent.mkdir(parents=True,exist_ok=True)
            if not backup.exists():shutil.copy2(destination,backup)
            # The preserved source never changes, even after repeated trims.
            temp=destination.with_name('.review-'+secrets.token_hex(6)+'.m4a')
            try:
                subprocess.run([self.ffmpeg,'-v','error','-nostdin','-y','-ss',str(start),'-i',str(source),'-t',str(end-start),
                                '-map','0:a:0','-vn','-map_metadata','-1','-c:a','aac','-b:a','96k','-ar','44100','-ac','2','-movflags','+faststart',str(temp)],check=True,capture_output=True,timeout=180)
                newduration=self.duration(temp)
                if abs(newduration-(end-start))>.1:raise ValueError('The saved duration did not match the selection.')
                subprocess.run([self.ffmpeg,'-v','error','-xerror','-nostdin','-i',str(temp),'-f','null','-'],check=True,capture_output=True,timeout=180)
                if destination.suffix.lower()!='.m4a':
                    target=destination.with_suffix('.m4a')
                    if target.exists():raise ValueError('An M4A with this name already exists.')
                else:target=destination
                # Preserve the immediate previous version for recovery as well.
                version=self.data/'versions'/(row['id']+'-'+secrets.token_hex(5)+destination.suffix)
                version.parent.mkdir(exist_ok=True);shutil.copy2(destination,version)
                os.replace(temp,target)
                if target!=destination:destination.unlink()
                self.db.execute('UPDATE clips SET path=?,original=?,status=?,use=?,start=0,end=NULL,updated=?,revision=revision+1 WHERE id=?',
                                (str(target.relative_to(self.audio)),str(backup),'trim',use,time.time(),row['id']))
                self.event(row['id'],'trim',{'source':str(source),'start':start,'end':end,'previous':str(version),'before':row})
                self.db.commit()
                return self.serialize(self.row(row['id']))
            finally:
                with contextlib.suppress(FileNotFoundError):temp.unlink()

    def preserve_exam(self, body):
        with self.lock:
            row=self.row(body['id']);self.version(row,body)
            src=self.source(row['id'],True)
            dest=self.root/'exam-excerpt-bank'/row['path']
            dest=dest.with_name(approved_name(dest.name))
            dest.parent.mkdir(parents=True,exist_ok=True)
            if dest.exists() and hashlib.sha256(dest.read_bytes()).digest()!=hashlib.sha256(src.read_bytes()).digest():
                raise ValueError('A different exam excerpt already has this name. No file was replaced.')
            if not dest.exists():shutil.copy2(src,dest)
            self.db.execute('UPDATE clips SET exam=?,revision=revision+1,updated=? WHERE id=?',(str(dest),time.time(),row['id']))
            self.event(row['id'],'preserve_exam',{'destination':str(dest)});self.db.commit()
            return self.serialize(self.row(row['id']))

    def move(self, body):
        with self.lock:
            row=self.row(body['id']);self.version(row,body)
            folder=self.path(str(body.get('folder','')))
            parts=folder.relative_to(self.audio).parts
            valid=len(parts)==3 or (len(parts)==2 and re.sub(r'^\d+\.\s+', '', parts[-1])=='Multiple Concepts')
            if not folder.is_dir() or not valid:
                raise ValueError('Choose an existing concept folder or a level’s Multiple Concepts folder.')
            src=self.path(row['path']);oldconcept=src.parent.name;newconcept=folder.name
            stem=src.stem
            if stem.endswith(' - '+oldconcept):stem=stem[:-len(' - '+oldconcept)]
            is_multiple=len(json.loads(row['concepts']))>1
            target=folder/src.name if is_multiple else folder/(stem+' - '+newconcept+src.suffix)
            if target==src:return self.serialize(row)
            if target.exists():raise ValueError('A file with that name already exists in the destination. Nothing was moved.')
            src.rename(target)
            review_name=row['review_name']
            if review_name and not is_multiple:
                rs=Path(review_name).stem
                if rs.endswith(' - '+oldconcept):rs=rs[:-len(' - '+oldconcept)]
                review_name=rs+' - '+newconcept+src.suffix
            try:
                self.db.execute('UPDATE clips SET path=?,review_name=?,status=?,updated=?,revision=revision+1 WHERE id=?',
                                (str(target.relative_to(self.audio)),review_name,'pending',time.time(),row['id']))
                self.event(row['id'],'move',{'from':str(src),'to':str(target)});self.db.commit()
            except Exception:
                self.db.rollback();target.rename(src);raise
            return self.serialize(self.row(row['id']))

    def delete(self, body):
        with self.lock:
            row=self.row(body['id']);self.version(row,body)
            src=self.path(row['path'])
            target=self.data/'deleted'/row['id']/src.name
            target.parent.mkdir(parents=True,exist_ok=True)
            if target.exists():raise ValueError('A preserved deletion already exists for this file.')
            src.rename(target)
            try:
                self.db.execute('UPDATE clips SET revision=revision+1 WHERE id=?',(row['id'],))
                self.event(row['id'],'delete',{'from':row['path'],'preserved':str(target)});self.db.commit()
            except Exception:
                self.db.rollback();target.rename(src);raise
            return {'id':row['id'],'deleted':True}

    def restore(self, body):
        with self.lock:
            row=self.row(body['id']);target=self.path(row['path'])
            src=self.data/'deleted'/row['id']/target.name
            if target.exists() or not src.is_file():raise ValueError('Cannot restore: original path is occupied or backup is unavailable.')
            target.parent.mkdir(parents=True,exist_ok=True);src.rename(target)
            self.db.execute('UPDATE clips SET revision=revision+1 WHERE id=?',(row['id'],))
            self.event(row['id'],'restore',{'path':row['path']});self.db.commit()
            return self.serialize(self.row(row['id']))

    def folders(self):
        candidates=list(self.audio.glob('*/*/*'))+[p for p in self.audio.glob('*/*') if re.sub(r'^\d+\.\s+', '', p.name)=='Multiple Concepts']
        return sorted(str(p.relative_to(self.audio)) for p in candidates if p.is_dir() and not p.is_symlink())

    def export(self):
        with self.lock:
            result=self.catalog()
            p=self.data/'Review Decisions.json';p.write_text(json.dumps(result,indent=2,ensure_ascii=False))
            return result


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): pass
    def send_json(self, data, status=200):
        b=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
    def allowed(self):
        host=self.headers.get('Host','');port=self.server.server_port
        if host not in {f'127.0.0.1:{port}',f'localhost:{port}'}:return False
        origin=self.headers.get('Origin')
        return not origin or origin in {f'http://127.0.0.1:{port}',f'http://localhost:{port}'}
    def do_GET(self):
        if not self.allowed():return self.send_json({'error':'Local access only.'},403)
        url=urlparse(self.path);q=parse_qs(url.query)
        try:
            if url.path=='/api/catalog':return self.send_json({'clips':self.server.library.catalog(),'token':self.server.token,'trimmingAvailable':bool(self.server.library.ffmpeg),'folders':self.server.library.folders()})
            if url.path=='/api/export':return self.send_json(self.server.library.export())
            if url.path=='/audio':
                p=self.server.library.source(q.get('id',[''])[0],q.get('original',['0'])[0]=='1')
            else:
                static={'/':'audio-review/index.html','/index.html':'audio-review/index.html','/review.css':'audio-review/review.css','/review.js':'audio-review/review.js',
                        '/styles/desktop-layout.css':'styles/desktop-layout.css','/desktop-layout.js':'desktop-layout.js',
                        '/shared/hub-layout-viewport.js':'shared/hub-layout-viewport.js','/music-concepts-data.js':'music-dictionary/music-concepts-data.js',
                        '/shared/hub-touch.js':'shared/hub-touch.js','/styles/hub-touch.css':'styles/hub-touch.css'}
                if url.path not in static:return self.send_json({'error':'Not found.'},404)
                p=ROOT/static[url.path]
            self.serve_file(p)
        except (ValueError,FileNotFoundError) as e:self.send_json({'error':str(e)},404)
        except (BrokenPipeError,ConnectionResetError):pass
    def serve_file(self,p):
        size=p.stat().st_size;start,end=0,size-1;status=200
        rg=self.headers.get('Range')
        if rg:
            m=re.fullmatch(r'bytes=(\d*)-(\d*)',rg)
            if not m or not any(m.groups()):return self.send_json({'error':'Invalid range'},416)
            if m[1]:start=int(m[1]);end=min(int(m[2]) if m[2] else end,end)
            else:start=max(0,size-int(m[2]))
            if start>end or start>=size:
                self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.end_headers();return
            status=206
        self.send_response(status);self.send_header('Content-Type',mimetypes.guess_type(str(p))[0] or 'application/octet-stream');self.send_header('Accept-Ranges','bytes');self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff')
        if status==206:self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length',str(end-start+1));self.end_headers()
        with p.open('rb') as f:
            f.seek(start);left=end-start+1
            while left:
                b=f.read(min(left,65536))
                if not b:break
                self.wfile.write(b);left-=len(b)
    def do_POST(self):
        if not self.allowed() or self.headers.get('X-Review-Token')!=self.server.token:return self.send_json({'error':'Open this tool locally to save.'},403)
        try:
            n=int(self.headers.get('Content-Length','0'))
            if not 0<n<=100000 or self.headers.get('Content-Type')!='application/json':raise ValueError('Invalid request.')
            body=json.loads(self.rfile.read(n));route=urlparse(self.path).path
            methods={'/api/delete':self.server.library.delete,'/api/restore':self.server.library.restore,'/api/review':self.server.library.save,'/api/trim':self.server.library.trim,'/api/exam':self.server.library.preserve_exam,'/api/move':self.server.library.move}
            if route=='/api/refresh':self.server.library.scan();return self.send_json({'ok':True})
            if route not in methods:return self.send_json({'error':'Not found'},404)
            self.send_json(methods[route](body))
        except (ValueError,KeyError,TypeError) as e:self.send_json({'error':str(e)},400)
        except Exception as e:self.send_json({'error':'Could not save. Your preserved original is safe. '+str(e)},500)


def serve(root=ROOT,port=8901,data=None):
    server=ThreadingHTTPServer(('127.0.0.1',port),Handler);server.library=Library(root,data);server.token=secrets.token_urlsafe(32)
    return server

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8901);args=parser.parse_args()
    server=serve(port=args.port)
    print(f'Audio Review ready: http://127.0.0.1:{args.port}',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
