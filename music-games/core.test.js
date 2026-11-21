const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('./core.js');
const authoringSamples = require('../tests/fixtures/music-games-authoring-samples.js');

function sample(overrides = {}) {
  return core.makeActivity({ title: 'Directions', items: [{ prompt: 'Loud', answer: 'Forte', group: 'Dynamics' }, { prompt: 'Quiet', answer: 'Piano', group: 'Dynamics' }, { prompt: 'Fast', answer: 'Allegro', group: 'Tempo' }], ...overrides });
}

test('catalogue provides every requested game with distinct identities and usable metadata', () => {
  assert.equal(core.TEMPLATES.length, 6);
  assert.equal(new Set(core.TEMPLATES.map(template => template.id)).size, 6);
  for (const template of core.TEMPLATES) {
    assert.ok(template.name && template.description && template.category && template.icon);
    assert.equal(typeof template.scored, 'boolean');
    assert.equal(typeof core.compatibility(template.id, sample()).ok, 'boolean');
    const empty = core.compatibility(template.id, { items: [] });
    assert.equal(empty.ok, template.id === 'maths-generator');
    assert.equal(Boolean(empty.reason), !empty.ok);
  }
  assert.deepEqual(core.TEMPLATES.map(template => template.id), ['matching-pairs','group-sort','rank-order','wordsearch','crossword','labelled-diagram']);
});

test('all starter examples contain items and have a playable selected template', () => {
  assert.ok(core.SEEDS.length >= 4);
  for (const activity of core.SEEDS) {
    assert.ok(activity.items.length >= 1);
    assert.deepEqual(core.validateActivity(activity), []);
    assert.equal(core.compatibility(activity.template, activity).ok, true);
  }
});

test('normalization preserves content and clamps settings and diagram coordinates', () => {
  const activity = sample({ title: '  Test  ', tags: ['Music', 'Music', ' Tempo '], options: { timer: 99999, difficulty: 'unknown', sound: false, shuffle: false }, items: [{ prompt: '  Clue  ', answer: ' Answer ', x: -5, y: 130 }] });
  assert.equal(activity.title, 'Test');
  assert.deepEqual(activity.tags, ['Music', 'Tempo']);
  assert.equal(activity.options.timer, 3600);
  assert.equal(activity.options.difficulty, 'normal');
  assert.equal(activity.options.sound, false);
  assert.equal(activity.options.shuffle, false);
  assert.deepEqual([activity.items[0].x, activity.items[0].y], [0, 100]);
  assert.ok(activity.id && activity.items[0].id);
});

test('all offered themes survive save and import', () => {
  for (const theme of ['classic', 'ocean', 'garden', 'night']) {
    const activity = sample({ options: { theme } });
    assert.equal(core.normalizeImport(core.exportActivity(activity))[0].options.theme, theme);
  }

});



test('template-specific editor modes persist and reject modes belonging to another template', () => {
  for (const [template, modes] of Object.entries({ wordsearch: ['with-clues', 'without-clues'] })) {
    for (const editorMode of modes) {
      const activity = sample({ template, editorMode });
      assert.equal(activity.editorMode, editorMode);
      assert.deepEqual(core.normalizeImport(core.exportActivity(activity)), [activity]);
      assert.equal(core.normalize({ ...activity, items: [] }).editorMode, editorMode);
    }
  }
  const invalid = sample({ template: 'matching-pairs' });
  invalid.editorMode = 'with-clues';
  assert.ok(core.validateActivity(invalid).some(error => /editor mode/.test(error)));
  assert.throws(() => core.normalizeImport({ format: core.FORMAT, version: 1, activities: [invalid] }), /editor mode/);
  assert.equal(core.normalize(invalid).editorMode, undefined);
  assert.equal(core.normalize({ ...invalid, editorMode: { arbitrary: true } }).editorMode, undefined);
  assert.equal(core.normalize({ ...invalid, template: 'quiz', editorMode: 'identical-pairs' }).editorMode, undefined);
});

test('answer choices retain exactly one correct answer and exclude duplicate distractors', () => {
  const item = { prompt: 'Loud', answer: 'Forte', distractors: ['Forte', 'forte', ' Piano ', 'Piano', 'Allegro'] };
  const choices = core.choices(item, [{ answer: 'Piano' }, { answer: 'Presto' }]);
  assert.equal(choices.length, 4);
  assert.equal(choices.filter(answer => answer.toLowerCase() === 'forte').length, 1);
  assert.ok(choices.includes('Forte') && choices.includes('Piano'));
});

