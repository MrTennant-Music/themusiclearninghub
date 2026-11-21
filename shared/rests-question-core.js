/* Shared Rests question templates and selection for practice and worksheets. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.MLH=root.MLH||{};root.MLH.RestsQuestionCore=api;}})(typeof window!=='undefined'?window:globalThis,function(){
  const signatures={"2/4":{id:"2/4",type:"simple",unitsPerBar:8},"3/4":{id:"3/4",type:"simple",unitsPerBar:12},"4/4":{id:"4/4",type:"simple",unitsPerBar:16},"6/8":{id:"6/8",type:"compound",unitsPerBar:12,compoundGroups:2},"9/8":{id:"9/8",type:"compound",unitsPerBar:18,compoundGroups:3},"12/8":{id:"12/8",type:"compound",unitsPerBar:24,compoundGroups:4}};
  const rests=["semibreve-rest","minim-rest","dotted-crotchet-rest","crotchet-rest","quaver-rest"];
  const answers=template=>template.answers||[template.answer];
  function enabled(options={}) {
    const keys=Object.keys(options);
    return {times:Object.keys(signatures).filter(id=>keys.some(key=>key.startsWith("time-"))?!!options[`time-${id}`]:true),rests:rests.filter(id=>keys.some(key=>key.startsWith("rest-"))?!!options[`rest-${id}`]:true)};
  }
function getValidQuestions(timeSignature) {
  if (timeSignature.type === "compound") {
    const choices = [
      {answer:"dotted-crotchet-rest",before:[],after:[]},
      {answers:["crotchet-rest","quaver-rest"],before:[],after:[]},
      {answers:["quaver-rest","crotchet-rest"],before:[],after:[]},
      {answer:"crotchet-rest",before:[],after:["quaver"]},
      {answer:"crotchet-rest",before:["quaver"],after:[]},
      {answer:"quaver-rest",before:[],after:["quaver-group-2"]},
      {answer:"quaver-rest",before:["quaver"],after:["quaver"]},
      {answer:"quaver-rest",before:["quaver-group-2"],after:[]},
    ];
    return [{answer:"semibreve-rest",before:[],after:[],isFullBar:true},
      ...Array.from({length:timeSignature.compoundGroups},(_,groupIndex)=>choices.map(choice=>({...choice,prefixGroups:groupIndex,suffixGroups:timeSignature.compoundGroups-groupIndex-1}))).flat()];
  }
  if (timeSignature.id === "2/4") return [
    { answer: "semibreve-rest", before: [], after: [], isFullBar: true }, { answer: "crotchet-rest", before: [], after: ["crotchet"] }, { answer: "crotchet-rest", before: ["crotchet"], after: [] },
    { answers: ["crotchet-rest", "quaver-rest"], before: [], after: ["quaver"] }, { answers: ["quaver-rest", "crotchet-rest"], before: ["quaver"], after: [] },
    { answer: "crotchet-rest", before: [], after: ["quaver-group-2"] }, { answer: "crotchet-rest", before: ["quaver-group-2"], after: [] },
    { answer: "quaver-rest", before: [], after: ["quaver", "crotchet"] }, { answer: "quaver-rest", before: ["quaver"], after: ["crotchet"] }, { answer: "quaver-rest", before: ["crotchet"], after: ["quaver"] }, { answer: "quaver-rest", before: ["crotchet", "quaver"], after: [] },
  ];
  if (timeSignature.id === "3/4") return [
    { answer: "semibreve-rest", before: [], after: [], isFullBar: true }, { answer: "crotchet-rest", before: [], after: ["crotchet", "crotchet"] }, { answer: "crotchet-rest", before: ["crotchet"], after: ["crotchet"] },
    { answer: "crotchet-rest", before: ["crotchet", "crotchet"], after: [] }, { answer: "crotchet-rest", before: ["quaver-group-2"], after: ["crotchet"] }, { answer: "crotchet-rest", before: ["crotchet"], after: ["quaver-group-2"] },
    { answers: ["crotchet-rest", "quaver-rest"], before: ["crotchet"], after: ["quaver"] }, { answers: ["quaver-rest", "crotchet-rest"], before: ["quaver"], after: ["crotchet"] },
    { answer: "quaver-rest", before: [], after: ["quaver", "crotchet", "crotchet"] }, { answer: "quaver-rest", before: ["quaver"], after: ["crotchet", "crotchet"] }, { answer: "quaver-rest", before: ["crotchet"], after: ["quaver", "crotchet"] },
    { answer: "quaver-rest", before: ["crotchet", "quaver"], after: ["crotchet"] }, { answer: "quaver-rest", before: ["crotchet", "crotchet"], after: ["quaver"] }, { answer: "quaver-rest", before: ["crotchet", "crotchet", "quaver"], after: [] },
  ];
  return [
    { answer: "semibreve-rest", before: [], after: [], isFullBar: true }, { answer: "minim-rest", before: [], after: ["minim"] }, { answer: "minim-rest", before: ["minim"], after: [] },
    { answer: "minim-rest", before: [], after: ["crotchet", "crotchet"] }, { answer: "minim-rest", before: ["crotchet", "crotchet"], after: [] },
    { answer: "crotchet-rest", before: [], after: ["crotchet", "crotchet", "crotchet"] }, { answer: "crotchet-rest", before: ["crotchet"], after: ["crotchet", "crotchet"] }, { answer: "crotchet-rest", before: ["crotchet", "crotchet"], after: ["crotchet"] }, { answer: "crotchet-rest", before: ["crotchet", "crotchet", "crotchet"], after: [] },
    { answers: ["crotchet-rest", "quaver-rest"], before: ["crotchet"], after: ["quaver", "crotchet"] }, { answers: ["quaver-rest", "crotchet-rest"], before: ["quaver", "crotchet"], after: ["crotchet"] },
    { answer: "crotchet-rest", before: ["quaver-group-2"], after: ["crotchet", "crotchet"] }, { answer: "crotchet-rest", before: ["crotchet", "quaver-group-2"], after: ["crotchet"] }, { answer: "crotchet-rest", before: ["crotchet", "crotchet"], after: ["quaver-group-2"] },
    { answer: "quaver-rest", before: [], after: ["quaver", "crotchet", "crotchet", "crotchet"] }, { answer: "quaver-rest", before: ["quaver"], after: ["crotchet", "crotchet", "crotchet"] }, { answer: "quaver-rest", before: ["crotchet"], after: ["quaver", "crotchet", "crotchet"] }, { answer: "quaver-rest", before: ["crotchet", "quaver"], after: ["crotchet", "crotchet"] }, { answer: "quaver-rest", before: ["crotchet", "crotchet"], after: ["quaver", "crotchet"] }, { answer: "quaver-rest", before: ["crotchet", "crotchet", "quaver"], after: ["crotchet"] }, { answer: "quaver-rest", before: ["crotchet", "crotchet", "crotchet"], after: ["quaver"] }, { answer: "quaver-rest", before: ["crotchet", "crotchet", "crotchet", "quaver"], after: [] },
  ];
}

  const inventory=Object.fromEntries(Object.entries(signatures).map(([id,signature])=>{
    let templates=getValidQuestions(signature);
    if(signature.type==="simple"){
      templates=templates.filter(template=>!template.answers);
      const beats=signature.unitsPerBar/4;
      for(let before=0;before<=beats-2;before++){
        const prefix=Array(before).fill("crotchet"),suffix=Array(beats-before-2).fill("crotchet");
        templates.push({answers:["crotchet-rest","quaver-rest"],before:prefix,after:["quaver",...suffix]});
        templates.push({answers:["quaver-rest","crotchet-rest"],before:[...prefix,"quaver"],after:suffix});
      }
    }
    return [id,templates];
  }));
  const tokenUnits={semibreve:16,minim:8,"dotted-minim":12,"dotted-crotchet":6,crotchet:4,quaver:2,"quaver-group-2":4,"quaver-group-3":6};
  const onset=template=>(template.prefixGroups||0)*6+template.before.reduce((sum,token)=>sum+tokenUnits[token],0);
  function candidates(options) {
    const selected=enabled(options), groups=new Map();
    for(const id of selected.times)for(const template of inventory[id]){
      if(!answers(template).every(rest=>selected.rests.includes(rest)))continue;
      const key=answers(template).join("|");
      if(!groups.has(key))groups.set(key,new Map());
      const metres=groups.get(key);if(!metres.has(id))metres.set(id,[]);metres.get(id).push(template);
    }
    return groups;
  }
  function valid(options){return candidates(options).size>0;}
  function create(random=Math.random){
    const bags=new Map(),cache=new Map(),positionCache=new Map();
    function choose(key,values){
      let record=bags.get(key);if(!record){record={bag:[],last:undefined};bags.set(key,record);}
      if(!record.bag.length){record.bag=[...values];for(let i=record.bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[record.bag[i],record.bag[j]]=[record.bag[j],record.bag[i]];}if(values.length>1&&record.bag.at(-1)===record.last)[record.bag[0],record.bag[record.bag.length-1]]=[record.bag.at(-1),record.bag[0]];}
      record.last=record.bag.pop();return record.last;
    }
    function next(options){
      const key=JSON.stringify(enabled(options));let groups=cache.get(key);if(!groups){groups=candidates(options);cache.set(key,groups);}
      if(!groups.size)throw new RangeError("No compatible rests and time signatures.");
      const whole=groups.has("semibreve-rest"),regular=[...groups.keys()].filter(id=>id!=="semibreve-rest");
      // Retain the established occasional whole-bar task without fixing its question number.
      const useWhole=whole&&(!regular.length||choose(`${key}/whole`,[true,...Array(14).fill(false)]));
      const pattern=useWhole?"semibreve-rest":choose(`${key}/answer`,regular),metres=groups.get(pattern),timeSignature=choose(`${key}/${pattern}/metre`,[...metres.keys()]);
      const positionKey=`${key}/${pattern}/${timeSignature}`;
      let positions=positionCache.get(positionKey);
      if(!positions){positions=new Map();for(const template of metres.get(timeSignature)){const start=onset(template);if(!positions.has(start))positions.set(start,[]);positions.get(start).push(template);}positionCache.set(positionKey,positions);}
      const start=choose(`${positionKey}/position`,[...positions.keys()]),template=choose(`${positionKey}/${start}/template`,positions.get(start));
      const filler=()=>{const patterns=[["dotted-crotchet"],["crotchet","quaver"],["quaver","crotchet"],["quaver-group-3"]];return patterns[Math.floor(random()*patterns.length)];};
      const before=[...Array.from({length:template.prefixGroups||0},filler).flat(),...template.before],after=[...template.after,...Array.from({length:template.suffixGroups||0},filler).flat()];
      return {timeSignature,answers:[...answers(template)],before,after,isFullBar:!!template.isFullBar};
    }
    return {next};
  }
  function isCorrect(timeSignature, expected, actual) {
    if(expected.length!==actual.length||actual.some(value=>!rests.includes(value)))return false;
    if(expected.every((value,index)=>value===actual[index]))return true;
    return signatures[timeSignature]?.type==="compound"&&expected.length===2
      && [...expected].sort().join("|")==="crotchet-rest|quaver-rest"
      && [...actual].sort().join("|")==="crotchet-rest|quaver-rest";
  }
  function notationPositions(items, start, end, spacingFor) {
    if(!items.length)return [];
    if(items.length===1)return [(start+end)/2];
    const widths=items.map(item=>item.rhythm==="missing"?58:item.rhythm.startsWith("dotted-")||((item.rhythm==="quaver"||item.rhythm==="semiquaver")&&!item.beamGroupId)?26:18);
    const gaps=items.slice(0,-1).map((_,i)=>(widths[i]+widths[i+1])/2+10);
    const minimum=(widths[0]+widths.at(-1))/2+gaps.reduce((sum,value)=>sum+value,0),extra=Math.max(0,end-start-minimum),weights=items.slice(0,-1).map(item=>Math.max(.1,spacingFor(item))),total=weights.reduce((sum,value)=>sum+value,0);
    const positions=[start+widths[0]/2];
    gaps.forEach((gap,i)=>positions.push(positions.at(-1)+gap+extra*weights[i]/total));
    return positions;
  }
  return {create,enabled,valid,candidates,isCorrect,notationPositions,templates:id=>inventory[id]||[],signatures,rests};
});
