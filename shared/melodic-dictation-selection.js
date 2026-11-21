(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MELODIC_DICTATION_SELECTION=api;})(typeof window==='object'?window:globalThis,function(){
  function createPicker(random=Math.random){
    const bags=new Map();
    return function pick(name,items){
      const key=name+JSON.stringify(items);let bag=bags.get(key);
      if(!bag?.items.length){const values=items.slice();for(let i=values.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}if(bag&&values.length>1&&JSON.stringify(values.at(-1))===bag.last){const index=values.findIndex(value=>JSON.stringify(value)!==bag.last);if(index>=0)[values[index],values[values.length-1]]=[values.at(-1),values[index]];}bag={items:values,last:bag?.last};bags.set(key,bag);}
      const item=bag.items.pop();bag.last=JSON.stringify(item);return item;
    };
  }
  const patterns={
    '2/4':[['crotchet','crotchet'],['minim'],['quaver','quaver','crotchet']],
    '3/4':[['crotchet','crotchet','crotchet'],['minim','crotchet'],['crotchet','minim'],['quaver','quaver','crotchet','crotchet']],
    '4/4':[['crotchet','crotchet','crotchet','crotchet'],['minim','crotchet','crotchet'],['crotchet','crotchet','minim'],['semibreve'],['quaver','quaver','crotchet','minim']]
  };
  function createWorksheetGenerator(random=Math.random){const pick=createPicker(random),directionCounts={higher:0,lower:0};let previous='';return {next(level='N3'){
    const timeSignature=pick('metre',Object.keys(patterns));let result;
    for(let attempt=0;attempt<24;attempt++){
      const rhythms=pick('pattern-'+timeSignature,patterns[timeSignature]),firstAnswer=pick('answer-start',Array.from({length:9},(_,i)=>i));
      const available=firstAnswer===0?['lower']:firstAnswer===8?['higher']:['higher','lower'];
      const minimum=Math.min(...available.map(d=>directionCounts[d])),direction=level==='N4'?pick('direction',available.filter(d=>directionCounts[d]===minimum)):null,delta=direction==='higher'?1:direction==='lower'?-1:0;
      const sourceMelody=[firstAnswer-delta];
      while(sourceMelody.length<rhythms.length){const prior=sourceMelody.at(-1),choices=[prior-1,prior,prior+1].filter(step=>step>=0&&step<=8&&step+delta>=0&&step+delta<=8);sourceMelody.push(choices[Math.floor(random()*choices.length)]);}
      result={timeSignature,rhythms,sourceMelody,answerMelody:sourceMelody.map(step=>step+delta),direction};
      const signature=JSON.stringify(result);if(signature!==previous){previous=signature;break;}
    }
    if(result.direction)directionCounts[result.direction]++;return result;
  }};}
  return {createPicker,createWorksheetGenerator,patterns};
});
