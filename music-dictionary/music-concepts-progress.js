/* Pupil-controlled Music Dictionary confidence, stored on this browser. */
(function(root){
 'use strict';
 const key='mlh:music-dictionary-progress:v1';
 const viewsKey='mlh:music-dictionary-views:v1';
 const options=[{key:'learning',label:'Still Learning'},{key:'known',label:'Confident'}];
 function readViews(storage){
  try{
   const views=JSON.parse(storage.getItem(viewsKey));
   return views&&typeof views==='object'&&!Array.isArray(views)?views:{};
  }catch{return {};}
 }
 function saveViews(storage,views){
  try{storage.setItem(viewsKey,JSON.stringify({...readViews(storage),...views}));}catch{}
 }
 function statusFor(progress,id){return progress[id]==='known'?'known':'learning';}
 const literacyKey=id=>'literacy:'+id;
 function read(storage){try{const value=JSON.parse(storage.getItem(key));if(!value||typeof value!=='object'||Array.isArray(value))return {};return Object.fromEntries(Object.entries(value).filter(([id,status])=>/^(?:MC-\d{4}|literacy:[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(id)&&['learning','known'].includes(status)));}catch(_){return {};}}
 function update(storage,id,status,current={}){if(!options.some(option=>option.key===status))throw Error('Unknown progress state');let progress;try{storage.getItem(key);progress={...read(storage)};}catch(_){progress={...current};}if(status==='unreviewed')delete progress[id];else progress[id]=status;try{storage.setItem(key,JSON.stringify(progress));return {progress,saved:true};}catch(_){return {progress,saved:false};}}
 const api={key,viewsKey,options,readViews,saveViews,statusFor,literacyKey,read,update};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MusicConceptProgress=api;
})(typeof window!=='undefined'?window:globalThis);
