'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../music-dictionary/quiz-core.js');
const multi = require('../music-dictionary/quiz-multi-concept.js');
const excerpts = require('../music-dictionary/quiz-multi-concept-data.js');
const dictionary = require('../music-dictionary/music-concepts-data.js');
const {overlaps} = require('../scripts/quiz-distractor-overlap.cjs');
const collections = require('../music-dictionary/quiz-collections.js');
const levels = ['N3', 'N4', 'N5', 'H', 'AH'];
const counts = [[10, 1], [1, 4], [17, 21], [23, 29], [6, 37]];
const byId = new Map(dictionary.concepts.map(concept => [concept.id, concept]));
const scopeFor = level => new Set(collections.groupsForLevel(level)
  .find(group => group.id === (level === 'N3' ? 'level-n3' : 'levels-n3-' + level.toLowerCase())).conceptIds);

test('both listening types have level-appropriate, playable excerpts across all qualifications', () => {
  for (const [index, level] of levels.entries()) {
    const scope = scopeFor(level);
    const questions = multi.questionsForCollection({level,formats:['audio-select-3','audio-select-4']}, scope);
    assert.deepEqual([3, 4].map(count => questions.filter(q => !q.selection && q.format === 'audio-select-' + count).length), counts[index]);
    for (const question of questions) {
      const answers = question.answer.correctOptionIds;
      assert.equal(question.levelCode, level);
      assert.deepEqual(core.validateQuestion(question), []);
      assert(core.questionInScope(question, scope));
      assert(fs.statSync(path.join(__dirname, '..', question.media.src)).size > 0);
      for (const option of question.options) {
        assert(dictionary.levels.indexOf(byId.get(option.conceptId).level) <= index);
        if (!answers.includes(option.id)) assert(answers.every(answer => !overlaps(answer, option.id)));
      }
      assert(core.isCorrect(question, [...answers].reverse()));
      assert(!core.isCorrect(question, answers.slice(1)));
      assert.equal(core.markQuestion(question, answers.slice(1)).earned, answers.length - 1);
    }
  }
});

test('a collection must contain every answer and enough plausible distractors', () => {
  const config = {level: 'N3', formats: ['audio-select-4']};
  const scope = scopeFor('N3');
  const [question] = multi.questionsForCollection(config, scope);
  const answers = question.answer.correctOptionIds;
  const distractors = question.options.filter(option => !answers.includes(option.id)).map(option => option.id);
  assert.equal(multi.questionsForCollection(config, new Set(answers)).length, 0);
  assert.equal(multi.questionsForCollection(config, new Set([...answers.slice(1), ...distractors])).length, 0);
  assert.equal(multi.questionsForCollection(config, new Set([...answers, ...distractors])).length, 1);
  assert.equal(multi.questionsForCollection({...config, audioQuestions: false}, scope).length, 0);
  assert.equal(multi.questionsForCollection({...config, formats: ['multi-select']}, scope).length, 0);
});

test('repeat plays can keep the clip and answers while changing distractors', () => {
  const scope = scopeFor('N3');
  for (const count of [3, 4]) {
    const [question] = multi.questionsForCollection({level: 'N3', formats: ['audio-select-' + count]}, scope);
    const first = multi.realise(question, () => 0.01);
    const second = multi.realise(question, () => 0.99);
    assert.deepEqual(first.media, second.media);
    assert.deepEqual(first.answer, second.answer);
    assert.notDeepEqual(first.options.map(option => option.id).sort(), second.options.map(option => option.id).sort());
    assert(core.questionInScope(first, scope));
    assert(core.questionInScope(second, scope));
  }
});

