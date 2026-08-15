# EVP System — Master Build Spec

**Expert Vacation Planners** — internal command center + client/club portals.
Single source of truth for the production build. Version 1.0 · 2026-08-15 · Orlando, FL.

Stack: **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** · **Supabase** (Postgres + Auth + RLS + Storage) · **Vercel** · **GitHub**.
Supabase project ref: `dllxcomzadetidjmhdkw` (org: AxiomHealth Operations, region us-east-1).

---

## 0. What this is

EVP is a **boutique travel advisory** (not an "AI platform," not a booking site) across three verticals — **Corporate, Sports, Private**. This system runs the whole business:

- **Command Center** (internal): trip pipeline, CRM, per-trip money (budget, deposits, EVP fee, commissions), communications radar, sales-call coach, booking-fee estimator, proposal/invoice generation.
- **Sport Club portal** (external): a club (e.g., Stars Academy) and its families book a tournament trip — pick hotel from the block → book rooms → confirm per-player team package → per-person family extras → deposit → itinerary.
- **Travel Client portal** (external): individual private/corporate clients see their trip, itinerary, documents, payments.

This spec ports the proven HTML prototypes (`EVP_Command_Center.html`, `EVP_Sports_Portal.html`) into a real multi-tenant, role-secured web app.

---

## 1. Product history (what we validated in prototype)

Built and validated as self-contained HTML before this port:

1. **Pipeline board** — trips across stages (Lead → Proposal Sent → Booked → Final Payment → Pre-Trip → Traveling → Completed), KPI row, per-trip cards.
2. **Trip detail** — Overview / Roster / Money / Comms tabs.
3. **Communication layer** — per-trip contact recency, awaiting-reply, next-follow-up, travelers-to-chase; cross-trip **Comms Radar**; milestone email templates; per-traveler chase grid; comms log.
4. **Money layer** — budget lines with deposits (paid vs owed), EVP fee, cost-by-category; **commission tracker** (commissionable lines, rate, Expected→Invoiced→Received) → Total EVP Revenue + effective take rate.
5. **Booking-fee estimator** — hybrid model (base + per-person + per-day + per-vendor) anchored ~15%, compared vs %-of-cost / tiered / per-person; applies to trip.
6. **Proposal builder** — reusable component catalog + custom lines → live vendor subtotal + fee + per-person; printable client proposal; save to pipeline.
7. **Sales Call Coach** — per-prospect playbook (open → discovery → value → price → objections → close), price-anchoring/floor, notes, outcome, convert-to-proposal.
8. **CRM + Fora export** — every family as a party tagged by group + team; CSV export matching the Fora Contact Template columns.
9. **Per-player invoice** — package per player + separate lodging (per family) + per-person add-ons; Deep Water branded cover.
10. **EVP Sports portal** — event → hotel block → room booking → team package → family per-person extras → payment → itinerary.

Seed content in `docs/evp_seed_data.json`: **Hilton Head Retired General Officers Reunion**, **Tampa Bay Super Cup / Stars Academy** (4 teams, 47 players, ~160 people), two sample trips, 52 CRM contacts, pricing + commission config.

---

## 2. Brand kit (Brand Kit v1.0 — enforce everywhere)

Positioning: *"Travel planned by someone who is accountable for how the trip actually goes."* Verticals are **lockup labels**, never separate logos/colors: `EXPERT VACATION PLANNERS | SPORTS` (hairline + tracked sans label right of the wordmark).

### Palette (one navy hue axis + brass)
| Token | Hex | Use |
|---|---|---|
| Meridian Navy | `#0D2D49` | primary — wordmark, headlines, body, ~60% of any layout |
| Deep Water | `#071A2C` | anchor — full-bleed dark panels, proposal/invoice covers, footers |
| Horizon | `#2E5F86` | secondary — links, active states, **charts**, subheads on white (never on navy) |
| Brass | `#B08D57` | accent — hairlines, ticks, foil; never a large fill, never body, <2% of surface |
| Slate Ink | `#44586B` | utility — secondary copy, captions, table labels |
| Sea Mist | `#E8EDF2` | tint — section bands, table stripes, card fills, input backgrounds |
| Chart White | `#FBFCFD` | paper — default page background |
| Pure White | `#FFFFFF` | cards/surfaces that lift off Chart White; reversed logo ink |

Status (functional, internal UI only): good `#147D51`, warning `#B0862F`, critical `#B23A2E`.
Usage ratio ~60 paper / 25 navy / 10 mist / 5 (horizon+brass). Contrast: Horizon-on-navy is **prohibited**; Brass-on-white is large-only (24px+).

