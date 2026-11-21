const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../shared/music-games-collections'),C=require('../music-games/core');
test('Concept Sort starts with no built-in collections or All generator at every level',()=>{
 const index=require('../music-games/activities/index.json');
 for(const level of G.data.codes)assert.equal(index.filter(a=>a.level===level&&a.template==='group-sort').length,0,level);
 assert.equal(G.randomSort,undefined);
 for(const id of require('../scripts/concept-sort-retired-collections.json')){
  assert.equal(fs.existsSync('music-games/activities/'+id+'.json'),false,id);
  assert.equal(fs.existsSync('music-games/activities/'+id+'.js'),false,id);
 }
});
test('custom Sort validates group membership, size and names, and survives sharing',()=>{
 const ids=G.eligible('N3','group-sort').slice(0,61).map(c=>c.id),groups=['A','B'];const assignments=Object.fromEntries(ids.map((id,i)=>[id,i%2]));
 const make=(patch={})=>G.make({name:'My Sort',level:'N3',template:'group-sort',ids:ids.slice(0,8),groups,assignments,...patch});
 const a=make();assert.equal(C.compatibility('group-sort',a).ok,true);assert.equal(a.collectionEdition,G.collectionEdition);assert.deepEqual(C.normalizeImport(C.exportActivity(a))[0].items,a.items);
 for(const count of [1,61])assert.throws(()=>make({ids:ids.slice(0,count)}),/between 2 and 60/);
 assert.throws(()=>make({groups:['A','a']}),/different names/);assert.throws(()=>make({assignments:{}}),/Assign concepts/);assert.throws(()=>make({assignments:Object.fromEntries(ids.map(id=>[id,0]))}),/every group/);
 const marks=C.gradeSort(a.items,Object.fromEntries(a.items.map((item,i)=>[i,item.group])));assert(marks.every(mark=>mark.correct));
});
test('custom sorts allow six groups of ten cards and count custom and literacy cards toward the group limit',()=>{
 const concepts=G.eligible('N3','group-sort').slice(0,58);
 const literacy=G.literacyConcepts('N3')[0];
 const ids=[...concepts, literacy].map(concept=>concept.id);
 const assignments=Object.fromEntries(ids.map((id,index)=>[id,Math.floor((index+1)/10)]));
 const options={name:'Sixty cards',level:'N3',template:'group-sort',ids,assignments,groups:['A','B','C','D','E','F'],customCards:[{text:'Extra card',group:0}]};
 const activity=G.make(options);
 assert.equal(activity.items.length,60);
 assert.equal(C.compatibility('group-sort',activity).ok,true);
 assert.equal(C.normalizeImport(C.exportActivity(activity))[0].items.length,60);
 assert.throws(()=>G.make({...options,customCards:[{text:'Extra card',group:5}]}),/Each group can contain up to 10 cards/);
});
test('retired Concept Games links route to relocated apps',()=>{
 const code=fs.readFileSync('shared/concept-games-retired.js','utf8');
 for(const [query,page,extra]of [['level=H','conceptsort.html'],['game=group-sort&activity=sort&level=N5','conceptsort.html'],['game=rank-order&level=N4','conceptquiz.html'],['activity=hub-n5-music-literacy-order-1&level=N5','rhythmsums.html','order'],['game=labelled-diagram&activity=piano&level=N3','music-dictionary/musicdictionaryconcept.html']]){
  let target;vm.runInNewContext(code,{URL,location:{href:'https://hub.test/conceptgames.html?'+query,hash:'',replace:url=>target=new URL(url)},document:{baseURI:'https://hub.test/'},window:{IGActivityIndex:[],MusicDictionaryLabelData:{games:[{id:'piano',conceptIds:['MC-0057'],level:'N3'}]}}});assert.equal(target.pathname,'/'+page);if(extra)assert.equal(target.searchParams.get('mode'),extra);
 }
});

