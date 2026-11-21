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
test('long clues continue without losing or duplicating any words',()=>{
 const puzzle={kind:'crossword',entries:Array.from({length:15},(_,i)=>({word:'WORD'+i,number:i+1,direction:i<9?'across':'down',clue:'A lengthy custom clue. '.repeat(12)}))};
 const pages=W.cluePages(puzzle);
 assert.ok(pages.length>1);
 assert.deepEqual(pages.flatMap(page=>page.flatMap(group=>group.entries)).map(e=>e.word),puzzle.entries.map(e=>e.word));
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
 const blocked=puzzle.grid.flat().filter(letter=>!letter).length;
 assert.equal((blank.match(/fill="#000" stroke="#000"/g)||[]).length,blocked);
 assert.equal((answers.match(/fill="#000" stroke="#000"/g)||[]).length,blocked);
 assert.match(blank,/Puzzle grid/);assert.match(answers,/Completed puzzle/);
});
test('crossword Refresh can change the layout even when all answer lengths differ',()=>{
 const unequal={...activity,items:['Piano','Violin','Trumpet','Clarinet','Accordion','Double bass'].map((answer,i)=>({id:String(i),answer,prompt:'Clue '+i}))};
 const config=W.createConfig(unequal,'crossword',context.window.IGLearningPuzzles,items=>items);
 assert.ok(new Set(config.settings.puzzles.map(p=>JSON.stringify(p.grid))).size>1);
});
