import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { dateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

// Travel Client + Sport Client portal. Shows the trips the user can see (RLS),
// as a friendly itinerary — never any EVP fee, margin, or commission.
export default async function MyPortal() {
  const u = await requireRole(["travel_client", "sport_client"]);
  const sb = supabaseServer();

  const { data: trips } = await sb
    .from("trips")
    .select("id,name,destination,venue,stage,start_date,end_date,per_person,extras,stay_to_play")
    .order("start_date", { ascending: true, nullsFirst: false });

  const list = trips || [];
  const tripIds = list.map((t) => t.id);
  const { data: hotels } = tripIds.length
    ? await sb.from("hotels").select("*").in("trip_id", tripIds).order("sort")
    : { data: [] as any[] };

  const statusLabel: Record<string, string> = {
    Lead: "Planning", "Proposal Sent": "Proposal sent to you", Booked: "Confirmed",
    "Final Payment": "Final payment due", "Pre-Trip": "Getting ready", Traveling: "Traveling now", Completed: "Completed",
  };

  return (
    <>
      <div className="topbar">
        <h1 style={{ fontSize: 20 }}>My Trips</h1>
        <div className="spacer" />
        <span className="badge brass">Expert Vacation Planners</span>
      </div>
      <div className="content">
        <p className="pagelead">
          Your trip details in one place — dates, where you&apos;re staying, and where things stand. Questions go
          straight to Liam.
        </p>

        {list.length === 0 && <div className="notice">No trips on your account yet. Once Liam sets yours up, it appears here.</div>}

        {list.map((t) => {
          const tHotels = (hotels || []).filter((x) => x.trip_id === t.id);
          const ex = (t.extras || {}) as Record<string, any>;
          return (
            <div className="card" key={t.id} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ fontFamily: "var(--display)", fontSize: 22, textTransform: "uppercase" }}>{t.name}</h3>
                <span className="badge good">{statusLabel[t.stage] || t.stage}</span>
              </div>
              <div className="facts muted" style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, marginTop: 6 }}>
                <span>{t.venue || t.destination}</span>
                <span className="mono">{dateRange(t.start_date, t.end_date)}</span>
                {Number(t.per_person) > 0 && <span className="mono">${Number(t.per_person).toFixed(0)} / person</span>}
              </div>

              {ex.pkg_includes && Array.isArray(ex.pkg_includes) && ex.pkg_includes.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="eyebrow" style={{ color: "var(--slate)" }}>What&apos;s included</div>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--slate)", fontSize: 13.5 }}>
                    {ex.pkg_includes.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {tHotels.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="eyebrow" style={{ color: "var(--slate)" }}>Where you&apos;re staying</div>
                  <table style={{ marginTop: 6 }}>
                    <thead><tr><th>Hotel</th><th>Distance</th><th className="r">Rate / night</th></tr></thead>
                    <tbody>
                      {tHotels.map((h) => (
                        <tr key={h.id}><td>{h.name}</td><td className="muted">{h.distance}</td><td className="r">${Number(h.rate).toFixed(0)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        <div className="notice" style={{ marginTop: 8 }}>
          Liam · (407) 401-0754 · admin@expertvacationplanners.com
        </div>
      </div>
    </>
  );
}
