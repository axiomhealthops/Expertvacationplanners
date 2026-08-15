# Expert Vacation Planners — Platform

Next.js (App Router) + Supabase + Vercel. Internal Command Center + client/club portals.
See **EVP_SYSTEM.md** for the full spec (roles, data model, brand, roadmap).

## Run locally
    npm install
    cp .env.example .env.local   # fill Supabase URL + anon key
    npm run dev

## Database
Supabase project `dllxcomzadetidjmhdkw` already has the schema + RLS + seed applied
(`supabase/migrations/0001_init.sql`, `supabase/seed.sql`).

## Deploy
Push to GitHub, then import the repo in Vercel (adds NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY env vars).
