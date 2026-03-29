import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SetList from './_components/SetList';

interface ExerciseDetailPageProps {
  params: Promise<{ assignedPlanId: string; sessionId: string; exerciseId: string }>;
}

export type SetRow = {
  setNumber: number;
  targetReps: number;
  targetWeightKg: number | null;
  actualReps: number;
  actualWeightKg: number | null;
  muscleFailure: boolean;
  completed: boolean;
  lastWeekReps: number | null;
  lastWeekWeightKg: number | null;
  lastWeekFailure: boolean;
};

export default async function ExerciseDetailPage({ params }: ExerciseDetailPageProps) {
  const { assignedPlanId, sessionId, exerciseId } = await params;

  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) redirect('/login');

  // Verify session ownership (exerciseId is assigned_schema_exercise_id)
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .eq('trainee_auth_uid', claims.sub)
    .maybeSingle();

  if (!session) notFound();

  // Fetch the assigned schema exercise (no exercises join — RLS blocks trainee from reading exercises table)
  const { data: rawExercise } = await supabase
    .from('assigned_schema_exercises')
    .select('id, exercise_id, sets, reps, target_weight_kg, per_set_weights, tempo, progression_mode')
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
    tempo: string | null;
    progression_mode: string;
  };

  // Fetch exercise name/muscle_group/video via admin client (bypasses trainer-only RLS on exercises table)
  const admin = createAdminClient();
  const { data: exerciseRow } = await admin
    .from('exercises')
    .select('name, muscle_group, description, video_url')
    .eq('id', ex.exercise_id)
    .single();

  const exerciseInfo = exerciseRow ?? { name: 'Unknown', muscle_group: '', description: null, video_url: null };

  // Fetch already-logged sets for this exercise in this session
  const { data: loggedSetsData } = await supabase
    .from('session_sets')
    .select('set_number, actual_reps, actual_weight_kg, muscle_failure')
    .eq('session_id', sessionId)
    .eq('assigned_schema_exercise_id', exerciseId)
    .order('set_number');

  const loggedSets = loggedSetsData ?? [];

  // Build a map for quick lookup: setNumber → logged data
  const loggedBySetNumber = new Map(
    loggedSets.map((s) => [
      s.set_number,
      {
        actualReps: s.actual_reps,
        actualWeightKg: s.actual_weight_kg != null ? parseFloat(String(s.actual_weight_kg)) : null,
        muscleFailure: s.muscle_failure ?? false,
      },
    ])
  );

  // Fetch previous session's results for this exercise.
  // Priority 1: same assigned_schema_exercise_id (same plan, previous week).
  // Priority 2: same physical exercise_id from any completed session (cross-plan).
  //
  // Security: we first fetch all the trainee's completed session IDs so that
  // session_sets are always filtered to sessions owned by this trainee.
  const { data: completedSessionsRaw } = await supabase
    .from('workout_sessions')
    .select('id, completed_at')
    .eq('trainee_auth_uid', claims.sub)
    .eq('status', 'completed')
    .neq('id', sessionId)
    .order('completed_at', { ascending: false });

  const completedSessions = completedSessionsRaw ?? [];
  const completedSessionIds = completedSessions.map((s) => s.id);
  // Map session_id → rank (0 = most recent) for picking the latest
  const sessionRecency = new Map(completedSessions.map((s, i) => [s.id, i]));

  type RawSet = { session_id: string; set_number: number; actual_reps: number; actual_weight_kg: string | null; muscle_failure: boolean };

  let lastSets: Array<{ set_number: number; actual_reps: number; actual_weight_kg: string | null; muscle_failure: boolean }> = [];

  if (completedSessionIds.length > 0) {
    // Priority 1: same assigned_schema_exercise_id
    const { data: samePrev } = await supabase
      .from('session_sets')
      .select('session_id, set_number, actual_reps, actual_weight_kg, muscle_failure')
      .eq('assigned_schema_exercise_id', exerciseId)
      .in('session_id', completedSessionIds) as { data: RawSet[] | null };

    if (samePrev && samePrev.length > 0) {
      const mostRecentId = samePrev.reduce((best, s) =>
        (sessionRecency.get(s.session_id) ?? 999) < (sessionRecency.get(best.session_id) ?? 999) ? s : best
      ).session_id;
      lastSets = samePrev.filter((s) => s.session_id === mostRecentId);
    } else {
      // Priority 2: same physical exercise_id across other plans
      const { data: otherAses } = await supabase
        .from('assigned_schema_exercises')
        .select('id')
        .eq('exercise_id', ex.exercise_id)
        .neq('id', exerciseId);

      const otherAseIds = (otherAses ?? []).map((a) => a.id);

      if (otherAseIds.length > 0) {
        const { data: crossPrev } = await supabase
          .from('session_sets')
          .select('session_id, set_number, actual_reps, actual_weight_kg, muscle_failure')
          .in('assigned_schema_exercise_id', otherAseIds)
          .in('session_id', completedSessionIds) as { data: RawSet[] | null };

        if (crossPrev && crossPrev.length > 0) {
          const mostRecentId = crossPrev.reduce((best, s) =>
            (sessionRecency.get(s.session_id) ?? 999) < (sessionRecency.get(best.session_id) ?? 999) ? s : best
          ).session_id;
          lastSets = crossPrev.filter((s) => s.session_id === mostRecentId);
        }
      }
    }
  }

  // Per-set weights pre-fill
  const perSetWeights = Array.isArray(ex.per_set_weights) ? (ex.per_set_weights as number[]) : null;
  const targetWeightKgBase =
    ex.target_weight_kg != null ? parseFloat(String(ex.target_weight_kg)) : null;

  // Build SetRow array (one row per plan set)
  const setRows: SetRow[] = Array.from({ length: ex.sets }, (_, i) => {
    const setNumber = i + 1;
    const logged = loggedBySetNumber.get(setNumber);
    const lastSet = lastSets.find((s) => s.set_number === setNumber);
    const targetWeightKg = perSetWeights?.[i] ?? targetWeightKgBase;

    return {
      setNumber,
      targetReps: ex.reps,
      targetWeightKg,
      actualReps: logged?.actualReps ?? ex.reps,
      actualWeightKg: logged?.actualWeightKg ?? targetWeightKg,
      muscleFailure: logged?.muscleFailure ?? false,
      completed: !!logged,
      lastWeekReps: lastSet?.actual_reps ?? null,
      lastWeekWeightKg:
        lastSet?.actual_weight_kg != null ? parseFloat(String(lastSet.actual_weight_kg)) : null,
      lastWeekFailure: lastSet?.muscle_failure ?? false,
    };
  });

  // Also include any extra sets the trainee added beyond the plan
  const maxLoggedSetNumber = loggedSets.length > 0 ? Math.max(...loggedSets.map((s) => s.set_number)) : 0;
  if (maxLoggedSetNumber > ex.sets) {
    for (let i = ex.sets + 1; i <= maxLoggedSetNumber; i++) {
      const logged = loggedBySetNumber.get(i);
      const lastSet = lastSets.find((s) => s.set_number === i);
      setRows.push({
        setNumber: i,
        targetReps: ex.reps,
        targetWeightKg: targetWeightKgBase,
        actualReps: logged?.actualReps ?? ex.reps,
        actualWeightKg: logged?.actualWeightKg ?? targetWeightKgBase,
        muscleFailure: logged?.muscleFailure ?? false,
        completed: !!logged,
        lastWeekReps: lastSet?.actual_reps ?? null,
        lastWeekWeightKg:
          lastSet?.actual_weight_kg != null ? parseFloat(String(lastSet.actual_weight_kg)) : null,
        lastWeekFailure: lastSet?.muscle_failure ?? false,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href={`/trainee/plans/${assignedPlanId}/workouts/${sessionId}`}
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
        Back to workout
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{exerciseInfo.name}</h1>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {exerciseInfo.muscle_group && (
            <span className="text-xs text-text-primary border border-border rounded-sm px-1.5 py-0.5">
              {exerciseInfo.muscle_group}
            </span>
          )}
          {ex.tempo && (
            <span className="text-xs text-text-primary border border-border rounded-sm px-1.5 py-0.5">
              Tempo {ex.tempo}
            </span>
          )}
          {ex.progression_mode && ex.progression_mode !== 'none' && (
            <span className="text-xs text-accent border border-accent/30 rounded-sm px-1.5 py-0.5">
              {ex.progression_mode === 'linear' && 'Linear progression'}
              {ex.progression_mode === 'double_progression' && 'Double progression'}
              {ex.progression_mode === 'rpe' && 'RPE'}
              {ex.progression_mode === 'rir' && 'RIR'}
            </span>
          )}
        </div>
        {exerciseInfo.description && (
          <p className="mt-2 text-sm text-text-secondary">{exerciseInfo.description}</p>
        )}
      </div>

      {/* Completed banner */}
      {session.status === 'completed' && (
        <div className="bg-accent/10 border border-accent/30 rounded-sm px-4 py-3 text-sm text-accent font-medium">
          This workout is completed — browsing history
        </div>
      )}

      {/* Set list */}
      <SetList sets={setRows} sessionId={sessionId} exerciseId={exerciseId} readOnly={session.status === 'completed'} />

      {/* Done button */}
      {session.status === 'in_progress' && (
        <Link
          href={`/trainee/plans/${assignedPlanId}/workouts/${sessionId}`}
          className="block w-full text-center bg-accent hover:bg-accent-hover text-white rounded-sm py-2.5 text-sm font-semibold transition-colors"
        >
          Done
        </Link>
      )}

      {/* Video */}
      {exerciseInfo.video_url && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-primary opacity-60 uppercase tracking-wide">Exercise video</p>
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
              <video
                src={exerciseInfo.video_url}
                controls
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