test('Sort treats duplicate item names as interchangeable across their authored groups', () => {
  const items = [{ id: 'one', prompt: 'Piano', group: 'Strings' }, { id: 'two', prompt: ' piano ', group: 'Percussion' }];
  const activity = core.normalize({ title: 'Duplicates', template: 'group-sort', items: items.map(item => ({ ...item, answer: item.prompt })) });
  assert.deepEqual(core.validateActivity(activity), []);
  const swapped = core.gradeSort(items, { 0: 'Percussion', 1: 'Strings' });
  assert.ok(swapped.every(mark => mark.correct));
  assert.deepEqual(swapped.map(mark => mark.expected), ['Percussion', 'Strings']);
  const overfilled = core.gradeSort(items, { 0: 'Strings', 1: 'Strings' });
  assert.equal(overfilled.filter(mark => mark.correct).length, 1);
  assert.equal(overfilled.find(mark => !mark.correct).expected, 'Percussion');
  assert.ok(core.gradeSort(items, { 0: 'Woodwind', 1: 'Brass' }).every(mark => !mark.correct));
});

test('Sort keeps different media-only cards distinct and accepts identical media copies', () => {
  const image = { type: 'image', src: 'https://example.org/one.png' };
  const items = [{ prompt: '', group: 'A', media: image }, { prompt: '', group: 'B', media: { ...image, src: 'https://example.org/two.png' } }];
  assert.ok(core.gradeSort(items, { 0: 'B', 1: 'A' }).every(mark => !mark.correct));
  items[1].media = image;
  assert.ok(core.gradeSort(items, { 0: 'B', 1: 'A' }).every(mark => mark.correct));
});

test('media-only cards save and round-trip without requiring text', () => {
  const image = { type: 'image', src: 'https://example.org/violin.png', name: 'Violin' };
  const audio = { type: 'audio', src: 'https://example.org/flute.mp3', name: 'Flute' };
  const activity = core.normalize({ title: 'Media sort', template: 'group-sort', items: [
    { id: 'image', prompt: '', answer: '', group: 'Strings', media: image },
    { id: 'audio', prompt: '', answer: '', group: 'Woodwind', media: audio },
  ] });
  assert.deepEqual(core.validateActivity(activity), []);
  const restored = core.normalize(JSON.parse(JSON.stringify(activity)));
  assert.equal(restored.items[0].prompt, '');
  assert.deepEqual(restored.items[0].media, image);
  assert.deepEqual(restored.items[1].media, audio);
  const empty = { ...activity, items: activity.items.map(item => ({ ...item, media: null })) };
  assert.ok(core.validateActivity(empty).length > 0);
  const pairs = core.normalize({ title: 'Media pairs', template: 'match-up', items: activity.items.map(item => ({ ...item, answerMedia: item.media })) });
  assert.deepEqual(core.validateActivity(pairs), []);
});

test('multiple correct answers and selection rule round-trip with authored option order and media', () => {
  const media = { type: 'image', src: 'data:image/png;base64,iVBORw0KGgo=', name: 'Picture.png' };
  const activity = sample({ items: [{ prompt: 'Choose dynamics', answer: 'Forte', correctAnswers: ['Forte', 'Piano'], requireAll: true, distractors: ['Allegro', 'forte'], answerOptions: ['Allegro', 'Forte', '', 'Piano'], answerOptionMedia: [media, null, null, media] }] });
  const item = activity.items[0];
  assert.deepEqual(item.correctAnswers, ['Forte', 'Piano']);
  assert.equal(item.answer, 'Forte');
  assert.equal(item.requireAll, true);
  assert.deepEqual(item.distractors, ['Allegro']);
  assert.deepEqual(item.answerOptions, ['Allegro', 'Forte', '', 'Piano']);
  assert.deepEqual(item.answerOptionMedia, [media, null, null, media]);
  assert.deepEqual(core.normalizeImport(core.exportActivity(activity)), [activity]);
  assert.deepEqual(core.choices(item, [{ answer: 'Unrelated' }]).sort(), ['Allegro', 'Forte', 'Piano']);
  item.requireAll = false;
  assert.equal(core.normalizeImport(core.exportActivity(activity))[0].items[0].requireAll, false);
});

test('authored options allow eight choices while every correct answer survives canonical deduplication', () => {
  const item = { answer: 'Forte', correctAnswers: ['Forte', '𝐅𝐨𝐫𝐭𝐞', 'Piano'], distractors: ['ｐｉａｎｏ', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] };
  const selected = core.choices(item, []);
  assert.equal(selected.length, 8);
  assert.equal(selected.filter(value => core.canonical(value) === 'forte').length, 1);
  assert.equal(selected.filter(value => core.canonical(value) === 'piano').length, 1);
  const single = { answer: 'One', answerOptions: ['Two', 'One', 'Three', 'Four', 'Five', 'Six'], distractors: [] };
  assert.equal(core.choices(single, [{ answer: 'Unrelated' }]).length, 6);
  assert.equal(core.canonical('  𝐅𝐨𝐫𝐭𝐞   ＰＩＡＮＯ  '), 'forte piano');
  const allCorrect = { answer: 'A', correctAnswers: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], distractors: ['Wrong'] };
  assert.deepEqual(core.choices(allCorrect, []).sort(), allCorrect.correctAnswers);
});

