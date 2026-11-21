(function(root){
 'use strict';

 function create(settings, participants){
  const K=root.KeyboardNotes;
  const {gameType,level,options,showC,count,questionTime,targetStreak,raceMinutes}=settings;
  const types=K.normaliseTypes(null,level),generator=K.create();
  const answers=K.classroomAnswers(options,types.find);
  const players=participants.slice(0,4).map(({name,symbol},index)=>({
   id:'test-'+index,name,symbol,score:0,streak:0,highestStreak:0,answered:false,attempt:0,
  }));
  const game={host:true,gameType,options,showC,total:count,targetStreak,players,phase:'lobby',index:0};
  const racing=gameType==='race';
  let question, deadline, startedAt;
  let breakdown=[];

  function beginQuestion(now,delay=0){
   question=generator.next(options,types,level);
   startedAt=now+delay;
   deadline=racing?(raceMinutes?startedAt+raceMinutes*60000:null):startedAt+questionTime*1000;
   game.phase=delay?'countdown':'question';
   breakdown=answers.map(({id:answer})=>({answer,count:0}));
   players.forEach(player=>{player.answered=false;});
  }

  function simulateQuiz(now){
   const correct=answers.find(answer=>K.classroomCorrect(answer,question));
   players.forEach((player,index)=>{
    const elapsed=(index+1)*750;
    if(player.answered||startedAt+elapsed>Math.min(now,deadline))return;
    const isCorrect=(game.index+index)%4!==3;
    const choice=isCorrect?correct:answers.find(answer=>!K.classroomCorrect(answer,question));
    breakdown.find(row=>row.answer===choice.id).count++;
    player.answered=true;
    player.streak=isCorrect?player.streak+1:0;
    if(isCorrect)player.score+=Math.max(50,Math.round(100*(1-elapsed/(2*questionTime*1000))));
   });
   if(now>=deadline||players.every(player=>player.answered))game.phase='review';
  }

  function finishRace(winners,reason){
   game.phase='finished';
   game.winners=winners.map(player=>player.name);
   game.winner=game.winners.join(' and ');
   game.finishReason=reason;
  }

  function simulateRace(now){
   players.forEach((player,index)=>{
    const steps=Math.floor((Math.min(now,deadline??now)-startedAt)/(1100+index*320));
    while(game.phase==='question'&&player.attempt<steps){
     player.attempt++;
     if(index>0&&player.attempt%(8+index)===0){
      player.resetVersion=player.attempt;
      player.resetFrom=player.streak;
      player.streak=0;
     }else{
      player.streak++;
      player.highestStreak=Math.max(player.highestStreak,player.streak);
      if(player.streak>=targetStreak)finishRace([player],'target');
     }
    }
   });
   if(game.phase==='question'&&deadline!==null&&now>=deadline){
    const best=Math.max(...players.map(player=>player.highestStreak));
    finishRace(players.filter(player=>player.highestStreak===best),'time');
   }
  }

  return {
   request(action,extra={}){
    const now=Date.now();
    if(action==='end')return {closed:true};
    if(action==='start'&&game.phase==='lobby'&&players.length)beginQuestion(now);
    if(action==='remove'&&game.phase==='lobby'){
     const index=players.findIndex(player=>player.id===extra.playerId);
     if(index!==-1)players.splice(index,1);
    }
    if(game.phase==='countdown'&&now>=startedAt)game.phase='question';
    if(game.phase==='question'){
     if(racing)simulateRace(now);
     else simulateQuiz(now);
    }
    if(action==='reveal'&&game.phase==='question'&&!racing)game.phase='review';
    if(action==='next'&&game.phase==='review'){
     if(game.index+1===count)game.phase='finished';
     else{
      game.index++;
      beginQuestion(now,3000);
     }
    }
    const showResults=game.phase==='review'||game.phase==='finished';
    const ranking=[...players].sort((a,b)=>(showResults?b.score-a.score:0)||a.name.localeCompare(b.name));
    return {...game,serverTime:now,startedAt,deadline,question,players:ranking.map(player=>({...player})),
     breakdown:showResults?breakdown.map(row=>({...row})):[],
     unanswered:players.filter(player=>!player.answered).length};
   },
  };
 }

 root.MLHClassroomTestGame={create};
})(globalThis);
