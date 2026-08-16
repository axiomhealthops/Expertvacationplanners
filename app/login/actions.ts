"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

export async function loginPassword(_prev: any, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Enter your email and password." };

  const sb = supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password didn't match. Try again." };

  const u = await getSessionUser();
  redirect(homeFor(u?.role));
}

export async function sendMagic(_prev: any, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Enter your email first." };

  const sb = supabaseServer();
  const { error } = await sb.auth.signInWithOtp({ email });
  if (error) return { error: "Couldn't send the link. Check the email address." };
  return { ok: `Magic link sent to ${email}. Check your inbox.` };
}
