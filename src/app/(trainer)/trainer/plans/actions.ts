'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ── Plan CRUD ─────────────────────────────────────────────────────────────────

export type PlanFormData = {
  name: string;
  weekCount: number;
  workoutsPerWeek: number;
  tags?: string[];
  notes?: string;
};

export async function createPlan(
  data: PlanFormData
): Promise<{ planId: string } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { data: plan, error } = await supabase
    .from('plans')
    .insert({
      trainer_auth_uid: claims.sub,
      name: data.name,
      week_count: data.weekCount,
      workouts_per_week: data.workoutsPerWeek,
      tags: data.tags ?? [],
      notes: data.notes ?? null,
    })
    .select('id')
    .single();

  if (error || !plan) return { error: 'Failed to create plan. Please try again.' };

  revalidatePath('/trainer/plans');
  return { planId: plan.id };
}

export async function updatePlan(
  planId: string,
  data: Partial<PlanFormData & { notes: string | null }>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.weekCount !== undefined) updates.week_count = data.weekCount;
  if (data.workoutsPerWeek !== undefined) updates.workouts_per_week = data.workoutsPerWeek;
  if (data.tags !== undefined) updates.tags = data.tags;
  if ('notes' in data) updates.notes = data.notes ?? null;

  const { error } = await supabase.from('plans').update(updates).eq('id', planId);
  if (error) return { error: 'Failed to update plan.' };

  revalidatePath('/trainer/plans');
  revalidatePath(`/trainer/plans/${planId}`);
  return { success: true };
}

/**
 * Smart delete:
 * - Active/pending assigned trainees → archive the plan (hide from list, trainees keep access)
 * - No active trainees → hard delete
 */
export async function deletePlan(
  planId: string
): Promise<{ success: true; archived: boolean } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { count } = await supabase
    .from('assigned_plans')
    .select('id', { count: 'exact', head: true })
    .eq('source_plan_id', planId)
    .in('status', ['pending', 'active']);

  if (count && count > 0) {
    const { error } = await supabase.from('plans').update({ status: 'archived' }).eq('id', planId);
    if (error) return { error: 'Failed to archive plan.' };
    revalidatePath('/trainer/plans');
    return { success: true, archived: true };
  }

  const { error } = await supabase.from('plans').delete().eq('id', planId);
  if (error) return { error: 'Failed to delete plan.' };

  revalidatePath('/trainer/plans');
  return { success: true, archived: false };
}

export async function duplicatePlan(
  sourcePlanId: string,
  newName: string
): Promise<{ planId: string } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { data, error } = await supabase.rpc('duplicate_plan', {
    source_plan_id: sourcePlanId,
    new_trainer_auth_uid: claims.sub,
    new_name: newName,
  });

  if (error || !data) return { error: 'Failed to duplicate plan.' };
  revalidatePath('/trainer/plans');
  return { planId: data as string };
}

// ── Schema CRUD ───────────────────────────────────────────────────────────────

export async function createSchema(
  planId: string,
  data: { name: string; slotIndex: number; sortOrder: number }
): Promise<{ schemaId: string } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  // Verify plan ownership via RLS
  const { data: schema, error } = await supabase
    .from('workout_schemas')
    .insert({
      plan_id: planId,
      name: data.name,
      slot_index: data.slotIndex,
      sort_order: data.sortOrder,
    })
    .select('id')
    .single();

  if (error || !schema) return { error: 'Failed to create schema.' };
  revalidatePath(`/trainer/plans/${planId}`);
  return { schemaId: schema.id };
}

export async function updateSchema(
  schemaId: string,
  planId: string,
  data: { name?: string; slotIndex?: number }
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.slotIndex !== undefined) updates.slot_index = data.slotIndex;

  const { error } = await supabase.from('workout_schemas').update(updates).eq('id', schemaId);
  if (error) return { error: 'Failed to update schema.' };

  revalidatePath(`/trainer/plans/${planId}`);
  return { success: true };
}

export async function deleteSchema(
  schemaId: string,
  planId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase.from('workout_schemas').delete().eq('id', schemaId);
  if (error) return { error: 'Failed to delete schema.' };

  revalidatePath(`/trainer/plans/${planId}`);
  return { success: true };
}

// ── Schema Exercise CRUD ──────────────────────────────────────────────────────

export type SchemaExerciseData = {
  exerciseId: string;
  sets: number;
  reps: number;
  targetWeightKg?: number | null;
  perSetWeights?: number[] | null;
  sortOrder: number;
};

export async function addExerciseToSchema(
  schemaId: string,
  planId: string,
  data: SchemaExerciseData
): Promise<{ exerciseRowId: string } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { data: row, error } = await supabase
    .from('schema_exercises')
    .insert({
      schema_id: schemaId,
      exercise_id: data.exerciseId,
      sets: data.sets,
      reps: data.reps,
      target_weight_kg: data.targetWeightKg ?? null,
      per_set_weights: data.perSetWeights ?? null,
      sort_order: data.sortOrder,
    })
    .select('id')
    .single();

  if (error || !row) return { error: 'Failed to add exercise.' };
  revalidatePath(`/trainer/plans/${planId}/schemas/${schemaId}`);
  return { exerciseRowId: row.id };
}

export async function updateSchemaExercise(
  exerciseRowId: string,
  schemaId: string,
  planId: string,
  data: Partial<Omit<SchemaExerciseData, 'exerciseId' | 'sortOrder'>>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.sets !== undefined) updates.sets = data.sets;
  if (data.reps !== undefined) updates.reps = data.reps;
  if ('targetWeightKg' in data) updates.target_weight_kg = data.targetWeightKg ?? null;
  if ('perSetWeights' in data) {
    updates.per_set_weights = data.perSetWeights ?? null;
  }

  const { error } = await supabase.from('schema_exercises').update(updates).eq('id', exerciseRowId);
  if (error) return { error: 'Failed to update exercise.' };

  revalidatePath(`/trainer/plans/${planId}/schemas/${schemaId}`);
  return { success: true };
}

export async function removeExerciseFromSchema(
  exerciseRowId: string,
  schemaId: string,
  planId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase.from('schema_exercises').delete().eq('id', exerciseRowId);
  if (error) return { error: 'Failed to remove exercise.' };

  revalidatePath(`/trainer/plans/${planId}/schemas/${schemaId}`);
  return { success: true };
}

export async function reorderSchemaExercises(
  schemaId: string,
  planId: string,
  orderedIds: string[] // exercise row IDs in new order
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  // Bulk update sort_order for each exercise row
  const updates = orderedIds.map((id, index) =>
    supabase.from('schema_exercises').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed) return { error: 'Failed to reorder exercises.' };

  // No revalidatePath — this is called optimistically from the client, no server re-render needed
  return { success: true };
}
