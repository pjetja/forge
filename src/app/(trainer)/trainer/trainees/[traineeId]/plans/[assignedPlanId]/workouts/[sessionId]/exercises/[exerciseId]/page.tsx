import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTranslations } from 'next-intl/server';

interface TrainerExerciseLogPageProps {
  params: Promise<{ traineeId: string; assignedPlanId: string; sessionId: string; exerciseId: string }>;
}

export default async function TrainerExerciseLogPage({ params }: TrainerExerciseLogPageProps) {
  const { traineeId, assignedPlanId, sessionId, exerciseId } = await params;

  const supabase = await createClient();
  const t = await getTranslations('trainer');

  // Verify session belongs to this trainee
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .eq('trainee_auth_uid', traineeId)
    .maybeSingle();

  if (!session) notFound();

  // Fetch assigned_schema_exercise
  const { data: rawExercise } = await supabase
    .from('assigned_schema_exercises')
    .select('id, exercise_id, sets, reps, target_weight_kg, per_set_weights')
    .eq('id', exerciseId)
    .single();

  if (!rawExercise) notFound();

  const ex = rawExercise as {
    id: string;
    exercise_id: string;
    sets: number;
    reps: number;
    target_weight_kg: string | null;
    per_set_weights: number[] | null;
  };

  const admin = createAdminClient();
  const { data: exerciseRow } = await admin
    .from('exercises')
    .select('name, muscle_group, description, video_url')
    .eq('id', ex.exercise_id)
    .single();

  const exerciseInfo = exerciseRow ?? { name: 'Unknown', muscle_group: '', description: null, video_url: null };

  // Fetch logged sets for this exercise in this session
  const { data: loggedSetsData } = await supabase
    .from('session_sets')
    .select('set_number, actual_reps, actual_weight_kg, muscle_failure')
    .eq('session_id', sessionId)
    .eq('assigned_schema_exercise_id', exerciseId)
    .order('set_number');

  const loggedSets = loggedSetsData ?? [];

  const perSetWeights = Array.isArray(ex.per_set_weights) ? (ex.per_set_weights as number[]) : null;
  const targetWeightKgBase = ex.target_weight_kg != null ? parseFloat(String(ex.target_weight_kg)) : null;

  // Build rows for all planned sets, plus any extra sets logged
  const maxSetNumber = Math.max(ex.sets, loggedSets.length > 0 ? Math.max(...loggedSets.map((s) => s.set_number)) : 0);
  const loggedBySetNumber = new Map(loggedSets.map((s) => [s.set_number, s]));

  const setRows = Array.from({ length: maxSetNumber }, (_, i) => {
    const setNumber = i + 1;
    const logged = loggedBySetNumber.get(setNumber);
    const targetWeightKg = perSetWeights?.[i] ?? targetWeightKgBase;
    return {
      setNumber,
      targetReps: ex.reps,
      targetWeightKg,
      actualReps: logged?.actual_reps ?? null,
      actualWeightKg: logged?.actual_weight_kg != null ? parseFloat(String(logged.actual_weight_kg)) : null,
      muscleFailure: logged?.muscle_failure ?? false,
      logged: !!logged,
      isExtra: setNumber > ex.sets,
    };
  });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/trainer/trainees/${traineeId}/plans/${assignedPlanId}/workouts/${sessionId}`}
        className="inline-flex items-center gap-1 text-sm text-text-primary hover:text-accent transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('traineeDetail.workout.backToWorkout')}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{exerciseInfo.name}</h1>
        {exerciseInfo.muscle_group && (
          <span className="inline-block mt-1 text-xs text-text-primary border border-border rounded-sm px-1.5 py-0.5">
            {exerciseInfo.muscle_group}
          </span>
        )}
        {exerciseInfo.description && (
          <p className="mt-2 text-sm text-text-secondary">{exerciseInfo.description}</p>
        )}
        <p className="mt-1 text-xs text-text-primary opacity-60">
          {t('traineeDetail.workout.target', { sets: ex.sets, reps: ex.reps })}
          {targetWeightKgBase != null && <> &middot; {targetWeightKgBase} kg</>}
        </p>
      </div>

      {/* Set log table */}
      {loggedSets.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
          <p className="text-sm text-text-primary opacity-50">{t('traineeDetail.workout.noSets')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Column headers */}
          <div className="grid grid-cols-[2rem_1fr_1fr_auto_2rem] gap-2 px-1 pb-1 text-xs text-text-secondary font-medium">
            <span className="text-center">#</span>
            <span className="text-center">{t('traineeDetail.workout.repsHeader')}</span>
            <span className="text-center">{t('traineeDetail.workout.weightHeader')}</span>
            <span className="text-center">{t('traineeDetail.workout.failHeader')}</span>
            <span></span>
          </div>

          {setRows.map((row) => (
            <div
              key={row.setNumber}
              className={`grid grid-cols-[2rem_1fr_1fr_auto_2rem] gap-2 items-center py-3 border-b border-border ${
                !row.logged ? 'opacity-30' : ''
              }`}
            >
              <span className="text-xs text-text-secondary font-medium text-center">
                {row.setNumber}
                {row.isExtra && <span className="ml-0.5 text-accent">+</span>}
              </span>

              <span className={`text-sm text-center font-medium ${row.logged ? 'text-text-primary' : 'text-text-secondary'}`}>
                {row.actualReps != null ? row.actualReps : '—'}
                {row.actualReps != null && row.actualReps !== row.targetReps && (
                  <span className="ml-1 text-xs opacity-50">/{row.targetReps}</span>
                )}
              </span>

              <span className={`text-sm text-center font-medium ${row.logged ? 'text-text-primary' : 'text-text-secondary'}`}>
                {row.actualWeightKg != null ? `${row.actualWeightKg}` : '—'}
              </span>

              <span className="text-xs font-medium text-center">
                {row.muscleFailure ? (
                  <span className="text-red-400">F</span>
                ) : (
                  <span className="opacity-20">—</span>
                )}
              </span>

              {/* Completion indicator */}
              <span>
                {row.logged && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Video */}
      {exerciseInfo.video_url && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-primary opacity-60 uppercase tracking-wide">{t('traineeDetail.workout.exerciseVideo')}</p>
          <div className="aspect-video w-full rounded-sm overflow-hidden bg-black">
            {exerciseInfo.video_url.includes('youtube.com') || exerciseInfo.video_url.includes('youtu.be') ? (
              <iframe
                src={exerciseInfo.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${exerciseInfo.name} video`}
              />
            ) : (
              <video src={exerciseInfo.video_url} controls className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
