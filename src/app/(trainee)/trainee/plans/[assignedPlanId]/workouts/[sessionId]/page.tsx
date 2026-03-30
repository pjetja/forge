import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTranslations } from 'next-intl/server';
import FinishWorkoutButton from './_components/FinishWorkoutButton';

interface SessionPageProps {
  params: Promise<{ assignedPlanId: string; sessionId: string }>;
}

export default async function WorkoutSessionPage({ params }: SessionPageProps) {
  const { assignedPlanId, sessionId } = await params;

  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) redirect('/login');

  // Fetch the workout session (must belong to this trainee)
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('id, status, started_at, assigned_schema_id')
    .eq('id', sessionId)
    .eq('trainee_auth_uid', claims.sub)
    .maybeSingle();

  if (!session) notFound();

  // Fetch the schema with exercises (no exercises join — RLS blocks trainee from reading exercises table)
  const { data: rawSchema } = await supabase
    .from('assigned_schemas')
    .select(
      'id, name, assigned_plan_id, slot_index, assigned_schema_exercises(id, exercise_id, sort_order, sets, reps, target_weight_kg, per_set_weights)'
    )
    .eq('id', session.assigned_schema_id)
    .single();

  if (!rawSchema) notFound();

  // Fetch the plan name for the sub-label
  const { data: plan } = await supabase
    .from('assigned_plans')
    .select('name')
    .eq('id', assignedPlanId)
    .maybeSingle();

  type RawExercise = {
    id: string;
    exercise_id: string;
    sort_order: number;
    sets: number;
    reps: number;
    target_weight_kg: string | null;
    per_set_weights: number[] | null;
  };

  const rawExercises = Array.isArray(rawSchema.assigned_schema_exercises)
    ? (rawSchema.assigned_schema_exercises as unknown as RawExercise[])
    : rawSchema.assigned_schema_exercises
      ? ([rawSchema.assigned_schema_exercises] as unknown as RawExercise[])
      : [];

  // Fetch exercise names/muscle groups via admin client (bypasses exercises RLS which is trainer-only)
  const exerciseIds = rawExercises.map((ex) => ex.exercise_id);
  const admin = createAdminClient();
  const { data: exerciseRows } = exerciseIds.length > 0
    ? await admin.from('exercises').select('id, name, muscle_group').in('id', exerciseIds)
    : { data: [] };
  const exerciseMap = Object.fromEntries((exerciseRows ?? []).map((e) => [e.id, e]));

  const exercises = rawExercises
    .map((ex) => {
      const info = exerciseMap[ex.exercise_id];
      return {
        id: ex.id,
        exerciseId: ex.exercise_id,
        sortOrder: ex.sort_order,
        sets: ex.sets,
        reps: ex.reps,
        targetWeightKg: ex.target_weight_kg,
        name: info?.name ?? 'Unknown',
        muscleGroup: info?.muscle_group ?? '',
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Fetch session_sets already logged for this session
  const { data: sessionSets } = await supabase
    .from('session_sets')
    .select('assigned_schema_exercise_id, set_number, completed_at')
    .eq('session_id', sessionId);

  const loggedSets = sessionSets ?? [];

  // Compute per-exercise progress
  const setsLoggedByExercise = new Map<string, number>();
  loggedSets.forEach((s) => {
    const current = setsLoggedByExercise.get(s.assigned_schema_exercise_id) ?? 0;
    setsLoggedByExercise.set(s.assigned_schema_exercise_id, current + 1);
  });

  const totalPlanSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const loggedSetCount = loggedSets.length;

  const t = await getTranslations('trainee');

  // Format session start date
  const sessionDate = session.started_at
    ? new Date(session.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href={`/trainee/plans/${assignedPlanId}`}
        className="inline-flex items-center gap-1 text-sm text-text-primary hover:text-accent transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('workout.backToPlan')}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{rawSchema.name}</h1>
        {plan && (
          <p className="text-sm text-text-primary mt-0.5">{plan.name}</p>
        )}
        <p className="text-xs text-text-primary mt-1">
          {t('workout.workoutNumber', { n: rawSchema.slot_index + 1 })}
          {sessionDate && <> &middot; {sessionDate}</>}
        </p>
      </div>

      {/* Completed banner */}
      {session.status === 'completed' && (
        <div className="bg-accent/10 border border-accent/30 rounded-sm px-4 py-3 text-sm text-accent font-medium">
          {t('workout.completedBrowsing')}
        </div>
      )}

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
          <p className="text-sm text-text-primary">{t('workout.noExercises')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((exercise) => {
            const setsLogged = setsLoggedByExercise.get(exercise.id) ?? 0;
            const setsRequired = exercise.sets;
            const isComplete = setsLogged >= setsRequired;
            const isPartial = setsLogged > 0 && setsLogged < setsRequired;

            return (
              <Link
                key={exercise.id}
                href={`/trainee/plans/${assignedPlanId}/workouts/${sessionId}/exercises/${exercise.id}`}
                className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between gap-4 hover:border-accent/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text-primary truncate">{exercise.name}</p>
                  {exercise.muscleGroup && (
                    <span className="inline-block mt-1 text-xs text-text-primary border border-border rounded-sm px-1.5 py-0.5">
                      {exercise.muscleGroup}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs font-medium ${
                      isComplete
                        ? 'text-accent'
                        : isPartial
                          ? 'text-yellow-400'
                          : 'text-text-primary'
                    }`}
                  >
                    {t('workout.setsCount', { logged: setsLogged, required: setsRequired })}
                  </span>

                  {isComplete && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-accent flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}

                  {isPartial && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-yellow-400 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}

                  {/* Chevron */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-text-primary flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer: Finish Workout */}
      {session.status === 'in_progress' && (
        <div className="pt-2">
          <FinishWorkoutButton
            sessionId={sessionId}
            assignedPlanId={assignedPlanId}
            loggedSetCount={loggedSetCount}
            totalPlanSets={totalPlanSets}
          />
        </div>
      )}
    </div>
  );
}
