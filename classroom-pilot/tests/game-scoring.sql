-- Run against a disposable database after schema.sql. Every fixture rolls back.
begin;
update public.keyboard_pilot_settings set enabled=true where id=true;
do $$
declare
 first_name text;
 second_name text;
 host_view jsonb;
begin
 perform public.keyboard_pilot('create','009062','teacher',
   '{"gameType":"rhythm-time-trial","phase":"lobby","activity":"/rhythmidentification.html?level=N3","raceMinutes":1,"seed":42,"useRandomNames":true}');
 first_name:=public.keyboard_pilot('join','009062','first')->>'myName';
 second_name:=public.keyboard_pilot('join','009062','second')->>'myName';
 perform public.keyboard_pilot('nicknames','009062','teacher','{"allowNicknames":true}');
 perform public.keyboard_pilot('rename','009062','first','{"name":"MusicCat"}');
 perform public.keyboard_pilot('rename','009062','first','{"name":"RhythmCat"}');
 perform public.keyboard_pilot('rename','009062','second','{"name":"BrassCat"}');
 host_view:=public.keyboard_pilot('nicknames','009062','teacher','{"allowNicknames":false}');
 if host_view->>'allowNicknames' is distinct from 'false'
   or not (host_view->'players' @> jsonb_build_array(jsonb_build_object('id','first','name',first_name),
     jsonb_build_object('id','second','name',second_name)))
   or public.keyboard_pilot('read','009062','first')->>'myName' is distinct from first_name
   or public.keyboard_pilot('read','009062','second')->>'myName' is distinct from second_name then
   raise exception 'Disabling nicknames did not restore the assigned names';
 end if;
 perform public.keyboard_pilot('nicknames','009062','teacher','{"allowNicknames":true}');
 if public.keyboard_pilot('read','009062','first')->>'myName' is distinct from first_name then
   raise exception 'Re-enabling nicknames restored a discarded nickname';
 end if;
end $$;
do $$
declare result jsonb; setup jsonb;
begin
 setup:='{"gameType":"quiz","phase":"lobby","level":"N5","index":0,"scoringVersion":2,
   "questions":[{"type":"concept-quiz","score":{"quiz":{"id":"test-quiz"},"audio":{"kind":"file"}}},
    {"type":"concept-quiz","score":{"quiz":{"id":"second-quiz"},"audio":{"kind":"file"}}}],
   "allowedAnswers":[]}';
 perform public.keyboard_pilot('create-concept-quiz','009061','teacher',setup);
 perform public.keyboard_pilot('join','009061','pupil','{"name":"Listener"}');
 result:=public.keyboard_pilot('start','009061','teacher');
 if result->>'phase'<>'listening' or result->>'deadline' is not null then
   raise exception 'Concept Quiz timer started before the excerpt';
 end if;
 result:=public.keyboard_pilot('read','009061','pupil','{"excerptPlayback":{"index":0,"phase":"listening"}}');
 if result->>'playingAudio' is distinct from 'false' then
   raise exception 'Pupils can publish playback status';
 end if;
 perform public.keyboard_pilot('read','009061','teacher','{"excerptPlayback":{"index":0,"phase":"listening"}}');
 result:=public.keyboard_pilot('read','009061','pupil');
 if result->>'playingAudio' is distinct from 'true' or result->>'deadline' is not null then
   raise exception 'Playback status did not reach pupils during listening';
 end if;
 result:=public.keyboard_pilot('audio-ended','009061','teacher','{"index":0}');
 if (result->>'deadline')::bigint-(result->>'startedAt')::bigint<>20000 then
   raise exception 'Concept Quiz answer window changed';
 end if;
 if result->>'playingAudio' is distinct from 'false' then raise exception 'Playback status leaked into answering'; end if;
 perform public.keyboard_pilot('read','009061','teacher','{"excerptPlayback":{"index":0,"phase":"question"}}');
 result:=public.keyboard_pilot('read','009061','pupil');
 if result->>'playingAudio' is distinct from 'true' then raise exception 'Replay status did not reach pupils'; end if;
 perform public.keyboard_pilot('read','009061','teacher','{"excerptPlayback":null}');
 result:=public.keyboard_pilot('read','009061','pupil');
 if result->>'playingAudio' is distinct from 'false' then raise exception 'Stopping replay did not clear the status'; end if;
 result:=public.keyboard_pilot('answer','009061','pupil','{"index":0,"questionId":"test-quiz","response":["a","b"],"fraction":0.5}');
 if result->>'phase'<>'review' or result->>'correct'<>'false' or (result->>'myAnswer')::jsonb<>'["a","b"]'::jsonb
   or (result->'players'->0->>'score')::integer<>50 or result->'breakdown'->2->>'count'<>'1' then
   raise exception 'Concept Quiz partial marks or review regression';
 end if;
 result:=public.keyboard_pilot('read','009061','teacher');
 if result->'players'->0->>'gained' is distinct from '50' then raise exception 'Host refresh lost the points earned'; end if;
 perform public.keyboard_pilot('next','009061','teacher');
 begin
   perform public.keyboard_pilot('skip-excerpt','009061','pupil','{"index":1}');
   raise exception 'Pupil skipped an excerpt';
 exception when raise_exception then
   if sqlerrm<>'Only the teacher can control the game.' then raise; end if;
 end;
 result:=public.keyboard_pilot('skip-excerpt','009061','teacher','{"index":1}');
 if result->>'phase' is distinct from 'review' or result->>'unanswered' is distinct from '1'
    or result->'players'->0->>'gained' is distinct from '0' or result->'players'->0->>'score' is distinct from '50' then
   raise exception 'Skipping the failed excerpt changed scores or opened answering';
 end if;
 result:=public.keyboard_pilot('next','009061','teacher');
 if result->>'phase' is distinct from 'finished' then raise exception 'Skipped excerpt stranded the game'; end if;
