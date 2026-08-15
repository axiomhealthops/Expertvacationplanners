import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPA_URL, SUPA_ANON } from './config';
export function createClient() {
  const store = cookies();
  return createServerClient(SUPA_URL, SUPA_ANON, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(list) { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} },
    },
  });
}
