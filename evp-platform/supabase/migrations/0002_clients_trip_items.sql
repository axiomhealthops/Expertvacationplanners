-- 0002_clients_trip_items.sql
--
-- Brings the repo in sync with schema that was applied directly to the live
-- Supabase project (dllxcomzadetidjmhdkw) on 2026-08-15 and never captured in a
-- migration file. Everything here ALREADY EXISTS in production.
--
-- This file is idempotent so it is safe to run against the live database (it
-- will be a no-op) and it will build a correct database from scratch for any
-- fresh environment. Run 0001_init.sql first.

-- ---------------------------------------------------------------------------
-- clients — rich traveler profile behind the Trip Builder and the quote
-- ---------------------------------------------------------------------------
create table if not exists clients (
  id                    uuid primary key default gen_random_uuid(),
  agent_id              uuid references profiles(id),
  org_id                uuid references organizations(id),
  first_name            text,
  last_name             text,
  email                 text,
  phone                 text,
  dob                   date,
  address               jsonb default '{}'::jsonb,
  emergency_contact     jsonb default '{}'::jsonb,
  passport_number       text,
  passport_country      text,
  passport_expiry       date,
  known_traveler_number text,
  redress_number        text,
  loyalty               jsonb default '[]'::jsonb,
  seat_pref             text,
  meal_pref             text,
  dietary               text,
  travel_restrictions   text,
  marketing_optin       boolean default false,
  status                text default 'active',
  notes                 text,
  created_by            uuid references profiles(id),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- trips — quote-facing additions
-- ---------------------------------------------------------------------------
alter table trips add column if not exists client_id   uuid references clients(id);
alter table trips add column if not exists summary     text;
alter table trips add column if not exists quote_notes text;

-- ---------------------------------------------------------------------------
-- trip_items — client-facing quote line items produced by the Trip Builder.
--
-- Deliberately separate from budget_lines: budget_lines is the internal cost
-- and commission ledger (staff only), trip_items is what the client reads on
-- the quote. Keeping them apart is what lets the client-facing views expose
-- line items without leaking cost, margin or commission.
-- ---------------------------------------------------------------------------
create table if not exists trip_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid references trips(id) on delete cascade,
  sort        integer default 0,
  category    text default 'Other',
  description text,
  detail      text,
  qty         numeric default 1,
  unit_price  numeric default 0,
  is_optional boolean default false,
  created_at  timestamptz default now()
);

create index if not exists trip_items_trip_id_idx on trip_items (trip_id, sort);
create index if not exists clients_agent_id_idx   on clients (agent_id);
create index if not exists trips_client_id_idx    on trips (client_id);

-- ---------------------------------------------------------------------------
-- RLS. Both tables carry client PII / quote pricing, so neither may be left
-- open. Enabling RLS without a policy denies everything, so the policies are
-- created in the same step.
-- ---------------------------------------------------------------------------
alter table clients    enable row level security;
alter table trip_items enable row level security;

-- Staff (super_admin / admin / agent) manage clients.
drop policy if exists clients_staff on clients;
create policy clients_staff on clients
  for all using (is_staff()) with check (is_staff());

-- Staff manage quote line items.
drop policy if exists trip_items_staff on trip_items;
create policy trip_items_staff on trip_items
  for all using (is_staff()) with check (is_staff());

-- Members of the owning organization may READ the line items of their own
-- trips, so the client/club portals can render a quote. Read-only, and
-- trip_items carries no fee, margin or commission column.
drop policy if exists trip_items_org_read on trip_items;
create policy trip_items_org_read on trip_items
  for select using (
    trip_id in (select id from trips where org_id in (select my_org_ids()))
  );
