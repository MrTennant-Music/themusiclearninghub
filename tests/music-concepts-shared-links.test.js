const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const D=require('../music-dictionary/music-concepts-data.js');
const source=fs.readFileSync('music-dictionary/music-concepts.js','utf8');
const context={D,URLSearchParams,quizApp:false,quizPage:'./conceptquiz.html',params:new URLSearchParams(),escapeEmbed:false,collectionsReturn:null};
vm.runInNewContext(source.slice(source.indexOf("const keys="),source.indexOf('const revisionGroups='))+source.slice(source.indexOf('function detailUrl('),source.indexOf('function normal('))+';this.link=detailUrl;',context);
const concept=id=>D.concepts.find(c=>c.id===id);
test('concepts repeated in different columns retain separate category destinations',()=>{
 for(const id of ['MC-0010','MC-0017','MC-0225']){
  const urls=[null,0,1,2,3,4].map(column=>context.link(concept(id),'',false,false,'N5',[],column));
  assert.equal(new Set(urls).size,6,id);
 }
});
test('duplicate Octave and Subject entries retain their own qualification page',()=>{
 for(const [alias,target]of [['MC-0296','MC-0255']]){
  assert.notEqual(context.link(concept(alias)),context.link(concept(target)));
  assert.ok(context.link(concept(alias)).includes('concept='+alias));
 }
});
test('ordinary concept links retain navigation and revision context',()=>{
 const url=new URL(context.link(concept('MC-0195'),'bassoon',true,true,'H',['often'],4,'woodwind','N5'),'https://example.test/');
 assert.equal(url.searchParams.get('concept'),'MC-0195');assert.equal(url.searchParams.get('column'),'4');
 assert.equal(url.searchParams.get('q'),'bassoon');assert.equal(url.searchParams.get('group'),'woodwind');assert.equal(url.searchParams.get('revision'),'N5');
});

test('Dictionary links keep the originating Hub collection on related concepts',()=>{
 const returnTo='/mycollections.html?level=N3&hubCollection=articulation';
 const previous=context.collectionsReturn;
 try{
  context.collectionsReturn=returnTo;
  const url=new URL(context.link(concept('MC-0021')),'https://example.test/');
  assert.equal(url.searchParams.get('collectionsReturn'),returnTo);
 }finally{
  context.collectionsReturn=previous;
 }
});

test('returning to the referring collection uses history even if query order differs',()=>{
 const origins=[
  ['https://hub.test/mycollections.html?hubCollection=articulation&level=N3','back'],
  ['https://hub.test/music-dictionary/musicdictionaryconcept.html?concept=MC-0021','assign'],
 ];
 const start=source.indexOf('function returnToCollection()');
 const end=source.indexOf('const escapeEmbed=',start);
 for(const [referrer,action] of origins){
  const calls=[],baseURI='https://hub.test/';
  vm.runInNewContext(source.slice(start,end)+';returnToCollection();',{
   URL,URLSearchParams,document:{baseURI,referrer},
   collectionsReturn:'/mycollections.html?level=N3&hubCollection=articulation',
   history:{back:()=>calls.push('back')},
   location:{assign:url=>calls.push('assign',url)},
  });
  assert.deepEqual(calls,action==='back'?['back']:['assign',baseURI+'mycollections.html?level=N3&hubCollection=articulation']);
 }
});

test('collection preview context follows a concept link without changing its identity',()=>{
 const collection={id:'advanced-higher-styles',label:'Advanced Higher Styles',level:'ALL',tableLevel:'AH',conceptIds:['MC-0274']};
 const url=new URL(context.link(concept('MC-0274'),'',true,false,'AH',[],0,'','AH',collection),'https://example.test/');
 assert.equal(url.searchParams.get('concept'),'MC-0274');assert.equal(url.searchParams.get('all'),'1');assert.deepEqual(JSON.parse(url.searchParams.get('collection')),collection);
});


test('standalone custom builder context follows Dictionary links and returns to the same selection',()=>{
 const returnTo='./conceptquiz.html?level=N3&create=1&selection='+encodeURIComponent(JSON.stringify(['MC-0001','MC-0002']))+'&name=Class';
 const url=new URL(context.link(concept('MC-0001'),'',false,false,'N5',[],0,'','N3',null,returnTo),'https://example.test/');
 assert.equal(url.searchParams.get('quizReturn'),returnTo);
});
