import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTranslations } from 'next-intl/server';

interface TrainerSessionPageProps {
  params: Promise<{ traineeId: string; assignedPlanId: string; sessionId: string }>;
}

export default async function TrainerWorkoutSessionPage({ params }: TrainerSessionPageProps) {
  const { traineeId, assignedPlanId, sessionId } = await params;

  const supabase = await createClient();
  const t = await getTranslations('trainer');

  // Verify session belongs to this trainee
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('id, status, started_at, assigned_schema_id')
    .eq('id', sessionId)
    .eq('trainee_auth_uid', traineeId)
    .maybeSingle();

  if (!session) notFound();

  // Fetch schema with exercises
  const { data: rawSchema } = await supabase
    .from('assigned_schemas')
    .select(
      'id, name, slot_index, assigned_schema_exercises(id, exercise_id, sort_order, sets, reps, target_weight_kg)'
    )
    .eq('id', session.assigned_schema_id)
    .single();

  if (!rawSchema) notFound();

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
  };

  const rawExercises = Array.isArray(rawSchema.assigned_schema_exercises)
    ? (rawSchema.assigned_schema_exercises as unknown as RawExercise[])
    : rawSchema.assigned_schema_exercises
      ? ([rawSchema.assigned_schema_exercises] as unknown as RawExercise[])
      : [];

  const admin = createAdminClient();
  const exerciseIds = rawExercises.map((ex) => ex.exercise_id);
  const { data: exerciseRows } = exerciseIds.length > 0
    ? await admin.from('exercises').select('id, name, muscle_group').in('id', exerciseIds)
    : { data: [] };
  const exerciseMap = Object.fromEntries((exerciseRows ?? []).map((e) => [e.id, e]));

  const exercises = rawExercises
    .map((ex) => {
      const info = exerciseMap[ex.exercise_id];
      return {
        id: ex.id,
        sortOrder: ex.sort_order,
        sets: ex.sets,
        reps: ex.reps,
        targetWeightKg: ex.target_weight_kg,
        name: info?.name ?? 'Unknown',
        muscleGroup: info?.muscle_group ?? '',
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Fetch logged sets for this session
  const { data: sessionSets } = await supabase
    .from('session_sets')
    .select('assigned_schema_exercise_id, set_number')
    .eq('session_id', sessionId);

  const loggedSets = sessionSets ?? [];
  const setsLoggedByExercise = new Map<string, number>();
  loggedSets.forEach((s) => {
    setsLoggedByExercise.set(
      s.assigned_schema_exercise_id,
      (setsLoggedByExercise.get(s.assigned_schema_exercise_id) ?? 0) + 1
    );
  });

  const sessionDate = session.started_at
    ? new Date(session.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/trainer/trainees/${traineeId}/plans/${assignedPlanId}`}
        className="inline-flex items-center gap-1 text-sm text-text-primary hover:text-accent transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('traineeDetail.workout.backToPlan')}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{rawSchema.name}</h1>
        {plan && <p className="text-sm text-text-primary mt-0.5">{plan.name}</p>}
        <p className="text-xs text-text-primary opacity-60 mt-1">
          {t('traineeDetail.workout.workoutNumber', { number: rawSchema.slot_index + 1 })}
          {sessionDate && <> &middot; {sessionDate}</>}
        </p>
      </div>

      {/* Status banner */}
      <div className="bg-accent/10 border border-accent/30 rounded-sm px-4 py-3 text-sm text-accent font-medium">
        {session.status === 'completed' ? t('traineeDetail.workout.completed') : t('traineeDetail.workout.inProgress')}
      </div>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
          <p className="text-sm text-text-primary">{t('traineeDetail.workout.noExercises')}</p>
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
                href={`/trainer/trainees/${traineeId}/plans/${assignedPlanId}/workouts/${sessionId}/exercises/${exercise.id}`}
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
                  <span className={`text-xs font-medium ${isComplete ? 'text-accent' : isPartial ? 'text-yellow-400' : 'text-text-primary'}`}>
                    {t('traineeDetail.workout.setsCount', { logged: setsLogged, required: setsRequired })}
                  </span>

                  {isComplete && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {isPartial && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}

                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-text-primary opacity-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