test('duplicate audio stays in the appropriate format and keeps known tags out of distractors', () => {
  const retagged = excerpts.filter(excerpt => ['b4c347c8eae02efe9b0a', 'd43cc801b9cffafd4507'].includes(excerpt.id));
  assert.deepEqual(retagged.map(excerpt => [excerpt.level, excerpt.tagCount]), [['H', 5], ['H', 5]]);
  const danzon = excerpts.filter(excerpt => excerpt.id === 'f86edf58c809d881ad51');
  assert.deepEqual(danzon.map(excerpt => [excerpt.level, excerpt.features?.length]), [['AH', 11]]);
  const haydn = excerpts.filter(excerpt => excerpt.id === 'ecb7deabc4304853b575');
  assert.deepEqual(haydn.map(excerpt => [excerpt.level, excerpt.tagCount]), [['H', 9], ['AH',10]]);
  for (const excerpt of haydn) {
    const siblingTags = haydn.flatMap(copy => copy.answerIds);
    assert(excerpt.candidateIds.every(([id]) => siblingTags.every(tag => !overlaps(tag,id))));
  }
  const duplicate = excerpts.filter(excerpt => excerpt.id === 'e7d56d5fc64999c78be2');
  assert.deepEqual(duplicate.map(excerpt => [excerpt.level, excerpt.answerIds.length]), [['AH', 4]]);
});

test('incidental musical features stay eligible as answers and never enter the distractor pool', () => {
  const incidental = new Set([
    'MC-0009', 'MC-0017', 'MC-0018', 'MC-0019', 'MC-0024', 'MC-0029', 'MC-0034', 'MC-0037',
    'MC-0053', 'MC-0060', 'MC-0081', 'MC-0082', 'MC-0087', 'MC-0090', 'MC-0094', 'MC-0098',
    'MC-0157', 'MC-0165', 'MC-0167', 'MC-0168', 'MC-0169', 'MC-0172', 'MC-0176', 'MC-0233',
    'MC-0251', 'MC-0254', 'MC-0255', 'MC-0278', 'MC-0279', 'MC-0281', 'MC-0288', 'MC-0289', 'MC-0296'
  ]);
  for (const excerpt of excerpts) {
    assert((!excerpt.candidateIds || excerpt.candidateIds.every(([id]) => !incidental.has(id))), excerpt.id);
  }
  for (const id of ['MC-0018', 'MC-0034', 'MC-0037', 'MC-0169', 'MC-0281']) {
    assert(excerpts.some(excerpt => excerpt.answerIds?.includes(id)), byId.get(id).name);
  }
});

test('the 48 long excerpts produce Musical Features questions with the correct level targets', () => {
  const config = {formats:['musical-features']};
  for (const [level, count, length] of [['N5', 5, 14], ['H', 6, 21], ['AH', 6, 13]]) {
    const scope = scopeFor(level);
    const questions = multi.questionsForCollection({...config,level}, scope);
    assert.equal(questions.length, length);
    for (const question of questions) {
      assert.equal(question.answer.count, count);
      const distinctFeatures = new Map(question.answer.features.map(feature =>
        [core.musicalFeatureIdentity(feature.id), feature.name]));
      const answers = [...distinctFeatures.values()].slice(0, count);
      assert.deepEqual(core.markQuestion(question, answers.join('\n')), {earned:count, available:count});
      assert.deepEqual(core.markQuestion(question, answers.slice(1).join('\n')), {earned:count-1, available:count});
      const excerpt=excerpts.find(entry => entry.features && question.media.src === './'+entry.relativeFile && entry.level===level);
      assert(excerpt.features.length>10);
      const categories=['Melody/harmony','Rhythm/tempo','Timbre','Texture/structure/form','Styles'];
      const ranked=categories.map(category => {
        const tagged=excerpt.features.filter(feature => byId.get(feature.id).categories.includes(category));
        return {category,count:new Set(tagged.map(feature => core.musicalFeatureIdentity(feature.id))).size};
      }).filter(area => area.count > 0).sort((a,b) => b.count-a.count).slice(0,3);
      assert.deepEqual(question.areas,ranked.map(({category}) =>
        category === 'Timbre' && level === 'N5' ? 'Instruments/voices' : category === 'Styles' ? 'Style' : category));
      assert.deepEqual(question.answer.features,excerpt.features.filter(feature =>
        ranked.some(({category}) => byId.get(feature.id).categories.includes(category))));
      assert(new Set(question.answer.features.map(feature => core.musicalFeatureIdentity(feature.id))).size>=count);
      assert.equal(question.feedback,undefined);
      assert.equal(question.media.recording,undefined);
      assert.match(core.promptHtml(question.prompt), new RegExp('<strong>a minimum of '+count+' musical features</strong>'));
      assert.equal(question.levelCode, level);
      assert(core.questionInScope(question, scope));
      assert(core.eligibleForQuiz(question, {...config,level}));
      assert.deepEqual(core.validateQuestion(question), []);
      assert(fs.statSync(path.join(__dirname, '..', question.media.src)).size > 0);
      for (const feature of question.answer.features) {
        assert(feature.variants.includes(feature.name));
        assert(feature.variants.some(variant => variant.toLowerCase() !== feature.name.toLowerCase()));
      }
      assert.equal(multi.questionsForCollection({...config,level}, new Set([question.conceptId])).length, 0);
    }
    assert.equal(multi.questionsForCollection({...config,level,audioQuestions:false}, scope).length, 0);
  }
});

