/* Music Escape: deterministic content and serialisable game rules. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../shared/concept-level-priority'));else root.EscapeCore=factory(root.MLHConceptLevelPriority);})(globalThis,function(prioritise){
'use strict';
const VERSION=3,levels=['N3','N4','N5','H','AH'];
const rooms=[
 ["Practice Room","After school","You wake up from a nap in the practice room and the door is locked.","Filing Cabinet","Piano","Speaker"],
 ["Music Classroom","After the last bell","You enter the music classroom, but the next door is locked.","Desk","Keyboard","PA Speaker"],
 ["Corridor","Beyond the music department","You reach an empty school corridor. The fire doors are locked.","Noticeboard","Glockenspiel","Intercom"],
 ["Recording Room","One last session","You step into the recording room and find another locked door.","Studio Drawers","Mixing Desk","Studio Monitor"],
 ["Music Store","Behind the cupboard door","You squeeze into the music store, surrounded by instrument cases. Search the storage chest, metronome and cassette recorder to unlock the door.","Storage Chest","Metronome","Cassette Recorder"],
 ["Staff Room","The teachers have gone home","You enter the deserted staff room. The next door is locked.","Paper Trays","Portable Keyboard","CD Player"],
 ["Backstage","Behind the curtains","You find yourself backstage behind the assembly hall. Check the cue desk, sound desk and stage monitor to unlock the exit door.","Cue Desk","Sound Desk","Stage Monitor"],
 ["Rehearsal Room","An empty ensemble","You enter an empty rehearsal room. Search the music cabinet, metronome and audio recorder for the next door code.","Music Cabinet","Metronome","Audio Recorder"],
 ["Assembly Hall","The final exit","You reach the assembly hall and can see the final exit.","Lectern","Upright Piano","PA Column"]
];
const routes={Short:[0,1,8],Standard:[0,3,1,2,5,8],Extended:[0,3,1,2,4,5,6,7,8]};
const clueObjects=['archive','mechanism','recording','ear-training'];
function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(items,r){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function settings(s={}){return{level:levels.includes(s.level)?s.level:'N3',length:routes[s.length]?s.length:'Standard',balance:['Balanced','Listening','Knowledge','Practical'].includes(s.balance)?s.balance:'Balanced',...(s.selectedLevelOnly===true?{selectedLevelOnly:true}:{})};}
const literacyChoices=['interval','keyboardNote','noteNames','noteValue','rhythmSum','time','follow','melodicDictation','barlines'];
const literacyExtensions={
 N3:['dynamics'],
 N4:['dynamics','repeats'],
 N5:['key','chord','accidentals','dynamics','repeats'],
 H:['key','chord','rest','scaleDegrees','triplets','articulation','repeats'],
 AH:['key','chord','rest','accidentals','enharmonic','chordInversion','chordBassLine','repeats','articulation','triplets','scaleDegrees']
};
function literacyReviewOrder(seed,level,initialKind){
 const higher=['H','AH'].includes(level);
 const kinds=new Set([...literacyChoices,...literacyExtensions[level],'rhythmDictation',
  ...(higher?['keyboardSingle','transpose']:[])]);
 const initialAvailable=kinds.delete(initialKind);
 const order=shuffle([...kinds],random(seed^0x59b414f1));
 if(initialAvailable)order.push(initialKind);
 return order;
}
function literacyPlan(seed,level,count){
 const rng=random(seed^0x36be71d9);
 const higher=['H','AH'].includes(level);
 const choices=[...literacyChoices,...literacyExtensions[level],...(higher?['keyboardSingle']:[])];
 if(!higher||count<6)return shuffle([...choices,'rhythmDictation',...(higher?['transpose']:[])],rng).slice(0,count);
 const remaining=shuffle([...choices,'transpose'],rng);
 const early=shuffle(['rhythmDictation',...remaining.slice(0,2)],rng);
 return [...early,...remaining.slice(2,count-1)];
}
function literacyClue(seed,level,kind){
 const rng=random(seed^0x48c4a4d3);
 const pick=n=>Math.floor(rng()*n);
 const middleBar=1+pick(2);
 const barIndex=kind==='keyboardSingle'?3:middleBar;
 const variant=pick(2147483647);
 const optionCount=kind==='time'?({N3:3,N4:3,N5:3,H:6,AH:7})[level]
  :kind==='key'?(level==='AH'?8:4)
  :kind==='interval'?({N3:2,N4:2,N5:3,H:4,AH:4})[level]
  :kind==='tempo'?(level==='N3'?2:3)
  :kind==='repeats'&&level==='N4'||kind==='cadences'&&level==='N5'?2
  :({accidentals:2,keyboardNote:7,rest:5,rhythmDictation:3,melodicDictation:3,chordInversion:3,scaleDegrees:3})[kind]??4;
 const targetBar=kind==='follow'?1+pick(7):barIndex;
 const digit=1+pick(optionCount);
 return {kind,barIndex:targetBar,variant,digit};
}
function collectionClues(content, ids, rng) {
 const selected = new Set(ids);
 const concepts = content.concepts.filter(concept => selected.has(concept.id));
 if (!concepts.length) throw Error('No recognised concepts in this collection.');
 const knownIds = new Set(concepts.map(concept => concept.id));
 const bank = new Map();
 for (const question of [...content.knowledge, ...content.audio]) {
  if (!knownIds.has(question.conceptId)) continue;
  const key = JSON.stringify([question.conceptId, question.prompt, question.src, question.start, question.end]);
  if (!bank.has(key)) bank.set(key, question);
 }
 const questions = [...bank.values()];
 const writtenIds = new Set(questions.filter(question => !question.src).map(question => question.conceptId));
 for (const concept of concepts) {
  if (writtenIds.has(concept.id)) continue;
  const distractors = shuffle(content.concepts.filter(other => other.level === concept.level && other.name !== concept.name), rng).slice(0, 3);
  questions.push({
   questionId: 'collection-definition:' + concept.id,
   conceptId: concept.id,
   prompt: concept.definition,
   options: [concept, ...distractors].map(option => ({ id: option.id, text: option.name })),
   correctOptionIds: [concept.id]
  });
 }
 let remaining = [];
 let previous;
 const used = new Map();
 return preferAudio => {
  if (!remaining.length) remaining = shuffle(questions, rng);
  const candidates = remaining.length > 1 ? remaining.filter(question => question !== previous) : remaining;
  const matching = candidates.filter(question => Boolean(question.src) === preferAudio);
  const pool = matching.length ? matching : candidates;
  const question = pool.reduce((best, current) =>
   (used.get(current.conceptId) || 0) < (used.get(best.conceptId) || 0) ? current : best);
  remaining.splice(remaining.indexOf(question), 1);
  used.set(question.conceptId, (used.get(question.conceptId) || 0) + 1);
  previous = question;
  return question;
 };
}
function hasFourthClue(position){return position>=3&&position<=5;}
function codeOrders(seed){
 const first=shuffle([0,1,2],random(seed^0x7a31e095)),fourth=[...first];
 fourth.splice(Math.floor(random(seed^0x431daa71)()*4),0,3);
 return [first,fourth];
}
function generateCollection(seed, opts, content, ids) {
 const rng = random(seed);
 const [threeDigits, fourDigits] = codeOrders(seed);
 const nextQuestion = collectionClues(content, ids, random(seed ^ 0x51495a));
 return routes[opts.length].map((index, position) => {
  const [name, subtitle, story, ...labels] = rooms[index];
  const codeOrder = hasFourthClue(position) ? fourDigits : threeDigits;
  const objects = clueObjects.slice(0, codeOrder.length);
  const collectionQuestions = Object.fromEntries(objects.map(key => [key, nextQuestion(key === 'recording')]));
  const digits = objects.map(() => 1 + Math.floor(rng() * 8));
  const roomSeed = (seed + index * 104729) >>> 0;
  return {
   index, position, name, subtitle, story, labels, digits, codeOrder, collectionQuestions,
   sceneOrder: shuffle([...objects, 'order'], random(roomSeed ^ 0x38d46a7b)),
   code: codeOrder.map(i => digits[i]).join(''),
   dependencies: Object.fromEntries([...objects, 'exit'].map(key => [key, []]))
  };
 });
}
function generate(seed,options,content,collectionIds,version=VERSION){const opts=settings(options);
if(collectionIds)return generateCollection(seed,opts,content,collectionIds);
const r=random(seed),rank=levels.indexOf(opts.level);const pool=content.concepts.filter(c=>c.level===opts.level);const audioPool=content.audio.filter(a=>pool.some(c=>c.id===a.conceptId));if(pool.length<3||!audioPool.length)throw Error('Incomplete curriculum content');const bankRandom=random(seed^0x51495a);
const questionOrder=bank=>prioritise(shuffle(bank.filter(q=>q.level===opts.level||!opts.selectedLevelOnly&&version>=3&&levels.includes(q.level)&&levels.indexOf(q.level)<rank),bankRandom),q=>q.level===opts.level);
const knowledgeQuestions=questionOrder(content.knowledge),listeningQuestions=questionOrder(content.audio);
const [codeOrder,fourDigitOrder]=codeOrders(seed);const route=routes[opts.length],clues=literacyPlan(seed,opts.level,route.length);return route.map((index,position)=>{
const concepts=shuffle(pool,r).slice(0,3),audio=audioPool[Math.floor(r()*audioPool.length)],audioConcept=pool.find(c=>c.id===audio.conceptId),digits=Array.from({length:3},()=>1+Math.floor(r()*8));
const literacySeed=(seed+index*104729)>>>0,literacy=literacyClue(literacySeed,opts.level,clues[position]);
digits[1]=literacy.digit;
const earTraining=hasFourthClue(position)
 ? {kind:'earTraining',seed:(seed^0x0297e21b)>>>0,slot:position-3,digit:1+Math.floor(random(literacySeed^0x631eb38f)()*9)}
 : null;
if(earTraining)digits.push(earTraining.digit);
const roomCodeOrder=earTraining?fourDigitOrder:codeOrder;
const sceneOrder=shuffle([...clueObjects.slice(0,digits.length),'order'],random(literacySeed^0x38d46a7b));
const roots=rank===0?[0,5,7]:[0,2,4,5,7];const root=60+roots[Math.floor(r()*roots.length)];
const patterns=[[0,2,4],[0,4,7],[0,3,7],[0,4,7,10],[0,4,8]];
const sequence=patterns[rank].map(n=>root+n);
const letters=['C','D','E','F','G','A','B'],natural=[0,2,4,5,7,9,11],rootStep=natural.indexOf(root-60);
const spellings=sequence.map((m,i)=>{const step=rootStep+(rank===0?i:i*2),octave=4+Math.floor(step/7),letter=letters[step%7],accidental=m-(12*(octave+1)+natural[step%7]);return letter+(accidental===1?'♯':accidental===-1?'♭':'')+octave;});
const kind='literacy';
const satellite='audio';
const durations=rank===0?[1,1,2]:rank===1?[.5,.5,1,2]:rank===2?[1.5,.5,1,1]:rank===3?[.5,.5,1,.5,.5,1]:[.5,1,.5,.5,1,.5];
return{knowledge:knowledgeQuestions[position%knowledgeQuestions.length],listening:listeningQuestions[position%listeningQuestions.length],literacySeed,literacy,earTraining,index,position,name:rooms[index][0],subtitle:rooms[index][1],story:rooms[index][2],labels:rooms[index].slice(3),concepts,audio,audioConcept,digits,sequence,spellings,kind,satellite,durations,mix:rank===0?[30,70,30]:rank===1?[30,70,50]:[20,80,60],sceneOrder,codeOrder:roomCodeOrder,code:roomCodeOrder.map(i=>digits[i]).join(''),dependencies:{archive:[],mechanism:[],recording:[],exit:[]}};});}
function create(seed,options){return{version:VERSION,seed:seed>>>0,options:settings(options),room:0,solved:[],discovered:[],drafts:{},attempts:0,correct:0,mistakes:0,elapsed:0,fragments:[],inventory:[],journal:[],finished:false,roomEntry:null};}
function id(s,key){return `${s.room}:${key}`;}
function ready(s,room,key){return(room.dependencies[key]||[]).every(dep=>s.solved.includes(id(s,dep)));}
function discover(s,room){const key=id(s,'archive');if(!s.discovered.includes(key)){s.discovered.push(key);s.journal.push({room:s.room,text:room.story});}}
function answer(room,key,value){if(room.collectionQuestions&&key!=='exit')return Boolean(room.collectionQuestions[key]?.correctOptionIds.includes(value));if(key==='archive')return room.knowledge.correctOptionIds.includes(value);if(key==='mechanism')return value===true;if(key==='recording')return room.listening.correctOptionIds.includes(value);return key==='exit'&&String(value)===room.code;}
function solve(s,room,key,value){if(s.finished||s.mistakes>=3||s.solved.includes(id(s,key))||!ready(s,room,key))return false;s.attempts++;if(!answer(room,key,value)){s.mistakes=(s.mistakes||0)+1;return false;}s.correct++;s.solved.push(id(s,key));delete s.drafts[id(s,key)];if(key==='archive'){if(!s.solved.includes(id(s,'mechanism')))s.inventory.push('Cylinder '+(s.room+1));s.journal.push({room:s.room,text:`Archive digit: ${room.digits[0]}. Mechanism instructions are now in the cylinder.`});}if(key==='mechanism'){s.inventory=s.inventory.filter(x=>x!=='Cylinder '+(s.room+1));if(!s.solved.includes(id(s,'recording')))s.inventory.push('Recording '+(s.room+1));s.journal.push({room:s.room,text:`Mechanism digit: ${room.digits[1]}. The recording compartment is open.`});}if(key==='recording'){s.inventory=s.inventory.filter(x=>x!=='Recording '+(s.room+1));s.journal.push({room:s.room,text:`Recording digit: ${room.digits[2]}. Check the door code order clue before setting the dials.`});}if(key==='exit'){s.fragments.push(s.room);s.journal.push({room:s.room,text:`Score fragment ${s.room+1} recovered.`});}return true;}
function enter(s){s.roomEntry=JSON.parse(JSON.stringify({solved:s.solved,discovered:s.discovered,attempts:s.attempts,correct:s.correct,fragments:s.fragments,inventory:s.inventory,journal:s.journal}));}
function restart(s){if(!s.roomEntry||s.finished)return;Object.assign(s,JSON.parse(JSON.stringify(s.roomEntry)));s.drafts={};}
function advance(s,count){if(!s.solved.includes(id(s,'exit'))||s.finished||s.mistakes>=3)return false;if(s.room===count-1){s.finished=true;s.completedAt=new Date().toISOString();}else{s.room++;s.drafts={};enter(s);}return true;}
function medalTargets(roomCount=6){
 return [{tier:'bronze',room:3},{tier:'silver',room:4},{tier:'gold',room:5}].filter(target=>target.room<roomCount).concat({tier:'diamond',room:roomCount});
}
function medal(s){return medalTargets(routes[s.options.length].length).filter(target=>s.fragments.length>=target.room).at(-1)?.tier||null;}
function restore(raw,content,collectionIds){try{const s=JSON.parse(raw);if(![1,2,VERSION].includes(s.version)||!Number.isInteger(s.seed)||s.seed<0||s.seed>4294967295||JSON.stringify(settings(s.options))!==JSON.stringify(s.options))return null;const rooms=generate(s.seed,s.options,content,collectionIds,s.version);if(!Number.isInteger(s.room)||s.room<0||s.room>=rooms.length||typeof s.finished!=='boolean')return null;for(const k of ['elapsed','attempts','correct'])if(!Number.isFinite(s[k])||s[k]<0)return null;for(const k of ['solved','discovered','fragments','inventory','journal'])if(!Array.isArray(s[k])||s[k].length>500)return null;if(!s.drafts||typeof s.drafts!=='object'||!s.roomEntry)return null;const validKey=x=>typeof x==='string'&&/^\d+:(archive|mechanism|recording|exit)$/.test(x)&&Number(x.split(':')[0])<=s.room;
const validSnapshot=x=>x&&typeof x==='object'&&['attempts','correct'].every(k=>Number.isSafeInteger(x[k])&&x[k]>=0)&&x.correct<=x.attempts&&['solved','discovered','fragments','inventory','journal'].every(k=>Array.isArray(x[k]))&&x.solved.every(validKey)&&new Set(x.solved).size===x.solved.length&&x.discovered.every(validKey)&&x.fragments.every(n=>Number.isInteger(n)&&n>=0&&n<=s.room)&&x.inventory.every(v=>typeof v==='string'&&/^(Cylinder|Recording) [1-9]$/.test(v))&&x.journal.every(e=>e&&Number.isInteger(e.room)&&e.room>=0&&e.room<=s.room&&typeof e.text==='string'&&e.text.length<2000);
if(!validSnapshot(s)||!validSnapshot(s.roomEntry)||!Object.entries(s.drafts).every(([k,v])=>(validKey(k)||(/^\d+:ear-training$/.test(k)&&Number(k.split(':')[0])<=s.room&&rooms[Number(k.split(':')[0])]?.earTraining))&&Array.isArray(v)&&v.length<=25&&v.every(x=>typeof x==='string'||Number.isFinite(x))))return null;for(let i=0;i<rooms.length;i++){const local={...s,room:i};for(const key of Object.keys(rooms[i].dependencies))if(s.solved.includes(id(local,key))&&!ready(local,rooms[i],key))return null;if(i<s.room&&!s.solved.includes(id(local,'exit')))return null;}if(s.finished&&!s.solved.includes(id(s,'exit')))return null;if(s.correct!==s.solved.length||s.roomEntry.solved.some(k=>Number(k.split(':')[0])>=s.room)||new Set(s.fragments).size!==s.fragments.length||s.fragments.some(n=>!s.solved.includes(n+':exit')))return null;if(s.version===1){s.version=2;s.drafts={};}if(s.practiceDrafts&&(typeof s.practiceDrafts!=='object'||Array.isArray(s.practiceDrafts)||JSON.stringify(s.practiceDrafts).length>1000000))return null;if(s.mistakes===undefined)s.mistakes=0;if(!Number.isInteger(s.mistakes)||s.mistakes<0||s.mistakes>3)return null;delete s.hints;delete s.roomEntry.hints;delete s.score;delete s.roomEntry.score;return s;}catch{return null;}}
return{VERSION,levels,rooms,routes,clueObjects,random,shuffle,settings,generate,create,id,ready,discover,answer,solve,enter,restart,advance,medalTargets,medal,restore,literacyClue,literacyReviewOrder};
});
