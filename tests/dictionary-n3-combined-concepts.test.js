'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const D=require('../music-dictionary/music-concepts-data'),text=require('../music-dictionary/quiz-data/question-bank.json'),audio=require('../music-dictionary/quiz-data/audio-question-bank.json'),saved=require('./fixtures/n3-combined-concepts-preserved.json');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
test('N3 combines the names and retires only its standalone Octave; N4 keeps Octave',()=>{
 assert.equal(D.concepts.find(c=>c.id==='MC-0035').name,'Harmony / chord');assert.equal(D.concepts.find(c=>c.id==='MC-0041').name,'Unison / octave');
 assert(!D.concepts.some(c=>c.id==='MC-0036'));assert(!Object.values(D.tables).flat(2).includes('MC-0036'));
 assert.equal(D.concepts.find(c=>c.id==='MC-0086').name,'Octave');assert.equal(D.concepts.find(c=>c.id==='MC-0086').level,'National 4');
 for(const bank of [text,audio]){assert(!bank.questions.some(q=>q.conceptId==='MC-0036'));assert.equal(bank.retiredQuestions.filter(q=>q.conceptId==='MC-0036').length,3);}
});
// N4 Octave's question baseline includes the separately authorised upper-level editorial review.
test('renaming preserves definitions and the retained N3 content; N4 uses its reviewed question baseline',()=>{
 const fields=['prompt','answer','options','feedback'];for(const [id,expected]of Object.entries(saved)){const c=D.concepts.find(c=>c.id===id);assert.equal(hash({definition:c.definition,features:c.features}),expected.definitionSha256,id);const content=[...text.questions,...audio.questions].filter(q=>q.conceptId===id).map(q=>[q.id,Object.fromEntries(fields.filter(k=>q[k]!==undefined).map(k=>[k,q[k]]))]);assert.equal(hash(content),expected.questionContentSha256,id);}
});
test('audio catalogue uses filesystem-safe folders and active N3 Octave is absent',()=>{
 const catalogue=require('../audio-concept-library-data.json').concepts,n3=catalogue.filter(c=>c.level==='National 3');assert(!n3.some(c=>c.concept==='Octave'));
 const root=path.join(__dirname,'../audio/concept-library'),section='01. National 3/04. Texture, Structure and Form';
 for(const [label,folder]of [['Harmony / chord','Harmony - Chord'],['Unison / octave','Unison - Octave']]){const c=n3.find(c=>c.concept===label);assert.equal(c.path,section+'/'+folder);assert(fs.statSync(path.join(root,c.path)).isDirectory());}
 for(const old of ['Harmony','Unison','Octave'])assert(!fs.existsSync(path.join(root,section,old)));
 assert(fs.statSync(path.join(__dirname,'../audio/retired-concept-library/National 3/Octave')).isDirectory());
 const octave=catalogue.find(c=>c.level==='National 4'&&c.concept==='Octave');assert(octave);assert(fs.statSync(path.join(root,octave.path)).isDirectory());
});
test('N3 Chord belongs only to Melody/harmony, retaining the standalone concept and questions',()=>{
 const chord=D.concepts.find(c=>c.id==='MC-0010');assert.equal(chord.name,'Chord');assert.deepEqual(chord.categories,['Melody/harmony']);
 assert(D.tables['National 3'][1].includes(chord.id));assert(!D.tables['National 3'][3].includes(chord.id));
 assert.equal(text.questions.filter(q=>q.conceptId===chord.id).length,3);assert.equal(audio.questions.filter(q=>q.conceptId===chord.id).length,3);
 const entries=require('../audio-concept-library-data.json').concepts.filter(c=>c.level==='National 3'&&c.concept==='Chord');assert.equal(entries.length,1);assert.match(entries[0].path,/02\. Melody and Harmony\/Chord$/);
});
