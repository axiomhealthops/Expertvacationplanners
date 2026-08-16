"use client";
import { useFormState } from "react-dom";
import { useMemo, useState } from "react";
import Link from "next/link";
import { createTrip } from "@/lib/actions/trips";

const initial = { error: undefined as string | undefined };
const CATS = ["Flight", "Hotel", "Activity", "Transfer", "Cruise", "Dining", "Insurance", "Fee", "Other"];

type Item = {
  id?: string;
  category: string;
  description: string;
  detail: string;
  qty: number;
  unit_price: number;
  is_optional: boolean;
};
const blank = (): Item => ({ category: "Hotel", description: "", detail: "", qty: 1, unit_price: 0, is_optional: false });

const money = (n: number) => (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function TripBuilderForm({
  clients,
  preselect,
  trip,
  items: existingItems,
  action,
}: {
  clients: { id: string; name: string }[];
  preselect: string;
  /** Present when editing an existing trip; absent when creating one. */
  trip?: any;
  items?: any[];
  /** Defaults to createTrip; the edit route passes updateTrip. */
  action?: any;
}) {
  const editing = !!trip;
  const [state, formAction] = useFormState(action || createTrip, initial);

  const [items, setItems] = useState<Item[]>(
    existingItems && existingItems.length
      ? existingItems.map((it) => ({
          id: String(it.id),
          category: it.category || "Other",
          description: it.description || "",
          detail: it.detail || "",
          qty: Number(it.qty) || 1,
          unit_price: Number(it.unit_price) || 0,
          is_optional: !!it.is_optional,
        }))
      : [blank()]
  );

  // An existing trip stores an absolute evp_fee, not the percent/flat split it
  // was built from. Seeding the flat field with that amount reproduces the
  // stored fee exactly; setting a percent recalculates from vendor cost.
  const [feePct, setFeePct] = useState(0);
  const [flatFee, setFlatFee] = useState(editing ? Number(trip.evp_fee) || 0 : 0);
  const [travelers, setTravelers] = useState(
    editing ? Number(trip.total_people) || Number(trip.planned_travelers) || 0 : 2
  );

  const set = (i: number, k: keyof Item, v: any) => setItems((r) => r.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const add = () => setItems((r) => [...r, blank()]);
  const del = (i: number) => setItems((r) => (r.length === 1 ? [blank()] : r.filter((_, idx) => idx !== i)));

  const { vendor, fee, total, per } = useMemo(() => {
    const vendor = items.reduce((a, it) => a + (Number(it.qty) || 1) * (Number(it.unit_price) || 0), 0);
    const fee = flatFee + vendor * (feePct / 100);
    const total = vendor + fee;
    const per = travelers > 0 ? total / travelers : 0;
    return { vendor, fee, total, per };
  }, [items, feePct, flatFee, travelers]);

  return (
    <>
      <div className="topbar">
        <h1>{editing ? "Edit Trip" : "Trip Builder"}</h1>
        <div className="spacer" />
        {editing ? (
          <>
            <Link href={`/trips/${trip.slug}`} className="badge">← Trip</Link>
            <Link href={`/trips/${trip.slug}/quote`} className="badge">Quote</Link>
          </>
        ) : (
          <Link href="/pipeline" className="badge">← Pipeline</Link>
        )}
      </div>
      <div className="content">
        <p className="pagelead">
          {editing
            ? "Change any line, price or date and save. The quote reflects it immediately — including a quote you have already sent, since the link stays the same."
            : "Compose the trip line by line. Your cost, your fee, and the client price update as you go — then generate a branded quote to send."}
        </p>
        {state?.error && <div className="err" style={{ maxWidth: 820 }}>{state.error}</div>}

        <form action={formAction}>
          <input type="hidden" name="items_json" value={JSON.stringify(items)} />
          <input type="hidden" name="fee_pct" value={feePct} />
          <input type="hidden" name="flat_fee" value={flatFee} />
          <input type="hidden" name="travelers" value={travelers} />
          {editing && <input type="hidden" name="trip_id" value={trip.id} />}
          {editing && <input type="hidden" name="slug" value={trip.slug} />}

          <div className="formcard">
            <div className="eyebrow" style={{ color: "var(--slate)" }}>Trip</div>
            <div className="frow">
              <div className="field" style={{ flex: 2 }}><label>Trip name</label><input name="name" placeholder="Napa Valley Anniversary" defaultValue={trip?.name || ""} required /></div>
              <div className="field"><label>Type</label><select name="kind" defaultValue={trip?.kind || "private"}><option value="private">Private</option><option value="group">Group</option><option value="corporate">Corporate</option><option value="sports">Sports</option></select></div>
              <div className="field"><label>Stage</label><select name="stage" defaultValue={trip?.stage || "Proposal Sent"}><option>Lead</option><option>Proposal Sent</option><option>Booked</option><option>Final Payment</option><option>Pre-Trip</option><option>Traveling</option><option>Completed</option></select></div>
            </div>
            <div className="frow">
              <div className="field"><label>Client (on file)</label><select name="client_id" defaultValue={trip?.client_id || preselect}><option value="">— none / new —</option>{clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
              <div className="field"><label>Or client name</label><input name="client_name" placeholder="If not on file yet" defaultValue={trip?.client_name || ""} /></div>
              <div className="field"><label>Travelers</label><input type="number" min={0} value={travelers} onChange={(e) => setTravelers(parseInt(e.target.value) || 0)} name="travelers_display" /></div>
            </div>
            <div className="frow">
              <div className="field" style={{ flex: 2 }}><label>Destination</label><input name="destination" placeholder="Napa, CA" defaultValue={trip?.destination || ""} /></div>
              <div className="field"><label>Start</label><input name="start_date" type="date" defaultValue={trip?.start_date || ""} /></div>
              <div className="field"><label>End</label><input name="end_date" type="date" defaultValue={trip?.end_date || ""} /></div>
            </div>
            <div className="field"><label>One-line pitch (shows on the quote)</label><input name="summary" placeholder="Four nights in wine country, handled end to end." defaultValue={trip?.summary || ""} /></div>
          </div>

          <div className="formcard">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="eyebrow" style={{ color: "var(--slate)" }}>Itinerary &amp; pricing</div>
              <button type="button" className="btn ghost" onClick={add}>+ Add line</button>
            </div>
            <table style={{ marginTop: 10 }}>
              <thead><tr><th style={{ width: 110 }}>Category</th><th>Description</th><th className="r" style={{ width: 70 }}>Qty</th><th className="r" style={{ width: 120 }}>Unit price</th><th className="r" style={{ width: 110 }}>Line</th><th style={{ width: 70 }}>Opt.</th><th></th></tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={it.id || `new-${i}`}>
                    <td><select value={it.category} onChange={(e) => set(i, "category", e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></td>
                    <td>
                      <input value={it.description} onChange={(e) => set(i, "description", e.target.value)} placeholder="Auberge du Soleil — 4 nights, deluxe king" />
                      <input value={it.detail} onChange={(e) => set(i, "detail", e.target.value)} placeholder="Detail shown under the line (optional)" style={{ marginTop: 5, fontSize: 12.5 }} />
                    </td>
                    <td className="r"><input type="number" min={0} value={it.qty} onChange={(e) => set(i, "qty", parseFloat(e.target.value) || 0)} style={{ textAlign: "right", width: 60 }} /></td>
                    <td className="r"><input type="number" min={0} value={it.unit_price} onChange={(e) => set(i, "unit_price", parseFloat(e.target.value) || 0)} style={{ textAlign: "right", width: 110 }} /></td>
                    <td className="r mono">{money((Number(it.qty) || 1) * (Number(it.unit_price) || 0))}</td>
                    <td style={{ textAlign: "center" }}><input type="checkbox" checked={it.is_optional} onChange={(e) => set(i, "is_optional", e.target.checked)} /></td>
                    <td className="r"><button type="button" onClick={() => del(i)} className="linkbtn" aria-label="Remove line">{"✕"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
            <div className="formcard">
              <div className="eyebrow" style={{ color: "var(--slate)" }}>Your fee</div>
              <div className="frow">
                <div className="field"><label>Fee % of cost</label><input type="number" min={0} value={feePct} onChange={(e) => setFeePct(parseFloat(e.target.value) || 0)} /></div>
                <div className="field"><label>+ Flat fee</label><input type="number" min={0} value={flatFee} onChange={(e) => setFlatFee(parseFloat(e.target.value) || 0)} /></div>
                <div className="field"><label>Deposit %</label><input name="deposit_pct" type="number" min={0} defaultValue={trip?.deposit_pct ?? 25} /></div>
              </div>
              {editing && (
                <p className="muted" style={{ fontSize: 12.5, margin: "10px 0 0" }}>
                  This trip&apos;s saved fee is loaded as a flat amount, because only the total is stored. Set a percent to recalculate it from vendor cost.
                </p>
              )}
              <div className="field" style={{ marginTop: 14 }}><label>Quote notes / what&apos;s included</label><textarea name="quote_notes" rows={3} placeholder="Rates held until Friday. Includes all coordination; excludes airfare." defaultValue={trip?.quote_notes || ""} /></div>
            </div>
            <div className="formcard" style={{ background: "var(--deep)", color: "#fff", borderColor: "var(--deep)" }}>
              <div className="eyebrow">Live totals</div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.15)" }}><span>Vendor cost</span><span className="mono">{money(vendor)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.15)" }}><span style={{ color: "var(--brass)" }}>EVP fee</span><span className="mono" style={{ color: "var(--brass)" }}>{money(fee)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 20 }}><span>Client total</span><span className="mono">{money(total)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,.7)", fontSize: 13 }}><span>Per person ({travelers})</span><span className="mono">{money(per)}</span></div>
              {vendor === 0 && (
                <p style={{ color: "var(--brass)", fontSize: 12.5, margin: "12px 0 0", lineHeight: 1.45 }}>
                  No priced lines yet, so the client total is just your fee. Add itinerary lines before sending this quote.
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn" type="submit">{editing ? "Save changes" : "Create trip & quote"}</button>
            <Link href={editing ? `/trips/${trip.slug}` : "/pipeline"} className="btn ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