test('keyboard removal returns placed cards to the bank but cannot alter submitted answers',()=>{
 const Babel=require('@babel/standalone'),source=fs.readFileSync('music-games/learning.jsx','utf8'),ast=Babel.packages.parser.parse(source,{plugins:['jsx']});let handler;Babel.packages.traverse.default(ast,{FunctionDeclaration(path){if(path.node.id.name==='sortRowKey')handler=source.slice(path.node.start,path.node.end);}});
 const moves=[],context={submitted:false,commitDrop:(...args)=>moves.push(args),setSelected:()=>{},clickSortRow:()=>{}};vm.runInNewContext(handler+';this.key=sortRowKey;',context);
 for(const key of ['Backspace','Delete'])context.key({key,preventDefault(){}},'Group',0,3);assert.deepEqual(moves,[[3,'pool'],[3,'pool']]);context.submitted=true;context.key({key:'Delete',preventDefault(){}},'Group',0,3);assert.equal(moves.length,2);
});
test('saved sorts keep the level picker and clear from the toolbar tag',()=>{
 const Babel=require('@babel/standalone'),React=require('react'),source=fs.readFileSync('music-games/app.jsx','utf8'),ast=Babel.packages.parser.parse(source,{plugins:['jsx']});let toolbar;
 Babel.packages.traverse.default(ast,{FunctionDeclaration(path){if(path.node.id.name==='GameToolbar')toolbar=source.slice(path.node.start,path.node.end);}});
 let destination;const context={React,C,window:{MLH:{ToolbarButtonClass:'toolbar'},MLHGameMedals:require('../shared/music-games-medals')},fixedGame:'group-sort',isCollectionGame:true,publicTitle:'Concept Sort',LibraryLevelPicker:()=>null,NavigationBackButton:()=>null,catalogueHref:'./conceptsort.html',document:{baseURI:'https://hub.test/conceptsort.html'},location:{replace:url=>destination=url},URL};
 vm.runInNewContext(Babel.transform(toolbar+';this.Toolbar=GameToolbar;',{presets:['react']}).code,context);
 const activity=C.makeActivity({level:'N4',template:'group-sort',folder:'My Collections',tags:['user-collection'],title:'Saved'});
 context.window.HubCollections={clearCollectionLink:(name,level)=>React.createElement('a',{href:'?level='+level},name)};
 const withTag=context.Toolbar({activity,mode:'group-sort',sortLevel:'AH',onLevel(...args){destination=args;}});
 const picker=withTag.props.children[0].props.children.props;
 assert.equal(picker.level,'AH');
 assert.equal(picker.onBack,undefined);
 picker.onLevel('H');assert.deepEqual(destination,['H']);
 const tag=picker.collectionLink;
 assert.equal(tag.props.children,'Saved');
 assert.equal(tag.props.href,'?level=AH');
 tag.props.onClick({preventDefault(){}});assert.deepEqual(destination,['AH','elements']);
 const standalone=context.Toolbar({activity,mode:'group-sort'});standalone.props.children[0].props.children.props.onBack();
 const url=new URL(destination);assert.equal(url.searchParams.has('collections'),false);assert.equal(url.searchParams.get('level'),'N4');
});
test('the sort drag preview lives above clipping trays and preserves fitted canvas scale',()=>{
 const Babel=require('@babel/standalone'),source=fs.readFileSync('music-games/learning.jsx','utf8'),ast=Babel.packages.parser.parse(source,{plugins:['jsx']});let helper;
 Babel.packages.traverse.default(ast,{FunctionDeclaration(path){if(path.node.id.name==='createSortDragPreview')helper=source.slice(path.node.start,path.node.end);}});
 for(const fullscreen of [false,true]){
  const attrs=new Map(),styles=new Map(),preview={style:{setProperty:(key,value)=>styles.set(key,value)},querySelectorAll:()=>[],setAttribute:(key,value)=>attrs.set(key,value),removeAttribute:key=>attrs.delete(key)};
  const node={offsetWidth:200,offsetHeight:100,cloneNode:()=>preview,querySelectorAll:()=>[],getBoundingClientRect:()=>({left:20,top:40,width:100,height:50})};
  let attached;const host={appendChild:child=>attached=child},context={document:{documentElement:fullscreen?{appendChild(){assert.fail('Use the full-screen surface');}}:host,fullscreenElement:fullscreen?host:null},getComputedStyle:()=>({[Symbol.iterator]:function*(){yield 'font-size';yield 'background-color';},getPropertyValue:key=>key==='font-size'?'18px':'rgb(37, 99, 235)'})};
  vm.runInNewContext(helper+';this.preview=createSortDragPreview;',context);assert.equal(context.preview(node),preview);assert.equal(attached,preview);assert.equal(preview.style.position,'fixed');assert.equal(preview.style.pointerEvents,'none');assert.equal(preview.style.zIndex,'2147483646');assert.equal(styles.get('transform'),'scale(0.5, 0.5)');assert.equal(attrs.get('aria-hidden'),'true');assert.equal(styles.get('background-color'),'rgb(37, 99, 235)');
 }
});

