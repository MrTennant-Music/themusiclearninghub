(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./chord-generator-core'),require('./drum-machine-core'),require('./composition-template-data'));
  else{root.MLH=root.MLH||{};root.MLH.CompositionTemplates=factory(root.MLH.ChordGenerator,root.MLH.DrumMachine,root.MLH.CompositionTemplateData);}
})(typeof window!=='undefined'?window:globalThis,function(C,D,data){
  'use strict';
  const templates=data.map(item=>JSON.parse(JSON.stringify(item)));
  function create(id,random=Math.random){
    const template=templates.find(item=>item.id===id);
    if(!template)throw Error('Choose an available template.');
    const bar=Number(template.timeSignature.split('/')[0])*4/Number(template.timeSignature.split('/')[1]);
    let drums=D.linkedStudioDrums(D.preset(template.timeSignature==='3/4'?'waltz':template.timeSignature==='6/8'?'sixEight':'rock',bar),bar,8);
    drums=D.randomiseLinkedBar(drums,0,template.timeSignature,random);
    return C.asStudio({version:1,templateId:id,title:template.title,composer:template.artist,tempo:template.tempo,key:template.key,mode:template.mode,timeSignature:template.timeSignature,
      progressionBars:8,melodyBars:8,melodyOctave:template.melodyOctave,quantise:8,instrument:'piano',melodyInstrument:'piano',style:'pop',loop:true,swing:0,octave:4,
      sections:[{name:'Progression',repeats:1,variation:0,chords:JSON.parse(JSON.stringify(template.chords))}],melody:JSON.parse(JSON.stringify(template.melody)),drums});
  }
  return {list:templates.map(({id,title,artist,group})=>({id,title,artist,group})),create};
});
