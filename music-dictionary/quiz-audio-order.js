/* Generated piano material for listening-based ordering questions. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MusicDictionaryQuizAudioOrder=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const frequency=midi=>440*Math.pow(2,(midi-69)/12);
const pitchName=midi=>['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][midi%12]+(Math.floor(midi/12)-1);
function shuffle(values,random){const a=values.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function notes(random){return shuffle(Array.from({length:13},(_,i)=>60+i),random).slice(0,4);}
function piano(pitches,durations){let start=0;const events=pitches.map((midi,i)=>{const duration=durations[i];const event={midi,start,duration,velocity:96};start+=duration;return event;});return {kind:'piano',events,duration:start};}
function realise(question,random=Math.random){
 if(!question.generator)return question;
 const q=JSON.parse(JSON.stringify(question)),g=q.generator,pitches=notes(random);
 if(g.type==='pitches'||g.type==='retrograde'){
  const assignment=shuffle(pitches,random);
  q.options=assignment.map((midi,i)=>({id:'clip-'+i,text:'Example '+String.fromCharCode(65+i),answerLabel:pitchName(midi),media:piano([midi],[.7])}));
  if(g.type==='retrograde'){q.referenceMedia=piano(pitches,[.45,.45,.45,.45]);q.answer.correctOptionIds=pitches.slice().reverse().map(midi=>q.options.find(o=>o.media.events[0].midi===midi).id);}
  else q.answer.correctOptionIds=q.options.slice().sort((a,b)=>(g.direction==='high-low'?-1:1)*(a.media.events[0].midi-b.media.events[0].midi)).map(o=>o.id);
 }else if(g.type==='motifs'){
  const factors=shuffle([.5,1,2,4],random),base=[.5,.25,.25,.5];
  q.options=factors.map((factor,i)=>({id:'clip-'+i,text:'Example '+String.fromCharCode(65+i),answerLabel:'Motif lasting '+(1.5*factor)+' seconds',media:piano(pitches,base.map(d=>d*factor))}));
  q.answer.correctOptionIds=q.options.slice().sort((a,b)=>(g.direction==='long-short'?-1:1)*(a.media.duration-b.media.duration)).map(o=>o.id);
 }else throw new RangeError('Unknown piano ordering generator.');
 return q;
}
function validateMedia(media){
 if(!media||typeof media!=='object')return false;
 if(media.kind==='audio')return typeof media.src==='string'&&media.src.startsWith('./audio/concept-library/')&&!decodeURIComponent(media.src).includes('..')&&!/[?#]/.test(media.src);
 return media.kind==='piano'&&Array.isArray(media.events)&&media.events.length>0&&media.events.length<=64&&media.events.every(e=>Number.isInteger(e.midi)&&e.midi>=21&&e.midi<=108&&Number.isFinite(e.start)&&e.start>=0&&Number.isFinite(e.duration)&&e.duration>0&&e.start+e.duration<=60);
}
return {realise,validateMedia,frequency,pitchName};
});
