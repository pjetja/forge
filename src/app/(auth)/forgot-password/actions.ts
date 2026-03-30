'use server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function requestPasswordReset(prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  if (!email) return { error: 'Email is required' };

  const headersList = await headers();
  const origin = headersList.get('origin') ?? '';

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Always return success to avoid leaking whether email exists
  if (error) console.error('Password reset error:', error.message);
  return { success: true };
}
