/* Pupil-controlled Music Dictionary confidence, stored on this browser. */
(function(root){
 'use strict';
 const key='mlh:music-dictionary-progress:v1';
 const options=[{key:'learning',label:'Still Learning'},{key:'known',label:'Confident'}];
 function read(storage){try{const value=JSON.parse(storage.getItem(key));if(!value||typeof value!=='object'||Array.isArray(value))return {};return Object.fromEntries(Object.entries(value).filter(([id,status])=>/^MC-\d{4}$/.test(id)&&['learning','known'].includes(status)));}catch(_){return {};}}
 function update(storage,id,status,current={}){if(!options.some(option=>option.key===status))throw Error('Unknown progress state');let progress;try{storage.getItem(key);progress={...read(storage)};}catch(_){progress={...current};}if(status==='unreviewed')delete progress[id];else progress[id]=status;try{storage.setItem(key,JSON.stringify(progress));return {progress,saved:true};}catch(_){return {progress,saved:false};}}
 const api={key,options,read,update};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MusicConceptProgress=api;
})(typeof window!=='undefined'?window:globalThis);