### Type
- **Display** — Cormorant Garamond 600, UPPERCASE, tracked (+.05em), ≥20px only. Headlines, section titles, doc covers, wordmark.
- **Body** — IBM Plex Sans 300/400/500/600. All running text/UI. 16px min.
- **Data** — IBM Plex Mono 400/500. All figures: dates, prices, codes, KPI values, eyebrows/labels.
- Fallbacks: Georgia / system-ui / monospace. All three faces are open-licensed (SIL OFL).

### Non-negotiables
- **Zero rounded corners** — the identity is engraved; rounded reads as software. `--radius: 0`.
- **Banned words** (never in EVP copy): AI-powered, platform, seamless, curated, bespoke, unforgettable, magical, dream vacation, hassle-free, world-class, elevate, journey (metaphor), "let us take care of everything", "sit back and relax".
- **Voice**: be specific or silent; say who is responsible (Liam, by name); name the failure and the plan; never an unevidenced superlative.

### Logo assets (`public/brand/`)
- `evp-logo-stacked.jpg` — the master stacked mark (globe + wordmark), navy on white (500×500).
- `evp-globe-navy.png` — globe only, navy on transparent (for white/mist surfaces).
- `evp-globe-white.png` — globe only, reversed white on transparent (for Deep Water covers, portal headers).
- `favicon.png` — globe white on Meridian Navy (avatar/favicon spec).
- TODO to commission: proper SVG + EPS of stacked / reversed / horizontal lockups; the current PNGs are rasterized from the one supplied JPG.

### Design tokens (drop into `globals.css`)
```css
:root{
  --navy:#0D2D49; --deep:#071A2C; --horizon:#2E5F86; --brass:#B08D57;
  --slate:#44586B; --mist:#E8EDF2; --paper:#FBFCFD; --white:#FFFFFF;
  --good:#147D51; --warn:#B0862F; --crit:#B23A2E;
  --display:'Cormorant Garamond',Georgia,serif;
  --body:'IBM Plex Sans',system-ui,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,monospace;
  --radius:0;
}
```

### EVP Sports credibility (footer of every sports surface)
"Team travel run by someone who has been on the bus." — UPSL founding member, former club owner, Orlando City SC, collegiate playing career.
Contact: Liam · (407) 401-0754 · admin@expertvacationplanners.com · expertvacationplanners.com · Orlando, FL. (Site `theme-color` = `#0D2D49`.)

---

## 3. Roles & permissions

Six roles. Access enforced in the DB via **Row-Level Security** (never trust the client).

| Role | Scope | Can see money/fees/commissions? |
|---|---|---|
| **super_admin** (Liam) | Everything — all orgs, all trips/clients, users, settings, Fora ledger | Yes — all |
| **admin** | All operational data, all money/Fora/commissions; no role management / destructive settings | Yes — all |
| **agent** | Only trips/clients **assigned** to them; create trips/proposals, rosters, comms, book via Fora, see **own** commissions | Yes — own trips only |
| **travel_client** | Their own trip(s): itinerary, documents, payments | No |
| **sport_club** | Their club's events, teams, rosters, and their families' booking status | No (no EVP margin/commissions, no other clubs) |
| **sport_client** | Their own player(s): rooms, payments, itinerary | No |

**Money rule (hard):** EVP margin, coordination-fee split, and Fora commissions are visible to **super_admin / admin / agent** only — never clubs or clients. Enforced by RLS + column-level view separation (client-facing views omit fee/commission columns).

**Tenancy:** `organizations` are tenants (a Sport Club like Stars Academy, or a Corporate account). `org_members` ties a `profile` to an org with an in-org role. `sport_client` and `sport_club` users belong to a club org; `travel_client` is tied to a trip/agent directly. Agents are assigned via `trips.agent_id` (+ future `agent_assignments` for clients).

---

## 4. Data model (Supabase / Postgres)

See `supabase/migrations/0001_init.sql` for the authoritative DDL + RLS. Core tables:

