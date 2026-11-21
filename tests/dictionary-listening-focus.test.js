'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../music-dictionary/quiz-core.js'),{refineListeningQuestion,independentDescription,focusedPrompt}=require('../scripts/quiz-listening-focus.cjs');
const read=name=>JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../music-dictionary/quiz-data',name+'.json'),'utf8'));
test('listening revision preserves protected teacher content and recording windows',()=>{
 const bank=read('audio-question-bank'),selection=read('audio-library-selection'),protectedIds=new Set(read('listening-focus-audit').protectedIds);
 for(const q of bank.questions){const next=refineListeningQuestion(q,selection,protectedIds);assert.deepEqual(next.answer,q.answer,q.id);assert.deepEqual(next.media,q.media,q.id);assert.deepEqual(next.evidence,q.evidence,q.id);if(protectedIds.has(q.id)||q.review?.updatedAt)assert.deepEqual(next,q,q.id);}
});
test('focus distinguishes coexisting melody and accompaniment properties',()=>{
 assert(independentDescription('MC-0009','MC-0019'));assert(independentDescription('MC-0039','MC-0034'));assert(!independentDescription('MC-0009','MC-0012'));
 assert.equal(focusedPrompt({conceptId:'MC-0009',options:[]}), 'Listen to this excerpt and tick one box to identify the direction of the melody.');
 assert.equal(focusedPrompt({conceptId:'MC-0174'}),'Listen to this excerpt and name the ornament.');
});
test('published listening revisions match their reviewed content',()=>{
 const bank=new Map(read('audio-question-bank').questions.map(q=>[q.id,q])),audit=read('listening-focus-audit'),newer=new Map(read('upper-level-style-audit').changes.map(r=>[r.id,r])),latest=new Map(read('n4-upper-level-audit').changes.map(r=>[r.id,r]));assert(audit.changes.length>0);
 for(const change of audit.changes){if(!bank.has(change.id)||bank.get(change.id).review?.updatedAt||bank.get(change.id).editorialCheck?.scottishMarchContext)continue;assert(!audit.protectedIds.includes(change.id));for(const field of ['prompt','feedback','options'])assert.deepEqual(bank.get(change.id)[field],latest.get(change.id)?.fields.find(f=>f.field===field)?.after??newer.get(change.id)?.fields.find(f=>f.field===field)?.after??change.after[field],change.id+' '+field);}
});

test('style prompts ask only for the style, including previously saved wording',()=>{
 assert.equal(C.promptText('Listen to this excerpt and name the style or type of music.'),'Listen to this excerpt and name the style.');
 assert.equal(C.promptHtml('Identify the style or the type of music. Tick one box.'),'Identify the style. Tick <strong>one</strong> box.');
 assert.equal(focusedPrompt({conceptId:'MC-0001'}),'Listen to this excerpt and name the style.');
});
