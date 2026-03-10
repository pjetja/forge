'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ExerciseFormData = {
  name: string;
  muscleGroup: string;
  description?: string;
  notes?: string;
  videoUrl?: string;
};

export async function createExercise(
  formData: ExerciseFormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase.from('exercises').insert({
    trainer_auth_uid: claims.sub,
    name: formData.name,
    muscle_group: formData.muscleGroup,
    description: formData.description || null,
    notes: formData.notes || null,
    video_url: formData.videoUrl || null,
  });

  if (error) return { error: 'Failed to create exercise. Please try again.' };

  revalidatePath('/trainer/exercises');
  return { success: true };
}

export async function updateExercise(
  id: string,
  formData: ExerciseFormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('exercises')
    .update({
      name: formData.name,
      muscle_group: formData.muscleGroup,
      description: formData.description || null,
      notes: formData.notes || null,
      video_url: formData.videoUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
    // RLS policy enforces trainer ownership — no need to also filter by trainer_auth_uid

  if (error) return { error: 'Failed to update exercise. Please try again.' };

  revalidatePath('/trainer/exercises');
  return { success: true };
}

export async function deleteExercise(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id);
    // RLS policy enforces trainer ownership

  if (error) return { error: 'Failed to delete exercise. Please try again.' };

  revalidatePath('/trainer/exercises');
  return { success: true };
}