test('default level quizzes include Musical Features drawn from earlier concepts', () => {
  for (const [level, count] of [['N5', 14], ['H', 21], ['AH', 13]]) {
    const group = collections.groupsForLevel(level).find(group => group.id === 'level-' + level.toLowerCase());
    const scope = new Set(group.conceptIds);
    const config = {level, formats:['musical-features']};
    assert.equal(multi.questionsForCollection(config, scope).length, 0);
    const questions = multi.questionsForCollection({...config, defaultLevelQuiz:true}, scope);
    assert.equal(questions.length, count);
    for (const question of questions) {
      assert.equal(question.levelCode, level);
      assert.deepEqual(core.validateQuestion(question), []);
      assert(core.questionInScope(question, scopeFor(level)));
    }
    assert.equal(multi.questionsForCollection({...config, defaultLevelQuiz:true, audioQuestions:false}, scope).length, 0);
  }
});

test('Musical Features credits approved spellings, punctuation and distinct concepts', () => {
  const question = {
    format:'musical-features',
    answer:{count:5,features:[
      {id:'MC-0057',name:'Piano',variants:['Piano','Paino']},
      {id:'MC-0046',name:'Bowing',variants:['Bowing','Bowed']},
      {id:'MC-0193',name:'Arco',variants:['Arco','Bowed']},
      {id:'MC-0020',name:'2, 3 or 4 beats in the bar',variants:['2, 3 or 4 beats in the bar','2, 3 or 4 beats per bar']},
      {id:'MC-0273',name:'Pavan',variants:['Pavan','Pavane']},
      {id:'MC-0289',name:'Countersubject',variants:['Countersubject','Counter-subject']}
    ]}
  };
  const full = 'pAinO; bowed\n2, 3 or 4 beats per bar\nPavane.\nCounter subject';
  assert(core.isCorrect(question, full));
  assert.deepEqual(core.markQuestion(question,'Paino\nPiano\nArco\nBowing\nunrelated'), {earned:2,available:5});
  assert.deepEqual(core.markQuestion(question,full+'\nextra entry'), {earned:5,available:5});
  assert.deepEqual(core.markMusicalFeatures(question,'Piano\nPaino\nArco\nBowing').matchedFeatureIds, ['MC-0057','MC-0193']);
  assert.deepEqual(core.markQuestion(question,'Pavon'), {earned:0,available:5});
});

