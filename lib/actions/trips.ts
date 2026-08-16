"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/roles";

function slugify(s: string) {
  return (s || "trip")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    .slice(0, 48) + "-" + Math.floor(Date.now() / 1000).toString(36);
}

export async function createTrip(_prev: any, formData: FormData) {
  const u = await getSessionUser();
  if (!u || !isStaff(u.role)) return { error: "Not authorized." };

  const g = (k: string) => {
    const v = formData.get(k);
    return v === null || v === "" ? null : String(v);
  };

  const name = g("name");
  if (!name) return { error: "Give the trip a name." };

  let items: any[] = [];
  try { items = JSON.parse(String(formData.get("items_json") || "[]")); } catch {}
  items = items.filter((it) => it && (it.description || it.category));

  const feePct = parseFloat(String(formData.get("fee_pct") || "0")) || 0;
  const flatFee = parseFloat(String(formData.get("flat_fee") || "0")) || 0;
  const travelers = parseInt(String(formData.get("travelers") || "0")) || 0;

  const vendorTotal = items.reduce(
    (a, it) => a + (Number(it.qty) || 1) * (Number(it.unit_price) || 0), 0
  );
  const evpFee = flatFee + vendorTotal * (feePct / 100);
  const total = vendorTotal + evpFee;
  const perPerson = travelers > 0 ? total / travelers : 0;

  const sb = supabaseServer();
  const clientId = g("client_id");

  const { data: trip, error } = await sb
    .from("trips")
    .insert({
      slug: slugify(name),
      name,
      kind: g("kind") || "private",
      stage: g("stage") || "Proposal Sent",
      client_id: clientId,
      client_name: g("client_name"),
      destination: g("destination"),
      venue: g("venue"),
      start_date: g("start_date"),
      end_date: g("end_date"),
      planned_travelers: travelers,
      total_people: travelers,
      per_person: perPerson,
      evp_fee: evpFee,
      deposit_pct: parseInt(String(formData.get("deposit_pct") || "25")) || 25,
      summary: g("summary"),
      quote_notes: g("quote_notes"),
      agent_id: u.id,
    })
    .select("id, slug")
    .single();

  if (error) return { error: `Couldn't create trip: ${error.message}` };

  if (items.length) {
    const rows = items.map((it, i) => ({
      trip_id: trip.id,
      sort: i,
      category: it.category || "Other",
      description: it.description || "",
      detail: it.detail || null,
      qty: Number(it.qty) || 1,
      unit_price: Number(it.unit_price) || 0,
      is_optional: !!it.is_optional,
    }));
    await sb.from("trip_items").insert(rows);

    // Also mirror into budget_lines so the internal Money tab stays populated
    const budget = items.map((it, i) => ({
      trip_id: trip.id,
      category: it.category || "Other",
      item: it.description || "",
      amount: (Number(it.qty) || 1) * (Number(it.unit_price) || 0),
      sort: i,
    }));
    await sb.from("budget_lines").insert(budget);
  }

  redirect(`/trips/${trip.slug}?tab=overview`);
}
