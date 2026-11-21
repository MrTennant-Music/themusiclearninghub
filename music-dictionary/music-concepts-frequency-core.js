(function(root){
 'use strict';
 const bands=[
  {key:1,label:'1–25%',colour:'#f0fdf4'},
  {key:2,label:'26–50%',colour:'#dcfce7'},
  {key:3,label:'51–75%',colour:'#bbf7d0'},
  {key:4,label:'76–100%',colour:'#4ade80'}
 ];
 function band(percent){return percent<=0?0:percent<=25?1:percent<=50?2:percent<=75?3:4;}
 function format(percent){return Number(percent.toFixed(1))+'%';}
 function defaultExam(level){return level==='Higher'?'H':level==='Advanced Higher'?'AH':'N5';}
 function entry(data,exam,id){const report=data.reports[exam];const hit=report.concepts[id],percentage=format(hit.percent);return {...hit,band:band(hit.percent),label:percentage,description:hit.count+' of '+report.years.length+' '+report.label+' papers ('+percentage+')'};}
 const api={bands,band,format,defaultExam,entry};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MusicConceptFrequency=api;
})(typeof window!=='undefined'?window:globalThis);
