/* Conservative listening-option exclusions, grounded in the Hub Dictionary.
 * These are compatibility exclusions, not claims that the terms are synonyms.
 * Do not take their transitive closure: sibling forms can still be alternatives.
 */
'use strict';
const D=require('../music-dictionary/music-concepts-data.js');
const normal=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const names=c=>[c.name,...c.aliases];
const byId=new Map([...D.concepts,...(D.legacyConcepts||[])].map(c=>[c.id,c]));
const pairs=new Set(),pair=(a,b)=>[a,b].sort().join('|');
function link(a,others){for(const b of others)pairs.add(pair(a,b));}
function group(ids){for(const a of ids)link(a,ids);}
// A parent period/genre/family must never be marked wrong beside its members.
const families={
 'MC-0274':['MC-0262','MC-0263','MC-0264','MC-0268','MC-0269','MC-0270','MC-0273','MC-0218','MC-0297'],
 'MC-0070':['MC-0071','MC-0073','MC-0144','MC-0147','MC-0218','MC-0220','MC-0223','MC-0249','MC-0265','MC-0290'],
 'MC-0148':['MC-0071','MC-0073','MC-0144','MC-0147','MC-0154','MC-0214','MC-0218','MC-0220','MC-0223','MC-0225','MC-0299'],
 'MC-0077':['MC-0071','MC-0073','MC-0144','MC-0147','MC-0154','MC-0214','MC-0217','MC-0218','MC-0220','MC-0223','MC-0225','MC-0271','MC-0294','MC-0299'],
 'MC-0002':['MC-0001','MC-0074','MC-0079','MC-0216','MC-0266'],
 'MC-0005':['MC-0006','MC-0007','MC-0075','MC-0076','MC-0146','MC-0224','MC-0267'],
 'MC-0006':['MC-0007','MC-0146','MC-0216'],
 'MC-0008':['MC-0072','MC-0078','MC-0145','MC-0146','MC-0149','MC-0153','MC-0155'],
 'MC-0214':['MC-0225','MC-0297','MC-0299'],
 'MC-0063':['MC-0051','MC-0119','MC-0123','MC-0127','MC-0141','MC-0199','MC-0213'],
 'MC-0047':['MC-0139','MC-0140','MC-0202','MC-0212'],
 'MC-0068':['MC-0120','MC-0124','MC-0130','MC-0131','MC-0132','MC-0195','MC-0205','MC-0206'],
 'MC-0056':['MC-0049','MC-0061','MC-0116','MC-0121','MC-0125','MC-0126','MC-0133','MC-0135','MC-0137','MC-0138','MC-0143','MC-0196','MC-0197','MC-0198','MC-0203','MC-0211'],
 'MC-0049':['MC-0116','MC-0121','MC-0133','MC-0203'],
 'MC-0067':['MC-0048','MC-0113','MC-0114','MC-0115','MC-0134','MC-0136','MC-0194','MC-0204','MC-0298'],
 'MC-0087':['MC-0164','MC-0174','MC-0226','MC-0236','MC-0276','MC-0284'],
 'MC-0090':['MC-0089','MC-0158','MC-0175','MC-0231','MC-0234','MC-0235'],
 'MC-0010':['MC-0013','MC-0080','MC-0082','MC-0157','MC-0159','MC-0227','MC-0228','MC-0229','MC-0230','MC-0277','MC-0278','MC-0279'],
 'MC-0017':['MC-0037','MC-0038','MC-0107','MC-0111','MC-0186','MC-0190','MC-0252'],
 'MC-0108':['MC-0038','MC-0107','MC-0286','MC-0289','MC-0290','MC-0295'],
 'MC-0188':['MC-0038','MC-0107','MC-0108','MC-0184','MC-0289','MC-0290','MC-0295'],
 'MC-0187':['MC-0034','MC-0035','MC-0010','MC-0114'],
 'MC-0035':['MC-0034','MC-0010','MC-0184','MC-0187','MC-0188'],
 'MC-0177':['MC-0242','MC-0285'],
 'MC-0105':['MC-0028','MC-0099','MC-0102'],
 'MC-0254':['MC-0251','MC-0255','MC-0288'],
 'MC-0290':['MC-0251','MC-0286','MC-0289','MC-0295','MC-0296'],
 'MC-0252':['MC-0186','MC-0111'],
 'MC-0250':['MC-0144','MC-0110'],
 'MC-0275':['MC-0156','MC-0282','MC-0291','MC-0293']
};
for(const [parent,members] of Object.entries(families))link(parent,members);
for(const ids of [
 ['MC-0036','MC-0086'],['MC-0081','MC-0168'],['MC-0184','MC-0188'],
 ['MC-0046','MC-0193'],['MC-0058','MC-0207','MC-0064'],['MC-0129','MC-0200'],
 ['MC-0040','MC-0192'],['MC-0098','MC-0176'],['MC-0101','MC-0179','MC-0032'],
 ['MC-0026','MC-0095'],['MC-0051','MC-0141'],['MC-0127','MC-0199'],
 ['MC-0255','MC-0296'],['MC-0038','MC-0107'],['MC-0164','MC-0226','MC-0276'],
 ['MC-0082','MC-0157','MC-0279'],['MC-0161','MC-0162','MC-0237','MC-0289'],
 ['MC-0083','MC-0088','MC-0166'],['MC-0037','MC-0093','MC-0181','MC-0186','MC-0191'],
 ['MC-0016','MC-0287'],['MC-0167','MC-0257'],['MC-0239','MC-0240'],
 ['MC-0096','MC-0028'],['MC-0242','MC-0247'],['MC-0264','MC-0269']
])group(ids);
// Include explicit relationships in the definitions and equivalent aliases.
// Excluding a term mentioned as a contrast is harmless and deliberately cautious.
const contains=(text,term)=>(' '+normal(text)+' ').includes(' '+normal(term)+' ');
for(const a of D.concepts)for(const b of D.concepts){
 if(names(a).some(n=>names(b).some(m=>normal(n)===normal(m)))||names(b).some(n=>normal(n).length>=5&&contains(a.definition,n)))link(a.id,[b.id]);
}
function overlaps(a,b){return a===b||pairs.has(pair(a,b));}
function recordingConcepts(entry,entries=[]){
 const ids=new Set([entry.conceptId]);
 const related=[entry,...entries.filter(e=>e.sha256===entry.sha256)];
 for(const e of related)for(const c of D.concepts)if(names(c).some(n=>(e.taggedConcepts||[]).some(t=>normal(n)===normal(t))||normal(n).length>=5&&contains(e.recording,n)))ids.add(c.id);
 return ids;
}
function allowedDistractor(target,candidate,known=new Set([target])){return ![...known,target].some(id=>overlaps(id,candidate));}
function audioOverlapErrors(q,entries){
 if(!q.options)return [];
 const entry=entries.find(e=>e.conceptId===q.conceptId&&e.path===decodeURIComponent(q.media.src).replace(/^\.\//,''));
 if(!entry)return [q.id+': missing audio-selection entry'];
 const known=recordingConcepts(entry,entries);
 return q.options.filter(o=>!q.answer.correctOptionIds.includes(o.id)).flatMap(o=>{
  const c=byId.get(o.conceptId),target=byId.get(q.conceptId);
  if(!c||!target)return [q.id+': unknown option concept'];
  if(D.levels.indexOf(c.level)>D.levels.indexOf(target.level))return [q.id+': distractor above question level '+c.name];
  return allowedDistractor(q.conceptId,o.conceptId,known)?[]:[q.id+': overlapping distractor '+c.name];
 });
}
module.exports={overlaps,recordingConcepts,allowedDistractor,audioOverlapErrors};
