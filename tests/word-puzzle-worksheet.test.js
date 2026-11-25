const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Babel=require('@babel/standalone');
const W=require('../shared/word-puzzle-worksheet.js'),C=require('../music-games/core.js');
const context={React,window:{IGCore:C}};
vm.runInNewContext(fs.readFileSync('music-games/runtime/learning.js','utf8'),context);
const activity={title:'Custom instruments',level:'N4',items:['Piano','Violin','Flute','Trombone','Trumpet','Clarinet'].map((answer,i)=>({id:String(i),answer,prompt:'Instrument clue '+i}))};
for(const kind of ['crossword','wordsearch']){
 test(kind+' snapshots preserve every answer, clue and grid coordinate after JSON storage',()=>{
  const config=JSON.parse(JSON.stringify(W.createConfig(activity,kind,context.window.IGLearningPuzzles,C.shuffle)));
  assert.equal(config.activityId,kind);assert.equal(config.settings.puzzles.length,6);
  for(const puzzle of config.settings.puzzles){
   assert.equal(puzzle.entries.length,activity.items.length);
   assert.deepEqual(puzzle.entries.map(e=>e.answer).sort(),activity.items.map(e=>e.answer).sort());
   for(const entry of puzzle.entries){assert.equal(entry.cells.map(c=>puzzle.grid[c.row][c.col]).join(''),entry.word);assert.equal(entry.clue,activity.items.find(i=>i.answer===entry.answer).prompt);}
  }
 });
}
test('long crossword clues stay in their direction columns on one puzzle page',()=>{
 const puzzle={kind:'crossword',entries:Array.from({length:15},(_,i)=>({word:'WORD'+i,number:i+1,direction:i<9?'across':'down',clue:'A lengthy custom clue. '.repeat(12)}))};
 const groups=W.clueGroups(puzzle);
 assert.deepEqual(groups.map(group=>group.title),['Across','Down']);
 assert.deepEqual(groups.flatMap(group=>group.entries),puzzle.entries);
});
test('word search splits its complete word list across two columns',()=>{
 const entries=Array.from({length:13},(_,i)=>({word:'WORD'+i,answer:'Word '+i,clue:'A simple clue.'}));
 const groups=W.clueGroups({kind:'wordsearch',entries},true);
 assert.deepEqual(groups.map(group=>group.title),['Words','Words']);
 assert.deepEqual(groups.map(group=>group.entries.length),[7,6]);
 assert.deepEqual(groups.flatMap(group=>group.entries),entries);
});
test('worksheet controls use snapshots and do not include pupil attempt progress',()=>{
 const config=W.createConfig({...activity,answers:['PUPIL INPUT'],score:99},'crossword',context.window.IGLearningPuzzles);
 assert.ok(!JSON.stringify(config).includes('PUPIL INPUT'));assert.equal(config.settings.score,undefined);
 assert.throws(()=>W.createConfig({items:[]},'crossword',context.window.IGLearningPuzzles));
});
const generic=fs.readFileSync('worksheet-generic.jsx','utf8');
const compiled=Babel.transform(generic.slice(generic.indexOf('  function WordPuzzleGrid('),generic.indexOf('  function WordPuzzlePage('))+'\nwindow.puzzleWorksheetAudit={WordPuzzleGrid};',{presets:['react']}).code;
test('crossword pupils receive empty cells and answer sheets receive the letters',()=>{
 const config=W.createConfig(activity,'crossword',context.window.IGLearningPuzzles);
 const window={location:{href:'http://localhost/worksheetgenerator.html'},MLH:{worksheetExerciseUrl:()=>''},MLHWordPuzzleWorksheet:W};
 vm.runInNewContext(compiled,{React,window,URL,sessionStorage:{getItem:()=>JSON.stringify(config)},document:{title:'',querySelector:()=>({}),body:{classList:{toggle(){}}}}});
 const puzzle=config.settings.puzzles[0],Grid=window.puzzleWorksheetAudit.WordPuzzleGrid;
 const blank=renderToStaticMarkup(React.createElement(Grid,{puzzle,answers:false}));
 const answers=renderToStaticMarkup(React.createElement(Grid,{puzzle,answers:true}));
 assert.ok(!/>[A-Z]<\/text>/.test(blank));assert.ok(/>[A-Z]<\/text>/.test(answers));
 assert.match(blank,/fill="#e0e0e0"/);
 assert.match(answers,/fill="#e0e0e0"/);
 const sample={kind:'crossword',rows:2,cols:2,entries:[],grid:[['A','B'],['C','']]};
 const sampleMarkup=renderToStaticMarkup(React.createElement(Grid,{puzzle:sample,answers:false}));
 const [,edgePath]=sampleMarkup.match(/<path d="([^"]+)" fill="none" stroke="#000" stroke-width="\.8"/);
 const edges=edgePath.split(' M').map(edge=>edge.replace(/^M/,''));
 assert.equal(edges.length,10);
 assert.equal(new Set(edges).size,10);
 assert.ok(edges.includes('24.5 24.5h24'));
 assert.ok(edges.includes('24.5 24.5v24'));
 assert.match(blank,/Puzzle grid/);assert.match(answers,/Completed puzzle/);
});
test('word search answers draw one line per word between its first and last cell',()=>{
 const window={};
 vm.runInNewContext(compiled,{React,window});
 const puzzle=W.createConfig(activity,'wordsearch',context.window.IGLearningPuzzles).settings.puzzles[0];
 const Grid=window.puzzleWorksheetAudit.WordPuzzleGrid;
 const blank=renderToStaticMarkup(React.createElement(Grid,{puzzle,answers:false}));
 const answers=renderToStaticMarkup(React.createElement(Grid,{puzzle,answers:true}));
 assert.doesNotMatch(blank,/<line /);
 assert.equal((answers.match(/<line /g)||[]).length,puzzle.entries.length);
 for(const {cells} of puzzle.entries){
  const first=cells[0],last=cells.at(-1);
  assert.ok(answers.includes(`x1="${first.col*24+12.5}" y1="${first.row*24+12.5}" x2="${last.col*24+12.5}" y2="${last.row*24+12.5}"`));
 }
});
test('crossword Refresh can change the layout even when all answer lengths differ',()=>{
 const unequal={...activity,items:['Piano','Violin','Trumpet','Clarinet','Accordion','Double bass'].map((answer,i)=>({id:String(i),answer,prompt:'Clue '+i}))};
 const config=W.createConfig(unequal,'crossword',context.window.IGLearningPuzzles,items=>items);
 assert.ok(new Set(config.settings.puzzles.map(p=>JSON.stringify(p.grid))).size>1);
});
