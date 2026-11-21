'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {markerLabelPositions}=require('../exam-audio');
function verify(markers,width){const result=markerLabelPositions(markers,width);for(let i=0;i<result.length;i++){assert.equal(result[i].centre,markers[i].position,'label stays directly over its own cue');assert.equal(result[i].tickOffset,0,'tick stays centred under its label');for(let j=0;j<i;j++){if(result[i].row===result[j].row)assert.ok(result[i].centre-markers[i].width/2>=result[j].centre+markers[j].width/2+1.999,'buttons in the same row remain disjoint');}}return result;}
test('crowded Higher comparison labels use separate rows without shifting from their cue ticks',()=>{const widths=[33,35,39,40,37,38,59],positions=[49,80,117,146,184,212,235];assert.ok(verify(widths.map((width,i)=>({width,position:positions[i]})),313).some(p=>p.row>0));});
test('nearby National 5 part labels remain aligned and separately clickable at the track end',()=>{assert.deepEqual(verify([{width:24,position:290},{width:24,position:293}],313).map(p=>p.row),[0,1]);});
test('AH 2018 Q6 keeps all ten part and excerpt labels over their actual timestamps',()=>{const duration=1943.370998,times=[8.25,58.62,186.86,303.38,431.92,788.21,852.24,980.67,1097.17,1225.69];const input=times.map(time=>({width:24,position:time/duration*313}));assert.deepEqual(verify(input,313).map(p=>p.row),[0,1,0,1,0,0,1,0,1,0]);});
test('isolated cues retain their positions and empty players need no markers',()=>{const input=[{width:24,position:50},{width:24,position:200}],copy=JSON.stringify(input);assert.deepEqual(verify(input,313),[{centre:50,tickOffset:0,row:0},{centre:200,tickOffset:0,row:0}]);assert.equal(JSON.stringify(input),copy);assert.deepEqual(markerLabelPositions([],313),[]);});
test('all AH Q6 players omit the opening 1 after each section without changing calibrated markers',()=>{
 const {displayedMarkers}=require('../exam-audio');
 for(const year of [2016,2017,2018,2019,2022,2023,2024,2025,2026]){
  const paper=require('../papers/advanced-higher-'+year),q6=paper.questions.find(q=>String(q.number)==='6');
  for(const clip of q6.audio.clips){
   const before=JSON.stringify(clip.markers),shown=displayedMarkers(clip.markers,true);
   assert.deepEqual(shown.map(m=>m.label),['(a)','2','1','2','(b)','2','1','2'],String(year));
   assert.equal(JSON.stringify(clip.markers),before,'source timing inventory stays intact');
   assert(shown.every(m=>clip.markers.includes(m)));
   assert.equal(displayedMarkers(clip.markers),clip.markers,'other players retain all markers');
  }
 }
});
test('simplified AH Q6 markers fit one header row at the audited track durations',()=>{
 const {displayedMarkers}=require('../exam-audio');
 const durations={2016:2144.679,2017:1895.55,2018:1943.353,2019:1976.645,2022:1960.298,2023:2015.677823,2024:1941.49,2025:2143.55,2026:2100.236984};
 for(const [year,duration]of Object.entries(durations)){
  const q6=require('../papers/advanced-higher-'+year).questions.find(q=>String(q.number)==='6');
  const markers=displayedMarkers(q6.audio.clips[0].markers,true).map(m=>({width:/^[12]$/.test(m.label)?14:24,position:m.time/duration*313}));
  assert(verify(markers,313).every(m=>m.row===0),year+' uses one row');
 }
});
