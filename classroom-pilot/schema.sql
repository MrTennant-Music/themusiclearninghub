-- Run in a NEW Supabase Free project. No access for public database clients.
create table public.keyboard_pilot_settings (
  id boolean primary key default true check(id), enabled boolean not null default false,
  month date not null default date_trunc('month',now())::date,
  requests integer not null default 0,
  day date not null default current_date, games integer not null default 0
);
insert into public.keyboard_pilot_settings(id) values(true);
create table public.keyboard_pilot_rooms (
  pin text primary key, host_hash text not null, expires timestamptz not null,
  state jsonb not null, players jsonb not null default '[]'
);
alter table public.keyboard_pilot_settings enable row level security;
alter table public.keyboard_pilot_rooms enable row level security;
revoke all on public.keyboard_pilot_settings,public.keyboard_pilot_rooms from anon,authenticated;
-- Kahoot single-answer speed formula; timing is measured by the database.
create or replace function public.keyboard_pilot_points(elapsed_ms bigint,time_limit_ms bigint)
returns integer language sql immutable set search_path=public,pg_temp as $$
 select case when elapsed_ms < 500 then 100
   else greatest(50,least(100,round(100*(1-greatest(0,elapsed_ms)::numeric/(2*greatest(1,time_limit_ms))))::integer)) end;
$$;
revoke all on function public.keyboard_pilot_points(bigint,bigint) from public,anon,authenticated;

create or replace function public.keyboard_pilot(p_action text,p_pin text,p_token text,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 c keyboard_pilot_settings; r keyboard_pilot_rooms; player jsonb; result jsonb;
 i integer; question jsonb; now_ms bigint := floor(extract(epoch from clock_timestamp())*1000);
 is_host boolean; mine text; board jsonb; question_time integer; assigned_name text; assigned_symbol text; is_race boolean; next_question integer; correct_answer boolean;
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
 if p_action='create' then
   if coalesce(p_data->>'gameType','quiz') not in ('quiz','race') then raise exception 'Invalid game type.'; end if;
   if p_data->>'gameType'='race' and coalesce((p_data->>'targetStreak')::integer,30) not between 1 and 100 then raise exception 'Invalid streak target.'; end if;
   if p_data->>'gameType'='race' and coalesce((p_data->>'raceMinutes')::integer,0) not between 0 and 10 then raise exception 'Invalid Race time limit.'; end if;
   question_time:=coalesce((p_data->>'questionTime')::integer,20);
   if question_time not in (5,10,15,20,30,45,60,90,120) then raise exception 'Invalid time per question.'; end if;
   if jsonb_array_length(p_data->'questions') not between 5 and 50 then raise exception 'Invalid question count.'; end if;
   insert into keyboard_pilot_rooms values(p_pin,p_token,now()+make_interval(secs=>case when p_data->>'gameType'='race' then 7200 else greatest(2700,jsonb_array_length(p_data->'questions')*question_time+1800) end),p_data,'[]') returning * into r;
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
   player:=jsonb_build_object('token',p_token,'name',assigned_name,'symbol',assigned_symbol,'score',0,'answer',null,'answered',false,'streak',0,'previousRank',jsonb_array_length(r.players)+1,'attempt',0,'questionIndex',floor(random()*jsonb_array_length(r.state->'questions'))::integer);
   r.players:=r.players||jsonb_build_array(player);
 elsif not is_host and player is null and p_action='read' then return jsonb_build_object('closed',true,'removed',true);
 elsif not is_host and player is null then raise exception 'Join this game first.';
 end if;
 if p_action in ('start','next','reveal','end','remove') and not is_host then raise exception 'Only the teacher can control the game.'; end if;
 if p_action='remove' then
   if r.state->>'phase'<>'lobby' then raise exception 'Participants can only be removed before the game starts.'; end if;
   if not exists(select 1 from jsonb_array_elements(r.players) where value->>'token'=p_data->>'playerId') then raise exception 'Participant not found.'; end if;
   select coalesce(jsonb_agg(value),'[]'::jsonb) into r.players from jsonb_array_elements(r.players) where value->>'token'<>p_data->>'playerId';
 end if;
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
     correct_answer:=(p_data->>'pitch')::integer=(question->>'pitch')::integer%12;
     -- Choose the next private question, avoiding the previous pitch where possible.
     select ordinal::integer-1 into next_question from jsonb_array_elements(r.state->'questions') with ordinality q(value,ordinal) where value->>'pitch'<>question->>'pitch' order by random() limit 1;
     next_question:=coalesce(next_question,((player->>'questionIndex')::integer+1)%jsonb_array_length(r.state->'questions'));
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
   r.state:=r.state||jsonb_build_object('phase','question','index',0,'startedAt',now_ms,'deadline',now_ms+question_time*1000);
 elsif p_action='reveal' then
   if r.state->>'phase'='question' then r.state:=r.state||jsonb_build_object('phase','review'); end if;
 elsif p_action='next' then
   if r.state->>'phase'<>'review' then raise exception 'Reveal answers first.'; end if;
   i:=(r.state->>'index')::int+1;
   if i>=jsonb_array_length(r.state->'questions') then r.state:=r.state||jsonb_build_object('phase','finished');
   else
     r.state:=r.state||jsonb_build_object('phase','countdown','index',i,'startedAt',now_ms+3000,'deadline',now_ms+3000+question_time*1000);
     select coalesce(jsonb_agg(value||jsonb_build_object('answer',null,'answered',false,'previousRank',rank)),'[]') into r.players from (select value,row_number() over(order by (value->>'score')::int desc,value->>'name',value->>'token') rank from jsonb_array_elements(r.players)) ranked;
   end if;
 elsif p_action='end' then
   delete from keyboard_pilot_rooms where pin=p_pin; return jsonb_build_object('closed',true);
 elsif p_action='answer' then
   if is_host or r.state->>'phase'<>'question' or now_ms>(r.state->>'deadline')::bigint then raise exception 'Answers are closed.'; end if;
   if p_data->>'index'<>r.state->>'index' then raise exception 'Question has changed.'; end if;
   if not (r.state->'allowedAnswers' ? (p_data->>'answer')) then raise exception 'Choose a note from this level.'; end if;
   if (player->>'answered')::boolean then raise exception 'Answer already submitted.'; end if;
   question:=r.state->'questions'->((r.state->>'index')::int);
   player:=player||jsonb_build_object('answer',p_data->>'answer','answered',true,'correct',(p_data->>'pitch')::int=(question->>'pitch')::int%12,
     'streak',case when (p_data->>'pitch')::int=(question->>'pitch')::int%12 then coalesce((player->>'streak')::int,0)+1 else 0 end,
     'score',(player->>'score')::int+case when (p_data->>'pitch')::int=(question->>'pitch')::int%12 then case when r.state->>'scoringVersion'='2'
       then public.keyboard_pilot_points(now_ms-coalesce((r.state->>'startedAt')::bigint,(r.state->>'deadline')::bigint-question_time*1000),question_time*1000)
       else 1000 end else 0 end);
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
 end if;
 return result;
end $$;
revoke all on function public.keyboard_pilot(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.keyboard_pilot(text,text,text,jsonb) to service_role;
-- Enable only after the isolated deployment is ready:
-- update public.keyboard_pilot_settings set enabled=true where id=true;
-- Emergency stop (also disables all existing rooms):
-- update public.keyboard_pilot_settings set enabled=false where id=true;
