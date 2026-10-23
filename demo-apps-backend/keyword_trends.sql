-- UK search trends for the AI Content & Keyword Generator (keyword-trends Edge Function).
-- Cache: one row per normalised seed keyword, reused for 24 hours. Service role only.
create table if not exists public.keyword_trends_cache (
  seed text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.keyword_trends_cache enable row level security;
revoke all on public.keyword_trends_cache from anon, authenticated;
drop policy if exists "no browser access" on public.keyword_trends_cache;
create policy "no browser access" on public.keyword_trends_cache for all to anon, authenticated using (false) with check (false);

-- Counters reuse demo_write_usage. p_kind 'ip': 20 trend lookups per IP per UTC day.
-- p_kind 'firecrawl': 100 Firecrawl calls overall per UTC day (cache misses only).
create or replace function public.keyword_trends_consume(p_bucket text, p_kind text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n integer; d date := (now() at time zone 'utc')::date; b text; lim integer;
begin
  if p_kind = 'ip' then
    if p_bucket is null or length(p_bucket) > 128 then return false; end if;
    b := 'trends:' || p_bucket; lim := 20;
  elsif p_kind = 'firecrawl' then
    b := 'trends:firecrawl'; lim := 100;
  else
    return false;
  end if;
  insert into public.demo_write_usage(bucket, bucket_day, requests) values (b, d, 0) on conflict do nothing;
  update public.demo_write_usage set requests = requests + 1
    where bucket = b and bucket_day = d and requests < lim returning requests into n;
  return n is not null;
end $$;
revoke all on function public.keyword_trends_consume(text, text) from public, anon, authenticated;
grant execute on function public.keyword_trends_consume(text, text) to service_role;

-- Old cache rows are not needed after a day.
create or replace function public.keyword_trends_cleanup() returns void
language sql security definer set search_path = public as $$
  delete from public.keyword_trends_cache where fetched_at < now() - interval '2 days';
$$;
revoke all on function public.keyword_trends_cleanup() from public, anon, authenticated;
select cron.unschedule('keyword-trends-cleanup') where exists (select 1 from cron.job where jobname = 'keyword-trends-cleanup');
select cron.schedule('keyword-trends-cleanup', '17 3 * * *', 'select public.keyword_trends_cleanup()');
