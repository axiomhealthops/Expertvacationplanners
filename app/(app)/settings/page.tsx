import { requireRole } from "@/lib/auth";
import { ADMINS, ROLE_LABEL } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Settings() {
  await requireRole(ADMINS);
  const sb = supabaseServer();
  const [{ data: profiles }, { data: pricing }, { data: orgs }] = await Promise.all([
    sb.from("profiles").select("email,full_name,role").order("role"),
    sb.from("pricing_settings").select("config").limit(1).maybeSingle(),
    sb.from("organizations").select("name,slug,type").order("slug"),
  ]);
  const cfg = (pricing?.config || {}) as Record<string, any>;

  return (
    <>
      <div className="topbar">
        <h1>Settings</h1>
        <div className="spacer" />
        <span className="badge navy">Admin</span>
      </div>
      <div className="content">
        <div className="section-title"><h2>Users &amp; Roles</h2><span className="line" /></div>
        <div className="tablecard">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>
              {(profiles || []).map((p) => (
                <tr key={p.email}>
                  <td>{p.full_name}</td>
                  <td className="muted">{p.email}</td>
                  <td><span className="badge navy">{ROLE_LABEL[p.role as keyof typeof ROLE_LABEL] || p.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section-title"><h2>Organizations</h2><span className="line" /></div>
        <div className="tablecard">
          <table>
            <thead><tr><th>Name</th><th>Slug</th><th>Type</th></tr></thead>
            <tbody>
              {(orgs || []).map((o) => (
                <tr key={o.slug}><td>{o.name}</td><td className="mono" style={{ fontSize: 12 }}>{o.slug}</td><td className="muted">{o.type}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section-title"><h2>Booking-Fee Model</h2><span className="line" /></div>
        <div className="card" style={{ maxWidth: 620 }}>
          <p className="muted" style={{ marginTop: 0 }}>Hybrid fee anchor used by the estimator and proposals.</p>
          <table>
            <tbody>
              <tr><td>Base fee</td><td className="r mono">${cfg.base ?? "—"}</td></tr>
              <tr><td>Per person</td><td className="r mono">${cfg.per_person ?? "—"}</td></tr>
              <tr><td>Per day</td><td className="r mono">${cfg.per_day ?? "—"}</td></tr>
              <tr><td>Target take rate</td><td className="r mono">{cfg.target_pct ? `${cfg.target_pct}%` : "—"}</td></tr>
            </tbody>
          </table>
          <p className="notice" style={{ marginTop: 14 }}>Editable pricing controls are the next module — the values above are read live from your settings.</p>
        </div>
      </div>
    </>
  );
}
