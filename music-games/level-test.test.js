const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./core'),L=require('./level-test-core'),D=require('../music-dictionary/music-concepts-data');
const builder=require('../scripts/build-music-games-level-tests.cjs'),all=builder.makeActivities();
const config={limit:'questions',amount:2,feedback:'end',shuffle:false};
function activity(mode='quiz'){return all.find(a=>a.level==='N3'&&a.template===mode);}
test('fifteen special tests cover every level concept exactly once per answer family',()=>{
 assert.equal(all.length,15);
 for(const [code,label]of builder.levels){const entries=builder.entries(code);assert.deepEqual(entries.flatMap(e=>e.ids).sort(),D.concepts.filter(c=>c.level===label&&!require('../scripts/music-games-excluded-concepts.cjs').ids.has(c.id)).map(c=>c.id).sort());const games=all.filter(a=>a.level===code);assert.equal(games.length,3);for(const game of games){assert.equal(game.specialMode,'level-test');assert.equal(game.conceptCount,D.concepts.filter(c=>c.level===label&&!require('../scripts/music-games-excluded-concepts.cjs').ids.has(c.id)).length);assert.equal(game.items.length,entries.length);assert.deepEqual(C.validateActivity(game),[],game.id);assert.equal(game.options.shuffle,true);for(const row of game.items){assert.ok(row.distractors.length>=3);if(game.template==='complete-the-sentence'){const gap=row.clozeGaps[0];assert.equal(row.clozeText.slice(gap.start,gap.end),row.answer);}}}}
});
test('special metadata survives normalization and portable exports only on supported formats',()=>{
 for(const game of all){assert.equal(C.normalize(game).specialMode,'level-test');const imported=C.normalizeImport(C.exportActivity(game))[0];assert.equal(imported.specialMode,'level-test');assert.equal(imported.conceptCount,game.conceptCount);}
 assert.equal(C.makeActivity({template:'wordsearch',specialMode:'level-test',items:[{prompt:'A',answer:'Piano'}]}).specialMode,undefined);
});
test('all three formats score independently with one submission per question',()=>{
 for(const mode of L.modes){let state=L.prepare(activity(mode),config,0,()=>.9);const q=state.queue[0];state=L.submit(state,mode==='type-the-answer'?q.item.correctAnswers.at(-1):q.correctValues||q.expected,5);assert.equal(state.responses.length,1);assert.equal(state.responses[0].correct,true);assert.equal(L.submit(state,'changed',6),state);state=L.next(state,7);assert.equal(state.index,1);state=L.submit(state,state.queue[1].correctValues?[state.queue[1].choices.find(v=>!state.queue[1].correctValues.includes(v)),state.queue[1].correctValues[1]]:'deliberately wrong',8);state=L.next(state,9);assert.equal(state.finished,true);assert.equal(state.result.correct,1);assert.equal(state.result.total,2);assert.equal(state.result.records.length,2);assert.equal(L.next(state,100),state);assert.equal(L.finish(state,100),state);}
});
test('count tests include unanswered questions while timed tests score submitted answers only',()=>{
 let count=L.prepare(activity(),{...config,amount:3},0);count=L.submit(count,count.queue[0].expected,5);count=L.finish(count,10);assert.equal(count.result.correct,1);assert.equal(count.result.total,3);assert.equal(count.result.records.filter(r=>r.unanswered).length,2);
 let timed=L.prepare(activity(),{...config,limit:'time',minutes:.5},100);timed=L.submit(timed,timed.queue[0].expected,200);timed=L.finish(timed,30200);assert.equal(timed.result.correct,1);assert.equal(timed.result.total,1);assert.equal(timed.result.answered,1);assert.equal(timed.result.records.length,1);assert.equal(timed.timedOut,true);assert.equal(timed.elapsed,30000);
});
test('absolute deadlines reject late answers and finish safely with no submitted questions',()=>{
 const initial=L.prepare(activity(),{...config,limit:'time',minutes:.5},100);assert.equal(L.expired(initial,30099),false);const ended=L.submit(initial,initial.queue[0].expected,30100);assert.equal(ended.finished,true);assert.equal(ended.result.total,0);assert.equal(ended.result.correct,0);assert.equal(ended.result.records.length,0);assert.equal(ended.elapsed,30000);assert.equal(L.submit(ended,initial.queue[0].expected,30200),ended);
});
test('randomized plans have no repeats, preserve the source and can be reshuffled on retry',()=>{
 const a=activity(),before=a.items.map(i=>i.id),settings={...config,amount:20,shuffle:true};const one=L.prepare(a,settings,0,()=>0),two=L.prepare(a,settings,0,()=>.999);assert.equal(new Set(one.queue.map(q=>q.item.id)).size,20);assert.notDeepEqual(one.queue.map(q=>q.item.id),two.queue.map(q=>q.item.id));assert.deepEqual(a.items.map(i=>i.id),before);assert.deepEqual(L.prepare(a,{...settings,shuffle:false},0).queue.map(q=>q.item.id),before.slice(0,20));
});
test('invalid limits are rejected and a timed challenge also ends on bank exhaustion',()=>{
 for(const amount of [0,-1,1.5,999,''])assert.throws(()=>L.prepare(activity(),{...config,amount}));for(const minutes of [0,.1,61,NaN])assert.throws(()=>L.prepare(activity(),{limit:'time',minutes}));assert.throws(()=>L.prepare({...activity(),template:'wordsearch'},config));
 const a={...activity(),items:activity().items.slice(0,1)};let state=L.prepare(a,{limit:'time',minutes:1,shuffle:true},0);state=L.submit(state,state.queue[0].expected,5);state=L.next(state,6);assert.equal(state.finished,true);assert.equal(state.timedOut,false);assert.equal(state.result.total,1);
});
test('true-or-false statements are stable, include both outcomes and are marked against the shown statement',()=>{
 const a=activity('true-or-false');const yes=L.prepare(a,config,0,()=>0),no=L.prepare(a,config,0,()=>.99);assert.equal(yes.queue[0].expected,'True');assert.equal(no.queue[0].expected,'False');assert.notEqual(no.queue[0].statement,no.queue[0].item.answer);assert.equal(L.submit(no,'False',1).responses[0].correct,true);
});
test('special tests are indexed in their four existing formats and registered bundles agree',()=>{
 const index=JSON.parse(fs.readFileSync('music-games/activities/index.json','utf8'));for(const a of all){const entry=index.find(e=>e.id===a.id);assert.ok(entry);assert.equal(entry.specialMode,'level-test');let registered;vm.runInNewContext(fs.readFileSync(`music-games/activities/${a.id}.js`,'utf8'),{window:{IGRuntime:{registerActivity:v=>registered=JSON.stringify(v)}}});assert.equal(registered,JSON.stringify(a));}
});
test('every bank completes with a perfect score across shuffled plans and both true/false outcomes',()=>{
 for(const a of all)for(const seed of [0,.21,.49,.51,.99]){
  let state=L.prepare(a,{limit:'questions',amount:a.items.length,shuffle:true,feedback:'end'},0,()=>seed);
  const ids=new Set();
  while(!state.finished){const q=state.queue[state.index];assert.ok(!ids.has(q.item.id));ids.add(q.item.id);
   if(q.mode==='true-or-false')assert.equal(q.expected,q.statement===q.item.answer?'True':'False');
   else if(q.mode==='complete-the-sentence'){assert.equal(q.correctValues.length,2);assert.ok(q.choices.length>=6);assert.equal(new Set(q.choices).size,q.choices.length);for(const value of q.correctValues)assert.ok(q.choices.includes(value));}else if(q.mode!=='type-the-answer'){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices.map(C.canonical)).size,4);assert.equal(q.choices.filter(v=>v===q.expected).length,1);}
   state=L.submit(state,q.correctValues||q.expected,1);state=L.next(state,2);
  }
  assert.equal(state.result.correct,a.items.length,a.id);assert.equal(state.result.total,a.items.length);assert.equal(ids.size,a.items.length);
 }
});

