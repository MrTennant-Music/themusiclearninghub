/* Prepare small library metadata and deferred browser bundles. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Babel = require('@babel/standalone');
const core = require('../music-games/core.js');
// Replace complete generated assets at once so an open app cannot cache a partial file.
function writeAtomic(file,data){const temporary=file+'.building';fs.writeFileSync(temporary,data);fs.renameSync(temporary,file);}
const ROOT = path.resolve(__dirname, '..');
const dataDir = path.join(ROOT, 'music-games/activities');
const runtimeDir = path.join(ROOT, 'music-games/runtime');
const hash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 12);
const compile = file => Babel.transform(fs.readFileSync(path.join(ROOT, file), 'utf8'), { presets: ['react'], comments: false, compact: true, filename: file }).code;
async function build() {
  require('./build-music-games-collections.cjs').build();
  require('./build-national3-connections.cjs').build();
  require('./build-music-games-concept-list.cjs').build();
  fs.mkdirSync(runtimeDir, { recursive: true });
  const activityFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file !== 'index.json').sort();
  const index = [];
  const retiredSorts=new Set(require('./concept-sort-retired-collections.json'));
  const content=require('./music-games-dictionary-content.cjs');
  for (const file of activityFiles) {
    if(retiredSorts.has(file.slice(0,-5))){for(const ext of ['.json','.js']){const retired=path.join(dataDir,file.slice(0,-5)+ext);if(fs.existsSync(retired))fs.unlinkSync(retired);}continue;}
    const activity = require('./music-games-excluded-concepts.cjs').filterActivity(JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8')));
    if(['type-the-answer','match-up','quiz','true-or-false','complete-the-sentence'].includes(activity.template)||['labelled-diagram','rank-order'].includes(activity.template)&&activity.tags?.includes('Music Literacy')){for(const ext of ['.json','.js']){const retired=path.join(dataDir,activity.id+ext);if(fs.existsSync(retired))fs.unlinkSync(retired);}continue;}
    writeAtomic(path.join(dataDir,file),JSON.stringify(activity,null,2)+'\n');
    if (activity.template==='rank-order'||!core.isHubLibraryTemplate(activity.template)) continue;
    const { id, title, description, level, template, folder, tags, revision, updatedAt, specialMode } = activity;
    const serialized = JSON.stringify(activity);
    writeAtomic(path.join(dataDir, id + '.js'), 'window.IGRuntime.registerActivity(' + serialized.replace(/(?:\d|\))\s*(?:vw|dvw|vmin|vmax)\b/gi, match => match.replace(/[vV]/g, letter => letter === 'v' ? '\\u0076' : '\\u0056')) + ');\n');
    let diagramKey = '';
    if (activity.diagram?.src) { let fingerprint = 2166136261; for (let i = 0; i < activity.diagram.src.length; i++) fingerprint = Math.imul(fingerprint ^ activity.diagram.src.charCodeAt(i), 16777619); diagramKey = activity.diagram.src.length + ':' + (fingerprint >>> 0); }
    index.push({ id, title, description, level, template, folder, tags, revision, updatedAt, ...(specialMode?{specialMode}:{}), ...(activity.collectionId?{collectionId:activity.collectionId,sourceConceptIds:activity.sourceConceptIds}:{}), ...(activity.collectionEdition?{collectionEdition:activity.collectionEdition}:{}), ...(content.legacyDefinitionPack(activity)||activity.template==='labelled-diagram'?{catalogueHidden:true}:{}), diagramKey, itemCount: activity.items.length, _builtin: true, file: './music-games/activities/' + id + '.js?v=' + hash(serialized) });
  }
  writeAtomic(path.join(dataDir, 'index.json'), JSON.stringify(index, null, 2) + '\n');
  const files = {};
  for (const name of ['art', 'silhouettes', 'media', 'image-bank', 'diagram', 'learning', 'arcade', 'session', 'app']) {
    const source = name === 'app' ? 'music-games/app.jsx' : 'music-games/' + name + '.jsx';
    const code = compile(source);
    const file = name + '.js';
    writeAtomic(path.join(runtimeDir, file), code + '\n');
    files[name] = './music-games/runtime/' + file + '?v=' + hash(code);
  }
  // Plain shared scripts must be versioned too, so deferred players never
  // combine a new bundle with a cached older dependency.
  for (const name of ['diagram-core', 'sounds', 'timer', 'level-test-core']) {
    const file = 'music-games/' + name + '.js';
    files[name] = './' + file + '?v=' + hash(fs.readFileSync(path.join(ROOT, file)));
  }
  writeAtomic(path.join(runtimeDir, 'index.js'), 'window.IGActivityIndex=' + JSON.stringify(index) + ';\nwindow.IGRuntimeFiles=' + JSON.stringify(files) + ';\n');
  require('./build-music-games-pages.cjs').build();
  console.log(`Prepared ${index.length} activity files; library index ${fs.statSync(path.join(runtimeDir, 'index.js')).size.toLocaleString()} bytes.`);
}
if (require.main === module) build().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { build };
