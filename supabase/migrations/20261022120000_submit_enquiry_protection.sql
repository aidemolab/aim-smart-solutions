-- Supports the submit-enquiry function. Applied to production on 2026-10-22.
-- Same pattern as the pharma demo (pharma_demo_usage / pharma_demo_consume):
-- daily counters keyed by a hashed bucket, consumed through a SECURITY DEFINER
-- function that only the service role may call.

create table if not exists public.form_usage (
  bucket     text    not null,
  bucket_day date    not null default ((now() at time zone 'utc'))::date,
  requests   integer not null default 0,
  primary key (bucket, bucket_day)
);

alter table public.form_usage enable row level security;
-- No policies: anon and authenticated users cannot read or write it.
revoke all on public.form_usage from anon, authenticated;

-- Adds one to the bucket's count for today (UTC) and returns true, or returns
-- false without counting if the bucket has already reached p_limit today.
create or replace function public.form_consume(p_bucket text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n integer;
begin
  if p_bucket is null or length(p_bucket) > 160 or p_limit is null or p_limit < 1 then
    return false;
  end if;
  insert into public.form_usage (bucket, bucket_day, requests)
    values (p_bucket, (now() at time zone 'utc')::date, 0)
    on conflict do nothing;
  update public.form_usage set requests = requests + 1
    where bucket = p_bucket and bucket_day = (now() at time zone 'utc')::date and requests < p_limit
    returning requests into n;
  return n is not null;
end
$function$;

revoke execute on function public.form_consume(text, integer) from public, anon, authenticated;
grant execute on function public.form_consume(text, integer) to service_role;

-- Records when the visitor ticked the consent box for an automated call, and
-- exactly which wording (and version of it) they agreed to.
alter table public.enquiries add column if not exists call_consent_at timestamptz;
alter table public.enquiries add column if not exists call_consent_version text;
alter table public.enquiries add column if not exists call_consent_text text;
