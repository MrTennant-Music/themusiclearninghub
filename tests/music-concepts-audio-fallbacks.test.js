const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync('music-dictionary/music-concepts-audio-editor.js','utf8');
const hubInput=fs.readFileSync('shared/hub-input.js','utf8');
const h=(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(x=>x!==null&&x!==false&&x!==undefined)});
const clip={id:'test',sourceUrl:'https://soundcloud.com/artist/test',embedUrl:'https://w.soundcloud.com/player/?url=test',name:'Test recording',startSeconds:0,endSeconds:30};
const fallback={url:'https://www.youtube.com/watch?v=qaz4Ziw_CfQ',title:'Alternative',channel:'Performer',matchType:'work'};
function harness(withWidget=true){
 let states=[],refs=[],index=0,effect,cleanup,first=true;const timers=new Map(),bindings=new Map();let nextTimer=1;
 const calls=[];
 const widget={bind:(e,fn)=>bindings.set(e,fn),unbind:e=>bindings.delete(e),pause(){calls.push('pause');bindings.get('pause')?.();},getDuration:fn=>fn(60000),getCurrentSound:fn=>fn({title:'Test'}),seekTo(value){calls.push(['seek',value]);},play(){calls.push('play');},getPosition:fn=>fn(0)};
 const React={useState(initial){const n=index++;if(!(n in states))states[n]=initial;return[states[n],value=>states[n]=typeof value==='function'?value(states[n]):value];},useRef(initial){const n=index++;return refs[n]||(refs[n]={current:initial});},useLayoutEffect(fn){if(first)effect=fn;}};
 const window={MUSIC_CONCEPT_AUDIO_FALLBACKS:{tracks:{[clip.sourceUrl]:fallback}}};
 if(withWidget){window.SC={Widget:()=>widget};window.SC.Widget.Events=Object.fromEntries(['READY','PLAY','PAUSE','PLAY_PROGRESS','SEEK','FINISH','ERROR'].map(x=>[x,x.toLowerCase()]));}
 const context={h,React,window,AudioControls:'AudioControls',setTimeout:(fn,ms)=>{let id=nextTimer++;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),document:{addEventListener(){},removeEventListener(){},querySelectorAll:()=>[],dispatchEvent(){}},CustomEvent:class{}};
 const start=ui.indexOf('  function AudioFallback('),end=ui.indexOf('  function NativeSectionPlayer(');
 vm.runInNewContext(hubInput,context);
 vm.runInNewContext(ui.slice(start,end)+';this.player=SoundCloudSectionPlayer;this.overlay=AudioFallback;',context);
 const render=(item=clip)=>{index=0;const tree=context.player({clip:item});if(first){first=false;cleanup=effect?.();}return tree;};
 return{render,window,timers,calls,emit:(event,data)=>bindings.get(event)?.(data),expire(ms){for(const [id,t]of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}},overlay:context.overlay,dispose:()=>cleanup?.()};
}
function find(node,type){return node?.type===type?node:node?.children?.map(x=>find(x,type)).find(Boolean);}
test('a vocal excerpt waits for Play before seeking past its instrumental introduction',()=>{
 const app=harness(),item={...clip,startSeconds:15.5,endSeconds:45.5};app.render(item);app.emit('ready');
 assert.deepEqual(app.calls,[]);assert.equal(find(app.render(item),'AudioControls').props.playing,false);
 find(app.render(item),'AudioControls').props.onToggle();assert.deepEqual(app.calls,['play']);
 app.emit('play');assert.deepEqual(app.calls,['play',['seek',15500]]);
 assert.equal(find(app.render(item),'AudioControls').props.playing,true);app.dispose();
});
test('every saved example has a direct YouTube alternative; browser and source mappings agree',()=>{
 const data=require('../music-dictionary/music-concepts-audio-fallbacks.json');assert.deepEqual(require('../music-dictionary/music-concepts-audio-fallbacks.js'),data);
 const clips=Object.values(require('../music-dictionary/music-concepts-audio.json').concepts).flat();
 for(const clip of clips){const item=data.tracks[clip.sourceUrl];assert.ok(item,clip.name);assert.match(item.url,/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}(?:&t=\d+s)?$/);assert.ok(item.title&&item.channel);if(clip.provider==='soundcloud')assert.ok(clip.artworkUrl||clip.artwork||item.artworkUrl,clip.name+' retains artwork without the widget');assert.ok(['recording','work','demonstration'].includes(item.matchType));}
 assert.equal(data.exampleCount,clips.length);assert.equal(Object.keys(data.tracks).length,new Set(clips.map(c=>c.sourceUrl)).size);
});
test('missing SoundCloud API presents the external YouTube overlay',()=>{
 const app=harness(false);app.render();const tree=app.render();assert.equal(find(tree,'AudioControls').props.unavailable,true);const markup=app.overlay({clip,error:'Unavailable'}),link=find(markup,'a');assert.equal(link.props.href,fallback.url);assert.equal(link.props.target,'_blank');assert.ok(link.props.rel.includes('noopener'));assert.equal(find(markup,'img').props.src,'./ui-icons/youtube.svg');assert.ok(find(markup,'svg'));assert.ok(!JSON.stringify(markup).includes('Audio unavailable here.'));
});
test('a player which never becomes ready times out to its fallback',()=>{
 const app=harness();app.render();app.expire(15000);assert.equal(find(app.render(),'AudioControls').props.unavailable,true);app.dispose();assert.equal(app.timers.size,0);
});
test('ready playback stays unobstructed; widget errors and stalled play expose the fallback',()=>{
 const app=harness();app.render();app.emit('ready');assert.equal(app.timers.size,0);let tree=app.render();assert.equal(find(tree,'AudioControls').props.unavailable,false);find(tree,'AudioControls').props.onToggle();app.expire(10000);assert.equal(find(app.render(),'AudioControls').props.unavailable,true);app.dispose();
 const error=harness();error.render();error.emit('error');assert.equal(find(error.render(),'AudioControls').props.unavailable,true);error.dispose();
});
test('play progress cancels the stalled-play fallback and unmount clears pending timers',()=>{
 const app=harness();app.render();app.emit('ready');find(app.render(),'AudioControls').props.onToggle();app.emit('play_progress',{currentPosition:500});assert.equal(app.timers.size,0);assert.equal(find(app.render(),'AudioControls').props.unavailable,false);app.dispose();
 const loading=harness();loading.render();loading.dispose();assert.equal(loading.timers.size,0);
});

test('fallback retains its title, artist and artwork while replacing only the controls',()=>{
 const context={h,window:{MUSIC_CONCEPT_AUDIO_FALLBACKS:{tracks:{[clip.sourceUrl]:fallback}}}};
 vm.runInNewContext(ui.slice(ui.indexOf('  function audioClock('),ui.indexOf('  function SoundCloudSectionPlayer('))+';this.controls=AudioControls;this.fallback=AudioFallback;',context);
 const tree=context.controls({clip:{...clip,credit:'Original artist',artworkUrl:'cover.jpg'},ready:false,unavailable:true});
 const track=tree.children.find(x=>x.props?.className==='mc-audio-track');assert.ok(track);assert.equal(find(track,'img').props.src,'./ui-icons/assessment-cover-quavers.svg');assert.equal(find(track,'a').children[0],clip.name);assert.ok(JSON.stringify(track).includes('Original artist'));
 assert.equal(find(tree,'button'),undefined);assert.equal(find(tree,'input'),undefined);assert.ok(find(tree,context.fallback));
});
