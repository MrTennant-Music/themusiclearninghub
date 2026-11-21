const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs/promises'), os = require('node:os'), path = require('node:path');
const { createAudioServer, commonsTitle, uploadedAudio } = require('../scripts/concept-audio-editor.cjs');
function wav(note = 1) {
  const bytes = Buffer.alloc(64); bytes.write('RIFF'); bytes.writeUInt32LE(56, 4); bytes.write('WAVEfmt ', 8); bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(8000, 24); bytes.writeUInt32LE(16000, 28);
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(20, 40); bytes.writeInt16LE(note, 44); return bytes;
}
const media = note => ({ type: 'audio', name: 'Chosen example ' + note, src: 'data:audio/wav;base64,' + wav(note).toString('base64') });
async function setup(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'concept-audio-'));
  await fs.mkdir(path.join(root, 'music-dictionary'), { recursive: true });
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const server = createAudioServer({ projectRoot: root, conceptIds: ['MC-0001', 'MC-0002'], resolveAudio: async source => {
    commonsTitle(source); return { metadata: { name: 'Library clip', sourceUrl: source, credit: 'Musician', license: 'CC BY 4.0', src: 'https://upload.wikimedia.org/wikipedia/commons/example.mp3' } };
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = 'http://127.0.0.1:' + server.address().port;
  const save = (id, change, origin = 'http://127.0.0.1:8765') => fetch(base + '/audio/' + id, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(change) });
  return { root, base, save };
}
test('Multiple chosen clips persist in order, concurrent saves keep every clip, duplicates are avoided and removal is isolated', async t => {
  const { root, base, save } = await setup(t);
  const first = await (await save('MC-0001', { media: media(1) })).json(); assert.equal(first.clips.length, 1);
  const responses = await Promise.all([save('MC-0001', { media: media(2) }), save('MC-0002', { media: media(3) })]);
  for (const response of responses) assert.equal(response.status, 200);
  const repeated = await (await save('MC-0001', { media: media(1) })).json(); assert.equal(repeated.clips.length, 2);
  assert.deepEqual(repeated.clips.map(c => c.name), ['Chosen example 1', 'Chosen example 2']);
  const disk = JSON.parse(await fs.readFile(path.join(root, 'music-dictionary/music-concepts-audio.json'), 'utf8'));
  assert.deepEqual(require(path.join(root, 'music-dictionary/music-concepts-audio.js')), disk);
  for (const clips of Object.values(disk.concepts)) for (const clip of clips) assert.deepEqual(await fs.readFile(path.join(root, clip.src)), wav(Number(clip.name.slice(-1))));
  const removed = await (await save('MC-0001', { remove: first.clip.id })).json(); assert.equal(removed.clips.length, 1); assert.equal(removed.clips[0].name, 'Chosen example 2');
  const fresh = await fetch(base + '/audio').then(r => r.json()); assert.equal(fresh.concepts['MC-0002'][0].name, 'Chosen example 3');
  // Removal leaves the original asset recoverable; the second concept is untouched.
  assert.ok(await fs.stat(path.join(root, first.clip.src)));
  const restarted = createAudioServer({ projectRoot: root }); await new Promise(r => restarted.listen(0, '127.0.0.1', r));
  try { assert.deepEqual(await fetch('http://127.0.0.1:' + restarted.address().port + '/audio').then(r => r.json()), fresh); }
  finally { await new Promise(r => restarted.close(r)); }
});
test('Commons choices keep remote audio URLs and attribution, and failed selections preserve saved audio', async t => {
  const { root, save } = await setup(t), sourceUrl = 'https://commons.wikimedia.org/wiki/File:Chosen.ogg';
  const result = await save('MC-0001', { media: { type: 'audio', name: 'My listening example', sourceUrl } }); assert.equal(result.status, 200);
  const clip = (await result.json()).clip; assert.equal(clip.license, 'CC BY 4.0'); assert.equal(clip.sourceUrl, sourceUrl); assert.equal(clip.src, 'https://upload.wikimedia.org/wikipedia/commons/example.mp3');
  const before = await fs.readFile(path.join(root, 'music-dictionary/music-concepts-audio.json'), 'utf8');
  for (const change of [{ media: { type: 'audio', sourceUrl: 'http://127.0.0.1/private' } }, { media: { type: 'audio', src: 'data:audio/wav;base64,' + Buffer.from('not audio').toString('base64') } }, { remove: 'missing' }]) assert.equal((await save('MC-0001', change)).status, 400);
  assert.equal(await fs.readFile(path.join(root, 'music-dictionary/music-concepts-audio.json'), 'utf8'), before);
  assert.equal((await save('MC-9999', { media: media(1) })).status, 404);
  assert.equal((await save('MC-0001', { media: media(1) }, 'https://example.com')).status, 403);
  assert.equal((await save('MC-0001', { media: media(1) }, '')).status, 403);
});
test('Uploads accept audio file signatures and library URLs cannot target arbitrary servers', () => {
  assert.equal(uploadedAudio(media(1)).ext, 'wav');
  assert.throws(() => uploadedAudio({ src: 'data:audio/mpeg;base64,' + Buffer.from('<script>no</script>').toString('base64') }));
  for (const url of ['http://commons.wikimedia.org/wiki/File:Clip.ogg', 'https://example.com/wiki/File:Clip.ogg', 'https://commons.wikimedia.org/wiki/Main_Page']) assert.throws(() => commonsTitle(url));
});
test('Each track section persists independently without downloading or replacing its audio', async t => {
  const {root,base,save}=await setup(t);
  const first=(await (await save('MC-0001',{media:media(1)})).json()).clip;
  const second=(await (await save('MC-0001',{media:media(2)})).json()).clip;
  const before=await fs.readFile(path.join(root,first.src));
  const edited=await save('MC-0001',{update:first.id,startSeconds:45,endSeconds:57});
  assert.equal(edited.status,200);
  const data=await edited.json();
  assert.equal(data.clips[0].startSeconds,45);assert.equal(data.clips[0].endSeconds,57);
  assert.deepEqual(data.clips[1],second);assert.equal(data.clips[0].src,first.src);
  assert.deepEqual(await fs.readFile(path.join(root,first.src)),before);
  const restored=await fetch(base+'/audio').then(r=>r.json());assert.equal(restored.concepts['MC-0001'][0].endSeconds,57);
  const disk=await fs.readFile(path.join(root,'music-dictionary/music-concepts-audio.json'),'utf8');
  for(const change of [{update:first.id,startSeconds:57,endSeconds:45},{update:'missing',startSeconds:0,endSeconds:null},{update:first.id,startSeconds:-1,endSeconds:null}])assert.equal((await save('MC-0001',change)).status,400);
  assert.equal(await fs.readFile(path.join(root,'music-dictionary/music-concepts-audio.json'),'utf8'),disk);
  assert.equal((await save('MC-0001',{update:first.id,startSeconds:0,endSeconds:null})).status,200);
});
