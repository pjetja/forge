import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AssignPlanClientPage } from './AssignPlanClientPage';

export default async function AssignPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const supabase = await createClient();

  // Fetch plan template
  const { data: planData } = await supabase
    .from('plans')
    .select('id, name, week_count, workouts_per_week')
    .eq('id', planId)
    .single();

  if (!planData) notFound();

  // Fetch all exercises for all schemas in this plan
  const { data: schemaExercises } = await supabase
    .from('schema_exercises')
    .select(`
      id,
      exercise_id,
      sets,
      reps,
      target_weight_kg,
      per_set_weights,
      exercises (id, name, muscle_group),
      workout_schemas!inner (plan_id)
    `)
    .eq('workout_schemas.plan_id', planId)
    .order('sort_order');

  const exercises = (schemaExercises ?? []).map((row: any) => ({
    schemaExerciseId: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercises?.name ?? 'Unknown',
    muscleGroup: row.exercises?.muscle_group ?? '',
    sets: row.sets,
    reps: row.reps,
    templateWeightKg: row.target_weight_kg ? parseFloat(row.target_weight_kg) : null,
    templatePerSetWeights: Array.isArray(row.per_set_weights) ? row.per_set_weights : null,
  }));

  // Fetch connected trainees
  const { data: connections } = await supabase
    .from('trainer_trainee_connections')
    .select(`
      trainee_auth_uid,
      users!trainer_trainee_connections_trainee_auth_uid_fkey (name, email)
    `);

  const trainees = (connections ?? []).map((c: any) => ({
    authUid: c.trainee_auth_uid,
    name: c.users?.[0]?.name ?? 'Unknown',
    email: c.users?.[0]?.email ?? '',
  }));

  // Check which trainees have existing active/pending plans
  const { data: existingPlans } = await supabase
    .from('assigned_plans')
    .select('trainee_auth_uid')
    .in('trainee_auth_uid', trainees.map((t) => t.authUid))
    .in('status', ['pending', 'active']);

  const traineesWithActivePlan = new Set(
    (existingPlans ?? []).map((p: any) => p.trainee_auth_uid)
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/trainer/plans/${planId}`}
          className="text-sm text-text-primary hover:text-accent transition-colors"
        >
          &larr; {planData.name}
        </Link>
        <h1 className="text-2xl font-bold text-text-primary mt-1">Assign plan</h1>
        <p className="text-sm text-text-primary opacity-60">Select a trainee to assign this plan to</p>
      </div>

      <AssignPlanClientPage
        planId={planId}
        planName={planData.name}
        trainees={trainees}
        traineesWithActivePlan={[...traineesWithActivePlan]}
        exercises={exercises}
      />
    </div>
  );
}
