/* Rhythm-only dictation content and answer entry. All durations use crotchet beats. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MLH = root.MLH || {}; root.MLH.RhythmWriting = api; }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const beats = {semibreve:4, dottedMinim:3, minim:2, crotchet:1, quaver:.5, semiquaver:.25, dottedCrotchet:1.5, dottedQuaver:.75, semibreveRest:4, minimRest:2, crotchetRest:1, quaverRest:.5, tripletQuavers:1, tripletCrotchets:2};
  const levels = {
    N3: {bars:1, signatures:['4/4'], tools:['semibreve','dottedMinim','minim','crotchet']},
    N4: {bars:2, signatures:['2/4','3/4','4/4'], tools:['semibreve','dottedMinim','minim','crotchet','quaver','semiquaver']},
    N5: {bars:2, signatures:['2/4','3/4','4/4'], tools:['semibreve','dottedMinim','minim','crotchet','quaver','semiquaver','dottedCrotchet','dottedQuaver']},
    H: {bars:4, signatures:['2/4','3/4','4/4','6/8'], tools:['semibreve','dottedMinim','minim','crotchet','quaver','semiquaver','dottedCrotchet','dottedQuaver','semibreveRest','minimRest','crotchetRest','quaverRest','tripletQuavers','tripletCrotchets']},
    AH: {bars:4, signatures:['2/4','3/4','4/4','6/8'], tools:['semibreve','dottedMinim','minim','crotchet','quaver','semiquaver','dottedCrotchet','dottedQuaver','semibreveRest','minimRest','crotchetRest','quaverRest','tripletQuavers','tripletCrotchets']}
  };
  const total = pattern => pattern.reduce((sum, id) => sum + beats[id], 0);
  const capacity = signature => { const [top,bottom] = signature.split('/').map(Number); return top * 4 / bottom; };
  function toolsFor(level, signature) {
    return levels[level].tools.filter(id => beats[id] <= capacity(signature) && (signature !== '6/8' || !id.startsWith('triplet')));
  }
  function chunksFor(level, signature) {
    const index = ['N3','N4','N5','H','AH'].indexOf(level);
    if (signature === '6/8') return [['dottedCrotchet'], ['quaver','quaver','quaver'], ['crotchet','quaver'], ['quaverRest','quaver','quaver']];
    const chunks = [['semibreve'],['dottedMinim'],['minim'],['crotchet']];
    if (index >= 1) chunks.push(['quaver','quaver'], ['semiquaver','semiquaver','semiquaver','semiquaver']);
    if (index >= 2) chunks.push(['dottedCrotchet','quaver'], ['dottedQuaver','semiquaver']);
    if (index >= 3) chunks.push(['crotchetRest'], ['minimRest'], ['semibreveRest'], ['quaverRest','quaver'], ['tripletQuavers'], ['tripletCrotchets']);
    if (index >= 4) chunks.push(['quaver','crotchet','quaver']);
    return chunks.filter(chunk => chunk.every(id => toolsFor(level, signature).includes(id)));
  }
  const patternCache = new Map();
  const beginnerBags = new WeakMap();
  const lastQuestions = new WeakMap();
  // Select complete bars, so early long-note choices cannot crowd out shorter patterns.
  function patternsFor(level, signature) {
    const key = `${level}/${signature}`;
    if (!patternCache.has(key)) {
      const patterns = new Map(), chunks = chunksFor(level, signature);
      function fill(pattern, remaining) {
        if (!remaining) {
          if (pattern.some(id => !id.endsWith('Rest'))) patterns.set(pattern.join('|'), pattern);
          return;
        }
        for (const chunk of chunks) if (total(chunk) <= remaining) fill([...pattern, ...chunk], remaining-total(chunk));
      }
      fill([], capacity(signature));
      patternCache.set(key, [...patterns.values()]);
    }
    return patternCache.get(key);
  }
  function create(level, random = Math.random) {
    level = levels[level] ? level : "N3";
    const config = levels[level];
    const choose = values => values[Math.min(values.length - 1, Math.max(0, Math.floor((Number(random()) || 0) * values.length)))];
    const signature = choose(config.signatures), pool = patternsFor(level, signature);
    const patterns = Array.from({length:config.bars}, () => {
      if (level !== 'N3') return [...choose(pool)];
      // N3 has eight possible bars. Cover all eight before revisiting one.
      let record = beginnerBags.get(random);
      if (!record) { record = {bag:[], last:null}; beginnerBags.set(random,record); }
      if (!record.bag.length) {
        record.bag = [...pool];
        for (let i=record.bag.length-1;i>0;i--) {const j=choose(Array.from({length:i+1},(_,n)=>n));[record.bag[i],record.bag[j]]=[record.bag[j],record.bag[i]];}
        if (record.bag.at(-1) === record.last) [record.bag[0],record.bag[record.bag.length-1]]=[record.bag.at(-1),record.bag[0]];
      }
      record.last=record.bag.pop();return [...record.last];
    });
    let history=lastQuestions.get(random);
    if(!history){history=new Map();lastQuestions.set(random,history);}
    const fingerprint=()=>JSON.stringify([signature,patterns]);
    for(let attempt=0;level!=="N3"&&history.get(level)===fingerprint()&&attempt<20;attempt++)patterns.forEach((_,bar)=>{patterns[bar]=[...choose(pool)];});
    history.set(level,fingerprint());
    return {signature, patterns, entered:patterns.map(() => []), activeBar:0};
  }
  function append(state, id, level) {
    const bar = state.activeBar;
    if (!toolsFor(level, state.signature).includes(id) || total(state.entered[bar]) + beats[id] > capacity(state.signature)) return state;
    const entered = state.entered.map((items,i) => i === bar ? [...items,id] : [...items]);
    const nextBar = total(entered[bar]) === capacity(state.signature) ? entered.findIndex((items,i) => i > bar && total(items) < capacity(state.signature)) : -1;
    return {...state, entered, activeBar:nextBar < 0 ? bar : nextBar};
  }
  function insert(state, bar, index, id, level) {
    if (!state.entered[bar] || !Number.isInteger(index) || index < 0 || index > state.entered[bar].length || !toolsFor(level, state.signature).includes(id) || total(state.entered[bar]) + beats[id] > capacity(state.signature)) return state;
    return {...state, entered:state.entered.map((items,i) => i === bar ? [...items.slice(0,index),id,...items.slice(index)] : [...items]), activeBar:bar};
  }
  function remove(state, bar, index) {
    if (!state.entered[bar] || !Number.isInteger(index) || index < 0 || index >= state.entered[bar].length) return state;
    return {...state, entered:state.entered.map((items,i) => i === bar ? items.filter((_,j) => j !== index) : [...items]), activeBar:bar};
  }
  function undo(state) {
    let bar = state.activeBar;
    if (!state.entered[bar].length && bar > 0) bar--;
    if (!state.entered[bar].length) return state;
    return {...state, entered:state.entered.map((items,i) => i === bar ? items.slice(0,-1) : [...items]), activeBar:bar};
  }
  const clear = state => ({...state, entered:state.entered.map(() => []), activeBar:0});
  const complete = state => state.entered.every(items => total(items) === capacity(state.signature));
  const barCorrect = (state, bar) => JSON.stringify(state.entered[bar]) === JSON.stringify(state.patterns[bar]);
  const correct = state => complete(state) && state.patterns.every((_,bar) => barCorrect(state,bar));
  return {beats,levels,total,capacity,toolsFor,chunksFor,patternsFor,create,append,insert,remove,undo,clear,complete,barCorrect,correct};
});
