import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { STAFF } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Clients() {
  await requireRole(STAFF);
  const sb = supabaseServer();
  const { data: clients } = await sb
    .from("clients")
    .select("id,first_name,last_name,email,phone,status,created_at")
    .order("created_at", { ascending: false });
  const list = clients || [];

  return (
    <>
      <div className="topbar">
        <h1>Clients</h1>
        <div className="spacer" />
        <span className="badge navy">{list.length} clients</span>
        <Link className="btn" href="/clients/new">+ New Client</Link>
      </div>
      <div className="content">
        <p className="pagelead">Your book of clients — every traveler you&apos;ve set up, with the profile that powers their trips and quotes.</p>
        <div className="tablecard">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/clients/${c.id}`}>{`${c.first_name || ""} ${c.last_name || ""}`.trim() || "—"}</Link></td>
                  <td className="muted">{c.email}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{c.phone}</td>
                  <td><span className={`badge ${c.status === "prospect" ? "warn" : "good"}`}>{c.status}</span></td>
                  <td className="r"><Link href={`/trips/new?client=${c.id}`} className="badge brass">Build trip →</Link></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="muted">No clients yet. Add your first with “+ New Client”.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
