/* Build collection-scoped listening questions and choose new distractors each cycle. */
(function(root, factory) {
  const api = typeof module === 'object' && module.exports
    ? factory(require('./music-concepts-data.js'), require('./quiz-core.js'), require('./quiz-multi-concept-data.js'))
    : factory(root.MUSIC_CONCEPTS, root.MusicDictionaryQuizCore, root.MusicDictionaryMultiConceptExcerpts);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MusicDictionaryMultiConceptQuiz = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(dictionary, core, excerpts) {
  'use strict';
  const byId = new Map(dictionary.concepts.map(concept => [concept.id, concept]));
  const levels = ['N3', 'N4', 'N5', 'H', 'AH'];
  const rank = concept => dictionary.levels.indexOf(concept?.level);
  const option = id => ({id, conceptId: id, text: byId.get(id).name});
  const wording = text => text.trim().toLocaleLowerCase('en-GB');

  function selectionPrompt(count) {
    if (count === 2) return 'Tick two features you hear in this excerpt.';
    return 'Tick ' + (count === 3 ? 'three' : 'four') + ' concepts you hear in this excerpt.';
  }

  function realise(question, random = Math.random) {
    const {selection, distractorCandidates} = question;
    const count = selection ? selection.counts[Math.floor(random() * selection.counts.length)] : core.multiConceptCounts[question.format];
    const correctIndices = selection
      ? selection.indices.map(index => ({index, tie: random()})).sort((a, b) => a.tie - b.tie).slice(0, count).map(entry => entry.index)
      : question.answer.correctOptionIds.map((_, index) => index);
    const correctOptionIds = selection
      ? correctIndices.map(index => selection.taggedIds[index])
      : question.answer.correctOptionIds;
    const selected = correctOptionIds.map(option);
    const candidates = distractorCandidates.map(([id, ...scores]) => ({id, scores:correctIndices.map(index => scores[index])}));
    const used = new Set();
    const answerOrder = selected.map((_, index) => ({index, tie: random()})).sort((a, b) => a.tie - b.tie);
    const total = 2 * count + 2;
    for (let index = 0; selected.length < total; index++) {
      const answer = answerOrder[index % count].index;
      const remaining = candidates.filter(candidate => !used.has(candidate.id));
      const related = remaining.filter(candidate => candidate.scores[answer] > 0);
      const ranked = (related.length ? related : remaining)
        .map(candidate => ({...candidate, score: related.length ? candidate.scores[answer] : Math.max(...candidate.scores), tie: random()}))
        .sort((a, b) => b.score - a.score || a.tie - b.tie);
      const stronger = ranked.filter(candidate => candidate.score >= ranked[0].score - 1);
      const picked = stronger[Math.floor(random() * stronger.length)];
      used.add(picked.id);
      selected.push(option(picked.id));
    }
    return {
      ...question,
      format:'audio-select-' + count,
      prompt:selectionPrompt(count),
      answer:{correctOptionIds},
      options:selected
    };
  }

  function musicalFeaturesQuestion(excerpt) {
    const categories = ['Melody/harmony', 'Rhythm/tempo', 'Timbre', 'Texture/structure/form', 'Styles'];
    const featuresByCategory = categories.map(category => {
      const features = excerpt.features.filter(feature => byId.get(feature.id).categories.includes(category));
      return {category, features, count:new Set(features.map(feature => core.musicalFeatureIdentity(feature.id))).size};
    });
    const strongest = featuresByCategory.filter(area => area.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
    const names = new Set(strongest.flatMap(area => area.features.map(feature => feature.id)));
    const features = excerpt.features.filter(feature => names.has(feature.id));
    const areas = strongest.map(({category}) => {
      if (category === 'Timbre' && excerpt.level === 'N5') return 'Instruments/voices';
      return category === 'Styles' ? 'Style' : category;
    });
    const count = core.musicalFeaturesCounts[excerpt.level];
    const prompt = 'List a minimum of ' + count + ' musical features you hear in this excerpt.';
    return {...listeningQuestion(excerpt, 'musical-features', features[0].id, prompt, {count, features}), areas};
  }

  function listeningQuestion(excerpt, format, conceptId, prompt, answer) {
    const isFeatures = format === 'musical-features';
    const suffix = isFeatures ? '-features' : format === 'audio-select-2' ? '-pair-' + [...excerpt.answerIds].sort().join('-') : '';
    return {
      id: 'audio-multi-' + excerpt.level + '-' + excerpt.id + suffix,
      conceptId,
      levelCode: excerpt.level,
      factGroupId: 'audio-multi-' + excerpt.id,
      objectiveId: 'identify-listening-concepts',
      objective: 'Identify musical concepts by listening.',
      format,
      modality: 'audio',
      prompt,
      ...(isFeatures ? {} : {feedback:excerpt.recording}),
      evidence: [{source: 'Audio Concept Library'}],
      media: {kind: 'audio', src: './' + excerpt.relativeFile, ...(isFeatures ? {} : {recording:excerpt.recording})},
      answer
    };
  }

  function questionsForCollection(config, scope, random = Math.random) {
    if (config.audioQuestions === false) return [];
    const selectedLevel = config.assessmentLevel || config.level;
    return excerpts.flatMap(excerpt => {
      if (selectedLevel !== 'ALL' && excerpt.level !== selectedLevel) return [];
      const levelRank = levels.indexOf(excerpt.level);
      const formatEnabled = format => !config.formats || config.formats.includes(format);
      if (excerpt.features) {
        const features = excerpt.features;
        const required = core.musicalFeaturesCounts[excerpt.level];
        // Whole-level assessments can draw on concepts taught at earlier levels.
        if (!formatEnabled('musical-features') || !required || !features.every(feature =>
          (config.defaultLevelQuiz === true || scope.has(feature.id)) &&
          byId.has(feature.id) && rank(byId.get(feature.id)) <= levelRank)) return [];
        return [musicalFeaturesQuestion(excerpt)];
      }
      const eligible = id => scope.has(id) && byId.has(id) && rank(byId.get(id)) <= levelRank;
      const answerIdentities = new Set();
      const indices = excerpt.answerIds.flatMap((id, index) => {
        if (!eligible(id)) return [];
        if (!excerpt.tagCount) return [index];
        const identity = core.musicalFeatureIdentity(id);
        if (answerIdentities.has(identity)) return [];
        answerIdentities.add(identity);
        return [index];
      });
      if (!excerpt.tagCount && indices.length !== excerpt.answerIds.length) return [];
      const used = new Set(excerpt.answerIds.map(id => wording(byId.get(id).name)));
      const candidates = excerpt.candidateIds.filter(([id]) => {
        if (!eligible(id) || used.has(wording(byId.get(id).name))) return false;
        used.add(wording(byId.get(id).name));
        return true;
      });
      const counts = (excerpt.tagCount ? [3, 4] : [excerpt.answerIds.length]).filter(count =>
        core.multiConceptCounts['audio-select-' + count] && formatEnabled('audio-select-' + count) &&
        indices.length >= count && candidates.length >= count + 2);
      if (!counts.length) return [];
      const selection = excerpt.tagCount ? {counts, indices, taggedIds:excerpt.answerIds} : null;
      const question = listeningQuestion(excerpt, 'audio-select-' + counts[0], excerpt.answerIds[indices[0]], selectionPrompt(counts[0]), {correctOptionIds:excerpt.answerIds});
      return [realise({...question, ...(selection ? {selection} : {}), distractorCandidates:candidates}, random)];
    });
  }

  return {questionsForCollection, realise};
});
