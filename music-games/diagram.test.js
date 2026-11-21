const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./diagram-core.js');
const C = require('./core.js');
const drumkit = C.SEEDS.find(activity => activity.id === 'hub-s1-parts-of-the-drumkit');
test('drumkit retains the saved Hub labels and exact target coordinates', () => {
  const source = [
    ['Bass drum', .4417989417989418, .5846560846560847],
    ['Snare drum', .2962962962962963, .4444444444444444],
    ['Hi-hat', .11904761904761904, .3306878306878307],
    ['High tom', .373015873015873, .3492063492063492],
    ['Mid tom', .5423280423280423, .3544973544973545],
    ['Floor tom', .6455026455026455, .5291005291005291],
    ['Ride', .7883597883597884, .30158730158730157],
    ['Crash', .2275132275132275, .19047619047619047]
  ];
  assert.equal(drumkit.items.length, source.length);
  source.forEach(([answer, x, y], index) => {
    const item = drumkit.items[index];
    assert.equal(item.answer, answer);
    assert.ok(Math.abs(item.x / 100 - x) < 1e-12);
    assert.ok(Math.abs(item.y / 100 - y) < 1e-12);
  });
});
test('wrong placements are accepted, movable, and replace an occupied target', () => {
  const [a, b] = drumkit.items;
  let placements = M.assign({}, a.id, b.id);
  assert.equal(placements[a.id], b.id);
  placements = M.assign(placements, b.id, b.id);
  assert.equal(placements[a.id], undefined);
  assert.equal(placements[b.id], b.id);
  placements = M.assign(placements, b.id, a.id);
  assert.equal(placements[b.id], a.id);
  assert.deepEqual(M.assign(placements, b.id, null), {});
});
test('submitted score includes unanswered targets and never counts displaced pins', () => {
  const [a, b] = drumkit.items;
  const summary = M.score(drumkit.items, { [a.id]: a.id, [b.id]: drumkit.items[2].id });
  assert.equal(summary.correct, 1);
  assert.equal(summary.total, 8);
  assert.equal(summary.answers.filter(row => !row.answer).length, 6);
  assert.equal(summary.answers[2].answer, b.answer);
});
test('arrangement stays balanced and target hit testing uses the actual image rectangle', () => {
  const assignments = Object.fromEntries(drumkit.items.map(item => [item.id, item.id]));
  const layout = M.arrange(drumkit.items, assignments);
  assert.equal(Object.values(layout.slots).filter(slot => slot.side === 0).length, 4);
  assert.equal(new Set(layout.order).size, 8);
  for (const item of drumkit.items) assert.equal(M.nearest(drumkit.items, M.target(item)), item.id);
  assert.equal(M.nearest(drumkit.items, { x: 5, y: 5 }), null);
});

test('twelve diagram labels shrink inside the existing eight-label column bounds', () => {
  const items = Array.from({length:12},(_,i)=>({id:String(i),answer:`Label ${i+1}`,prompt:`Label ${i+1}`,x:i*8,y:50}));
  const slots = Object.values(M.arrange(items,{}).slots);
  assert.equal(slots.length,12);
  assert.equal(Math.min(...slots.map(slot=>slot.y)),77);
  assert.equal(Math.max(...slots.map(slot=>slot.y+slot.height)),547);
  assert.ok(slots.every(slot=>slot.height<110));
  const activity = {...drumkit,items};
  assert.equal(C.compatibility('labelled-diagram',activity).ok,true);
  activity.items=[...items,{id:'extra',answer:'Extra',x:50,y:50}];
  assert.equal(C.compatibility('labelled-diagram',activity).ok,false);
  assert.ok(C.validateActivity(activity).includes('A diagram can contain up to 12 labels.'));
});

test('pin coordinates follow the visible scene under nested scaling and letterboxing',()=>{
 for(const scale of [.4,.75,1,1.6]){
  const rect={left:123,top:77,width:960*scale,height:600*scale};
  for(const point of [{x:196,y:160},{x:500,y:300},{x:760,y:500}]){
   const actual=M.scenePoint(rect,{clientX:rect.left+point.x*scale,clientY:rect.top+point.y*scale});
   assert.ok(Math.abs(actual.x-point.x)<1e-8);assert.ok(Math.abs(actual.y-point.y)<1e-8);
  }
 }
 assert.deepEqual(M.scenePoint({left:10,top:20,width:500,height:500},{clientX:260,clientY:270}),{x:480,y:300});
});
