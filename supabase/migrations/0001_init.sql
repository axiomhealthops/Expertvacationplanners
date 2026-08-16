-- EVP System — initial schema + RLS
-- Roles: super_admin, admin, agent, travel_client, sport_club, sport_client
-- Money (budget/fees/commissions/Fora) visible to staff only (super_admin/admin/agent).

create extension if not exists pgcrypto;

-- ---------- enums ----------
do $$ begin
  create type app_role as enum ('super_admin','admin','agent','travel_client','sport_club','sport_client');
exception when duplicate_object then null; end $$;

do $$ begin
  create type org_type as enum ('evp','sport_club','corporate','private');
exception when duplicate_object then null; end $$;

-- ---------- core identity ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  role app_role not null default 'travel_client',
  created_at timestamptz default now()
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  type org_type not null default 'sport_club',
  name text not null,
  slug text unique not null,
  brand jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists org_members (
  org_id uuid references organizations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  org_role text default 'member',
  primary key (org_id, profile_id)
);

-- ---------- trips + related ----------
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  kind text not null default 'group',           -- group | sports | private | corporate
  name text not null,
  client_name text,
  org_id uuid references organizations(id) on delete set null,
  agent_id uuid references profiles(id) on delete set null,
  destination text,
  venue text,
  stage text not null default 'Lead',
  start_date date,
  end_date date,
  planned_travelers int default 0,
  coaches int default 0,
  total_people int default 0,
  per_person numeric default 0,
  evp_fee numeric default 0,
  deposit_pct int default 25,
  stay_to_play text,
  poc jsonb default '{}'::jsonb,
  extras jsonb default '{}'::jsonb,              -- pkg_includes, lodging, addons, next_follow_up
  is_sample boolean default false,
  created_at timestamptz default now()
);

create table if not exists trip_teams (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  name text, players int default 0, note text
);

create table if not exists budget_lines (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  category text, item text, amount numeric default 0,
  deposit_paid numeric default 0,
  commissionable boolean default false,
  comm_rate numeric default 0,
  comm_status text default 'Expected',           -- Expected | Invoiced | Received
  note text, link text, sort int default 0
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete set null,
  trip_id uuid references trips(id) on delete set null,
  group_tag text, team text, role text default 'Family',
  player_name text, prefix text, first_name text, last_name text,
  email text, mobile text, addr jsonb default '{}'::jsonb,
  dietary text, next_step text, notes text,
  paid boolean default false, docs boolean default false,
  created_at timestamptz default now()
);

create table if not exists comms (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  c_date date, direction text, channel text, subject text, who text,
  status text, follow_up date, created_at timestamptz default now()
);

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references profiles(id) on delete set null,
  prospect text, org_name text, trip text, when_text text,
  travelers int default 0, fee numeric default 0, per_person numeric default 0,
  goal text, notes jsonb default '{}'::jsonb, outcome text,
  created_at timestamptz default now()
);

create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  name text, tier text, distance text, rate numeric default 0,
  amenities text, upgraded boolean default false, sort int default 0
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  hotel_id uuid references hotels(id) on delete set null,
  lead_guest text, rooms int default 1, nights int default 2,
  players int default 1, package_optin boolean default true,
  family_count int default 0, addons jsonb default '{}'::jsonb,
  total numeric default 0, deposit numeric default 0,
  status text default 'draft', created_at timestamptz default now()
);

-- Fora commission ledger — STAFF ONLY
create table if not exists fora_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  booked_by uuid references profiles(id) on delete set null,
  supplier text, description text, fora_reference text,
  amount numeric default 0, commission_rate numeric default 0,
  commission_amount numeric default 0,
  status text default 'expected',                 -- expected | invoiced | received
  note text, created_at timestamptz default now()
);

create table if not exists pricing_settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,   -- null = global default
  config jsonb not null default '{}'::jsonb
);

create table if not exists app_settings (
  key text primary key, value jsonb not null default '{}'::jsonb
);

-- ---------- new-user trigger ----------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- RLS helpers (security definer) ----------
create or replace function auth_role() returns app_role
language sql security definer stable set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_staff() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid())
    in ('super_admin','admin','agent'), false)
$$;

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid())
    in ('super_admin','admin'), false)
$$;

create or replace function my_org_ids() returns setof uuid
language sql security definer stable set search_path = public as $$
  select org_id from org_members where profile_id = auth.uid()
$$;

-- ---------- enable RLS ----------
alter table profiles         enable row level security;
alter table organizations    enable row level security;
alter table org_members      enable row level security;
alter table trips            enable row level security;
alter table trip_teams       enable row level security;
alter table budget_lines     enable row level security;
alter table contacts         enable row level security;
alter table comms            enable row level security;
alter table calls            enable row level security;
alter table hotels           enable row level security;
alter table bookings         enable row level security;
alter table fora_bookings    enable row level security;
alter table pricing_settings enable row level security;
alter table app_settings     enable row level security;

-- profiles: read own or staff; admin writes any; self-update basic
create policy profiles_read on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_admin_write on profiles for all using (is_admin()) with check (is_admin());
create policy profiles_self_update on profiles for update using (id = auth.uid());

-- organizations: staff all; members read theirs
create policy org_staff on organizations for all using (is_staff()) with check (is_admin());
create policy org_member_read on organizations for select using (id in (select my_org_ids()));

-- org_members: staff all; read own membership
create policy orgmem_staff on org_members for all using (is_staff()) with check (is_admin());
create policy orgmem_self on org_members for select using (profile_id = auth.uid());

-- trips: admin all; agent own; org members (club/client) read their org's trips
create policy trips_admin on trips for all using (is_admin()) with check (is_admin());
create policy trips_agent on trips for all using (auth_role()='agent' and agent_id = auth.uid())
  with check (auth_role()='agent' and agent_id = auth.uid());
create policy trips_org_read on trips for select using (org_id in (select my_org_ids()));

-- trip_teams / hotels: staff all; org members read for their org's trips
create policy teams_staff on trip_teams for all using (is_staff()) with check (is_staff());
create policy teams_org_read on trip_teams for select using (
  trip_id in (select id from trips where org_id in (select my_org_ids())));
create policy hotels_staff on hotels for all using (is_staff()) with check (is_staff());
create policy hotels_org_read on hotels for select using (
  trip_id in (select id from trips where org_id in (select my_org_ids())));

-- MONEY tables: STAFF ONLY (agents see all rows for now; scope to own trips in Phase B)
create policy budget_staff on budget_lines for all using (is_staff()) with check (is_staff());
create policy fora_staff on fora_bookings for all using (is_staff()) with check (is_staff());
create policy pricing_staff on pricing_settings for all using (is_staff()) with check (is_admin());

-- contacts: staff all; org members read their org's contacts (no money fields here)
create policy contacts_staff on contacts for all using (is_staff()) with check (is_staff());
create policy contacts_org_read on contacts for select using (org_id in (select my_org_ids()));

-- comms / calls: staff only
create policy comms_staff on comms for all using (is_staff()) with check (is_staff());
create policy calls_staff on calls for all using (is_staff()) with check (is_staff());

-- bookings: staff all; org members read/create their own club's bookings
create policy bookings_staff on bookings for all using (is_staff()) with check (is_staff());
create policy bookings_org on bookings for select using (
  trip_id in (select id from trips where org_id in (select my_org_ids())));

-- app_settings: read all authed; write admin
create policy settings_read on app_settings for select using (auth.uid() is not null);
create policy settings_admin on app_settings for all using (is_admin()) with check (is_admin());
