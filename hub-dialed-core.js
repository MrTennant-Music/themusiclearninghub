(function(root){
  'use strict';
  const ROUNDS=5;
  const MODES=Object.freeze({
    default:Object.freeze({min:60,max:1400,listenMs:4000}),
    endurance:Object.freeze({min:60,max:1400,listenMs:4000})
  });
  const clamp=value=>Math.max(0,Math.min(1,value));
  const modeFor=mode=>MODES[mode]||MODES.default;
  function frequency(value,mode='default'){
    const {min,max}=modeFor(mode);
    return min*Math.pow(max/min,clamp(Number.isFinite(value)?value:.5));
  }
  function dialPoint(value,radius=83){const angle=(-135+clamp(Number.isFinite(value)?value:.5)*270)*Math.PI/180;return {x:160+Math.sin(angle)*radius,y:148-Math.cos(angle)*radius};}
  const erb=hz=>21.4*Math.log10(1+.00437*hz);
  function score(target,pick,mode='default'){
    if(!Number.isFinite(target)||!Number.isFinite(pick))return 0;
    const {min,max}=modeFor(mode);
    const distance=Math.abs(erb(frequency(target,mode))-erb(frequency(pick,mode)))/(erb(max)-erb(min));
    return Math.round(Math.max(0,Math.min(10,Math.max(10*Math.exp(-800*distance*distance),6*Math.exp(-50*distance*distance),Math.exp(-10*distance*distance))))*100)/100;
  }
  function medalForScore(total){if(!Number.isFinite(total)||total<0||total>50)return null;return total>=49?'diamond':total>=40?'gold':total>=35?'silver':total>30?'bronze':null;}
  function enduranceMedal(rounds){return rounds>=10?'diamond':rounds>=7?'gold':rounds>=5?'silver':rounds>=3?'bronze':null;}
  function completedRounds(state){return state.roundScores.filter(points=>points>=8).length;}
  function distractorCount(round){return round>=4?round-3:0;}
  const DISTRACTOR_SUBTITLES=Object.freeze([
    'Undergoing maintenance…','Whoops!','Please hold…','Lost the instruction manual…',
    'Tuning the pigeons…','Someone sat on the keyboard…','The notes have escaped!',
    'Wrong button!','Mind the musical potholes…','Nothing to hear here…',
    'Tiny orchestra warming up…','A brief outbreak of nonsense…'
  ]);
  function createDistractorSubtitlePicker(random=Math.random){
    let remaining=[],last=null;
    return ()=>{
      if(!remaining.length){
        remaining=[...DISTRACTOR_SUBTITLES];
        for(let i=remaining.length-1;i>0;i--){const j=Math.min(i,Math.floor(clamp(random())*(i+1)));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}
        if(remaining[remaining.length-1]===last)[remaining[0],remaining[remaining.length-1]]=[remaining[remaining.length-1],remaining[0]];
      }
      last=remaining.pop();return last;
    };
  }
  function listeningSequence(target,round,mode='default',random=Math.random){
    const tones=[{pitch:target,startMs:0,durationMs:modeFor(mode).listenMs}],count=distractorCount(round),used=[];
    for(let i=0;i<count;i++){
      const choices=Array.from({length:13},(_,j)=>.08+j*.07).filter(p=>Math.abs(p-target)>=.12&&used.slice(-2).every(x=>Math.abs(p-x)>=.1));
      const pitch=choices[Math.min(choices.length-1,Math.floor(clamp(random())*choices.length))];used.push(pitch);
      tones.push({pitch,startMs:modeFor(mode).listenMs+1000+i*1000,durationMs:1000});
    }
    const last=tones[tones.length-1];return {mode,tones,durationMs:last.startMs+last.durationMs+(count?1000:0)};
  }
  function playListeningSequence(audio,sequence,{onComplete,onError,schedule=setTimeout,cancel=clearTimeout}={}){
    const timers=[];let active=true;
    const stop=()=>{active=false;timers.forEach(cancel);audio.stop();};
    const run=fn=>{if(!active)return;try{fn();}catch(error){stop();onError?.(error);}};
    for(const tone of sequence.tones){
      const start=()=>run(()=>audio.start(frequency(tone.pitch,sequence.mode)));
      if(tone.startMs===0)start();else timers.push(schedule(start,tone.startMs));
      if(!active)break;
      timers.push(schedule(()=>run(()=>audio.stop()),tone.startMs+tone.durationMs));
    }
    if(active)timers.push(schedule(()=>{if(active){stop();onComplete?.();}},sequence.durationMs));
    return stop;
  }
  function generateTargets(random=Math.random){return Array.from({length:ROUNDS},()=>.1+.8*clamp(random()));}
  function initialState(mode='default'){return {phase:'intro',mode:MODES[mode]?mode:'default',round:0,targets:[],picks:[],roundScores:[],total:0,kind:'solo'};}
  function reducer(state,action){
    switch(action.type){
      case 'SET_MODE':return state.phase==='intro'?initialState(action.mode):state;
      case 'START':{
        const targets=action.targets||generateTargets();
        if(targets.length!==ROUNDS||targets.some(x=>!Number.isFinite(x)||x<0||x>1))return state;
        return {...initialState(action.mode||state.mode),phase:'countdown',round:1,kind:'solo',targets:[...targets]};
      }
      case 'LISTEN':return state.phase==='countdown'?{...state,phase:'listen'}:state;
      case 'REPEAT':return ['countdown','listen','tune'].includes(state.phase)?{...state,phase:'countdown'}:state;
      case 'TUNE':return state.phase==='listen'?{...state,phase:'tune'}:state;
      case 'SUBMIT':{
        if(state.phase!=='tune'||!Number.isFinite(action.pick))return state;
        const pick=clamp(action.pick),points=score(state.targets[state.round-1],pick,state.mode);
        return {...state,phase:'feedback',picks:[...state.picks,pick],roundScores:[...state.roundScores,points],total:Math.round((state.total+points)*100)/100};
      }
      case 'NEXT':{
        if(state.phase!=='feedback')return state;
        if(state.mode!=='endurance')return {...state,phase:state.round===ROUNDS?'results':'countdown',round:Math.min(ROUNDS,state.round+1)};
        if(state.roundScores[state.round-1]<8)return {...state,phase:'results'};
        const nextRound=state.round+1,targets=[...state.targets];
        if(nextRound>targets.length){const next=action.target??generateTargets()[0];if(!Number.isFinite(next)||next<0||next>1)return state;targets.push(next);}
        return {...state,phase:'countdown',round:nextRound,targets};
      }
      case 'RESET':return initialState(state.mode);
      default:return state;
    }
  }
  class ToneAudio{
    constructor(){this.context=null;this.voice=null;this.closed=false;this.unlockTask=null;}
    async unlock(){
      if(this.closed)throw new Error('Audio player has closed.');
      if(this.unlockTask)return this.unlockTask;
      this.unlockTask=(async()=>{
        const Context=root.AudioContext||root.webkitAudioContext;
        if(!Context)throw new Error('Audio is unavailable in this browser.');
        if(!this.context)this.context=new Context();
        if(this.context.state==='suspended'||this.context.state==='interrupted')await this.context.resume();
        if(this.closed)throw new Error('Audio player has closed.');
        if(this.context.state!=='running')throw new Error('Audio could not start. Please try again.');
      })();
      try{await this.unlockTask;}finally{this.unlockTask=null;}
    }
    start(hz,volume=.13){
      this.stop();
      if(this.closed||!this.context||this.context.state!=='running')throw new Error('Press Play to enable audio.');
      const context=this.context,time=context.currentTime,gain=context.createGain();
      gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.12);gain.connect((globalThis.MLH?.audioOutput?.(context) || context.destination));
      // A quiet fundamental and two harmonics make low notes audible on classroom speakers.
      const oscillators=[[1,.75],[2,.18],[3,.07]].map(([ratio,level])=>{
        const oscillator=context.createOscillator(),partial=context.createGain();
        oscillator.type='sine';oscillator.frequency.setValueAtTime(Math.max(40,Math.min(6000,hz))*ratio,time);
        partial.gain.value=level;oscillator.connect(partial);partial.connect(gain);oscillator.start();
        return {oscillator,partial,ratio};
      });
      this.voice={gain,oscillators};
    }
    reveal(){
      this.start(660,.035);
      const time=this.context.currentTime;
      this.voice.gain.gain.linearRampToValueAtTime(0,time+1);
    }
    setFrequency(hz){
      if(!this.voice||this.closed)return;
      for(const {oscillator,ratio} of this.voice.oscillators)oscillator.frequency.setTargetAtTime(Math.max(40,Math.min(6000,hz))*ratio,this.context.currentTime,.025);
    }
    stop(){
      if(!this.voice||!this.context)return;
      const {gain,oscillators}=this.voice;this.voice=null;
      const time=this.context.currentTime;
      gain.gain.cancelScheduledValues(time);gain.gain.setValueAtTime(gain.gain.value,time);gain.gain.linearRampToValueAtTime(0,time+.035);
      for(const {oscillator,partial} of oscillators){
        oscillator.onended=()=>{oscillator.disconnect();partial.disconnect();};
        try{oscillator.stop(time+.045);}catch{}
      }
      // Disconnect the output only after its release envelope has finished.
      const last=oscillators[oscillators.length-1];
      const previous=last.oscillator.onended;
      last.oscillator.onended=()=>{previous();gain.disconnect();};
    }
    dispose(){this.stop();this.closed=true;if(this.context){(globalThis.MLH?.closeAudioContext?.(this.context) || this.context.close()).catch(()=>{});this.context=null;}}
  }
  const api={MODES,ROUNDS,medalForScore,enduranceMedal,completedRounds,distractorCount,DISTRACTOR_SUBTITLES,createDistractorSubtitlePicker,dialPoint,listeningSequence,playListeningSequence,frequency,score,generateTargets,initialState,reducer,ToneAudio};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.HubDialedCore=api;
})(typeof window!=='undefined'?window:globalThis);
