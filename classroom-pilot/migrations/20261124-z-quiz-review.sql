-- Preserve hosted Concept Quiz round points and support skipping failed audio.
create or replace function public.keyboard_pilot(p_action text,p_pin text,p_token text,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  room keyboard_pilot_rooms;
  result jsonb;
  nickname text;
  playback jsonb;
begin
  if p_action in ('nicknames','rename') then
    -- Use the existing expiry, membership and lock order before changing the room.
    result:=keyboard_pilot_game('read',p_pin,p_token,'{}');
    if result->>'closed'='true' then return result; end if;
    select * into room from keyboard_pilot_rooms where pin=p_pin for update;
    if room.state->>'phase'<>'lobby' then raise exception 'Nicknames can only be changed before the game starts.'; end if;

    if p_action='nicknames' then
      if room.host_hash<>p_token then raise exception 'Only the teacher can allow nicknames.'; end if;
      if jsonb_typeof(p_data->'allowNicknames') is distinct from 'boolean' then
        raise exception 'Choose whether to allow nicknames.';
      end if;
      update keyboard_pilot_rooms
      set state=jsonb_set(state,'{allowNicknames}',p_data->'allowNicknames'),
          players=case when p_data->>'allowNicknames'='true' then room.players else (
            select coalesce(jsonb_agg(case when value ? 'assignedName'
              then jsonb_set(value,'{name}',value->'assignedName') else value end order by ordinality),'[]'::jsonb)
            from jsonb_array_elements(room.players) with ordinality
          ) end
      where pin=p_pin;
    else
      if room.host_hash=p_token or room.state->>'allowNicknames' is distinct from 'true' then
        raise exception 'Nicknames are currently locked.';
      end if;
      nickname:=coalesce(p_data->>'name','');
      if char_length(nickname) not between 1 and 20 or nickname ~ '[[:space:][:cntrl:]]' then
        raise exception 'Use a nickname of 1–20 characters with no spaces.';
      end if;
      if exists(select 1 from jsonb_array_elements(room.players)
        where value->>'token'<>p_token and (lower(value->>'name')=lower(nickname)
          or lower(value->>'assignedName')=lower(nickname))) then
        raise exception 'That nickname is already taken.';
      end if;
      update keyboard_pilot_rooms set players=(
        select jsonb_agg(case when value->>'token'=p_token then value||jsonb_build_object(
          'assignedName',coalesce(value->>'assignedName',value->>'name'),'name',nickname
        ) else value end order by ordinality)
        from jsonb_array_elements(room.players) with ordinality
      ) where pin=p_pin;
    end if;
    result:=keyboard_pilot_game('read',p_pin,p_token,'{}');
  elsif p_action='skip-excerpt' then
    result:=keyboard_pilot_game('read',p_pin,p_token,'{}');
    if result->>'closed'='true' then return result; end if;
    if result->>'host' is distinct from 'true' then raise exception 'Only the teacher can control the game.'; end if;
    if result->>'phase' is distinct from 'listening' or result->'question'->>'type' is distinct from 'concept-quiz'
      or p_data->>'index' is distinct from result->>'index' then raise exception 'This question is no longer active.'; end if;
    -- Both calls share the room lock, so the skipped excerpt never opens submissions.
    perform keyboard_pilot_game('audio-ended',p_pin,p_token,p_data);
    result:=keyboard_pilot_game('reveal',p_pin,p_token,'{}');
  else
    result:=keyboard_pilot_game(p_action,p_pin,p_token,p_data);
  end if;

  if p_action='check' or result->>'closed'='true' then return result; end if;
  select * into room from keyboard_pilot_rooms where pin=p_pin;
  if result->'question'->>'type'='concept-quiz' then
    if p_action='next' and result->>'phase' in ('countdown','listening') then
      update keyboard_pilot_rooms set players=(
        select jsonb_agg(value||jsonb_build_object('previousScore',value->'score') order by ordinality)
        from jsonb_array_elements(room.players) with ordinality
      ) where pin=p_pin;
    elsif result->>'host'='true' and result->>'phase'='review' then
      result:=jsonb_set(result,'{players}',(
        select coalesce(jsonb_agg(case when player ? 'previousScore' or result->>'index'='0'
          then entry||jsonb_build_object('gained',(player->>'score')::int-coalesce((player->>'previousScore')::int,0))
          else entry end order by board.ordinality),'[]'::jsonb)
        from jsonb_array_elements(result->'players') with ordinality board(entry,ordinality)
        join jsonb_array_elements(room.players) roster(player) on player->>'token'=entry->>'id'
      ));
    end if;
  end if;
  playback:=room.state->'excerptPlayback';
  if p_action='read' and room.host_hash=p_token and p_data ? 'excerptPlayback' then
    if result->'question'->>'type'='concept-quiz' and result->'question'->'score' ? 'audio'
      and room.state->>'phase' in ('listening','question','review')
      and p_data->'excerptPlayback'->>'index'=room.state->>'index'
      and p_data->'excerptPlayback'->>'phase'=room.state->>'phase' then
      -- An expired report also clears the status if the host tab closes.
      playback:=p_data->'excerptPlayback'||jsonb_build_object('until',floor(extract(epoch from clock_timestamp())*1000)+4000);
      update keyboard_pilot_rooms set state=jsonb_set(state,'{excerptPlayback}',playback) where pin=p_pin;
    elsif playback is not null then
      playback:=null;
      update keyboard_pilot_rooms set state=state-'excerptPlayback' where pin=p_pin;
    end if;
  end if;
  return (result-'excerptPlayback')||jsonb_build_object(
    'allowNicknames',coalesce(room.state->>'allowNicknames'='true',false),
    'playingAudio',coalesce(playback->>'index'=room.state->>'index' and playback->>'phase'=room.state->>'phase'
      and (playback->>'until')::numeric>extract(epoch from clock_timestamp())*1000,false)
  );
end;
$$;

revoke all on function public.keyboard_pilot(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.keyboard_pilot(text,text,text,jsonb) to service_role;
