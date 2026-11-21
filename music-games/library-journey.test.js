const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const Babel = require('@babel/standalone');
const Core = require('./core.js');
const source = fs.readFileSync('music-games/app.jsx','utf8');
const hooked = source.replace(/  ReactDOM\.createRoot\(document\.getElementById\('root'\)\)\.render\(<Boundary><App \/><\/Boundary>\);\s*\}\)\(\);\s*$/, '  window.TestGroupTopics = groupTopics; window.TestJourney = LibraryJourney; window.TestCard = ActivityCard; window.TestReadFavourites = readFavouriteIds; window.TestToggleFavourite = toggleFavouriteId;\n})();');
assert.notEqual(hooked,source);
const window = {IGCore:Core,MLH:{ToolbarButtonClass:'shared-toolbar-button'}};
vm.runInNewContext(Babel.transform(hooked,{presets:['react']}).code,{React,window,document:{body:{dataset:{igPage:'library'}}},location:{search:''}});
function nodes(node,predicate){
 if(Array.isArray(node))return node.flatMap(child=>nodes(child,predicate));
 if(!node || typeof node!=='object')return [];
 if(typeof node.type==='function'&&['JourneyPath','NavigationBackButton'].includes(node.type.name))return nodes(node.type(node.props),predicate);
 return [...(predicate(node)?[node]:[]),...nodes(node.props?.children,predicate)];
}
test('legacy library journey offers the four retained game choices',()=>{
 let game,level,stage;
 const props={game:'',level:'',stage:'levels',onGame:id=>game=id,onLevel:id=>level=id,onStage:id=>stage=id};
 const entry=window.TestJourney(props);
 assert.equal(nodes(entry,n=>n.type==='h2')[0].props.children,'Choose a Level');
 assert.equal(nodes(entry,n=>n.props?.className==='ig-game-choice').length,0);
 const picker=nodes(entry,n=>typeof n.type==='function'&&n.type.name==='LibraryLevelPicker')[0];
 picker.props.onLevel('N5');assert.equal(level,'N5');
 const games=window.TestJourney({...props,level,stage:'games'});
 const choices=nodes(games,n=>n.props?.className==='ig-game-choice');
 assert.equal(choices.length,4);
 assert.deepEqual(choices.map(n=>nodes(n,c=>c.type==='strong')[0].props.children),['Connections','Crossword','Sort','Word Search']);
 const showAll=nodes(games,n=>n.type==='a'&&n.props.className==='ig-show-all-games')[0];
 assert.equal(showAll.props.href,'./conceptsort.html?level=N5&game=all');
 let prevented=false;game='quiz';showAll.props.onClick({ctrlKey:true,preventDefault(){prevented=true;}});assert.equal(prevented,false);assert.equal(game,'quiz');
 showAll.props.onClick({preventDefault(){}});assert.equal(game,'');
 choices[2].props.onClick();assert.equal(game,'group-sort');
 const packs=window.TestJourney({...props,game,level,stage:'packs'});
 assert.equal(nodes(packs,n=>n.type==='h2')[0].props.children,'Choose a Collection');
 const back=nodes(packs,n=>n.type==='button')[0];assert.equal(back.props['aria-label'],'Back to games');back.props.onClick();assert.equal(stage,'games');assert.equal(nodes(packs,n=>typeof n.type==='function'&&n.type.name==='LibraryLevelPicker').length,0);
 assert.equal(nodes(packs,n=>n.props?.className==='ig-game-choice').length,0);
});
test('retained activity packs stay compatible and relocated Sort and Order packs remain retired',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));
 for(const type of Core.TEMPLATES){
  const packs=index.filter(pack=>pack.template===type.id);
  if(['matching-pairs','labelled-diagram','crossword','wordsearch'].includes(type.id))assert.ok(packs.length,`${type.name} retains its content`);
  else assert.equal(packs.length,0,`${type.name} has no built-in content`);
  for(const pack of packs){
   assert.ok(Core.qualificationLevels.includes(pack.level),pack.id);
   const activity=JSON.parse(fs.readFileSync(`music-games/activities/${pack.id}.json`,'utf8'));
   assert.equal(Core.compatibility(type.id,activity).ok,true,pack.id);
  }
 }
});

test('favourites toggle, survive reload and tolerate damaged stored data',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 let ids=window.TestReadFavourites(storage);
 ids=window.TestToggleFavourite(ids,'activity-one');storage.setItem('ig-favourites',JSON.stringify(ids));
 assert.equal(JSON.stringify(window.TestReadFavourites(storage)),'["activity-one"]');
 ids=window.TestToggleFavourite(window.TestReadFavourites(storage),'activity-one');
 storage.setItem('ig-favourites',JSON.stringify(ids));assert.equal(window.TestReadFavourites(storage).length,0);
 storage.setItem('ig-favourites','{bad json');assert.equal(window.TestReadFavourites(storage).length,0);
 storage.setItem('ig-favourites','["a","a",null,3]');assert.equal(JSON.stringify(window.TestReadFavourites(storage)),'["a"]');
});
test('cards offer a favourite star and favourites appear only on the game screen',()=>{
 const activity={id:'sample',title:'Instruments',template:'quiz',level:'N3'};let selected;
 const card=window.TestCard({activity,favourite:false,onFavourite:id=>selected=id});
 const star=nodes(card,n=>n.props?.className==='ig-activity-favourite')[0];
 assert.equal(star.props['aria-pressed'],false);star.props.onClick();assert.equal(selected,'sample');
 assert.equal(nodes(card,n=>n.props?.className==='ig-activity-more'||n.props?.role==='menu').length,0);
 const active=window.TestCard({activity,favourite:true});assert.equal(nodes(active,n=>n.props?.className==='ig-activity-favourite')[0].props['aria-pressed'],true);
 const props={game:'',level:'N3',stage:'games',favourites:card};
 assert.equal(nodes(window.TestJourney(props),n=>n.props?.className==='ig-library-favourites').length,1);
 assert.equal(nodes(window.TestJourney({...props,stage:'packs'}),n=>n.props?.className==='ig-library-favourites').length,0);
});


test('topic groups retain all activities in clear categories',()=>{
 const activities=[{id:'a',title:'Music Literacy'},{id:'b',title:'Reading Music 2'},{id:'c',title:'Parts of the Guitar'},{id:'d',title:'Piano Keys'},{id:'e',title:'Baroque 2'},{id:'f',title:'Melody/harmony'}];
 const groups=window.TestGroupTopics(activities);
 assert.deepEqual(Array.from(groups,g=>g.title),['Music Literacy','Music Concepts','Styles and Periods','Instruments']);
 assert.deepEqual(Array.from(groups.find(g=>g.title==='Instruments').items,a=>a.id),['c','d']);
 assert.equal(groups.reduce((total,g)=>total+g.items.length,0),activities.length);
});