- `profiles` — 1:1 with `auth.users`; `role app_role`, name, phone.
- `organizations` — tenants (`type`: evp | sport_club | corporate | private), name, slug, brand overrides.
- `org_members` — profile ↔ org, `org_role`.
- `trips` — the central record: kind (group|sports|private|corporate), stage, dates, destination/venue, planned_travelers/coaches/total_people, per_person, evp_fee, deposit_pct, stay_to_play, `agent_id`, `org_id`, jsonb extras (pkg_includes, lodging, addons, teams).
- `trip_teams` — sports sub-teams (U8/U10/U12/U13).
- `budget_lines` — category/item/amount/deposit_paid + commission fields (commissionable, comm_rate, comm_status).
- `contacts` — CRM parties: group_tag, team, role, player_name, name, email, mobile, addr jsonb, dietary, next_step; Fora export maps from here.
- `comms` — per-trip log (direction, channel, subject, status, follow_up).
- `calls` — sales-coach prospect playbooks (notes jsonb, outcome).
- `hotels` — per-trip block (name, tier, distance, rate, amenities, upgraded).
- `bookings` — portal bookings (family/contact, hotel, rooms, nights, players, package_optin, family_count, addons jsonb, totals, deposit, status).
- `fora_bookings` — **commission ledger** (supplier, fora_reference, amount, commission_rate, commission_amount, status expected|invoiced|received, booked_by) — agent/admin/super only.
- `pricing_settings` — hybrid fee config (base, per_person, per_day, per_vendor, target_pct, floor, round_to, tiers, flat_per_person) — global default + optional per-org override.
- `app_settings` — misc (brand, contact, add-on price list).

Client-facing **views** (RLS-safe, fee/commission stripped): `v_client_trip`, `v_club_roster`, `v_portal_hotels`.

---

## 5. Fora / IATA linkage

EVP has **no IATA number**; bookings are placed through Liam's **Fora** host-agency account to earn commission. This is a **super_admin / admin / agent task only** and is never exposed to clients or clubs.

Fora has no public booking API, so the linkage is **tracking, not automation**:
- `fora_bookings` is the ledger: each supplier booking placed via Fora records a **Fora reference**, amount, commission %, expected vs received, and who booked it.
- Commission rolls into the trip's money view and the admin revenue totals (fee + commission = Total EVP Revenue).
- The existing **Fora Contact CSV export** (matching the Fora Contact Template columns) remains the hand-off to load travelers into Fora.
- Phase 2 option: parse Fora commission statements (upload) to auto-reconcile expected → received.

---

## 6. Architecture

```
Next.js (App Router)
  /(marketing)        public site (later)
  /login              magic-link + password
  /app                authed shell; role-aware nav
    /dashboard        role router → admin | agent | client | club
    /pipeline         admin/agent: trip board
    /trips/[id]       overview / roster / money / comms
    /crm              contacts + Fora export
    /coach            sales call coach
    /fora             commission ledger (admin/agent)
    /settings         pricing, brand, users (admin/super)
  /club/[slug]        Sport Club portal (event → hotels → book)
  /trip/[token]       Travel Client portal
supabase/             migrations, seed, RLS
lib/supabase/         server + browser clients, auth helpers
components/ui/        shadcn, brand-tokened
```

- **Auth**: Supabase Auth (magic link + password). `middleware.ts` guards `/app`, `/club`, `/trip`; reads `profiles.role` and redirects to the right home. Google SSO = phase 2.
- **RLS everywhere**; server components use the user's session; service-role key only in trusted server actions (seeding/admin ops).
- **Env**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only). Stripe keys added phase 2.
- **Deploy**: Vercel (project on team `axiomhealthops-projects`), custom domain `app.expertvacationplanners.com` later.

---

## 7. Phased plan

**Phase A (today):** repo + Supabase (schema + RLS + seed live) + auth + role routing + **Admin Command Center** shell (pipeline reading live data) → deployed Vercel URL. Users: Liam (super_admin), one test Agent, Stars Academy demo club.

**Phase B:** full Admin Command Center parity (trip detail money/comms, CRM + Fora export, coach, estimator, proposal/invoice PDF, Fora ledger).

**Phase C:** Sport Club portal (event → hotel block → booking → roster) wired to live bookings.

**Phase D:** Travel Client portal; Stripe payments (deposits/balances); Fora statement reconciliation; custom domain; email (Resend) for magic links + milestone templates.

---

## 8. Setup / run

```bash
npm install
cp .env.example .env.local   # fill Supabase URL + anon key (+ service role for seeding)
npm run dev                  # http://localhost:3000
# DB: supabase/migrations/0001_init.sql then supabase/seed.sql (already applied to project dllxcomzadetidjmhdkw)
```

Repo: create `expert-vacation-planners` under the user's GitHub, connect to Vercel for CI deploys. Seed accounts and passwords are delivered separately (never commit secrets).
