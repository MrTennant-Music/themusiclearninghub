// Rebuild the browser photo manifest after editing its credited JSON source.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'music-concepts-photos.json'),'utf8'));
fs.writeFileSync(path.join(root,'music-concepts-photos.js'),'/* Credited photographic illustrations for Concept Companion. Source: music-concepts-photos.json. */\n(function(root){const data='+JSON.stringify(data)+';if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.MUSIC_CONCEPT_PHOTOS=data;})(typeof window!=="undefined"?window:globalThis);\n');