end $$;
do $$
declare result jsonb; setup jsonb;
begin
 setup:='{"gameType":"rhythm-time-trial","activity":"/rhythmidentification.html?level=N3",
   "raceMinutes":1,"phase":"lobby","seed":397}';
 perform public.keyboard_pilot('create','000052','teacher',setup);
 perform public.keyboard_pilot('join','000052','one','{"name":"One"}');
 perform public.keyboard_pilot('join','000052','two','{"name":"Two"}');
 result:=public.keyboard_pilot('start','000052','teacher');
 if result->>'phase'<>'playing' or (result->>'deadline')::bigint-(result->>'startedAt')::bigint<>60000 then
  raise exception 'Time Trial started with the wrong deadline';
 end if;
 update public.keyboard_pilot_rooms set state=jsonb_set(state,'{startedAt}',to_jsonb((state->>'startedAt')::bigint-20000)) where pin='000052';
 perform public.keyboard_pilot('grid-finish','000052','one','{"elapsedMs":9000}');
 perform public.keyboard_pilot('grid-finish','000052','two','{"elapsedMs":8000}');
 result:=public.keyboard_pilot('read','000052','teacher');
 if result->>'phase'<>'playing' or result->'players'->0->>'name'<>'Two' then
  raise exception 'Time Trial did not rank the first grids or ended early';
 end if;
 perform public.keyboard_pilot('grid-finish','000052','one','{"elapsedMs":7000}');
 perform public.keyboard_pilot('grid-finish','000052','one','{"elapsedMs":10000}');
 result:=public.keyboard_pilot('read','000052','two');
 if result->'players'->0->>'name'<>'One' or result->'players'->0->>'bestTimeMs'<>'7000' then
  raise exception 'A faster grid did not update both players or a slower retry replaced it';
 end if;
 update public.keyboard_pilot_rooms set state=jsonb_set(state,'{deadline}','0'::jsonb) where pin='000052';
 result:=public.keyboard_pilot('grid-finish','000052','two','{"elapsedMs":1000}');
 if result->>'phase'<>'finished' or result->'players'->0->>'name'<>'One' then
  raise exception 'Time Trial accepted a grid after the deadline';
 end if;
