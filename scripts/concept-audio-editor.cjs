// Loopback-only authoring service. Commons selections stream remotely; uploads remain site assets.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const audioTiming = require('../music-dictionary/music-concepts-audio-timing.js');
const { resolveSoundCloud } = require('./concept-soundcloud.cjs');
const { searchAudioSource, resolveLibraryAudio } = require('./concept-audio-sources.cjs');
const origins = new Set(['http://127.0.0.1:8765', 'http://localhost:8765']);
const MAX_BYTES = 50 * 1024 * 1024;
const plain = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim().slice(0, 500);
function browserManifest(data) {
  return '/* Curated Concept Dictionary audio. Source: music-concepts-audio.json. */\n(function(root){const data=' + JSON.stringify(data) + ';if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.MUSIC_CONCEPT_AUDIO=data;})(typeof window!=="undefined"?window:globalThis);\n';
}
function commonsTitle(source) {
  const url = new URL(source);
  if (url.protocol !== 'https:' || url.hostname !== 'commons.wikimedia.org' || url.port || url.username || url.password || !url.pathname.startsWith('/wiki/File:')) throw Error('Choose a clip from the audio library or upload an audio file.');
  return decodeURIComponent(url.pathname.slice(6)).replaceAll('_', ' ');
}
async function limitedBytes(stream, limit = MAX_BYTES) {
  const chunks = []; let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > limit) throw Error('Audio files must be 50 MB or smaller.');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
