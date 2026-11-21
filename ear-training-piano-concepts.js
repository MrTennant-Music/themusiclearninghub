// Piano-suitable listening concepts layered onto the core Ear Training generator.
(function attachPianoConceptExercises(root) {
  "use strict";

  const MLH = root.MLH;
  const core = MLH?.EarTrainingExercises;
  if (!core) throw new Error("Ear Training core must load before piano concepts");
  const choose = items => items[Math.floor(Math.random() * items.length)];
  const rank = core.LEVEL_RANK;
  const makePassage = core.makePassage;

  const topics = {
    intervalRecognition: { label:"Intervals", icon:"./app-icons/intervals-icon.svg", introduced:"H", preserveLevel:true, supportsIsolated:true },
    accompanimentDevices: { label:"Harmonic Devices", icon:"./app-icons/composition-studio-icon.svg?v=shared-border-20261114", introduced:"N4", preserveLevel:true },
    steadyTempo: { label:"Tempo", icon:"./app-icons/tempo-icon.svg", introduced:"N3", preserveLevel:true },
    melodicMotion: { label:"Melodic Motion", icon:"./app-icons/scale-degrees-icon.svg", introduced:"N5", preserveLevel:true, supportsIsolated:true },
    melodicTransformation: { label:"Melodic Transformations", icon:"./app-icons/insert-missing-notes-icon.svg", introduced:"AH", preserveLevel:true, supportsIsolated:true },
    vamp: { label:"Harmonic Devices", icon:"./app-icons/composition-studio-icon.svg?v=shared-border-20261114", introduced:"N4", preserveLevel:true },
    suspension: { label:"Harmonic Devices", icon:"./app-icons/chords-icon.svg", introduced:"AH", preserveLevel:true },
  };

  const concept = (label, family, introduced, aliases = []) => ({ label, short:label, family, introduced, aliases:[label, ...aliases] });
  const concepts = {
    "interval-semitone": concept("Semitone","intervalRecognition","H",["minor second"]),
    "interval-tone": concept("Tone","intervalRecognition","H",["whole tone","major second"]),
    "interval-tritone": concept("Tritone","intervalRecognition","AH",["augmented fourth","diminished fifth"]),
    "interval-octave": concept("Octave","intervalRecognition","H"),
    "device-pedal": concept("Pedal","accompanimentDevices","N4",["pedal point"]),
    "device-no-pedal": concept("No pedal","accompanimentDevices","N4",["without a pedal","no"]),
    "device-inverted-pedal": concept("Inverted pedal","accompanimentDevices","N5"),
    "tempo-adagio": concept("Adagio","steadyTempo","N3",["slow"]),
    "tempo-andante": concept("Andante","steadyTempo","N4",["walking pace"]),
    "tempo-allegro": concept("Allegro","steadyTempo","N3",["fast"]),
    "motion-contrary": concept("Contrary motion","melodicMotion","N5"),
    "motion-no-contrary": concept("No contrary motion","melodicMotion","N5",["not contrary","no"]),
    "transform-inversion": concept("Inversion","melodicTransformation","AH",["inverted"]),
    "transform-retrograde": concept("Retrograde","melodicTransformation","AH",["backwards"]),
    "vamp-yes": concept("Vamp","vamp","N4",["yes","vamp accompaniment"]),
    "vamp-no": concept("No vamp","vamp","N4",["no","without a vamp"]),
    "suspension-yes": concept("Suspension","suspension","AH",["yes"]),
    "suspension-no": concept("No suspension","suspension","AH",["no"]),
  };

  const idsByFamily = Object.fromEntries(Object.keys(topics).map(family => [family, Object.keys(concepts).filter(id => concepts[id].family === family)]));
  function refresh(passage) {
    return { ...passage, notes:passage.bars.flatMap(bar=>bar.notes.map(note=>({...note,beat:bar.barIndex*passage.timeSignature.beats+note.beat}))) };
  }
  function finish(base, args, isolatedPlan) {
    const isolatedPassage = base.isolatedPassage || (isolatedPlan ? core.isolatePassage(base, isolatedPlan) : null);
    return { ...base, type:args.topic, level:args.level, answerId:args.answerId, answer:concepts[args.answerId], options:args.options, mode:args.mode, ...(isolatedPassage?{isolatedPassage}:{}) };
  }

  const intervalSemitones={"interval-semitone":1,"interval-tone":2,"interval-tritone":6,"interval-octave":12};
  function buildTritonePassage(result) {
    const tonic=result.key.tonic;
    const tonicThird=result.key.major?4:3;
    const dominantVoicing=[tonic-5,tonic-1,tonic+2,tonic+5];
    const tonicVoicing=[tonic-12,tonic-12+tonicThird,tonic-5];
    const firstDirection=choose([1,-1]);
    const targetDirections=Array.from({length:Math.ceil(result.bars.length/2)},(_,index)=>index%2===0?firstDirection:-firstDirection);
    const targetPitches=[tonic+11,tonic+17];
    const sparseHarmony=(pitches,bass)=>[
      {beat:0,beats:3.8,pitches:[bass],volume:1.05},
      {beat:0,beats:3.8,pitches,volume:.56},
    ];
    const bars=result.bars.map((bar,index)=>{
      const targetBar=index%2===0;
      if(targetBar){
        const direction=targetDirections[index/2];
        const ordered=direction===1?targetPitches:[...targetPitches].reverse();
        return {
          ...bar,
          harmonicFunction:"dominant-seventh",
          chordSymbol:"V7",
          notes:[
            {...bar.notes[0],midi:ordered[0],soundingMidi:ordered[0]},
            {...bar.notes[1],midi:ordered[1],soundingMidi:ordered[1]},
          ],
          generatedAccompaniment:false,
          accompanimentHarmony:[{beat:0,beats:4,pitches:dominantVoicing,volume:1}],
          accompaniment:sparseHarmony(dominantVoicing,tonic-17),
        };
      }
      const direction=targetDirections[(index-1)/2];
      const resolutionPitch=direction===1?tonic+12+tonicThird:tonic+12;
      return {
        ...bar,
        harmonicFunction:"tonic-resolution",
        chordSymbol:"I",
        notes:[{...bar.notes[0],midi:resolutionPitch,soundingMidi:resolutionPitch,beat:0,beats:4}],
        generatedAccompaniment:false,
        accompanimentHarmony:[{beat:0,beats:4,pitches:tonicVoicing,volume:1}],
        accompaniment:sparseHarmony(tonicVoicing,tonic-24),
      };
    });
    return refresh({...result,bars,tritoneHarmony:"dominant-seventh-resolution"});
  }
  function buildInterval(answerId,{level,variation,intervalDirection="mixed"}={}) {
    const keyId=variation?.keyName||"C",key=core.keys[keyId],signature=variation?.signature||core.signatures["4/4"];
    let tonic=key.tonic;while(tonic<60)tonic+=12;while(tonic>71)tonic-=12;
    const source=core.makeN4ScalePassage({answerId:keyId.endsWith("m")?"scale-minor":"scale-major",keyId,tonicMidi:tonic,signature});
    const distance=intervalSemitones[answerId],pc=n=>((n%12)+12)%12;
    const directions=intervalDirection==="ascending"?[1,1]:intervalDirection==="descending"?[-1,-1]:choose([[1,-1],[-1,1]]);
    const triads=Object.entries(key.chords).filter(([,pitches])=>pitches.length===3);
    const intervalPlacements=[];let previous=tonic;
    const bars=source.bars.map((bar,index)=>{
      const target=[1,5].includes(index),after=[2,6].includes(index);
      let notes=bar.notes.map(note=>({...note})),symbol=bar.chordSymbol,segments=bar.accompanimentHarmony;
      if(target) {
        const direction=directions[index===1?0:1],pairs=[];
        for(let first=57;first<=84;first++) {
          const second=first+direction*distance;if(second<57||second>84)continue;
          if(answerId==="interval-tritone") {
            const pair=new Set([pc(first-key.tonic),pc(second-key.tonic)]);
            if(!pair.has(11)||!pair.has(5))continue;
          } else if(![first,second].every(n=>key.scale.includes(pc(n-key.tonic))))continue;
          const nextChord=answerId==="interval-tritone"?key.chords.I:key.chords[source.bars[index+1].chordSymbol];
          const resolution=Array.from({length:28},(_,i)=>i+57).filter(n=>nextChord.some(p=>pc(p)===pc(n))).sort((a,b)=>Math.abs(a-second)-Math.abs(b-second))[0];
          if(answerId==="interval-octave"&&Math.abs(resolution-second)>2)continue;
          pairs.push({first,second,cost:Math.abs(first-previous)+Math.abs(second-tonic)*.15+Math.random()*8});
        }
        const pair=pairs.sort((a,b)=>a.cost-b.cost)[0];
        if(!pair)throw new Error("Unable to write an interval in the selected register.");
        notes=[pair.first,pair.second].map((midi,i)=>({id:`interval-${index}-${i}`,barIndex:index,beat:i*signature.beats/2,beats:signature.beats/2,midi,soundingMidi:midi,volume:.82,intervalTarget:true,gateRelease:i===0}));
        segments=notes.map(note=>{
          const selected=answerId==="interval-tritone"?["V7",key.chords.V7]:triads.filter(([,pitches])=>pitches.some(p=>pc(p)===pc(note.midi))).sort((a,b)=>(a[0]===symbol?-1:0)-(b[0]===symbol?-1:0))[0];
          return {beat:note.beat,beats:note.beats,chordSymbol:selected[0],pitches:[...selected[1]]};
        });
        symbol=segments[0].chordSymbol;
        intervalPlacements.push({barIndex:index,direction:direction===1?"ascending":"descending",pitches:[pair.first,pair.second],beats:signature.beats/2});
      } else if(after) {
        if(answerId==="interval-tritone")symbol="I";
        const chord=key.chords[symbol],pool=Array.from({length:28},(_,i)=>i+57).filter(n=>chord.some(p=>pc(p)===pc(n)));
        notes=notes.map((note,i)=>{
          const ranked=pool.map(midi=>({midi,cost:Math.abs(midi-(i?note.midi:previous))+(i&&midi===previous?3:0)})).sort((a,b)=>a.cost-b.cost);
          const midi=ranked[0].midi;previous=midi;return {...note,midi,soundingMidi:midi,...(answerId==="interval-octave"&&i===0?{intervalResolution:true}:{})};
        });
        segments=[{beat:0,beats:signature.beats,chordSymbol:symbol,pitches:[...chord]}];
      }
      const accompaniment=segments.flatMap(segment=>{
        const sounding=notes.filter(n=>n.beat<segment.beat+segment.beats&&n.beat+n.beats>segment.beat);
        const pitches=segment.pitches.map(p=>{while(p<45)p+=12;while(p>64)p-=12;return p;}).filter(p=>answerId==="interval-tritone"&&target||sounding.every(n=>![1,6,11].includes(pc(n.midi-p))));
        return pitches.length?[{beat:segment.beat,beats:segment.beats*.9,pitches,volume:.8/Math.sqrt(pitches.length),gateRelease:true,role:"interval-harmony"}]:[];
      });
      previous=notes.at(-1).midi;
      return {...bar,chordSymbol:symbol,notes,accompaniment,accompanimentHarmony:segments,generatedAccompaniment:false,...(answerId==="interval-tritone"?{harmonicFunction:target?"dominant-seventh":after?"tonic-resolution":null}:{})};
    });
    const result=refresh({...source,bars,intervalStudy:true,...(answerId==="interval-tritone"?{tritoneHarmony:"dominant-seventh-resolution"}:{}),intervalDirection,intervalPlacements,intervalDistance:distance,intervalExcerptBars:8,tempoPulseBeats:signature.pulseQuarterBeats});
    const first=bars[intervalPlacements[0].barIndex];
    const isolatedNotes=first.notes.map((note,i)=>({...note,barIndex:0,beat:i,beats:1}));
    result.isolatedPassage={...result,bars:[{...first,barIndex:0,notes:isolatedNotes,accompaniment:[],accompanimentHarmony:[]}],notes:isolatedNotes,totalBeats:2,barCount:1,timeSignature:{id:"2/4",top:2,bottom:4,beats:2,pulseCount:2,pulseQuarterBeats:1,pulseOffsets:[0,1],type:"simple"},intervalPlacements:[],tempoPulseBeats:1};
    result.isolatedPassage.melodyPlan={...source.melodyPlan,timeSignatureId:"2/4",bars:result.isolatedPassage.bars};
    return result;
  }
  function buildDevice(answerId,{level,variation}={}) {
    if(["N4","N5","H","AH"].includes(level)) return core.makeN4HarmonicPassage(answerId==="device-inverted-pedal"?"invertedPedal":"pedal",["device-pedal","device-inverted-pedal"].includes(answerId));
    const progression=["I","IV","V","I","VI","IV","V","I"];
    const result=makePassage({silentAccompaniment:true,progression,signature:variation?.signature});
    const key=result.key;
    const tonic=key.chords.I[0], lowTonic=tonic-12, lowDominant=lowTonic+7;
    const pedalNoteBeats=choose([1,.5]);
    result.bars=result.bars.map((bar,index)=>{
      let accompaniment;
      const chord=key.chords[bar.chordSymbol] || key.chords.I;
      if(answerId==="device-pedal") accompaniment=[...Array.from({length:Math.round(result.timeSignature.beats/pedalNoteBeats)},(_,index)=>({beat:index*pedalNoteBeats,beats:pedalNoteBeats*.88,pitches:[lowTonic],volume:(.078*.82*.8)/.018,role:"pedal"})),{beat:0,beats:result.timeSignature.beats*.95,pitches:chord,volume:.55}];
      else if(answerId==="device-inverted-pedal") accompaniment=[{beat:0,beats:result.timeSignature.beats,pitches:[key.tonic+12],volume:1.15},{beat:0,beats:result.timeSignature.beats*.95,pitches:chord,volume:.55}];
      else accompaniment=[{beat:0,beats:result.timeSignature.beats*.95,pitches:chord,volume:.9}];
      return {...bar,accompaniment,accompanimentHarmony:accompaniment};
    });
    return refresh({...result,...(answerId==="device-pedal"?{pedalNoteBeats}: {})});
  }
  const tempos={"tempo-adagio":{id:"adagio",label:"Adagio",bpm:60},"tempo-andante":{id:"andante",label:"Andante",bpm:80},"tempo-allegro":{id:"allegro",label:"Allegro",bpm:100}};
  function buildTempo(answerId,{level}={}){
    const clearPulse=["N3","N4","N5"].includes(level);
    const barCount=clearPulse?8:16;
    return {
      ...(clearPulse?core.makeTempoListeningPassage():makePassage({barCount,fullPassage:barCount>=16})),
      playbackTempo:tempos[answerId],
      tempoExcerptBars:barCount,
      tempoPhraseLength:4,
      tempoCadence:"perfect",
    };
  }
  function makeN5MotionPassage({keyId,signature,contrary}) {
    const sourceKey=core.keys[keyId];
    const tonic=[sourceKey.tonic,sourceKey.tonic+12,sourceKey.tonic-12].find(pitch=>pitch-1>=57&&pitch+14<=84);
    const key={...sourceKey,tonic};
    const midi=degree=>tonic+Math.floor(degree/7)*12+key.scale[((degree%7)+7)%7];
    const pc=pitch=>((pitch%12)+12)%12;
    const degrees=Array.from({length:43},(_,index)=>index-14).filter(degree=>midi(degree)>=57&&midi(degree)<=84);
    const pairs=degrees.flatMap(lower=>degrees.filter(upper=>{
      const gap=midi(upper)-midi(lower);
      return gap>=7&&gap<=24&&[0,3,4,7,8,9].includes(gap%12);
    }).map(upper=>({lower,upper,lowMidi:midi(lower),highMidi:midi(upper)})));
    const pulse=signature.pulseQuarterBeats,progression=["I","IV","V","I","I","IV","V","I"];
    const pulseRhythm=Array.from({length:signature.pulseCount},()=>pulse);
    // Both answers use the same uncluttered pulse rhythm, so the relationship
    // between the two lines is the cue rather than a rhythmic difference.
    const rhythms=[pulseRhythm,pulseRhythm,pulseRhythm,[signature.beats],pulseRhythm,pulseRhythm,pulseRhythm,[signature.beats]];
    const events=rhythms.flatMap((durations,barIndex)=>{
      let beat=0;
      return durations.map((beats,noteIndex)=>{const event={barIndex,noteIndex,beat,beats};beat+=beats;return event;});
    });
    const final=contrary?{lower:0,upper:7}:{lower:2,upper:7};
    const dominant=contrary?{lower:-1,upper:8}:{lower:1,upper:6};
    const options=events.map((event,index)=>{
      const chord=new Set(key.chords[progression[event.barIndex]].map(pc));
      const strong=event.beat===0||(signature.id==="4/4"&&event.beat===2);
      return pairs.filter(pair=>{
        if(index===events.length-1) return pair.lower===final.lower&&pair.upper===final.upper;
        if(event.barIndex===6&&event.noteIndex===rhythms[6].length-1) return pair.lower===dominant.lower&&pair.upper===dominant.upper;
        if(index===0) return [pair.lowMidi,pair.highMidi].some(pitch=>pc(pitch)===pc(tonic))&&[pair.lowMidi,pair.highMidi].some(pitch=>pc(pitch)===pc(tonic+key.scale[2]));
        return !strong||(chord.has(pc(pair.lowMidi))&&chord.has(pc(pair.highMidi)));
      });
    });
    const connects=(a,b,index)=>{
      const low=b.lowMidi-a.lowMidi,high=b.highMidi-a.highMidi;
      if(Math.sign(low)*Math.sign(high)!==(contrary?-1:1)) return false;
      const limit=events[index].barIndex===events[index-1].barIndex?5:7;
      if(Math.abs(low)>limit||Math.abs(high)>limit) return false;
      return !(Math.abs(b.lower-a.lower)===1&&Math.abs(low)===3)&&!(Math.abs(b.upper-a.upper)===1&&Math.abs(high)===3);
    };
    // Work backwards from the cadence so a locally attractive pair cannot
    // force a later crossing, dissonance or out-of-range octave adjustment.
    const viable=options.map(()=>[]);
    viable[events.length-1]=options.at(-1);
    for(let index=events.length-2;index>=0;index--) viable[index]=options[index].filter(pair=>viable[index+1].some(next=>connects(pair,next,index+1)));
    if(!viable[0].length) throw new Error(`Unable to plan two-part motion in ${keyId} ${signature.id}.`);
    // Plan the whole phrase: reward continuing a direction so pupils hear
    // the lines opening out and closing in, rather than incessant zigzags.
    let paths=viable[0].map(pair=>({pair,direction:0,cost:Math.random()*6,path:[pair]}));
    for(let index=1;index<events.length;index++) {
      const next=[];
      for(const pair of viable[index]) {
        const bestByDirection=new Map();
        for(const previous of paths) {
          if(!connects(previous.pair,pair,index))continue;
          const direction=Math.sign(pair.lowMidi-previous.pair.lowMidi);
          const reversal=previous.direction&&direction!==previous.direction?14:0;
          const travel=Math.abs(pair.lowMidi-previous.pair.lowMidi)+Math.abs(pair.highMidi-previous.pair.highMidi);
          const cost=previous.cost+reversal+travel*.25+Math.abs(pair.highMidi-pair.lowMidi-16)*.12+Math.random()*5;
          const candidate={pair,direction,cost,path:[...previous.path,pair]};
          if(!bestByDirection.has(direction)||cost<bestByDirection.get(direction).cost)bestByDirection.set(direction,candidate);
        }
        next.push(...bestByDirection.values());
      }
      paths=next;
    }
    paths.sort((a,b)=>a.cost-b.cost);
    const chosen=paths[0].path;
    const base={id:`motion-${Date.now()}-${Math.random()}`,type:"melodicMotion",level:"N5",key,timeSignature:{...signature},barCount:8,totalBeats:8*signature.beats,accompanimentPattern:"block_chords",tempoPulseBeats:pulse};
    const voices=["lower","upper"].map((part,voiceIndex)=>{
      const bars=rhythms.map((_,barIndex)=>({barIndex,chordSymbol:progression[barIndex],notes:events.flatMap((event,index)=>event.barIndex===barIndex?[{
        id:`motion-${part}-${barIndex}-${event.noteIndex}`,barIndex,beat:event.beat,beats:event.beats,relativeStep:chosen[index][part],midi:midi(chosen[index][part]),soundingMidi:midi(chosen[index][part]),volume:.82,
      }]:[]),accompaniment:[],accompanimentHarmony:[],generatedAccompaniment:false}));
      return core.synchroniseMelodyPlan(refresh({...base,pan:voiceIndex?-.45:.45,volume:.8,bars}));
    });
    return {...voices[0],layers:voices,motionDiatonic:true,motionExcerptBars:8,motionVoicesSeparated:true,motionConsonant:true,motionCadence:"perfect",motionPlanner:"paired-voices",motionRhythmStructure:"AAAC-AAAC",motionClarity:"sustained-directions"};
  }
  core.makeN5MotionPassage=makeN5MotionPassage;

  function makeIsolatedMotionScale({keyId,contrary,direction=choose(["outwards","inwards"])}) {
    // A two-octave span fits A3–C6 only on these tonic pitch classes.
    // Keep the mode of the question while using a clear, comfortable register.
    const source=core.keys[keyId];
    const isolatedKeyId=["C","Bb","Am"].includes(keyId)?keyId:keyId.endsWith("m")?"Am":"C";
    const key=core.keys[isolatedKeyId];
    const centre={C:72,Bb:70,Am:69}[isolatedKeyId];
    const midi=degree=>centre+Math.floor(degree/7)*12+key.scale[((degree%7)+7)%7];
    const durations=[1,1,1,1,1,1,1,1];
    const signature={...core.signatures["4/4"]};
    const layers=[0,1].map(voice=>{
      let at=0;
      const events=durations.map((beats,index)=>{
        const degree=contrary
          ? direction==="outwards"?(voice?index:-index):(voice?7-index:-7+index)
          : direction==="outwards"?(voice?index:-7+index):(voice?7-index:-index);
        const event={id:`motion-scale-${voice}-${index}`,midi:midi(degree),soundingMidi:midi(degree),relativeStep:degree,beat:at,beats,volume:.82};
        at+=beats;return event;
      });
      const bars=[0,1].map(barIndex=>({barIndex,chordSymbol:"I",notes:events.flatMap(note=>{
        const start=Math.max(note.beat,barIndex*4),end=Math.min(note.beat+note.beats,(barIndex+1)*4);
        if(end<=start)return [];
        return [{...note,barIndex,beat:start-barIndex*4,beats:end-start,tieToNext:note.beat+note.beats>(barIndex+1)*4,tieFromPrevious:note.beat<barIndex*4}];
      }),accompaniment:[],accompanimentHarmony:[],generatedAccompaniment:false}));
      return core.synchroniseMelodyPlan(refresh({id:`isolated-motion-${Math.random()}`,key:{...key,tonic:centre},timeSignature:signature,barCount:2,totalBeats:8,tempoPulseBeats:1,pan:voice?-.45:.45,volume:.8,bars}));
    });
    return {...layers[0],layers,isolated:true,motionScaleIsolation:true,motionScaleDirection:direction,motionScaleContrary:contrary,sourceKeyId:source.id};
  }
  core.makeIsolatedMotionScale=makeIsolatedMotionScale;

  function buildMotion(answerId,{level,variation}={}){
    if(level==="N5") {
      const contrary=answerId==="motion-contrary";
      const passage=makeN5MotionPassage({keyId:variation.keyName,signature:variation.signature,contrary});
      return {...passage,isolatedPassage:makeIsolatedMotionScale({keyId:variation.keyName,contrary})};
    }
    const first=makePassage({silentAccompaniment:true});
    const contrary=answerId==="motion-contrary";
    const second=refresh({...first,id:`${first.id}-second`,bars:first.bars.map(bar=>{
      const sounding=bar.notes.filter(note=>!note.rest);
      const centre=sounding[0]?.soundingMidi ?? first.key.tonic;
      const parallelShift=choose([5,7]);
      return {...bar,notes:bar.notes.map(note=>note.rest?{...note}:{
        ...note,
        midi:contrary ? 2*centre-note.midi : note.midi+parallelShift,
        soundingMidi:contrary ? 2*centre-note.soundingMidi : note.soundingMidi+parallelShift,
      }),accompaniment:[],accompanimentHarmony:[]};
    })});
    return {...first,layers:[{...first,pan:-.2,volume:.82},{...second,pan:.2,volume:.74}],isolatedPassage:makeIsolatedMotionScale({keyId:first.key.id,contrary})};
  }
  function buildTransformation(answerId){
    return core.makeMelodicTransformationPassage(answerId);
  }
  function buildVamp(answerId,{level,variation}={}){
    if(["N4","N5","H","AH"].includes(level)) return core.makeN4HarmonicPassage("vamp",answerId==="vamp-yes");
    const hasVamp=answerId==="vamp-yes";
    const progression=["I","IV","V","I","VI","IV","V","I"];
    const result=makePassage({silentAccompaniment:true,progression,signature:variation?.signature});
    const key=result.key;
    result.bars=result.bars.map((bar,index)=>{
      const chord=key.chords[bar.chordSymbol] || key.chords.I;
      const spacing=result.timeSignature.type==="compound"?.375:.5;
      const accompaniment=hasVamp
        ? Array.from({length:Math.round(result.timeSignature.beats/spacing)},(_,eventIndex)=>({beat:eventIndex*spacing,beats:spacing*.82,pitches:eventIndex%2===0?[chord[eventIndex%4===2?2:0]-12]:chord,volume:(.078*.82*.8)/.018}))
        : [{beat:0,beats:result.timeSignature.beats*.95,pitches:chord,volume:(.078*.82*.8)/.018}];
      return {...bar,accompaniment,accompanimentHarmony:[{beat:0,beats:result.timeSignature.beats,pitches:chord,volume:.9}]};
    });
    return core.fitVampHarmony(refresh({...result,vampRate:hasVamp?2:null}));
  }
  function buildSuspension(answerId){
    return core.makeSeniorSuspensionPassage(answerId==="suspension-yes");
  }

  const builders={intervalRecognition:buildInterval,accompanimentDevices:buildDevice,steadyTempo:buildTempo,melodicMotion:buildMotion,melodicTransformation:buildTransformation,vamp:buildVamp,suspension:buildSuspension};
  const isolatedPlans={intervalRecognition:{barIndexes:[0],melody:true,accompaniment:false},melodicTransformation:{barIndexes:[0,1,2,3]}};
  const legacyConceptIds=new Set(Object.keys(core.concepts));
  const originalConceptIdsForLevel=core.conceptIdsForLevel;
  const originalBuildQuestion=core.buildQuestion;
  core.conceptIdsForLevel=level=>[...originalConceptIdsForLevel(level).filter(id=>legacyConceptIds.has(id)),...Object.keys(concepts).filter(id=>rank[level]>=rank[concepts[id].introduced])];
  core.buildQuestion=args=>builders[args.topic]?finish(core.withGenerationContext(args,variation=>builders[args.topic](args.answerId,{...args,variation})),args,isolatedPlans[args.topic]):originalBuildQuestion(args);
  Object.assign(core.topics,topics);
  Object.assign(core.concepts,concepts);
  Object.assign(core.idsByFamily,idsByFamily);
})(typeof window!=="undefined"?window:globalThis);
