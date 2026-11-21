const test = require('node:test');
const assert = require('node:assert/strict');
const dictionary = require('../music-dictionary/music-concepts-data.js');
const audio = require('../music-dictionary/music-concepts-audio.json');

test('Dictionary concepts retain distinct saved examples, including the requested single-example pages', () => {
  for (const concept of dictionary.concepts) {
    const clips = audio.concepts[concept.id] || [];
    assert.ok(clips.length >= (['MC-0011', 'MC-0157', 'MC-0165', 'MC-0169', 'MC-0171', 'MC-0173', 'MC-0174', 'MC-0025', 'MC-0036', 'MC-0035', 'MC-0010', 'MC-0279', 'MC-0242', 'MC-0235', 'MC-0239', 'MC-0240', 'MC-0233', 'MC-0238', 'MC-0232', 'MC-0229', 'MC-0228'].includes(concept.id) ? 1 : 2), `${concept.id}: ${concept.name} needs at least two examples`);
    if (concept.id === 'MC-0087') {
      // Two different ornaments isolated from a single piano teaching recording.
      assert.deepEqual(clips.map(clip => clip.title), ['Piano Mordent', 'Piano Trill']);
      assert.ok(clips[0].endSeconds <= clips[1].startSeconds, 'Ornament demonstrations must not overlap');
    } else {
      assert.equal(new Set(clips.map(clip => clip.sourceUrl || clip.src)).size, clips.length, `${concept.name} needs distinct recordings`);
    }
    assert.ok(clips.every(clip => !/commons\.wikimedia|upload\.wikimedia/.test(clip.sourceUrl || clip.src || '')), `${concept.name} still uses Wikimedia audio`);
    assert.equal(new Set(clips.map(clip => clip.id)).size, clips.length,
      `${concept.name} contains a duplicate saved example`);
  }
});
