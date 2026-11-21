const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('music-games/app.jsx','utf8'),C=require('../music-games/core'),apps=require('../shared/music-games-apps');
function route(game,search){
 const prefix=source.slice(source.indexOf('  const {'),source.indexOf('  const catalogueHref'));
 const context={React:{createContext:()=>null},window:{IGCore:C,MLHMusicGames:apps},document:{body:{dataset:{gameApp:game}}},location:{search,hash:''},URLSearchParams};
 vm.runInNewContext('this.state=(()=>{'+prefix+';return {wordPuzzlePractice,playerPage,literacyScope,hasLiteracyScope};})();',context);return context.state;
}
for(const game of ['crosswords','wordsearch'])test(`${game} uses the level's default board for old library links`,()=>{
 assert.equal(route(game,'?level=N3').wordPuzzlePractice,true);
 for(const level of C.qualificationLevels){const state=route(game,`?level=${level}&collections=1`);assert.equal(state.wordPuzzlePractice,true);assert.equal(state.playerPage,true);}
});
for(const game of ['crosswords','wordsearch'])test(`${game} opens literacy links with their explicit level scope`,()=>{
 for(const scope of ['level','cumulative']){
  const state=route(game,`?level=AH&literacy=${scope}`);
  assert.equal(state.wordPuzzlePractice,true);
  assert.equal(state.hasLiteracyScope,true);
  assert.equal(state.literacyScope,scope);
 }
 assert.equal(route(game,'?level=AH&literacy=cumulative&collections=1').hasLiteracyScope,true);
});
