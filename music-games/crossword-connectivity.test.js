const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
const C=require('./core');
const context={window:{IGCore:C},React:{createElement(){},useState(){},useMemo(){},useRef(){},useEffect(){},useLayoutEffect(){}},console};
vm.runInNewContext(Babel.transform(fs.readFileSync('music-games/learning.jsx','utf8'),{presets:['react']}).code,context);
const make=context.window.IGLearningPuzzles.makeCrossword;
function components(puzzle){
 const pending=new Set(puzzle.placed.map((_,i)=>i));let total=0;
 while(pending.size){total++;const queue=[pending.values().next().value];pending.delete(queue[0]);while(queue.length){const p=puzzle.placed[queue.shift()];for(const i of pending){if(puzzle.placed[i].positions.some(a=>p.positions.some(b=>a.row===b.row&&a.col===b.col))){pending.delete(i);queue.push(i);}}}}
 return total;
}
test('National 3 All Concepts remains connected across shuffled starting orders',()=>{
 const activity=JSON.parse(fs.readFileSync('music-games/activities/hub-collection-n3-level-n3-crossword-1.json','utf8'));
 for(let i=0;i<100;i++){
  const puzzle=make(C.shuffle(activity.items));
  assert.equal(puzzle.placed.length,activity.items.length);
  assert.equal(components(puzzle),1,`shuffle ${i}`);
  for(const p of puzzle.placed)for(const cell of p.positions)assert.equal(puzzle.cells.get(`${cell.row},${cell.col}`).letter,cell.letter);
 }
});
test('words with no shared letters are retained rather than silently dropping clues',()=>{
 const puzzle=make([{answer:'ABC',prompt:'First'},{answer:'XYZ',prompt:'Second'}]);
 assert.equal(puzzle.placed.length,2);assert.equal(components(puzzle),2);
 assert.equal(make([]).placed.length,0);
});
