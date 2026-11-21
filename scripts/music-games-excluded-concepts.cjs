/* Concepts deliberately omitted from Music Games, while remaining in the Dictionary. */
const ids=new Set(['MC-0011','MC-0082','MC-0157','MC-0233','MC-0278','MC-0279']);
const names=/^(?:chord change|chord progressions.*|chord two|chord ii(?:\b.*)?|chords I, IV, V and VI in major and minor keys|interval)$/i;
const excludedName=value=>names.test(String(value||'').trim());
const excludedItem=item=>excludedName(item.answer)||excludedName(item.group)||excludedName(item.clozeText?.split(' — ')[0])||/\bchord II\b/i.test(item.prompt||'');
function filterActivity(activity){
 // Connections requires four tiles per group. Replace this legacy harmony
 // example with another valid harmony concept rather than leaving a short group.
 const source=activity.items.map(item=>activity.id==='hub-mmo-connection-ah-3'&&excludedName(item.answer)?{...item,prompt:'augmented triad',answer:'augmented triad'}:item);
 const items=source.filter(item=>!excludedItem(item));
 const pool=items.map(item=>item.answer).filter(Boolean);
 const clean=values=>(values||[]).filter(value=>!excludedName(value));
 const result={...activity,items:items.map(item=>{
   const row={...item,distractors:clean(item.distractors)};
   if(item.answerOptions){const options=clean(item.answerOptions);for(const answer of pool){if(options.length>=item.answerOptions.length)break;if(!options.includes(answer)&&!(item.correctAnswers||[]).includes(answer))options.push(answer);}row.answerOptions=options;row.distractors=options.filter(answer=>answer!==item.answer&&!(item.correctAnswers||[]).includes(answer));}
   return row;
 })};
 if(activity.specialMode==='level-test'){
  const label={N3:'National 3',N4:'National 4',N5:'National 5',H:'Higher',AH:'Advanced Higher'}[activity.level];
  result.conceptCount=activity.collectionId?items.length:require('../music-dictionary/music-concepts-data').concepts.filter(c=>c.level===label&&!ids.has(c.id)).length;
 }
 return result;
}
module.exports={ids,excludedName,excludedItem,filterActivity};