test('multi-answer imports reject missing primary answers, malformed options and unsafe answer media', () => {
  const valid = sample({ items: [{ prompt: 'Choose', answer: 'A', correctAnswers: ['A', 'B'], answerOptions: ['A', 'B', 'C'], answerOptionMedia: [null, null, null], distractors: ['C'] }] });
  for (const update of [
    { correctAnswers: [] }, { answer: 'C' }, { correctAnswers: 'A' }, { correctAnswers: [123] },
    { answerOptions: Array(9).fill('A') }, { answerOptions: ['A', 123] }, { requireAll: 'yes' },
    { answerOptionMedia: [null] },
    { answerOptionMedia: [null, { type: 'image', src: 'javascript:alert(1)' }, null] }
  ]) {
    const activity = structuredClone(valid);
    Object.assign(activity.items[0], update);
    assert.ok(core.validateActivity(activity).length > 0, JSON.stringify(update));
    assert.throws(() => core.normalizeImport({ format: core.FORMAT, version: 1, activities: [activity] }));
  }
});

test('cloze passages preserve whitespace, UTF16 positions and multiple gaps through export and import', () => {
  const clozeText = '  🎵 Forte means loud; piano means quiet.\n';
  const gaps = ['loud', 'quiet'].map(word => ({ start: clozeText.indexOf(word), end: clozeText.indexOf(word) + word.length, text: word }));
  const activity = sample({ template: 'complete-the-sentence', items: [{ clozeText, clozeGaps: gaps.slice().reverse() }] });
  const item = activity.items[0];
  assert.equal(item.clozeText, clozeText);
  assert.deepEqual(item.clozeGaps, gaps);
  assert.equal(item.prompt, '  🎵 Forte means ___; piano means ___.\n');
  assert.equal(item.answer, 'loud');
  assert.deepEqual(core.validateActivity(activity), []);
  assert.deepEqual(core.normalizeImport(core.exportActivity(activity)), [activity]);
  const draft = core.normalize({ ...activity, items: [{ clozeText, clozeGaps: [] }] });
  assert.equal(draft.items[0].clozeText, clozeText);
  assert.equal(draft.items[0].prompt, clozeText);
  assert.deepEqual(draft.items[0].clozeGaps, []);
  assert.ok(core.validateActivity(draft).length > 0);
  assert.deepEqual(core.validateActivity(authoringSamples['complete-the-sentence']), []);
});

test('cloze import and normalization reject corrupt, overlapping or out-of-range gaps', () => {
  const valid = sample({ template: 'complete-the-sentence', items: [{ clozeText: 'A loud sound', clozeGaps: [{ start: 2, end: 6, text: 'loud' }], distractors: ['quiet'] }] });
  for (const update of [
    { clozeText: null }, { clozeGaps: null }, { clozeGaps: [{ start: -1, end: 3, text: 'A l' }] },
    { clozeGaps: [{ start: 2, end: 99, text: 'loud' }] }, { clozeGaps: [{ start: 2.5, end: 6, text: 'loud' }] },
    { clozeGaps: [{ start: 2, end: 2, text: '' }] }, { clozeGaps: [{ start: 2, end: 6, text: 'soft' }] },
    { clozeGaps: [{ start: 2, end: 6, text: 'loud' }, { start: 3, end: 6, text: 'oud' }] },
    { clozeGaps: [{ start: 1, end: 2, text: ' ' }] }, { clozeText: 'a'.repeat(core.LIMITS.text + 1), clozeGaps: [] }
  ]) {
    const activity = structuredClone(valid);
    Object.assign(activity.items[0], update);
    assert.ok(core.validateActivity(activity).length > 0);
    assert.throws(() => core.normalize(activity), /cloze/i);
    assert.throws(() => core.normalizeImport({ format: core.FORMAT, version: 1, activities: [activity] }), /cloze/i);
  }
});

test('shuffling does not mutate authored order', () => {
  const authored = ['one', 'two', 'three'];
  assert.deepEqual(core.shuffle(authored, () => 0), ['two', 'three', 'one']);
  assert.deepEqual(authored, ['one', 'two', 'three']);
});

