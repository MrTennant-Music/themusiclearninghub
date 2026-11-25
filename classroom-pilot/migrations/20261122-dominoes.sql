-- Add the teacher-led Dominoes round to the existing classroom lobby and PIN service.
begin;

alter function public.keyboard_pilot(text,text,text,jsonb) rename to keyboard_pilot_standard;
revoke all on function public.keyboard_pilot_standard(text,text,text,jsonb) from service_role;

create function public.keyboard_pilot(p_action text,p_pin text,p_token text,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  room keyboard_pilot_rooms;
  result jsonb;
  opening boolean := p_action='create' and p_data->>'gameType'='dominoes';
  classroom_action boolean := p_action in ('start','next','reveal');
  player_count integer;
  mine integer;
  lineup jsonb;
  dealt jsonb;
  now_ms bigint;
  elapsed bigint;
begin
  if opening then
    result:=keyboard_pilot_standard('create',p_pin,p_token,p_data||jsonb_build_object(
      'gameType','shared','dominoes',true,'capacity',jsonb_array_length(p_data->'concepts')+1));
    return (result-'concepts'-'dominoes')||'{"gameType":"dominoes"}'::jsonb;
  end if;
  if p_action in ('check','create') then
    return keyboard_pilot_standard(p_action,p_pin,p_token,p_data);
  end if;

  select * into room from keyboard_pilot_rooms where pin=p_pin;
  if room.state->>'dominoes' is distinct from 'true' then
    return keyboard_pilot_standard(p_action,p_pin,p_token,p_data);
  end if;

  -- The existing service performs expiry, permission, and lobby checks under its usual locks.
  result:=keyboard_pilot_standard(case when classroom_action or p_action in ('finish','answer') then 'read' else p_action end,p_pin,p_token,p_data);
  if coalesce((result->>'closed')::boolean,false) then return result; end if;
  select * into room from keyboard_pilot_rooms where pin=p_pin for update;
  if p_action in ('finish','answer') then raise exception 'The teacher controls the Dominoes round.'; end if;
  if classroom_action and room.host_hash<>p_token then raise exception 'Only the teacher can control the game.'; end if;
  now_ms:=(result->>'serverTime')::bigint;
  player_count:=jsonb_array_length(room.players);
  if p_action in ('join','start') and player_count>jsonb_array_length(room.state->'concepts')+1 then
    raise exception 'This Dominoes game is full (maximum % pupils).', jsonb_array_length(room.state->'concepts')+1;
  end if;

  if p_action in ('start','next') then
    if (p_action='start' and room.state->>'phase'<>'lobby') or (p_action='next' and room.state->>'phase'<>'finished') then
      raise exception 'The current round has already started.';
    end if;
    if player_count<2 then raise exception 'Wait for at least two pupils to join.'; end if;
    if p_action='start' then
      select jsonb_agg(value order by ordinality) into lineup
        from jsonb_array_elements(room.state->'concepts') with ordinality where ordinality<player_count;
    else
      select jsonb_agg(value order by random()) into lineup from jsonb_array_elements(room.state->'lineup');
      if lineup=room.state->'lineup' and jsonb_array_length(lineup)>1 then
        lineup:=(lineup-0)||jsonb_build_array(lineup->0);
      end if;
    end if;
    select jsonb_agg(jsonb_build_object(
      'term', case when step=0 then 'Start' else lineup->(step-1)->>'name' end,
      'clue', coalesce(lineup->step->>'definition','End')
    ) order by random()) into dealt from generate_series(0,player_count-1) as steps(step);
    if p_action='next' and dealt=room.state->'dealt' then
      dealt:=(dealt-0)||jsonb_build_array(dealt->0);
    end if;
    room.state:=room.state||jsonb_build_object('phase','playing','lineup',lineup,'dealt',dealt,
      'startedAt',now_ms,'stoppedAt',null);
    update keyboard_pilot_rooms set state=room.state where pin=p_pin;
  elsif p_action='reveal' then
    if room.state->>'phase'<>'playing' then raise exception 'Start a round before stopping the clock.'; end if;
    elapsed:=greatest(0,now_ms-(room.state->>'startedAt')::bigint);
    room.state:=room.state||jsonb_build_object('phase','finished','stoppedAt',now_ms,
      'bestElapsed',least(elapsed,coalesce((room.state->>'bestElapsed')::bigint,elapsed)));
    update keyboard_pilot_rooms set state=room.state where pin=p_pin;
  end if;

  select ordinality::integer-1 into mine
    from jsonb_array_elements(room.players) with ordinality where value->>'token'=p_token;
  return (result-'concepts'-'dominoes'-'lineup'-'dealt')||jsonb_build_object(
    'gameType','dominoes','phase',room.state->>'phase','startedAt',room.state->'startedAt',
    'stoppedAt',room.state->'stoppedAt','bestElapsed',room.state->'bestElapsed','myCard',room.state->'dealt'->mine);
end;
$$;

revoke all on function public.keyboard_pilot(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.keyboard_pilot(text,text,text,jsonb) to service_role;

commit;
