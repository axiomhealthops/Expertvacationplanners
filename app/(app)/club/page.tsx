import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { dateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

// Sport Club portal — the club sees only their own events, teams, and the
// hotel block. No EVP fee/margin/commission is ever queried here.
export default async function ClubPortal() {
  const u = await requireRole(["sport_club"]);
  const sb = supabaseServer();

  const { data: trips } = await sb
    .from("trips")
    .select("id,name,destination,venue,stage,start_date,end_date,total_people")
    .order("start_date", { ascending: true, nullsFirst: false });

  const list = trips || [];
  const tripIds = list.map((t) => t.id);
  const [{ data: teams }, { data: hotels }] = await Promise.all([
    tripIds.length ? sb.from("trip_teams").select("*").in("trip_id", tripIds) : Promise.resolve({ data: [] as any[] }),
    tripIds.length ? sb.from("hotels").select("*").in("trip_id", tripIds).order("sort") : Promise.resolve({ data: [] as any[] }),
  ]);

  return (
    <>
      <div className="topbar">
        <h1 style={{ fontSize: 20 }}>Our Trips &amp; Teams</h1>
        <div className="spacer" />
        <span className="badge brass">EVP Sports</span>
      </div>
      <div className="content">
        <p className="pagelead">
          Your club&apos;s upcoming travel — teams, dates, and the hotel block held for your families. Booking runs
          through the block so everyone stays together, one floor, one rate.
        </p>

        {list.length === 0 && <div className="notice">No trips assigned to your club yet. Liam will add them here.</div>}

        {list.map((t) => {
          const tTeams = (teams || []).filter((x) => x.trip_id === t.id);
          const tHotels = (hotels || []).filter((x) => x.trip_id === t.id);
          return (
            <div className="card" key={t.id} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ fontFamily: "var(--display)", fontSize: 20, textTransform: "uppercase" }}>{t.name}</h3>
                <span className="badge navy">{t.stage}</span>
              </div>
              <div className="facts muted" style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, marginTop: 6 }}>
                <span>{t.venue || t.destination}</span>
                <span className="mono">{dateRange(t.start_date, t.end_date)}</span>
                <span>{t.total_people || 0} traveling</span>
              </div>

              {tTeams.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="eyebrow" style={{ color: "var(--slate)" }}>Teams</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                    {tTeams.map((tm) => (
                      <span key={tm.id} className="badge">{tm.name} · {tm.players}</span>
                    ))}
                  </div>
                </div>
              )}

              {tHotels.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="eyebrow" style={{ color: "var(--slate)" }}>Hotel Block</div>
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
      </div>
    </>
  );
}
