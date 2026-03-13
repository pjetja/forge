import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditAssignedPlanClient } from './EditAssignedPlanClient';

export default async function EditAssignedPlanPage({
  params,
}: {
  params: Promise<{ traineeId: string; assignedPlanId: string }>;
}) {
  const { traineeId, assignedPlanId } = await params;
  const supabase = await createClient();

  const { data: assignedPlan } = await supabase
    .from('assigned_plans')
    .select('id, name, status, week_count, workouts_per_week')
    .eq('id', assignedPlanId)
    .eq('trainee_auth_uid', traineeId)
    .single();

  if (!assignedPlan) notFound();

  const { data: traineeProfile } = await supabase
    .from('users')
    .select('name')
    .eq('auth_uid', traineeId)
    .single();

  // Fetch assigned schema exercises with exercise details
  const { data: schemaExercisesData } = await supabase
    .from('assigned_schema_exercises')
    .select(`
      id,
      exercise_id,
      sort_order,
      sets,
      reps,
      target_weight_kg,
      per_set_weights,
      exercises (name, muscle_group),
      assigned_schemas!inner (assigned_plan_id)
    `)
    .eq('assigned_schemas.assigned_plan_id', assignedPlanId)
    .order('sort_order');

  const exercises = (schemaExercisesData ?? []).map((row: any) => ({
    assignedExerciseId: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercises?.name ?? 'Unknown',
    muscleGroup: row.exercises?.muscle_group ?? '',
    sets: row.sets,
    reps: row.reps,
    targetWeightKg: row.target_weight_kg ? parseFloat(row.target_weight_kg) : null,
    perSetWeights: Array.isArray(row.per_set_weights) ? row.per_set_weights : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/trainer/trainees/${traineeId}`}
          className="text-sm text-text-primary hover:text-accent transition-colors"
        >
          &larr; {traineeProfile?.name ?? 'Trainee'}
        </Link>
        <h1 className="text-2xl font-bold text-text-primary mt-1">{assignedPlan.name}</h1>
        <p className="text-sm text-text-primary opacity-60">
          Editing {traineeProfile?.name ?? 'trainee'}&apos;s assigned plan &middot;{' '}
          <span className={assignedPlan.status === 'active' ? 'text-accent' : 'text-text-primary'}>
            {assignedPlan.status}
          </span>
        </p>
        <p className="text-xs text-text-primary opacity-50 mt-1">
          Changes take effect immediately. Trainee will see a &ldquo;Plan updated&rdquo; notice.
        </p>
      </div>

      <EditAssignedPlanClient
        assignedPlanId={assignedPlanId}
        traineeId={traineeId}
        exercises={exercises}
      />
    </div>
  );
}
