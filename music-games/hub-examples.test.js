const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('./core.js');

test('Every bundled Hub activity is valid without requiring examples for all authoring templates', () => {
  assert.equal(new Set(core.SEEDS.map(activity => activity.id)).size, core.SEEDS.length);
  for (const type of core.TEMPLATES) {
    const examples = core.SEEDS.filter(activity => activity.template === type.id);
    // Empty template groups are intentional after the library cleanup.
    for (const activity of examples) {
      assert.deepEqual(core.validateActivity(activity), [], activity.title);
      assert.equal(core.compatibility(type.id, activity).ok, true, activity.title);
    }
  }
});

test('permanent drum kit and piano activities remain in the Hub', () => {
  const drums = core.SEEDS.find(activity => activity.id === 'hub-s1-parts-of-the-drumkit');
  const piano = core.SEEDS.find(activity => activity.id === 'example-piano-keys');
  assert.equal(drums.title, 'Parts of the Drum Kit');
  assert.equal(piano.title, 'Piano Keys');
  assert.equal(drums.items.length, 8);
  assert.deepEqual(piano.items.map(item => item.answer), ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
});

 test('Image Reveal and its Keyfinder example are removed', () => {
  assert.equal(core.TEMPLATES.some(type => type.id === 'image-quiz'), false);
  assert.equal(core.SEEDS.some(activity => activity.id === 'example-highlighted-keys'), false);
  assert.equal(core.compatibility('image-quiz', core.SEEDS[0]).ok, false);
});

test('Spin the Wheel and its Hub example are removed', () => {
  assert.equal(core.TEMPLATES.some(type => type.id === 'spin-the-wheel'), false);
  assert.equal(core.SEEDS.some(activity => activity.id === 'hub-test-spin-the-wheel'), false);
  assert.equal(core.compatibility('spin-the-wheel', core.SEEDS[0]).ok, false);
});