test('switching templates checks the actual content requirements', () => {
  const oneItem = sample({ items: [{ prompt: 'Clue', answer: 'Same' }] });
  assert.equal(core.compatibility('quiz', oneItem).ok, false);
  oneItem.items[0].distractors = ['Different'];
  assert.equal(core.compatibility('quiz', oneItem).ok, true);
  assert.equal(core.compatibility('matching-pairs', oneItem).ok, false);
  assert.equal(core.compatibility('group-sort', sample()).ok, true);
  assert.equal(core.compatibility('group-sort', oneItem).ok, false);
  assert.equal(core.compatibility('unjumble', sample()).ok, false);
  assert.equal(core.compatibility('unjumble', sample({ items: [{ prompt: 'Order', answer: 'A complete sentence' }] })).ok, false);
  assert.equal(core.compatibility('complete-the-sentence', sample()).ok, false);
  assert.equal(core.compatibility('complete-the-sentence', authoringSamples['complete-the-sentence']).ok, true);
  assert.equal(core.compatibility('missing-template', sample()).ok, false);
});

test('labelled diagrams require a background image', () => {
  const activity = sample();
  activity.items.forEach(item => { item.media = { type: 'image', src: 'https://example.org/photo.png', name: 'Photo' }; });
  assert.equal(core.compatibility('labelled-diagram', activity).ok, false);
  activity.diagram = activity.items[0].media;
  assert.equal(core.compatibility('labelled-diagram', activity).ok, true);
});

test('discussion tools accept prompt-only content and word grids reject unsuitable words', () => {
  const activity = sample({ template: 'matching-pairs', items: core.SEEDS.find(seed => seed.template === 'matching-pairs').items.map(item=>({...item,answer:''})) });
  assert.deepEqual(core.validateActivity(activity), []);
  assert.equal(core.compatibility('quiz', activity).ok, false);
  assert.equal(core.compatibility('wordsearch', sample({ items: [{ prompt: 'Pitch', answer: 'C#' }] })).ok, false);
  assert.equal(core.compatibility('crossword', sample({ items: [{ prompt: 'One', answer: 'Forte' }, { prompt: 'Two', answer: 'forte' }] })).ok, false);
  assert.equal(core.compatibility('wordsearch', core.SEEDS[0]).ok, true);
});

test('malformed activities produce validation errors rather than crashing', () => {
  for (const activity of [null, {}, { template: 'quiz', title: 'Broken', items: [null] }, { template: 'quiz', title: '', items: [] }]) {
    assert.ok(core.validateActivity(activity).length > 0);
  }
  const repeated = sample();
  repeated.items[1].id = repeated.items[0].id;
  assert.ok(core.validateActivity(repeated).some(error => /unique/.test(error)));
});

test('portable export round-trips embedded media, author order and options', () => {
  const media = { type: 'image', src: 'data:image/png;base64,iVBORw0KGgo=', name: 'Picture.png' };
  const activity = sample();
  activity.items[0].media = media;
  activity.items[1].answerMedia = { type: 'audio', src: 'data:audio/wav;base64,UklGRg==', name: 'Sound.wav' };
  activity.diagram = media;
  assert.deepEqual(core.normalizeImport(core.exportActivity(activity)), [activity]);
});

test('multi-activity import retains images, audio, video and independent activity identities', () => {
  const one = sample({ title: 'Media one' });
  const two = sample({ title: 'Media two' });
  one.items[0].media = { type: 'image', src: 'data:image/png;base64,iVBORw0KGgo=', name: 'Image.png' };
  one.items[1].media = { type: 'audio', src: 'data:audio/wav;base64,UklGRg==', name: 'Audio.wav' };
  two.items[0].media = { type: 'video', src: 'data:video/mp4;base64,AAAAAA==', name: 'Video.mp4' };
  two.items[1].answerMedia = one.items[0].media;
  const restored = core.normalizeImport(JSON.stringify({ format: core.FORMAT, version: 1, activities: [one, two] }));
  assert.deepEqual(restored, [one, two]);
  assert.notEqual(restored[0].id, restored[1].id);
  const piano = core.SEEDS.find(activity => activity.template === 'labelled-diagram');
  assert.ok(piano.diagram.src.startsWith('data:image/png;base64,'));
  assert.equal(piano.items.length, 7);
  assert.deepEqual(core.normalizeImport(core.exportActivity(piano))[0], piano);
});

