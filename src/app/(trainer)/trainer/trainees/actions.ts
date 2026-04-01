'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Exercise override shape for the review step at assignment time
export type ExerciseOverride = {
  exerciseId: string;
  sets: number;
  reps: number;
  targetWeightKg: number | null;
  perSetWeights: number[] | null;
  tempo: string | null;
  progressionMode: string;
};

/** @deprecated Use ExerciseOverride */
export type WeightOverride = ExerciseOverride;

export async function assignPlan(
  planId: string,
  traineeAuthUid: string,
  weightOverrides: ExerciseOverride[] = []
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
    sets: o.sets,
    reps: o.reps,
    target_weight_kg: o.targetWeightKg,
    per_set_weights: o.perSetWeights,
    tempo: o.tempo,
    progression_mode: o.progressionMode,
  }));

  const { data, error } = await supabase.rpc('assign_plan', {
    p_plan_id: planId,
    p_trainer_auth_uid: claims.sub,
    p_trainee_auth_uid: traineeAuthUid,
    p_weight_overrides: overridesJson,
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
  tempo?: string | null;
  progressionMode?: string;
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
    if ('tempo' in update) fields.tempo = update.tempo ?? null;
    if ('progressionMode' in update) fields.progression_mode = update.progressionMode;
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

export async function activateAssignedPlan(
  assignedPlanId: string,
  traineeAuthUid: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('assigned_plans')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', assignedPlanId)
    .eq('trainer_auth_uid', claims.sub)
    .eq('status', 'pending');
  if (error) return { error: 'Failed to activate plan.' };

  revalidatePath(`/trainer/trainees/${traineeAuthUid}`);
  return { success: true };
}

export async function reorderPendingPlans(
  traineeAuthUid: string,
  orderedIds: string[]
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('assigned_plans')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('trainer_auth_uid', claims.sub)
      .eq('trainee_auth_uid', traineeAuthUid)
      .eq('status', 'pending')
  );

  await Promise.all(updates);
  revalidatePath(`/trainer/trainees/${traineeAuthUid}`);
  return { success: true };
}

export async function deleteAssignedPlan(
  assignedPlanId: string,
  traineeAuthUid: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('assigned_plans')
    .delete()
    .eq('id', assignedPlanId)
    .eq('trainer_auth_uid', claims.sub)
    .eq('status', 'pending');
  if (error) return { error: 'Failed to delete plan.' };

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

export async function updateTraineeGoals(
  traineeAuthUid: string,
  goals: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('users')
    .update({ goals: goals || null })
    .eq('auth_uid', traineeAuthUid);

  if (error) return { error: 'Failed to save goals. Please try again.' };
  revalidatePath(`/trainer/trainees/${traineeAuthUid}`);
  return { success: true };
}

export async function updateTrainerNotes(
  traineeAuthUid: string,
  notes: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('trainer_trainee_connections')
    .update({ trainer_notes: notes || null })
    .eq('trainer_auth_uid', claims.sub)
    .eq('trainee_auth_uid', traineeAuthUid);

  if (error) return { error: 'Failed to save notes. Please try again.' };
  revalidatePath(`/trainer/trainees/${traineeAuthUid}`);
  return { success: true };
}

// ── Body Weight Access Request Actions ────────────────────────────────────────

/**
 * Trainer requests access to a trainee's body weight data.
 * Uses upsert to handle re-requesting after a decline.
 */
export async function requestBodyWeightAccess(
  traineeId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase.from('body_weight_access_requests').upsert(
    {
      trainer_auth_uid: claims.sub,
      trainee_auth_uid: traineeId,
      status: 'pending',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'trainer_auth_uid,trainee_auth_uid' }
  );

  if (error) return { error: 'Could not send request. Please try again.' };
  revalidatePath(`/trainer/trainees/${traineeId}`);
  return { success: true };
}

/**
 * Trainer revokes their own body weight access request (pending or approved).
 */
export async function revokeBodyWeightRequest(
  traineeId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('body_weight_access_requests')
    .delete()
    .eq('trainer_auth_uid', claims.sub)
    .eq('trainee_auth_uid', traineeId);

  if (error) return { error: 'Could not revoke request. Please try again.' };
  revalidatePath(`/trainer/trainees/${traineeId}`);
  return { success: true };
}

export async function reorderAssignedSchemaExercises(
  assignedPlanId: string,
  orderedIds: string[],
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('assigned_schema_exercises')
      .update({ sort_order: index })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed) return { error: 'Failed to reorder exercises.' };

  return { success: true };
}
