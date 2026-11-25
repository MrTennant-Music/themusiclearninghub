-- Keep Dominoes and Concept Sort open for repeat attempts until the round deadline.
begin;

alter function public.keyboard_pilot_standard(text,text,text,jsonb) rename to keyboard_pilot_standard_before_timed_races;

create function public.keyboard_pilot_standard(p_action text,p_pin text,p_token text,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 room keyboard_pilot_rooms;
 result jsonb;
 attempt jsonb:=p_data->'retryAttempt';
 rankings jsonb;
 winners jsonb;
 now_ms bigint;
 retry_room boolean;
 score integer;
 total integer;
 elapsed integer;
begin
 if p_action='create' and p_data ? 'retryRaceMinutes' then
   if not coalesce(p_data->>'gameType'='activity-race'
     and p_data->>'activity' ~ '^/(dominoes|conceptsort)[.]html([?#]|$)'
     and p_data->>'retryRaceMinutes' ~ '^([1-9]|10)$',false) then
     raise exception 'Invalid timed race setup.';
   end if;
 end if;
 if p_action in ('start','read','finish') then
   select state ? 'retryRaceMinutes' into retry_room from keyboard_pilot_rooms where pin=p_pin;
 end if;
 if not coalesce(retry_room,false) then
   if attempt is not null then raise exception 'This room does not accept timed race attempts.'; end if;
   return public.keyboard_pilot_standard_before_timed_races(p_action,p_pin,p_token,p_data);
 end if;

 -- The standard function authenticates the caller and takes the usual locks.
 -- A timed submission leaves the pupil eligible to play again.
 result:=public.keyboard_pilot_standard_before_timed_races(
   case when p_action='finish' then 'read' else p_action end,p_pin,p_token,p_data);
 if result->>'closed'='true' then return result; end if;
 select * into room from keyboard_pilot_rooms where pin=p_pin for update;
 now_ms:=floor(extract(epoch from clock_timestamp())*1000);

 if p_action='start' then
   room.state:=room.state||jsonb_build_object('deadline',
     (room.state->>'startedAt')::bigint+(room.state->>'retryRaceMinutes')::integer*60000);
 end if;
 if p_action='finish' and (result->>'host'='true' or room.state->>'phase'='lobby') then
   raise exception 'This round is closed.';
 end if;
 if p_action='finish' and room.state->>'phase'='playing' and now_ms<(room.state->>'deadline')::bigint then
   if not coalesce(attempt->>'id' ~ '^[1-9][0-9]{0,15}$' and (attempt->>'id')::bigint<=9007199254740991
     and attempt->>'correct' ~ '^(0|[1-9][0-9]{0,3})$'
     and attempt->>'total' ~ '^[1-9][0-9]{0,3}$'
     and attempt->>'elapsedMs' ~ '^[1-9][0-9]{0,5}$',false) then
     raise exception 'Invalid race attempt.';
   end if;
   score:=(attempt->>'correct')::integer;
   total:=(attempt->>'total')::integer;
   elapsed:=(attempt->>'elapsedMs')::integer;
   if score>total or total>1000 or total<>coalesce((room.state->>'retryRaceTotal')::integer,total)
     or elapsed>least(now_ms-(room.state->>'startedAt')::bigint,600000) then
     raise exception 'Invalid race attempt.';
   end if;
   room.state:=room.state||jsonb_build_object('retryRaceTotal',total);
   select jsonb_agg(case when player->>'token'=p_token
      and (attempt->>'id')::bigint>coalesce((player->'retryAttempt'->>'id')::bigint,0) then
      player||jsonb_build_object('retryAttempt',attempt,'retryPerfectMs',
        case when score=total then least((player->>'retryPerfectMs')::integer,elapsed)
             else (player->>'retryPerfectMs')::integer end)
      else player end order by ordinal) into room.players
   from jsonb_array_elements(room.players) with ordinality as entries(player,ordinal);
 end if;

 if room.state->>'phase'='playing' and now_ms>=(room.state->>'deadline')::bigint then
   select coalesce(jsonb_agg(name order by name),'[]') into winners
   from (
     select player->>'name' as name,
       rank() over (order by
         case when player->>'retryPerfectMs' is not null then 1
           else (player->'retryAttempt'->>'correct')::numeric/(player->'retryAttempt'->>'total')::numeric end desc,
         coalesce((player->>'retryPerfectMs')::integer,(player->'retryAttempt'->>'elapsedMs')::integer)) as place
     from jsonb_array_elements(room.players) as players(player)
     where player ? 'retryAttempt'
   ) standings where place=1;
   room.state:=room.state||jsonb_build_object('phase','finished','finishReason','time','winners',winners);
 end if;
 update keyboard_pilot_rooms set state=room.state,players=room.players where pin=p_pin;

 select coalesce(jsonb_agg(visible||jsonb_build_object(
   'retryAttempt',(player->'retryAttempt')-'id','retryPerfectMs',player->'retryPerfectMs') order by ordinal),'[]') into rankings
 from jsonb_array_elements(result->'players') with ordinality as board(visible,ordinal)
 join jsonb_array_elements(room.players) as players(player) on player->>'name'=visible->>'name';
 return result||room.state||jsonb_build_object('players',rankings,'serverTime',now_ms);
end $$;

revoke all on function public.keyboard_pilot_standard(text,text,text,jsonb) from public,anon,authenticated,service_role;

commit;