test('media validation rejects executable and ephemeral URLs but accepts safe media links', () => {
  for (const src of ['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'data:image/svg+xml;base64,PHN2Zz4=', 'blob:https://example.org/id', 'file:///tmp/image.png', 'https://user:password@example.org/image.png', 'https://example.org/\nimage.png']) {
    assert.throws(() => core.safeMedia({ type: 'image', src }), /media|link|source|supported/);
  }
  assert.deepEqual(core.safeMedia({ type: 'video', src: 'https://example.org/movie.mp4', name: 'Movie' }), { type: 'video', src: 'https://example.org/movie.mp4', name: 'Movie' });
  assert.throws(() => core.safeMedia({ type: 'audio', src: 'data:image/png;base64,AAAA' }), /type/);
});

test('embedded media size limits measure decoded bytes, including base64 padding', () => {
  const atLimit = Buffer.alloc(core.LIMITS.mediaBytes).toString('base64');
  assert.equal(core.safeMedia({ type: 'audio', src: 'data:audio/wav;base64,' + atLimit }).type, 'audio');
  const oversized = Buffer.alloc(core.LIMITS.mediaBytes + 1).toString('base64');
  assert.throws(() => core.safeMedia({ type: 'audio', src: 'data:audio/wav;base64,' + oversized }), /20 MB/);
});

test('imports reject unsupported formats, dangerous keys, broken text and oversized item lists', () => {
  assert.throws(() => core.normalizeImport('{broken'), /JSON/);
  assert.throws(() => core.normalizeImport({ version: 1, activities: [sample()] }), /export/);
  for (const template of [undefined, 'unsupported-game']) {
    const badTemplate = sample();
    badTemplate.template = template;
    assert.throws(() => core.normalizeImport({ format: core.FORMAT, version: 1, activities: [badTemplate] }), /supported game type/);
  }
  assert.throws(() => core.normalizeImport('{"format":"music-literacy-interactive-games","version":1,"activities":[],"__proto__":{}}'), /unsupported property/);
  const oversized = sample();
  oversized.items = Array.from({ length: 201 }, (_, index) => ({ id: 'item-' + index, prompt: 'Question', answer: String(index) }));
  assert.throws(() => core.normalizeImport({ format: core.FORMAT, version: 1, activities: [oversized] }), /200/);
  const longText = sample();
  longText.items[0].prompt = 'a'.repeat(10001);
  assert.throws(() => core.normalizeImport({ format: core.FORMAT, version: 1, activities: [longText] }), /too long/);
  const same = sample();
  assert.throws(() => core.normalizeImport({ format: core.FORMAT, version: 1, activities: [same, same] }), /duplicate/);
});

test('leaderboards rank by percentage then time and leave input untouched', () => {
  const results = [{ id: 'slow', score: 10, total: 10, seconds: 80 }, { id: 'partial', score: 18, total: 20, seconds: 5 }, { id: 'fast', score: 5, total: 5, seconds: 20 }, { id: 'invalid', score: 1, total: 0 }];
  const ranked = core.leaderboard(results);
  assert.deepEqual(ranked.map(row => row.id), ['fast', 'slow', 'partial']);
  assert.deepEqual(ranked.map(row => row.rank), [1, 2, 3]);
  assert.equal(ranked[2].percentage, 90);
  assert.equal(results[0].rank, undefined);
});

test('score settings identity is stable across property order and changes with configuration', () => {
  const first = sample({ options: { timer: 60, sound: true, difficulty: 'hard' } });
  const second = sample({ options: { difficulty: 'hard', sound: true, timer: 60 } });
  assert.equal(core.optionsKey(first), core.optionsKey(second));
  second.options.timer = 120;
  assert.notEqual(core.optionsKey(first), core.optionsKey(second));
});

test('shared-link identity is stable for identical content and changes with content or revision', () => {
  const activity = sample();
  const identity = core.sharedActivityId(activity);
  assert.match(identity, /^shared-[a-f0-9]{16}$/);
  assert.equal(core.sharedActivityId(JSON.parse(JSON.stringify(activity))), identity);
  assert.equal(core.sharedActivityId({ ...activity, updatedAt: '2020-01-01T00:00:00.000Z' }), identity);
  assert.notEqual(core.sharedActivityId({ ...activity, title: 'A changed title' }), identity);
  assert.notEqual(core.sharedActivityId({ ...activity, revision: activity.revision + 1 }), identity);
  assert.notEqual(core.sharedActivityId({ ...activity, id: core.uid() }), identity);
  const minimal = { title: 'A minimal activity', template: 'quiz', items: [{ prompt: 'Quiet', answer: 'Piano' }] };
  assert.equal(core.sharedActivityId(minimal), core.sharedActivityId(minimal));
});

test('missing browser storage reports a failure rather than claiming a successful save', async () => {
  await assert.rejects(core.saveActivity(sample()), /storage is unavailable/);
  await assert.rejects(core.saveDraft(sample()), /storage is unavailable/);
  await assert.rejects(core.saveResult({ activityId: 'example', template: 'quiz', score: 20, total: 10 }), /not valid/);
});

// A small transactional IndexedDB stand-in exercises our persistence lifecycle.
// Writes are committed only after every queued request has completed.
function indexedDBStandIn(options = {}) {
  const data = new Map();
  const db = {
    objectStoreNames: { contains: name => data.has(name) },
    createObjectStore(name) { data.set(name, new Map()); return { createIndex() {} }; },
    close() {},
    transaction(names, mode) {
      const stores = new Map(names.map(name => [name, new Map(data.get(name))]));
      let pending = 0;
      let aborted = false;
      let completion;
      const tx = {
        abort() { aborted = true; setImmediate(() => tx.onabort && tx.onabort()); },
        objectStore(name) {
          const rows = stores.get(name);
          function request(fn) {
            pending++;
            clearImmediate(completion);
            const req = {};
            setImmediate(() => {
              if (aborted) return;
              try { req.result = fn(); if (req.onsuccess) req.onsuccess(); } catch (error) { tx.error = error; tx.abort(); }
              pending--;
              if (pending === 0) completion = setImmediate(() => {
                if (aborted || pending) return;
                if (mode === 'readwrite') stores.forEach((values, key) => data.set(key, values));
                if (tx.oncomplete) tx.oncomplete();
              });
            });
            return req;
          }
          return {
            get(key) { return request(() => structuredClone(rows.get(key))); },
            getAll() { return request(() => structuredClone([...rows.values()])); },
            put(value) {
              return request(() => {
                options.writeCount = (options.writeCount || 0) + 1;
                if (options.quotaExceeded || options.failOnWrite === options.writeCount) throw new Error('QuotaExceededError: not enough browser storage');
                rows.set(value.id, structuredClone(value));
                return value.id;
              });
            },
            delete(key) { return request(() => rows.delete(key)); },
            index() {
              return {
                getAll(activityId) { return request(() => structuredClone([...rows.values()].filter(row => row.activityId === activityId))); },
                openCursor(activityId) {
                  const matching = [...rows.values()].filter(row => row.activityId === activityId);
                  const req = {};
                  let index = 0;
                  const step = () => {
                    const queued = request(() => {
                      const row = matching[index++];
                      return row ? { delete() { rows.delete(row.id); }, continue() { step(); } } : null;
                    });
                    queued.onsuccess = () => { req.result = queued.result; if (req.onsuccess) req.onsuccess(); };
                  };
                  step();
                  return req;
                }
              };
            }
          };
        }
      };
      return tx;
    }
  };
  return { open() { const request = {}; setImmediate(() => { request.result = db; request.transaction={objectStore(){return {openCursor(){const cursor={};setImmediate(()=>{cursor.result=null;cursor.onsuccess?.();});return cursor;}};}}; request.onupgradeneeded(); request.onsuccess(); }); return request; } };
}

test('activities retain revisions, drafts stay separate, and results persist by activity', async () => {
  const context = { require, indexedDB: indexedDBStandIn(), module: { exports: {} }, URL, TextEncoder, crypto: require('node:crypto').webcrypto, setTimeout };
  vm.runInNewContext(fs.readFileSync(require.resolve('./core.js'), 'utf8'), context);
  const api = context.module.exports;
  const original = sample();
  const saved = await api.saveActivity(original);
  assert.equal(saved.revision, 1);
  saved.title = 'Edited directions';
  const edited = await api.saveActivity(saved);
  assert.equal(edited.revision, 2);
  assert.equal((await api.listActivities())[0].title, 'Edited directions');
  const incomplete = sample({ title: '', items: [] });
  await api.saveDraft(incomplete);
  assert.equal((await api.getDraft()).title, '');
  assert.equal((await api.listActivities()).length, 1);
  await api.clearDraft();
  assert.equal(await api.getDraft(), null);
  const emptyModeDraft = api.makeActivity({ title: '', template: 'matching-pairs', editorMode: 'different-pairs', items: [] });
  await api.saveDraft(emptyModeDraft);
  assert.equal((await api.getDraft()).editorMode, undefined);
  assert.equal((await api.getDraft()).items.length, 0);
  await api.clearDraft();
  await api.saveResult({ activityId: edited.id, revision: 2, template: 'quiz', score: 2, total: 3, seconds: 15, name: 'Pupil', optionsKey: api.optionsKey(edited) });
  assert.equal((await api.getResults(edited.id))[0].revision, 2);
  assert.equal((await api.getResults('another-activity')).length, 0);
  const other = await api.saveActivity(sample({ title: 'Other activity' }));
  await api.saveResult({ activityId: other.id, template: 'quiz', score: 1, total: 2, seconds: 10 });
  await api.clearResults(edited.id);
  assert.equal((await api.getResults(edited.id)).length, 0);
  assert.equal((await api.getResults(other.id)).length, 1);
  await api.deleteActivity(other.id);
  assert.equal((await api.getResults(other.id)).length, 0);
  assert.equal((await api.listActivities()).length, 1);
});

test('quota-aborted draft writes reject and preserve the last successfully saved draft', async () => {
  const storageState = { quotaExceeded: false };
  const context = { require, indexedDB: indexedDBStandIn(storageState), module: { exports: {} }, URL, TextEncoder, crypto: require('node:crypto').webcrypto, setTimeout };
  vm.runInNewContext(fs.readFileSync(require.resolve('./core.js'), 'utf8'), context);
  const api = context.module.exports;
  const original = sample({ title: 'Last saved draft' });
  await api.saveDraft(original);
  storageState.quotaExceeded = true;
  await assert.rejects(api.saveDraft(sample({ title: 'Unsaved change' })), /storage could not complete.*QuotaExceeded/);
  storageState.quotaExceeded = false;
  assert.equal((await api.getDraft()).title, 'Last saved draft');
  await api.saveDraft(sample({ title: 'Retry after freeing space' }));
  assert.equal((await api.getDraft()).title, 'Retry after freeing space');
});

test('bundle imports are atomic on a later quota failure and successful imports receive fresh identities', async () => {
  const storageState = {};
  const context = { require, indexedDB: indexedDBStandIn(storageState), module: { exports: {} }, URL, TextEncoder, crypto: require('node:crypto').webcrypto, setTimeout };
  vm.runInNewContext(fs.readFileSync(require.resolve('./core.js'), 'utf8'), context);
  const api = context.module.exports;
  const prior = await api.saveActivity(sample({ title: 'Already saved' }));
  const incoming = [sample({ title: 'First import', revision: 7 }), sample({ title: 'Second import', revision: 12 })];
  const bundle = JSON.stringify({ format: core.FORMAT, version: 1, activities: incoming });
  storageState.writeCount = 0;
  storageState.failOnWrite = 2;
  await assert.rejects(api.importActivities(bundle), /QuotaExceeded/);
  const afterFailure = await api.listActivities();
  assert.equal(afterFailure.length, 1);
  assert.equal(afterFailure[0].id, prior.id);
  storageState.failOnWrite = undefined;
  const imported = await api.importActivities(bundle);
  assert.equal(imported.length, 2);
  imported.forEach((activity, index) => {
    assert.notEqual(activity.id, incoming[index].id);
    assert.equal(activity.revision, 1);
    assert.equal(activity.title, incoming[index].title);
  });
  assert.equal((await api.listActivities()).length, 3);
});

test('High readability survives activity export and import with its own score settings', () => {
  const original = sample({ options: { theme: 'high-readability', shuffle: false } });
  const restored = core.makeActivity(JSON.parse(JSON.stringify(original)));
  assert.equal(restored.options.theme, 'high-readability');
  assert.equal(core.optionsKey(restored), core.optionsKey(original));
  assert.notEqual(core.optionsKey(restored), core.optionsKey({...restored, options: {...restored.options, theme: 'classic'}}));
});

test('qualification levels survive export and import with a legacy N3 default', () => {
  for (const level of ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'N3', 'N4', 'N5', 'H', 'AH']) {
    const activity = sample({ level });
    assert.equal(core.normalizeImport(core.exportActivity(activity))[0].level, level);
  }
  assert.equal(sample().level, '');
  assert.equal(core.normalize({title:'Legacy',template:'quiz',items:[]}).level, 'N3');
  assert.equal(sample({ level: 'invalid' }).level, 'N3');
  assert.equal(core.normalize({...authoringSamples['complete-the-sentence'], level:'N4'}).level, 'N4');
});

