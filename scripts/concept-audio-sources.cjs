/* Additional libraries for the local Music Dictionary audio editor. */
const https = require('node:https');
const { searchSoundCloud } = require('./concept-soundcloud.cjs');
const MAX_BYTES = 50 * 1024 * 1024;
const plain = value => String(Array.isArray(value) ? value.join(', ') : value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 500);
const licence = value => {
  for (const item of [value].flat()) {
    const match = /^https?:\/\/(?:www\.)?creativecommons\.org\/(licenses\/(by(?:-nc)?(?:-sa|-nd)?|by-sa|by-nd)\/([\d.]+)|publicdomain\/(zero|mark)\/([\d.]+))\/?$/i.exec(String(item || ''));
    if (match) return { license: match[4] ? (match[4] === 'zero' ? 'CC0' : 'Public Domain Mark') : 'CC ' + match[2].toUpperCase() + ' ' + match[3], licenseUrl: String(item).replace(/^http:/, 'https:') };
  }
  return null;
};
async function json(url, signal) {
  // ccMixter duplicates its JSON body in a large X-JSON response header.
  if (new URL(url).hostname === 'ccmixter.org') return new Promise((resolve, reject) => {
    const request = https.get(url, { maxHeaderSize: 1024 * 1024, signal, headers: { 'User-Agent': 'MusicLearningHub-AudioEditor/1.0' } }, response => {
      if (response.statusCode !== 200) { response.resume(); return reject(Error('ccMixter is unavailable. Please try again.')); }
      const chunks = []; let size = 0;
      response.on('data', chunk => { size += chunk.length; if (size > 5 * 1024 * 1024) request.destroy(Error('The audio library response is too large. Try a more specific search.')); else chunks.push(chunk); });
      response.on('error', reject);
      response.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (_) { reject(Error('ccMixter returned an unexpected response.')); } });
    });
    const timer = setTimeout(() => request.destroy(Error('ccMixter took too long to respond. Please try again.')), 25000);
    request.on('error', reject); request.on('close', () => clearTimeout(timer));
  });
  const response = await fetch(url, { signal: signal || AbortSignal.timeout(25000), headers: { 'User-Agent': 'MusicLearningHub-AudioEditor/1.0' } });
  if (!response.ok) throw Error('This audio library is unavailable. Please try again.');
  return response.json();
}
function mixterItems(rows) {
  return rows.flatMap(row => {
    const rights = licence(row.license_url);
    if (!rights || row.upload_extra?.nsfw) return [];
    return (row.files || []).filter(file => /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.file_name) && Number(file.file_rawsize) > 0 && Number(file.file_rawsize) <= MAX_BYTES && /^https:\/\/ccmixter\.org\/content\//.test(file.download_url)).map(file => ({ id: 'ccmixter-' + file.file_id, media: { type: 'audio', src: file.download_url, name: plain(row.upload_name) + ((row.files || []).length > 1 ? ' — ' + plain(file.file_nicname && !/^(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.file_nicname) ? file.file_nicname : file.file_name.replace(/\.[^.]+$/, '').replaceAll('_', ' ')) : ''), sourceUrl: row.file_page_url, sourceFile: String(file.file_id), credit: plain(row.user_real_name || row.user_name), ...rights } }));
  });
}
async function archiveItems(identifier, limit = 3) {
  if (!/^[A-Za-z0-9_.-]+$/.test(identifier)) return [];
  const data = await json('https://archive.org/metadata/' + encodeURIComponent(identifier));
  const meta = data.metadata || {}, rights = licence(meta.licenseurl);
  if (!rights || meta.mediatype !== 'audio' || data.is_dark || [true, 'true'].includes(meta['access-restricted-item'])) return [];
  return (data.files || []).filter(file => /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name) && !file.private && Number(file.size) > 0 && Number(file.size) <= MAX_BYTES).filter((file, index, files) => !files.slice(0, index).some(other => other.name.replace(/\.[^.]+$/, '') === file.name.replace(/\.[^.]+$/, ''))).slice(0, limit).map(file => ({ id: 'archive-' + identifier + '/' + file.name, media: { type: 'audio', src: 'https://archive.org/download/' + encodeURIComponent(identifier) + '/' + file.name.split('/').map(encodeURIComponent).join('/'), sourceUrl: 'https://archive.org/details/' + encodeURIComponent(identifier), sourceFile: file.name, name: plain(file.title || meta.title || file.name), credit: plain(meta.creator) || 'See source details', ...rights } }));
}
async function searchAudioSource(source, query, offset = 0) {
  if (source === 'soundcloud') return searchSoundCloud(query, offset);
  const term = plain(query).slice(0, 150);
  offset = Math.max(0, Math.min(10000, Number(offset) || 0));
  if (source === 'ccmixter') {
    const rows = await json('https://ccmixter.org/api/query?' + new URLSearchParams({ f: 'json', search: term, search_type: 'all', limit: '24', offset: String(offset) }));
    if (!Array.isArray(rows)) throw Error('ccMixter returned an unexpected response.');
    return { images: mixterItems(rows), nextOffset: rows.length === 24 ? offset + 24 : null };
  }
  if (source === 'archive') {
    const words = term.match(/[\p{L}\p{N}]+/gu) || [];
    if (!words.length) return { images: [], nextOffset: null };
    const data = await json('https://archive.org/advancedsearch.php?' + new URLSearchParams({ q: 'mediatype:audio AND licenseurl:* AND (' + words.map(word => '"' + word + '"').join(' AND ') + ')', output: 'json', rows: '8', start: String(offset), 'fl[]': 'identifier' }));
    const docs = data.response?.docs || [];
    const items = await Promise.allSettled(docs.map(doc => archiveItems(doc.identifier)));
    const images = items.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    if (docs.length && items.every(result => result.status === 'rejected')) throw Error('Internet Archive is unavailable. Please try again.');
    return { images, nextOffset: offset + docs.length < data.response.numFound ? offset + docs.length : null };
  }
  throw Error('Choose a supported audio library.');
}
function permittedAudioUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !(url.hostname === 'ccmixter.org' && url.pathname.startsWith('/content/') || url.hostname === 'archive.org' && url.pathname.startsWith('/download/') || /^(?:ia|dn)\d+\.(?:us|eu|ca)\.archive\.org$/.test(url.hostname))) throw Error('Unsupported audio download.');
  return url;
}
async function resolveLibraryAudio(source, media = {}) {
  const url = new URL(source);
  if (url.protocol !== 'https:' || url.port || url.username || url.password) throw Error('Choose audio from a supported library.');
  let items;
  const mixter = url.hostname === 'ccmixter.org' && /^\/files\/[^/]+\/(\d+)$/.exec(url.pathname);
  const archive = url.hostname === 'archive.org' && /^\/details\/([A-Za-z0-9_.-]+)$/.exec(url.pathname);
  if (mixter) items = mixterItems(await json('https://ccmixter.org/api/query?' + new URLSearchParams({ f: 'json', ids: mixter[1] })));
  else if (archive) items = await archiveItems(archive[1], Infinity);
  else throw Error('Choose audio from a supported library.');
  const chosen = items.find(item => item.media.sourceFile === media.sourceFile && item.media.sourceUrl === source)?.media;
  if (!chosen) throw Error('This audio file or its reuse licence could not be confirmed. Please choose another.');
  let download = permittedAudioUrl(chosen.src), response;
  for (let redirects = 0; redirects <= 5; redirects++) {
    response = await fetch(download, { redirect: 'manual', signal: AbortSignal.timeout(60000), headers: download.hostname === 'ccmixter.org' ? { Referer: chosen.sourceUrl } : {} });
    if (![301,302,303,307,308].includes(response.status)) break;
    const next = response.headers.get('location'); await response.body?.cancel();
    if (!next || redirects === 5) throw Error('This audio download could not be followed.');
    download = permittedAudioUrl(new URL(next, download).href);
  }
  if (!response.ok) throw Error('This clip could not be downloaded. Please try another.');
  if (Number(response.headers.get('content-length')) > MAX_BYTES) { await response.body.cancel(); throw Error('Audio files must be 50 MB or smaller.'); }
  const chunks = []; let length = 0;
  for await (const chunk of response.body) { length += chunk.length; if (length > MAX_BYTES) { await response.body.cancel().catch(() => {}); throw Error('Audio files must be 50 MB or smaller.'); } chunks.push(chunk); }
  const { src, sourceFile, type, ...metadata } = chosen;
  return { bytes: Buffer.concat(chunks), metadata };
}
module.exports = { searchAudioSource, resolveLibraryAudio, licence, permittedAudioUrl };
