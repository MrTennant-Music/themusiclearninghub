const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
const G=require('../shared/music-games-connections'),banks=require('../shared/music-games-connections-bank').banks,C=require('../music-games/core');
const S=require('../scripts/music-games-dictionary-content.cjs'),{reviews}=require('../scripts/connections-answer-review.cjs');
const allGroups=Object.values(banks).flatMap(bank=>bank.groups),keys=group=>group.answerKeys,signature=group=>keys(group).slice().sort().join('|');
const recognised=[...new Map(allGroups.map(group=>[signature(group),keys(group)])).entries()];
for(const level of G.levels)test(level+' boards reject cross-level quartets, global competing answers, categories and plausible substitutions',()=>{
 const competing=new Map(),signatures=new Set();
 for(const rule of banks[level].wholeBoardQuartets){
  assert.equal(rule.answerKeys.length,4);assert.equal(new Set(rule.answerKeys).size,4);
  const key=rule.answerKeys.join('|');assert.ok(!signatures.has(key));signatures.add(key);
  for(const id of rule.answerKeys){assert.ok(S.byId.has(id));assert.ok(S.D.levels.indexOf(S.byId.get(id).level)<=S.codes.indexOf(level));}
  const first=rule.answerKeys[0];if(!competing.has(first))competing.set(first,[]);competing.get(first).push({...rule,key});
 }
 const reviewed=new Map(banks[level].groups.map(group=>{
  assert.ok(reviews.has(group.label),'Missing review for '+group.id);
  const names=reviews.get(group.label).names;
  return [group.id,S.concepts.filter(concept=>S.D.levels.indexOf(concept.level)<=S.codes.indexOf(level)&&names.includes(concept.name)&&!group.conceptIds.some(id=>S.overlaps(concept,S.byId.get(id))))];
 }));
 for(const candidate of G.combinations(level)){
  const visible=new Set(candidate.groups.flatMap(keys)),assigned=new Set(candidate.groups.map(signature));
  assert.equal(visible.size,16);
  for(const first of visible)for(const rule of competing.get(first)||[])if(rule.answerKeys.every(id=>visible.has(id)))assert.ok(assigned.has(rule.key),level+' exposes an unassigned '+rule.label+' quartet');
  for(const [key,ids]of recognised)if(ids.every(id=>visible.has(id)))assert.ok(assigned.has(key),level+' unassigned recognised quartet');
  for(const group of candidate.groups)if(group.categoryAnswerKeys)assert.equal(group.categoryAnswerKeys.filter(id=>visible.has(id)).length,4,group.id+' has additional matching tiles');
  const concepts=candidate.groups.flatMap(group=>group.conceptIds.map(id=>S.byId.get(id)));
  for(const group of candidate.groups){
   assert.ok(group.answerKeys.every(key=>group.plausibleAnswerKeys.includes(key)));
   assert.equal(group.plausibleAnswerKeys.filter(id=>visible.has(id)).length,4,group.id+' has a plausible replacement');
   for(const alternative of reviewed.get(group.id))assert.ok(!concepts.some(concept=>S.overlaps(alternative,concept)),group.id+' also accepts '+alternative.name);
  }
 }
});
test('known rejected-but-plausible connections cannot share a board at any level',()=>{
 const unguarded=G.forBanks({banks:Object.fromEntries(Object.entries(banks).map(([level,{wholeBoardQuartets,...bank}])=>[level,{...bank,groups:bank.groups.map(({plausibleAnswerKeys,...group})=>group)}]))});
 const cases=[['N3',['pitch-movement','melody-harmony']],['N3',['scottish-dances','guitar-techniques']],['N4',['n4-opera-links','n4-vocal-backing']],['N5',['n5-jazz-links','n5-classical-links']],['H',['h-plainchant-links','h-sacred-choral']],['AH',['ah-madrigal','ah-chorale']],['AH',['ah-madrigal','ah-voice-types']],['AH',['ah-contemporary-jazz','ah-antiphonal']]];
 for(const [level,pair]of cases){
  const together=candidate=>pair.every(id=>candidate.groups.some(group=>group.id===id));
  assert.ok(unguarded.combinations(level).some(together),level+' regression must reproduce a formerly allowed board');
  assert.ok(!G.combinations(level).some(together),level+' must block competing answers');
 }
});
test('the six manually rejected N3 connections are excluded across all five levels, regardless of intended headings',()=>{
 const alternatives=[['Drum kit','Drum fill','Beat / pulse','Accent / accented'],['Acoustic guitar','Piano','Fiddle','Bagpipes'],['Drum kit','Acoustic guitar','Electric guitar','Fiddle'],['Acoustic guitar','Electric guitar','Strumming','Chord'],['Jazz','Improvisation','Piano','Solo'],['Fiddle','Bowing','Legato','Staccato']].map(names=>names.map(name=>S.concepts.find(concept=>concept.name===name).id));
 const before=G.forBanks({banks:Object.fromEntries(Object.entries(banks).map(([level,{wholeBoardQuartets,...bank}])=>[level,bank]))});
 for(const ids of alternatives){
  assert.ok(before.combinations('N3').some(candidate=>ids.every(id=>candidate.groups.some(group=>group.conceptIds.includes(id)))),'N3 regression must recreate the rejection');
  for(const level of G.levels){
   assert.ok(banks[level].wholeBoardQuartets.some(rule=>ids.every(id=>rule.answerKeys.includes(id))),level+' is missing the reviewed quartet');
   assert.ok(!G.combinations(level).some(candidate=>ids.every(id=>candidate.groups.some(group=>group.conceptIds.includes(id)))),level+' still exposes '+ids.join('/'));
  }
 }
});
test('whole-board exclusions remove cross-group alternatives at every qualification',()=>{
 const before=G.forBanks({banks:Object.fromEntries(Object.entries(banks).map(([level,{wholeBoardQuartets,...bank}])=>[level,bank]))});
 for(const level of G.levels){
  const safe=new Set(G.combinations(level).map(candidate=>candidate.id));
  assert.ok(before.combinations(level).some(candidate=>!safe.has(candidate.id)),level+' must exclude formerly permitted whole-board alternatives');
 }
});
test('saved cycles containing a newly forbidden board are replaced before another draw',()=>{
 const bank=banks.AH,bad='generated-ah-connections-2-5-h-u',cycle={version:'old-review',games:[bad,...bank.cycleSeed.slice(1)],index:1};
 const updated=G.draw('AH',cycle,C.shuffle,bad);assert.equal(updated.version,bank.version);assert.equal(updated.index,1);
 const safe=new Set(G.combinations('AH').map(candidate=>candidate.id));assert.ok(updated.games.every(id=>safe.has(id)));
 // Even a copied current version cannot make an invalid persisted board valid.
 const repaired=G.draw('AH',{...cycle,version:bank.version},C.shuffle,bad);assert.equal(repaired.index,1);assert.ok(repaired.games.every(id=>safe.has(id)));
});
test('validated cycle seeds cover every group and mixing stays varied at all five levels',()=>{
 for(const level of G.levels){
  const candidates=new Map(G.combinations(level).map(candidate=>[candidate.id,candidate]));
  const seed=banks[level].cycleSeed;assert.equal(seed.length,10);
  const groups=seed.flatMap(id=>{assert.ok(candidates.has(id));return candidates.get(id).groups.map(g=>g.id);});assert.equal(new Set(groups).size,40);
  const cycles=new Set();
  for(let run=0;run<15;run++){const plan=G.plan(level,C.shuffle);cycles.add(plan.join('|'));const ids=plan.flatMap(id=>candidates.get(id).groups.map(g=>g.id));assert.equal(ids.length,40);assert.equal(new Set(ids).size,40);}
  assert.ok(cycles.size>1);
 }
});
const source=fs.readFileSync('music-games/app.jsx','utf8'),ast=Babel.packages.parser.parse(source,{plugins:['jsx']});let nextSource;
Babel.packages.traverse.default(ast,{FunctionDeclaration(path){if(path.node.id.name==='nextConnection')nextSource=source.slice(path.node.start,path.node.end);}});
test('rapid Skip/Next requests reserve only one board, and failures release the generation lock',async()=>{
 let release,calls=0,shown=0;const waiting=new Promise(resolve=>release=resolve),noop=()=>{};
 const context={classroomSeed:null,connectionGenerating:{current:false},connectionRequest:{current:0},connectionCycle:{current:null},setConnectionConfetti:noop,practiceLevels:{N3:{}},levelFilter:'N3',selectedLevelOnly:false,setSelectedLevelOnly:noop,setError:noop,selected:null,URLSearchParams,URL,location:{search:'?level=N3',href:'https://hub.test/connections.html?level=N3'},history:{state:{},replaceState:noop},C:{shuffle:values=>values,updatePracticeState:async(key,draw)=>{calls++;await waiting;return draw(null);},sessionOptions:()=>({})},window:{MLHGameConcepts:{concepts:[]},MLHLiteracyConnections:{mix:activity=>activity},MLHConnectionsBank:{banks:{N3:{groups:[]}}},MLHConnections:{draw:()=>({index:1}),fromCycle:()=>({id:'generated-n3-connections-test',level:'N3'})}},setLevelFilter:noop,setSelected:()=>shown++,setMode:noop,setOptions:noop,setPlaying:noop,setAttempt:noop,setViewState:noop};
 vm.runInNewContext(nextSource+';this.next=nextConnection',context);
 const first=context.next(),duplicate=context.next();assert.equal(calls,1);release();await Promise.all([first,duplicate]);assert.equal(shown,1);assert.equal(context.connectionGenerating.current,false);
 context.C.updatePracticeState=async()=>{throw Error('Storage unavailable');};await context.next();assert.equal(context.connectionGenerating.current,false);assert.equal(shown,2,'in-memory fallback still shows the board');
});

test('selected-level-only Connections generates playable boards at every qualification',()=>{
 const dictionary=require('../shared/music-games-concepts');
 const conceptLevels=new Map(dictionary.concepts.map(concept=>[concept.id,concept.level]));
 for(const [rank,level] of dictionary.codes.entries()){
  const exact=G.combinations(level,true);
  assert.ok(exact.length>1,level);
  const board=G.create(level,null,values=>values,true);
  const next=G.create(level,board.id,values=>values,true);
  assert.notEqual(next.id,board.id);
  for(const activity of [board,next]){
   assert.equal(activity.items.length,16);
   assert.equal(new Set(activity.items.map(item=>item.group)).size,4);
   assert.ok(activity.sourceConceptIds.every(id=>conceptLevels.get(id)===dictionary.levels[rank]),level);
  }
 }
});
