const test = require('node:test');
const assert = require('node:assert/strict');
const timer = require('./timer.js');

test('timer shows tenths of a second across second and minute boundaries', () => {
  for (const [ms, text] of [[0,'0:00.0'],[9,'0:00.0'],[100,'0:00.1'],[999,'0:00.9'],[1000,'0:01.0'],[59999,'0:59.9'],[60000,'1:00.0'],[600123,'10:00.1']]) {
    assert.equal(timer.format(ms), text);
  }
});
test('width stays fixed until another minute digit is required and never shrinks', () => {
  let width = 0;
  for (const elapsed of [0,1111,8888,59999,60000,599999]) {
    const frame = timer.frame(elapsed, 0, width);
    assert.equal(frame.characters, 4);
    width = frame.characters;
  }
  width = timer.frame(600000, 0, width).characters;
  assert.equal(width, 5);
  assert.equal(timer.frame(599999, 0, width).characters, 5);
  assert.equal(timer.frame(6000000, 0, width).characters, 6);
});
test('countdown keeps its starting width and finishes exactly at zero', () => {
  const start = timer.frame(0, 600000);
  assert.equal(start.text, '10:00');
  const running = timer.frame(1, 600000, start.characters);
  assert.equal(running.text, '9:59');
  assert.equal(running.characters, start.characters);
  assert.equal(timer.frame(599999, 600000).expired, false);
  assert.deepEqual(timer.frame(600100, 600000, start.characters), {text:'0:00',characters:5,expired:true});
});

test('live activity time omits fractions while results retain one decimal', () => {
  assert.equal(timer.frame(16674).text, '0:16');
  assert.equal(timer.format(16674), '0:16.6');
});
