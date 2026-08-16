# EVP Command 26

Expert Vacation Planners' all-in-one operations platform: internal command center
(pipeline, clients, trip builder, quotes, money, Fora commissions) plus client & club portals.

**Start with [`CLAUDE.md`](./CLAUDE.md)** — it has the full architecture, roles, brand kit,
data model, and what's built vs. next. Open this folder in Claude Code and it will pick up context automatically.

## Quick start
```bash
npm install
cp .env.example .env.local     # fill in Supabase URL + anon key (defaults also hardcoded)
npm run dev                    # http://localhost:3000
```

## Deploy (Vercel)
- Framework Preset: **Next.js**
- Root Directory: **(empty)** — the app is at the repo root
- No environment variables strictly required (public Supabase values fall back in `lib/supabase/config.ts`),
  but set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for cleanliness.

## Stack
Next.js 14 (App Router) · Supabase (Postgres + Auth + RLS) · plain-CSS design system · Vercel.

## Database
Apply `supabase/migrations/*.sql` in order to a Supabase project, then create auth users
and assign `profiles.role`. See `CLAUDE.md` for the six roles and the money-visibility rule.
