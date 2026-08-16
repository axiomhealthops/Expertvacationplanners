"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/roles";

export async function createClient(_prev: any, formData: FormData) {
  const u = await getSessionUser();
  if (!u || !isStaff(u.role)) return { error: "Not authorized." };

  const g = (k: string) => {
    const v = formData.get(k);
    return v === null || v === "" ? null : String(v);
  };

  const loyaltyRaw = String(formData.get("loyalty_json") || "[]");
  let loyalty: any = [];
  try { loyalty = JSON.parse(loyaltyRaw); } catch {}

  const first = g("first_name");
  const last = g("last_name");
  if (!first && !last) return { error: "Enter at least a first or last name." };

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("clients")
    .insert({
      first_name: first,
      last_name: last,
      email: g("email"),
      phone: g("phone"),
      dob: g("dob"),
      address: {
        line1: g("addr_line1"), city: g("addr_city"),
        state: g("addr_state"), zip: g("addr_zip"), country: g("addr_country"),
      },
      emergency_contact: { name: g("ec_name"), phone: g("ec_phone"), relation: g("ec_relation") },
      passport_number: g("passport_number"),
      passport_country: g("passport_country"),
      passport_expiry: g("passport_expiry"),
      known_traveler_number: g("ktn"),
      redress_number: g("redress"),
      loyalty,
      seat_pref: g("seat_pref"),
      meal_pref: g("meal_pref"),
      dietary: g("dietary"),
      travel_restrictions: g("restrictions"),
      status: g("status") || "active",
      notes: g("notes"),
      agent_id: u.id,
      created_by: u.id,
    })
    .select("id")
    .single();

  if (error) return { error: `Couldn't save: ${error.message}` };
  redirect(`/clients/${data.id}`);
}
