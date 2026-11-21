/* Choose a fresh random game without requiring browser storage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLHGamePractice=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function choose(ids,previousId,shuffle){
  const available=[...new Set(ids)];
  const alternatives=available.filter(id=>id!==previousId);
  return shuffle(alternatives.length?alternatives:available)[0];
 }
 const streakThresholds=[2,4,6,10],streakTiers=['bronze','silver','gold','diamond'];
 function streakTier(streak){let tier=null;streakThresholds.forEach((threshold,index)=>{if(streak>=threshold)tier=streakTiers[index];});return tier;}
 function gameResult(score,won){const gameStreak=won?score.gameStreak+1:0;return {correct:score.correct+(won?1:0),attempted:score.attempted+1,gameStreak,bestStreak:Math.max(score.bestStreak,gameStreak)};}
 function resetStreak(score){return {...score,gameStreak:0};}
 function milestone(streak){const index=streakThresholds.indexOf(streak);return index<0?null:streakTiers[index];}
 function livesDisplay(lives,maxLives=4){
  const value=Math.max(0,Math.min(maxLives,Math.floor(Number(lives)||0)));
  return {label:'Lives',value,subtitle:'',fillPercent:100*value/maxLives,fillColor:value>=3?'rgba(22,163,74,.38)':value===2?'rgba(255,120,0,.42)':'rgba(220,38,38,.38)'};
 }
 return {choose,gameResult,resetStreak,streakThresholds,streakTier,milestone,livesDisplay};
});
