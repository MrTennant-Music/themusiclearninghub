/* Independent pitch estimation and equal-temperament note calculations. */
(function(root){
  'use strict';
  const SHARPS=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const FLATS=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
  function noteForFrequency(frequency, reference=440, flats=false){
    if(!Number.isFinite(frequency)||frequency<=0||!Number.isFinite(reference)||reference<400||reference>480)return null;
    const exact=69+12*Math.log2(frequency/reference),midi=Math.round(exact);
    const cents=100*(exact-midi),name=(flats?FLATS:SHARPS)[((midi%12)+12)%12];
    return {midi,name,octave:Math.floor(midi/12)-1,cents,frequency,target:reference*2**((midi-69)/12),inTune:Math.abs(cents)<=5};
  }
  function detectPitch(input,sampleRate){
    if(!input||input.length<1024||!Number.isFinite(sampleRate)||sampleRate<=0)return null;
    const stride=Math.max(1,Math.floor(sampleRate/12000)),length=Math.floor(input.length/stride),rate=sampleRate/stride;
    const data=new Float32Array(length);let mean=0;
    for(let i=0;i<length;i++){let value=0;for(let j=0;j<stride;j++)value+=input[i*stride+j];data[i]=value/stride;mean+=data[i];}
    mean/=length;let power=0;
    for(let i=0;i<length;i++){data[i]-=mean;power+=data[i]*data[i];}
    const rms=Math.sqrt(power/length);if(!Number.isFinite(rms)||rms<.008)return null;
    const window=Math.floor(length/2),maxLag=Math.min(window-1,Math.ceil(rate/40)),minLag=Math.max(2,Math.floor(rate/2000));
    const difference=new Float32Array(maxLag+1),normalized=new Float32Array(maxLag+1);let sum=0;
    normalized[0]=1;
    for(let lag=1;lag<=maxLag;lag++){
      let error=0;for(let i=0;i<window;i++){const delta=data[i]-data[i+lag];error+=delta*delta;}
      difference[lag]=error;sum+=error;normalized[lag]=sum?error*lag/sum:1;
    }
    for(let lag=minLag;lag<maxLag;lag++){
      if(normalized[lag]>=.15)continue;
      while(lag+1<maxLag&&normalized[lag+1]<normalized[lag])lag++;
      const before=difference[lag-1],value=difference[lag],after=difference[lag+1];
      const denominator=before-2*value+after;
      const offset=denominator?Math.max(-1,Math.min(1,.5*(before-after)/denominator)):0;
      const frequency=rate/(lag+offset);
      return frequency>=40&&frequency<=2000?{frequency,confidence:1-normalized[lag],rms}:null;
    }
    return null;
  }
  // Behavioural contract recovered from the reference's shipped script and source map.
  // Mathematics is implemented independently; no reference code is distributed.
  function referenceDialState(frequency, previousDegrees=0, reference=440){
    const note=noteForFrequency(frequency,reference);if(!note)return null;
    const cents=Math.floor(1200*Math.log2(frequency/note.target));
    const degrees=(note.midi+cents/100)*15;
    return {...note,cents,degrees,duration:(Math.trunc(Math.abs(degrees-previousDegrees))+25)*15};
  }
  function wheelMotion(frequency, previousRotation, immediate=false, reference=440){
    const target=referenceDialState(frequency,0,reference);if(!target)return null;
    const raw=-target.degrees;
    // Preserve the same note alignment and local easing, without extra full turns
    // when the MIDI note crosses an octave or the first microphone reading arrives.
    const difference=((raw-previousRotation)%360+540)%360-180;
    const rotation=previousRotation+difference;
    return {rotation,duration:immediate?0:(Math.trunc(Math.abs(difference))+25)*15};
  }
  const INSTRUMENTS=Object.freeze({
    guitar:{label:'Guitar',strings:[40,45,50,55,59,64]},
    bass:{label:'Bass Guitar',strings:[28,33,38,43]},
    ukulele:{label:'Ukulele',strings:[67,60,64,69]},
    violin:{label:'Violin',strings:[55,62,69,76]}
  });
  const frequencyForMidi=(midi,reference=440)=>reference*2**((midi-69)/12);
  function stringPitch(midi,reference=440){return {midi,name:SHARPS[midi%12],octave:Math.floor(midi/12)-1,frequency:frequencyForMidi(midi,reference)};}
  function instrumentDialState(frequency,targetMidi,reference=440){
    if(!Number.isInteger(targetMidi))return {name:'',cents:null,position:450,inTune:false,colour:'#111'};
    const valid=Number.isFinite(frequency)&&frequency>0;
    const cents=valid?1200*Math.log2(frequency/frequencyForMidi(targetMidi,reference)):null;
    return {name:stringPitch(targetMidi).name,cents,position:450+(cents===null?0:Math.max(-50,Math.min(50,cents)))*7.2,inTune:cents!==null&&Math.abs(cents)<=10,colour:cents===null?'#111':Math.abs(cents)<=10?'#16a34a':Math.abs(cents)<=25?'#ea580c':'#dc2626'};
  }
  function stringPitchHint(frequency,targetMidi,reference=440){
    if(!Number.isFinite(frequency)||frequency<=0||!Number.isInteger(targetMidi))return '';
    const cents=1200*Math.log2(frequency/frequencyForMidi(targetMidi,reference));
    if(Math.abs(cents)<=10)return '';
    return cents>0?'Too high':'Too low';
  }
  function matchString(frequency,strings,tolerance=5,reference=440){
    if(!Number.isFinite(frequency)||frequency<=0)return -1;
    return strings.findIndex(midi=>Math.abs(1200*Math.log2(frequency/frequencyForMidi(midi,reference)))<=tolerance);
  }
  // Require a steady pitch; re-arm only after leaving it for long enough.
  function createStringTracker({tolerance=5,holdMs=400,reference=440}={}){
    let candidate=-1,since=0,latched=-1,awaySince=null;
    return {reset(){candidate=-1;since=0;latched=-1;awaySince=null;},observe(frequency,strings,now){
      const index=matchString(frequency,strings,tolerance,reference);
      if(index!==latched){if(awaySince===null)awaySince=now;if(now-awaySince>=700)latched=-1;}else awaySince=null;
      if(index!==candidate){candidate=index;since=now;}
      const stable=index>=0&&now-since>=holdMs;
      const celebrate=stable&&index!==latched;
      if(celebrate){latched=index;awaySince=null;}
      return {index:stable?index:-1,celebrate};
    }};
  }
  function createGuidedTuning(strings,{reference=440}={}){
    let selected=-1;const completed=new Set(),tracker=createStringTracker({tolerance:5,holdMs:400,reference});
    const snapshot=()=>({selected,completed:[...completed]});
    return {snapshot,resetDetection(){tracker.reset();},reset(){selected=-1;completed.clear();tracker.reset();return snapshot();},select(index){
      if(!Number.isInteger(index)||index<0||index>=strings.length)return snapshot();
      selected=index;completed.delete(index);tracker.reset();return snapshot();
    },advance(){
      if(selected<0||completed.size===strings.length){selected=-1;tracker.reset();return snapshot();}
      for(let offset=1;offset<=strings.length;offset++){
        const candidate=(selected+offset)%strings.length;
        if(!completed.has(candidate)){selected=candidate;tracker.reset();return snapshot();}
      }
      selected=-1;tracker.reset();return snapshot();
    },observe(frequency,now){
      if(selected<0)return {...snapshot(),matched:-1,celebrate:false};
      const result=tracker.observe(frequency,[strings[selected]],now),matched=result.index<0?-1:selected;
      if(result.celebrate){
        completed.add(selected);
      }
      return {...snapshot(),matched,celebrate:result.celebrate};
    }};
  }
  const api={noteForFrequency,detectPitch,referenceDialState,wheelMotion,SHARPS,FLATS,INSTRUMENTS,frequencyForMidi,stringPitch,instrumentDialState,stringPitchHint,matchString,createStringTracker,createGuidedTuning};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ChromaticTuner=api;
})(typeof window==='object'?window:globalThis);
