"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/actions/clients";

const initial = { error: undefined as string | undefined };

type Loy = { program: string; number: string; tier: string };

export default function NewClient() {
  const [state, action] = useFormState(createClient, initial);
  const [loyalty, setLoyalty] = useState<Loy[]>([{ program: "", number: "", tier: "" }]);

  const setLoy = (i: number, k: keyof Loy, v: string) =>
    setLoyalty((rows) => rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  return (
    <>
      <div className="topbar">
        <h1>New Client</h1>
        <div className="spacer" />
        <Link href="/clients" className="badge">← All clients</Link>
      </div>
      <div className="content">
        <p className="pagelead">
          Capture everything you need to book and service this traveler — once. It flows into every trip and quote you build for them.
        </p>
        {state?.error && <div className="err" style={{ maxWidth: 780 }}>{state.error}</div>}

        <form action={action}>
          <input type="hidden" name="loyalty_json" value={JSON.stringify(loyalty.filter((l) => l.program || l.number))} />

          <div className="formcard">
            <div className="eyebrow" style={{ color: "var(--slate)" }}>Personal</div>
            <div className="frow">
              <div className="field"><label>First name</label><input name="first_name" /></div>
              <div className="field"><label>Last name</label><input name="last_name" /></div>
            </div>
            <div className="frow">
              <div className="field"><label>Email</label><input name="email" type="email" /></div>
              <div className="field"><label>Phone</label><input name="phone" /></div>
              <div className="field"><label>Date of birth</label><input name="dob" type="date" /></div>
            </div>
            <div className="frow">
              <div className="field" style={{ flex: 2 }}><label>Address</label><input name="addr_line1" placeholder="Street" /></div>
              <div className="field"><label>City</label><input name="addr_city" /></div>
              <div className="field"><label>State</label><input name="addr_state" /></div>
              <div className="field"><label>Zip</label><input name="addr_zip" /></div>
              <div className="field"><label>Country</label><input name="addr_country" defaultValue="USA" /></div>
            </div>
          </div>

          <div className="formcard">
            <div className="eyebrow" style={{ color: "var(--slate)" }}>Travel documents</div>
            <div className="frow">
              <div className="field"><label>Passport number</label><input name="passport_number" /></div>
              <div className="field"><label>Passport country</label><input name="passport_country" defaultValue="USA" /></div>
              <div className="field"><label>Passport expiry</label><input name="passport_expiry" type="date" /></div>
            </div>
            <div className="frow">
              <div className="field"><label>Known Traveler # (TSA Pre)</label><input name="ktn" /></div>
              <div className="field"><label>Redress #</label><input name="redress" /></div>
            </div>
          </div>

          <div className="formcard">
            <div className="eyebrow" style={{ color: "var(--slate)" }}>Loyalty & rewards</div>
            {loyalty.map((l, i) => (
              <div className="frow" key={i}>
                <div className="field"><label>Program</label><input value={l.program} onChange={(e) => setLoy(i, "program", e.target.value)} placeholder="Marriott Bonvoy, Delta SkyMiles…" /></div>
                <div className="field"><label>Member #</label><input value={l.number} onChange={(e) => setLoy(i, "number", e.target.value)} /></div>
                <div className="field"><label>Tier</label><input value={l.tier} onChange={(e) => setLoy(i, "tier", e.target.value)} placeholder="Gold, Platinum…" /></div>
              </div>
            ))}
            <button type="button" className="btn ghost" onClick={() => setLoyalty((r) => [...r, { program: "", number: "", tier: "" }])}>+ Add program</button>
          </div>

          <div className="formcard">
            <div className="eyebrow" style={{ color: "var(--slate)" }}>Preferences & restrictions</div>
            <div className="frow">
              <div className="field"><label>Seat preference</label><input name="seat_pref" placeholder="Aisle, window, bulkhead…" /></div>
              <div className="field"><label>Meal preference</label><input name="meal_pref" /></div>
              <div className="field"><label>Dietary</label><input name="dietary" placeholder="Vegetarian, gluten-free…" /></div>
            </div>
            <div className="field"><label>Travel restrictions (mobility, medical, allergies)</label><textarea name="restrictions" rows={2} /></div>
          </div>

          <div className="formcard">
            <div className="eyebrow" style={{ color: "var(--slate)" }}>Emergency contact & notes</div>
            <div className="frow">
              <div className="field"><label>Contact name</label><input name="ec_name" /></div>
              <div className="field"><label>Contact phone</label><input name="ec_phone" /></div>
              <div className="field"><label>Relationship</label><input name="ec_relation" /></div>
            </div>
            <div className="field"><label>Internal notes</label><textarea name="notes" rows={2} placeholder="Anything that helps you serve them well." /></div>
            <div className="field" style={{ maxWidth: 220 }}>
              <label>Status</label>
              <select name="status"><option value="active">Active client</option><option value="prospect">Prospect</option></select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button className="btn" type="submit">Save client</button>
            <Link href="/clients" className="btn ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
