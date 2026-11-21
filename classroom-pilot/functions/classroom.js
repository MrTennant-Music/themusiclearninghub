'use strict';
const crypto=require('node:crypto');
const K=require('../../keyboard-notes.js');
const validAnswers=[
 ...K.classroomAnswers(K.defaults.H,true),
 ...K.answers({naturals:true,sharps:true,flats:true,enharmonics:true}),
];
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const reply=(statusCode,value)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(value)});
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return reply(405,{error:'Use POST.'});
 if(process.env.CLASSROOM_ENABLED!=='true')return reply(503,{error:'Classroom pilot is switched off. Individual practice is still available.'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return reply(503,{error:'Classroom pilot has not been configured.'});
 if(event.body?.length>4096)return reply(413,{error:'Request too large.'});
 try{
  const input=JSON.parse(event.body||'{}'),action=input.action;
  if(!['check','create','join','read','start','answer','reveal','next','end','remove'].includes(action))return reply(400,{error:'Unknown action.'});
  let pin=String(input.pin||''),token=String(input.token||''),data={};
  if(action!=='check'&&action!=='create'&&!/^\d{6}$/.test(pin))return reply(400,{error:'Enter a six-digit game PIN.'});
  if(action==='create'){
   const settings=K.classroomSettings({level:input.level,options:input.options||K.defaults[input.level],showC:input.showC});
   if(!settings)return reply(400,{error:'Return to individual practice and choose valid game settings.'});
   const {level,options,showC}=settings;
   const gameType=input.gameType??'quiz',targetStreak=Number(input.targetStreak??30),raceMinutes=Number(input.raceMinutes??0);
   if(!['quiz','race'].includes(gameType))return reply(400,{error:'Choose Quiz or Race.'});
   if(gameType==='race'&&(!Number.isInteger(targetStreak)||targetStreak<1||targetStreak>100))return reply(400,{error:'Choose a streak target from 1 to 100.'});
   if(gameType==='race'&&(!Number.isInteger(raceMinutes)||raceMinutes<0||raceMinutes>10))return reply(400,{error:'Choose Unlimited or 1–10 minutes.'});
   const count=gameType==='race'?50:Number(input.count??20),questionTime=Number(input.questionTime??10);
   if(!Number.isInteger(count)||count<5||count>50||count%5!==0)return reply(400,{error:'Choose 5–50 questions in steps of 5.'});
   if(![5,10,15,20,30,45,60,90,120].includes(questionTime))return reply(400,{error:'Choose an available time per question.'});
   const types=K.normaliseTypes(null,level),generator=K.create();
   const questions=Array.from({length:count},()=>generator.next(options,types,level));
   pin=String(crypto.randomInt(100000,1000000));token=crypto.randomBytes(32).toString('hex');
   data={gameType,targetStreak,raceMinutes,phase:'lobby',level,options,showC,questionTime,useRandomNames:true,scoringVersion:2,questions,allowedAnswers:K.classroomAnswers(options,types.find).map(a=>a.id),index:0};
  }else if(action!=='check'){
   if(!/^[a-f0-9]{64}$/.test(token))return reply(400,{error:'Please rejoin this game.'});
   if(action==='join'){const name=String(input.name||'').trim();if(name.length>24)return reply(400,{error:'Use a nickname of 1–24 characters.'});data={name};}
   if(action==='remove'){
    if(!/^[a-f0-9]{64}$/.test(String(input.playerId||'')))return reply(400,{error:'Choose a participant to remove.'});
    data={playerId:input.playerId};
   }
   if(action==='answer'){
    // Validate the submitted note; grading happens inside the atomic database transaction.
    const answer=validAnswers.find(a=>a.id===input.answer);
    if(!answer||!Number.isInteger(input.index))return reply(400,{error:'Choose a valid note.'});
    data={answer:answer.id,pitch:answer.pitch,index:input.index};
   }
  }
  const response=await fetch(process.env.SUPABASE_URL+'/rest/v1/rpc/keyboard_pilot',{method:'POST',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_pin:pin,p_token:hash(token),p_data:data}),signal:AbortSignal.timeout(8000)});
  const result=await response.json();
  if(!response.ok)return reply(400,{error:result.code==='23505'?'Please try creating the game again.':result.code==='P0001'?result.message:'Classroom service unavailable. Use individual practice.'});
  return reply(200,action==='create'?{...result,token}:result);
 }catch{return reply(503,{error:'Cannot connect to the classroom service. Use individual practice or retry.'});}
};
