const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Babel = require('@babel/standalone');
const sets = require('./millionaire-custom-sets.js');
const source = Babel.transform(fs.readFileSync('whowantstobemillionaire/millionaire-media-library.jsx', 'utf8'), { presets: ['react'] }).code;
function files(fetch) {
  const context = { window: { MILLIONAIRE_CUSTOM_SETS: sets }, Blob, File, URL, fetch };
  vm.runInNewContext(source, context);
  return context.window.MillionaireMediaFiles;
}
test('Millionaire uploads enforce its existing image and audio limits', async () => {
  const api = files();
  const image = api.readFile(new File(['image'], 'photo.png', { type: 'image/png' }), 'image');
  const saved = await api.prepareMedia(image);
  assert.equal(saved.blob.size, 5);
  assert.equal(saved.type, 'image/png');
  const audio = api.readFile(new File(['audio'], 'clip.mp3'), 'audio');
  assert.equal(audio.mime, 'audio/mpeg');
  assert.throws(() => api.readFile(new File([new Uint8Array(sets.LIMITS.audioBytes + 1)], 'large.mp3'), 'audio'), /15 MB/);
  assert.throws(() => api.readFile(new File(['svg'], 'ui-icons/image.svg', { type: 'image/svg+xml' }), 'image'), /supported image/);
});
test('Commons selections become local media blobs and retain their credits', async () => {
  let requested;
  const api = files(async url => { requested = url; return { ok: true, headers: { get: () => '3' }, blob: async () => new Blob(['mp3'], { type: 'audio/mpeg' }) }; });
  const selected = await api.prepareMedia({ type: 'audio', src: 'https://upload.wikimedia.org/example.mp3', name: 'Violin', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Violin.mp3', credit: 'Player', license: 'CC0' });
  assert.equal(requested, 'https://upload.wikimedia.org/example.mp3');
  assert.equal(selected.name, 'Violin.mp3');
  assert.equal(selected.blob.size, 3);
  assert.equal(selected.credit, 'Player');
  assert.equal(selected.license, 'CC0');
});
test('Failed and oversized downloads cannot replace question media', async () => {
  const selected = { type: 'image', src: 'https://upload.wikimedia.org/photo.jpg', name: 'Photo' };
  await assert.rejects(files(async () => ({ ok: false })).prepareMedia(selected), /could not be downloaded/);
  await assert.rejects(files(async () => ({ ok: true, headers: { get: () => String(sets.LIMITS.imageBytes + 1) } })).prepareMedia(selected), /smaller than 5 MB/);
  await assert.rejects(files().prepareMedia({ ...selected, src: 'https://example.org/photo.jpg' }), /media collection/);
});
