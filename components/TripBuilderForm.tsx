"use client";
import { useFormState } from "react-dom";
import { useMemo, useState } from "react";
import Link from "next/link";
import { createTrip } from "@/lib/actions/trips";

const initial = { error: undefined as string | undefined };
const CATS = ["Flight", "Hotel", "Activity", "Transfer", "Cruise", "Dining", "Insurance", "Fee", "Other"];

type Item = { category: string; description: string; detail: string; qty: number; unit_price: number; is_optional: boolean };
const blank = (): Item => ({ category: "Hotel", description: "", detail: "", qty: 1, unit_price: 0, is_optional: false });

const money = (n: number) => (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function TripBuilderForm({ clients, preselect }: { clients: { id: string; name: string }[]; preselect: string }) {
  const [state, action] = useFormState(createTrip, initial);
  const [items, setItems] = useState<Item[]>([blank()]);
  const [feePct, setFeePct] = useState(15);
  const [flatFee, setFlatFee] = useState(0);
  const [travelers, setTravelers] = useState(2);

  const set = (i: number, k: keyof Item, v: any) => setItems((r) => r.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const add = () => setItems((r) => [...r, blank()]);
  const del = (i: number) => setItems((r) => r.filter((_, idx) => idx !== i));

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
        <h1>Trip Builder</h1>
        <div className="spacer" />
        <Link href="/pipeline" className="badge">← Pipeline</Link>
      </div>
      <div className="content">
        <p className="pagelead">Compose the trip line by line. Your cost, your fee, and the client price update as you go — then generate a branded quote to send.</p>
        {state?.error && <div className="err" style={{ maxWidth: 820 }}>{state.error}</div>}

        <form action={action}>
          <input type="hidden" name="items_json" value={JSON.stringify(items)} />
          <input type="hidden" name="fee_pct" value={feePct} />
          <input type="hidden" name="flat_fee" value={flatFee} />
          <input type="hidden" name="travelers" value={travelers} />

          <div className="formcard">
            <div className="eyebrow" style={{ color: "var(--slate)" }}>Trip</div>
            <div className="frow">
              <div className="field" style={{ flex: 2 }}><label>Trip name</label><input name="name" placeholder="Napa Valley Anniversary" required /></div>
              <div className="field"><label>Type</label><select name="kind" defaultValue="private"><option value="private">Private</option><option value="group">Group</option><option value="corporate">Corporate</option><option value="sports">Sports</option></select></div>
              <div className="field"><label>Stage</label><select name="stage" defaultValue="Proposal Sent"><option>Lead</option><option>Proposal Sent</option><option>Booked</option></select></div>
            </div>
            <div className="frow">
              <div className="field"><label>Client (on file)</label><select name="client_id" defaultValue={preselect}><option value="">— none / new —</option>{clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
              <div className="field"><label>Or client name</label><input name="client_name" placeholder="If not on file yet" /></div>
              <div className="field"><label>Travelers</label><input type="number" min={0} value={travelers} onChange={(e) => setTravelers(parseInt(e.target.value) || 0)} name="travelers_display" /></div>
            </div>
            <div className="frow">
              <div className="field" style={{ flex: 2 }}><label>Destination</label><input name="destination" placeholder="Napa, CA" /></div>
              <div className="field"><label>Start</label><input name="start_date" type="date" /></div>
              <div className="field"><label>End</label><input name="end_date" type="date" /></div>
            </div>
            <div className="field"><label>One-line pitch (shows on the quote)</label><input name="summary" placeholder="Four nights in wine country, handled end to end." /></div>
          </div>

          <div className="formcard">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="eyebrow" style={{ color: "var(--slate)" }}>Itinerary & pricing</div>
              <button type="button" className="btn ghost" onClick={add}>+ Add line</button>
            </div>
            <table style={{ marginTop: 10 }}>
              <thead><tr><th style={{ width: 110 }}>Category</th><th>Description</th><th className="r" style={{ width: 70 }}>Qty</th><th className="r" style={{ width: 120 }}>Unit price</th><th className="r" style={{ width: 110 }}>Line</th><th style={{ width: 70 }}>Opt.</th><th></th></tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td><select value={it.category} onChange={(e) => set(i, "category", e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></td>
                    <td><input value={it.description} onChange={(e) => set(i, "description", e.target.value)} placeholder="Auberge du Soleil — 4 nights, deluxe king" /></td>
                    <td className="r"><input type="number" min={0} value={it.qty} onChange={(e) => set(i, "qty", parseFloat(e.target.value) || 0)} style={{ textAlign: "right", width: 60 }} /></td>
                    <td className="r"><input type="number" min={0} value={it.unit_price} onChange={(e) => set(i, "unit_price", parseFloat(e.target.value) || 0)} style={{ textAlign: "right", width: 110 }} /></td>
                    <td className="r mono">{money((Number(it.qty) || 1) * (Number(it.unit_price) || 0))}</td>
                    <td style={{ textAlign: "center" }}><input type="checkbox" checked={it.is_optional} onChange={(e) => set(i, "is_optional", e.target.checked)} /></td>
                    <td className="r"><button type="button" onClick={() => del(i)} className="linkbtn">✕</button></td>
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
                <div className="field"><label>Deposit %</label><input name="deposit_pct" type="number" min={0} defaultValue={25} /></div>
              </div>
              <div className="field"><label>Quote notes / what&apos;s included</label><textarea name="quote_notes" rows={3} placeholder="Rates held until Friday. Includes all coordination; excludes airfare." /></div>
            </div>
            <div className="formcard" style={{ background: "var(--deep)", color: "#fff", borderColor: "var(--deep)" }}>
              <div className="eyebrow">Live totals</div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.15)" }}><span>Vendor cost</span><span className="mono">{money(vendor)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.15)" }}><span style={{ color: "var(--brass)" }}>EVP fee</span><span className="mono" style={{ color: "var(--brass)" }}>{money(fee)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 20 }}><span>Client total</span><span className="mono">{money(total)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,.7)", fontSize: 13 }}><span>Per person ({travelers})</span><span className="mono">{money(per)}</span></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn" type="submit">Create trip & quote</button>
            <Link href="/pipeline" className="btn ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