test('result messages follow score percentages with full marks reserved for a perfect score',()=>{
  const random=Math.random; Math.random=()=>0;
  try {
  assert.equal(core.resultMessage({correct:6,total:6}),'Wow! Full marks!');
  assert.notEqual(core.resultMessage({correct:999,total:1000}),'Wow! Full marks!');
  assert.match(core.resultMessage({correct:3,total:5}),/^Great attempt!/);
  assert.match(core.resultMessage({correct:1,total:5}),/^Unlucky!/);
  const messages=[100,90,80,70,60,50,40,30,20,10,0].map(correct=>core.resultMessage({correct,total:100}));
  assert.equal(new Set(messages).size,11);
  assert.equal(core.resultMessage({correct:0,total:0}),'Activity complete');
  assert.equal(core.resultMessage({correct:0,total:6,unscored:true}),'Activity complete');
  } finally { Math.random=random; }
});

test('puzzle compatibility matches the generators 24-letter word limit', () => {
  for (const template of ['wordsearch','crossword']) {
    const activity=sample({items:[{id:'long',prompt:'Long word',answer:'A'.repeat(24)}]});
    assert.equal(core.compatibility(template,activity).ok,true);
    activity.items[0].answer+='A';
    assert.equal(core.compatibility(template,activity).ok,false);
  }
});

