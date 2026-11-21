const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const L=require('../shared/music-games-literacy-connections'),C=require('../music-games/core'),Babel=require('@babel/standalone');
for(const level of Object.keys(L.groups))test(`${level} literacy Connections contains four distinct quartets and survives sharing`,()=>{
 const board=L.create(level);
 assert.equal(board.level,level);assert.equal(board.items.length,16);
 assert.equal(new Set(board.items.map(item=>item.answer.toLowerCase())).size,16);
 assert.equal(new Set(board.items.map(item=>item.group)).size,4);
 for(const [group,names]of L.groups[level])assert.deepEqual(board.items.filter(item=>item.group===group).map(item=>item.answer),names);
 assert.deepEqual(C.validateActivity(board),[]);assert.equal(C.compatibility('matching-pairs',board).ok,true);
 const restored=C.normalizeImport(C.exportActivity(board))[0];assert.deepEqual(restored.items,board.items);
});
test('National 5 has the requested four key signatures; removed words remain absent',()=>{
 assert.deepEqual(L.groups.N5[0][1],['C major','G major','F major','A minor']);
 assert.deepEqual(L.groups.AH[0][1],['D major','B flat major','E minor','D minor']);
 for(const level of ['H','AH'])assert(!L.create(level).items.some(item=>/^Chord (one|two|four|five|six)$|^Ottava /.test(item.answer)));
});
test('all levels mix literacy into concept boards without duplicate or extra authored quartets',()=>{
 const Conn=require('../shared/music-games-connections'),D=require('../shared/music-games-concepts'),B=require('../shared/music-games-connections-bank'),names=new Map(D.concepts.map(c=>[c.id,c.name]));
 for(const level of Conn.levels){const reviewed=B.banks[level].groups.map(g=>g.conceptIds.map(id=>names.get(id)));for(const candidate of C.shuffle(Conn.combinations(level)).slice(0,100)){
 const a=L.mix(Conn.make(candidate,level),C.shuffle,reviewed);assert.equal(a.items.length,16);assert.equal(new Set(a.items.map(i=>C.canonical(i.answer))).size,16);assert.equal(new Set(a.items.map(i=>i.group)).size,4);assert(a.tags.includes('generated-connections'));assert(a.tags.includes('mixed-connections'));
 const literacyIds=new Set(L.create(level).items.map(item=>item.id));assert.equal(a.items.filter(item=>literacyIds.has(item.id)).length,4);assert.deepEqual(C.validateActivity(a),[]);assert.equal(C.compatibility('matching-pairs',a).ok,true);
 const keys=new Set(a.items.map(i=>C.canonical(i.answer)));for(const quartet of [...reviewed,...L.groups[level].map(([,words])=>words)])if(quartet.every(word=>keys.has(C.canonical(word))))assert(a.items.filter(i=>quartet.map(C.canonical).includes(C.canonical(i.answer))).every((item,_,rows)=>item.group===rows[0].group));
 }}
});
test('Connections has no concepts/literacy selector and ignores the former literacy-only route',async()=>{
 const source=fs.readFileSync('music-games/app.jsx','utf8'),ast=Babel.packages.parser.parse(source,{plugins:['jsx']});let nextSource;
 Babel.packages.traverse.default(ast,{FunctionDeclaration(path){if(path.node.id.name==='nextConnection')nextSource=source.slice(path.node.start,path.node.end);}});
 assert(!source.includes("title: 'Music Concepts'"));assert(!source.includes("title: 'Music Literacy'"));
 const Conn=require('../shared/music-games-connections'),D=require('../shared/music-games-concepts'),B=require('../shared/music-games-connections-bank');let shown,url,draws=0;const noop=()=>{};
 const context={connectionGenerating:{current:false},connectionRequest:{current:0},connectionCycle:{current:null},setConnectionConfetti:noop,practiceLevels:{N5:{}},levelFilter:'N5',setError:error=>{if(error)assert.fail(error);},selected:null,URLSearchParams,URL,location:{search:'?level=N5&collection=literacy',href:'https://hub.test/connections.html?level=N5&collection=literacy'},history:{state:{},replaceState:(state,title,next)=>url=next},C:{shuffle:C.shuffle,sessionOptions:()=>({}),updatePracticeState:async(key,draw)=>draw(null)},window:{MLHLiteracyConnections:L,MLHGameConcepts:D,MLHConnectionsBank:B,MLHConnections:{draw:()=>{draws++;return {};},fromCycle:()=>Conn.create('N5',null,C.shuffle)}},setLevelFilter:noop,setSelected:a=>shown=a,setMode:noop,setOptions:noop,setPlaying:noop,setAttempt:noop,setViewState:noop};
 context.selectedLevelOnly = false;
 context.setSelectedLevelOnly = noop;
 vm.runInNewContext(nextSource+';this.next=nextConnection',context);await context.next();assert.equal(draws,1);assert(shown.tags.includes('mixed-connections'));assert.equal(new URL(url).searchParams.has('collection'),false);
});
