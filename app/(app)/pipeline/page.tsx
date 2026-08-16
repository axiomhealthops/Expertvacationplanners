import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { STAFF } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";
import { money, dateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

const STAGES = ["Lead", "Proposal Sent", "Booked", "Final Payment", "Pre-Trip", "Traveling", "Completed"];

function stageClass(stage: string) {
  if (stage === "Booked" || stage === "Completed") return "good";
  if (stage === "Lead" || stage === "Proposal Sent") return "warn";
  return "navy";
}

export default async function Pipeline() {
  const u = await requireRole(STAFF);
  const sb = supabaseServer();
  const { data: trips } = await sb
    .from("trips")
    .select("id,slug,name,client_name,stage,kind,destination,start_date,end_date,total_people,per_person,evp_fee")
    .order("start_date", { ascending: true, nullsFirst: false });

  const list = trips || [];
  const byStage = (s: string) => list.filter((t) => t.stage === s);
  const feeSum = list.reduce((a, t) => a + Number(t.evp_fee || 0), 0);

  return (
    <>
      <div className="topbar">
        <h1>Pipeline</h1>
        <div className="spacer" />
        <span className="badge navy">{list.length} trips</span>
        <span className="badge brass">{money(feeSum)} in fees</span>
        <Link href="/clients/new" className="btn ghost">+ Client</Link>
        <Link href="/trips/new" className="btn">+ Build Trip</Link>
      </div>
      <div className="content">
        <p className="pagelead">
          {u.role === "agent"
            ? "Trips assigned to you, tracked from first inquiry to completed travel."
            : "Every trip across Corporate, Sports, and Private — tracked from first inquiry to completed travel."}
        </p>

        <div className="board">
          {STAGES.map((s) => {
            const items = byStage(s);
            return (
              <div className="col" key={s}>
                <div className="h">
                  <span className="t">{s}</span>
                  <span className="c">{items.length}</span>
                </div>
                {items.length === 0 && (
                  <div className="tcard" style={{ color: "var(--slate)", fontSize: 12 }}>
                    —
                  </div>
                )}
                {items.map((t) => (
                  <Link className="tcard" key={t.id} href={`/trips/${t.slug}`}>
                    <div className="nm">{t.name}</div>
                    <div className="meta">
                      {t.client_name || t.destination} · <span className={`badge ${stageClass(t.stage)}`}>{t.kind}</span>
                    </div>
                    <div className="row">
                      <span className="muted">{dateRange(t.start_date, t.end_date)}</span>
                      <span>{money(t.evp_fee)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
