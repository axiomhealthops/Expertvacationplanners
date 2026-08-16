import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { isStaff } from "@/lib/roles";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

const OPEN_STAGES = ["Lead", "Proposal Sent", "Booked", "Final Payment", "Pre-Trip", "Traveling"];

export default async function Dashboard() {
  const u = await requireUser();
  const sb = supabaseServer();
  const first = (u.fullName || "there").split(" ")[0];

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (isStaff(u.role)) {
    const { data: trips } = await sb
      .from("trips")
      .select("id,name,slug,stage,evp_fee,total_people,start_date,client_name");
    const { data: fora } = await sb.from("fora_bookings").select("commission_amount,status");

    const list = trips || [];
    const open = list.filter((t) => OPEN_STAGES.includes(t.stage));
    const feeSum = list.reduce((s, t) => s + Number(t.evp_fee || 0), 0);
    const commSum = (fora || []).reduce((s, f) => s + Number(f.commission_amount || 0), 0);

    return (
      <>
        <div className="topbar">
          <h1>Home</h1>
          <div className="spacer" />
          <span className="eyebrow">Command 26</span>
        </div>
        <div className="content">
          <div className="eyebrow">{greet}</div>
          <h2 style={{ fontSize: 30, margin: "4px 0 4px" }}>Welcome back, {first}.</h2>
          <p className="pagelead">
            Your live book of business at a glance. {u.role === "agent" ? "Showing the trips assigned to you." : "Showing every trip across the firm."}
          </p>

          <div className="kpis">
            <div className="kpi">
              <div className="u">Open Trips</div>
              <div className="v">{open.length}</div>
              <div className="s">of {list.length} total in the system</div>
            </div>
            <div className="kpi">
              <div className="u">EVP Fee (booked + pipeline)</div>
              <div className="v">{money(feeSum)}</div>
              <div className="s">planning &amp; coordination fees</div>
            </div>
            <div className="kpi">
              <div className="u">Fora Commission</div>
              <div className="v">{money(commSum)}</div>
              <div className="s">expected across the ledger</div>
            </div>
            <div className="kpi">
              <div className="u">Total EVP Revenue</div>
              <div className="v">{money(feeSum + commSum)}</div>
              <div className="s">fee + commission</div>
            </div>
          </div>

          <div className="section-title">
            <h2>Jump back in</h2>
            <span className="line" />
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            <Link href="/pipeline" className="card" style={{ display: "block" }}>
              <div className="eyebrow">Operations</div>
              <h3 style={{ marginTop: 6 }}>Pipeline</h3>
              <p className="muted" style={{ fontSize: 13 }}>Every trip by stage, with money and next steps.</p>
            </Link>
            <Link href="/crm" className="card" style={{ display: "block" }}>
              <div className="eyebrow">Relationships</div>
              <h3 style={{ marginTop: 6 }}>CRM &amp; Contacts</h3>
              <p className="muted" style={{ fontSize: 13 }}>Families and parties, exportable to Fora.</p>
            </Link>
            <Link href="/fora" className="card" style={{ display: "block" }}>
              <div className="eyebrow">Money</div>
              <h3 style={{ marginTop: 6 }}>Commissions &amp; Fora</h3>
              <p className="muted" style={{ fontSize: 13 }}>The commission ledger — staff only.</p>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // client / club home
  const dest = u.role === "sport_club" ? "/club" : "/myportal";
  const label = u.role === "sport_club" ? "your club's trips and teams" : "your trips, itinerary, and payments";
  return (
    <>
      <div className="topbar">
        <h1>Home</h1>
        <div className="spacer" />
        <span className="eyebrow">Command 26</span>
      </div>
      <div className="content">
        <div className="eyebrow">{greet}</div>
        <h2 style={{ fontSize: 30, margin: "4px 0 10px" }}>Welcome, {first}.</h2>
        <div className="card" style={{ maxWidth: 560 }}>
          <p className="muted" style={{ marginTop: 0 }}>
            You have access to {label}. Everything is in one place.
          </p>
          <Link href={dest} className="btn">Open my portal</Link>
        </div>
      </div>
    </>
  );
}
