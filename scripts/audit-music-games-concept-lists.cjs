/* Compare complete games, declared curriculum IDs and directly assessed Blank gaps.
   A higher-level word in a clue/distractor is not itself an assessment target. */
const fs=require('node:fs'),path=require('node:path'),D=require('../music-dictionary/music-concepts-data'),{scope,demandedConcepts,levels}=require('./build-music-games-concept-list.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'music-games/activities');
function run(){
 const index=JSON.parse(fs.readFileSync(path.join(dir,'index.json'))),report={visibleGames:0,legacyHiddenGames:0,byLevel:{},byFormat:{},sourceMappedGames:0,failures:[],aboveLevelGames:[],literacyScopeCautions:[],games:[]};
 const registry=JSON.parse(fs.readFileSync(path.join(root,'music-games/concept-lists.json')));
 for(const entry of index){
  const a=JSON.parse(fs.readFileSync(path.join(dir,entry.id+'.json'))),result=scope(a),rows=result.sections.flatMap(section=>section.rows),demands=demandedConcepts(a);
  const sourceIds=[...new Set([...(a.sourceConceptIds||[]),...a.items.map(item=>item.sourceConceptId).filter(Boolean)])];
  const errors=[];
  if(JSON.stringify(result)!==JSON.stringify(registry.activities[a.id]))errors.push('Published concept list is stale');
  if(!rows.length)errors.push('No assessment scope');
  for(const id of sourceIds){const c=D.concepts.find(c=>c.id===id);if(!c)errors.push('Unknown source '+id);else if(!rows.some(row=>row.href?.includes('concept='+id)))errors.push('Missing source concept '+id);}
  const foreign=rows.filter(row=>row.curriculum!=='extension'&&levels.indexOf(row.level)>levels.indexOf(a.level));
  const direct=foreign.filter(row=>row.kind!=='literacy').map(row=>({...row,evidence:demands.filter(d=>d.name===row.name).map(d=>({itemId:d.itemId,gap:d.gap,sentence:d.sentence}))}));
  const literacy=foreign.filter(row=>row.kind==='literacy');
  const record={id:a.id,title:a.title,level:a.level,format:a.template,hidden:!!entry.catalogueHidden,items:a.items.length,sourceConcepts:sourceIds.length,listedConcepts:rows.length,aboveLevel:direct,literacyCautions:literacy,errors};
  report.games.push(record);
  if(entry.catalogueHidden)report.legacyHiddenGames++;else{
   report.visibleGames++;report.byLevel[a.level]=(report.byLevel[a.level]||0)+1;report.byFormat[a.template]=(report.byFormat[a.template]||0)+1;if(sourceIds.length)report.sourceMappedGames++;
   if(direct.length)report.aboveLevelGames.push(record);
   if(literacy.length)report.literacyScopeCautions.push(record);
  }
  if(errors.length)report.failures.push({id:a.id,errors});
 }
 return report;
}
function write(report){const out=path.join(root,'maintenance/generated/concept-lists');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 let md=`# Music Games assessment scope audit\n\nChecked ${report.visibleGames} visible games across all five levels and ten formats, plus ${report.legacyHiddenGames} retained games accessible by old links. ${report.sourceMappedGames} visible games have explicit source concept IDs.\n\nThe checks use the local Dictionary for listening concepts and the Hub literacy list for notation skills. These have different qualification levels. Lower-level revision concepts are allowed. Clue examples and distractors are excluded; named terms pupils must insert into Blank questions are included. Instrument-part labels are contextual knowledge, rather than homonyms of music concepts.\n\n## Counts\n\n| Level | Visible games |\n|---|---:|\n`;
 for(const level of levels)md+=`| ${level} | ${report.byLevel[level]} |\n`;
 md+=`\n## Confirmed above-level terms required in Blank games\n\n${report.aboveLevelGames.length} visible games require named concepts from a later level. Any remaining issues are listed below with their required gaps. The seven reviewed games were rebuilt with level-appropriate questions and fresh concept lists.\n`;
 for(const a of report.aboveLevelGames){md+=`\n### ${a.level}: ${a.title} (${a.format})\n\n[Open game](http://localhost:8765/${require('../shared/music-games-apps').forTemplate(a.format).id}.html?activity=${a.id}&level=${a.level}&game=${a.format}&source=hub)\n\n`;for(const row of a.aboveLevel){md+=`- **${row.name} (${row.level})**`;if(row.evidence.length)md+=`: ${row.evidence.map(e=>`Required gap “${e.gap}” in “${e.sentence}”`).join(' ')}`;else md+=': directly assessed named target.';md+='\n';}}
 md+='\n## Literacy framework cautions\n\nThe N5 Mixed Sentences tonic/dominant question was replaced with a pentatonic-scale question. Leap was replaced with Repetition in the two N3 literacy games. Any remaining literacy progression cautions are listed below, separately from higher-level listening targets.\n';
 for(const a of report.literacyScopeCautions)md+=`\n- ${a.id}: ${a.literacyCautions.map(row=>`${row.name} (${row.level} literacy)`).join(', ')}.\n`;
 md+=`\n## List verification\n\n${report.failures.length} failures for published-list freshness, missing source concepts or empty scope.\n\nCorrections include separate listening/literacy classification, all Blank gaps rather than just the first, contextual meanings of Chorus and Bridge, complete mixed-sentence topics, primary Styles topics, combined Bowing/Arco and Muted/Con sordino targets, and no Ayre match for ordinary air.\n\nThe machine-readable report records every game, format, source count, listed scope and above-level evidence. This audits declared textual targets and authored diagram labels; it does not independently re-transcribe embedded notation images or claim every clue is pedagogically ideal.\n`;
 fs.writeFileSync(path.join(out,'report.md'),md);
}
if(require.main===module){const r=run();write(r);console.log(JSON.stringify({visible:r.visibleGames,hidden:r.legacyHiddenGames,byLevel:r.byLevel,sourceMapped:r.sourceMappedGames,aboveLevel:r.aboveLevelGames.map(a=>({id:a.id,terms:a.aboveLevel.map(r=>r.name+' ('+r.level+')')})),literacyCautions:r.literacyScopeCautions.map(a=>a.id),failures:r.failures},null,2));if(r.failures.length)process.exitCode=1;}
module.exports={run,write};