test('true/false review retains the actual concept for answered and unanswered questions',()=>{
 let s=L.prepare(activity('true-or-false'),config,0,()=>.99);s=L.submit(s,'False',1);s=L.finish(s,2);assert.equal(s.result.records[0].concept,s.queue[0].item.answer);assert.equal(s.result.records[1].concept,s.queue[1].item.answer);assert.notEqual(s.result.records[0].concept,s.result.records[0].statement);
});
test('reviewed wording distinguishes work/form, general/specific concepts and avoids fixed wrong-choice sets',()=>{
 const entry=id=>builder.levels.flatMap(([code])=>builder.entries(code)).find(e=>e.conceptId===id);
 assert.match(entry('MC-0223').prompt,/violin with piano/);assert.match(entry('MC-0223').prompt,/rather than the form/);
 assert.match(entry('MC-0226').prompt,/slash/);assert.match(entry('MC-0280').prompt,/two-key form/);
 assert.match(entry('MC-0104').prompt,/Scotch snaps/);
 for(const [code]of builder.levels){const bank=builder.entries(code);assert.ok(new Set(bank.map(e=>e.distractors.join('|'))).size>bank.length/2,code);}
});
test('all eligible Blank concept questions have two separate gaps and six distinct answer tiles',()=>{
 const authored=require('../scripts/music-games-level-quiz-cloze.cjs');const ids=builder.levels.flatMap(([code])=>builder.entries(code).map(e=>e.conceptId)).sort();assert.deepEqual(Object.keys(authored.data).filter(id=>D.concepts.some(c=>c.id===id)&&!require('../scripts/music-games-excluded-concepts.cjs').ids.has(id)).sort(),ids);
 for(const a of all.filter(a=>a.template==='complete-the-sentence'))for(const row of a.items){assert.equal(row.clozeGaps.length,2);assert.ok(!row.clozeText.includes('The term is'));for(const gap of row.clozeGaps)assert.equal(row.clozeText.slice(gap.start,gap.end),gap.text);const values=[...row.clozeGaps.map(g=>g.text),...row.distractors];assert.equal(values.length,6);assert.equal(new Set(values.map(C.canonical)).size,6);}
});
test('Blank submissions require every gap and score the concept only when both placements are correct',()=>{
 const a={...activity('complete-the-sentence'),items:activity('complete-the-sentence').items.slice(0,1)},s=L.prepare(a,{...config,amount:1},0),q=s.queue[0],wrong=q.choices.find(v=>!q.correctValues.includes(v));
 for(const value of ['',q.correctValues[0],[q.correctValues[0]],['',q.correctValues[1]],[q.correctValues[0],q.correctValues[0]],['unlisted tile',q.correctValues[1]]])assert.equal(L.submit(s,value,1),s);
 const partial=L.submit(s,[q.correctValues[0],wrong],1);assert.equal(partial.responses[0].correct,false);assert.deepEqual(partial.responses[0].parts.map(p=>p.correct),[true,false]);assert.equal(L.next(partial,2).result.correct,0);
 const swapped=L.submit(s,q.correctValues.slice().reverse(),1);assert.equal(swapped.responses[0].correct,false);
 const complete=L.submit(s,q.correctValues,1);assert.equal(complete.responses[0].correct,true);assert.equal(L.next(complete,2).result.correct,1);
 const timed=L.prepare(a,{...config,limit:'time',minutes:.5},0);assert.equal(L.submit(timed,q.correctValues,30000).result.answered,0);
});