test('the five-to-ten-tag excerpts can reroll both counts, answers and distractors', () => {
  for (const [index,level] of levels.entries()) {
    const scope = scopeFor(level);
    const questions = multi.questionsForCollection({level,formats:['audio-select-3','audio-select-4']}, scope).filter(q => q.selection);
    assert.equal(questions.length, [0, 1, 30, 61, 55][index]);
    for (const question of questions) {
      const three = multi.realise(question, () => 0.01);
      const four = multi.realise(question, () => 0.99);
      assert.deepEqual([three.answer.correctOptionIds.length, four.answer.correctOptionIds.length], [3,4]);
      assert.deepEqual([three.options.length, four.options.length], [8,10]);
      assert.equal(three.id, four.id);
      assert.deepEqual(three.media, four.media);
      for (const roll of [three,four]) {
        const answers = roll.answer.correctOptionIds;
        assert.equal(new Set(answers.map(core.musicalFeatureIdentity)).size, answers.length);
        assert(answers.every(id => question.selection.taggedIds.includes(id)));
        assert(roll.options.filter(option => !answers.includes(option.id)).every(option =>
          question.selection.taggedIds.every(tag => !overlaps(tag,option.id))));
        assert(core.questionInScope(roll, scope));
      }
    }
  }

  const level = 'N5', scope = scopeFor(level), config = {level,formats:['audio-select-3']};
  const question = multi.questionsForCollection(config, scope).find(q => q.selection);
  const first = multi.realise(question, () => 0.01);
  let draw = 0;
  const next = multi.realise(question, () => draw++ === 0 ? 0.01 : (0.99 - draw * 0.01 % 0.98));
  const wrong = roll => roll.options.filter(option => !roll.answer.correctOptionIds.includes(option.id)).map(option => option.id).sort();
  assert.notDeepEqual([...first.answer.correctOptionIds].sort(), [...next.answer.correctOptionIds].sort());
  assert.notDeepEqual(wrong(first),wrong(next));

  const limitedScope = new Set(first.options.map(option => option.id));
  const scoped = multi.questionsForCollection({...config,formats:['audio-select-3','audio-select-4']}, limitedScope)
    .find(q => q.id===question.id);
  assert.deepEqual(scoped.selection.counts,[3]);
  assert(core.questionInScope(scoped,limitedScope));
});

test('Carmen accepts major and minor and identifies only the features the pupil gave', () => {
  const excerpt=excerpts.find(entry => entry.level==='N5' && entry.features && entry.recording.startsWith('Carmen'));
  const question=multi.questionsForCollection({level:'N5',formats:['musical-features']},scopeFor('N5'))
    .find(candidate => candidate.media.src === './'+excerpt.relativeFile);
  assert.deepEqual(question.areas,['Melody/harmony','Instruments/voices','Rhythm/tempo']);
  const response='Major\nminor\nCYMBALS\nAllegro\nunknown\nstrings\nmajor key';
  const result=core.markMusicalFeatures(question,response);
  assert.deepEqual(result,{earned:4,available:5,matchedFeatureIds:['MC-0084','MC-0085','MC-0121','MC-0023']});
});

test('all 181 two-tag entries offer two correct features and four collection-scoped distractors', () => {
  const bothTagsByClip = new Map();
  for (const excerpt of excerpts.filter(entry => entry.answerIds?.length === 2)) {
    const known = bothTagsByClip.get(excerpt.relativeFile) || [];
    bothTagsByClip.set(excerpt.relativeFile, [...known,...excerpt.answerIds]);
  }
  for (const [index,level] of levels.entries()) {
    const config={level,formats:['audio-select-2']};
    const scope=scopeFor(level);
    const questions=multi.questionsForCollection(config,scope);
    assert.equal(questions.length,[54,50,61,14,2][index]);
    assert.equal(new Set(questions.map(question=>question.id)).size,questions.length);
    for (const question of questions) {
      const correct=question.answer.correctOptionIds;
      const distractors=question.options.filter(option=>!correct.includes(option.id));
      assert.deepEqual(core.validateQuestion(question),[]);
      assert.match(question.prompt,/^Tick two features/);
      assert.equal(correct.length,2);
      assert.equal(distractors.length,4);
      assert(core.questionInScope(question,scope));
      assert(fs.statSync(path.join(__dirname,'..',question.media.src)).size>0);
      const otherTags=bothTagsByClip.get(question.media.src.slice(2));
      assert(distractors.every(option=>otherTags.every(id=>!overlaps(id,option.id))));
      assert(core.isCorrect(question,[...correct].reverse()));
      assert.deepEqual(core.markQuestion(question,[correct[0],distractors[0].id]), {earned:1,available:2});
    }
  }

  const config={level:'N3',formats:['audio-select-2']};
  const [question]=multi.questionsForCollection(config,scopeFor('N3'));
  const rerolled=multi.realise(question,()=>0.99);
  assert.deepEqual(rerolled.answer,question.answer);
  const initial=multi.realise(question,()=>0.01);
  assert.notDeepEqual(initial.options.map(option=>option.id).sort(),rerolled.options.map(option=>option.id).sort());
});
