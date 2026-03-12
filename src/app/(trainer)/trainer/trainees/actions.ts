'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Weight override shape for the review step at assignment time
export type WeightOverride = {
  exerciseId: string;
  targetWeightKg: number | null;
  perSetWeights: number[] | null;
};

export async function assignPlan(
  planId: string,
  traineeAuthUid: string,
  weightOverrides: WeightOverride[] = []
): Promise<{ assignedPlanId: string } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  // Check if trainee already has a pending or active plan — if so, this new one stays pending (UX: user is warned)
  const { data: existingActivePlan } = await supabase
    .from('assigned_plans')
    .select('id, status')
    .eq('trainee_auth_uid', traineeAuthUid)
    .in('status', ['pending', 'active'])
    .maybeSingle();

  // existingActivePlan presence is for UX display only — assign_plan RPC always sets status='pending'
  // So even if one exists, we proceed (trainer confirmed after warning in UI)
  void existingActivePlan;

  const overridesJson = weightOverrides.map((o) => ({
    exercise_id: o.exerciseId,
    target_weight_kg: o.targetWeightKg,
    per_set_weights: o.perSetWeights,
  }));

  const { data, error } = await supabase.rpc('assign_plan', {
    p_plan_id: planId,
    p_trainer_auth_uid: claims.sub,
    p_trainee_auth_uid: traineeAuthUid,
    p_weight_overrides: JSON.stringify(overridesJson),
  });

  if (error || !data) return { error: 'Failed to assign plan. Please try again.' };

  revalidatePath('/trainer');
  revalidatePath(`/trainer/trainees/${traineeAuthUid}`);
  return { assignedPlanId: data as string };
}

export type AssignedExerciseUpdate = {
  assignedExerciseId: string;
  sets?: number;
  reps?: number;
  targetWeightKg?: number | null;
  perSetWeights?: number[] | null;
};

export async function editAssignedPlan(
  assignedPlanId: string,
  traineeAuthUid: string,
  exerciseUpdates: AssignedExerciseUpdate[]
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  // Update each exercise
  for (const update of exerciseUpdates) {
    const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (update.sets !== undefined) fields.sets = update.sets;
    if (update.reps !== undefined) fields.reps = update.reps;
    if ('targetWeightKg' in update) fields.target_weight_kg = update.targetWeightKg ?? null;
    if ('perSetWeights' in update) {
      fields.per_set_weights = update.perSetWeights ? JSON.stringify(update.perSetWeights) : null;
    }
    const { error } = await supabase
      .from('assigned_schema_exercises')
      .update(fields)
      .eq('id', update.assignedExerciseId);
    if (error) return { error: 'Failed to update exercise in assigned plan.' };
  }

  // Bump plan_updated_at so trainee sees "Plan updated by trainer" badge (Phase 4 reads this)
  const { error: bumpError } = await supabase
    .from('assigned_plans')
    .update({ plan_updated_at: new Date().toISOString() })
    .eq('id', assignedPlanId);
  if (bumpError) return { error: 'Failed to record plan update timestamp.' };

  revalidatePath(`/trainer/trainees/${traineeAuthUid}`);
  return { success: true };
}

export async function terminateAssignedPlan(
  assignedPlanId: string,
  traineeAuthUid: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('assigned_plans')
    .update({ status: 'terminated' })
    .eq('id', assignedPlanId)
    .eq('trainer_auth_uid', claims.sub);
  if (error) return { error: 'Failed to terminate plan.' };

  revalidatePath(`/trainer/trainees/${traineeAuthUid}`);
  return { success: true };
}