test('Sort accepts up to sixty cards and six groups',()=>{
 const C=require('./core.js');
 const items=Array.from({length:60},(_,i)=>({id:String(i),prompt:'Concept '+i,answer:'Concept '+i,group:'Group '+(i%6)}));
 assert.equal(C.compatibility('group-sort',{items}).ok,true);
 assert.match(C.compatibility('group-sort',{items:[...items,{prompt:'Extra',answer:'Extra',group:'Group 0'}]}).reason,/60 cards/);
 assert.match(C.compatibility('group-sort',{items:items.slice(0,7).map((item,i)=>({...item,group:'Group '+i}))}).reason,/6 groups/);
 assert.equal(C.compatibility('group-sort',{items:items.map((item,i)=>({...item,group:'Group '+i%2}))}).ok,true);
});

test('Crossword and Word Search accept fifteen words and reject a sixteenth',()=>{
 for(const template of ['crossword','wordsearch']){
  const items=Array.from({length:16},(_,i)=>({prompt:'Clue',answer:'WORD'+String.fromCharCode(65+i)}));
  assert.equal(core.LIMITS[template+'Items'],15);
  assert.equal(core.compatibility(template,sample({items:items.slice(0,15)})).ok,true);
  assert.match(core.compatibility(template,sample({items})).reason,/15 words/);
  for(const a of core.SEEDS.filter(a=>a.template===template))assert.ok(a.items.length<=15,a.id);
 }
});

