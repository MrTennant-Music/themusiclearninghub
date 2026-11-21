(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NOTE_IDENTIFICATION_CORE=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
const SHARPS = { A: "A#", B: null, C: "C#", D: "D#", E: null, F: "F#", G: "G#" };
const FLATS = { A: "Ab", B: "Bb", C: null, D: "Db", E: "Eb", F: null, G: "Gb" };
const LEVELS = {
      N3: {
        label: "National 3",
        description: "Lines and spaces of the treble clef",
        settings: { accidentals: false, ledger: false, treble: true, bass: false, advancedRange: false },
      },
      N4: {
        label: "National 4",
        description: "C–A’ — range of notes from middle C to first ledger line A",
        settings: { accidentals: false, ledger: true, treble: true, bass: false, advancedRange: false },
      },
      N5: {
        label: "National 5",
        description: "Tones, semitones, accidentals — flats, sharps and naturals",
        settings: { accidentals: true, ledger: true, treble: true, bass: false, advancedRange: false },
      },
      H: {
        label: "Higher",
        description: "Bass clef — E–C — range of notes from E below the stave to middle C",
        settings: { accidentals: true, ledger: true, treble: true, bass: true, advancedRange: false },
      },
      AH: {
        label: "Advanced Higher",
        description: "Bass clef C–E two ledger lines below stave to two ledger lines above",
        settings: { accidentals: true, ledger: true, treble: true, bass: true, advancedRange: true },
      },
    };
const NOTE_DATA = [
      { pitch: "A3", answer: "A", clef: "treble", step: -4 },
      { pitch: "B3", answer: "B", clef: "treble", step: -3 },
      { pitch: "C4", answer: "C", clef: "treble", step: -2 },
      { pitch: "D4", answer: "D", clef: "treble", step: -1 },
      { pitch: "E4", answer: "E", clef: "treble", step: 0 },
      { pitch: "F4", answer: "F", clef: "treble", step: 1 },
      { pitch: "G4", answer: "G", clef: "treble", step: 2 },
      { pitch: "A4", answer: "A", clef: "treble", step: 3 },
      { pitch: "B4", answer: "B", clef: "treble", step: 4 },
      { pitch: "C5", answer: "C", clef: "treble", step: 5 },
      { pitch: "D5", answer: "D", clef: "treble", step: 6 },
      { pitch: "E5", answer: "E", clef: "treble", step: 7 },
      { pitch: "F5", answer: "F", clef: "treble", step: 8 },
      { pitch: "G5", answer: "G", clef: "treble", step: 9 },
      { pitch: "A5", answer: "A", clef: "treble", step: 10 },
      { pitch: "B5", answer: "B", clef: "treble", step: 11 },
      { pitch: "C6", answer: "C", clef: "treble", step: 12 },

      { pitch: "C2", answer: "C", clef: "bass", step: -4 },
      { pitch: "D2", answer: "D", clef: "bass", step: -3 },
      { pitch: "E2", answer: "E", clef: "bass", step: -2 },
      { pitch: "F2", answer: "F", clef: "bass", step: -1 },
      { pitch: "G2", answer: "G", clef: "bass", step: 0 },
      { pitch: "A2", answer: "A", clef: "bass", step: 1 },
      { pitch: "B2", answer: "B", clef: "bass", step: 2 },
      { pitch: "C3", answer: "C", clef: "bass", step: 3 },
      { pitch: "D3", answer: "D", clef: "bass", step: 4 },
      { pitch: "E3", answer: "E", clef: "bass", step: 5 },
      { pitch: "F3", answer: "F", clef: "bass", step: 6 },
      { pitch: "G3", answer: "G", clef: "bass", step: 7 },
      { pitch: "A3", answer: "A", clef: "bass", step: 8 },
      { pitch: "B3", answer: "B", clef: "bass", step: 9 },
      { pitch: "C4", answer: "C", clef: "bass", step: 10 },
      { pitch: "D4", answer: "D", clef: "bass", step: 11 },
      { pitch: "E4", answer: "E", clef: "bass", step: 12 },
    ];
const ADVANCED_ONLY = new Set(["A3-treble", "B3-treble", "B5-treble", "C6-treble", "C2-bass", "D2-bass", "D4-bass", "E4-bass"]);

function normaliseSettings(saved,level='N3'){
 const defaults=(LEVELS[level]||LEVELS.N3).settings,settings=Object.fromEntries(Object.keys(defaults).map(key=>[key,typeof saved?.[key]==='boolean'?saved[key]:defaults[key]]));
 if(!settings.treble&&!settings.bass){settings.treble=defaults.treble;settings.bass=defaults.bass;}
 return settings;
}
function possibleQuestions(settings){return NOTE_DATA.filter(note=>(note.clef==='treble'?settings.treble:settings.bass)&&(settings.ledger||note.step>=0&&note.step<=8)&&(settings.advancedRange||!ADVANCED_ONLY.has(note.pitch+'-'+note.clef)));}
function variants(settings){return possibleQuestions(settings).flatMap(note=>{const baseId=note.pitch+'-'+note.clef,base={...note,baseId};const result=[{...base,accidental:null}];if(settings.accidentals){result.push({...base,accidental:'natural'});if(SHARPS[note.answer])result.push({...base,answer:SHARPS[note.answer],accidental:'sharp'});if(FLATS[note.answer])result.push({...base,answer:FLATS[note.answer],accidental:'flat'});}return result;});}
const position=q=>q.baseId||q.pitch+'-'+q.clef;
const identity=q=>JSON.stringify([q.pitch,q.clef,q.answer,q.accidental||'']);
function createFromPool(pool,random=Math.random){
 const clefCounts=new Map(),answerCounts=new Map(),noteCounts=new Map();let serial=0,last=null;
 function least(items,counts,key,rng){const minimum=Math.min(...items.map(item=>counts.get(key(item))||0)),candidates=items.filter(item=>(counts.get(key(item))||0)===minimum),value=rng(),fraction=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;return candidates[Math.min(candidates.length-1,Math.floor(fraction*candidates.length))];}
 return {next(previous=last,rng=random){
   const previousId=typeof previous==='string'?previous:previous?position(previous):null;
   const alternatives=pool.filter(q=>position(q)!==previousId),available=alternatives.length?alternatives:pool;
   if(!available.length)throw new RangeError('Enable at least one available clef.');
   const clefs=[...new Set(available.map(q=>q.clef))],clef=least(clefs,clefCounts,value=>value,rng),clefPool=available.filter(q=>q.clef===clef);
   const answers=[...new Set(clefPool.map(q=>q.answer))],answer=least(answers,answerCounts,value=>clef+'/'+value,rng);
   const note=least(clefPool.filter(q=>q.answer===answer),noteCounts,identity,rng);
   clefCounts.set(clef,(clefCounts.get(clef)||0)+1);answerCounts.set(clef+'/'+answer,(answerCounts.get(clef+'/'+answer)||0)+1);noteCounts.set(identity(note),(noteCounts.get(identity(note))||0)+1);last=position(note);
   return {...note,id:'note-'+(++serial)};
 }};
}
function create(random=Math.random){const setups=new Map();return {next(settings,previous){const safe=normaliseSettings(settings),key=JSON.stringify(safe);if(!setups.has(key))setups.set(key,createFromPool(variants(safe),random));return setups.get(key).next(previous);}};}
return {LETTERS,SHARPS,FLATS,LEVELS,NOTE_DATA,ADVANCED_ONLY,normaliseSettings,possibleQuestions,variants,create,createFromPool};
});
