import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import Header from '../../components/Header';
export const dynamic = 'force-dynamic';
export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  const role = profile?.role;
  if (role === 'super_admin' || role === 'admin' || role === 'agent') redirect('/pipeline');
  return (
    <>
      <Header name={profile?.full_name} role={role} />
      <main className="wrap">
        <div className="panel"><h2>Welcome</h2>
          <p>Signed in as <b>{profile?.full_name}</b> — role <b>{role}</b>. Your portal is being built. For now, your team&rsquo;s trip and booking details are managed by your EVP advisor.</p>
        </div>
      </main>
    </>
  );
}
