-- Rate limit for the AI Content & Keyword Generator (content-generator Edge Function).
-- Reuses demo_write_usage with its own buckets: 10 generations per IP and 200 overall per UTC day.
create or replace function public.content_gen_consume(p_bucket text)
returns text language plpgsql security definer set search_path = public as $$
declare n integer; g integer; d date := (now() at time zone 'utc')::date;
begin
  if p_bucket is null or length(p_bucket) > 128 then return 'ip'; end if;
  insert into public.demo_write_usage(bucket, bucket_day, requests) values ('gen:' || p_bucket, d, 0) on conflict do nothing;
  update public.demo_write_usage set requests = requests + 1
    where bucket = 'gen:' || p_bucket and bucket_day = d and requests < 10 returning requests into n;
  if n is null then return 'ip'; end if;
  insert into public.demo_write_usage(bucket, bucket_day, requests) values ('gen:global', d, 0) on conflict do nothing;
  update public.demo_write_usage set requests = requests + 1
    where bucket = 'gen:global' and bucket_day = d and requests < 200 returning requests into g;
  if g is null then
    update public.demo_write_usage set requests = requests - 1 where bucket = 'gen:' || p_bucket and bucket_day = d;
    return 'global';
  end if;
  return 'ok';
end $$;
revoke all on function public.content_gen_consume(text) from public, anon, authenticated;
grant execute on function public.content_gen_consume(text) to service_role;
