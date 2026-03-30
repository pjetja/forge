import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AssignReviewForm } from './AssignReviewForm';

interface AssignReviewPageProps {
  params: Promise<{ planId: string; traineeId: string }>;
}

export interface SchemaWithExercises {
  schemaId: string;
  schemaName: string;
  exercises: ExerciseRow[];
}

export interface ExerciseRow {
  schemaExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  templateWeightKg: number | null;
  templateTempo: string | null;
  templateProgressionMode: string;
}

export default async function AssignReviewPage({ params }: AssignReviewPageProps) {
  const { planId, traineeId } = await params;
  const supabase = await createClient();

  // Fetch plan template
  const { data: planData } = await supabase
    .from('plans')
    .select('id, name, week_count, workouts_per_week')
    .eq('id', planId)
    .single();

  if (!planData) notFound();

  // Fetch trainee profile
  const { data: traineeProfile } = await supabase
    .from('users')
    .select('name, email')
    .eq('auth_uid', traineeId)
    .single();

  if (!traineeProfile) notFound();

  // Fetch schemas with exercises, grouped
  const { data: schemasRaw } = await supabase
    .from('workout_schemas')
    .select(`
      id,
      name,
      slot_index,
      schema_exercises (
        id,
        exercise_id,
        sets,
        reps,
        target_weight_kg,
        tempo,
        progression_mode,
        sort_order,
        exercises (id, name, muscle_group)
      )
    `)
    .eq('plan_id', planId)
    .order('slot_index');

  const schemas: SchemaWithExercises[] = (schemasRaw ?? []).map((s: any) => ({
    schemaId: s.id,
    schemaName: s.name,
    exercises: [...(s.schema_exercises ?? [])]
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((ex: any) => ({
        schemaExerciseId: ex.id,
        exerciseId: ex.exercise_id,
        exerciseName: ex.exercises?.name ?? 'Unknown',
        muscleGroup: ex.exercises?.muscle_group ?? '',
        sets: ex.sets,
        reps: ex.reps,
        templateWeightKg: ex.target_weight_kg ? parseFloat(ex.target_weight_kg) : null,
        templateTempo: ex.tempo ?? null,
        templateProgressionMode: ex.progression_mode ?? 'none',
      })),
  }));

  // Check for existing active/pending plan
  const { data: existingPlan } = await supabase
    .from('assigned_plans')
    .select('id')
    .eq('trainee_auth_uid', traineeId)
    .in('status', ['pending', 'active'])
    .maybeSingle();

  const hasExistingActivePlan = !!existingPlan;

  // ── History: last logged weight per exercise for this trainee on this plan ─
  const historyByExerciseId: Record<string, number> = {};

  // 1. Most recent completed assigned_plan for this trainee + plan template
  const { data: lastPlanRaw } = await supabase
    .from('assigned_plans')
    .select('id')
    .eq('source_plan_id', planId)
    .eq('trainee_auth_uid', traineeId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastPlanRaw) {
    // 2. Schemas for that plan
    const { data: pastSchemasRaw } = await supabase
      .from('assigned_schemas')
      .select('id')
      .eq('assigned_plan_id', lastPlanRaw.id);

    const pastSchemaIds = (pastSchemasRaw ?? []).map((s: any) => s.id);

    if (pastSchemaIds.length > 0) {
      // 3. Assigned schema exercises for those schemas
      const { data: aseRaw } = await supabase
        .from('assigned_schema_exercises')
        .select('id, exercise_id, assigned_schema_id')
        .in('assigned_schema_id', pastSchemaIds);

      const aseMap = new Map((aseRaw ?? []).map((a: any) => [a.id, a.exercise_id]));
      const aseIds = [...aseMap.keys()];

      if (aseIds.length > 0) {
        // 4. Most recent session_set per exercise
        const { data: setsRaw } = await supabase
          .from('session_sets')
          .select('assigned_schema_exercise_id, actual_weight_kg, completed_at')
          .in('assigned_schema_exercise_id', aseIds)
          .not('actual_weight_kg', 'is', null)
          .order('completed_at', { ascending: false });

        const seen = new Set<string>();
        for (const set of (setsRaw ?? [])) {
          const exerciseId = aseMap.get((set as any).assigned_schema_exercise_id);
          if (!exerciseId || seen.has(exerciseId)) continue;
          seen.add(exerciseId);
          historyByExerciseId[exerciseId] = Math.round(
            parseFloat(String((set as any).actual_weight_kg)) * 10
          ) / 10;
        }
      }
    }
  }

  const hasHistory = Object.keys(historyByExerciseId).length > 0;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back link */}
      <Link
        href={`/trainer/plans/${planId}/assign`}
        className="inline-flex items-center gap-1 text-sm text-text-primary hover:text-accent transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Review plan</h1>
        <p className="text-sm text-text-primary opacity-60 mt-1">
          Assigning <span className="text-text-primary font-medium">{planData.name}</span> to{' '}
          <span className="text-text-primary font-medium">{traineeProfile.name}</span>
          {' '}&middot; {planData.week_count} weeks &middot; {planData.workouts_per_week} workouts/week
        </p>
      </div>

      {hasHistory && (
        <p className="text-xs text-accent border border-accent/30 bg-accent/10 rounded-sm px-3 py-2">
          Weights pre-filled from {traineeProfile.name}&apos;s last time on this plan.
        </p>
      )}

      <AssignReviewForm
        planId={planId}
        traineeAuthUid={traineeId}
        traineeName={traineeProfile.name}
        hasExistingActivePlan={hasExistingActivePlan}
        schemas={schemas}
        historyByExerciseId={historyByExerciseId}
      />
    </div>
  );
}
