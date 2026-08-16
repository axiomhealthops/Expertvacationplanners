import { requireRole } from "@/lib/auth";
import { STAFF } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";
import { money, money2 } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Fora() {
  await requireRole(STAFF);
  const sb = supabaseServer();
  const { data: rows } = await sb
    .from("fora_bookings")
    .select("*, trips(name)")
    .order("created_at", { ascending: false });

  const list = rows || [];
  const total = (s: string) => list.filter((r) => r.status === s).reduce((a, r) => a + Number(r.commission_amount || 0), 0);
  const grand = list.reduce((a, r) => a + Number(r.commission_amount || 0), 0);

  return (
    <>
      <div className="topbar">
        <h1>Commissions &amp; Fora</h1>
        <div className="spacer" />
        <span className="badge navy">Staff only</span>
      </div>
      <div className="content">
        <p className="pagelead">
          EVP has no IATA number — bookings are placed through Liam&apos;s Fora host-agency account to earn
          commission. This ledger tracks every Fora-placed booking: expected, invoiced, and received. Clients and
          clubs never see it.
        </p>
        <div className="kpis">
          <div className="kpi"><div className="u">Expected</div><div className="v">{money(total("expected"))}</div></div>
          <div className="kpi"><div className="u">Invoiced</div><div className="v">{money(total("invoiced"))}</div></div>
          <div className="kpi"><div className="u">Received</div><div className="v">{money(total("received"))}</div></div>
          <div className="kpi"><div className="u">Total Commission</div><div className="v">{money(grand)}</div></div>
        </div>
        <div className="tablecard">
          <table>
            <thead>
              <tr><th>Trip</th><th>Supplier</th><th>Reference</th><th className="r">Booking</th><th className="r">Rate</th><th className="r">Commission</th><th>Status</th></tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.trips?.name || "—"}</td>
                  <td>{r.supplier}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{r.fora_reference || "—"}</td>
                  <td className="r">{money2(r.amount)}</td>
                  <td className="r">{(Number(r.commission_rate) * 100).toFixed(0)}%</td>
                  <td className="r">{money2(r.commission_amount)}</td>
                  <td><span className={`badge ${r.status === "received" ? "good" : r.status === "invoiced" ? "warn" : ""}`}>{r.status}</span></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7} className="muted">No Fora bookings recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
