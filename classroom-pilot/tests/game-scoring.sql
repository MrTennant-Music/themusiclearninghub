-- Run against a disposable database after schema.sql. Every fixture rolls back.
begin;
update public.keyboard_pilot_settings set enabled=true where id=true;
do $$
declare result jsonb; deadline bigint; started bigint; elapsed bigint; score integer; participant integer; original_name text;
begin
 if public.keyboard_pilot_points(0,20000)<>100 or
    public.keyboard_pilot_points(499,20000)<>100 or
    public.keyboard_pilot_points(500,20000)<>99 or
    public.keyboard_pilot_points(2000,30000)<>97 or
    public.keyboard_pilot_points(10000,20000)<>75 or
    public.keyboard_pilot_points(20000,20000)<>50 then
   raise exception 'Speed scoring formula regression';
 end if;
 result:=public.keyboard_pilot('create','000001','host',jsonb_build_object('phase','lobby','level','N3','questionTime',120,'scoringVersion',2,'index',0,'allowedAnswers',jsonb_build_array('C','D'),'questions',(select jsonb_agg(jsonb_build_object('pitch',0)) from generate_series(1,50))));
 if (result->>'total')::integer<>50 then raise exception '50-question count regression'; end if;
 if (select expires<now()+interval '129 minutes' from public.keyboard_pilot_rooms where pin='000001') then raise exception 'Long game expiry regression'; end if;
 perform public.keyboard_pilot('join','000001','pupil','{"name":"Test"}');
 perform public.keyboard_pilot('join','000001','other','{"name":"Other"}');
 result:=public.keyboard_pilot('start','000001','host');
 started:=(result->>'startedAt')::bigint;deadline:=(result->>'deadline')::bigint;
 if deadline-started<>120000 then raise exception 'Configured timer regression'; end if;
 if result->>'phase'<>'question' then raise exception 'Unanswered question ended early'; end if;
 -- Simulate a correct answer halfway through the server timer.
 update public.keyboard_pilot_rooms set state=state||jsonb_build_object('startedAt',floor(extract(epoch from clock_timestamp())*1000)::bigint-60000,'deadline',floor(extract(epoch from clock_timestamp())*1000)::bigint+60000) where pin='000001';
 result:=public.keyboard_pilot('answer','000001','pupil','{"answer":"C","pitch":0,"index":0}');
 if result->'players'->0->>'score' is not null or result ? 'correct' then raise exception 'Correctness revealed early'; end if;
 result:=public.keyboard_pilot('join','000001','pupil','{}');
 if result->>'myAnswer'<>'C' or result->>'submitted'<>'true' then raise exception 'Quiz answer not restored on rejoin'; end if;
 result:=public.keyboard_pilot('read','000001','other');
 if result->'myAnswer'<>'null'::jsonb or exists(select 1 from jsonb_array_elements(result->'players') where value ? 'answer') then raise exception 'Other pupil answer leaked'; end if;
 begin
  perform public.keyboard_pilot('answer','000001','pupil','{"answer":"C","pitch":0,"index":0}');
  raise exception 'Duplicate answer accepted';
 exception when others then
  if sqlerrm<>'Answer already submitted.' then raise; end if;
 end;
 if result->>'phase'<>'question' then raise exception 'Question ended before everyone answered'; end if;
 result:=public.keyboard_pilot('answer','000001','other','{"answer":"D","pitch":2,"index":0}');
 if result->>'phase'<>'review' or (result->>'deadline')::bigint<>(result->>'serverTime')::bigint then raise exception 'All answers did not end the timer'; end if;
 result:=public.keyboard_pilot('read','000001','host');
 if result->>'phase'<>'review' then raise exception 'Teacher did not receive automatic reveal'; end if;
 score:=(result->'players'->0->>'score')::integer;
 if score not between 74 and 75 then raise exception 'Server-based response score regression: %',score; end if;
 result:=public.keyboard_pilot('next','000001','host');
 if (result->>'deadline')::bigint-(result->>'startedAt')::bigint<>120000 then raise exception 'Next question timer regression'; end if;
 if result->>'phase'<>'countdown' or (result->>'startedAt')::bigint-(result->>'serverTime')::bigint<>3000 then raise exception 'Next-question countdown regression'; end if;
 if (result->'players'->0->>'answered')::boolean then raise exception 'Answer state not reset'; end if;
 result:=public.keyboard_pilot('read','000001','pupil');
 if result->'myAnswer'<>'null'::jsonb then raise exception 'Previous Quiz answer survived next question'; end if;
 if result->>'phase'<>'countdown' then raise exception 'Countdown did not persist across reads'; end if;
 begin
  perform public.keyboard_pilot('answer','000001','pupil','{"answer":"C","pitch":0,"index":1}');
  raise exception 'Answer accepted during countdown';
 exception when others then
  if sqlerrm<>'Answers are closed.' then raise; end if;
 end;
 update public.keyboard_pilot_rooms set state=state||jsonb_build_object('startedAt',floor(extract(epoch from clock_timestamp())*1000)::bigint-1,'deadline',floor(extract(epoch from clock_timestamp())*1000)::bigint+120000) where pin='000001';
 result:=public.keyboard_pilot('read','000001','host');
 if result->>'phase'<>'question' then raise exception 'Countdown did not open next question'; end if;
 perform public.keyboard_pilot('answer','000001','pupil','{"answer":"D","pitch":2,"index":1}');
 result:=public.keyboard_pilot('reveal','000001','host');
 if (result->'players'->0->>'score')::integer<>score then raise exception 'Incorrect answer scored'; end if;
 result:=public.keyboard_pilot('next','000001','host');
 update public.keyboard_pilot_rooms set state=state||jsonb_build_object('startedAt',0,'deadline',0) where pin='000001';
 begin
  perform public.keyboard_pilot('answer','000001','pupil','{"answer":"C","pitch":0,"index":2}');
  raise exception 'Late answer accepted';
 exception when others then
  if sqlerrm<>'Answers are closed.' then raise; end if;
 end;
 -- Existing rooms keep the original fixed-point rules after the migration.
 perform public.keyboard_pilot('create','000002','oldhost',jsonb_build_object('phase','lobby','level','N3','index',0,'allowedAnswers',jsonb_build_array('C'),'questions',(select jsonb_agg(jsonb_build_object('pitch',0)) from generate_series(1,5))));
 perform public.keyboard_pilot('join','000002','oldpupil','{"name":"Legacy"}');
 result:=public.keyboard_pilot('start','000002','oldhost');
 if (result->>'deadline')::bigint-(result->>'startedAt')::bigint<>20000 then raise exception 'Legacy timer regression'; end if;
 perform public.keyboard_pilot('answer','000002','oldpupil','{"answer":"C","pitch":0,"index":0}');
 result:=public.keyboard_pilot('reveal','000002','oldhost');
 if (result->'players'->0->>'score')::integer<>1000 then raise exception 'Legacy scoring changed'; end if;
 -- Breakdown, streaks and rank movements stay hidden until review.
 perform public.keyboard_pilot('create','000003','teacher',jsonb_build_object('phase','lobby','level','N3','questionTime',20,'scoringVersion',2,'index',0,'allowedAnswers',jsonb_build_array('C','D'),'questions',(select jsonb_agg(jsonb_build_object('pitch',0)) from generate_series(1,5))));
 perform public.keyboard_pilot('join','000003','a','{"name":"A"}');
 perform public.keyboard_pilot('join','000003','b','{"name":"B"}');
 perform public.keyboard_pilot('join','000003','c','{"name":"C"}');
 perform public.keyboard_pilot('join','000003','d','{"name":"D"}');
 perform public.keyboard_pilot('start','000003','teacher');
 perform public.keyboard_pilot('answer','000003','d','{"answer":"C","pitch":0,"index":0}');
 result:=public.keyboard_pilot('read','000003','teacher');
 if result ? 'breakdown' or result->'players'->0->>'streak' is not null or result->'players'->0->>'rise' is not null then raise exception 'Results leaked before reveal'; end if;
 perform public.keyboard_pilot('answer','000003','a','{"answer":"D","pitch":2,"index":0}');
 perform public.keyboard_pilot('answer','000003','b','{"answer":"D","pitch":2,"index":0}');
 result:=public.keyboard_pilot('answer','000003','c','{"answer":"D","pitch":2,"index":0}');
 if result->>'phase'<>'review' or result->'breakdown'->0->>'count'<>'1' or result->'breakdown'->1->>'count'<>'3' or result->>'unanswered'<>'0' then raise exception 'Answer counts regression'; end if;
 if result->'players'->0->>'name'<>'D' or result->'players'->0->>'rise'<>'3' or result->'players'->0->>'streak'<>'1' then raise exception 'Leaderboard climb regression'; end if;
 perform public.keyboard_pilot('next','000003','teacher');
 update public.keyboard_pilot_rooms set state=state||jsonb_build_object('startedAt',floor(extract(epoch from clock_timestamp())*1000)::bigint-1) where pin='000003';
 perform public.keyboard_pilot('answer','000003','d','{"answer":"C","pitch":0,"index":1}');
 result:=public.keyboard_pilot('reveal','000003','teacher');
 if result->>'unanswered'<>'3' or result->'players'->0->>'streak'<>'2' then raise exception 'Unanswered counts or streak regression'; end if;
 perform public.keyboard_pilot('next','000003','teacher');
 update public.keyboard_pilot_rooms set state=state||jsonb_build_object('startedAt',floor(extract(epoch from clock_timestamp())*1000)::bigint-1) where pin='000003';
 perform public.keyboard_pilot('answer','000003','d','{"answer":"C","pitch":0,"index":2}');
 result:=public.keyboard_pilot('reveal','000003','teacher');
 if result->'players'->0->>'streak'<>'3' then raise exception 'Three-answer celebration regression'; end if;
 perform public.keyboard_pilot('next','000003','teacher');
 update public.keyboard_pilot_rooms set state=state||jsonb_build_object('startedAt',floor(extract(epoch from clock_timestamp())*1000)::bigint-1) where pin='000003';
 perform public.keyboard_pilot('answer','000003','d','{"answer":"D","pitch":2,"index":3}');
 result:=public.keyboard_pilot('reveal','000003','teacher');
 if result->'players'->0->>'streak'<>'0' then raise exception 'Wrong answer did not reset streak'; end if;
 perform public.keyboard_pilot('next','000003','teacher');
 update public.keyboard_pilot_rooms set state=state||jsonb_build_object('startedAt',floor(extract(epoch from clock_timestamp())*1000)::bigint-1) where pin='000003';
 perform public.keyboard_pilot('answer','000003','a','{"answer":"C","pitch":0,"index":4}');
 perform public.keyboard_pilot('reveal','000003','teacher');
 result:=public.keyboard_pilot('next','000003','teacher');
 if result->>'phase'<>'finished' or result->'players'->0->>'name'<>'D' or jsonb_array_length(result->'players')<>4 or result->'players'->0->>'streak'<>'0' then raise exception 'Final standings regression'; end if;
 -- Capacity is enforced by the locked room, while existing pupils can rejoin.
 perform public.keyboard_pilot('create','000004','capacityhost',jsonb_build_object('phase','lobby','level','N3','index',0,'allowedAnswers',jsonb_build_array('C'),'questions',(select jsonb_agg(jsonb_build_object('pitch',0)) from generate_series(1,5))));
 for participant in 1..20 loop
   result:=public.keyboard_pilot('join','000004','capacity'||participant,jsonb_build_object('name','Pupil '||participant));
 end loop;
 if jsonb_array_length(result->'players')<>20 then raise exception '20 pupils could not join'; end if;
 begin
   perform public.keyboard_pilot('join','000004','extra','{"name":"Extra"}');
   raise exception '21st pupil accepted';
 exception when others then
   if sqlerrm<>'This game is full (maximum 20 pupils).' then raise; end if;
 end;
 result:=public.keyboard_pilot('join','000004','capacity1','{"name":"Pupil 1"}');
 if jsonb_array_length(result->'players')<>20 then raise exception 'Rejoining changed participant count'; end if;
 -- Random names are unique, assigned by the server and stable on rejoining.
 perform public.keyboard_pilot('create','000005','nameshost',jsonb_build_object('phase','lobby','level','N3','useRandomNames',true,'index',0,'allowedAnswers',jsonb_build_array('C'),'questions',(select jsonb_agg(jsonb_build_object('pitch',0)) from generate_series(1,5))));
 result:=public.keyboard_pilot('check','000005','');
 if result->>'useRandomNames'<>'true' or result ? 'players' then raise exception 'Random-name join settings regression'; end if;
 result:=public.keyboard_pilot('join','000005','random1','{"name":"Ignored"}');
 original_name:=result->>'myName';
 if result->>'mySymbol' is null then raise exception 'Musical symbol missing'; end if;
 if original_name is null or original_name='Ignored' then raise exception 'Random name not assigned'; end if;
 for participant in 2..20 loop
   result:=public.keyboard_pilot('join','000005','random'||participant,'{}');
 end loop;
 if (select count(distinct value->>'name') from jsonb_array_elements(result->'players'))<>20 then raise exception 'Random names not unique'; end if;
 if (select count(distinct value->>'symbol') from jsonb_array_elements(result->'players'))<>20 then raise exception 'Musical symbols not unique in a full lobby'; end if;
 result:=public.keyboard_pilot('join','000005','random1','{}');
 if result->>'mySymbol'<>(select value->>'symbol' from keyboard_pilot_rooms cross join jsonb_array_elements(players) where pin='000005' and value->>'name'=original_name) then raise exception 'Musical symbol changed'; end if;
 if result->>'myName'<>original_name then raise exception 'Random name changed on rejoin'; end if;
 begin
   perform public.keyboard_pilot('join','000001','blank','{}');
   raise exception 'Blank name accepted in normal lobby';
 exception when others then
   -- Use an open normal lobby for the nickname validation below.
   if sqlerrm<>'This game has already started.' then raise; end if;
 end;
 result:=public.keyboard_pilot('check','000004','');
 if result->>'useRandomNames'<>'false' then raise exception 'Normal lobby settings regression'; end if;
 perform public.keyboard_pilot('create','000006','normalhost',jsonb_build_object('phase','lobby','level','N3','index',0,'allowedAnswers',jsonb_build_array('C'),'questions',(select jsonb_agg(jsonb_build_object('pitch',0)) from generate_series(1,5))));
 begin
   perform public.keyboard_pilot('join','000006','blank','{}');
   raise exception 'Blank nickname accepted';
 exception when others then
   if sqlerrm<>'Use a nickname of 1–24 characters.' then raise; end if;
 end;
 -- Race pupils answer independently; mistakes reset progress and the first winner closes the race.
 perform public.keyboard_pilot('create','000007','racehost',jsonb_build_object('phase','lobby','gameType','race','targetStreak',3,'level','N3','index',0,'allowedAnswers',jsonb_build_array('C','D'),'questions',(select jsonb_agg(jsonb_build_object('pitch',0)) from generate_series(1,5))));
 perform public.keyboard_pilot('join','000007','racer1','{"name":"Racer One"}');
 perform public.keyboard_pilot('join','000007','racer2','{"name":"Racer Two"}');
 result:=public.keyboard_pilot('start','000007','racehost');
 if result->'question'<>'null'::jsonb or result ? 'questions' then raise exception 'Teacher received private race questions'; end if;
 result:=public.keyboard_pilot('answer','000007','racer1','{"answer":"C","pitch":0,"index":0}');
 if result->>'myStreak'<>'1' or result->>'index'<>'1' or result->>'phase'<>'question' then raise exception 'Independent race progress regression'; end if;
 begin
   perform public.keyboard_pilot('answer','000007','racer1','{"answer":"C","pitch":0,"index":0}');
   raise exception 'Duplicate race answer accepted';
 exception when others then
   if sqlerrm<>'Question has changed.' then raise; end if;
 end;
 result:=public.keyboard_pilot('read','000007','racer2');
 if result->>'index'<>'0' or result->>'myStreak'<>'0' then raise exception 'Other racer advanced'; end if;
 if jsonb_array_length(result->'players')<>1 or result->'players'->0->>'name'<>'Racer Two' then raise exception 'Other racers exposed to pupil'; end if;
 result:=public.keyboard_pilot('answer','000007','racer1','{"answer":"D","pitch":2,"index":1}');
 if result->>'myStreak'<>'0' or result->>'lastCorrect'<>'false' then raise exception 'Race mistake did not reset streak'; end if;
 if (select value->>'highestStreak' from jsonb_array_elements(result->'players') where value->>'name'='Racer One')<>'1' then raise exception 'Race highest streak was lost after a mistake'; end if;
 if (select value->>'resetVersion' from jsonb_array_elements(result->'players') where value->>'name'='Racer One')<>'2' or (select value->>'resetFrom' from jsonb_array_elements(result->'players') where value->>'name'='Racer One')<>'1' then raise exception 'Race reset event lost the previous streak'; end if;
 result:=public.keyboard_pilot('answer','000007','racer1','{"answer":"C","pitch":0,"index":2}');
 if (select value->>'resetVersion' from jsonb_array_elements(result->'players') where value->>'name'='Racer One')<>'2' or (select value->>'resetFrom' from jsonb_array_elements(result->'players') where value->>'name'='Racer One')<>'1' then raise exception 'Quick correct answer hid the reset event'; end if;
 perform public.keyboard_pilot('answer','000007','racer1','{"answer":"C","pitch":0,"index":3}');
 result:=public.keyboard_pilot('answer','000007','racer1','{"answer":"C","pitch":0,"index":4}');
 if result->>'phase'<>'finished' or result->>'winner'<>'Racer One' or result->>'myStreak'<>'3' then raise exception 'Race winner regression'; end if;
 begin
   perform public.keyboard_pilot('answer','000007','racer2','{"answer":"C","pitch":0,"index":0}');
   raise exception 'Race answer accepted after finish';
 exception when others then
   if sqlerrm<>'Answers are closed.' then raise; end if;
 end;
 result:=public.keyboard_pilot('read','000007','racer2');
 if result->>'winner'<>'Racer One' or result->>'phase'<>'finished' then raise exception 'Winner not shared'; end if;
