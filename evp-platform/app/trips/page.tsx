import Header from '../../components/Header';
import { requireStaff } from '../../utils/auth';
import { money } from '../../utils/pricing';

export const dynamic = 'force-dynamic';

export default async function Trips() {
  const { supabase, profile } = await requireStaff();

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { nullsFirst: false });

  const all = trips || [];

  // One grouped count query instead of a query per trip.
  const { data: itemRows } = await supabase.from('trip_items').select('trip_id');
  const itemCount = new Map<string, number>();
  for (const r of itemRows || []) {
    const k = String((r as any).trip_id);
    itemCount.set(k, (itemCount.get(k) || 0) + 1);
  }

  return (
    <>
      <Header name={profile?.full_name} role={profile?.role} />
      <main className="wrap">
        <div className="h2row">
          <h2>Trips</h2>
          <span className="hint">Open a trip to build or edit its quote</span>
        </div>

        <div className="panel tb-list">
          <div className="tb-list-head">
            <span>Trip</span>
            <span>Stage</span>
            <span className="r">Travelers</span>
            <span className="r">Lines</span>
            <span className="r">EVP fee</span>
            <span />
          </div>

          {all.map((t: any) => (
            <div className="tb-list-row" key={t.id}>
              <div>
                <div className="nm">{t.name}</div>
                <div className="sub">{[t.destination, t.venue].filter(Boolean).join(' · ')}</div>
              </div>
              <span>{t.stage}</span>
              <span className="mono r">{t.planned_travelers ?? 0}</span>
              <span className="mono r">{itemCount.get(String(t.id)) || 0}</span>
              <span className="mono r">{money(Number(t.evp_fee || 0))}</span>
              <a className="btn sm ghost" href={`/trips/${t.slug}/build`}>
                {itemCount.get(String(t.id)) ? 'Edit quote' : 'Build quote'}
              </a>
            </div>
          ))}

          {!all.length && <p className="hint">No trips yet.</p>}
        </div>
      </main>
    </>
  );
}
