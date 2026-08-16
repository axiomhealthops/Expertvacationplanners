import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { STAFF } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";
import { money, dateRange } from "@/lib/format";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function Quote({ params }: { params: { slug: string } }) {
  await requireRole(STAFF);
  const sb = supabaseServer();
  const { data: trip } = await sb.from("trips").select("*").eq("slug", params.slug).single();
  if (!trip) notFound();

  const [{ data: items }, { data: client }] = await Promise.all([
    sb.from("trip_items").select("*").eq("trip_id", trip.id).order("sort"),
    trip.client_id ? sb.from("clients").select("first_name,last_name,email").eq("id", trip.client_id).single() : Promise.resolve({ data: null }),
  ]);

  const lines = (items || []).filter((i) => !i.is_optional);
  const optional = (items || []).filter((i) => i.is_optional);
  const lineTotal = (i: any) => (Number(i.qty) || 1) * (Number(i.unit_price) || 0);
  const vendor = lines.reduce((a, i) => a + lineTotal(i), 0);
  const clientTotal = vendor + Number(trip.evp_fee || 0);
  const headcount = Number(trip.total_people) || Number(trip.planned_travelers) || 0;
  const per = headcount > 0 ? clientTotal / headcount : 0;
  const deposit = clientTotal * ((trip.deposit_pct || 25) / 100);

  // With no priced lines the "total" is nothing but the EVP fee, which reads as
  // a real price to the client and is wrong by orders of magnitude on a group
  // trip. Show nothing rather than something false.
  const hasLines = lines.length > 0;
  const clientName = client ? `${client.first_name || ""} ${client.last_name || ""}`.trim() : trip.client_name;

  return (
    <>
      <div className="topbar noprint">
        <h1 style={{ fontSize: 18 }}>Quote — {trip.name}</h1>
        <div className="spacer" />
        <Link href={`/trips/${trip.slug}`} className="badge">← Trip</Link>
        <Link href={`/trips/${trip.slug}/edit`} className="btn ghost">Edit</Link>
        <PrintButton />
      </div>
      <div className="content quotewrap">
        <div className="quote">
          <div className="qcover">
            <div className="qbrand">
              <img src="/brand/globe.png" alt="EVP" />
              <div>
                <div className="qco">Expert Vacation Planners</div>
                <div className="qsub">Group &amp; event travel · Orlando, FL</div>
              </div>
            </div>
            <div className="qrt">Trip Proposal<br />{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
          </div>

          <div className="qbody">
            <div className="eyebrow">Prepared for {clientName || "you"}</div>
            <h1 className="qtitle">{trip.name}</h1>
            <div className="qfacts">
              {trip.destination && <span>📍 {trip.destination}</span>}
              <span className="mono">{dateRange(trip.start_date, trip.end_date)}</span>
              {trip.total_people > 0 && <span>{trip.total_people} traveler{trip.total_people === 1 ? "" : "s"}</span>}
            </div>
            {trip.summary && <p className="qlead">{trip.summary}</p>}

            <div className="qsec">
              <h2>Your itinerary</h2>
              <table>
                <thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Price</th></tr></thead>
                <tbody>
                  {lines.map((i) => (
                    <tr key={i.id}>
                      <td><b>{i.description}</b>{i.detail ? <div className="muted" style={{ fontSize: 12.5 }}>{i.detail}</div> : null}<div className="qcat">{i.category}</div></td>
                      <td className="r">{Number(i.qty)}</td>
                      <td className="r">{money(lineTotal(i))}</td>
                    </tr>
                  ))}
                  {lines.length === 0 && <tr><td colSpan={3} className="muted">Itinerary details to follow.</td></tr>}
                </tbody>
              </table>
            </div>

            {hasLines ? (
              <div className="qtotals">
                <div className="qtrow"><span>Package total</span><span className="mono">{money(clientTotal)}</span></div>
                {headcount > 1 && <div className="qtrow sub"><span>Per person</span><span className="mono">{money(per)}</span></div>}
                <div className="qtrow big"><span>Deposit to reserve ({trip.deposit_pct || 25}%)</span><span className="mono">{money(deposit)}</span></div>
              </div>
            ) : (
              <div className="qnote noprint">
                <b>Not ready to send.</b> This trip has no priced itinerary lines, so there is no total to quote.
                Publishing it now would show {money(clientTotal)} — your EVP fee on its own, not the price of the trip.{" "}
                <Link href={`/trips/${trip.slug}/edit`}>Add the itinerary</Link> first.
              </div>
            )}

            {optional.length > 0 && (
              <div className="qsec">
                <h2>Optional add-ons</h2>
                <table><tbody>
                  {optional.map((i) => (<tr key={i.id}><td>{i.description}</td><td className="r">{money(lineTotal(i))}</td></tr>))}
                </tbody></table>
              </div>
            )}

            {trip.quote_notes && (
              <div className="qnote"><b>Good to know.</b> {trip.quote_notes}</div>
            )}

            <div className="qnext">
              <h3>Ready when you are, {clientName?.split(" ")[0] || "there"}.</h3>
              <p>Reply to lock these rates and I&apos;ll send the deposit link. Anything you want adjusted — rooms, dates, add-ons — we build from here.</p>
            </div>
          </div>

          <div className="qfoot">
            Liam · Expert Vacation Planners · <span className="mono">(407) 401-0754</span> · admin@expertvacationplanners.com · Orlando, FL
          </div>
        </div>
      </div>
    </>
  );
}
