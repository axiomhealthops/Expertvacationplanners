import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { STAFF } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CRM() {
  await requireRole(STAFF);
  const sb = supabaseServer();
  const { data: contacts } = await sb
    .from("contacts")
    .select("id,group_tag,team,role,player_name,first_name,last_name,email,mobile,next_step,paid,docs")
    .order("group_tag", { ascending: true });

  const list = contacts || [];
  const groups = Array.from(new Set(list.map((c) => c.group_tag).filter(Boolean)));

  return (
    <>
      <div className="topbar">
        <h1>CRM &amp; Contacts</h1>
        <div className="spacer" />
        <span className="badge navy">{list.length} parties</span>
        <a className="btn" href="/crm/export">Export to Fora (CSV)</a>
      </div>
      <div className="content">
        <p className="pagelead">
          Every family and party across your trips, tagged by group and team. The Fora export matches the Fora
          Contact Template columns so you can load travelers straight into your host-agency account.
        </p>
        <div className="facts muted" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          {groups.map((g) => (
            <span key={g} className="badge">{g}</span>
          ))}
        </div>
        <div className="tablecard">
          <table>
            <thead>
              <tr>
                <th>Party</th><th>Group</th><th>Team</th><th>Email</th><th>Mobile</th><th>Paid</th><th>Docs</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>{c.player_name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || "—"}</td>
                  <td className="muted">{c.group_tag}</td>
                  <td className="muted">{c.team}</td>
                  <td className="muted">{c.email}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{c.mobile}</td>
                  <td>{c.paid ? <span className="badge good">Paid</span> : <span className="badge warn">Owed</span>}</td>
                  <td>{c.docs ? <span className="badge good">✓</span> : <span className="muted">—</span>}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7} className="muted">No contacts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
