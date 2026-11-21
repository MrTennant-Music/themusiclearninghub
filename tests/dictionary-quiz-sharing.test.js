'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const collections=require('../music-dictionary/quiz-collections.js'),D=require('../music-dictionary/music-concepts-data.js');
const practice=require('../music-dictionary/quiz-practice-core.js');
const context={window:{},MusicDictionaryQuizCore:require('../music-dictionary/quiz-core.js'),MUSIC_CONCEPTS:D,MusicDictionaryQuizCollections:collections,React:{createElement(){}},URL,URLSearchParams};
vm.runInNewContext(fs.readFileSync('music-dictionary/music-concepts-quizzes.js','utf8'),context);
const api=context.window.MusicDictionaryQuizzes;
const read=url=>api.readShared(new URL(url,'https://hub.example/').searchParams);
test('a shared All Concepts quiz preserves its questions without medal eligibility',()=>{
 const group=collections.groupsForLevel('ALL').find(g=>g.id==='all-concepts');
 const options={level:'ALL',name:group.label,concepts:group.conceptIds,settings:{collectionId:group.id,defaultLevelQuiz:true,audioQuestions:false,nonAudioQuestions:true}};
 const url=api.shareUrl(options),config=read(url);
 assert(url.length<200);assert.equal(config.collectionId,group.id);assert.equal(config.audioQuestions,false);assert.equal(config.nonAudioQuestions,true);
 assert.deepEqual([...config.concepts],group.conceptIds);
 assert.equal(practice.collectionIdentity(config,collections.groupsForLevel('ALL')).medalEligible,false);
});
test('custom collections round-trip without relying on a saved collection in the recipient browser',()=>{
 const concepts=['MC-0001','MC-0002','MC-0003','MC-0021','MC-0067'];
 const url=api.shareUrl({level:'N3',name:'My strings & rhythm',concepts,settings:{collectionId:'saved-12',nonAudioQuestions:false}}),config=read(url);
 assert(url.length<300);assert.equal(config.name,'My strings & rhythm');assert.deepEqual([...config.concepts],concepts);assert.equal(config.collectionId,undefined);assert.equal(config.nonAudioQuestions,false);assert.equal(config.audioQuestions,true);
});
test('shared links never promote a changed built-in selection into a medal-eligible collection',()=>{
 const group=collections.groupsForLevel('N5').find(g=>g.id==='orchestra-brass');
 const url=api.shareUrl({level:'N5',name:group.label,concepts:group.conceptIds.slice(1),settings:{collectionId:group.id}});
 assert.equal(read(url).collectionId,undefined);
});
test('malformed or out-of-level shared selections are rejected safely',()=>{
 for(const query of ['level=N3&sharedQuiz=1&ids=0','level=N3&sharedQuiz=1&ids=5-2','level=N3&sharedQuiz=1&ids=1-99999','level=N3&sharedQuiz=1&ids=bad','level=N3&sharedQuiz=1&ids=262','level=invalid&sharedQuiz=1&ids=1'])assert.equal(read('./conceptquiz.html?'+query),null,query);
});

test('retired Complete the Statement filters recover to the available types without stranding saved links',()=>{
 const config=read('./conceptquiz.html?level=N5&sharedQuiz=1&group=orchestra-strings&formats=complete-statement');
 assert.equal(config.level,'N5');assert.equal(config.name,'Strings');
 assert.deepEqual(Array.from(config.formats),['multiple-choice','audio-select-2','audio-select-3','audio-select-4','short-answer','musical-features','multi-select','order']);
 const mixed=api.normaliseSettings({formats:['order','complete-statement']});assert.deepEqual(Array.from(mixed.formats),['order']);
});