end $$;
do $$
declare result jsonb;
begin
 perform public.keyboard_pilot('create','000008','remove-host',jsonb_build_object('phase','lobby','level','N3','gameType','quiz','index',0,'allowedAnswers',jsonb_build_array('C'),'questions',(select jsonb_agg(jsonb_build_object('pitch',0)) from generate_series(1,5))));
 perform public.keyboard_pilot('join','000008','remove-one','{"name":"Same"}');
 result:=public.keyboard_pilot('join','000008','remove-two','{"name":"Same"}');
 if exists(select 1 from jsonb_array_elements(result->'players') where value->>'id' is not null) then raise exception 'Participant IDs leaked to pupils'; end if;
 begin
  perform public.keyboard_pilot('remove','000008','remove-one','{"playerId":"remove-two"}');
  raise exception 'Pupil removed another participant';
 exception when others then if sqlerrm<>'Only the teacher can control the game.' then raise; end if; end;
 result:=public.keyboard_pilot('read','000008','remove-host');
 if not exists(select 1 from jsonb_array_elements(result->'players') where value->>'id'='remove-one') then raise exception 'Host removal identifier missing'; end if;
 result:=public.keyboard_pilot('remove','000008','remove-host','{"playerId":"remove-one"}');
 if jsonb_array_length(result->'players')<>1 or result->'players'->0->>'id'<>'remove-two' then raise exception 'Wrong participant removed'; end if;
 result:=public.keyboard_pilot('read','000008','remove-one');
 if result->>'removed'<>'true' then raise exception 'Removed participant not notified'; end if;
 perform public.keyboard_pilot('start','000008','remove-host');
 begin
  perform public.keyboard_pilot('remove','000008','remove-host','{"playerId":"remove-two"}');
  raise exception 'Removed participant after game started';
 exception when others then if sqlerrm<>'Participants can only be removed before the game starts.' then raise; end if; end;
