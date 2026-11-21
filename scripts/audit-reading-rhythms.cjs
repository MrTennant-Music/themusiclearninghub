'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),core=require('../reading-rhythms-core');
const count=Number(process.argv[2]||2000),report={samples:0,failures:[],levels:{}};
let seed=8217;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32),inc=(o,k)=>o[k]=(o[k]||0)+1;
for(const [level,info] of Object.entries(core.LEVELS)){
 const data=report.levels[level]={metres:{},phrases:{},rhythms:{},rests:0,ties:0,triplets:0,defaultDuplicates:0,customConfigurations:0};
 const configs=[{name:'default',n:count},...info.timeSignatureIds.map(id=>({name:id,n:100,options:{timeSignatureIds:[id]}})),...info.rhythmIds.map(id=>({name:id,n:100,enabled:Object.fromEntries(info.rhythmIds.map(r=>[r,r===id]))}))];
 // Every selectable rhythm subset, restricted to each available metre.
 for(let mask=1;mask<2**info.rhythmIds.length;mask++)for(const id of info.timeSignatureIds)configs.push({name:`subset-${mask}/${id}`,n:2,enabled:Object.fromEntries(info.rhythmIds.map((r,i)=>[r,!!(mask&(1<<i))])),options:{timeSignatureIds:[id],restsEnabled:false,tiesEnabled:false}});
 for(const config of configs){if(!core.canGenerateWithEnabled(level,config.enabled,config.options))continue;data.customConfigurations+=config.name!=='default';let previous='';
 for(let i=0;i<config.n;i++){report.samples++;try{
 const q=core.generateRhythm(level,random,previous,config.enabled,config.options);const sig=core.rhythmSignature(q);
 if(config.name==='default'){inc(data.metres,q.timeSignature.id);inc(data.phrases,q.phraseTemplate);data.defaultDuplicates+=sig===previous;assert(q.expectedOnsetsBeats.length>=3);}
 previous=sig;assert(info.timeSignatureIds.includes(q.timeSignature.id));if(config.options)assert(config.options.timeSignatureIds.includes(q.timeSignature.id));
 for(const bar of q.bars){assert(bar.events.length);assert.equal(bar.events[0].type,'note');assert.equal(bar.events.at(-1).type,'note');assert(Math.abs(bar.events.reduce((s,e)=>s+e.durationBeats,0)-q.timeSignature.quarterBeatsPerBar)<1e-7);
 for(const e of bar.events){const r=core.RHYTHMS[e.rhythm];assert(r);const base=e.rhythm.replace(/^triplet-/, '').replace(/-rest$/,'');if(config.enabled)assert(config.enabled[base]);if(config.name==='default'){inc(data.rhythms,e.rhythm);data.rests+=!!r.rest;data.ties+=!!e.tiedToNext;data.triplets+=!!r.triplet;}if(config.options?.restsEnabled===false)assert(!r.rest);if(config.options?.tiesEnabled===false)assert(!e.tiedToNext);}
 }
 const onsets=core.expectedOnsetsSeconds(q,120),ideal=core.matchPerformance(onsets,onsets.map(o=>o.time),120);assert.equal(ideal.percentage,100);assert(core.inputLimit(onsets)>Math.max(...onsets.map(o=>onsets.filter(x=>x.time>=o.time&&x.time<=o.time+1).length)));
 }catch(e){if(report.failures.length<50)report.failures.push({level,configuration:config.name,i,error:e.message});}}
 }
}
fs.mkdirSync('maintenance/generated/reading-rhythms-audit',{recursive:true});fs.writeFileSync('maintenance/generated/reading-rhythms-audit/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
