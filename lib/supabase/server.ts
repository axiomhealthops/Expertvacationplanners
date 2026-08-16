import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPA_URL, SUPA_ANON } from "./config";

// Server-side Supabase client bound to the request's auth cookies.
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(SUPA_URL, SUPA_ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component render — safe to ignore; the
          // session is refreshed by the auth action / route handlers instead.
        }
      },
    },
  });
}
