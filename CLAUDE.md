# EVP Command 26 — Project Context (read this first)

This is **Expert Vacation Planners' all-in-one operations platform** — the internal
command center plus client & club portals. It is a clean, ground-up rebuild.

**Owner:** Liam · Expert Vacation Planners (boutique group/event/private travel advisory, Orlando FL).
**Main business goal:** convert proposals into paid customers. Every feature should serve
capture client → build trip → send a sharp branded quote → close.

## Stack
- **Next.js 14.2.5** (App Router, TypeScript) — server components + server actions.
- **Supabase** (Postgres + Auth + Row-Level Security). Project ref: `dllxcomzadetidjmhdkw`.
- **Vercel** hosting. Plain CSS design system (no Tailwind) in `app/globals.css`.
- No Edge middleware — auth is enforced in server components via `lib/auth.ts`
  (`requireUser` / `requireRole`). **Do not add middleware.ts** (it crashed on Vercel's Edge runtime).

## Auth & roles (6 levels, enforced by RLS — never trust the client)
`super_admin, admin, agent, travel_client, sport_club, sport_client` (see `lib/roles.ts`).
- Staff = super_admin/admin/agent → pipeline, trip builder, clients, CRM, money, Fora ledger.
- sport_club → `/club` (their events/teams/hotel block, **no money**).
- travel_client / sport_client → `/myportal` (their trips/itinerary, **no money**).
- **Hard money rule:** EVP fee, margins, and Fora commissions are visible to staff only.

## Data model (Supabase)
Migrations in `supabase/migrations/`. Core tables: `profiles, organizations, org_members,
trips, trip_teams, trip_items, budget_lines, clients, contacts, comms, calls, hotels,
bookings, fora_bookings, pricing_settings, app_settings`.
- `clients` — rich traveler profile (personal, passport, KTN, loyalty jsonb, dietary, restrictions, emergency contact).
- `trip_items` — client-facing quote line items produced by the Trip Builder.
- `trips.client_id / summary / quote_notes` — link to a client + quote copy.

## Brand kit (enforce everywhere)
Palette: Meridian Navy `#0D2D49`, Deep Water `#071A2C`, Horizon `#2E5F86`, Brass `#B08D57`,
Slate `#44586B`, Mist `#E8EDF2`, Paper `#FBFCFD`. Fonts: Cormorant Garamond (display, UPPERCASE),
IBM Plex Sans (body), IBM Plex Mono (all figures/labels). **Zero rounded corners.**
Banned words: AI-powered, platform, seamless, curated, bespoke, unforgettable, world-class, elevate, "sit back and relax".
Logo: `public/brand/` (globe.png used in header/sidebar; stacked + white/navy globes available).

## What's built
Login (password + magic link), role routing, dashboard, pipeline board, trip detail
(overview/roster/money/comms), CRM + Fora CSV export, commission ledger, settings,
club portal, client portal, **New Client intake**, **Clients list/detail**, **Trip Builder**
(live pricing), **branded printable Quote** (`/trips/[slug]/quote`, print-to-PDF).

## What's next (priority order)
1. Edit existing trips/items in the Trip Builder (currently create-only).
2. Convert-to-paid: deposit links (Stripe), payment status, e-sign/accept on the quote.
3. Server-side PDF (not just print) + email the quote (Resend).
4. Comms follow-up automation (awaiting-reply, milestone templates).
5. Scope agents/clients to only their own records in RLS (currently staff see all).
6. Full stacked logo lockup + favicon polish.

## Run / deploy
```
npm install
cp .env.example .env.local   # Supabase URL + anon key
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```
Deploy to Vercel (Framework Preset: Next.js, Root Directory: empty). Public Supabase
values also have hardcoded fallbacks in `lib/supabase/config.ts` so it runs even without env vars.

## Demo logins
super_admin `admin@expertvacationplanners.com` / `EVPsuper!2026`.
All others `EVPdemo!2026`: manager@ (admin), agent@, traveler@ (travel_client),
club@starsacademy.com (sport_club), family@starsacademy.com (sport_client).