end $$;
do $$
declare result jsonb; deadline bigint; setup jsonb;
begin
 setup:='{"gameType":"quiz","phase":"lobby","level":"N4","index":0,
   "questions":[{"type":"choice","pitch":0,"score":{"audio":{"kind":"notes"}}},{"type":"choice","pitch":0,"score":{"audio":{"kind":"notes"}}}],
   "allowedAnswers":["listening-choice:0"]}';
 perform public.keyboard_pilot('create-listening','000050','teacher',setup);
 perform public.keyboard_pilot('join','000050','pupil','{"name":"Listener"}');
 result:=public.keyboard_pilot('start','000050','teacher');
 if result->>'phase'<>'listening' or result->>'deadline' is not null then raise exception 'Listening started its timer early'; end if;
 begin
  perform public.keyboard_pilot('answer','000050','pupil','{"index":0,"pitch":0,"answer":"listening-choice:0"}');
  raise exception 'Answer accepted during listening';
 exception when others then
  if sqlerrm<>'Answers are closed.' then raise; end if;
 end;
 begin
  perform public.keyboard_pilot('audio-ended','000050','pupil','{"index":0}');
  raise exception 'Pupil opened listening answers';
 exception when others then
  if sqlerrm<>'Only the teacher can control the game.' then raise; end if;
 end;
 result:=public.keyboard_pilot('audio-ended','000050','teacher','{"index":0}');
 deadline:=(result->>'deadline')::bigint;
 if result->>'phase'<>'question' or deadline-(result->>'startedAt')::bigint<>20000 then raise exception 'Listening answer timer regression'; end if;
 result:=public.keyboard_pilot('audio-ended','000050','teacher','{"index":0}');
 if (result->>'deadline')::bigint<>deadline then raise exception 'Duplicate completion restarted the timer'; end if;
 perform public.keyboard_pilot('reveal','000050','teacher');
 result:=public.keyboard_pilot('next','000050','teacher');
 if result->>'phase'<>'listening' or result->>'deadline' is not null then raise exception 'Next excerpt started its timer early'; end if;
 begin
  perform public.keyboard_pilot('audio-ended','000050','teacher','{"index":0}');
  raise exception 'Previous excerpt unlocked the new question';
 exception when others then
  if sqlerrm<>'This question is no longer active.' then raise; end if;
 end;
end $$;
do $$
declare result jsonb; setup jsonb;
begin
 setup:='{"gameType":"quiz","phase":"lobby","level":"H","index":0,"scoringVersion":2,
   "questions":[{"type":"melodic-dictation","response":[2,4,3],"score":{"audio":{"kind":"native-melody"}}}],
   "allowedAnswers":[]}';
 perform public.keyboard_pilot('create-melodic-quiz','000051','teacher',setup);
 perform public.keyboard_pilot('join','000051','one','{"name":"One"}');
 perform public.keyboard_pilot('join','000051','two','{"name":"Two"}');
 result:=public.keyboard_pilot('start','000051','teacher');
 if result->>'phase'<>'listening' or result->>'deadline' is not null then raise exception 'Dictation audio must play first'; end if;
 perform public.keyboard_pilot('audio-ended','000051','teacher','{"index":0}');
 begin
  perform public.keyboard_pilot('answer','000051','one','{"index":0,"notes":[2,4]}');
  raise exception 'Incomplete dictation submission accepted';
 exception when others then
  if sqlerrm<>'Enter the notes for this exercise.' then raise; end if;
 end;
 perform public.keyboard_pilot('answer','000051','one','{"index":0,"notes":[2,4,3]}');
 result:=public.keyboard_pilot('read','000051','one');
 if result->>'phase'<>'question' or result ? 'correct' or (result->>'myAnswer')::jsonb<>'[2,4,3]'::jsonb then raise exception 'Dictation response recovery or privacy regression'; end if;
 result:=public.keyboard_pilot('answer','000051','two','{"index":0,"notes":[2,3,4]}');
 if result->>'phase'<>'review' or result->>'correct'<>'false' then raise exception 'Wrong note order was not marked incorrect'; end if;
 result:=public.keyboard_pilot('read','000051','one');
 if result->>'correct'<>'true' or result->'breakdown'->0->>'count'<>'1' or result->'breakdown'->1->>'count'<>'1' then
  raise exception 'Correct notes or dictation results were not counted';
 end if;
