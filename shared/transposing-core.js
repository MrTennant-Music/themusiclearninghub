(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TRANSPOSING_CORE=api;})(typeof window==='object'?window:globalThis,function(){
const LETTER_INDEX={C:0,D:1,E:2,F:3,G:4,A:5,B:6},INDEX_LETTER=['C','D','E','F','G','A','B'];
function pitch(letter, octave) {
  return { letter, octave, index: octave * 7 + LETTER_INDEX[letter] };
}

function pitchFromIndex(index) {
  return { letter: INDEX_LETTER[((index % 7) + 7) % 7], octave: Math.floor(index / 7), index };
}

function transposePitch(note, octaves) {
  return pitchFromIndex(note.index + octaves * 7);
}

function stepForClef(note, clef) {
  const reference = clef === "treble" ? pitch("E", 4).index : pitch("G", 2).index;
  return note.index - reference;
}

function noteItem(note, clef, rhythm = "crotchet") {
  return { ...note, clef, rhythm, step: stepForClef(note, clef) };
}

function pitchRange(startLetter, startOctave, endLetter, endOctave) {
  const start = pitch(startLetter, startOctave).index;
  const end = pitch(endLetter, endOctave).index;
  return Array.from({ length: end - start + 1 }, (_, index) => pitchFromIndex(start + index));
}

const HIGHER_SOURCE_NOTES = pitchRange("C", 4, "C", 5);
const SAME_PITCH_NOTES = pitchRange("A", 3, "E", 4);
const BASS_OCTAVE_SOURCE_NOTES = pitchRange("C", 3, "C", 4);
const OTTAVA_SOURCE_NOTES = pitchRange("C", 4, "A", 4);
const OTTAVA_BASS_SOURCE_NOTES = pitchRange("C", 3, "C", 4);

const RHYTHMS = [
  { id: "minim", label: "Minim", beats: 2 },
  { id: "dotted-crotchet", label: "Dotted crotchet", beats: 1.5 },
  { id: "crotchet", label: "Crotchet", beats: 1 },
  { id: "quaver", label: "Quaver", beats: 0.5 },
];

const TOOLS = [...RHYTHMS, { id: "tie", label: "Tie", type: "tie" }];

const DEFAULT_QUESTION_OPTIONS = {
  ottava: true,
  samePitch: true,
  octaveHigher: true,
  octaveLower: true,
};

const RHYTHM_BEATS = Object.fromEntries(RHYTHMS.map((rhythm) => [rhythm.id, rhythm.beats]));

const RHYTHM_SPACING = {
  minim: 3.4,
  "dotted-crotchet": 2.45,
  crotchet: 1.65,
  quaver: 0.95,
};

const FOUR_BEAT_PATTERNS = [
  { rhythms: ["minim", "crotchet", "crotchet"] },
  { rhythms: ["dotted-crotchet", "quaver", "crotchet", "crotchet"] },
  { rhythms: ["crotchet", "crotchet", "dotted-crotchet", "quaver"] },
  { rhythms: ["crotchet", "crotchet", "crotchet", "crotchet"] },
  { rhythms: ["dotted-crotchet", "quaver", "dotted-crotchet", "quaver"] },
  { rhythms: ["crotchet", "crotchet", "minim"] },
  { rhythms: ["minim", "minim"] },
  { rhythms: ["dotted-crotchet", "quaver", "minim"] },
  { rhythms: ["crotchet", "quaver", "quaver", "crotchet", "crotchet"], stepwise: true },
  { rhythms: ["quaver", "quaver", "quaver", "quaver", "minim"], stepwise: true },
  { rhythms: ["crotchet", "quaver", "quaver", "quaver", "quaver", "crotchet"], stepwise: true },
  { rhythms: ["minim", "quaver", "quaver", "quaver", "quaver"], stepwise: true },
  { rhythms: ["crotchet", "quaver", "quaver", "minim"], tieStart: 2 },
  { rhythms: ["crotchet", "quaver", "quaver", "crotchet", "crotchet"], tieStart: 2 },
  { rhythms: ["dotted-crotchet", "quaver", "quaver", "quaver", "crotchet"], tieStart: 1 },
].filter((pattern) => Math.abs(pattern.rhythms.reduce((sum, rhythm) => sum + RHYTHM_BEATS[rhythm], 0) - 4) < 0.001);



function normaliseOptions(saved){const options=Object.fromEntries(Object.keys(DEFAULT_QUESTION_OPTIONS).map(key=>[key,typeof saved?.[key]==='boolean'?saved[key]:true]));return Object.values(options).some(Boolean)?options:{...DEFAULT_QUESTION_OPTIONS};}
function create(random=Math.random){
 const bags=new Map(),recent=[];
 function pick(key,items){const id=key+JSON.stringify(items);let bag=bags.get(id);if(!bag?.items.length){const copy=items.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}if(bag&&copy.length>1&&JSON.stringify(copy.at(-1))===bag.last){const j=copy.findIndex(item=>JSON.stringify(item)!==bag.last);if(j>=0)[copy[j],copy[copy.length-1]]=[copy.at(-1),copy[j]];}bag={items:copy,last:bag?.last};bags.set(id,bag);}const value=bag.items.pop();bag.last=JSON.stringify(value);return value;}
 const defs={higher:{sourceClef:'treble',answerClef:'bass',sourcePool:HIGHER_SOURCE_NOTES,octaves:-1},bassOctaveUp:{sourceClef:'bass',answerClef:'treble',sourcePool:BASS_OCTAVE_SOURCE_NOTES,octaves:1},samePitch:{sourcePool:SAME_PITCH_NOTES,octaves:0},ottavaAlta:{sourceClef:'treble',answerClef:'treble',sourcePool:OTTAVA_SOURCE_NOTES,octaves:1,marking:'8va'},ottavaBassa:{sourceClef:'bass',answerClef:'bass',sourcePool:OTTAVA_BASS_SOURCE_NOTES,octaves:-1,marking:'8vb'}};
 function next(mode='exam',level='H',saved=DEFAULT_QUESTION_OPTIONS,{includeMeaning=true}={}){
  level=level==='AH'?'AH':'H';mode=mode==='practice'?'practice':'exam';
  const options=normaliseOptions(saved),category=level==='AH'?pick('category',Object.keys(options).filter(key=>options[key])):'octaveLower';
  const ottavaTypes=includeMeaning?['ottavaAlta','ottavaBassa','meaning']:['ottavaAlta','ottavaBassa'];
  let id=category==='octaveLower'?'higher':category==='octaveHigher'?'bassOctaveUp':category==='samePitch'?'samePitch':pick('ottava-type',ottavaTypes);
  let meaning=id==='meaning';if(meaning)id=pick('meaning-direction',['ottavaAlta','ottavaBassa']);
  const transform={...defs[id]};if(id==='samePitch'){transform.sourceClef=pick('same-pitch-clef',['treble','bass']);transform.answerClef=transform.sourceClef==='treble'?'bass':'treble';}
  let q;
  for(let attempt=0;attempt<24;attempt++){
   const pattern=pick('pattern-'+id,FOUR_BEAT_PATTERNS),pool=transform.sourcePool;
   const first=pick('first-'+id+'-'+transform.sourceClef,pool.map((_,i)=>i)),indices=[first];
   while(indices.length<pattern.rhythms.length){const previous=indices.at(-1),choices=pattern.stepwise?[previous-1,previous+1].filter(i=>i>=0&&i<pool.length):pool.map((_,i)=>i);indices.push(choices[Math.floor(random()*choices.length)]);}
   if(pattern.tieStart!=null)indices[pattern.tieStart+1]=indices[pattern.tieStart];
   const singleIndex=pick('single-'+id+'-'+transform.sourceClef,pool.map((_,i)=>i));
   const source=noteItem(pool[singleIndex],transform.sourceClef),answer=noteItem(transposePitch(pool[singleIndex],transform.octaves),transform.answerClef);
   const passage=pattern.rhythms.map((rhythm,i)=>({rhythm,noteIndex:indices[i],source:noteItem(pool[indices[i]],transform.sourceClef,rhythm),answer:noteItem(transposePitch(pool[indices[i]],transform.octaves),transform.answerClef,rhythm),tieToNext:pattern.tieStart===i}));
   q={id:random().toString(36).slice(2),mode,level,category,transformId:meaning?'meaning-'+transform.marking:id,sourceClef:transform.sourceClef,answerClef:transform.answerClef,marking:transform.marking||null,singleIndex,singleSource:source,singleAnswer:answer,passage,...(meaning?{type:'meaning',correctMeaning:transform.octaves===1?'higher':'lower'}:{})};
   const signature=fingerprint(q);if(!(mode==="practice"?recent.slice(-1):recent).includes(signature)||meaning)break;
  }
  recent.push(fingerprint(q));if(recent.length>24)recent.shift();return q;
 }
 return {next};
}
function fingerprint(q){return JSON.stringify([q.mode,q.transformId,q.sourceClef,q.type==='meaning'?q.marking:q.mode==='practice'?q.singleSource.index:q.passage.map(i=>[i.rhythm,i.source.index,i.tieToNext])]);}
function isCorrectMeaningAnswer(answer,direction,marking=null){const text=String(answer).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),words=text.split(/\s+/),higher=marking?marking==='8va':direction==='higher',right=higher?['higher','up','above']:['lower','down','below'],wrong=higher?['lower','down','below']:['higher','up','above'];return words.includes('octave')&&right.some(word=>words.includes(word))&&!wrong.some(word=>words.includes(word))&&!words.some(word=>['not','two','2'].includes(word))&&(words.some(word=>['an','one','1'].includes(word))||right.some(word=>text.includes('octave '+word)));}
return {create,normaliseOptions,fingerprint,isCorrectMeaningAnswer,pitch,pitchFromIndex,transposePitch,stepForClef,noteItem,pitchRange,HIGHER_SOURCE_NOTES,SAME_PITCH_NOTES,BASS_OCTAVE_SOURCE_NOTES,OTTAVA_SOURCE_NOTES,OTTAVA_BASS_SOURCE_NOTES,RHYTHMS,TOOLS,DEFAULT_QUESTION_OPTIONS,RHYTHM_BEATS,RHYTHM_SPACING,FOUR_BEAT_PATTERNS};
});
