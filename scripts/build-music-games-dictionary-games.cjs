/* Build short, level-specific Music Games sets from the current Music Dictionary. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const dictionary = require('../music-dictionary/music-concepts-data.js');
const core = require('../music-games/core.js');
const {buildBlankItems}=require('./music-games-blank-passages.cjs');
const revision = require('../music-dictionary/music-concepts-revision-groups.js');
const levels = [ ['N3','National 3','national3'], ['N4','National 4','national4'], ['N5','National 5','national5'], ['H','Higher','higher'], ['AH','Advanced Higher','advanced-higher'] ];
const questions = levels.flatMap(([, , file]) => require(`../data/questions/music-concepts/${file}.json`).questions);
const byId = new Map(dictionary.concepts.map(concept => [concept.id,concept]));
const labels = {'Styles':'Styles','Melody/harmony':'Melody and Harmony','Rhythm/tempo':'Rhythm and Tempo','Texture/structure/form':'Texture and Structure','Timbre':'Instruments and Voices','Rhythm and Structure':'Rhythm and Structure'};
const formats = [['wordsearch','Word'],['crossword','Crossword']];
const equivalents = [ ['MC-0184','MC-0188'], ['MC-0036','MC-0086'], ['MC-0098','MC-0176'], ['MC-0255','MC-0296'] ];
const equivalent = (a,b) => a===b || equivalents.some(group=>group.includes(a)&&group.includes(b));
const canonical = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const slug = text => canonical(text).replaceAll(' ','-');
const statement = text => text.replace(/\s*(?:What is this|Which concept is this)\?\s*$/i,'').trim();
const spelling = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const puzzleAnswer=concept=>spelling(wordNames[concept.id]||concept.name.replace(/\s*\([^)]*\)/g,'').split(/\s+or\s+|\s*\/\s*/)[0].trim());
const wordNames = {'MC-0227':'Added sixth','MC-0228':'Diminished seventh','MC-0230':'Dominant seventh','MC-0242':'Three against two'};
function source(concept) {
 const question = questions.find(item=>item.conceptId===concept.id&&item.answerMode==='concept');
 if(question)return {question, prompt:question.question};
 if(concept.id==='MC-0020')return {question:null,prompt:'Regular groupings of two, three or four beats in each bar. Which concept describes these groupings?'};
 throw Error(`Missing definition clue for ${concept.id}`);
}
function alternatives(concept) {
 const names = [concept.name,...concept.aliases,...concept.name.split(/\s+or\s+|\s*\/\s*/),spelling(concept.name),concept.name.replace(/[’']/g,''),concept.name.replace(/-/g,' ')];
 if(concept.id==='MC-0184')names.push('Polyphonic');
 if(concept.id==='MC-0188')names.push('Contrapuntal');
 return [...new Map(names.filter(Boolean).map(name=>[core.canonical(name),name])).values()].slice(0,8);
}
function distractors(concept, pool) {
 const selected = source(concept).question;
 const options = selected ? selected.answers.filter(answer=>!answer.correct).map(answer=>answer.text) : [];
 options.push(...pool.filter(item=>!equivalent(item.id,concept.id)).map(item=>item.name));
 const acceptable = new Set(alternatives(concept).map(canonical));
 const equivalentNames = new Set(dictionary.concepts.filter(item=>equivalent(item.id,concept.id)).flatMap(alternatives).map(canonical));
 const used = new Set();
 return options.filter(name=>{
  const key=canonical(name);
  if(acceptable.has(key)||equivalentNames.has(key)||used.has(key))return false;
  used.add(key);return true;
 }).slice(0,3);
}
function batches(concepts, maximum=10) {
 const minimumGroups = equivalents.reduce((max,group)=>Math.max(max,concepts.filter(item=>group.includes(item.id)).length),1);
 const groups=Array.from({length:Math.max(minimumGroups,Math.ceil(concepts.length/maximum))},()=>[]);
 for(const concept of concepts) {
  const target=groups.filter(group=>group.length<maximum&&!group.some(item=>equivalent(item.id,concept.id))).sort((a,b)=>a.length-b.length)[0];
  if(!target)throw Error('Could not separate synonymous clues.');
  target.push(concept);
 }
 return groups.filter(group=>group.length);
}
const generated=[], manifest=[];
function add({code,label,topic,part,parts,template,format,concepts,cloze=false}) {
 if(!C.isHubLibraryTemplate(template))return;
 const id=`hub-dictionary-${code.toLowerCase()}-${slug(topic)}-${template}-${part}`;
 const pool=dictionary.concepts.filter(concept=>concept.level===label||concepts.some(item=>item.id===concept.id));
 const rows=cloze?buildBlankItems(code,id):concepts.map(concept=>{
  const origin=source(concept), answer=['wordsearch','crossword'].includes(template)?puzzleAnswer(concept):concept.name;
  const prompt=template==='quiz'&&topic==='Mixed Definitions'?statement(origin.prompt):template==='quiz'||template==='type-the-answer'?origin.prompt:statement(origin.prompt);
  const row={id:`${id}-${concept.id.toLowerCase()}`,prompt,answer,distractors:distractors(concept,pool),group:concept.categories[0]};
  if(template==='quiz'||template==='true-or-false')row.answerOptions=[answer,...row.distractors];
  if(template==='type-the-answer')row.correctAnswers=alternatives(concept);
  return row;
 });
 const raw={id,level:code,title:cloze?'Mixed Sentences':`${topic}${parts>1?' '+part:''}`,instructions:'',description:cloze?'Complete varied musical sentences using a word bank, including sentences with two missing words.':`Revise ${topic.toLowerCase()} with ${concepts.length} Music Dictionary concepts.${parts>1?' Set '+part+' of '+parts+'.':''}`,folder:'Music Dictionary',tags:['Music Dictionary',topic,format],template,items:rows,options:{shuffle:true,timer:0,difficulty:'normal',theme:'blue',sound:false},revision:1,updatedAt:'2026-10-23T12:00:00.000Z'};
 if(template==='wordsearch')raw.editorMode='with-clues';
 const activity=core.normalize(raw),errors=core.validateActivity(activity);
 if(errors.length)throw Error(id+': '+errors.join('; '));
 if(activity.items.length>20)throw Error('Oversized activity '+id);
 if(new Set(activity.items.map(item=>canonical(item.answer))).size!==activity.items.length)throw Error('Duplicate answer '+id);
 const file=path.join(ROOT,'music-games/activities',id+'.json');
 fs.writeFileSync(file,JSON.stringify(activity,null,2)+'\n');
 generated.push(activity);
 manifest.push({id,level:code,topic,template,...(cloze?{authoredPassages:true,passages:rows}:{}),...(topic==='Mixed Definitions'&&template==='quiz'?{supplemental:true}:{}),items:cloze?[]:concepts.map(concept=>({conceptId:concept.id,itemId:`${id}-${concept.id.toLowerCase()}`,sourceQuestion:source(concept).question?.id||null}))});
}
const themeIds=new Set(['baroque','classical','romantic','renaissance-music','modern-20th-century','jazz-popular-music','scottish-music','world-music','orchestra','ensemble-types']);
for(const [code,label]of levels) {
 const concepts=dictionary.concepts.filter(concept=>concept.level===label&&!require('./music-games-excluded-concepts.cjs').ids.has(concept.id));
 const categories=new Map(dictionary.categories.map(category=>[category,concepts.filter(concept=>concept.categories[0]===category)]));
 if(categories.get('Rhythm/tempo').length<2){categories.set('Rhythm and Structure',[...categories.get('Rhythm/tempo'),...categories.get('Texture/structure/form')]);categories.delete('Rhythm/tempo');categories.delete('Texture/structure/form');}
 for(const [category,rows]of categories) {
  if(!rows.length)continue;
  const groups=batches(rows),topic=labels[category];
  for(const [index,batch]of groups.entries())for(const [template,format]of formats){
   let selected=batch;
   if(['wordsearch','crossword'].includes(template)){
    selected=batch.filter(concept=>{const answer=puzzleAnswer(concept);return !/[0-9]/.test(answer)&&/^[A-Za-z '\u2019-]+$/.test(answer)&&answer.replace(/[^A-Za-z]/g,'').length<=24;});
    if(selected.length<2)continue;
   }
   add({code,label,topic,part:index+1,parts:groups.length,template,format,concepts:selected});
  }
 }
 // Mixed definitions belong to Quiz; Blank uses authored sentence completions.
 const mixed=dictionary.categories.flatMap(category=>concepts.filter(concept=>concept.categories[0]===category).slice(0,2)).slice(0,10);
 add({code,label,topic:'Mixed Definitions',part:1,parts:1,template:'quiz',format:'Quiz',concepts:mixed});
 add({code,label,topic:'Mixed Definitions',part:1,parts:1,template:'complete-the-sentence',format:'Blank',concepts:mixed,cloze:true});
 for(const group of revision.groupsForLevel(code).filter(group=>themeIds.has(group.id))){
  const selected=group.conceptIds.map(id=>byId.get(id));
  const groups=batches(selected,20);
  groups.forEach((batch,index)=>add({code,label,topic:group.label+' Revision',part:index+1,parts:groups.length,template:'quiz',format:'Quiz',concepts:batch}));
 }
}
const output=path.join(ROOT,'music-games/assets/music-dictionary');
fs.mkdirSync(output,{recursive:true});
const inventory={source:'music-dictionary/music-concepts-data.js',sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'music-dictionary/music-concepts-data.js'))).digest('hex'),conceptCount:dictionary.concepts.length,activityCount:generated.length,maximumItems:20,activities:manifest};
fs.writeFileSync(path.join(output,'coverage.json'),JSON.stringify(inventory,null,2)+'\n');
const summary=levels.map(([code,label])=>({level:label,total:generated.filter(game=>game.level===code).length,...Object.fromEntries([...formats,['complete-the-sentence','Blank']].map(([template,name])=>[name,generated.filter(game=>game.level===code&&game.template===template).length]))}));
const report=[
 '# Music Dictionary Music Games collection','',
 `${generated.length} activities cover all ${dictionary.concepts.length} current Music Dictionary entries.`,
 '',
 'Mixed-definition multiple-choice activities use Quiz. Blank uses separately authored sentence completions with varied gap positions, word-bank sizes and two-gap sentences.',
 'Each entry appears once at its introduction level in each of Quiz, Match, Type and Truth. Additional quizzes revise the existing period, style, cultural and ensemble categories up to the selected level. Word and Crossword sets use alphabetic terms of up to 24 letters, with at most ten words so the players omit no authored entries. Long or numerical terms remain covered by the main formats. Each level also has supplemental mixed-definition Quiz and mixed-sentence Blank activities.',
 '',
 '| Level | Games | Quiz | Match | Type | Truth | Word | Crossword | Blank |',
 '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
 ...summary.map(row=>`| ${row.level} | ${row.total} | ${row.Quiz} | ${row.Match} | ${row.Type} | ${row.Truth} | ${row.Word} | ${row.Crossword} | ${row.Blank} |`),
 '',
 'Source clues come from the existing level question banks, with an explicit Dictionary-based clue for MC-0020. The coverage.json inventory records every item and source question. Synonymous textures are separated in matching/truth sets, quiz distractors exclude accepted equivalents, and Type accepts the recorded spelling and terminology alternatives.',
 '',
 'Rebuild content with `node scripts/build-music-games-dictionary-games.cjs`, then refresh the catalogue, previews and browser bundles with `node scripts/build-music-games.js`. Validate with `node --test music-games/dictionary-games.test.js`.',
 ''
];
fs.writeFileSync(path.join(output,'README.md'),report.join('\n'));
console.table(summary);
console.log(`Created ${generated.length} activities covering ${dictionary.concepts.length} Dictionary entries.`);
