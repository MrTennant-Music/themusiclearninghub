(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IGCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FORMAT = 'music-literacy-interactive-games';
  const LIMITS = Object.freeze({ items: 200, orderItems: 8, wordsearchItems: 15, crosswordItems: 15, matchItems: 24, sortGroups: 6, sortGroupItems: 40, sortItems: 60, activities: 100, text: 10000, mediaBytes: 20 * 1024 * 1024, importBytes: 64 * 1024 * 1024 });
  const definitions = [
    ['matching-pairs', 'Connections', 'Matching', 'Find four hidden groups of four related cards.', '▣', true],
    ['group-sort', 'Sort', 'Sorting', 'Place each item in its correct group.', '▦', true],
    ['rank-order', 'Order', 'Sorting', 'Arrange the items in the correct order.', '≡', true],
    ['wordsearch', 'Word Search', 'Words', 'Find hidden words in a letter grid.', '▦', true],
    ['crossword', 'Crossword', 'Words', 'Use the clues to complete the crossing words.', '▤', true],
    ['labelled-diagram', 'Label', 'Visual', 'Place labels at the correct points on an image.', '⊙', true],
  ];
  const TEMPLATES = Object.freeze(definitions.map(([id, name, category, description, icon, scored]) => Object.freeze({ id, name, category, description, icon, scored })));
  const isHubLibraryTemplate = id => TEMPLATES.some(template => template.id === id);
  const DEFAULT_THEME_BY_TEMPLATE = Object.freeze({
    quiz: 'blue', 'true-or-false': 'blue', 'match-up': 'blue', 'matching-pairs': 'blue',
    'group-sort': 'blue', 'rank-order': 'blue', 'complete-the-sentence': 'blue',
    'type-the-answer': 'blue', wordsearch: 'blue', crossword: 'blue', 'labelled-diagram': 'blue'
  });
  const DEFAULT_INSTRUCTIONS = Object.freeze({
    quiz: 'Choose the correct answer to each question.',
    'true-or-false': 'Select True or False for each statement.',
    'match-up': 'Drag each answer to its matching prompt, or select an answer then its prompt. Select Submit when ready.',
    'matching-pairs': 'Select four related cards to reveal a group. Find all four groups.',
    'group-sort': 'Drag each card into its group, or select a card then a group. Select Submit when ready.',
    'rank-order': 'Arrange the cards in the correct order, then select Submit.',
    'complete-the-sentence': 'Place the missing words into the blanks, then select Submit.',
    'type-the-answer': 'Type the answer to each prompt, then select Submit.',
    wordsearch: 'Swipe across a word, or select each letter in order. Words can run horizontally, vertically or diagonally.',
    crossword: 'Select a clue, then use the letter keys to enter its answer on the board.',
    'labelled-diagram': 'Drag each pin to its position, or select a pin then its destination. Select Submit when ready.'
  });
  function instructionsFor(activity, mode = activity?.template) {
    return (mode === activity?.template && text(activity?.instructions, 240)) || DEFAULT_INSTRUCTIONS[mode] || '';
  }
  function defaultTheme(template) { return DEFAULT_THEME_BY_TEMPLATE[template] || 'blue'; }
  const templateIds = new Set([...TEMPLATES.map(template => template.id),'type-the-answer','match-up','quiz','true-or-false','complete-the-sentence']); // Preserve old exports without offering retired game formats.
  const promptOnly = new Set(['speaking-cards', 'open-the-box', 'brainstorm', 'seating-plan', 'word-magnets', 'matching-pairs']);
  const choiceGames = new Set(['quiz', 'gameshow-quiz', 'complete-the-sentence']);
  const wordGames = new Set(['anagram', 'spell-the-word', 'wordsearch', 'crossword', 'hangman']);
  const editorModes = { wordsearch: ['with-clues', 'without-clues'] };

  function uid() {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'ig-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  function shuffle(values, random) {
    const copy = Array.from(values || []);
    const rng = random || Math.random;
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.max(0, Math.floor(rng() * (i + 1))));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function text(value, max) { return typeof value === 'string' ? value.trim().slice(0, max || LIMITS.text) : ''; }
  function activityTitle(value) {
    let title = text(value, 200).replace(/^(?:Advanced Higher|National [345]|Higher|N[345]|AH|H|S[1-6])\s*[—–:-]\s*/i, '');
    if (/^Instrument Connections$/i.test(title)) return 'Instruments';
    const format = '(?:True or False\\??|Word Search|Type the Answer|Connection|Crossword|Matching Pairs|Group Sort|Match|Quiz|Truth|Type|Word|Blank|Sort|Order|Label)';
    const onlyFormat = title.match(new RegExp('^' + format + '(?:\\s+(\\d+))?$', 'i'));
    if (onlyFormat) return 'Music Concepts' + (onlyFormat[1] ? ' ' + onlyFormat[1] : '');
    title = title.replace(new RegExp('\\s*[:—–]\\s*' + format + '(?:\\s+(\\d+))?$', 'i'), (_, number) => number ? ' ' + number : '');
    return title.trim().replace(/^Musical Concepts(?=\s|$)/i, 'Music Concepts');
  }
  function identity(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : uid(); }
  function number(value, fallback, min, max) { return Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback; }
  function canonical(value) { return text(value).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' '); }
  function uniqueAnswers(values) {
    const seen = new Set();
    return values.map(value => text(value)).filter(value => {
      const key = canonical(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function clozeFields(row) {
    if (row.clozeText === undefined && row.clozeGaps === undefined) return null;
    if (typeof row.clozeText !== 'string' || row.clozeText.length > LIMITS.text || !Array.isArray(row.clozeGaps) || row.clozeGaps.length > LIMITS.items) throw new Error('Cloze text and gaps must contain valid text and a list of up to 200 gaps.');
    const gaps = row.clozeGaps.map(gap => {
      if (!gap || typeof gap !== 'object' || !Number.isInteger(gap.start) || !Number.isInteger(gap.end) || gap.start < 0 || gap.end <= gap.start || gap.end > row.clozeText.length || typeof gap.text !== 'string' || !gap.text.trim() || gap.text !== row.clozeText.slice(gap.start, gap.end)) throw new Error('Each cloze gap must match its exact text and position in the passage.');
      if (gap.exchangeGroup !== undefined && (typeof gap.exchangeGroup !== 'string' || !/^[a-z0-9-]{1,40}$/i.test(gap.exchangeGroup))) throw new Error('Invalid interchangeable blank group.');
      return { start: gap.start, end: gap.end, text: gap.text, ...(gap.exchangeGroup ? {exchangeGroup:gap.exchangeGroup} : {}) };
    }).sort((a, b) => a.start - b.start);
    if (gaps.some((gap, index) => index > 0 && gap.start < gaps[index - 1].end)) throw new Error('Cloze gaps must not overlap.');
    let cursor = 0;
    let prompt = '';
    gaps.forEach(gap => { prompt += row.clozeText.slice(cursor, gap.start) + '___'; cursor = gap.end; });
    prompt += row.clozeText.slice(cursor);
    return { clozeText: row.clozeText, clozeGaps: gaps, prompt, answer: gaps.length ? gaps[0].text : '' };
  }
  function isBundledStyleAudio(source) {
    const prefix = './audio/concept-library/';
    if (!source.startsWith(prefix)) return false;
    try {
      const segments = source.slice(prefix.length).split('/').map(decodeURIComponent);
      return segments.length === 4 && segments.map(encodeURIComponent).join('/') === source.slice(prefix.length) &&
        ['01. National 3', '02. National 4', '03. National 5', '04. Higher', '05. Advanced Higher'].includes(segments[0]) &&
        segments[1] === '01. Styles' && segments[3].endsWith('.m4a') &&
        segments.slice(2).every(segment => segment && segment !== '.' && segment !== '..' && !/[\/\\\x00-\x1f\x7f]/.test(segment));
    } catch { return false; }
  }
  function safeMedia(value) {
    if (value == null) return null;
    if (typeof value !== 'object' || !['image', 'audio', 'video'].includes(value.type) || typeof value.src !== 'string') throw new Error('Media must be an image, audio or video with a valid source.');
    const source = value.src;
    if (!source || /[\u0000-\u0020\u007f]/.test(source)) throw new Error('The media source is not valid.');
    if (source.startsWith('data:')) {
      const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([a-zA-Z0-9+/]*={0,2})$/.exec(source);
      const types = { image: /^image\/(png|jpeg|gif|webp|avif|bmp)$/, audio: /^audio\/(mpeg|mp3|wav|wave|x-wav|ogg|mp4|webm|aac|flac|x-m4a)$/, video: /^video\/(mp4|webm|ogg|quicktime)$/ };
      if (!match || !types[value.type].test(match[1]) || !match[2].length || match[2].length % 4 !== 0) throw new Error('This embedded media type is not supported. Use an image, audio or video file.');
      const padding = match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0;
      if (match[2].length * 0.75 - padding > LIMITS.mediaBytes) throw new Error('Each media file must be 20 MB or smaller.');
    } else if(value.type==='image'&&/^\.\/(?:music-games\/assets|ui-icons|music-dictionary\/(?:concept-photos|quiz-icons))\/[a-zA-Z0-9_./-]+\.(?:svg|png|jpe?g|webp)$/.test(source)&&!source.split('/').includes('..')) {
      // Only bundled, explicitly named image locations may use relative URLs.
    } else if (!(value.type === 'audio' && isBundledStyleAudio(source))) {
      if (source.length > 8192) throw new Error('The media link is too long.');
      let url;
      try { url = new URL(source); } catch (_) { throw new Error('Use a full http or https media link.'); }
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Only http or https media links are supported.');
    }
    const media = { type: value.type, src: source, name: text(value.name, 200) };
    if (value.sourceUrl) {
      try {
        const sourceUrl = new URL(value.sourceUrl);
        if (['http:', 'https:'].includes(sourceUrl.protocol) && !sourceUrl.username && !sourceUrl.password) {
          media.sourceUrl = sourceUrl.href;
          media.credit = text(value.credit, 2000);
          media.license = text(value.license, 200);
        }
      } catch (_) {}
    }
    return media;
  }
  function normalize(activity) {
    const value = activity && typeof activity === 'object' ? activity : {};
    const options = value.options && typeof value.options === 'object' ? value.options : {};
    const items = Array.isArray(value.items) ? value.items : [];
    const isLiteracyPuzzle = ['crossword', 'wordsearch'].includes(value.template) &&
      Array.isArray(value.tags) && value.tags.includes(value.template + '-category:5');
    const normalizedActivity = {
      id: identity(value.id), level: ['', 'S1','S2','S3','S4','S5','S6','N3','N4','N5','H','AH','ALL'].includes(value.level) ? value.level : 'N3', title: value.collectionId || isLiteracyPuzzle ? text(value.title,200) : activityTitle(value.title), instructions: text(value.instructions, 240), description: text(value.description, 2000), folder: text(value.folder, 100),
      tags: Array.from(new Set((Array.isArray(value.tags) ? value.tags : []).map(tag => text(tag, 40)).filter(Boolean))).slice(0, 20),
      template: templateIds.has(value.template) ? value.template : 'quiz',
      items: items.slice(0, value.template==='group-sort'&&value.sortRecipe?.type==='facts'&&value.tags?.includes('musical-facts')?items.length:LIMITS.items).map(item => {
        const row = item && typeof item === 'object' ? item : {};
        const correctAnswers = uniqueAnswers(Array.isArray(row.correctAnswers) ? row.correctAnswers : [row.answer]).slice(0, 8);
        const correctKeys = new Set(correctAnswers.map(canonical));
        const normalized = { id: identity(row.id), prompt: text(row.prompt), answer: correctAnswers[0] || text(row.answer), distractors: uniqueAnswers(Array.isArray(row.distractors) ? row.distractors : []).filter(answer => !correctKeys.has(canonical(answer))).slice(0, 10), group: text(row.group, 100), media: safeMedia(row.media), answerMedia: safeMedia(row.answerMedia), x: number(row.x, 50, 0, 100), y: number(row.y, 50, 0, 100) };
        if (Array.isArray(row.acceptedGroups)) normalized.acceptedGroups=uniqueAnswers(row.acceptedGroups).slice(0,6);
        if (Array.isArray(row.correctAnswers)) normalized.correctAnswers = correctAnswers;
        if (Array.isArray(row.acceptedTargetIds)) normalized.acceptedTargetIds = [...new Set(row.acceptedTargetIds.filter(id=>typeof id==='string').map(id=>text(id,100)).filter(Boolean))].slice(0,LIMITS.items);
        if (typeof row.requireAll === 'boolean') normalized.requireAll = row.requireAll;
        if (Array.isArray(row.answerOptions)) {
          normalized.answerOptions = row.answerOptions.slice(0, 8).map(value => text(value));
          if (Array.isArray(row.answerOptionMedia)) normalized.answerOptionMedia = normalized.answerOptions.map((_, index) => safeMedia(row.answerOptionMedia[index]));
        }
        if(typeof row.sourceConceptId==='string')normalized.sourceConceptId=text(row.sourceConceptId,100);
        const cloze = clozeFields(row);
        if (cloze) Object.assign(normalized, cloze);
        return normalized;
      }),
      diagram: safeMedia(value.diagram),
      options: { shuffle: options.shuffle !== false, timer: Math.round(number(options.timer, 0, 0, 3600)), difficulty: ['easy', 'normal', 'hard'].includes(options.difficulty) ? options.difficulty : 'normal', theme: ['blue', 'red', 'green', 'yellow', 'black', 'classic', 'high-readability', 'ocean', 'garden', 'night'].includes(options.theme) ? options.theme : defaultTheme(value.template), sound: options.sound === true },
      revision: Math.floor(number(value.revision, 1, 1, Number.MAX_SAFE_INTEGER)), updatedAt: typeof value.updatedAt === 'string' && !Number.isNaN(Date.parse(value.updatedAt)) ? new Date(value.updatedAt).toISOString() : new Date().toISOString()
    };
    if(value.catalogueHidden===true)normalizedActivity.catalogueHidden=true;
    if(Number.isInteger(value.collectionEdition)&&value.collectionEdition>0)normalizedActivity.collectionEdition=value.collectionEdition;
    if(value.sortRecipe&&typeof value.sortRecipe==='object') normalizedActivity.sortRecipe={version:text(value.sortRecipe.version,40),level:text(value.sortRecipe.level,3),type:text(value.sortRecipe.type,20),family:text(value.sortRecipe.family||'topics',20),includeBelow:Boolean(value.sortRecipe.includeBelow),groups:uniqueAnswers(value.sortRecipe.groups||[]).slice(0,6),cards:(value.sortRecipe.cards||[]).slice(0,40).map(c=>({key:text(c.key,150),group:text(c.group,100)}))};
    if(value.sortRecipe?.type==='facts')normalizedActivity.sortRecipe.factGroups=(value.sortRecipe.factGroups||[]).map(group=>({conceptId:text(group.conceptId,100),facts:(group.facts||[]).map(fact=>({id:text(fact.id,150),text:text(fact.text,1000),also:[...new Set(fact.also||[])].map(id=>text(id,100))}))}));
    if(typeof value.collectionId==='string')normalizedActivity.collectionId=text(value.collectionId,100);
    if(Array.isArray(value.sourceConceptIds))normalizedActivity.sourceConceptIds=[...new Set(value.sourceConceptIds.filter(id=>typeof id==='string'))];
    if (value.specialMode === 'level-test' && ['quiz','true-or-false','type-the-answer','complete-the-sentence'].includes(normalizedActivity.template)) { normalizedActivity.specialMode = 'level-test'; normalizedActivity.conceptCount = Math.round(number(value.conceptCount, normalizedActivity.items.length, normalizedActivity.items.length, 500)); }
    if (editorModes[normalizedActivity.template] && editorModes[normalizedActivity.template].includes(value.editorMode)) normalizedActivity.editorMode = value.editorMode;
    return normalizedActivity;
  }
  function makeActivity(overrides) { return normalize(Object.assign({ title: 'Untitled activity', level: '', template: 'quiz', items: [] }, overrides || {})); }
  const qualificationLevels = Object.freeze(['N3', 'N4', 'N5', 'H', 'AH']);
  function visibleAtLevel(activity, level) {
    return !qualificationLevels.includes(activity.level) || activity.level === level;
  }
  function convertTemplate(activity, templateId) {
    if (!templateIds.has(templateId)) throw new Error('Choose a supported game type.');
    return normalize({ ...activity, template: templateId, ...(activity.template !== templateId ? { instructions: '' } : {}) });
  }
  const SOUND_PREFERENCE_KEY = 'ig-game-sound';
  function readSoundPreference(fallback = true, storage) {
    try {
      const value = (storage || globalThis.localStorage)?.getItem(SOUND_PREFERENCE_KEY);
      if (value === 'true' || value === 'false') return value === 'true';
    } catch { /* Play remains available when browser storage is blocked. */ }
    return fallback;
  }
  function saveSoundPreference(sound, storage) {
    try { (storage || globalThis.localStorage)?.setItem(SOUND_PREFERENCE_KEY, String(Boolean(sound))); }
    catch { /* The setting still applies to the current game. */ }
  }
  function sessionOptions(activity, shared = false) {
    return { ...normalize(activity).options, shuffle: true, timer: 0, sound: shared ? activity.options?.sound !== false : readSoundPreference(true) };
  }
  function hasDraftContent(activity) {
    return !!activity && (Boolean(text(activity.title)) || (activity.items || []).some(item => text(item.prompt) || text(item.answer) || item.media || item.answerMedia || text(item.clozeText)));
  }
  // Only explicitly authored groups may exchange answers. Match each expected
  // tile once, so duplicate answers cannot earn the same mark twice.
  function gradeCloze(gaps, answers) {
    const marks=gaps.map(()=>false), used=new Set();
    gaps.forEach((gap,i)=>{if(canonical(answers[i]||'')===canonical(gap.text)){marks[i]=true;used.add(i);}});
    gaps.forEach((gap,i)=>{
      if(marks[i]||!gap.exchangeGroup)return;
      const match=gaps.findIndex((other,j)=>!used.has(j)&&other.exchangeGroup===gap.exchangeGroup&&canonical(answers[i]||'')===canonical(other.text));
      if(match>=0){marks[i]=true;used.add(match);}
    });
    return marks;
  }
  function reviewEntries(activity, mode, result) {
    const answers = result.answers || [], used = new Set();
    let inventoryIndex = 0;
    const entries = activity.items.flatMap((item, itemIndex) => {
      const gaps = mode === 'complete-the-sentence' ? item.clozeGaps?.length ? item.clozeGaps : [{ text: item.answer }] : [null];
      return gaps.map((gap, part) => {
        const recordIndex = answers.findIndex((answer, index) => !used.has(index) && (answer.itemId ? answer.itemId === item.id : answer.prompt === item.prompt || (mode === 'true-or-false' && answer.prompt?.startsWith(`${item.prompt}\n`)) || answer.prompt?.startsWith(`${item.clozeText || item.prompt} (blank `)) && (!gap || canonical(answer.expected) === canonical(gap.text)));
        if (recordIndex >= 0) used.add(recordIndex);
        const record = answers[recordIndex];
        const order = recordIndex >= 0 ? recordIndex : answers.length + inventoryIndex;
        inventoryIndex++;
        let reviewPrompt = record?.prompt || item.prompt;
        if (mode === 'complete-the-sentence' && gaps.length === 1 && gap.start === 0 && /^\s*:/.test((item.clozeText || '').slice(gap.end))) {
          reviewPrompt = item.clozeText.slice(gap.end).replace(/^\s*:\s*/, '');
        }
        return { order, itemId: item.id, itemIndex, part, prompt: reviewPrompt, expected: gap && record?.correct ? record.answer : record?.expected || gap?.text || (item.requireAll ? (item.correctAnswers || [item.answer]).join(', ') : item.answer), answer: record?.answer || '', correct: record ? Boolean(record.correct) : null, media: item.media || null };
      });
    });
    const sorted=entries.sort((a,b)=>a.order-b.order);
    if(mode==='complete-the-sentence'){
      const grouped=new Map();
      for(const {order,...part} of sorted){
        if(!grouped.has(part.itemIndex))grouped.set(part.itemIndex,{...part,prompt:activity.items[part.itemIndex].prompt.replace(/\s*\(blank \d+\)\s*$/i,''),parts:[]});
        grouped.get(part.itemIndex).parts.push(part);
      }
      return [...grouped.values()].map(entry=>({...entry,parts:entry.parts.sort((a,b)=>a.part-b.part),correct:entry.parts.every(part=>part.correct===null)?null:entry.parts.every(part=>part.correct===true)}));
    }
    return sorted.map(({order,...entry})=>entry);
  }
  function choices(item, items) {
    if (!item || !text(item.answer)) return [];
    const correct = uniqueAnswers(Array.isArray(item.correctAnswers) ? item.correctAnswers : [item.answer]);
    const seen = new Set(correct.map(canonical));
    const limit = correct.length > 1 || Array.isArray(item.answerOptions) ? 8 : 4;
    const alternatives = [];
    const candidates = (Array.isArray(item.answerOptions) ? item.answerOptions : []).concat(Array.isArray(item.distractors) ? item.distractors : []);
    if (!Array.isArray(item.answerOptions) && correct.length <= 1) candidates.push(...shuffle((items || []).map(row => row.answer)));
    for (const candidate of candidates) {
      if (alternatives.length >= Math.max(0, limit - correct.length)) break;
      const answer = text(candidate);
      const key = canonical(answer);
      if (key && !seen.has(key)) { seen.add(key); alternatives.push(answer); }
    }
    return shuffle(correct.concat(alternatives));
  }
  function isCorrectAnswer(item, value) {
    if (!item || !text(value)) return false;
    const answers = Array.isArray(item?.correctAnswers) && item.correctAnswers.length ? item.correctAnswers : [item?.answer];
    return answers.some(answer => canonical(answer) === canonical(value));
  }
  function gradeSort(items, placements) {
    const identity = (item, index) => canonical(item.prompt) ? `text:${canonical(item.prompt)}` : item.media ? `media:${item.media.type}:${item.media.src}` : `item:${item.id || index}`;
    const remaining = new Map();
    items.forEach((item, index) => {
      if(item.acceptedGroups?.length)return;
      const key = identity(item, index), group = item.group || item.answer;
      if (!remaining.has(key)) remaining.set(key, new Map());
      const groups = remaining.get(key);
      groups.set(group, (groups.get(group) || 0) + 1);
    });
    const marks = items.map((item, index) => {
      const answer = placements[index];
      if(item.acceptedGroups?.length)return {answer,correct:answer!==undefined&&item.acceptedGroups.some(g=>canonical(g)===canonical(answer)),expected:item.group||item.answer};
      const groups = remaining.get(identity(item, index));
      const correct = answer !== undefined && (groups.get(answer) || 0) > 0;
      if (correct) groups.set(answer, groups.get(answer) - 1);
      return { answer, correct, expected: correct ? answer : item.group || item.answer };
    });
    marks.forEach((mark, index) => {
      if (mark.correct||items[index].acceptedGroups?.length) return;
      const groups = remaining.get(identity(items[index], index));
      const available = [...groups].find(([, count]) => count > 0);
      if (available) { mark.expected = available[0]; groups.set(available[0], available[1] - 1); }
    });
    return marks;
  }
  function compatibility(templateId, activity) {
    if (!templateIds.has(templateId)) return { ok: false, reason: 'Choose a supported game type.' };
    if (templateId === 'maths-generator') return { ok: true, reason: '' };
    const items = activity && Array.isArray(activity.items) ? activity.items : [];
    const fail = reason => ({ ok: false, reason });
    if (!items.length) return fail('Add at least one question.');
    if (items.some(item => !item || typeof item !== 'object')) return fail('Each question must contain an answer and its settings.');
    if (items.some(item => !text(item.prompt) && !item.media)) return fail('Give each question an answer or media.');
    const mediaAnswer = item => ['group-sort', 'rank-order'].includes(templateId) ? item.media : ['match-up', 'matching-pairs'].includes(templateId) ? item.answerMedia : null;
    if (!promptOnly.has(templateId) && items.some(item => !text(item.answer) && !mediaAnswer(item))) return fail('Add an answer for every question.');
    if (['match-up', 'matching-pairs', 'pair-or-no-pair', 'true-or-false', 'rank-order', 'watch-and-memorize'].includes(templateId) && items.length < 2) return fail('Add at least two questions.');
    if (choiceGames.has(templateId) && items.some(item => !(templateId === 'complete-the-sentence' && Array.isArray(item.clozeGaps) && item.clozeGaps.length) && choices(item, items).length < 2)) return fail('Add a different answer or a distractor so players have a choice.');
    if (templateId === 'matching-pairs') {
      if (items.length !== 16) return fail('Connection needs exactly 16 cards in four groups of four.');
      const groups = new Map();
      for (const item of items) {
        const group = canonical(item.group);
        if (!group) return fail('Give every Connection card a group name.');
        groups.set(group, (groups.get(group) || 0) + 1);
      }
      if (groups.size !== 4 || [...groups.values()].some(count => count !== 4)) return fail('Connection needs exactly four groups with four cards in each.');
      const cards = items.map(item => canonical(item.prompt) || item.media?.src);
      if (new Set(cards).size !== 16) return fail('Give each Connection card different text or media.');
    }
    if (['group-sort'].includes(templateId)) {
      const factSort=activity.tags?.includes('musical-facts')&&activity.sortRecipe?.type==='facts';
      if(!factSort&&items.length>LIMITS.sortItems)return fail('Sort can contain up to ' + LIMITS.sortItems + ' cards.');
      if (items.some(item => !text(item.group))) return fail('Give every question a group.');
      if (new Set(items.map(item => canonical(item.group))).size < 2) return fail('Use at least two different groups.');
      const counts=new Map();
      for(const item of items){const group=canonical(item.group);counts.set(group,(counts.get(group)||0)+1);}
      if(counts.size>LIMITS.sortGroups)return fail('Sort can contain up to 6 groups.');
      if([...counts.values()].some(count=>!factSort&&count>LIMITS.sortGroupItems))return fail('Each Sort group can contain up to 40 cards.');
    }
    if (wordGames.has(templateId) && items.some(item => !/[a-zA-Z]/.test(item.answer) || !/^[a-zA-Z\s'-]+$/.test(item.answer))) return fail('This game needs answers containing letters, spaces, apostrophes or hyphens.');
    if (['wordsearch', 'crossword'].includes(templateId) && items.length > LIMITS[templateId + 'Items']) return fail('This game can contain up to 15 words.');
    if (['wordsearch', 'crossword'].includes(templateId) && items.some(item => item.answer.replace(/[^a-zA-Z]/g, '').length > 24)) return fail('Keep answer words to 24 letters or fewer for this game.');
    if (['wordsearch', 'crossword'].includes(templateId) && new Set(items.map(item => item.answer.replace(/[^a-zA-Z]/g, '').toLowerCase())).size !== items.length) return fail('Use a different answer word for each clue.');
    if (templateId === 'complete-the-sentence' && items.some(item => item.clozeText !== undefined ? !Array.isArray(item.clozeGaps) || !item.clozeGaps.length : !/_{2,}/.test(item.prompt))) return fail('Select at least one missing word or phrase, or use ___ in each answer.');
    if (templateId === 'rank-order' && items.length > LIMITS.orderItems) return fail('An Order game can contain up to 8 items.');
    if (templateId === 'labelled-diagram' && items.length > 12) return fail('A diagram can contain up to 12 labels.');
    if (templateId === 'labelled-diagram' && (!activity.diagram || activity.diagram.type !== 'image')) return fail('Add a background image for Labels.');
    return { ok: true, reason: '' };
  }
  function validateActivity(activity) {
    const errors = [];
    if (!activity || typeof activity !== 'object' || Array.isArray(activity)) return ['Provide an activity.'];
    if (!text(activity.title)) errors.push('Give your activity a title.');
    if (!Array.isArray(activity.items) || (!activity.items.length && activity.template !== 'maths-generator')) errors.push('Add at least one question.');
    if (Array.isArray(activity.items) && activity.items.length > LIMITS.items) errors.push('An activity can contain up to 200 questions.');
    if (activity.template === 'rank-order' && activity.items?.length > LIMITS.orderItems) errors.push('An Order game can contain up to 8 items.');
    if (activity.template === 'labelled-diagram' && activity.items?.length > 12) errors.push('A diagram can contain up to 12 labels.');
    if (!templateIds.has(activity.template)) errors.push('Choose a supported game type.');
    if (activity.editorMode !== undefined && (!editorModes[activity.template] || !editorModes[activity.template].includes(activity.editorMode))) errors.push('Choose a supported editor mode for this game type.');
    const itemIds = new Set();
    (Array.isArray(activity.items) ? activity.items : []).forEach((item, index) => {
      if (!item || typeof item !== 'object') { errors.push('Question ' + (index + 1) + ' is not valid.'); return; }
      if (item.id && itemIds.has(item.id)) errors.push('Each question must have a unique identity.');
      itemIds.add(item.id);
      try { clozeFields(item); } catch (error) { errors.push('Question ' + (index + 1) + ': ' + error.message); }
      for (const key of ['media', 'answerMedia']) { try { safeMedia(item[key]); } catch (error) { errors.push('Question ' + (index + 1) + ': ' + error.message); } }
      for (const key of ['correctAnswers', 'answerOptions', 'distractors']) {
        if (item[key] !== undefined && (!Array.isArray(item[key]) || item[key].some(value => typeof value !== 'string' || value.length > LIMITS.text) || item[key].length > (key === 'distractors' ? 10 : 8))) errors.push('Question ' + (index + 1) + ': ' + key + ' must contain valid answer text within the option limit.');
      }
      if (Array.isArray(item.correctAnswers) && (!item.correctAnswers.some(value => text(value)) || !canonical(item.answer) || canonical(item.answer) !== canonical(item.correctAnswers.find(value => text(value))))) errors.push('Question ' + (index + 1) + ': choose at least one correct answer and use its first answer as the primary answer.');
      if (item.requireAll !== undefined && typeof item.requireAll !== 'boolean') errors.push('Question ' + (index + 1) + ': requireAll must be true or false.');
      if (item.answerOptionMedia !== undefined) {
        if (!Array.isArray(item.answerOptionMedia) || !Array.isArray(item.answerOptions) || item.answerOptionMedia.length !== item.answerOptions.length) errors.push('Question ' + (index + 1) + ': answer media must match the answer options.');
        else item.answerOptionMedia.forEach(media => { try { safeMedia(media); } catch (error) { errors.push('Question ' + (index + 1) + ': ' + error.message); } });
      }
    });
    try { safeMedia(activity.diagram); } catch (error) { errors.push(error.message); }
    const availability = compatibility(activity.template, activity);
    if (!availability.ok && !errors.includes(availability.reason)) errors.push(availability.reason);
    return errors;
  }
  function optionsKey(activity) {
    const options = normalize(activity).options;
    return JSON.stringify({ shuffle: options.shuffle, timer: options.timer, difficulty: options.difficulty, theme: options.theme, sound: options.sound });
  }
  function sharedActivityId(activity) {
    const source = activity && typeof activity === 'object' ? activity : {};
    const content = normalize(Object.assign({}, source, {
      id: typeof source.id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(source.id) ? source.id : 'shared-source',
      items: (Array.isArray(source.items) ? source.items : []).map((item, index) => Object.assign({}, item, {
        id: item && typeof item.id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(item.id) ? item.id : 'shared-item-' + index
      }))
    }));
    delete content.updatedAt;
    const serialized = JSON.stringify(content);
    // Two independent 32-bit accumulators provide a compact local identity.
    // This is a content fingerprint, not a cryptographic integrity check.
    let first = 2166136261;
    let second = 2654435769;
    for (let index = 0; index < serialized.length; index++) {
      const code = serialized.charCodeAt(index);
      first = Math.imul(first ^ code, 16777619);
      second = Math.imul(second ^ code, 2246822507);
    }
    return 'shared-' + (first >>> 0).toString(16).padStart(8, '0') + (second >>> 0).toString(16).padStart(8, '0');
  }
  function exportActivity(activity) {
    const errors = validateActivity(activity);
    if (errors.length) throw new Error(errors.join(' '));
    return JSON.stringify({ format: FORMAT, version: 1, activities: [normalize(activity)] }, null, 2);
  }
  function rejectUnsafeKeys(value, depth) {
    if (depth > 12) throw new Error('The activity file is too deeply nested.');
    if (!value || typeof value !== 'object') return;
    for (const key of Object.keys(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('The activity file contains an unsupported property.');
      rejectUnsafeKeys(value[key], depth + 1);
    }
  }
  function normalizeImport(input) {
    let data = input;
    let serialized;
    try { serialized = typeof input === 'string' ? input : JSON.stringify(input); } catch (_) { throw new Error('Choose a valid Interactive Games JSON file.'); }
    if (typeof serialized !== 'string') throw new Error('Choose a valid Interactive Games JSON file.');
    if (serialized.length > LIMITS.importBytes || (typeof TextEncoder !== 'undefined' && new TextEncoder().encode(serialized).length > LIMITS.importBytes)) throw new Error('The activity file must be 64 MB or smaller.');
    if (typeof input === 'string') { try { data = JSON.parse(input); } catch (_) { throw new Error('The activity file is not valid JSON.'); } }
    rejectUnsafeKeys(data, 0);
    if (!data || data.format !== FORMAT || data.version !== 1 || !Array.isArray(data.activities) || !data.activities.length) throw new Error('Choose an Interactive Games export (version 1).');
    if (data.activities.length > LIMITS.activities) throw new Error('Import up to 100 activities at a time.');
    const ids = new Set();
    return data.activities.map(raw => {
      const errors = validateActivity(raw);
      if (errors.length) throw new Error(errors.join(' '));
      if (raw.items.some(item => [item.prompt, item.answer, ...(item.distractors || [])].some(value => typeof value !== 'string' || value.length > LIMITS.text))) throw new Error('Item text is invalid or too long.');
      const activity = normalize(raw);
      if (ids.has(activity.id)) throw new Error('The file contains duplicate activity identities.');
      ids.add(activity.id);
      return activity;
    });
  }

  let databasePromise;
  function database() {
    if (databasePromise) return databasePromise;
    if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Browser storage is unavailable. Enable site storage to save your activities.'));
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('mlh-interactive-games', 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('activities')) db.createObjectStore('activities', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('results')) {
          const results = db.createObjectStore('results', { keyPath: 'id' });
          results.createIndex('activityId', 'activityId');
        }
        if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('summaries')) {
          const summaries = db.createObjectStore('summaries', { keyPath: 'id' });
          // One-time index backfill; original activities, drafts and results stay intact.
          const cursorRequest = request.transaction.objectStore('activities').openCursor();
          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (cursor) { summaries.put(activitySummary(cursor.value)); cursor.continue(); }
          };
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); databasePromise = null; };
        resolve(db);
      };
      request.onerror = () => { databasePromise = null; reject(new Error('Could not open browser storage: ' + (request.error && request.error.message || 'unknown error'))); };
      request.onblocked = () => { databasePromise = null; reject(new Error('Close other Interactive Games tabs and try saving again.')); };
    });
    return databasePromise;
  }
  async function transaction(stores, mode, action) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      let value;
      tx.oncomplete = () => resolve(value);
      tx.onabort = () => reject(new Error('Browser storage could not complete this action. ' + (tx.error && tx.error.message || 'Your existing saved activities have been kept.')));
      tx.onerror = () => {};
      try { action(tx, result => { value = result; }); } catch (error) { tx.abort(); reject(error); }
    });
  }
  async function listActivities() {
    return transaction(['activities'], 'readonly', (tx, done) => {
      const request = tx.objectStore('activities').getAll();
      request.onsuccess = () => done(request.result.map(normalize).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    });
  }
  
  function activitySummary(activity) {
    const { id, title, description, level, template, folder, tags, revision, updatedAt, specialMode } = activity;
    return { id, title: activityTitle(title), description, level, template, folder, tags, revision, updatedAt, ...(specialMode?{specialMode}:{}), ...(activity.collectionEdition?{collectionEdition:activity.collectionEdition}:{}), itemCount: activity.items?.length || 0, _stored: true };
  }
  async function listActivitySummaries() {
    return transaction(['summaries'], 'readonly', (tx, done) => {
      const request = tx.objectStore('summaries').getAll();
      request.onsuccess = () => done(request.result.map(summary=>({...summary,title:activityTitle(summary.title)})).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    });
  }
  async function getActivity(id) {
    return transaction(['activities'], 'readonly', (tx, done) => {
      const request = tx.objectStore('activities').get(id);
      request.onsuccess = () => done(request.result ? normalize(request.result) : null);
    });
  }
  async function saveActivity(activity) {
    const errors = validateActivity(activity);
    if (errors.length) throw new Error(errors.join(' '));
    const saved = normalize(activity);
    saved.updatedAt = new Date().toISOString();
    return transaction(['activities', 'summaries'], 'readwrite', (tx, done) => {
      const store = tx.objectStore('activities');
      const request = store.get(saved.id);
      request.onsuccess = () => {
        saved.revision = request.result ? request.result.revision + 1 : saved.revision;
        store.put(saved);
        tx.objectStore('summaries').put(activitySummary(saved));
        done(saved);
      };
    });
  }
  async function importActivities(input) {
    const imported = normalizeImport(input).map(activity => Object.assign({}, activity, {
      id: uid(), revision: 1, updatedAt: new Date().toISOString()
    }));
    return transaction(['activities', 'summaries'], 'readwrite', (tx, done) => {
      const store = tx.objectStore('activities');
      imported.forEach(activity => { store.put(activity); tx.objectStore('summaries').put(activitySummary(activity)); });
      done(imported);
    });
  }
  function deleteResults(tx, activityId) {
    const request = tx.objectStore('results').index('activityId').openCursor(activityId);
    request.onsuccess = () => { const cursor = request.result; if (cursor) { cursor.delete(); cursor.continue(); } };
  }
  async function deleteActivity(activityId) { return transaction(['activities', 'summaries', 'results'], 'readwrite', tx => { tx.objectStore('activities').delete(activityId); tx.objectStore('summaries').delete(activityId); deleteResults(tx, activityId); }); }
  async function getResults(activityId) { return transaction(['results'], 'readonly', (tx, done) => { const request = tx.objectStore('results').index('activityId').getAll(activityId); request.onsuccess = () => done(request.result); }); }
  async function saveResult(result) {
    if (!result || typeof result.activityId !== 'string' || !templateIds.has(result.template) || !Number.isFinite(result.score) || !Number.isFinite(result.total) || result.total <= 0 || result.score < 0 || result.score > result.total) throw new Error('The result is not valid and could not be saved.');
    const record = { id: identity(result.id), activityId: result.activityId, revision: Math.floor(number(result.revision, 1, 1, Number.MAX_SAFE_INTEGER)), template: result.template, optionsKey: text(result.optionsKey, 2000), name: text(result.name, 80) || 'Player', score: result.score, total: result.total, seconds: number(result.seconds, 0, 0, 86400), date: new Date().toISOString(), answers: Array.isArray(result.answers) ? result.answers.slice(0, result.template==='group-sort'?result.answers.length:LIMITS.items) : [] };
    return transaction(['results'], 'readwrite', (tx, done) => { tx.objectStore('results').put(record); done(record); });
  }
  async function clearResults(activityId) { return transaction(['results'], 'readwrite', tx => deleteResults(tx, activityId)); }
  async function saveDraft(activity) {
    const draft = normalize(activity);
    return transaction(['drafts'], 'readwrite', (tx, done) => { tx.objectStore('drafts').put({ id: 'current', activity: draft }); done(draft); });
  }
  async function getDraft() { return transaction(['drafts'], 'readonly', (tx, done) => { const request = tx.objectStore('drafts').get('current'); request.onsuccess = () => done(request.result ? normalize(request.result.activity) : null); }); }
  // Reserve the next practice board atomically across browser tabs.
  async function updatePracticeState(key, update) {
    return transaction(['drafts'], 'readwrite', (tx, done) => {
      const store = tx.objectStore('drafts'), id = 'practice:' + key;
      const request = store.get(id);
      request.onsuccess = () => {
        try { const state = update(request.result ? request.result.state : null); store.put({ id, state }); done(state); }
        catch (error) { tx.abort(); }
      };
    });
  }
  async function clearDraft() { return transaction(['drafts'], 'readwrite', tx => tx.objectStore('drafts').delete('current')); }
  function resultMessage(result) {
    if (result.unscored || !Number.isFinite(result.total) || result.total <= 0) return 'Activity complete';
    const percentage = Math.max(0, Math.min(100, result.correct / result.total * 100));
    const message = options => options[Math.floor(Math.random() * options.length)];
    if (percentage === 100) return message(['Wow! Full marks!', 'Perfect score! What a performance!', 'Flawless playing! You got every answer!', 'Brilliant! Every answer was right!']);
    if (percentage >= 90) return message(['Outstanding! So close to full marks!', 'Fantastic work! You nearly got them all!', 'Superb result! Just one more to master!', 'Nearly perfect! You know this music so well!']);
    if (percentage >= 80) return message(['Excellent work! You know your stuff!', 'Brilliant effort! Your music knowledge is shining!', 'Great playing! You got nearly everything right!', 'Excellent score! Keep that rhythm going!']);
    if (percentage >= 70) return message(['Well done! A strong performance!', 'Great work! You are building a strong score!', 'That was a confident performance!', 'Well played! You got most of them right!']);
    if (percentage >= 60) return message(['Great attempt! Keep it up!', 'Good work! You are making real progress!', 'Nice effort! Keep practising those music skills!', 'You are on the right track. Keep going!']);
    if (percentage >= 50) return message(['Good effort! You’re getting there!', 'A solid start! A little more practice will help!', 'You have the beat. Keep building your knowledge!', 'Halfway there! Keep practising and try again!']);
    if (percentage >= 40) return message(['Keep going! A little practice will help!', 'You can build on this score with another try!', 'Keep at it! Every round helps you improve!', 'A good chance to practise and learn more!']);
    if (percentage >= 30) return message(['Keep practising! You can build on this!', 'You are learning as you go. Try another round!', 'Keep listening and learning. You can do this!', 'There is plenty of room to grow. Have another go!']);
    if (percentage >= 20) return message(['Unlucky! Try again?', 'A tricky one! Have another go?', 'Keep your chin up. Try the activity again!', 'Practice makes progress. Give it another try!']);
    if (percentage > 0) return message(['You’ve made a start! Give it another go!', 'Every answer is a step forward. Try again!', 'Good start! Keep practising and build your score!', 'You have begun. Have another go and learn more!']);
    return message(['A tricky round! Try again and see what you can learn!', 'No points this time, but every try helps you learn!', 'Fresh start! Have another go at the questions!', 'Keep going. You can learn these with practice!']);
  }

  function leaderboard(results) {
    return (Array.isArray(results) ? results : []).filter(row => Number.isFinite(row.score) && Number.isFinite(row.total) && row.total > 0 && row.score >= 0 && row.score <= row.total).slice().sort((a, b) => (b.score / b.total - a.score / a.total) || ((a.seconds || 0) - (b.seconds || 0)) || String(a.date || '').localeCompare(String(b.date || ''))).map((row, index) => Object.assign({}, row, { rank: index + 1, percentage: Math.round(row.score / row.total * 100) }));
  }

  // Browser catalogue entries contain metadata only; full built-ins load on demand.
  const SEEDS = typeof module === 'object' && module.exports
    ? require('./activities/index.json').map(entry => normalize({...require('./activities/' + entry.id + '.json'),...(entry.catalogueHidden?{catalogueHidden:true}:{})}))
    : (globalThis.IGActivityIndex || []);
  return Object.freeze({ FORMAT, LIMITS, TEMPLATES, isHubLibraryTemplate, DEFAULT_THEME_BY_TEMPLATE, DEFAULT_INSTRUCTIONS, instructionsFor, activityTitle, SEEDS, uid, shuffle, canonical, normalize, makeActivity, qualificationLevels, visibleAtLevel, convertTemplate, readSoundPreference, saveSoundPreference, sessionOptions, hasDraftContent, gradeCloze, reviewEntries, choices, isCorrectAnswer, gradeSort, compatibility, validateActivity, optionsKey, sharedActivityId, exportActivity, normalizeImport, importActivities, safeMedia, listActivities, listActivitySummaries, getActivity, saveActivity, deleteActivity, getResults, saveResult, clearResults, saveDraft, getDraft, clearDraft, updatePracticeState, resultMessage, leaderboard });
});