test('Music Concepts titles retain numbering and update the previous wording',()=>{
 for(const n of ['', ' 1', ' 4'])assert.equal(core.activityTitle('Musical Concepts'+n),'Music Concepts'+n);
 assert.equal(core.activityTitle('Connections 1'),'Connections 1');
 assert.equal(core.activityTitle('Connection 1'),'Music Concepts 1');
});

test('Blank accepts authored interchangeable tiles once each and preserves fixed slots',()=>{
 const gaps=[{start:0,end:7,text:'harmony',exchangeGroup:'list'},{start:12,end:25,text:'improvisation',exchangeGroup:'list'}];
 assert.deepEqual(core.gradeCloze(gaps,['improvisation','harmony']),[true,true]);
 assert.deepEqual(core.gradeCloze(gaps,['harmony','harmony']),[true,false]);
 assert.deepEqual(core.gradeCloze(gaps,['silence','harmony']),[false,true]);
 assert.deepEqual(core.gradeCloze(gaps.map(({exchangeGroup,...gap})=>gap),['improvisation','harmony']),[false,false]);
 const activity=sample({template:'complete-the-sentence',items:[{id:'list',clozeText:'harmony and improvisation',clozeGaps:gaps}]});
 assert.equal(activity.items[0].clozeGaps[1].exchangeGroup,'list');
});

test('fresh collection edition survives saving, editing and catalogue summary reads',async()=>{
 const context={require,indexedDB:indexedDBStandIn(),module:{exports:{}},URL,TextEncoder,crypto:require('node:crypto').webcrypto,setTimeout};
 vm.runInNewContext(fs.readFileSync(require.resolve('./core.js'),'utf8'),context);
 const api=context.module.exports;
 const saved=await api.saveActivity({...sample(),collectionEdition:2});
 assert.equal((await api.getActivity(saved.id)).collectionEdition,2);
 assert.equal((await api.listActivitySummaries())[0].collectionEdition,2);
 await api.saveActivity({...saved,title:'Edited collection'});
 assert.equal((await api.listActivitySummaries())[0].collectionEdition,2);
});

test('Connections cycles persist separately from the collection editor draft', async () => {
  const context={require,indexedDB:indexedDBStandIn(),module:{exports:{}},URL,TextEncoder,crypto:require('node:crypto').webcrypto,setTimeout};
  vm.runInNewContext(fs.readFileSync(require.resolve('./core.js'),'utf8'),context);
  const api=context.module.exports;
  const draft=await api.saveDraft(sample());
  await api.updatePracticeState('connections-group-cycle:N3',()=>({games:['one','two'],index:1}));
  const next=await api.updatePracticeState('connections-group-cycle:N3',saved=>({...saved,index:saved.index+1}));
  assert.equal(next.index,2);assert.deepEqual(next.games,['one','two']);
  assert.equal((await api.getDraft()).id,draft.id);
  await api.clearDraft();
  assert.equal((await api.updatePracticeState('connections-group-cycle:N3',saved=>saved)).index,2);
});

test('large fact-sort results retain every marked answer when saved',async()=>{
 const context={require,indexedDB:indexedDBStandIn(),module:{exports:{}},URL,TextEncoder,crypto:require('node:crypto').webcrypto,setTimeout};vm.runInNewContext(fs.readFileSync(require.resolve('./core.js'),'utf8'),context);const api=context.module.exports;
 const answers=Array.from({length:224},(_,index)=>({id:'fact-'+index,correct:true}));await api.saveResult({activityId:'large-facts',template:'group-sort',score:224,total:224,seconds:5,answers});assert.equal((await api.getResults('large-facts'))[0].answers.length,224);
});
