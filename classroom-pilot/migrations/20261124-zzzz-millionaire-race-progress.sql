-- Record Millionaire Race progress, with a new attempt after each retry.
begin;

create or replace function public.keyboard_pilot_standard(p_action text,p_pin text,p_token text,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 c keyboard_pilot_settings; r keyboard_pilot_rooms; player jsonb; result jsonb;
 i integer; question jsonb; now_ms bigint := floor(extract(epoch from clock_timestamp())*1000);
 is_host boolean; mine text; board jsonb; question_time integer; assigned_name text; assigned_symbol text; is_race boolean; next_question integer; correct_answer boolean; answer_fraction numeric;
begin
 select * into c from keyboard_pilot_settings where id=true for update;
 if not c.enabled then raise exception 'Classroom pilot is switched off.'; end if;
 if c.month<>date_trunc('month',now())::date then c.month:=date_trunc('month',now())::date; c.requests:=0; end if;
 if c.day<>current_date then c.day:=current_date; c.games:=0; end if;
 update keyboard_pilot_settings set month=c.month,requests=c.requests+1,day=c.day,games=c.games where id=true;
 delete from keyboard_pilot_rooms where expires<now();
 if p_action='check' then
   if p_pin ~ '^\d{6}$' then
     select * into r from keyboard_pilot_rooms where pin=p_pin;
     if not found then raise exception 'Game not found or expired.'; end if;
     return jsonb_build_object('available',true,'useRandomNames',coalesce((r.state->>'useRandomNames')::boolean,false));
   end if;
   return jsonb_build_object('available',true);
 end if;
 if p_action='create-listening' then
   if p_data->>'gameType' is distinct from 'quiz' or not exists (
     select 1 from jsonb_array_elements(coalesce(p_data->'questions','[]')) q where q->'score' ? 'audio'
   ) then raise exception 'Invalid listening quiz.'; end if;
   p_action:='create';
 end if;
 if p_action='create-melodic-quiz' then
   if p_data->>'gameType' is distinct from 'quiz' or exists (
     select 1 from jsonb_array_elements(coalesce(p_data->'questions','[]')) q
     where q->>'type' is distinct from 'melodic-dictation' or jsonb_typeof(q->'response') is distinct from 'array'
   ) then raise exception 'Invalid Melodic Dictation quiz.'; end if;
   p_action:='create';
 end if;
 if p_action='create-concept-quiz' then
   if p_data->>'gameType' is distinct from 'quiz' or jsonb_typeof(p_data->'questions') is distinct from 'array'
     or exists (select 1 from jsonb_array_elements(p_data->'questions') q where q->>'type' is distinct from 'concept-quiz')
     then raise exception 'Invalid Concept Quiz.'; end if;
   p_action:='create';
 end if;
 if p_action='create' then
   if coalesce(p_data->>'gameType','quiz') not in ('quiz','race','shared','activity-race','rhythm-time-trial') then raise exception 'Invalid game type.'; end if;
   if p_data->>'gameType' is distinct from 'quiz' and exists (
     select 1 from jsonb_array_elements(coalesce(p_data->'questions','[]')) q where q->'score' ? 'audio'
   ) then raise exception 'Listening activities use Quiz mode.'; end if;
   if p_data->>'gameType'='race' and coalesce((p_data->>'targetStreak')::integer,30) not between 1 and 100 then raise exception 'Invalid streak target.'; end if;
   if p_data->>'gameType'='race' and coalesce((p_data->>'raceMinutes')::integer,0) not between 0 and 10 then raise exception 'Invalid Race time limit.'; end if;
   if p_data->>'gameType'='rhythm-time-trial' and not coalesce(
     p_data->>'raceMinutes' ~ '^([1-9]|10)$' and p_data->>'activity' ~ '^/rhythmidentification[.]html([?#]|$)',false
   ) then raise exception 'Invalid Rhythm Identification Time Trial settings.'; end if;
   if p_data ? 'recallMinutes' and not coalesce(
     p_data->>'gameType'='activity-race' and p_data->>'activity' ~ '^/conceptrecall[.]html([?#]|$)'
     and p_data->>'recallMinutes' ~ '^([0-9]|10)$'
     and p_data->>'targetCorrect' ~ '^([1-9][0-9]{0,2}|1000)$',false
   ) then raise exception 'Invalid Concept Recall settings.'; end if;
   question_time:=coalesce((p_data->>'questionTime')::integer,20);
   if question_time not in (5,10,15,20,30,45,60,90,120) then raise exception 'Invalid time per question.'; end if;
   if coalesce(p_data->>'gameType','quiz') not in ('shared','activity-race','rhythm-time-trial') and
     jsonb_array_length(p_data->'questions') not between (case when exists (
       select 1 from jsonb_array_elements(p_data->'questions') q where q->'score' ? 'audio' or q->>'type'='concept-quiz'
     ) then 1 else 5 end) and 50 then raise exception 'Invalid question count.'; end if;
   insert into keyboard_pilot_rooms values(p_pin,p_token,now()+make_interval(secs=>case when p_data->>'gameType' in ('race','shared','activity-race','rhythm-time-trial') then 7200 else greatest(2700,jsonb_array_length(p_data->'questions')*question_time+1800) end),p_data,'[]') returning * into r;
   update keyboard_pilot_settings set games=games+1 where id=true;
 else
   select * into r from keyboard_pilot_rooms where pin=p_pin for update;
   if not found then raise exception 'Game not found or expired.'; end if;
 end if;
 question_time:=coalesce((r.state->>'questionTime')::integer,20);
 is_race:=r.state->>'gameType'='race';
 if not coalesce(is_race,false) and r.state->>'phase'='countdown' and now_ms>=(r.state->>'startedAt')::bigint then
   r.state:=r.state||jsonb_build_object('phase','question');
 end if;
 is_host:=r.host_hash=p_token;
 select value into player from jsonb_array_elements(r.players) where value->>'token'=p_token;
 if p_action='join' and player is null then
   if r.state->>'phase'<>'lobby' then raise exception 'This game has already started.'; end if;
   if jsonb_array_length(r.players)>=20 then raise exception 'This game is full (maximum 20 pupils).'; end if;
   if coalesce((r.state->>'useRandomNames')::boolean,false) then
     select musical||' '||creature into assigned_name from unnest(array['Allegro','Banjo','Bassoon','Bongo','Cadence','Cello','Crescendo','Disco','Fermata','Fiddle','Forte','Funky','Glockenspiel','Groovy','Harmony','Jazz','Kazoo','Legato','Maraca','Melody','Oboe','Opera','Piano','Piccolo','Pizzicato','Polka','Rhythm','Saxophone','Staccato','Tempo','Timpani','Trombone','Trumpet','Tuba','Ukulele','Vivace','Waltzing','Whistling','Wobbly Waltz','Zippy Zither']) musical cross join unnest(array['Alpaca','Badger','Banana','Biscuit','Bumblebee','Cabbage','Capybara','Cat','Chicken','Crumpet','Dinosaur','Dodo','Dolphin','Doughnut','Duck','Ferret','Flamingo','Fox','Frog','Gecko','Giraffe','Goose','Hamster','Hedgehog','Hippo','Jellybean','Koala','Llama','Lobster','Mango','Meerkat','Monkey','Noodle','Octopus','Otter','Pancake','Panda','Penguin','Pickle','Platypus','Puffin','Quokka','Rabbit','Raccoon','Seal','Sloth','Squirrel','Tiger','Waffle','Wombat']) creature
       where not exists(select 1 from jsonb_array_elements(r.players) where value->>'name'=musical||' '||creature) order by random() limit 1;
   else
     assigned_name:=btrim(coalesce(p_data->>'name',''));
     if length(assigned_name) not between 1 and 24 then raise exception 'Use a nickname of 1–24 characters.'; end if;
   end if;
   -- Choose an unused Bravura symbol while holding the room lock.
   select candidate into assigned_symbol from unnest(array['gClef','fClef','segno','quarterNoteStemUp','eighthNoteStemUp','sixteenthNoteStemUp','wholeNote','halfNoteStemUp','timeSigCommon','flat','natural','sharp','accentAbove','fermataAbove','quarterRest','eighthRest','sixteenthRest','piano','forte','pianissimo','mezzoPiano','mezzoForte','fortissimo','sforzato','slashedGraceNoteStemUp','ottavaAlta','ottavaBassa','repeatLeft','repeatRight']) candidate
     where not exists(select 1 from jsonb_array_elements(r.players) where value->>'symbol'=candidate) order by random() limit 1;
   player:=jsonb_build_object('token',p_token,'name',assigned_name,'symbol',assigned_symbol,'score',0,'answer',null,'answered',false,'streak',0,'previousRank',jsonb_array_length(r.players)+1,'attempt',0,'questionIndex',case when coalesce((r.state->>'sharedSequence')::boolean,false) or r.state->>'gameType' in ('shared','activity-race','rhythm-time-trial') then 0 else floor(random()*jsonb_array_length(r.state->'questions'))::integer end);
   r.players:=r.players||jsonb_build_array(player);
 elsif not is_host and player is null and p_action='read' then return jsonb_build_object('closed',true,'removed',true);
 elsif not is_host and player is null then raise exception 'Join this game first.';
 end if;
 if p_action in ('start','next','reveal','end','remove','audio-ended') and not is_host then raise exception 'Only the teacher can control the game.'; end if;
 if p_action='remove' then
   if r.state->>'phase'<>'lobby' then raise exception 'Participants can only be removed before the game starts.'; end if;
   if not exists(select 1 from jsonb_array_elements(r.players) where value->>'token'=p_data->>'playerId') then raise exception 'Participant not found.'; end if;
   select coalesce(jsonb_agg(value),'[]'::jsonb) into r.players from jsonb_array_elements(r.players) where value->>'token'<>p_data->>'playerId';
 end if;
 if r.state->>'gameType' in ('shared','activity-race','rhythm-time-trial') then
   if r.state->>'gameType'='rhythm-time-trial' and r.state->>'phase'='playing'
     and now_ms>=(r.state->>'deadline')::bigint then
     r.state:=r.state||'{"phase":"finished"}'::jsonb;
   end if;
   if r.state ? 'recallMinutes' and r.state->>'phase'='playing'
     and now_ms>=(r.state->>'deadline')::bigint then
     select coalesce(jsonb_agg(value->>'name' order by value->>'name'),'[]'::jsonb) into board
       from jsonb_array_elements(r.players)
       where (value->>'correctCount')::integer>0 and (value->>'correctCount')::integer=
         (select max((value->>'correctCount')::integer) from jsonb_array_elements(r.players));
     r.state:=r.state||jsonb_build_object('phase','finished','finishReason','time','winners',board);
   end if;
   if p_action='start' then
     if r.state->>'phase'<>'lobby' then raise exception 'Game already started.'; end if;
     if jsonb_array_length(r.players)=0 then raise exception 'Wait for pupils to join.'; end if;
     r.state:=r.state||jsonb_build_object('phase','playing','startedAt',now_ms);
     if r.state->>'gameType'='rhythm-time-trial' then
       r.state:=r.state||jsonb_build_object('deadline',now_ms+(r.state->>'raceMinutes')::integer*60000);
     elsif (r.state->>'recallMinutes')::integer>0 then
       r.state:=r.state||jsonb_build_object('deadline',now_ms+(r.state->>'recallMinutes')::integer*60000);
     end if;
   elsif p_action='end' then
     delete from keyboard_pilot_rooms where pin=p_pin;
     return jsonb_build_object('closed',true);
   elsif p_action='grid-finish' then
     if is_host or r.state->>'gameType'<>'rhythm-time-trial' or r.state->>'phase'='lobby' then
       raise exception 'This round is closed.';
     end if;
     if r.state->>'phase'='playing' then
       if not coalesce(p_data->>'elapsedMs' ~ '^[1-9][0-9]{0,5}$',false) then raise exception 'Invalid grid time.'; end if;
       next_question:=(p_data->>'elapsedMs')::integer;
       if next_question>least(600000,now_ms-(r.state->>'startedAt')::bigint) then raise exception 'Invalid grid time.'; end if;
       -- Keep the minimum so retried submissions never change the result.
       player:=player||jsonb_build_object('bestTimeMs',least((player->>'bestTimeMs')::integer,next_question));
       select jsonb_agg(case when value->>'token'=p_token then player else value end)
         into r.players from jsonb_array_elements(r.players);
     end if;
   elsif p_action='finish' then
     if is_host or r.state->>'phase'='lobby' or r.state->>'gameType'='rhythm-time-trial' then raise exception 'This round is closed.'; end if;
     if r.state->>'phase'='playing' and not coalesce((player->>'finished')::boolean,false) then
       if r.state->>'gameType'='activity-race' then
         if p_data ? 'wordCount' then
           if not coalesce(r.state->>'activity' ~ '^/wordsearch[.]html([?#]|$)'
             and p_data->>'wordCount' ~ '^([1-9]|1[0-5])$'
             and p_data->>'correct' ~ '^(0|[1-9]|1[0-5])$',false) then
             raise exception 'Invalid Word Search progress.';
           end if;
           if (p_data->>'correct')::integer>(p_data->>'wordCount')::integer or
             coalesce(r.state->>'targetCorrect',p_data->>'wordCount')<>p_data->>'wordCount' then
             raise exception 'Invalid Word Search progress.';
           end if;
           r.state:=jsonb_set(r.state,'{targetCorrect}',p_data->'wordCount');
         end if;
         if r.state->>'activity' ~ '^/whowantstobemillionaire/whowantstobeamillionaire[.]html([?#]|$)' then
           if p_data ? 'millionaireAttempt' then
             if not coalesce(p_data->>'millionaireAttempt' ~ '^[1-9][0-9]{0,8}$'
               and p_data->>'correct' ~ '^(0|[1-9]|1[0-5])$',false) then
               raise exception 'Invalid Millionaire progress.';
             end if;
             i:=(p_data->>'millionaireAttempt')::integer;
             if i>=coalesce((player->>'millionaireAttempt')::integer,0) then
               next_question:=(p_data->>'correct')::integer;
               if i=(player->>'millionaireAttempt')::integer then
                 next_question:=greatest(next_question,coalesce((player->>'correctCount')::integer,0));
               end if;
               correct_answer:=next_question=15;
               player:=player||jsonb_build_object('millionaireAttempt',i,'correctCount',next_question,'finished',correct_answer);
               r.state:=jsonb_set(r.state,'{targetCorrect}','15');
             end if;
           end if;
         elsif r.state->>'targetCorrect' is not null then
           next_question:=greatest(coalesce((player->>'correctCount')::integer,0),least((r.state->>'targetCorrect')::integer,coalesce((p_data->>'correct')::integer,0)));
           correct_answer:=next_question>=(r.state->>'targetCorrect')::integer;
           player:=player||jsonb_build_object('correctCount',next_question,'finished',correct_answer);
         else
           correct_answer:=coalesce((p_data->>'solved')::boolean,false);
           if p_data ? 'solved' then player:=player||jsonb_build_object('finished',true,'solved',correct_answer); end if;
         end if;
         if correct_answer then r.state:=r.state||jsonb_build_object('phase','finished','winner',player->>'name'); end if;
       else
         player:=player||'{"finished":true}'::jsonb;
       end if;
       select jsonb_agg(case when value->>'token'=p_token then player else value end) into r.players from jsonb_array_elements(r.players);
       if r.state->>'gameType'='activity-race'
         and not exists (select 1 from jsonb_array_elements(r.players) where not coalesce((value->>'finished')::boolean,false)) then
         r.state:=r.state||jsonb_build_object('phase','finished');
       end if;
     end if;
   elsif p_action not in ('create','join','read','remove') then
     raise exception 'This activity is played on the activity screen.';
   end if;
   update keyboard_pilot_rooms set state=r.state,players=r.players where pin=p_pin;
   select coalesce(jsonb_agg(jsonb_build_object('id',case when is_host then value->>'token' else null end,
     'name',value->>'name','symbol',value->>'symbol','finished',coalesce((value->>'finished')::boolean,false),
     'solved',value->'solved','correctCount',coalesce((value->>'correctCount')::integer,0))
     || case when r.state->>'gameType'='rhythm-time-trial' then jsonb_build_object('bestTimeMs',value->'bestTimeMs') else '{}'::jsonb end
     order by (value->>'bestTimeMs')::integer nulls last,coalesce((value->>'correctCount')::integer,0) desc,value->>'name'),'[]')
     into board from jsonb_array_elements(r.players);
   return r.state||jsonb_build_object('pin',r.pin,'host',is_host,'players',board,'serverTime',now_ms,
     'myName',player->>'name','mySymbol',player->>'symbol','myFinished',coalesce((player->>'finished')::boolean,false));
 end if;
 if p_action='finish' then raise exception 'Use the game controls for this room.'; end if;
 if is_race then
   if r.state->>'phase'='question' and r.state->>'deadline' is not null and now_ms>=(r.state->>'deadline')::bigint then
     select jsonb_agg(value->>'name' order by value->>'name') into board
       from jsonb_array_elements(r.players)
       where greatest(coalesce((value->>'highestStreak')::integer,0),coalesce((value->>'streak')::integer,0))=
         (select max(greatest(coalesce((value->>'highestStreak')::integer,0),coalesce((value->>'streak')::integer,0))) from jsonb_array_elements(r.players));
     r.state:=r.state||jsonb_build_object('phase','finished','finishReason','time','winners',board,'winner',(select string_agg(value #>> '{}',' and ') from jsonb_array_elements(board)));
   end if;
   if p_action='start' then
     if r.state->>'phase'<>'lobby' then raise exception 'Game already started.'; end if;
     if jsonb_array_length(r.players)=0 then raise exception 'Wait for pupils to join.'; end if;
     r.state:=r.state||jsonb_build_object('phase','question','startedAt',now_ms,'deadline',case when coalesce((r.state->>'raceMinutes')::integer,0)>0 then now_ms+(r.state->>'raceMinutes')::bigint*60000 else null end);
   elsif p_action in ('next','reveal') then raise exception 'Race questions advance automatically.';
   elsif p_action='end' then
     delete from keyboard_pilot_rooms where pin=p_pin; return jsonb_build_object('closed',true);
   elsif p_action='answer' then
     if is_host or r.state->>'phase'<>'question' then raise exception 'Answers are closed.'; end if;
     if (p_data->>'index')::integer<>coalesce((player->>'attempt')::integer,0) then raise exception 'Question has changed.'; end if;
     if not (r.state->'allowedAnswers' ? (p_data->>'answer')) then raise exception 'Choose a note from this level.'; end if;
     question:=r.state->'questions'->((player->>'questionIndex')::integer);
     correct_answer:=(p_data->>'pitch')::int=case when question->>'type' in ('find','written') then (question->>'pitch')::int else (question->>'pitch')::int%12 end;
     -- Choose the next private question, avoiding the previous pitch where possible.
     if coalesce((r.state->>'sharedSequence')::boolean,false) then
       next_question:=((player->>'questionIndex')::integer+1)%jsonb_array_length(r.state->'questions');
     else
       select ordinal::integer-1 into next_question from jsonb_array_elements(r.state->'questions') with ordinality q(value,ordinal) where value->>'pitch'<>question->>'pitch' order by random() limit 1;
       next_question:=coalesce(next_question,((player->>'questionIndex')::integer+1)%jsonb_array_length(r.state->'questions'));
     end if;
     player:=player||jsonb_build_object('streak',case when correct_answer then (player->>'streak')::integer+1 else 0 end,
       'highestStreak',greatest(coalesce((player->>'highestStreak')::integer,(player->>'streak')::integer,0),case when correct_answer then (player->>'streak')::integer+1 else (player->>'streak')::integer end),
       'attempt',(player->>'attempt')::integer+1,'questionIndex',next_question,'lastCorrect',correct_answer,
       'resetVersion',case when correct_answer then coalesce((player->>'resetVersion')::integer,0) else (player->>'attempt')::integer+1 end,
       'resetFrom',case when correct_answer then coalesce((player->>'resetFrom')::integer,0) else (player->>'streak')::integer end);
     select jsonb_agg(case when value->>'token'=p_token then player else value end) into r.players from jsonb_array_elements(r.players);
     if (player->>'streak')::integer>=coalesce((r.state->>'targetStreak')::integer,30) then
       r.state:=r.state||jsonb_build_object('phase','finished','winner',player->>'name');
     end if;
   end if;
   update keyboard_pilot_rooms set state=r.state,players=r.players where pin=p_pin;
   select coalesce(jsonb_agg(jsonb_build_object('id',case when is_host then value->>'token' else null end,'name',value->>'name','symbol',value->>'symbol','streak',value->'streak','highestStreak',greatest(coalesce((value->>'highestStreak')::integer,0),coalesce((value->>'streak')::integer,0)),'resetVersion',coalesce((value->>'resetVersion')::integer,0),'resetFrom',coalesce((value->>'resetFrom')::integer,0)) order by (value->>'streak')::integer desc,value->>'name',value->>'token'),'[]') into board from jsonb_array_elements(r.players) where is_host or value->>'token'=p_token;
   return (r.state-'questions'-'allowedAnswers')||jsonb_build_object('pin',r.pin,'host',is_host,'players',board,'serverTime',now_ms,'myName',player->>'name','mySymbol',player->>'symbol',
     'index',coalesce((player->>'attempt')::integer,0),'myStreak',coalesce((player->>'streak')::integer,0),'lastCorrect',player->'lastCorrect',
     'question',case when not is_host and r.state->>'phase'='question' then r.state->'questions'->((player->>'questionIndex')::integer) else null end);
 end if;
 if p_action='start' then
   if r.state->>'phase'<>'lobby' then raise exception 'Game already started.'; end if;
   select jsonb_agg(value||jsonb_build_object('previousRank',rank)) into r.players from (select value,row_number() over(order by (value->>'score')::int desc,value->>'name',value->>'token') rank from jsonb_array_elements(r.players)) ranked;
   question:=r.state->'questions'->0;
   if question->'score' ? 'audio' then
     r.state:=r.state||jsonb_build_object('phase','listening','index',0,'startedAt',null,'deadline',null);
   else
     r.state:=r.state||jsonb_build_object('phase','question','index',0,'startedAt',now_ms,'deadline',now_ms+question_time*1000);
   end if;
 elsif p_action='audio-ended' then
   question:=r.state->'questions'->((r.state->>'index')::integer);
   if (p_data->>'index') is distinct from (r.state->>'index') or not coalesce(question->'score' ? 'audio',false) then
     raise exception 'This question is no longer active.';
   end if;
   if r.state->>'phase'='listening' then
     r.state:=r.state||jsonb_build_object('phase','question','startedAt',now_ms,'deadline',now_ms+question_time*1000);
   end if;
 elsif p_action='reveal' then
   if r.state->>'phase'='question' then r.state:=r.state||jsonb_build_object('phase','review'); end if;
 elsif p_action='next' then
   if r.state->>'phase'<>'review' then raise exception 'Reveal answers first.'; end if;
   i:=(r.state->>'index')::int+1;
   if i>=jsonb_array_length(r.state->'questions') then r.state:=r.state||jsonb_build_object('phase','finished');
   else
     question:=r.state->'questions'->i;
     if question->'score' ? 'audio' then
       r.state:=r.state||jsonb_build_object('phase','listening','index',i,'startedAt',null,'deadline',null);
     else
       r.state:=r.state||jsonb_build_object('phase','countdown','index',i,'startedAt',now_ms+3000,'deadline',now_ms+3000+question_time*1000);
     end if;
     select coalesce(jsonb_agg(value||jsonb_build_object('answer',null,'answered',false,'previousRank',rank)),'[]') into r.players from (select value,row_number() over(order by (value->>'score')::int desc,value->>'name',value->>'token') rank from jsonb_array_elements(r.players)) ranked;
   end if;
 elsif p_action='end' then
   delete from keyboard_pilot_rooms where pin=p_pin; return jsonb_build_object('closed',true);
 elsif p_action='answer' then
   if is_host or r.state->>'phase'<>'question' or now_ms>(r.state->>'deadline')::bigint then raise exception 'Answers are closed.'; end if;
   if p_data->>'index'<>r.state->>'index' then raise exception 'Question has changed.'; end if;
   if (player->>'answered')::boolean then raise exception 'Answer already submitted.'; end if;
   question:=r.state->'questions'->((r.state->>'index')::int);
   if question->>'type'='concept-quiz' then
     if p_data->>'questionId' is distinct from question->'score'->'quiz'->>'id' then raise exception 'Question has changed.'; end if;
     if coalesce(jsonb_typeof(p_data->'response'),'null') not in ('string','array')
       or jsonb_typeof(p_data->'fraction') is distinct from 'number'
       or (p_data->>'fraction')::numeric not between 0 and 1 then raise exception 'Enter an answer for this question.'; end if;
     mine:=(p_data->'response')::text;
     answer_fraction:=(p_data->>'fraction')::numeric;
     correct_answer:=answer_fraction=1;
   elsif question->>'type'='melodic-dictation' then
     if jsonb_typeof(p_data->'notes') is distinct from 'array' then raise exception 'Enter the notes for this exercise.'; end if;
     if jsonb_array_length(p_data->'notes')<>jsonb_array_length(question->'response')
       or exists (select 1 from jsonb_array_elements(p_data->'notes') n where jsonb_typeof(n)<>'number')
       then raise exception 'Enter the notes for this exercise.'; end if;
     mine:=p_data->>'notes';
     correct_answer:=p_data->'notes'=question->'response';
   else
     if p_data->>'answer' is null or not (r.state->'allowedAnswers' ? (p_data->>'answer')) then raise exception 'Choose a note from this level.'; end if;
     mine:=p_data->>'answer';
     correct_answer:=(p_data->>'pitch')::int=case when question->>'type' in ('find','written') then (question->>'pitch')::int else (question->>'pitch')::int%12 end;
   end if;
   answer_fraction:=coalesce(answer_fraction,case when correct_answer then 1 else 0 end);
   player:=player||jsonb_build_object('answer',mine,'answered',true,'correct',correct_answer,'fraction',answer_fraction,
     'streak',case when correct_answer then coalesce((player->>'streak')::int,0)+1 else 0 end,
     'score',(player->>'score')::int+round(answer_fraction*case when r.state->>'scoringVersion'='2'
       then public.keyboard_pilot_points(now_ms-coalesce((r.state->>'startedAt')::bigint,(r.state->>'deadline')::bigint-question_time*1000),question_time*1000)
       else 1000 end)::int);
   select jsonb_agg(case when value->>'token'=p_token then player else value end) into r.players from jsonb_array_elements(r.players);
 end if;
 -- Complete the question atomically as soon as every joined pupil has answered.
 if r.state->>'phase'='question' and jsonb_array_length(r.players)>0
    and not exists (select 1 from jsonb_array_elements(r.players) where not coalesce((value->>'answered')::boolean,false)) then
   r.state:=r.state||jsonb_build_object('phase','review','deadline',now_ms);
 elsif r.state->>'phase'='question' and now_ms>(r.state->>'deadline')::bigint then
   r.state:=r.state||jsonb_build_object('phase','review');
 end if;
 if r.state->>'phase' in ('review','finished') then
   select coalesce(jsonb_agg(case when coalesce((value->>'answered')::boolean,false) then value else value||jsonb_build_object('streak',0) end),'[]') into r.players from jsonb_array_elements(r.players);
 end if;
 update keyboard_pilot_rooms set state=r.state,players=r.players where pin=p_pin;
 select coalesce(jsonb_agg(jsonb_build_object('id',case when is_host then value->>'token' else null end,'name',value->>'name','symbol',value->>'symbol','score',case when r.state->>'phase' in ('review','finished') then value->'score' else null end,'answered',value->'answered',
   'streak',case when r.state->>'phase' in ('review','finished') then coalesce((value->>'streak')::int,0) else null end,
   'rise',case when r.state->>'phase' in ('review','finished') then greatest(0,coalesce((value->>'previousRank')::int,rank::int)-rank::int) else null end) order by rank),'[]') into board
 from (select value,row_number() over(order by case when r.state->>'phase' in ('review','finished') then (value->>'score')::int else 0 end desc,value->>'name',value->>'token') rank from jsonb_array_elements(r.players)) ranked;
 -- No tokens, future questions or correctness are sent before reveal.
 result:=(r.state-'questions'-'allowedAnswers')||jsonb_build_object('pin',r.pin,'host',is_host,'players',board,'total',jsonb_array_length(r.state->'questions'),'serverTime',now_ms,
   'question',case when r.state->>'phase'='lobby' then null else r.state->'questions'->((r.state->>'index')::int) end,
   'submitted',coalesce((player->>'answered')::boolean,false),'myAnswer',player->'answer','myName',player->>'name','mySymbol',player->>'symbol');
 if r.state->>'phase' in ('review','finished') then
   result:=result||jsonb_build_object('correct',player->'correct','unanswered',(select count(*) from jsonb_array_elements(r.players) where not coalesce((value->>'answered')::boolean,false)),
     'breakdown',(select coalesce(jsonb_agg(jsonb_build_object('answer',answer,'count',(select count(*) from jsonb_array_elements(r.players) where value->>'answer'=answer))),'[]') from jsonb_array_elements_text(r.state->'allowedAnswers') answer));
   if result->'question'->>'type' in ('melodic-dictation','concept-quiz') then
     select jsonb_build_array(
       jsonb_build_object('answer','correct','count',count(*) filter (where value->>'answered'='true' and value->>'correct'='true')),
       jsonb_build_object('answer','incorrect','count',count(*) filter (where value->>'answered'='true' and value->>'correct'='false' and coalesce((value->>'fraction')::numeric,0)=0)),
       jsonb_build_object('answer','partial','count',count(*) filter (where value->>'answered'='true' and (value->>'fraction')::numeric>0 and value->>'correct'='false'))
     ) into board from jsonb_array_elements(r.players);
     result:=result||jsonb_build_object('breakdown',board);
   end if;
 end if;
 return result;
end $$;

revoke all on function public.keyboard_pilot_standard(text,text,text,jsonb) from public,anon,authenticated,service_role;

commit;