end $$;
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
 -- The native activity and its seed are identical for the whole room.
 perform public.keyboard_pilot('create','000012','sharedhost','{"gameType":"shared","phase":"lobby","activity":"/wordsearch.html?level=N5","seed":4294967295}');
 perform public.keyboard_pilot('join','000012','sharedone','{"name":"One"}');
 perform public.keyboard_pilot('join','000012','sharedtwo','{"name":"Two"}');
 result:=public.keyboard_pilot('start','000012','sharedhost');
 if result->>'phase' is distinct from 'playing' then raise exception 'Shared room did not start'; end if;
 result:=public.keyboard_pilot('read','000012','sharedone');
 if result->>'activity' is distinct from '/wordsearch.html?level=N5' or result->>'seed' is distinct from '4294967295' then
   raise exception 'Shared round lost its activity or puzzle seed';
 end if;
 result:=public.keyboard_pilot('finish','000012','sharedone');
 if result->>'myFinished' is distinct from 'true' then raise exception 'Shared finish did not persist'; end if;
 result:=public.keyboard_pilot('read','000012','sharedtwo');
 if result->>'myFinished' is distinct from 'false' then raise exception 'Shared finish affected another pupil'; end if;
 result:=public.keyboard_pilot('end','000012','sharedhost');
 if result->>'closed' is distinct from 'true' then raise exception 'Shared round did not end'; end if;

 -- New Races use the same question order even when pupils answer differently.
 perform public.keyboard_pilot('create','000013','sequencehost','{"phase":"lobby","gameType":"race","sharedSequence":true,"level":"H","index":0,"allowedAnswers":["key:0","key:12"],"questions":[{"type":"find","pitch":12},{"type":"find","pitch":0},{"type":"find","pitch":12},{"type":"find","pitch":0},{"type":"find","pitch":12}]}');
 perform public.keyboard_pilot('join','000013','raceone','{"name":"One"}');
 perform public.keyboard_pilot('join','000013','racetwo','{"name":"Two"}');
 perform public.keyboard_pilot('start','000013','sequencehost');
 result:=public.keyboard_pilot('read','000013','raceone');
 if result->'question'->>'pitch' is distinct from '12' then raise exception 'Race did not start at shared question one'; end if;
 result:=public.keyboard_pilot('read','000013','racetwo');
 if result->'question'->>'pitch' is distinct from '12' then raise exception 'Race pupil started at a different question'; end if;
 result:=public.keyboard_pilot('answer','000013','raceone','{"answer":"key:12","pitch":12,"index":0}');
 if result->'question'->>'pitch' is distinct from '0' then raise exception 'Race did not advance in order'; end if;
 result:=public.keyboard_pilot('answer','000013','racetwo','{"answer":"key:0","pitch":0,"index":0}');
 if result->'question'->>'pitch' is distinct from '0' then raise exception 'Wrong answer changed the question order'; end if;
 -- The written-note contract uses an exact answer ID instead of pitch class.
 perform public.keyboard_pilot('create','000014','writtenhost','{"phase":"lobby","gameType":"quiz","activity":"written-notes","level":"H","index":0,"scoringVersion":2,"allowedAnswers":["written:C#","written:Db"],"questions":[{"type":"written","pitch":12},{"type":"written","pitch":12},{"type":"written","pitch":12},{"type":"written","pitch":12},{"type":"written","pitch":12}]}');
 perform public.keyboard_pilot('join','000014','writtenone','{"name":"One"}');
 perform public.keyboard_pilot('join','000014','writtentwo','{"name":"Two"}');
 perform public.keyboard_pilot('start','000014','writtenhost');
 perform public.keyboard_pilot('answer','000014','writtenone','{"answer":"written:C#","pitch":12,"index":0}');
 result:=public.keyboard_pilot('answer','000014','writtentwo','{"answer":"written:Db","pitch":0,"index":0}');
 if result->>'correct' is distinct from 'false' or (result->'players'->0->>'score')::integer is distinct from 100 then
   raise exception 'Written-note spelling was not graded exactly';
 end if;
end $$;

