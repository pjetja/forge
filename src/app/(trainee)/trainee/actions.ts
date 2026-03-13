'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ── Workout Session Actions ───────────────────────────────────────────────────

/**
 * Starts a new workout session for the given assigned schema.
 * Blocks if the trainee already has an in_progress session.
 * Activates the assigned plan (pending → active) on first session start.
 */
export async function startWorkout(
  assignedSchemaId: string,
  assignedPlanId: string
): Promise<{ sessionId: string } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  // Check for existing in_progress session
  const { data: existing } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('trainee_auth_uid', claims.sub)
    .eq('status', 'in_progress')
    .maybeSingle();

  if (existing) {
    return { error: 'You have a workout in progress. Please finish or abandon it first.' };
  }

  // Insert new session
  const { data: session, error } = await supabase
    .from('workout_sessions')
    .insert({
      assigned_schema_id: assignedSchemaId,
      trainee_auth_uid: claims.sub,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !session) return { error: 'Failed to start workout. Please try again.' };

  // Activate assigned plan on first session start (pending → active)
  await supabase
    .from('assigned_plans')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', assignedPlanId)
    .eq('status', 'pending');

  revalidatePath('/trainee');
  return { sessionId: session.id };
}

/**
 * Saves (upserts) a single set for the current workout session.
 * Idempotent: re-submitting the same (sessionId, exerciseId, setNumber) updates the row.
 * Does NOT revalidatePath — optimistic UI handles display; full revalidate on page navigation.
 */
export async function completeSet(data: {
  sessionId: string;
  assignedSchemaExerciseId: string;
  setNumber: number;
  actualReps: number;
  actualWeightKg: number | null;
  muscleFailure: boolean;
  notes?: string;
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase.from('session_sets').upsert(
    {
      session_id: data.sessionId,
      assigned_schema_exercise_id: data.assignedSchemaExerciseId,
      set_number: data.setNumber,
      actual_reps: data.actualReps,
      actual_weight_kg: data.actualWeightKg,
      muscle_failure: data.muscleFailure,
      notes: data.notes ?? null,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'session_id,assigned_schema_exercise_id,set_number' }
  );

  if (error) return { error: 'Failed to save set. Please try again.' };
  return { success: true };
}

/**
 * Adds a placeholder set row so the trainee can log an extra set beyond the plan.
 * The trainee edits the row and marks it complete via completeSet.
 */
export async function addSet(data: {
  sessionId: string;
  assignedSchemaExerciseId: string;
  setNumber: number; // next set number (caller computes: existing sets + 1)
  targetReps: number;
  targetWeightKg: number | null;
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase.from('session_sets').insert({
    session_id: data.sessionId,
    assigned_schema_exercise_id: data.assignedSchemaExerciseId,
    set_number: data.setNumber,
    actual_reps: data.targetReps,
    actual_weight_kg: data.targetWeightKg,
    muscle_failure: false,
    completed_at: new Date().toISOString(),
  });

  if (error) return { error: 'Failed to add set. Please try again.' };
  return { success: true };
}

/**
 * Marks the session as completed and returns a summary.
 * Counts sets completed vs total plan sets for the post-workout summary screen.
 */
export async function finishWorkout(
  sessionId: string
): Promise<{ success: true; summary: { setsCompleted: number; totalPlanSets: number } } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  // Count completed sets for this session
  const { count: setsCompleted } = await supabase
    .from('session_sets')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  // Count total plan sets by summing sets across all exercises in the schema
  const { data: sessionRow } = await supabase
    .from('workout_sessions')
    .select('assigned_schema_id')
    .eq('id', sessionId)
    .single();

  let totalPlanSets = 0;
  if (sessionRow) {
    const { data: exercises } = await supabase
      .from('assigned_schema_exercises')
      .select('sets')
      .eq('assigned_schema_id', sessionRow.assigned_schema_id);

    if (exercises) {
      totalPlanSets = exercises.reduce((sum, ex) => sum + (ex.sets ?? 0), 0);
    }
  }

  // Mark session as completed
  const { error } = await supabase
    .from('workout_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('trainee_auth_uid', claims.sub);

  if (error) return { error: 'Failed to finish workout. Please try again.' };

  revalidatePath('/trainee');
  return {
    success: true,
    summary: {
      setsCompleted: setsCompleted ?? 0,
      totalPlanSets,
    },
  };
}

/**
 * Marks the session as abandoned. Session sets are kept for analytics.
 * Trainee can then start a fresh session.
 */
export async function abandonWorkout(
  sessionId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('workout_sessions')
    .update({ status: 'abandoned' })
    .eq('id', sessionId)
    .eq('trainee_auth_uid', claims.sub);

  if (error) return { error: 'Failed to abandon workout. Please try again.' };

  revalidatePath('/trainee');
  return { success: true };
}
