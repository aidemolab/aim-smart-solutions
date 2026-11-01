-- Caps for the AI receptionist demo call (function demo-call). Kept apart from
-- call_log so demo calls never use up the enquiry call-back's own daily cap.
-- demo_call_claim() decides, under a lock so two requests cannot both squeeze under a cap:
--   * at most p_daily_limit demo calls per UTC day across the whole site
--   * at most one demo call per phone number in any rolling 24 hours
-- The number is stored only as a salted SHA-256 hash.

create table if not exists public.demo_call_log (
  id          bigint generated always as identity primary key,
  number_hash text        not null,
  created_at  timestamptz not null default now()
);
create index if not exists demo_call_log_created_at_idx on public.demo_call_log (created_at);
create index if not exists demo_call_log_number_idx on public.demo_call_log (number_hash, created_at);

alter table public.demo_call_log enable row level security;
-- No policies: anon and authenticated users cannot read or write it.
revoke all on public.demo_call_log from anon, authenticated;

-- Returns 'ok' (and records the call), 'daily' (site-wide cap reached) or
-- 'number' (this number already had a demo call in the last 24 hours).
create or replace function public.demo_call_claim(p_number_hash text, p_daily_limit integer)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if p_number_hash is null or length(p_number_hash) > 160 or p_daily_limit is null or p_daily_limit < 1 then
    return 'invalid';
  end if;
  perform pg_advisory_xact_lock(hashtext('demo_call_claim'));
  -- Hashes older than a week are no longer needed for any limit.
  delete from public.demo_call_log where created_at < now() - interval '7 days';
  if exists (select 1 from public.demo_call_log
             where number_hash = p_number_hash and created_at > now() - interval '24 hours') then
    return 'number';
  end if;
  if (select count(*) from public.demo_call_log
      where created_at >= ((now() at time zone 'utc')::date)::timestamp at time zone 'utc') >= p_daily_limit then
    return 'daily';
  end if;
  insert into public.demo_call_log (number_hash) values (p_number_hash);
  return 'ok';
end
$function$;

revoke execute on function public.demo_call_claim(text, integer) from public, anon, authenticated;
grant execute on function public.demo_call_claim(text, integer) to service_role;