do $$
declare first_player jsonb; result jsonb; puzzle record;
begin
 perform public.keyboard_pilot('create','000015','activityhost','{"phase":"lobby","gameType":"activity-race","activity":"/crosswords.html","seed":156}');
 first_player:=public.keyboard_pilot('join','000015','solver','{"name":"Solver"}');
 perform public.keyboard_pilot('join','000015','otherplayer','{"name":"Other"}');
 perform public.keyboard_pilot('start','000015','activityhost');
 result:=public.keyboard_pilot('read','000015','otherplayer');
 if result->>'seed' is distinct from first_player->>'seed' then raise exception 'Activity Race seed differed between pupils'; end if;
 result:=public.keyboard_pilot('finish','000015','otherplayer','{"solved":false}');
 if result->>'winner' is not null or result->>'phase'<>'playing' then raise exception 'An unsuccessful attempt ended the race'; end if;
 result:=public.keyboard_pilot('finish','000015','solver','{"solved":true}');
 if result->>'winner' is distinct from first_player->>'myName' or result->>'phase'<>'finished' then raise exception 'The first solver did not win'; end if;
 result:=public.keyboard_pilot('finish','000015','otherplayer','{"solved":true}');
 if result->>'winner' is distinct from first_player->>'myName' then raise exception 'A late result replaced the winner'; end if;

 for puzzle in select * from (values ('000098','/wordsearch.html#playnote=fixture'),('000099','/crosswords.html#playnote=fixture')) as rooms(pin,activity) loop
   perform public.keyboard_pilot('create',puzzle.pin,'wordhost',jsonb_build_object('phase','lobby','gameType','activity-race','activity',puzzle.activity,'seed',157));
   first_player:=public.keyboard_pilot('join',puzzle.pin,'wordone','{"name":"Finder"}');
   perform public.keyboard_pilot('join',puzzle.pin,'wordtwo','{"name":"Other"}');
   perform public.keyboard_pilot('start',puzzle.pin,'wordhost');
   perform public.keyboard_pilot('finish',puzzle.pin,'wordone','{"wordCount":8,"correct":0}');
   perform public.keyboard_pilot('finish',puzzle.pin,'wordone','{"wordCount":8,"correct":3}');
   perform public.keyboard_pilot('finish',puzzle.pin,'wordone','{"wordCount":8,"correct":2}');
   result:=public.keyboard_pilot('read',puzzle.pin,'wordhost');
   if result->>'targetCorrect' is distinct from '8' or result->>'phase' is distinct from 'playing'
     or result->'players'->0->>'correctCount' is distinct from '3' or result->'players'->1->>'correctCount' is distinct from '0'
   then raise exception 'Word progress was incorrect for %',puzzle.activity; end if;
   result:=public.keyboard_pilot('finish',puzzle.pin,'wordone','{"wordCount":8,"correct":8}');
   if result->>'winner' is distinct from first_player->>'myName' or result->>'phase' is distinct from 'finished'
   then raise exception 'Completing the puzzle did not win for %',puzzle.activity; end if;
 end loop;

 perform public.keyboard_pilot('create','000097','millionhost','{"phase":"lobby","gameType":"activity-race","targetCorrect":15,"activity":"/whowantstobemillionaire/whowantstobeamillionaire.html?level=N3","seed":157}');
 first_player:=public.keyboard_pilot('join','000097','millionsolver','{"name":"Solver"}');
 perform public.keyboard_pilot('join','000097','millionother','{"name":"Other"}');
 perform public.keyboard_pilot('start','000097','millionhost');
 result:=public.keyboard_pilot('finish','000097','millionsolver','{"millionaireAttempt":1,"correct":14}');
 if result->>'phase' is distinct from 'playing' or result->'players'->0->>'correctCount' is distinct from '14' then
   raise exception 'Millionaire progress before the final question ended the race or failed to update';
 end if;
 result:=public.keyboard_pilot('finish','000097','millionsolver','{"millionaireAttempt":2,"correct":0}');
 if result->>'myFinished' is distinct from 'false' or result->'players'->0->>'correctCount' is distinct from '0' then
   raise exception 'Millionaire retry did not reset progress or left the pupil out of the race';
 end if;
 result:=public.keyboard_pilot('finish','000097','millionsolver','{"millionaireAttempt":1,"correct":15}');
 if result->>'phase' is distinct from 'playing' then raise exception 'A stale Millionaire attempt ended the race'; end if;
 result:=public.keyboard_pilot('finish','000097','millionsolver','{"millionaireAttempt":3,"correct":15}');
 if result->>'phase' is distinct from 'finished' or result->>'winner' is distinct from first_player->>'myName' then
   raise exception 'Completing the Millionaire ladder after a retry did not win';
 end if;
 result:=public.keyboard_pilot('finish','000097','millionother','{"millionaireAttempt":1,"correct":15}');
 if result->>'winner' is distinct from first_player->>'myName' then raise exception 'A later millionaire replaced the winner'; end if;

 perform public.keyboard_pilot('create','000016','barhost','{"phase":"lobby","gameType":"activity-race","targetCorrect":10,"activity":"/barlines.html","seed":96}');
 perform public.keyboard_pilot('join','000016','barpupil','{"name":"Pupil"}');
 perform public.keyboard_pilot('start','000016','barhost');
 result:=public.keyboard_pilot('finish','000016','barpupil','{"correct":9}');
 if result->>'phase'<>'playing' or result->'players'->0->>'correctCount'<>'9' then raise exception 'Progress incorrectly finished the race'; end if;
 result:=public.keyboard_pilot('finish','000016','barpupil','{"correct":10}');
 if result->>'winner' is distinct from result->>'myName' then raise exception 'Reaching ten correct did not win'; end if;

 perform public.keyboard_pilot('create','000017','failurehost','{"phase":"lobby","gameType":"activity-race","activity":"/musicescape.html","seed":95,"targetCorrect":6}');
 perform public.keyboard_pilot('join','000017','unsolved','{"name":"Unsolved"}');
 first_player:=public.keyboard_pilot('join','000017','escapeone','{"name":"Escape One"}');
 perform public.keyboard_pilot('join','000017','escapetwo','{"name":"Escape Two"}');
 perform public.keyboard_pilot('start','000017','failurehost');
 result:=public.keyboard_pilot('finish','000017','unsolved','{"correct":2,"solved":false}');
 if result->>'myFinished' is distinct from 'true' or result->>'phase' is distinct from 'playing' or result->>'winner' is not null then
   raise exception 'An Escape Room game over must finish only that pupil’s attempt';
 end if;
 result:=public.keyboard_pilot('finish','000017','escapeone','{"correct":5}');
 if result->>'phase' is distinct from 'playing' then raise exception 'Five rooms cannot win the Escape Room Race'; end if;
 result:=public.keyboard_pilot('finish','000017','escapeone','{"correct":6}');
 if result->>'winner' is distinct from first_player->>'myName' or result->>'phase' is distinct from 'finished' then
   raise exception 'The first pupil to escape six rooms must win';
 end if;
 result:=public.keyboard_pilot('finish','000017','escapetwo','{"correct":6}');
 if result->>'winner' is distinct from first_player->>'myName' then raise exception 'A later escape must not replace the winner'; end if;
