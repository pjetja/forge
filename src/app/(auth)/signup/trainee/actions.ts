'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
  const adminClient = createAdminClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Signup failed — please try again' };
  }

  // Set role in app_metadata via Admin API
  await adminClient.auth.admin.updateUserById(data.user.id, {
    app_metadata: { role: 'trainee' },
  });

  // Create trainee profile row
  await supabase.from('users').insert({
    auth_uid: data.user.id,
    email: data.user.email!,
    name,
    role: 'trainee',
  });

  // Store invite token in session cookie so it survives email verification
  // The /join/[token] redirect will happen after email confirmation
  if (inviteToken) {
    // Redirect to verify-email with invite token in query so it can be picked up post-verification
    redirect(`/verify-email?invite=${inviteToken}`);
  }

  redirect('/verify-email');
}
