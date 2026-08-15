'use server';
import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
export async function loginPassword(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: String(formData.get('email') || ''), password: String(formData.get('password') || '') });
  if (error) redirect('/login?error=' + encodeURIComponent(error.message));
  redirect('/dashboard');
}
export async function sendMagic(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: String(formData.get('email') || '') });
  if (error) redirect('/login?error=' + encodeURIComponent(error.message));
  redirect('/login?sent=1');
}
