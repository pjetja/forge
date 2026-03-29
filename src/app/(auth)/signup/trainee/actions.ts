'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  inviteToken: z.string().optional(),
});

export async function signUpTrainee(prevState: unknown, formData: FormData) {
  const result = SignupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
    inviteToken: formData.get('invite_token') || undefined,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { email, password, name, inviteToken } = result.data;
  const supabase = await createClient();

  // emailRedirectTo carries role + invite token through to /auth/callback.
  // Profile row and role assignment happen there after email is confirmed.
  const callbackUrl = new URL(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`
  );
  callbackUrl.searchParams.set('role', 'trainee');
  if (inviteToken) callbackUrl.searchParams.set('invite', inviteToken);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      data: { name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Signup failed — please try again' };
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}
