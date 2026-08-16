import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { STAFF } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";
import { money, money2, dateRange, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS = [
  ["overview", "Overview"],
  ["roster", "Roster"],
  ["money", "Money"],
  ["comms", "Comms"],
] as const;

export default async function TripDetail({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tab?: string };
}) {
  await requireRole(STAFF);
  const sb = supabaseServer();
  const tab = searchParams.tab || "overview";

  const { data: trip } = await sb.from("trips").select("*").eq("slug", params.slug).single();
  if (!trip) notFound();

  const [{ data: teams }, { data: budget }, { data: contacts }, { data: comms }, { data: hotels }, { data: fora }] =
    await Promise.all([
      sb.from("trip_teams").select("*").eq("trip_id", trip.id),
      sb.from("budget_lines").select("*").eq("trip_id", trip.id).order("sort"),
      sb.from("contacts").select("*").eq("trip_id", trip.id),
      sb.from("comms").select("*").eq("trip_id", trip.id).order("c_date", { ascending: false }),
      sb.from("hotels").select("*").eq("trip_id", trip.id).order("sort"),
      sb.from("fora_bookings").select("*").eq("trip_id", trip.id),
    ]);

  const lines = budget || [];
  const cost = lines.reduce((a, l) => a + Number(l.amount || 0), 0);
  const paid = lines.reduce((a, l) => a + Number(l.deposit_paid || 0), 0);
  const commExpected = (fora || []).reduce((a, f) => a + Number(f.commission_amount || 0), 0);
  const revenue = Number(trip.evp_fee || 0) + commExpected;

  return (
    <>
      <div className="topbar">
        <h1 style={{ fontSize: 20 }}>{trip.name}</h1>
        <div className="spacer" />
        <Link href="/pipeline" className="badge">← Pipeline</Link>
        <span className="badge navy">{trip.stage}</span>
        <Link href={`/trips/${trip.slug}/quote`} className="btn">View Quote</Link>
      </div>
      <div className="content">
        <div className="facts muted" style={{ fontSize: 13, display: "flex", gap: 18, flexWrap: "wrap" }}>
          <span>{trip.destination}</span>
          <span className="mono">{dateRange(trip.start_date, trip.end_date)}</span>
          <span>{trip.client_name}</span>
          <span className="badge">{trip.kind}</span>
        </div>

        <div className="tabs">
          {TABS.map(([key, label]) => (
            <Link key={key} href={`/trips/${trip.slug}?tab=${key}`} className={tab === key ? "active" : ""}>
              {label}
            </Link>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <div className="kpis">
              <div className="kpi"><div className="u">Travelers</div><div className="v">{trip.total_people || trip.planned_travelers || 0}</div></div>
              <div className="kpi"><div className="u">Per Person</div><div className="v">{money(trip.per_person)}</div></div>
              <div className="kpi"><div className="u">EVP Fee</div><div className="v">{money(trip.evp_fee)}</div></div>
              <div className="kpi"><div className="u">Total EVP Revenue</div><div className="v">{money(revenue)}</div><div className="s">fee + Fora commission</div></div>
            </div>
            {hotels && hotels.length > 0 && (
              <>
                <div className="section-title"><h2>Hotel Block</h2><span className="line" /></div>
                <div className="tablecard">
                  <table>
                    <thead><tr><th>Hotel</th><th>Tier</th><th>Distance</th><th className="r">Rate / nt</th></tr></thead>
                    <tbody>
                      {hotels.map((h) => (
                        <tr key={h.id}>
                          <td>{h.name}{h.upgraded ? <span className="badge brass" style={{ marginLeft: 8 }}>Upgraded</span> : null}</td>
                          <td className="muted">{h.tier}</td>
                          <td className="muted">{h.distance}</td>
                          <td className="r">{money(h.rate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {tab === "roster" && (
          <div className="tablecard">
            {teams && teams.length > 0 && (
              <table>
                <thead><tr><th>Team</th><th className="r">Players</th><th>Note</th></tr></thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id}><td>{t.name}</td><td className="r">{t.players}</td><td className="muted">{t.note}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            <table>
              <thead><tr><th>Party</th><th>Team</th><th>Email</th><th>Mobile</th><th>Next step</th></tr></thead>
              <tbody>
                {(contacts || []).map((c) => (
                  <tr key={c.id}>
                    <td>{c.player_name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.group_tag}</td>
                    <td className="muted">{c.team}</td>
                    <td className="muted">{c.email}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{c.mobile}</td>
                    <td className="muted">{c.next_step}</td>
                  </tr>
                ))}
                {(!contacts || contacts.length === 0) && (
                  <tr><td colSpan={5} className="muted">No parties on this trip yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "money" && (
          <>
            <div className="kpis">
              <div className="kpi"><div className="u">Cost of Trip</div><div className="v">{money(cost)}</div></div>
              <div className="kpi"><div className="u">Deposits Paid</div><div className="v">{money(paid)}</div><div className="s">{money(cost - paid)} still owed</div></div>
              <div className="kpi"><div className="u">EVP Fee</div><div className="v">{money(trip.evp_fee)}</div></div>
              <div className="kpi"><div className="u">Fora Commission</div><div className="v">{money(commExpected)}</div></div>
            </div>
            <div className="tablecard">
              <table>
                <thead><tr><th>Category</th><th>Item</th><th className="r">Amount</th><th className="r">Paid</th><th>Commission</th></tr></thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td className="muted">{l.category}</td>
                      <td>{l.item}</td>
                      <td className="r">{money2(l.amount)}</td>
                      <td className="r">{money2(l.deposit_paid)}</td>
                      <td>{l.commissionable ? <span className="badge good">{l.comm_status} · {Number(l.comm_rate) * 100}%</span> : <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                  {lines.length === 0 && <tr><td colSpan={5} className="muted">No budget lines yet.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="notice" style={{ marginTop: 16 }}>
              Money — EVP fee, margins, and Fora commissions — is visible to staff only. Clients and clubs never see this tab.
            </p>
          </>
        )}

        {tab === "comms" && (
          <div className="tablecard">
            <table>
              <thead><tr><th>Date</th><th>Dir</th><th>Channel</th><th>Subject</th><th>Status</th><th>Follow-up</th></tr></thead>
              <tbody>
                {(comms || []).map((c) => (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{shortDate(c.c_date)}</td>
                    <td className="muted">{c.direction}</td>
                    <td className="muted">{c.channel}</td>
                    <td>{c.subject}</td>
                    <td><span className="badge">{c.status}</span></td>
                    <td className="mono" style={{ fontSize: 12 }}>{shortDate(c.follow_up)}</td>
                  </tr>
                ))}
                {(!comms || comms.length === 0) && <tr><td colSpan={6} className="muted">No logged communication yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
