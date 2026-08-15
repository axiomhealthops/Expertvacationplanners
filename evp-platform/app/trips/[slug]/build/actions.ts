'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff } from '../../../../utils/auth';
import { num } from '../../../../utils/pricing';

export type SaveItem = {
  id?: string | null;
  category?: string;
  description?: string;
  detail?: string;
  qty?: number | string;
  unit_price?: number | string;
  is_optional?: boolean;
};

export type SavePayload = {
  summary?: string;
  quote_notes?: string;
  evp_fee?: number | string;
  deposit_pct?: number | string;
  planned_travelers?: number | string;
  start_date?: string | null;
  end_date?: string | null;
  items: SaveItem[];
};

export type SaveResult = { ok: boolean; message: string; errors?: string[] };

/**
 * Saves the whole builder in one call: trip fields plus a full reconcile of the
 * trip's line items (update existing, insert new, delete removed).
 *
 * Every write is error-checked and surfaced. A Supabase write that RLS refuses
 * returns an error rather than throwing, so an unchecked call looks exactly
 * like a successful save — the user sees "Saved" and loses their work. Nothing
 * here may swallow an error.
 */
export async function saveBuild(tripId: string, slug: string, payload: SavePayload): Promise<SaveResult> {
  const { supabase } = await requireStaff();
  const errors: string[] = [];

  // Confirm the trip exists and is visible under RLS before touching items.
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .single();

  if (tripErr || !trip) {
    return { ok: false, message: tripErr?.message || 'Trip not found, or you do not have access to it.' };
  }

  const incoming = (payload.items || []).filter(
    (it) => String(it.description || '').trim() !== '' || num(it.unit_price) !== 0 || num(it.qty) !== 1
  );

  // --- existing items -------------------------------------------------------
  const { data: existingRows, error: readErr } = await supabase
    .from('trip_items')
    .select('id')
    .eq('trip_id', tripId);

  if (readErr) {
    return { ok: false, message: 'Could not read the current line items: ' + readErr.message };
  }

  const existingIds = new Set((existingRows || []).map((r: any) => String(r.id)));
  const keptIds = new Set(
    incoming.map((it) => String(it.id || '')).filter((id) => id && existingIds.has(id))
  );

  // --- update / insert ------------------------------------------------------
  for (let i = 0; i < incoming.length; i++) {
    const it = incoming[i];
    const row = {
      trip_id: tripId,
      sort: i,
      category: String(it.category || 'Other'),
      description: String(it.description || '').trim(),
      detail: String(it.detail || '').trim() || null,
      qty: num(it.qty),
      unit_price: num(it.unit_price),
      is_optional: !!it.is_optional,
    };

    const id = String(it.id || '');
    if (id && existingIds.has(id)) {
      const { error } = await supabase.from('trip_items').update(row).eq('id', id).eq('trip_id', tripId);
      if (error) errors.push(`Line ${i + 1} (${row.description || 'untitled'}): ${error.message}`);
    } else {
      const { error } = await supabase.from('trip_items').insert(row);
      if (error) errors.push(`Line ${i + 1} (${row.description || 'untitled'}): ${error.message}`);
    }
  }

  // --- delete removed -------------------------------------------------------
  // Scoped to this trip and to ids that were read back a moment ago, so a stale
  // browser tab can never delete another trip's rows.
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length) {
    const { error } = await supabase.from('trip_items').delete().eq('trip_id', tripId).in('id', toDelete);
    if (error) errors.push(`Removing ${toDelete.length} deleted line(s): ${error.message}`);
  }

  // --- trip-level fields ----------------------------------------------------
  const tripPatch: Record<string, any> = {
    summary: String(payload.summary || '').trim() || null,
    quote_notes: String(payload.quote_notes || '').trim() || null,
    evp_fee: num(payload.evp_fee),
    deposit_pct: Math.round(num(payload.deposit_pct)),
    planned_travelers: Math.round(num(payload.planned_travelers)),
    start_date: payload.start_date || null,
    end_date: payload.end_date || null,
  };

  const { error: updErr } = await supabase.from('trips').update(tripPatch).eq('id', tripId);
  if (updErr) {
    // An agent may only update trips where agent_id = auth.uid(). Say so plainly
    // instead of reporting a generic failure.
    errors.push('Trip details: ' + updErr.message);
  }

  revalidatePath(`/trips/${slug}/build`);
  revalidatePath('/trips');
  revalidatePath('/pipeline');

  if (errors.length) {
    return {
      ok: false,
      message: `Saved with ${errors.length} problem${errors.length === 1 ? '' : 's'}. Nothing else was lost, but the items below did not save.`,
      errors,
    };
  }

  return {
    ok: true,
    message: `Saved ${incoming.length} line item${incoming.length === 1 ? '' : 's'}.`,
  };
}
