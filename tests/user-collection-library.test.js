const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('music-games/app.jsx','utf8'),C=require('../music-games/core.js');
const filterCode=source.slice(source.indexOf('    const filteredActivities ='),source.indexOf('    const favouriteActivities ='))+'\nJSON.stringify(filteredActivities.map(activity=>activity.id));';
for(const template of ['group-sort','crossword','wordsearch'])test(template+' collection library shows saved collections from every level, ignoring stale search and level filters',()=>{
 const all=[{id:'saved-n3',title:'First',description:'',level:'N3',template,_stored:true},{id:'saved-ah',title:'Last',description:'',level:'AH',template,_stored:true},{id:'built-in',title:'Built-in',description:'',level:'N5',template,_stored:false}];
 for(const levelFilter of C.qualificationLevels){
  const found=JSON.parse(vm.runInNewContext(filterCode,{all,isCollectionGame:true,gameFilter:template,levelFilter,search:'no match',C}));
  assert.deepEqual(found,['saved-n3','saved-ah']);
 }
});
test('other game libraries retain their level and search filtering',()=>{
 const all=[{id:'n3',title:'First',description:'',level:'N3',template:'matching-pairs',_stored:true},{id:'ah',title:'Last',description:'',level:'AH',template:'matching-pairs',_stored:true}];
 const found=JSON.parse(vm.runInNewContext(filterCode,{all,isCollectionGame:false,gameFilter:'matching-pairs',levelFilter:'AH',search:'last',C}));
 assert.deepEqual(found,['ah']);
});
test('saved legacy word collections bypass the built-in edition restriction',()=>{
 assert.match(source,/activity\._stored \|\| !fixedGame \|\| isConceptSort \|\| window\.MLHGameCollections\.visibleInLibrary\(activity\)/);
 assert.ok(source.includes("isCollectionGame ? [{title:'My Collections',items:filteredActivities}]"));
 assert.ok(source.includes("toolbarActions={!isCollectionGame && libraryStage === 'packs' ?"));
 assert.ok(source.includes('showCollectionsMenu={!isCollectionGame}'));
});
