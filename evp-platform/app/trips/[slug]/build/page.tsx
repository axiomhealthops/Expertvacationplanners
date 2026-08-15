import { notFound } from 'next/navigation';
import Header from '../../../../components/Header';
import { requireStaff } from '../../../../utils/auth';
import { DEFAULT_PRICING } from '../../../../utils/pricing';
import Builder from './Builder';

export const dynamic = 'force-dynamic';

export default async function TripBuilder({ params }: { params: { slug: string } }) {
  const { supabase, profile } = await requireStaff();

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!trip) notFound();

  const [{ data: items }, { data: pricingRow }] = await Promise.all([
    supabase.from('trip_items').select('*').eq('trip_id', trip.id).order('sort'),
    supabase.from('pricing_settings').select('config').limit(1).maybeSingle(),
  ]);

  const pricing = { ...DEFAULT_PRICING, ...(pricingRow?.config || {}) };

  return (
    <>
      <Header name={profile?.full_name} role={profile?.role} />
      <main className="wrap">
        <div className="h2row">
          <h2>{trip.name}</h2>
          <span className="hint">
            {[trip.destination, trip.kind, trip.stage].filter(Boolean).join(' · ')}
          </span>
        </div>
        <Builder trip={trip} items={items || []} pricing={pricing} />
      </main>
    </>
  );
}
