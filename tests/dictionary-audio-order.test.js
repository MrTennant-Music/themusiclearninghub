const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),crypto=require('crypto');
const C=require('../music-dictionary/quiz-core'),P=require('../music-dictionary/quiz-practice-core'),A=require('../music-dictionary/quiz-audio-order');
const bank=require('../music-dictionary/quiz-data/audio-order-question-bank.json'),existing=require('../music-dictionary/quiz-data/audio-question-bank.json');
const permutations=xs=>xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(rest=>[x,...rest])):[[]];
const names=q=>q.answer.correctOptionIds.map(id=>q.options.find(o=>o.id===id).answerLabel);
test('all fourteen requested audio Order tasks validate, respect levels and mark every sequence correctly',async()=>{
 assert.equal(bank.questions.length,14);assert.equal(new Set(bank.questions.map(q=>q.id)).size,14);
 for(const q of bank.questions){assert.equal(q.format,'order');assert.equal(q.modality,'audio');assert(q.options.length>=4);assert.deepEqual(C.validateQuestion(q),[]);assert.equal(await C.fingerprint(q),q.contentSha256);assert(C.eligibleForQuiz(q,{level:q.levelCode,audioQuestions:true,nonAudioQuestions:false,formats:['order']}));assert(!C.eligibleForQuiz(q,{level:q.levelCode,audioQuestions:false}));for(const lower of ['N3','N4','N5','H','AH'].slice(0,['N3','N4','N5','H','AH'].indexOf(q.levelCode)))assert(!C.eligibleForQuiz(q,{level:lower}));
  for(const ids of permutations(q.answer.correctOptionIds)){const ok=ids.every((id,i)=>id===q.answer.correctOptionIds[i]);assert.equal(C.isCorrect(q,ids),ok);assert.deepEqual(C.markQuestion(q,ids),{earned:ok?1:0,available:1});}
 }
 const byTopic=topic=>bank.questions.find(q=>q.factGroupId===topic);
 assert.deepEqual(names(byTopic('audio-order-N4-voices')),['Soprano','Alto','Tenor','Bass']);assert.deepEqual(names(byTopic('audio-order-N5-tempo')),['Allegro','Moderato','Andante','Adagio']);assert.deepEqual(names(byTopic('audio-order-N5-voices')),['Soprano','Mezzo-soprano','Alto','Tenor','Baritone','Bass']);assert.deepEqual(names(byTopic('audio-order-AH-male-voices')),['Countertenor','Tenor','Baritone','Bass']);
 for(const q of bank.questions.filter(q=>/strings|woodwind|brass/.test(q.factGroupId)))assert(!names(q).some(n=>/saxophone|harp|recorder|pan pipes/i.test(n)));
});
test('all forty new library recordings are real byte-distinct additions to the existing quiz bank',()=>{
 const hashes=new Set(existing.questions.map(q=>q.media.sha256)),paths=new Set(existing.questions.map(q=>q.media.libraryPath)),newHashes=new Set();assert.equal(bank.recordings.length,40);
 for(const recording of bank.recordings){assert(!hashes.has(recording.sha256));assert(!paths.has(recording.libraryPath));const file=decodeURIComponent(recording.src).replace(/^\.\//,'');assert(fs.existsSync(file));const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');assert.equal(hash,recording.sha256);newHashes.add(hash);}
 assert.equal(newHashes.size,40);
});
test('piano notes, motif lengths and retrograde are freshly generated with exact pitch and timing inventories',()=>{
 let seed=937;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 assert(Math.abs(A.frequency(60)-261.6255653)<.0001);assert(Math.abs(A.frequency(72)-523.2511306)<.0001);
 for(const template of bank.questions.filter(q=>q.generator)){const fingerprints=new Set();for(let i=0;i<200;i++){const [q]=P.prepareChoices([template],random);assert.deepEqual(C.validateQuestion(q),[]);assert(!C.isCorrect(q,q.options.map(o=>o.id)));assert.deepEqual(q.options.map(o=>o.text),['Example A','Example B','Example C','Example D']);const ordered=q.answer.correctOptionIds.map(id=>q.options.find(o=>o.id===id));fingerprints.add(JSON.stringify(q.options.map(o=>o.media.events)));
  for(const o of q.options)for(const e of o.media.events){assert(e.midi>=60&&e.midi<=72);assert.equal(e.velocity,96);assert(e.duration>0);}
  if(q.generator.type==='pitches'){const midi=ordered.map(o=>o.media.events[0].midi);assert.equal(new Set(midi).size,4);assert.deepEqual(midi,midi.slice().sort((a,b)=>q.generator.direction==='high-low'?b-a:a-b));}
  if(q.generator.type==='motifs'){const durations=ordered.map(o=>o.media.events.reduce((s,e)=>s+e.duration,0));assert.deepEqual(durations,q.generator.direction==='long-short'?[6,3,1.5,.75]:[.75,1.5,3,6]);for(const o of q.options)assert.deepEqual(o.media.events.map(e=>e.midi),q.options[0].media.events.map(e=>e.midi));}
  if(q.generator.type==='retrograde'){assert.equal(q.referenceMedia.events.length,4);assert.deepEqual(ordered.map(o=>o.media.events[0].midi),q.referenceMedia.events.map(e=>e.midi).reverse());}
 }assert(fingerprints.size>150,template.id);}
});
test('audio labels reveal no concept names or predictable correct alphabetic ordering before submission',()=>{
 for(const template of bank.questions)for(let i=0;i<30;i++){const [q]=P.prepareChoices([template]);assert(q.options.every((o,index)=>o.text==='Example '+String.fromCharCode(65+index)));assert(!C.isCorrect(q,q.options.map(o=>o.id)));assert(q.options.every(o=>A.validateMedia(o.media)));}
 const valid=bank.questions.find(q=>!q.generator);for(const src of ['https://example.com/a.m4a','./audio/concept-library/%2e%2e/private.m4a']){const q=C.copy(valid);q.options[0].media.src=src;assert(C.validateQuestion(q).length);}
});
test('piano playback schedules the exact MIDI events and cancels an unfinished load without sounding notes',async()=>{
 const vm=require('vm'),source=fs.readFileSync('music-dictionary/quiz-order-audio-player.js','utf8'),media={kind:'piano',duration:1,events:[{midi:60,start:0,duration:.4,velocity:96},{midi:72,start:.4,duration:.6,velocity:96}]};
 function fixture(pending=false){let cursor=0,resolve;const hooks=[],effects=[],played=[],listeners=new Map(),contexts=[],timers=[];const React={createElement:(tag,props,...children)=>({tag,props:props||{},children:children.flat(Infinity)}),useState:v=>{const i=cursor++;if(!(i in hooks))hooks[i]=v;return [hooks[i],v=>hooks[i]=v];},useRef:v=>{const i=cursor++;return hooks[i]||(hooks[i]={current:v});},useEffect:fn=>effects.push(fn)};class Context{constructor(){this.state='running';this.currentTime=10;this.destination={};contexts.push(this);}close(){this.state='closed';return Promise.resolve();}}
 const window={AudioContext:Context,MLH:{prepareAudioPlayback:()=>pending?new Promise(r=>resolve=r):Promise.resolve(true),playPianoFrequency:(...args)=>played.push(args)},addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type),dispatchEvent:e=>listeners.get(e.type)?.()};const ctx={window,React,MusicDictionaryQuizAudioOrder:A,Event:class{constructor(type){this.type=type;}},document:{querySelectorAll:()=>[]},setInterval:fn=>{timers.push(fn);return timers.length;},clearInterval(){},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){}};vm.runInNewContext(source,ctx);function render(){cursor=0;return window.MusicDictionaryQuizOrderAudio({media,label:'Example A'});}const tree=render(),cleanup=effects[0]();const button=tree.children.find(n=>n?.tag==='button');return {button,played,contexts,cleanup,stop:()=>window.dispatchEvent({type:'mlh-stop-order-audio'}),finish:()=>resolve(true),render};}
 const f=fixture();await f.button.props.onClick();assert.equal(f.played.length,2);for(let i=0;i<2;i++){const event=media.events[i],args=f.played[i];assert.equal(args[2],A.frequency(event.midi));assert.equal(args[3],10.05+event.start);assert.equal(args[4],event.duration);assert.equal(args[6],96);}f.stop();assert.equal(f.contexts[0].state,'closed');f.cleanup();
 const pending=fixture(true),promise=pending.button.props.onClick();pending.stop();pending.finish();await promise;assert.equal(pending.played.length,0);assert.equal(pending.contexts[0].state,'closed');pending.cleanup();
});
