/* Shared section times for Music Dictionary audio examples. */
(function(root){
 'use strict';
 function parse(value,optional=false){
  const text=String(value ?? '').trim();
  if(!text)return optional?null:0;
  if(!/^\d+(?::\d{1,2}){0,2}(?:\.\d{1,3})?$/.test(text))throw Error('Enter seconds or a time such as 0:45.');
  const parts=text.split(':').map(Number);
  if(parts.slice(1).some(n=>n>=60))throw Error('Minutes and seconds after a colon must be below 60.');
  return parts.reduce((total,n)=>total*60+n,0);
 }
 function normalize(start=0,end=null){
  if(typeof start!=='number'||!Number.isFinite(start)||start<0)throw Error('Start time must be zero or greater.');
  if(end!==null&&(typeof end!=='number'||!Number.isFinite(end)||end<=start))throw Error('End time must be later than the start time.');
  return {startSeconds:start,endSeconds:end};
 }
 function format(seconds){
  const total=Math.round(seconds*1000)/1000;
  return Math.floor(total/60)+':'+String(Math.floor(total%60)).padStart(2,'0')+(total%1?'.'+total.toFixed(3).split('.')[1].replace(/0+$/,''):'');
 }
 const api={parse,normalize,format};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MusicConceptAudioTiming=api;
})(typeof window!=='undefined'?window:globalThis);
