-- Add the shared countdown and Race reset events without removing existing rooms.
begin;
create or replace function public.keyboard_pilot_points(elapsed_ms bigint,time_limit_ms bigint)
returns integer language sql immutable set search_path=public,pg_temp as $$
 select case when elapsed_ms < 500 then 100
   else greatest(50,least(100,round(100*(1-greatest(0,elapsed_ms)::numeric/(2*greatest(1,time_limit_ms))))::integer)) end;
$$;
revoke all on function public.keyboard_pilot(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.keyboard_pilot(text,text,text,jsonb) to service_role;
commit;
