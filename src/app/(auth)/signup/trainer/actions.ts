'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Signup failed — please try again' };
  }

  // Set role in app_metadata via Admin API (server-only, user cannot modify)
  const adminClient = createAdminClient();
  const { error: roleError } = await adminClient.auth.admin.updateUserById(
    data.user.id,
    { app_metadata: { role: 'trainer' } }
  );

  if (roleError) {
    return { error: 'Account created but role assignment failed — contact support' };
  }

  // Create trainer profile row
  const { error: profileError } = await supabase.from('trainers').insert({
    auth_uid: data.user.id,
    email: data.user.email!,
    name,
  });

  if (profileError) {
    // Non-fatal for the auth flow — log and continue
    console.error('Trainer profile creation failed:', profileError);
  }

  redirect('/verify-email');
}
