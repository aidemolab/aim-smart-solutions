-- Live-data backend for the three AIM demo apps.
-- Target project: "AIM Pharmaceutical AI Demo" (xlxyphqzdzhipmllhxaq). Never the customer project.
--
-- Model: one table per app. Seed rows have session_id NULL and a seed_key; they are read-only.
-- Visitor rows carry the visitor's random session id. Reads go through RLS (seed rows plus the
-- caller's own rows, identified by the x-demo-session request header). Every write goes through
-- the demo-data Edge Function, which uses the service role. Browsers get SELECT only.

-- ---------------------------------------------------------------- tables

create table if not exists public.demo_suppliers (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  seed_key text,
  name text not null check (char_length(name) between 1 and 60),
  category text not null check (char_length(category) between 1 and 40),
  country text not null check (char_length(country) between 1 and 40),
  spend integer not null check (spend between 0 and 10000000),
  delivery numeric(5,2) not null check (delivery between 0 and 100),
  quality numeric(3,1) not null check (quality between 0 and 10),
  price_competitiveness text not null check (price_competitiveness in ('High','Medium','Low')),
  dependency_risk text not null check (dependency_risk in ('High','Medium','Low')),
  contract_expiry integer not null check (contract_expiry between 0 and 120),
  incidents integer not null check (incidents between 0 and 50),
  flags text[] not null default '{}' check (cardinality(flags) <= 8),
  notes text not null default '' check (char_length(notes) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((session_id is null) = (seed_key is not null)),
  check (session_id is null or char_length(session_id) = 36)
);

create table if not exists public.demo_leads (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  seed_key text,
  company text not null check (char_length(company) between 1 and 60),
  industry text not null check (char_length(industry) between 1 and 40),
  contact text not null check (char_length(contact) between 1 and 60),
  lead_source text not null check (lead_source in ('Inbound','Outbound','Referral','Event')),
  budget_gbp integer not null check (budget_gbp between 0 and 5000000),
  timeline_months integer not null check (timeline_months between 0 and 60),
  decision_makers integer not null check (decision_makers between 0 and 30),
  previous_engagement text not null check (char_length(previous_engagement) between 1 and 120),
  pain_point_clarity text not null check (pain_point_clarity in ('High','Medium','Low')),
  fit_score integer not null check (fit_score between 0 and 100),
  flags_str text not null check (char_length(flags_str) between 1 and 300),
  notes text not null default '' check (char_length(notes) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((session_id is null) = (seed_key is not null)),
  check (session_id is null or char_length(session_id) = 36)
);

create table if not exists public.demo_properties (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  seed_key text,
  address text not null check (char_length(address) between 1 and 80),
  type text not null check (type in ('Residential Terraced','Residential Apartment','Commercial Unit')),
  region text not null check (char_length(region) between 1 and 40),
  asking_price integer not null check (asking_price between 1 and 100000000),
  estimated_market_value integer not null check (estimated_market_value between 1 and 100000000),
  monthly_rent integer not null check (monthly_rent between 0 and 1000000),
  annual_service_charge integer not null check (annual_service_charge between 0 and 1000000),
  annual_maintenance integer not null check (annual_maintenance between 0 and 1000000),
  vacancy_risk text not null check (vacancy_risk in ('Low','Medium','High')),
  condition text not null check (condition in ('Very Good','Good','Average','Poor')),
  title_status text not null check (title_status in ('Freehold','Leasehold','Clean Leasehold','Short Lease')),
  flags text[] not null default '{}' check (cardinality(flags) <= 8),
  notes text not null default '' check (char_length(notes) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((session_id is null) = (seed_key is not null)),
  check (session_id is null or char_length(session_id) = 36)
);

create unique index if not exists demo_suppliers_seed_key on public.demo_suppliers (seed_key) where session_id is null;
create unique index if not exists demo_leads_seed_key on public.demo_leads (seed_key) where session_id is null;
create unique index if not exists demo_properties_seed_key on public.demo_properties (seed_key) where session_id is null;
create index if not exists demo_suppliers_session on public.demo_suppliers (session_id, created_at);
create index if not exists demo_leads_session on public.demo_leads (session_id, created_at);
create index if not exists demo_properties_session on public.demo_properties (session_id, created_at);

-- Backstop for the 50-records-per-session limit (the Edge Function checks first).
create or replace function public.demo_enforce_session_limit() returns trigger
language plpgsql set search_path = public as $$
declare n integer;
begin
  if new.session_id is null then return new; end if;
  perform pg_advisory_xact_lock(hashtext(tg_table_name || new.session_id));
  execute format('select count(*) from public.%I where session_id = $1', tg_table_name) into n using new.session_id;
  if n >= 50 then raise exception 'session_limit' using errcode = 'P0001'; end if;
  return new;
end $$;

drop trigger if exists demo_suppliers_limit on public.demo_suppliers;
create trigger demo_suppliers_limit before insert on public.demo_suppliers for each row execute function public.demo_enforce_session_limit();
drop trigger if exists demo_leads_limit on public.demo_leads;
create trigger demo_leads_limit before insert on public.demo_leads for each row execute function public.demo_enforce_session_limit();
drop trigger if exists demo_properties_limit on public.demo_properties;
create trigger demo_properties_limit before insert on public.demo_properties for each row execute function public.demo_enforce_session_limit();

-- ---------------------------------------------------------------- RLS: read seed rows + own rows only

alter table public.demo_suppliers enable row level security;
alter table public.demo_leads enable row level security;
alter table public.demo_properties enable row level security;

revoke all on public.demo_suppliers, public.demo_leads, public.demo_properties from anon, authenticated;
grant select on public.demo_suppliers, public.demo_leads, public.demo_properties to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['demo_suppliers','demo_leads','demo_properties'] loop
    execute format('drop policy if exists "read seed and own rows" on public.%I', t);
    execute format($p$create policy "read seed and own rows" on public.%I for select to anon, authenticated
      using (session_id is null or session_id = ((select current_setting('request.headers', true))::json ->> 'x-demo-session'))$p$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- per-IP daily write limit

create table if not exists public.demo_write_usage (
  bucket text not null,
  bucket_day date not null default ((now() at time zone 'utc')::date),
  requests integer not null default 0,
  primary key (bucket, bucket_day)
);
alter table public.demo_write_usage enable row level security;
revoke all on public.demo_write_usage from anon, authenticated;

-- Same pattern as pharma_demo_consume: a per-IP cap and a global cap per UTC day.
create or replace function public.demo_write_consume(p_bucket text, p_ip_limit integer, p_global_limit integer)
returns text language plpgsql security definer set search_path = public as $$
declare n integer; g integer; d date := (now() at time zone 'utc')::date;
begin
  if p_bucket is null or length(p_bucket) > 128 then return 'ip'; end if;
  insert into public.demo_write_usage(bucket, bucket_day, requests) values (p_bucket, d, 0) on conflict do nothing;
  update public.demo_write_usage set requests = requests + 1
    where bucket = p_bucket and bucket_day = d and requests < p_ip_limit returning requests into n;
  if n is null then return 'ip'; end if;
  insert into public.demo_write_usage(bucket, bucket_day, requests) values ('global', d, 0) on conflict do nothing;
  update public.demo_write_usage set requests = requests + 1
    where bucket = 'global' and bucket_day = d and requests < p_global_limit returning requests into g;
  if g is null then
    update public.demo_write_usage set requests = requests - 1 where bucket = p_bucket and bucket_day = d;
    return 'global';
  end if;
  return 'ok';
end $$;
revoke all on function public.demo_write_consume(text, integer, integer) from public, anon, authenticated;
grant execute on function public.demo_write_consume(text, integer, integer) to service_role;

-- The pharma demo's counter should not be callable from the browser either.
revoke all on function public.pharma_demo_consume(text) from public, anon, authenticated;
grant execute on function public.pharma_demo_consume(text) to service_role;

-- Service-only tables: no browser access at all (explicit deny, service role bypasses RLS).
drop policy if exists "no browser access" on public.demo_write_usage;
create policy "no browser access" on public.demo_write_usage for all to anon, authenticated using (false) with check (false);
drop policy if exists "no browser access" on public.pharma_demo_usage;
create policy "no browser access" on public.pharma_demo_usage for all to anon, authenticated using (false) with check (false);

-- ---------------------------------------------------------------- auto-delete after 24 hours

create or replace function public.demo_cleanup() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.demo_suppliers where session_id is not null and created_at < now() - interval '24 hours';
  delete from public.demo_leads where session_id is not null and created_at < now() - interval '24 hours';
  delete from public.demo_properties where session_id is not null and created_at < now() - interval '24 hours';
  delete from public.demo_write_usage where bucket_day < (now() at time zone 'utc')::date - 2;
end $$;
revoke all on function public.demo_cleanup() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('demo-cleanup-hourly', '17 * * * *', 'select public.demo_cleanup()');
