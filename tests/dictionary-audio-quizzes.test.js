'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),Core=require('../music-dictionary/quiz-core.js');
test('Higher audio typed answers use Higher concepts only; AH uses Higher and AH',()=>{
 for(const level of ['H','AH'])for(const target of ['N3','N4','N5','H','AH']){
  assert.equal(Core.eligibleForQuiz({modality:'audio',format:'short-answer',options:null,levelCode:target},{level}),level==='H'?target==='H':['H','AH'].includes(target));
  assert(Core.eligibleForQuiz({modality:'audio',format:'multiple-choice',options:[{}],levelCode:target},{level}));
 }
 assert(!Core.eligibleForQuiz({modality:'audio',options:null,levelCode:'H'},{level:'H',audioQuestions:false}));
 assert(!Core.eligibleForQuiz({modality:'text'},{nonAudioQuestions:false}));
 assert(Core.eligibleForQuiz({modality:'text',options:null,levelCode:'N3'},{level:'H'}));
});
test('audio questions require a local Hub library path and one of the supported formats',()=>{
 const base=JSON.parse(fs.readFileSync(path.join(root,'music-dictionary/quiz-data/question-bank.json'))).questions.find(q=>q.format==='short-answer');
 const q={...base,modality:'audio',media:{kind:'audio',src:'./audio/concept-library/01.%20National%203/example.m4a'}};
 assert.deepEqual(Core.validateQuestion(q),[]);
 for(const src of ['https://example.com/audio.m4a','./audio/concept-library/../private.m4a'])assert(Core.validateQuestion({...q,media:{...q.media,src}}).length);
});
test('hosted listening bank preserves source identities, distinct recordings and complete question forms',async()=>{
 const selection=JSON.parse(fs.readFileSync(path.join(root,'music-dictionary/quiz-data/audio-library-selection.json'))),bank=JSON.parse(fs.readFileSync(path.join(root,'music-dictionary/quiz-data/audio-question-bank.json'))),dictionary=require('../music-dictionary/music-concepts-data.js');
 assert.equal(new Set(bank.questions.map(q=>q.id)).size,bank.questions.length);
 for(const c of dictionary.concepts){const qs=bank.questions.filter(q=>q.conceptId===c.id),clips=selection.entries.filter(e=>e.conceptId===c.id),gap=selection.shortfalls.find(g=>g.conceptId===c.id);const retired=(bank.retiredQuestions||[]).filter(q=>q.conceptId===c.id);assert.equal(qs.length+retired.length,clips.length);assert.equal(new Set(clips.map(e=>e.sha256)).size,clips.length);if(!gap&&!retired.length){assert.equal(qs.length,3);assert.equal(qs.filter(q=>q.format==='short-answer').length,1);assert.equal(qs.filter(q=>q.format==='multiple-choice').length,2);}}
 for(const q of bank.questions){assert.deepEqual(Core.validateQuestion(q),[]);assert.equal(await Core.fingerprint(q),q.contentSha256);const entry=selection.entries.find(e=>e.conceptId===q.conceptId&&e.sha256===q.media.sha256);assert(entry);assert.equal(decodeURIComponent(q.media.src),'./'+entry.path);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,entry.path))).digest('hex'),entry.sha256);if(q.options){assert.equal(q.options.length,4);for(const option of q.options){const c=[...dictionary.concepts,...dictionary.legacyConcepts].find(c=>c.id===option.conceptId);assert(c);assert(dictionary.levels.indexOf(c.level)<=dictionary.levels.indexOf(dictionary.concepts.find(c=>c.id===q.conceptId).level));}}}
});

test('standalone audio prompts follow paper instructions without invented playback context',()=>{
 const {audioPrompt}=require('../scripts/quiz-audio-prompts.cjs');
 assert.equal(audioPrompt('style','short-answer'),'Listen to this excerpt and name the style.');
 assert.equal(audioPrompt('voice type','short-answer'),'Listen to this excerpt and name the type of voice.');
 assert.equal(Core.promptHtml(audioPrompt('style','multiple-choice')),'Listen to this excerpt and tick <strong>one</strong> box to describe what you hear.');
 assert.match(audioPrompt('style','multi-select'),/tick two boxes/);
 const bank=JSON.parse(fs.readFileSync(path.join(root,'music-dictionary/quiz-data/audio-question-bank.json')));
 for(const q of bank.questions){
  // Teacher-authored listening tasks may ask for a count or give a specific
  // listening focus; the standard template governs generated prompts only.
  if(q.review?.updatedAt){assert.deepEqual(Core.validateQuestion(q),[],q.id);continue;}
  if(q.editorialCheck?.n4TeacherStyleReview){const reviewed=require('../music-dictionary/quiz-data/n4-upper-level-audit.json').changes.find(r=>r.id===q.id);assert(reviewed,q.id);const prompt=reviewed.fields.find(f=>f.field==='prompt');if(prompt)assert.equal(q.prompt,prompt.after,q.id);assert.match(q.prompt,/^Listen to this excerpt and /,q.id);continue;}
  if(q.editorialCheck?.n3TeacherStyleReview){const reviewed=require('../music-dictionary/quiz-data/upper-level-style-audit.json').changes.find(r=>r.id===q.id);assert(reviewed,q.id);const prompt=reviewed.fields.find(f=>f.field==='prompt');if(prompt)assert.equal(q.prompt,prompt.after,q.id);assert.match(q.prompt,/^Listen to this excerpt and /,q.id);continue;}
  if(q.editorialCheck?.listeningFocusReview){assert.equal(Core.promptText(q.prompt),require('../scripts/quiz-listening-focus.cjs').focusedPrompt(q),q.id);continue;}
  assert.match(q.prompt,/^Listen to this excerpt and /,q.id);
  assert(!/previous|again|twice|three times|for the first time|Which|recording/i.test(q.prompt),q.id);
  if(q.format==='multiple-choice')assert.equal(q.prompt,'Listen to this excerpt and tick one box to describe what you hear.',q.id);
  else assert.match(q.prompt,/and (name|identify) the .+\.$/,q.id);
 }
});
