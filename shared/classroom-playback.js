(function(root){
 'use strict';
 function loadScript(src){
  return new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src=src;
   script.onload=resolve;
   script.onerror=()=>reject(Error('The question bank could not be loaded.'));
   document.head.append(script);
  });
 }
 async function loadMaterial(options){
  if(options.format==='concept-quiz'){
   await Promise.all([
    ...['music-concepts-data.js','quiz-bank.js','quiz-multi-concept-data.js','music-literacy-dictionary.js'].map(path=>loadScript('./music-dictionary/'+path)),
    loadScript('./concept-recall-data.js'),loadScript('./concept-recall-core.js'),
   ]);
   await loadScript('./music-dictionary/music-concepts-revision-groups.js');
   await Promise.all(['quiz-collections.js','quiz-multi-concept.js','literacy-quiz-bank.js'].map(path=>loadScript('./music-dictionary/'+path)));
   if(!root.MusicDictionaryQuizCollections||!root.MusicDictionaryMultiConceptQuiz||!root.MLHMusicLiteracyQuiz){
    throw Error('The Concept Quizzes question bank could not be loaded.');
   }
   await root.MLHMusicLiteracyQuiz.ready;
   return {collections:root.MusicDictionaryQuizCollections,multi:root.MusicDictionaryMultiConceptQuiz,
    literacy:root.MLHMusicLiteracyQuiz,questions:root.MUSIC_DICTIONARY_QUIZ_BANK.questions};
  }
  if(options.format==='recordings'){
   const response=await fetch('./music-dictionary/quiz-data/audio-question-bank.json');
   if(!response.ok)throw Error('The listening question bank could not be loaded.');
   const {questions:recordings}=await response.json();
   return {recordings};
  }
  const collection=await loadCollection(options.activity);
  const hasAudio=root.MLH.classroomListening.collectionHasAudio(collection);
  if(hasAudio&&!root.IGCore)await loadScript('./music-games/core.js');
  if(collection.sortRecipe?.type==='styles'&&!root.MLHSort){
   await Promise.all(['./shared/music-games-sort-data.js','./shared/concept-level-priority.js'].map(loadScript));
   await loadScript('./shared/music-games-facts.js');
   await loadScript('./shared/music-games-sort.js');
  }
  return {collection,core:root.IGCore,sort:root.MLHSort};
 }
 async function loadCollection(activity){
  const hash=new URL(activity,location.href).hash;
  const encoded=hash.match(/^#playnote=([\w-]{1,2800})$/)?.[1];
  if(!encoded)throw Error('The audio collection could not be opened.');
  const bytes=Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')),value=>value.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
  const parts=[];
  let size=0;
  try{
   while(true){
    const {value,done}=await reader.read();
    if(done)break;
    size+=value.length;
    if(size>4*1024*1024)throw Error('This audio collection is too large.');
    parts.push(value);
   }
  }finally{await reader.cancel().catch(()=>{});}
  return JSON.parse(await new Blob(parts).text());
 }

 // Complete only when the media element or the audio clock reaches the end.
 function play(excerpt,onEnded,onError,onClip){
  if(excerpt.kind==='playlist'){
   if(excerpt.clips.every(clip=>clip.kind==='notes')){
    let offset=0;
    const cues=[];
    const notes=excerpt.clips.flatMap(clip=>{
     cues.push({start:offset,label:clip.label});
     const shifted=clip.notes.map(note=>({...note,start:note.start+offset}));
     offset+=clip.duration+1;
     return shifted;
    });
    return play({kind:'notes',notes,duration:Math.max(0,offset-1),cues},onEnded,onError,onClip);
   }
   let index=0,nextClip,stopCurrent;
   const advance=()=>{
    const clip=excerpt.clips[index++];
    if(!clip){onEnded();return;}
    onClip?.(clip.label);
    stopCurrent=play(clip,()=>{nextClip=root.setTimeout(advance,700);},onError);
   };
   advance();
   return ()=>{root.clearTimeout(nextClip);stopCurrent?.();};
  }
  let active=true,media,context;
  const timers=[];
  function stop(){
   if(!active)return;
   active=false;
   timers.forEach(timer=>root.clearTimeout(timer));
   if(media){media.pause();media.removeAttribute('src');media.load();}
   if(context)context.close().catch(()=>{});
  }
  function ended(){if(active){stop();onEnded();}}
  function failed(){if(active){stop();onError();}}
  if(excerpt.kind==='file'){
   media=new Audio(excerpt.src);
   media.addEventListener('ended',ended,{once:true});
   media.addEventListener('error',failed,{once:true});
   media.play().catch(failed);
  }else{
   const AudioContext=root.AudioContext||root.webkitAudioContext;
   if(!AudioContext){queueMicrotask(failed);return stop;}
   try{context=new AudioContext();}catch{queueMicrotask(failed);return stop;}
   const frequency=midi=>440*2**((midi-69)/12);
   const tail=(root.MLH.naturalPlaybackTailMs?.()??650)/1000;
   const finishAt=Math.max(excerpt.duration,...excerpt.notes.map(note=>note.start+note.duration))+tail;
   const piano=excerpt.notes.map(note=>frequency(note.midi));
   root.MLH.prepareAudioPlayback(context,{piano}).then(ready=>{
    if(!active)return;
    if(!ready){failed();return;}
    const output=excerpt.mix==='accidentals'?root.MLH.AccidentalsNotation.createAudioOutput(context):context.createGain();
    if(excerpt.mix!=='accidentals'){
     output.gain.value=.7;
     output.connect(root.MLH.audioOutput?.(context)||context.destination);
    }
    const start=context.currentTime+.08;
    if(onClip)for(const cue of excerpt.cues||[]){
     timers.push(root.setTimeout(()=>onClip(cue.label),Math.round((start-context.currentTime+cue.start)*1000)));
    }
    for(const note of excerpt.notes){
     root.MLH.playPianoFrequency(context,output,frequency(note.midi),start+note.start,note.duration,note.volume);
    }
    const marker=context.createBufferSource();
    marker.buffer=context.createBuffer(1,1,context.sampleRate);
    marker.connect(output);
    marker.onended=ended;
    marker.start(start+finishAt);
   }).catch(failed);
  }
  return stop;
 }
 root.MLH.classroomPlayback={loadMaterial,loadCollection,play};
})(globalThis);
