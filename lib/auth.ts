import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import type { Role } from "./roles";

export type SessionUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: Role;
};

// Returns the signed-in user + profile, or null. Never throws.
export async function getSessionUser(): Promise<SessionUser | null> {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb
    .from("profiles")
    .select("full_name, role, email")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: (profile?.role as Role) ?? "travel_client",
  };
}

// Require a signed-in user; redirect to /login if absent.
export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  return u;
}

// Require one of the allowed roles; bounce elsewhere if not.
export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const u = await requireUser();
  if (!allowed.includes(u.role)) redirect("/dashboard");
  return u;
}