end $$;

do $$
declare result jsonb; first_name text; second_name text; setup jsonb;
begin
 setup:='{"phase":"lobby","gameType":"activity-race","activity":"/conceptrecall.html?level=H","seed":75,"targetCorrect":24,"recallMinutes":1}';
 perform public.keyboard_pilot('create','000018','recallhost',setup);
 result:=public.keyboard_pilot('join','000018','recallone','{"name":"Alpha"}');
 first_name:=result->>'myName';
 result:=public.keyboard_pilot('join','000018','recalltwo','{"name":"Bravo"}');
 second_name:=result->>'myName';
 result:=public.keyboard_pilot('start','000018','recallhost');
 if (result->>'deadline')::bigint-(result->>'startedAt')::bigint<>60000 then raise exception 'Wrong Concept Recall deadline'; end if;
 perform public.keyboard_pilot('finish','000018','recallone','{"correct":6}');
 perform public.keyboard_pilot('finish','000018','recallone','{"correct":4}');
 result:=public.keyboard_pilot('finish','000018','recalltwo','{"correct":6}');
 if result->>'phase'<>'playing' or (result->'players'->0->>'correctCount')::int<>6
   or (result->'players'->1->>'correctCount')::int<>6 then
   raise exception 'Concept Recall must keep each pupil’s highest count';
 end if;
 update public.keyboard_pilot_rooms set state=jsonb_set(state,'{deadline}','0') where pin='000018';
 result:=public.keyboard_pilot('finish','000018','recallone','{"correct":8}');
 if result->>'phase'<>'finished' or result->>'finishReason'<>'time'
   or not (result->'winners' ?& array[first_name,second_name])
   or (result->'players'->0->>'correctCount')::int<>6 then
   raise exception 'Deadline must reject late concepts and preserve a tied lead';
 end if;

 perform public.keyboard_pilot('create','000019','recallhost',jsonb_set(setup,'{recallMinutes}','0'));
 perform public.keyboard_pilot('join','000019','recallone','{"name":"Alpha"}');
 result:=public.keyboard_pilot('start','000019','recallhost');
 if result->>'deadline' is not null then raise exception 'Unlimited Concept Recall should have no deadline'; end if;
 result:=public.keyboard_pilot('finish','000019','recallone','{"correct":24}');
 if result->>'phase'<>'finished' or result->>'winner' is distinct from result->>'myName' then
   raise exception 'Completing every concept should win immediately';
 end if;
end $$;

do $$
declare
 setup jsonb;
 result jsonb;
 published_score integer;
