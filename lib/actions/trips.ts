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
    const { error: itemErr } = await sb.from("trip_items").insert(rows);

    // Never swallow this. A refused insert leaves the trip created with no
    // line items, and the quote then totals nothing but the EVP fee — which
    // reads as a real, and very wrong, price to the client.
    if (itemErr) {
      return {
        error: `Trip "${name}" was created, but its ${rows.length} line item(s) did not save: ${itemErr.message}. Open the trip and add them before sending a quote.`,
      };
    }

    // Also mirror into budget_lines so the internal Money tab stays populated.
    const budget = items.map((it, i) => ({
      trip_id: trip.id,
      category: it.category || "Other",
      item: it.description || "",
      amount: (Number(it.qty) || 1) * (Number(it.unit_price) || 0),
      sort: i,
    }));
    const { error: budgetErr } = await sb.from("budget_lines").insert(budget);
    if (budgetErr) {
      return {
        error: `Trip "${name}" and its quote saved, but the Money tab did not populate: ${budgetErr.message}.`,
      };
    }
  }

  redirect(`/trips/${trip.slug}?tab=overview`);
}

export async function updateTrip(_prev: any, formData: FormData) {
  const u = await getSessionUser();
  if (!u || !isStaff(u.role)) return { error: "Not authorized." };

  const g = (k: string) => {
    const v = formData.get(k);
    return v === null || v === "" ? null : String(v);
  };

  const tripId = g("trip_id");
  const slug = g("slug");
  if (!tripId || !slug) return { error: "Missing trip reference." };

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

  // The slug is deliberately left alone even when the name changes: it is the
  // address of any quote already sent to a client.
  const { error: tripErr } = await sb
    .from("trips")
    .update({
      name,
      kind: g("kind") || "private",
      stage: g("stage") || "Proposal Sent",
      client_id: g("client_id"),
      client_name: g("client_name"),
      destination: g("destination"),
      start_date: g("start_date"),
      end_date: g("end_date"),
      planned_travelers: travelers,
      total_people: travelers,
      per_person: perPerson,
      evp_fee: evpFee,
      deposit_pct: parseInt(String(formData.get("deposit_pct") || "25")) || 25,
      summary: g("summary"),
      quote_notes: g("quote_notes"),
    })
    .eq("id", tripId);

  // An agent may only update trips where agent_id = auth.uid(), so a refusal
  // here is expected for another agent's trip. Say which, rather than failing
  // generically.
  if (tripErr) return { error: `Couldn't save the trip: ${tripErr.message}` };

  // --- reconcile line items -------------------------------------------------
  // Update in place, insert what is new, delete what was removed. Deliberately
  // NOT delete-all-then-reinsert: a failure partway through that would leave
  // the trip with no itinerary at all.
  const { data: existingRows, error: readErr } = await sb
    .from("trip_items").select("id").eq("trip_id", tripId);
  if (readErr) return { error: `Couldn't read the current line items: ${readErr.message}` };

  const existingIds = new Set((existingRows || []).map((r: any) => String(r.id)));
  const keptIds = new Set(
    items.map((it) => String(it.id || "")).filter((id) => id && existingIds.has(id))
  );

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const row = {
      trip_id: tripId,
      sort: i,
      category: it.category || "Other",
      description: it.description || "",
      detail: it.detail || null,
      qty: Number(it.qty) || 1,
      unit_price: Number(it.unit_price) || 0,
      is_optional: !!it.is_optional,
    };
    const id = String(it.id || "");
    if (id && existingIds.has(id)) {
      const { error } = await sb.from("trip_items").update(row).eq("id", id).eq("trip_id", tripId);
      if (error) return { error: `Line ${i + 1} (${row.description || "untitled"}) didn't save: ${error.message}` };
    } else {
      const { error } = await sb.from("trip_items").insert(row);
      if (error) return { error: `Line ${i + 1} (${row.description || "untitled"}) didn't save: ${error.message}` };
    }
  }

  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length) {
    const { error } = await sb.from("trip_items").delete().eq("trip_id", tripId).in("id", toDelete);
    if (error) return { error: `Couldn't remove ${toDelete.length} deleted line(s): ${error.message}` };
  }

  // budget_lines is intentionally NOT re-synced here. Those rows carry
  // deposit_paid, commissionable, comm_rate and comm_status — money entered by
  // hand on the Money tab. Rewriting them from the quote on every edit would
  // wipe commission tracking. Editing a quote line therefore does not update
  // the Money tab; that reconciliation needs its own deliberate UI.

  redirect(`/trips/${slug}/quote`);
}
