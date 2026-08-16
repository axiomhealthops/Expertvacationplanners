import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { STAFF } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";
import { shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #eef1f5" }}>
      <div style={{ width: 190, color: "var(--slate)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "var(--mono)" }}>{label}</div>
      <div style={{ flex: 1 }}>{value}</div>
    </div>
  );
}

export default async function ClientDetail({ params }: { params: { id: string } }) {
  await requireRole(STAFF);
  const sb = supabaseServer();
  const { data: c } = await sb.from("clients").select("*").eq("id", params.id).single();
  if (!c) notFound();

  const { data: trips } = await sb
    .from("trips").select("slug,name,stage,start_date,end_date").eq("client_id", c.id)
    .order("start_date", { ascending: false });

  const addr = c.address || {};
  const ec = c.emergency_contact || {};
  const loyalty: any[] = Array.isArray(c.loyalty) ? c.loyalty : [];
  const full = `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Client";

  return (
    <>
      <div className="topbar">
        <h1 style={{ fontSize: 20 }}>{full}</h1>
        <div className="spacer" />
        <Link href="/clients" className="badge">← Clients</Link>
        <Link href={`/trips/new?client=${c.id}`} className="btn">Build a trip</Link>
      </div>
      <div className="content">
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
          <div className="card">
            <h3>Contact</h3>
            <Row label="Email" value={c.email} />
            <Row label="Phone" value={c.phone} />
            <Row label="Date of birth" value={shortDate(c.dob)} />
            <Row label="Address" value={[addr.line1, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(", ")} />
            <Row label="Emergency" value={ec.name ? `${ec.name} (${ec.relation || "—"}) ${ec.phone || ""}` : null} />
          </div>
          <div className="card">
            <h3>Travel profile</h3>
            <Row label="Passport" value={c.passport_number ? `${c.passport_number} · ${c.passport_country || ""}${c.passport_expiry ? " · exp " + shortDate(c.passport_expiry) : ""}` : null} />
            <Row label="Known Traveler #" value={c.known_traveler_number} />
            <Row label="Redress #" value={c.redress_number} />
            <Row label="Seat / meal" value={[c.seat_pref, c.meal_pref].filter(Boolean).join(" · ")} />
            <Row label="Dietary" value={c.dietary} />
            <Row label="Restrictions" value={c.travel_restrictions} />
          </div>
        </div>

        {loyalty.length > 0 && (
          <>
            <div className="section-title"><h2>Loyalty & rewards</h2><span className="line" /></div>
            <div className="tablecard"><table><thead><tr><th>Program</th><th>Member #</th><th>Tier</th></tr></thead><tbody>
              {loyalty.map((l, i) => (<tr key={i}><td>{l.program}</td><td className="mono" style={{ fontSize: 12 }}>{l.number}</td><td className="muted">{l.tier}</td></tr>))}
            </tbody></table></div>
          </>
        )}

        <div className="section-title"><h2>Trips</h2><span className="line" /></div>
        <div className="tablecard"><table><thead><tr><th>Trip</th><th>Stage</th><th>Dates</th></tr></thead><tbody>
          {(trips || []).map((t) => (<tr key={t.slug}><td><Link href={`/trips/${t.slug}`}>{t.name}</Link></td><td><span className="badge navy">{t.stage}</span></td><td className="mono" style={{ fontSize: 12 }}>{shortDate(t.start_date)}</td></tr>))}
          {(!trips || trips.length === 0) && <tr><td colSpan={3} className="muted">No trips yet. <Link href={`/trips/new?client=${c.id}`}>Build one →</Link></td></tr>}
        </tbody></table></div>

        {c.notes && <div className="notice" style={{ marginTop: 18 }}>{c.notes}</div>}
      </div>
    </>
  );
}
