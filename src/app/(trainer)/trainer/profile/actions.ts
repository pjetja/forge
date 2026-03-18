'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TrainerProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(1000).optional(),
});

export async function updateTrainerProfile(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const parsed = TrainerProfileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const { error } = await supabase
    .from('trainers')
    .update({ name: parsed.data.name, bio: parsed.data.bio ?? null })
    .eq('auth_uid', claims.sub);

  if (error) return { error: 'Failed to update profile. Please try again.' };
  revalidatePath('/trainer/profile');
  revalidatePath('/trainer'); // nav header shows name
  return { success: true };
}
