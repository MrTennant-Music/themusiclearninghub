const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../shared/music-games-practice');
test('every launch shuffles the available games while excluding an immediate repeat',()=>{
 const ids=['a','b','c'];let calls=0;
 assert.equal(P.choose(ids,'a',rows=>{calls++;assert.deepEqual(rows,['b','c']);return rows.reverse();}),'c');
 assert.equal(P.choose(ids,'c',rows=>{calls++;return rows;}),'a');
 assert.equal(calls,2);assert.deepEqual(ids,['a','b','c']);
});
test('random selection handles fresh launches, duplicate entries and single-game banks',()=>{
 assert.equal(P.choose(['a','b','a'],null,rows=>rows.reverse()),'b');
 assert.equal(P.choose(['a'],'a',rows=>rows),'a');
 assert.equal(P.choose([],null,rows=>rows),undefined);
});
test('Connections awards streak medals for 2, 4, 6 and 10 complete games',()=>{
 let score={correct:0,attempted:0,gameStreak:0,bestStreak:0};const medals=[];
 for(let game=1;game<=10;game++){score=P.gameResult(score,true);const medal=P.milestone(score.gameStreak);if(medal)medals.push([game,medal]);}
 assert.deepEqual(medals,[[2,'bronze'],[4,'silver'],[6,'gold'],[10,'diamond']]);
 assert.deepEqual(P.streakThresholds,[2,4,6,10]);assert.equal(P.streakTier(1),null);assert.equal(P.streakTier(3),'bronze');assert.equal(P.streakTier(11),'diamond');
 score=P.gameResult(score,false);assert.deepEqual(score,{correct:10,attempted:11,gameStreak:0,bestStreak:10});
 score=P.gameResult(score,true);assert.equal(score.gameStreak,1);assert.equal(score.bestStreak,10);
});
test('Lives uses the shared bottom-up fill with green, amber and red thresholds',()=>{
 for(const [lives,fill,color]of [[4,100,'rgba(22,163,74,.38)'],[3,75,'rgba(22,163,74,.38)'],[2,50,'rgba(255,120,0,.42)'],[1,25,'rgba(220,38,38,.38)'],[0,0,'rgba(220,38,38,.38)']]){
  const display=P.livesDisplay(lives);assert.equal(display.label,'Lives');assert.equal(display.value,lives);assert.equal(display.fillPercent,fill);assert.equal(display.fillColor,color);assert.equal(display.subtitle,'');
 }
 assert.equal(P.livesDisplay(100).value,4);assert.equal(P.livesDisplay(-1).value,0);
 assert.deepEqual([3,2,1,0].map(lives=>P.livesDisplay(lives,3).fillPercent),[100,200/3,100/3,0]);
});
test('a fresh session or Skip resets the game streak while retaining totals and best',()=>{
 const {harness,values}=require('./helpers/hub-progress-harness.cjs');
 const initial={score:{correct:0,attempted:0,gameStreak:0,bestStreak:0}},options={level:'N3',scope:'connections-games-v1'};
 const h=harness('connections.html',new Map(),initial);
 let rendered=h.render(options);rendered.score[1](P.gameResult(initial.score,true));h.render(options);
 const restored=values(harness('connections.html',h.storage,initial).render(options));
 const reset=P.resetStreak(restored.score);assert.equal(reset.gameStreak,0);assert.equal(reset.bestStreak,1);assert.equal(reset.correct,1);assert.equal(reset.attempted,1);
});