function audioFormat(bytes) {
  const starts = value => bytes.subarray(0, value.length).toString('ascii') === value;
  if (starts('RIFF') && bytes.subarray(8, 12).toString() === 'WAVE') return 'wav';
  if (starts('OggS')) return 'ogg';
  if (starts('fLaC')) return 'flac';
  if (bytes.subarray(4, 8).toString() === 'ftyp') return 'm4a';
  if (starts('ID3') || (bytes[0] === 255 && (bytes[1] & 0xe6) === 0xe2)) return 'mp3';
  if (bytes[0] === 255 && (bytes[1] & 0xf6) === 0xf0) return 'aac';
  throw Error('Choose an MP3, WAV, M4A, AAC, OGG or FLAC audio file.');
}
function uploadedAudio(media) {
  const match = /^data:audio\/(?:mpeg|mp3|wav|x-wav|wave|mp4|x-m4a|aac|ogg|flac);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(media.src || ''));
  if (!match) throw Error('Choose a supported audio file.');
  const bytes = Buffer.from(match[1], 'base64');
  if (!bytes.length || bytes.length > MAX_BYTES) throw Error('Audio files must be 50 MB or smaller.');
  return { bytes, ext: audioFormat(bytes), metadata: { name: plain(media.name) || 'Audio example' } };
}
function commonsAudioInfo(info, title) {
  if (info?.mediatype !== 'AUDIO') throw Error('Choose an audio clip from the library.');
  const src = info.derivatives?.find(item => item.type?.startsWith('audio/mpeg'))?.src || info.url;
  const url = new URL(src);
  if (url.protocol !== 'https:' || url.hostname !== 'upload.wikimedia.org' || url.port || url.username || url.password) throw Error('Unsupported audio source.');
  const meta = info.extmetadata || {};
  return { metadata: {
    name: title.slice(5).replace(/\.[^.]+$/, ''), sourceUrl: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(title).replace(/%3A/g, ':'),
    credit: plain(meta.Artist?.value || meta.Credit?.value) || 'Unknown author', license: plain(meta.LicenseShortName?.value) || 'Source details',
    src: url.href
  } };
}
async function resolveCommonsAudio(source) {
  const title = commonsTitle(source);
  const api = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', redirects: '1', titles: title, prop: 'videoinfo', viprop: 'url|mime|mediatype|derivatives|extmetadata' });
  const response = await fetch(api, { headers: { 'User-Agent': 'MusicLearningHub-AudioEditor/1.0' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error('The audio source is unavailable. Please try again.');
  const data = await response.json(), page = data.query?.pages?.[0];
  return commonsAudioInfo(page?.videoinfo?.[0], page?.title || title);
}
async function downloadAudio(source, media) {
  if (new URL(source).hostname === 'commons.wikimedia.org') return resolveCommonsAudio(source);
  const audio = await resolveLibraryAudio(source, media);
  return { ...audio, ext: audioFormat(audio.bytes) };
}
function createAudioServer({ projectRoot = root, resolveAudio = downloadAudio, conceptIds = require('../music-dictionary/music-concepts-data.js').concepts.map(c => c.id) } = {}) {
  const known = new Set(conceptIds), manifestPath = path.join(projectRoot, 'music-dictionary/music-concepts-audio.json');
  let saving = Promise.resolve();
  const read = async () => { try { return JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return { concepts: {} }; throw error; } };
  return http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
    const send = (status, data) => { res.writeHead(status, headers); res.end(JSON.stringify(data)); };
    if (origin && !origins.has(origin)) return send(403, { error: 'Local editor access only.' });
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    try {
      if (req.method === 'OPTIONS') return send(204, {});
      const requestUrl = new URL(req.url, 'http://127.0.0.1:8766');
      if (req.method === 'GET' && requestUrl.pathname === '/audio/preview') {
        const audio = await downloadAudio(requestUrl.searchParams.get('sourceUrl'), { sourceFile: requestUrl.searchParams.get('sourceFile') });
        if (!audio.bytes && audio.metadata?.src) { res.writeHead(302, { ...headers, Location: audio.metadata.src }); return res.end(); }
        const mime = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', m4a: 'audio/mp4', aac: 'audio/aac' }[audio.ext];
        res.writeHead(200, { ...headers, 'Content-Type': mime, 'Content-Length': audio.bytes.length });
        return res.end(audio.bytes);
      }
      if (req.method === 'GET' && requestUrl.pathname === '/audio/search') return send(200, await searchAudioSource(requestUrl.searchParams.get('source'), requestUrl.searchParams.get('q'), requestUrl.searchParams.get('offset')));
      if (req.method === 'GET' && req.url === '/audio') return send(200, await read());
      const match = /^\/audio\/(MC-\d{4})$/.exec(req.url);
      if (req.method !== 'POST' || !match) return send(404, { error: 'Not found.' });
      if (!origin || req.headers['content-type'] !== 'application/json') return send(403, { error: 'Save audio from Concept Dictionary.' });
      const id = match[1];
      if (!known.has(id)) return send(404, { error: 'Unknown concept.' });
      const body = JSON.parse((await limitedBytes(req, Math.ceil(MAX_BYTES * 4 / 3) + 20000)).toString('utf8'));
      const removing = typeof body.remove === 'string';
      const updating = typeof body.update === 'string';
      const section = updating ? audioTiming.normalize(body.startSeconds, body.endSeconds ?? null) : null;
      let chosen;
      if (!removing && !updating) {
        if (body.media?.type !== 'audio') throw Error('Choose an audio clip.');
        chosen = body.media.provider === 'soundcloud' ? { metadata: await resolveSoundCloud(body.media.sourceUrl) } : body.media.src?.startsWith('data:') ? uploadedAudio(body.media) : await resolveAudio(body.media.sourceUrl, body.media);
        chosen.metadata.name = plain(body.media.name) || chosen.metadata.name;
      }
      const save = async () => {
        const manifest = await read(), clips = manifest.concepts[id] || [];
        let clip;
        if (updating) {
          const index = clips.findIndex(item => item.id === body.update);
          if (index < 0) throw Error('This example is no longer saved. Refresh the page.');
          clip = { ...clips[index], ...section };
          manifest.concepts[id] = clips.map((item, i) => i === index ? clip : item);
        } else if (removing) {
          if (!clips.some(item => item.id === body.remove)) throw Error('This example is no longer saved. Refresh the page.');
          manifest.concepts[id] = clips.filter(item => item.id !== body.remove);
        } else {
          const hash = createHash('sha256').update(chosen.bytes || (chosen.metadata.src ? 'remote:' : 'soundcloud:') + chosen.metadata.sourceUrl).digest('hex').slice(0, 20);
          clip = clips.find(item => item.id === hash || chosen.metadata.src && item.sourceUrl === chosen.metadata.sourceUrl);
          if (!clip) {
            let localSource;
            if (chosen.bytes) {
            const filename = id.toLowerCase() + '-' + hash + '.' + chosen.ext;
            await fs.mkdir(path.join(projectRoot, 'music-dictionary/concept-audio'), { recursive: true });
            await fs.writeFile(path.join(projectRoot, 'music-dictionary/concept-audio', filename), chosen.bytes);
            localSource = './music-dictionary/concept-audio/' + filename;
            }
            clip = { id: hash, ...chosen.metadata, ...(localSource ? { src: localSource } : {}) };
            manifest.concepts[id] = [...clips, clip];
          }
        }
        await fs.writeFile(manifestPath + '.tmp', JSON.stringify(manifest, null, 2) + '\n');
        await fs.rename(manifestPath + '.tmp', manifestPath);
        const browserPath = path.join(projectRoot, 'music-dictionary/music-concepts-audio.js');
        await fs.writeFile(browserPath + '.tmp', browserManifest(manifest)); await fs.rename(browserPath + '.tmp', browserPath);
        return { clips: manifest.concepts[id], clip };
      };
      const job = saving.then(save); saving = job.catch(() => {});
      send(200, await job);
    } catch (error) { send(400, { error: error.message || 'The audio could not be saved.' }); }
  });
}
if (require.main === module) createAudioServer().listen(8766, '127.0.0.1', () => console.log('Concept Dictionary audio editor ready on 127.0.0.1:8766'));
module.exports = { createAudioServer, browserManifest, commonsTitle, uploadedAudio, downloadAudio, resolveCommonsAudio, commonsAudioInfo };
