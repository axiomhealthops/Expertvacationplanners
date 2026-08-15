import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export const STAFF_ROLES = ['super_admin', 'admin', 'agent'];

export function isStaffRole(role?: string | null): boolean {
  return STAFF_ROLES.includes(String(role || ''));
}

/**
 * Gate for every staff-only page and server action.
 *
 * RLS is the real enforcement; this exists so an unauthorised request is
 * redirected rather than rendering an empty shell of a page. Never rely on
 * this alone, and never rely on the client alone.
 */
export async function requireStaff() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single();

  if (!isStaffRole(profile?.role)) redirect('/dashboard');

  return { supabase, user, profile };
}
