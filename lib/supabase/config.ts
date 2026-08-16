// Public Supabase connection values. Env vars win; hardcoded public fallbacks
// keep the app working even if Vercel env vars are not set on a given deploy.
// (The anon key is a public, RLS-guarded key — safe to ship to the browser.)
export const SUPA_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dllxcomzadetidjmhdkw.supabase.co";

export const SUPA_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsbHhjb216YWRldGlkam1oZGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDc0NjIsImV4cCI6MjEwMjM4MzQ2Mn0.7nf5nBPrAuxw00auBT7B3C6YEAVyLihWXEaVcRu5NYI";
