(function(root){
 'use strict';
 const server=typeof module==='object'&&module.exports;
 const K=server?require('../keyboard-notes.js'):root.KeyboardNotes;
 const N=server?require('./note-identification-core.js'):root.NOTE_IDENTIFICATION_CORE;
 const activities=server?require('./classroom-activities.js'):root.MLH.classroomActivities;
 const names=K.answers({naturals:true,sharps:true,flats:true});
 const allAnswers=names.map((answer,pitch)=>({...answer,id:'written:'+answer.id,pitch}));
 function settings(input){
  if(!input||!Object.hasOwn(N.LEVELS,input.level))return null;
  const written=N.normaliseSettings(input.settings,input.level);
  return {activity:'written-notes',level:input.level,settings:{...written,showNoteNames:input.settings?.showNoteNames===true}};
 }
 function hostSettings(activity){
  const source=activities.activityProfile(activity);
  if(!source)return null;
  const {pathname,state,level='N3'}=source;
  if(pathname==='/noteidentification.html'){
   const saved=settings({level,settings:{...state.settings,showNoteNames:state.showNoteNames}});
   return saved?{...saved,activity,options:saved.settings,kind:'written-notes'}:null;
  }
  if(pathname!=='/keyboardnoteidentification.html'||!Object.hasOwn(K.defaults,level))return null;
  const options=K.normaliseOptions(state.options,level);
  const saved=K.classroomSettings({level,options,showC:state.showC,questionTypes:state.questionTypes});
  return saved?{...saved,activity,kind:'keyboard-notes'}:null;
 }
 function hostAvailable(setup){
  return setup.kind==='written-notes'?variants(setup.options).length:
   K.classroomQuestionPool(setup.options,setup.questionTypes,setup.level).length;
 }
 function answers(options){return allAnswers.filter(answer=>options.accidentals||!answer.offset);}
 function variants(options){return N.variants(N.normaliseSettings(options));}
 function questions(options,count,random=Math.random){
  return activities.shuffle(variants(options),random).slice(0,count).map(({answer,clef,step,accidental})=>{
   const pitch=allAnswers.findIndex(item=>item.id==='written:'+answer);
   return {type:'written',pitch,note:{clef,step,accidental}};
  });
 }
 const api={settings,hostSettings,hostAvailable,answers,questions,available:options=>variants(options).length,allAnswers};
 if(server)module.exports=api;
 else root.MLH.classroomWrittenNotes=api;
})(globalThis);
