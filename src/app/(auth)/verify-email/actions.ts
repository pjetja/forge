'use server';
import { createClient } from '@/lib/supabase/server';

export async function resendVerificationEmail(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) return { error: 'Email is missing' };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: 'signup', email });

  if (error) return { error: error.message };
  return { success: true };
}
