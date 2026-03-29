'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

export async function signUpTrainer(prevState: unknown, formData: FormData) {
  const result = SignupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { email, password, name } = result.data;
  const supabase = await createClient();

  // emailRedirectTo sends the confirmation link back to our callback with role context.
  // Profile row and role assignment happen in /auth/callback after email is confirmed.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?role=trainer`,
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
