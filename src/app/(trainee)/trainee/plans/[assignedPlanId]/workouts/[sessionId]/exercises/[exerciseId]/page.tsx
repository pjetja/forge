import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPreviousWeekBounds } from '@/lib/utils/week';
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

  // Fetch the assigned schema exercise with joined exercise details
  type RawExerciseJoin = {
    id: string;
    sets: number;
    reps: number;
    target_weight_kg: string | null;
    per_set_weights: number[] | null;
    exercises:
      | { name: string; muscle_group: string; description: string | null }
      | { name: string; muscle_group: string; description: string | null }[]
      | null;
  };

  const { data: rawExercise } = await supabase
    .from('assigned_schema_exercises')
    .select('id, sets, reps, target_weight_kg, per_set_weights, exercises(name, muscle_group, description)')
    .eq('id', exerciseId)
    .single();

  if (!rawExercise) notFound();

  const ex = rawExercise as unknown as RawExerciseJoin;

  // Array.isArray guard for the exercises join (RESEARCH Pitfall 4)
  const exerciseInfo = Array.isArray(ex.exercises)
    ? ex.exercises[0] ?? { name: 'Unknown', muscle_group: '', description: null }
    : ex.exercises ?? { name: 'Unknown', muscle_group: '', description: null };

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

  // Fetch last week's results scoped to this assigned_schema_exercise_id
  const { weekStart: prevStart, weekEnd: prevEnd } = getPreviousWeekBounds();

  const { data: lastSetsData } = await supabase
    .from('session_sets')
    .select('set_number, actual_reps, actual_weight_kg, muscle_failure')
    .eq('assigned_schema_exercise_id', exerciseId)
    .gte('completed_at', prevStart.toISOString())
    .lte('completed_at', prevEnd.toISOString())
    .order('set_number');

  const lastSets = lastSetsData ?? [];

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
        {exerciseInfo.muscle_group && (
          <span className="inline-block mt-1 text-xs text-text-primary border border-border rounded-sm px-1.5 py-0.5">
            {exerciseInfo.muscle_group}
          </span>
        )}
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
      <SetList sets={setRows} sessionId={sessionId} exerciseId={exerciseId} />

      {/* Notes placeholder */}
      <div className="space-y-1">
        <label className="text-xs text-text-secondary font-medium">
          Notes <span className="text-text-secondary/60">(coming soon)</span>
        </label>
        <textarea
          disabled
          rows={3}
          placeholder="Exercise notes will be saved in a future update"
          className="w-full bg-bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text-secondary resize-none opacity-50 cursor-not-allowed"
          aria-disabled="true"
        />
      </div>
    </div>
  );
}