begin
 setup:=jsonb_build_object('gameType','quiz','phase','lobby','questionTime',20,'scoringVersion',2,
   'questions',(select jsonb_agg('{"type":"choice","pitch":0}'::jsonb) from generate_series(1,5)),
   'allowedAnswers','["C"]'::jsonb);
 perform public.keyboard_pilot('create','000020','teacher',setup);
 perform public.keyboard_pilot('join','000020','first','{"name":"First"}');
 perform public.keyboard_pilot('join','000020','second','{"name":"Second"}');
 perform public.keyboard_pilot('start','000020','teacher');
 result:=public.keyboard_pilot('answer','000020','first','{"index":0,"answer":"C","pitch":0}');
 if result->>'myScore' is distinct from '0' or result->>'phase' is distinct from 'question' then
   raise exception 'A pupil score revealed an answer before review';
 end if;
 perform public.keyboard_pilot('reveal','000020','teacher');
 result:=public.keyboard_pilot('read','000020','first');
 published_score:=coalesce((result->>'myScore')::integer,0);
 if published_score<=0 or public.keyboard_pilot('read','000020','second')->>'myScore' is distinct from '0'
   or public.keyboard_pilot('read','000020','teacher') ? 'myScore' then
   raise exception 'The published score was missing or reached the wrong player';
 end if;
 perform public.keyboard_pilot('next','000020','teacher');
 result:=public.keyboard_pilot('read','000020','first');
 if (result->>'myScore')::integer is distinct from published_score then
   raise exception 'The score disappeared during the countdown';
 end if;
 update public.keyboard_pilot_rooms
 set state=jsonb_set(state,'{startedAt}',to_jsonb(floor(extract(epoch from clock_timestamp())*1000)::bigint-1))
 where pin='000020';
 result:=public.keyboard_pilot('answer','000020','first','{"index":1,"answer":"C","pitch":0}');
 if (result->>'myScore')::integer is distinct from published_score then
   raise exception 'The next live round revealed its result too early';
 end if;
end $$;

do $$
declare result jsonb;
begin
 perform public.keyboard_pilot('create','000021','teacher',
   '{"gameType":"shared","nativePractice":true,"activity":"/chords.html?level=H","phase":"lobby","seed":42}');
 perform public.keyboard_pilot('join','000021','first','{"name":"First"}');
 perform public.keyboard_pilot('join','000021','second','{"name":"Second"}');
 result:=public.keyboard_pilot('start','000021','teacher');
 if result->>'nativePractice' is distinct from 'true' or result->>'phase' is distinct from 'playing'
   or result->>'activity' is distinct from '/chords.html?level=H' or result ? 'deadline' then
   raise exception 'Hosted Individual Practice did not start with the original page';
 end if;
 result:=public.keyboard_pilot('finish','000021','first','{}');
 if result->>'myFinished' is distinct from 'true' or result->>'phase' is distinct from 'playing'
   or public.keyboard_pilot('read','000021','second')->>'myFinished' is distinct from 'false' then
   raise exception 'Completing Individual Practice interrupted another pupil';
 end if;
end $$;

do $$
declare result jsonb;
begin
 perform public.keyboard_pilot('create','000101','teacher',
   '{"gameType":"activity-race","nativeStreak":true,"targetStreak":3,"raceMinutes":0,"activity":"/barlines.html?level=N3","phase":"lobby","seed":42}');
 perform public.keyboard_pilot('join','000101','first','{"name":"First"}');
 perform public.keyboard_pilot('start','000101','teacher');
 perform public.keyboard_pilot('finish','000101','first','{"attempted":1,"streak":1,"highestStreak":1}');
 perform public.keyboard_pilot('finish','000101','first','{"attempted":2,"streak":0,"highestStreak":1}');
 result:=public.keyboard_pilot('finish','000101','first','{"attempted":1,"streak":1,"highestStreak":1}');
 if result->'players'->0->>'streak' is distinct from '0'
   or result->'players'->0->>'highestStreak' is distinct from '1'
   or result->'players'->0->>'resetFrom' is distinct from '1'
 then raise exception 'A missed question or stale report changed the streak incorrectly'; end if;
 result:=public.keyboard_pilot('finish','000101','first','{"attempted":5,"streak":3,"highestStreak":3}');
 if result->>'phase' is distinct from 'finished' or result->>'winner' is distinct from 'First'
 then raise exception 'The native activity streak did not win the race'; end if;
end $$;

rollback;
