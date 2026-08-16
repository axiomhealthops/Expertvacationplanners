-- Clients (rich traveler profiles) + trip_items (client-facing quote lines) + trip quote fields
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references profiles(id) on delete set null,
  org_id uuid references organizations(id) on delete set null,
  first_name text, last_name text, email text, phone text,
  dob date, address jsonb default '{}'::jsonb, emergency_contact jsonb default '{}'::jsonb,
  passport_number text, passport_country text, passport_expiry date,
  known_traveler_number text, redress_number text,
  loyalty jsonb default '[]'::jsonb, seat_pref text, meal_pref text, dietary text,
  travel_restrictions text, marketing_optin boolean default false,
  status text default 'active', notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  sort int default 0, category text default 'Other',
  description text, detail text, qty numeric default 1, unit_price numeric default 0,
  is_optional boolean default false, created_at timestamptz default now()
);
alter table trips add column if not exists client_id uuid references clients(id) on delete set null;
alter table trips add column if not exists summary text;
alter table trips add column if not exists quote_notes text;
alter table clients enable row level security;
alter table trip_items enable row level security;
create policy clients_staff on clients for all using (is_staff()) with check (is_staff());
create policy trip_items_staff on trip_items for all using (is_staff()) with check (is_staff());
create policy trip_items_org_read on trip_items for select using (
  trip_id in (select id from trips where org_id in (select my_org_ids())));
