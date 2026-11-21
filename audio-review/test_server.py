import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
import urllib.request
import urllib.error

spec=importlib.util.spec_from_file_location('audio_review_server',Path(__file__).with_name('server.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        self.folder=self.root/'example audio/National 3/Melody and Harmony/Ascending';self.folder.mkdir(parents=True)
        self.other=self.folder.with_name('Descending');self.other.mkdir()
        self.ff=m.find_ffmpeg()
        if not self.ff:self.skipTest('ffmpeg required for disposable audio fixtures')
        self.source=self.folder/'REVIEW Test - Phrase - Ascending.m4a'
        subprocess.run([self.ff,'-v','error','-f','lavfi','-i','sine=frequency=440:duration=2','-c:a','aac','-b:a','96k',str(self.source)],check=True)
        self.original=self.source.read_bytes();self.lib=m.Library(self.root,ffmpeg=self.ff)
        self.clip=self.lib.catalog()[0]
    def tearDown(self):
        if hasattr(self,'lib'):self.lib.db.close()
        self.temp.cleanup()
    def payload(self,**kw):
        return dict(id=self.clip['id'],revision=self.lib.row(self.clip['id'])['revision'],status='pending',use='both',notes='Clear rising phrase.',concepts=['Scale'],**kw)
    def test_delete_and_restore_preserve_audio_and_other_copies(self):
        other=self.other/'Copy.m4a';other.write_bytes(self.original);self.lib.scan()
        self.lib.delete(self.payload())
        self.assertFalse(self.source.exists());self.assertEqual(other.read_bytes(),self.original)
        self.assertEqual(len(self.lib.catalog()),1)
        row=self.lib.restore({'id':self.clip['id']})
        self.assertEqual(self.source.read_bytes(),self.original)
        self.assertEqual(len(self.lib.catalog()),2)
        self.assertEqual(row['id'],self.clip['id'])

    def test_keep_and_reset_restore_prefix_and_persist(self):
        p=self.payload();p['status']='keep';r=self.lib.save(p)
        self.assertFalse(r['review']);self.assertEqual(self.lib.source(r['id']).read_bytes(),self.original)
        self.lib.db.close();self.lib=m.Library(self.root,ffmpeg=self.ff)
        self.assertEqual(self.lib.row(r['id'])['notes'],'Clear rising phrase.')
        r=self.lib.save(self.payload());self.assertTrue(r['review']);self.assertEqual(len(self.lib.catalog()),1)
    def test_numbered_review_approval_keeps_number_and_exam_labels(self):
        number=self.source.with_name('01. REVIEW EXAM Test - Phrase - Ascending.m4a')
        self.source.rename(number)
        self.lib.db.execute('UPDATE clips SET path=? WHERE id=?',(str(number.resolve().relative_to(self.lib.audio)),self.clip['id']));self.lib.db.commit()
        p=self.payload();p['status']='keep';row=self.lib.save(p)
        self.assertEqual(row['name'],'01. EXAM Test - Phrase - Ascending.m4a')
        self.assertFalse(row['review'])
        row=self.lib.save(self.payload())
        self.assertEqual(row['name'],'01. REVIEW EXAM Test - Phrase - Ascending.m4a')
        self.assertTrue(row['review'])

    def test_reject_is_only_a_flag(self):
        p=self.payload();p['status']='reject';self.lib.save(p)
        self.assertEqual(self.source.read_bytes(),self.original)
    def test_name_collision_and_stale_revision_do_not_mutate(self):
        collision=self.source.with_name(self.source.name[7:]);collision.write_bytes(b'keep me')
        p=self.payload();p['status']='keep'
        with self.assertRaises(ValueError):self.lib.save(p)
        self.assertEqual(collision.read_bytes(),b'keep me');self.assertEqual(self.source.read_bytes(),self.original)
        p=self.payload();self.lib.save(p)
        with self.assertRaises(ValueError):self.lib.save(p)
    def test_trim_preserves_original_and_exam_copy(self):
        r=self.lib.trim({**self.payload(),'start':.3,'end':1.1})
        self.assertAlmostEqual(self.lib.duration(self.lib.source(r['id'])),.8,delta=.05)
        self.assertEqual(self.lib.source(r['id'],True).read_bytes(),self.original)
        r=self.lib.preserve_exam(self.payload());self.assertEqual(Path(r['exam']).read_bytes(),self.original)
        r=self.lib.trim({**self.payload(),'start':1,'end':1.7,'original':True})
        self.assertAlmostEqual(self.lib.duration(self.lib.source(r['id'])),.7,delta=.05)
        self.assertEqual(self.lib.source(r['id'],True).read_bytes(),self.original)
        self.assertEqual(len(list((self.lib.data/'versions').iterdir())),2)
    def test_invalid_trim_and_path_escape(self):
        for a,b in [(-1,1),(1,1),(0,8),(float('nan'),1)]:
            with self.assertRaises(ValueError):self.lib.trim({**self.payload(),'start':a,'end':b})
        with self.assertRaises(ValueError):self.lib.path('../../outside')
        self.assertEqual(self.source.read_bytes(),self.original)
    def test_move_updates_primary_concept_without_overwrite(self):
        r=self.lib.move({**self.payload(),'folder':'National 3/Melody and Harmony/Descending'})
        self.assertEqual(r['name'],'REVIEW Test - Phrase - Descending.m4a')
        self.assertEqual(r['concept'],'Descending');self.assertEqual(self.lib.source(r['id']).read_bytes(),self.original)
        self.lib.scan();self.assertEqual(len(self.lib.catalog()),1)
    def test_duplicates_count_other_copies_and_locations(self):
        copy=self.other/'Different Name - Descending.m4a';copy.write_bytes(self.original)
        self.lib.scan();rows=self.lib.catalog()
        self.assertEqual(len(rows),2)
        self.assertTrue(all(r['duplicateCount']==2 and r['duplicateCopies']==1 for r in rows))
        self.assertEqual(rows[0]['duplicateIds'],[rows[1]['id']])
        self.assertEqual(rows[0]['duplicateGroup'],rows[1]['duplicateGroup'])
        copy.unlink();remaining=self.lib.catalog()[0]
        self.assertEqual(remaining['duplicateCount'],1);self.assertEqual(remaining['duplicateCopies'],0)

    def test_changed_audio_invalidates_duplicate_cache(self):
        copy=self.other/'Same Recording - Descending.m4a';copy.write_bytes(self.original)
        self.lib.scan();self.assertEqual(self.lib.catalog()[0]['duplicateCount'],2)
        self.lib.trim({**self.payload(),'start':.25,'end':1.25})
        rows=self.lib.catalog()
        self.assertTrue(all(r['duplicateChecked'] and r['duplicateCount']==1 for r in rows))
        self.assertNotEqual(rows[0]['duplicateGroup'],rows[1]['duplicateGroup'])

    def test_multiple_concepts_level_folder_is_listed_and_playable(self):
        folder=self.root/'example audio/Advanced Higher/Multiple Concepts';folder.mkdir(parents=True)
        p=folder/'001. Multiple Concepts - Test - Arco, Hemiola.m4a';p.write_bytes(self.original)
        self.lib.scan();row=next(r for r in self.lib.catalog() if r['name']==p.name)
        self.assertEqual(row['level'],'Advanced Higher');self.assertEqual(row['concept'],'Multiple Concepts')
        self.assertIn('Advanced Higher/Multiple Concepts',self.lib.folders())
        self.assertEqual(self.lib.source(row['id']).read_bytes(),self.original)

    def test_http_range_and_save_access(self):
        server=m.serve(self.root,port=0,data=self.root/'http-data');thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        url=f'http://127.0.0.1:{server.server_port}'
        try:
            catalog=json.load(urllib.request.urlopen(url+'/api/catalog'));ident=catalog['clips'][0]['id']
            req=urllib.request.Request(url+'/audio?id='+ident,headers={'Range':'bytes=3-20'})
            with urllib.request.urlopen(req) as r:self.assertEqual(r.status,206);self.assertEqual(r.read(),self.original[3:21])
            req=urllib.request.Request(url+'/api/review',data=b'{}',headers={'Content-Type':'application/json'},method='POST')
            with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(req)
            self.assertEqual(e.exception.code,403)
            req=urllib.request.Request(url+'/api/catalog',headers={'Origin':'https://example.com'})
            with self.assertRaises(urllib.error.HTTPError):urllib.request.urlopen(req)
            req=urllib.request.Request(url+'/api/review',data=json.dumps(dict(id=ident,revision=0,status='keep',use='concept')).encode(),headers={'Content-Type':'application/json','X-Review-Token':catalog['token']},method='POST')
            r=json.load(urllib.request.urlopen(req));self.assertEqual(r['status'],'keep')
        finally:server.shutdown();server.server_close();server.library.db.close();thread.join()

if __name__=='__main__':unittest.main()
