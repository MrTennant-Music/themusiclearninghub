'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../exam-notation.js'),'utf8');
const code=source.slice(source.indexOf('  const Q3_PITCH_STEPS ='),source.indexOf('  const Q3_RHYTHMS ='));
const context={};vm.runInNewContext(code+';this.pitch=q3PitchForKey;this.keyboard=q3KeyboardPitchesForKey;this.steps=Q3_PITCH_STEPS',context);
test('notation entry respects the printed key without accidental aliases overwriting natural pitches',()=>{
 assert.equal(context.pitch(-2,'C major'),'C4');assert.equal(context.pitch(1,'C major'),'F4');
 assert.equal(context.pitch(1,'A minor'),'F4');assert.equal(context.pitch(4,'A minor'),'B4');
 assert.equal(context.pitch(-2,'F major'),'C4');assert.equal(context.pitch(1,'F major'),'F4');assert.equal(context.pitch(4,'F major'),'Bb4');assert.equal(context.pitch(8,'F major'),'F5');
 assert.equal(context.pitch(-2,'G major'),'C4');assert.equal(context.pitch(1,'G major'),'F#4');assert.equal(context.pitch(8,'G major'),'F#5');
 assert.deepEqual(Array.from(context.keyboard('F major')).slice(0,7),['C4','D4','E4','F4','G4','A4','Bb4']);
});

test('every offered keyed keyboard pitch has a finite matching renderer step',()=>{
 for(const key of ['C major','G major','F major','A minor']){
  for(const pitch of context.keyboard(key)){
   assert.ok(Number.isFinite(context.steps[pitch]),key+' '+pitch+' must render');
   const natural=pitch.replace(/[#♯b♭]/g,'');
   assert.equal(context.steps[pitch],context.steps[natural],key+' '+pitch+' shares the written staff position');
  }
 }
 assert.equal(context.steps['F#5'],context.steps['F♯5']);
});

test('AH key-signature cursor pitches match the pitches committed to the score',()=>{
 const context={};
 vm.runInNewContext(source.slice(source.indexOf('  function ah2016PitchInKey('),source.indexOf('  function ah2016AnswerNotes('))+';this.inKey=ah2016PitchInKey;',context);
 for(const [key,pitches] of [['D major',['F#3','C#4']],['A major',['F#3','C#4','G#4']],['Bb major',['Bb2','Eb4']],['F major',['Bb3']],['G major',['F#5']],['E minor',['F#3']],['D minor',['Bb3']]]){
  for(const pitch of pitches){assert.equal(context.inKey(pitch.replace(/[#b]/g,''),key),pitch);assert.equal(context.inKey(pitch,key),pitch);}
 }
 assert.equal(context.inKey('C3','C major'),'C3');
 const answerSource=source.slice(source.indexOf('  function ah2016AnswerNotes('),source.indexOf('  function ah2016Text('));
 assert.match(answerSource,/pitches\.push\(accidentals \? pitch : ah2016PitchInKey\(pitch, keySignature\)\)/);
});

test('score input uses CSS-pixel bounds when a fitted WebKit matrix is in another coordinate space',()=>{
 const context={};vm.runInNewContext(source.slice(source.indexOf('  function q3LocalPoint('),source.indexOf('  function q3AddNoteEntryTargets('))+';this.local=q3LocalPoint;',context);
 const rect={left:203,top:596,width:874,height:513},event={clientX:381.6,clientY:828.75};
 const svg=scale=>({viewBox:{baseVal:{x:0,y:0,width:920,height:540}},getBoundingClientRect:()=>rect,getScreenCTM:()=>({a:.95*scale,d:.95*scale,b:0,c:0,e:203*scale,f:596*scale,inverse(){return{a:1/this.a,d:1/this.d,e:-this.e/this.a,f:-this.f/this.d};}}),createSVGPoint(){return{x:0,y:0,matrixTransform(m){return{x:this.x*m.a+m.e,y:this.y*m.d+m.f};}};}});
 for(const scale of [1,.3046875,.6]){const p=context.local(svg(scale),event);assert.ok(Math.abs(p.x-188)<.0001);assert.ok(Math.abs(p.y-245)<.0001);}
 const fallback={getBoundingClientRect:()=>({left:10,top:20,width:460,height:520}),viewBox:{baseVal:{x:5,y:7,width:920,height:1040}}};
 const p=context.local(fallback,{clientX:240,clientY:280});assert.equal(p.x,465);assert.equal(p.y,527,'fallback uses the actual score height and viewBox origin');
});

test('N5 2015 legacy B and explicit B-flat share the same keyed feedback pitch',()=>{
 const context={q3EnteredPitch:v=>v};vm.runInNewContext(source.slice(source.indexOf('  function q3EnteredPitch2015('),source.indexOf('  function q3Draw2015BarNotes('))+';this.pitch=q3EnteredPitch2015;',context);
 for(const pitch of ['B4','Bb4','B♭4'])assert.equal(context.pitch(pitch,'F major'),'Bb4');
 assert.equal(context.pitch('B4','C major'),'B4');assert.equal(context.pitch('B4'),'B4');assert.equal(context.pitch('A4','F major'),'A4');
});