test('typed Sort cards work alone or alongside Dictionary concepts and retain their answers when shared',async()=>{
 const sharing=require('../music-games/sharing');
 const base={name:'Custom cards',level:'N3',template:'group-sort',ids:[],groups:['Animals','Plants'],customCards:[{text:'  Cat  ',group:0},{text:'Oak tree',group:1},{text:'',group:0}]};
 const a=G.make(base);assert.equal(a.items.length,2);assert.equal(a.items[0].prompt,'Cat');assert.equal(a.items[1].answer,'Oak tree');assert.deepEqual(a.sourceConceptIds,[]);
 const answers=Object.fromEntries(a.items.map((item,i)=>[i,item.group]));assert(C.gradeSort(a.items,answers).every(mark=>mark.correct));assert.equal(C.gradeSort(a.items,{0:'Plants'})[0].correct,false);
 assert.deepEqual(C.normalizeImport(C.exportActivity(a))[0].items,a.items);
 const link=await sharing.createUrl('https://hub.test/conceptsort.html',a);assert.deepEqual((await sharing.readHash(new URL(link).hash)).items,a.items);
 const concept=G.eligible('N3','group-sort')[0];
 const mixed=G.make({...base,ids:[concept.id],assignments:{[concept.id]:0}});assert.equal(mixed.items.length,3);assert.deepEqual(mixed.sourceConceptIds,[concept.id]);
 const reopened=C.normalize(G.make({...base,ids:[concept.id],assignments:{[concept.id]:1},customCards:[{text:'Cat',group:0}]}));
 assert.deepEqual([...new Set(reopened.items.map(item=>item.group))],base.groups);
 assert.throws(()=>G.make({...base,customCards:[{text:'Cat',group:0}]}),/between 2 and 60/);
 assert(G.make({...base,customCards:[{text:'Cat',group:0},{text:'cat',group:1}]}).items.every(item=>item.acceptedGroups.length===2));
 assert(G.make({...base,ids:[concept.id],assignments:{[concept.id]:0},customCards:[{text:concept.name,group:1}]}).items.every(item=>item.acceptedGroups.length===2));
 assert.throws(()=>G.make({...base,customCards:[{text:'Cat',group:0},{text:'Oak',group:3}]}),/Assign concepts/);
 assert.throws(()=>G.make({...base,customCards:Array.from({length:61},(_,i)=>({text:'Card '+i,group:i%2}))}),/between 2 and 60/);
 assert.throws(()=>G.make({...base,customCards:[{text:'x'.repeat(161),group:0},{text:'Oak',group:1}]}),/160 characters/);
});

test('identical cards accept every assigned group, including three or more groups and shared links',async()=>{
 const sharing=require('../music-games/sharing');
 const groups=['A','B','C','Other'];
 const make=()=>G.make({name:'Repeated cards',level:'N3',template:'group-sort',ids:[],groups,customCards:[{text:'Violin',group:0},{text:' violin ',group:1},{text:'VIOLIN',group:2},{text:'Flute',group:3}]});
 const a=make();
 for(const item of a.items.slice(0,3))assert.deepEqual(item.acceptedGroups,['A','B','C']);
 for(const group of groups.slice(0,3))assert(C.gradeSort(a.items,{0:group,1:group,2:group,3:'Other'}).every(mark=>mark.correct));
 assert(C.gradeSort(a.items,{0:'C',1:'A',2:'B',3:'Other'}).every(mark=>mark.correct));
 assert.equal(C.gradeSort(a.items,{0:'Other'})[0].correct,false);
 assert.equal(C.gradeSort(a.items,{3:'A'})[3].correct,false);
 const link=await sharing.createUrl('https://hub.test/conceptsort.html',a);assert.deepEqual((await sharing.readHash(new URL(link).hash)).items,a.items);
 const edited=G.make({name:a.title,level:a.level,template:a.template,ids:[],groups,customCards:a.items.map(item=>({text:item.prompt,group:groups.indexOf(item.group)}))});assert.deepEqual(edited.items.map(item=>item.acceptedGroups),a.items.map(item=>item.acceptedGroups));
});
