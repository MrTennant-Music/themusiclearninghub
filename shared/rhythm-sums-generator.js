/* Shared exact arithmetic and balanced question selection for Rhythm Sums. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.MLH=root.MLH||{};root.MLH.RhythmSumsGenerator=api;}})(typeof window!=='undefined'?window:globalThis,function(){
  const OPERATORS=['+','−','×','÷'];
  function calculate(left,operator,right){return operator==='+'?left+right:operator==='−'?left-right:operator==='×'?left*right:left/right;}
  function isQuarterBeat(value){return Number.isFinite(value)&&value>=0&&Math.abs(value*4-Math.round(value*4))<1e-8;}
  function buildChoices(pool,operators){
    const choices=new Map();
    for(const operator of OPERATORS.filter(op=>operators.includes(op))){
      const answers=new Map(),seen=new Set();
      for(const first of pool)for(const second of pool){
        let left=first,right=second;
        if(operator==='−'&&left.beats<right.beats)[left,right]=[right,left];
        const answer=calculate(left.beats,operator,right.beats),key=`${left.id}/${right.id}`;
        if(!isQuarterBeat(answer)||seen.has(key))continue;
        seen.add(key);if(!answers.has(answer))answers.set(answer,[]);
        answers.get(answer).push({left,right,operator,answer});
      }
      if(answers.size)choices.set(operator,answers);
    }
    return choices;
  }
  function create(random=Math.random){
    const cache=new Map(),bags=new Map();
    function choose(key,values,avoidRepeat=true){
      let record=bags.get(key);
      if(!record){record={bag:[],last:undefined};bags.set(key,record);}
      if(!record.bag.length){
        record.bag=[...values];
        for(let i=record.bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[record.bag[i],record.bag[j]]=[record.bag[j],record.bag[i]];}
        if(avoidRepeat&&values.length>1&&record.bag.at(-1)===record.last)[record.bag[0],record.bag[record.bag.length-1]]=[record.bag.at(-1),record.bag[0]];
      }
      record.last=record.bag.pop();return record.last;
    }
    function next(pool,operators){
      const key=JSON.stringify([pool.map(item=>[item.id,item.beats]),OPERATORS.filter(op=>operators.includes(op))]);
      let choices=cache.get(key);if(!choices){choices=buildChoices(pool,operators);cache.set(key,choices);}
      if(!choices.size)throw new RangeError('No valid rhythm sum for these settings.');
      // Choose the operation before its result, so rejected fractions cannot alter its weight.
      const operator=choose(`${key}/operator`,[...choices.keys()],false),answers=choices.get(operator),answer=choose(`${key}/${operator}/answer`,[...answers.keys()]);
      return choose(`${key}/${operator}/${answer}/pair`,answers.get(answer));
    }
    return {next};
  }
  function makeOrder(pool,{count=4,length=4,random=Math.random}={}){
    if(!pool.length)throw new RangeError('Choose some rhythms.');
    const rows=[],totals=new Set();
    for(let attempt=0;attempt<2000&&rows.length<count;attempt++){
      const items=Array.from({length},()=>pool[Math.floor(random()*pool.length)]);
      const beats=items.reduce((sum,item)=>sum+item.beats,0);
      if(totals.has(beats))continue;
      totals.add(beats);rows.push({id:'row-'+rows.length,items,beats});
    }
    if(rows.length!==count)throw new RangeError('There are not enough different rhythm totals.');
    const answer=rows.slice().sort((a,b)=>b.beats-a.beats).map(row=>row.id);
    // Never present an already solved question.
    if(rows.every((row,i)=>row.id===answer[i]))rows.push(rows.shift());
    return {rows,answer};
  }
  return {create,buildChoices,calculate,isQuarterBeat,makeOrder};
});
