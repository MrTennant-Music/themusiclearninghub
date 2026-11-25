-- Restore assigned names when the teacher turns off lobby nicknames.
create or replace function public.keyboard_pilot(p_action text,p_pin text,p_token text,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  room keyboard_pilot_rooms;
  result jsonb;
  nickname text;
  nicknames_allowed boolean;
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
  else
    result:=keyboard_pilot_game(p_action,p_pin,p_token,p_data);
  end if;

  if p_action='check' or result->>'closed'='true' then return result; end if;
  select state->>'allowNicknames'='true' into nicknames_allowed from keyboard_pilot_rooms where pin=p_pin;
  return result||jsonb_build_object('allowNicknames',coalesce(nicknames_allowed,false));
end;
$$;

revoke all on function public.keyboard_pilot(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.keyboard_pilot(text,text,text,jsonb) to service_role;
