/* Build listening questions from the verified, Hub-hosted library selection. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),D=require(path.join(ROOT,'music-dictionary/music-concepts-data.js')),C=require(path.join(ROOT,'music-dictionary/quiz-core.js')),Collections=require(path.join(ROOT,'music-dictionary/quiz-collections.js'));
const codes=['N3','N4','N5','H','AH'],normal=s=>s.toLowerCase().replace(/[^a-z0-9]/g,''),byId=new Map(D.concepts.map(c=>[c.id,c]));
const selection=JSON.parse(fs.readFileSync(path.join(ROOT,'music-dictionary/quiz-data/audio-library-selection.json'))),text=JSON.parse(fs.readFileSync(path.join(ROOT,'music-dictionary/quiz-data/question-bank.json')));
const facets=[
 ['voice-types'],['articulation','playing-techniques'],['ornaments'],['tonality'],['cadences'],['scales'],['chords'],['tempo'],['rhythm-metre'],['orchestra'],['instruments-ensembles'],['vocal-techniques'],['voices-vocal-music','texture'],['sonata-form','texture-structure','musical-development','bass-lines']
].map(ids=>({ids,concepts:new Set(Collections.groupsForLevel('ALL').filter(g=>ids.includes(g.id)).flatMap(g=>g.conceptIds))}));
const {recordingConcepts,allowedDistractor}=require('./quiz-distractor-overlap.cjs');
const {audioPrompt}=require('./quiz-audio-prompts.cjs');
const {questionVocabularyErrors}=require('./quiz-question-vocabulary.cjs');
const outputPath=path.join(ROOT,'music-dictionary/quiz-data/audio-question-bank.json');
const previous=fs.existsSync(outputPath)?JSON.parse(fs.readFileSync(outputPath)):{questions:[]};
const retired=new Set(previous.retiredQuestionIds||[]);
const questions=[],warnings=[];
function listeningFocus(c){if(c.categories.includes('Styles'))return 'style';const facet=facets.find(f=>f.concepts.has(c.id));const id=facet?.ids[0];return ({'voice-types':'voice type','articulation':'articulation or playing technique','ornaments':'ornament','tonality':'tonality','cadences':'cadence','scales':'scale','chords':'chord or chord progression','tempo':'tempo','rhythm-metre':'rhythm','orchestra':'orchestral instrument or family','instruments-ensembles':'instrument or ensemble','vocal-techniques':'vocal technique or word setting','voices-vocal-music':'texture','sonata-form':'musical device or form'})[id]||'musical concept';}

function chooseDistractors(concept,entry){
 const recordingIds=recordingConcepts(entry,selection.entries);
 const ceiling=D.levels.indexOf(concept.level),known=new Set([concept.name,...concept.aliases,...entry.taggedConcepts].map(normal));
 const possible=D.concepts.filter(c=>allowedDistractor(concept.id,c.id,recordingIds)&&D.levels.indexOf(c.level)<=ceiling&&![c.name,...c.aliases].some(n=>known.has(normal(n))));
 const facet=concept.categories.includes('Styles')?null:facets.find(f=>f.concepts.has(concept.id));
 const ranked=possible.map(c=>{let rank=0;if(concept.categories.includes('Styles'))rank+=c.categories.includes('Styles')?100:0;else if(facet)rank+=facet.concepts.has(c.id)?100:0;rank+=c.categories.some(cat=>concept.categories.includes(cat))?20:0;rank+=c.level===concept.level?4:0;const tie=crypto.createHash('sha256').update(entry.sha256+c.id).digest('hex');return {c,rank,tie};}).sort((a,b)=>b.rank-a.rank||a.tie.localeCompare(b.tie));
 const result=[],names=new Set();for(const {c,rank} of ranked){if(names.has(normal(c.name)))continue;result.push(c);names.add(normal(c.name));if(result.length===3)break;}
 if(result.length!==3)throw Error('No distractors for '+concept.id);
 if(facet&&result.some(c=>!facet.concepts.has(c.id)))warnings.push({conceptId:concept.id,recording:entry.path,note:'The topic has fewer than four distinct eligible concepts; options include another concept from the same or an earlier qualification.'});
 return result;
}
(async()=>{
 for(const concept of D.concepts){if(!C.canGenerateForConcept(text,concept.id)){questions.push(...previous.questions.filter(q=>q.conceptId===concept.id&&!retired.has(q.id)).map(C.copy));continue;}const entries=selection.entries.filter(e=>e.conceptId===concept.id),base=text.questions.find(q=>q.conceptId===concept.id&&q.format==='short-answer')||previous.questions.find(q=>q.conceptId===concept.id&&q.format==='short-answer')||text.questions.find(q=>q.conceptId===concept.id)||previous.questions.find(q=>q.conceptId===concept.id);
 for(const [i,e] of entries.entries()){
  const typed=i===1,id='AQ-'+codes[D.levels.indexOf(concept.level)]+'-'+concept.id.replace('-','')+'-'+String(i+1).padStart(2,'0');
  if(retired.has(id))continue;
  const saved=previous.questions.find(q=>q.id===id);
  if((saved?.editorialCheck?.scottishMarchContext||saved?.review?.finalisedAt||saved?.review?.updatedAt||saved?.editorialCheck?.n3TeacherStyleReview||saved?.editorialCheck?.classroomWording||saved?.editorialCheck?.listeningFocusReview||saved?.editorialCheck?.audioExcerpt)&&(saved?.editorialCheck?.scottishMarchContext||saved?.review?.finalisedAt||saved.media?.sha256===e.sha256)){questions.push(C.copy(saved));continue;}
  if(!base)throw new Error('No source question remains for '+concept.id);
  const q=C.copy(base);
  if(typed&&q.options){q.options=null;q.answer={canonical:concept.name,acceptedVariants:[...new Set([concept.name,...concept.aliases])],matching:{caseSensitive:false,trim:true,collapseWhitespace:true,fuzzyMatching:false}};}
  Object.assign(q,{id,objectiveId:id+'-O01',objective:'Identify '+concept.name+' by listening to a library recording.',factGroupId:concept.id+'-audio-'+e.sha256.slice(0,16),relatedFactGroupIds:[],format:typed?'short-answer':'multiple-choice',modality:'audio',prompt:audioPrompt(listeningFocus(concept),typed?'short-answer':'multiple-choice'),media:{kind:'audio',src:'./'+e.path.split('/').map(encodeURIComponent).join('/'),recording:e.recording,duration:e.duration,sha256:e.sha256,libraryPath:e.libraryPath},review:{editorialNotes:'Audio concept assignment comes from the existing Concept Audio Library. Check the listening focus and distractors while reviewing the recording.'},editorialCheck:{wording:'Audio identification, with four named choices or an answer line.',answer:'Existing library concept assignment; needs teacher listening review.',distractors:'Concept names at this qualification or earlier; equivalent, parent/member and compatible Dictionary concepts, recording-title concepts and shared-recording tags excluded.',teacherReview:'pending'}});
  delete q.variantOfQuestionId;
  q.evidence.push({kind:'repository',path:'audio-concept-library-data.json',locator:e.libraryPath,supportingText:concept.name+' · '+e.recording,verification:'Copied byte-for-byte from the synced library; SHA-256 and local playback checked separately. Library assignment retained; full teacher listening review pending.'});
  if(!typed){const distractors=chooseDistractors(concept,e),choices=[concept,...distractors].map(c=>({concept:c,sort:crypto.createHash('sha256').update(id+c.id).digest('hex')})).sort((a,b)=>a.sort.localeCompare(b.sort));q.options=choices.map(({concept:c},n)=>({id:String.fromCharCode(97+n),text:c.name,conceptId:c.id,editorialRationale:c.id===concept.id?'Library assigns this recording to the target concept.':'Different concept at the target qualification or earlier; known overlapping terms and recording tags excluded. Listening review is still required to confirm absence.'}));q.answer={correctOptionIds:q.options.filter(o=>o.conceptId===concept.id).map(o=>o.id)};q.relatedConceptIds=distractors.map(c=>c.id);}
  q.contentSha256=await C.fingerprint(q);const errors=[...C.validateQuestion(q),...questionVocabularyErrors(q)];if(errors.length)throw Error(id+': '+errors.join(' '));questions.push(q);
 }
 }
 const published=questions.filter(q=>!retired.has(q.id)).map(q=>{const saved=previous.questions.find(old=>old.id===q.id);return (saved?.editorialCheck?.scottishMarchContext||saved?.review?.finalisedAt||saved?.review?.updatedAt||saved?.editorialCheck?.n3TeacherStyleReview||saved?.editorialCheck?.classroomWording||saved?.editorialCheck?.listeningFocusReview||saved?.editorialCheck?.audioExcerpt)&&(saved?.editorialCheck?.scottishMarchContext||saved?.review?.finalisedAt||saved.media?.sha256===q.media.sha256)?saved:q;});
 const bank={...previous,schemaVersion:1,bankId:'mlh-concept-quiz-audio-1',title:'Concept Audio Questions',questions:published,retiredQuestionIds:[...retired],shortfalls:selection.shortfalls,reviewNotes:warnings};
 bank.reviewMigrations=(previous.reviewMigrations||[]).filter(m=>published.some(q=>q.id===m.id&&q.contentSha256===m.to));
 fs.writeFileSync(outputPath,JSON.stringify(bank,null,2)+'\n');
 console.log('Audio bank: '+questions.length+' questions for '+new Set(questions.map(q=>q.conceptId)).size+' concepts; '+selection.shortfalls.length+' recording shortfalls.');
})().catch(e=>{console.error(e);process.exitCode=1});
