import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import Header from '../../components/Header';
export const dynamic = 'force-dynamic';
const STAGES = ['Lead', 'Proposal Sent', 'Booked', 'Final Payment', 'Pre-Trip', 'Traveling', 'Completed'];
export default async function Pipeline() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  const role = profile?.role;
  if (!(role === 'super_admin' || role === 'admin' || role === 'agent')) redirect('/dashboard');
  const { data: trips } = await supabase.from('trips').select('*').order('start_date', { nullsFirst: false });
  const all = trips || [];
  const active = all.filter((t: any) => t.stage !== 'Completed');
  const travelers = active.reduce((s: number, t: any) => s + Number(t.planned_travelers || 0), 0);
  const fees = active.reduce((s: number, t: any) => s + Number(t.evp_fee || 0), 0);
  const fmt = (n: number) => '$' + Math.round(n).toLocaleString();
  return (
    <>
      <Header name={profile?.full_name} role={role} />
      <main className="wrap">
        <div className="kpis">
          <div className="kpi"><div className="l">Active Trips</div><div className="v">{active.length}</div></div>
          <div className="kpi"><div className="l">Travelers</div><div className="v">{travelers}</div></div>
          <div className="kpi hero"><div className="l">EVP Fees (revenue)</div><div className="v">{fmt(fees)}</div></div>
          <div className="kpi"><div className="l">Total Trips</div><div className="v">{all.length}</div></div>
        </div>
        <div className="h2row"><h2>Trip Pipeline</h2><span className="hint">Live from Supabase · role: {role}</span></div>
        <div className="board">
          {STAGES.map((stage) => {
            const inStage = all.filter((t: any) => t.stage === stage);
            return (
              <div className="col" key={stage}>
                <h3>{stage}<span>{inStage.length}</span></h3>
                {inStage.map((t: any) => (
                  <div className="card" key={t.id}>
                    <div className="nm">{t.name}</div>
                    <div className="m"><span>📍 <b>{t.destination}</b></span><span>👥 <b>{t.planned_travelers}</b></span><span>fee <b>{fmt(Number(t.evp_fee || 0))}</b></span></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