end $$;
do $$
declare result jsonb;
begin
 perform public.keyboard_pilot('create','000009','timedhost',jsonb_build_object('phase','lobby','gameType','race','raceMinutes',1,'targetStreak',30,'level','N3','index',0,'allowedAnswers',jsonb_build_array('C','D'),'questions',(select jsonb_agg(jsonb_build_object('pitch',0)) from generate_series(1,5))));
 perform public.keyboard_pilot('join','000009','timedone','{"name":"Best streak"}');
 perform public.keyboard_pilot('join','000009','timedtwo','{"name":"Current leader"}');
 result:=public.keyboard_pilot('start','000009','timedhost');
 if (result->>'deadline')::bigint-(result->>'startedAt')::bigint<>60000 then raise exception 'Race timer duration regression'; end if;
 perform public.keyboard_pilot('answer','000009','timedone','{"answer":"C","pitch":0,"index":0}');
 perform public.keyboard_pilot('answer','000009','timedone','{"answer":"C","pitch":0,"index":1}');
 perform public.keyboard_pilot('answer','000009','timedone','{"answer":"D","pitch":2,"index":2}');
 perform public.keyboard_pilot('answer','000009','timedtwo','{"answer":"C","pitch":0,"index":0}');
 update keyboard_pilot_rooms set state=state||'{"deadline":1}'::jsonb where pin='000009';
 begin
  perform public.keyboard_pilot('answer','000009','timedtwo','{"answer":"C","pitch":0,"index":1}');
  raise exception 'Race answer accepted after timer expired';
 exception when others then if sqlerrm<>'Answers are closed.' then raise; end if; end;
 result:=public.keyboard_pilot('read','000009','timedhost');
 if result->>'phase'<>'finished' or result->>'winner'<>'Best streak' or result->>'finishReason'<>'time' then raise exception 'Timed Race did not use highest achieved streak'; end if;
 update keyboard_pilot_rooms set state=state||'{"phase":"question"}'::jsonb,players=(select jsonb_agg(value||'{"highestStreak":2}'::jsonb) from jsonb_array_elements(players)) where pin='000009';
 result:=public.keyboard_pilot('read','000009','timedtwo');
 if jsonb_array_length(result->'winners')<>2 then raise exception 'Timed Race tie regression'; end if;
 -- Find the Key must distinguish keys of the same pitch class in different octaves.
 perform public.keyboard_pilot('create','000010','quizhost','{"phase":"lobby","level":"H","index":0,"scoringVersion":2,"questionTime":20,"allowedAnswers":["key:0","key:12","key:24"],"questions":[{"type":"find","pitch":12},{"type":"find","pitch":12},{"type":"find","pitch":12},{"type":"find","pitch":12},{"type":"find","pitch":12}]}');
 perform public.keyboard_pilot('join','000010','quizright','{"name":"Right octave"}');
 perform public.keyboard_pilot('join','000010','quizwrong','{"name":"Wrong octave"}');
 perform public.keyboard_pilot('start','000010','quizhost');
 perform public.keyboard_pilot('answer','000010','quizright','{"answer":"key:12","pitch":12,"index":0}');
 result:=public.keyboard_pilot('answer','000010','quizwrong','{"answer":"key:0","pitch":0,"index":0}');
 if result->>'correct' is distinct from 'false' or
    (result->'players'->0->>'score')::integer not between 50 and 100 or
    (result->'players'->1->>'score')::integer is distinct from 0 then
   raise exception 'Find the Key Quiz octave grading failed: %',result;
 end if;
 perform public.keyboard_pilot('create','000011','racehost','{"phase":"lobby","level":"AH","gameType":"race","targetStreak":2,"index":0,"allowedAnswers":["key:0","key:12"],"questions":[{"type":"find","pitch":12},{"type":"find","pitch":0},{"type":"find","pitch":12},{"type":"find","pitch":0},{"type":"find","pitch":12}]}');
 perform public.keyboard_pilot('join','000011','racer','{"name":"Racer"}');
 update public.keyboard_pilot_rooms set players=jsonb_set(players,'{0,questionIndex}','0') where pin='000011';
 perform public.keyboard_pilot('start','000011','racehost');
 result:=public.keyboard_pilot('read','000011','racer');
 if result->'question'->>'pitch' is distinct from '12' then raise exception 'Race did not send written note'; end if;
 result:=public.keyboard_pilot('answer','000011','racer','{"answer":"key:12","pitch":12,"index":0}');
 if result->>'myStreak' is distinct from '1' then raise exception 'Correct key did not advance Race'; end if;
 result:=public.keyboard_pilot('answer','000011','racer','{"answer":"key:12","pitch":12,"index":1}');
 if result->>'myStreak' is distinct from '0' or result->>'lastCorrect' is distinct from 'false' then
   raise exception 'Wrong octave did not reset Race';
 end if;
 result:=public.keyboard_pilot('answer','000011','racer','{"answer":"key:12","pitch":12,"index":2}');
 result:=public.keyboard_pilot('answer','000011','racer','{"answer":"key:0","pitch":0,"index":3}');
 if result->>'winner' is distinct from 'Racer' then raise exception 'Exact keys did not finish Race'; end if;
end $$;

rollback;
