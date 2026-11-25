(function () {
  const NOTES = [
    { name: "A3", letter: "A", octave: 3, step: -4 }, { name: "B3", letter: "B", octave: 3, step: -3 },
    { name: "C4", letter: "C", octave: 4, step: -2 }, { name: "D4", letter: "D", octave: 4, step: -1 },
    { name: "E4", letter: "E", octave: 4, step: 0 }, { name: "F4", letter: "F", octave: 4, step: 1 },
    { name: "G4", letter: "G", octave: 4, step: 2 }, { name: "A4", letter: "A", octave: 4, step: 3 },
    { name: "B4", letter: "B", octave: 4, step: 4 }, { name: "C5", letter: "C", octave: 5, step: 5 },
    { name: "D5", letter: "D", octave: 5, step: 6 }, { name: "E5", letter: "E", octave: 5, step: 7 },
    { name: "F5", letter: "F", octave: 5, step: 8 }, { name: "G5", letter: "G", octave: 5, step: 9 },
    { name: "A5", letter: "A", octave: 5, step: 10 }, { name: "B5", letter: "B", octave: 5, step: 11 },
    { name: "C6", letter: "C", octave: 6, step: 12 },
  ];
  const INTERVALS = [{ size: 2, label: "2nd" }, { size: 3, label: "3rd" }, { size: 4, label: "4th" }, { size: 5, label: "5th" }, { size: 6, label: "6th" }, { size: 7, label: "7th" }, { size: 8, label: "Octave" }];
  const LEVEL_INTERVALS = { N5: [2, 8], H: [2, 3, 4, 5, 6, 7, 8], AH: [2, 3, 4, 5, 6, 7, 8, "tritone", "augmented-4th", "diminished-5th"] };
  const KEY_SIGNATURES = { C: { label: "C major", accidentals: [] }, G: { label: "G major", accidentals: [{ type: "sharp", step: 8, letter: "F" }] }, F: { label: "F major", accidentals: [{ type: "flat", step: 4, letter: "B" }] }, D: { label: "D major", accidentals: [{ type: "sharp", step: 8, letter: "F" }, { type: "sharp", step: 5, letter: "C" }] }, Bb: { label: "B flat major", accidentals: [{ type: "flat", step: 4, letter: "B" }, { type: "flat", step: 7, letter: "E" }] } };
  const CHROMATIC_INTERVALS = [{ id: "tritone-f-b", startIndex: 5, endIndex: 8, key: "C" }, { id: "augmented-4th-c-fsharp", startIndex: 2, endIndex: 5, key: "C", targetAccidental: "sharp" }, { id: "augmented-4th-g-csharp", startIndex: 6, endIndex: 9, key: "D" }, { id: "diminished-5th-b-f", startIndex: 8, endIndex: 12, key: "C" }, { id: "diminished-5th-e-bflat", startIndex: 4, endIndex: 8, key: "F" }, { id: "diminished-5th-a-eflat", startIndex: 7, endIndex: 11, key: "Bb" }];
  const CHROMATIC_INTERVAL_WEIGHTS = CHROMATIC_INTERVALS.flatMap((interval) => interval.id.startsWith("tritone") ? [interval, interval, null] : [interval, interval]);
  const CREATE_TRITONE_INTERVALS = CHROMATIC_INTERVALS.filter((interval) => !interval.targetAccidental);
  const NATURAL_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function randomItem(items, random) { return items[Math.floor(random() * items.length)]; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function noteByIndex(index) { return NOTES[clamp(index, 0, NOTES.length - 1)]; }
  function accidentalOffset(type) { return type === "sharp" ? 1 : type === "flat" ? -1 : 0; }
  function keySignatureAccidental(note, keySignature) { return keySignature.find((item) => item.letter === note.letter)?.type || null; }
  function writtenPitch(note, keySignature, explicitAccidental) { return note.octave * 12 + NATURAL_SEMITONES[note.letter] + accidentalOffset(explicitAccidental || keySignatureAccidental(note, keySignature)); }
  function semitoneDistance(startIndex, endIndex, keySignature = [], targetAccidental = null) { return Math.abs(writtenPitch(noteByIndex(endIndex), keySignature, targetAccidental) - writtenPitch(noteByIndex(startIndex), keySignature)); }
  function intervalLabel(size) {
    if (typeof size === "string") return ({ tritone: "Tritone", "augmented-4th": "Augmented 4th", "diminished-5th": "Diminished 5th" })[size.toLowerCase()] || size;
    return INTERVALS.find((interval) => interval.size === size)?.label || `${size}th`;
  }
  function intervalNameFromHalfSteps(startIndex, endIndex, keySignature, targetAccidental) {
    const diatonicSize = Math.abs(endIndex - startIndex) + 1;
    const halfSteps = semitoneDistance(startIndex, endIndex, keySignature, targetAccidental);
    if (halfSteps === 4 && diatonicSize === 4) return "Diminished 4th";
    if (halfSteps === 6 && diatonicSize === 4) return "Augmented 4th";
    if (halfSteps === 6 && diatonicSize === 5) return "Diminished 5th";
    if (halfSteps === 8 && diatonicSize === 5) return "Augmented 5th";
    if (halfSteps === 6) return "Tritone";
    return intervalLabel(diatonicSize);
  }
  function noteIndexesForLevel(level) {
    const range = level === "AH" ? { min: -4, max: 12 } : { min: -2, max: 10 };
    return NOTES.map((note, index) => ({ note, index })).filter(({ note }) => note.step >= range.min && note.step <= range.max).map(({ index }) => index);
  }
  function intervalsForLevel(level) { return (LEVEL_INTERVALS[level] || LEVEL_INTERVALS.N5).filter((item) => typeof item === "number").map((size) => INTERVALS.find((interval) => interval.size === size)); }
  function isPlainIntervalQuestion(startIndex, endIndex) { const label = intervalNameFromHalfSteps(startIndex, endIndex); return !label.startsWith("Augmented") && !label.startsWith("Diminished") && label !== "Tritone"; }
  function decorate(question) {
    const createLabel = intervalLabel(question.intervalSize).toLowerCase();
    const createPrompt = createLabel === "tritone" ? `Write a note a tritone ${question.direction} than the note given.` : `Create an interval ${createLabel} ${question.direction} than the note given.`;
    return { ...question, activityId: "intervals", prompt: question.level === "N3" ? "Is the movement a step or a leap?" : question.type === "create" ? createPrompt : "Identify the interval.", answerText: question.answer || intervalLabel(question.intervalSize), answerData: { interval: question.answer || intervalLabel(question.intervalSize), targetIndex: question.targetIndex ?? question.endIndex }, marks: 1, metadata: { level: question.level, mode: question.type } };
  }
  function normaliseModes(saved){const modes={identify:typeof saved?.identify==='boolean'?saved.identify:true,create:typeof saved?.create==='boolean'?saved.create:true};if(!modes.identify&&!modes.create)modes.identify=true;return modes;}
  function create(random=Math.random){
    const bags=new Map(),variantCounts=new Map();let last='',serial=0;
    function pick(name,items){const id=name+JSON.stringify(items);let bag=bags.get(id);if(!bag?.values.length){const values=items.slice();for(let i=values.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}if(bag&&values.length>1&&JSON.stringify(values.at(-1))===bag.last){const i=values.findIndex(value=>JSON.stringify(value)!==bag.last);if(i>=0)[values[i],values[values.length-1]]=[values.at(-1),values[i]];}bag={values,last:bag?.last};bags.set(id,bag);}const value=bag.values.pop();bag.last=JSON.stringify(value);return value;}
    function pickMode(modes,level='H'){const safe=normaliseModes(modes);return pick(level+'/mode',['identify','create'].filter(mode=>safe[mode]));}
    return {pickMode,next(config={}){
      const level=['N3','N5','H','AH'].includes(config.level)?config.level:'N5',type=['N3','N5'].includes(level)?'identify':['identify','create'].includes(config.mode)?config.mode:pickMode(config.enabledModes,level),name=level+'/'+type;
      const codeSize=config.codeIntervalSize;
      const chromatic=level==='AH'&&(!codeSize||codeSize===4||codeSize===5)&&pick(name+'/chromatic',type==='identify'?[true,true,false,false,false]:[true,false,false,false,false]);
      let answer,intervalSize,variants=[];
      const allowed=new Set(noteIndexesForLevel(level));
      if(chromatic){
        const categories=codeSize===4?['Tritone','Augmented 4th']:codeSize===5?['Diminished 5th']:['Tritone','Augmented 4th','Diminished 5th'];
        const category=type==='create'?'Tritone':pick(name+'/chromatic-answer',categories);answer=category;intervalSize=category==='Tritone'?'tritone':category;
        const templates=type==='create'?CREATE_TRITONE_INTERVALS:CHROMATIC_INTERVALS.filter(item=>category==='Tritone'?item.id.startsWith('tritone'):category==='Augmented 4th'?item.id.startsWith('augmented'):item.id.startsWith('diminished'));
        for(const template of templates)for(const shift of [-7,0,7]){const first=template.startIndex+shift,second=template.endIndex+shift;if(!allowed.has(first)||!allowed.has(second))continue;for(const lower of [false,true]){const startIndex=lower?second:first,endIndex=lower?first:second;variants.push({startIndex,...(type==='create'?{targetIndex:endIndex}:{endIndex}),startAccidental:lower?template.targetAccidental||null:null,targetAccidental:lower?null:template.targetAccidental||null,keySignature:KEY_SIGNATURES[template.key].accidentals,direction:lower?'lower':'higher'});}}
      }else{
        const interval=INTERVALS.find(item=>item.size===codeSize)??(level==='N3'?(pick(name+'/step-leap',[true,false])?INTERVALS[0]:pick(name+'/leap-size',INTERVALS.slice(1))):pick(name+'/interval',intervalsForLevel(level)));
        intervalSize=level==='N3'?(interval.size===2?'Step':'Leap'):interval.size;answer=level==='N3'?intervalSize:interval.label;
        const distance=interval.size-1;
        for(const startIndex of allowed)for(const lower of [false,true]){const endIndex=startIndex+(lower?-distance:distance);if(allowed.has(endIndex)&&isPlainIntervalQuestion(startIndex,endIndex))variants.push({startIndex,...(type==='create'?{targetIndex:endIndex}:{endIndex}),direction:lower?'lower':'higher'});}
      }
      if(!chromatic&&intervalSize===2){const distance=pick(name+'/second-kind',[1,2]);variants=variants.filter(v=>semitoneDistance(v.startIndex,v.endIndex??v.targetIndex)===distance);}
      const direction=pick(name+'/'+answer+'/direction',['higher','lower']);
      const blocked=config.excludeSignatures||new Set();
      const signature=v=>questionSignature({...v,type,intervalSize});
      if(config.excludeSignatures&&variants.every(v=>blocked.has(signature(v)))&&(config._retry||0)<24)return this.next({...config,_retry:(config._retry||0)+1});
      let available=variants.filter(v=>v.direction===direction&&!blocked.has(signature(v))&&signature(v)!==last);
      if(!available.length)available=variants.filter(v=>!blocked.has(signature(v))&&signature(v)!==last);
      if(!available.length)available=variants.filter(v=>signature(v)!==last);
      if(!available.length)available=variants;
      const minimum=Math.min(...available.map(v=>variantCounts.get(name+signature(v))||0)),variant=pick(name+'/'+answer+'/position',available.filter(v=>(variantCounts.get(name+signature(v))||0)===minimum));
      variantCounts.set(name+signature(variant),(variantCounts.get(name+signature(variant))||0)+1);last=signature(variant);
      const typedMode=type==='identify'&&(chromatic||level!=='N3'&&pick(name+'/input',Array.from({length:20},(_,i)=>i<7)));
      return decorate({id:'interval-'+(++serial),level,type,chromatic,typedMode,...variant,intervalSize,answer});
    }};
  }
  const generators=new WeakMap();
  function generator(random=Math.random){if(!generators.has(random))generators.set(random,create(random));return generators.get(random);}
  function generateQuestion(config={}){return generator(config.random||Math.random).next(config);}
  function pickMode(modes,level,random){return generator(random).pickMode(modes,level);}
  function questionSignature(question) { return JSON.stringify([question.type, question.startIndex, question.endIndex, question.targetIndex, question.intervalSize, question.startAccidental, question.targetAccidental, question.keySignature]); }
  window.MLHIntervalsWorksheet = { create, normaliseModes, pickMode, generateQuestion, questionSignature, noteByIndex, notes: NOTES, intervalLabel };
}());
