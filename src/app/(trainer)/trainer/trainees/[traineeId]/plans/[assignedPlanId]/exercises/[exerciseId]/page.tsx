import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTranslations } from 'next-intl/server';
import { ProgressChart } from '@/app/(trainee)/trainee/plans/[assignedPlanId]/exercises/[exerciseId]/_components/ProgressChart';
import { ProgressionBadge } from '@/components/ProgressionBadge';

interface TrainerExerciseProgressPageProps {
  params: Promise<{ traineeId: string; assignedPlanId: string; exerciseId: string }>;
}

export default async function TrainerExerciseProgressPage({ params }: TrainerExerciseProgressPageProps) {
  const { traineeId, assignedPlanId, exerciseId } = await params;
  // exerciseId = assigned_schema_exercise_id

  const supabase = await createClient();
  const t = await getTranslations('trainer');

  // Verify plan belongs to this trainee
  const { data: plan } = await supabase
    .from('assigned_plans')
    .select('id, name')
    .eq('id', assignedPlanId)
    .eq('trainee_auth_uid', traineeId)
    .maybeSingle();

  if (!plan) notFound();

  // Fetch assigned_schema_exercise
  const { data: ase } = await supabase
    .from('assigned_schema_exercises')
    .select('id, exercise_id, sets, reps, target_weight_kg, tempo, progression_mode, rpe_target, rir_target, weight_increment_per_week')
    .eq('id', exerciseId)
    .single();

  if (!ase) notFound();

  // Fetch exercise name + muscle_group via admin client
  const admin = createAdminClient();
  const { data: exerciseRow } = await admin
    .from('exercises')
    .select('name, muscle_group')
    .eq('id', ase.exercise_id)
    .single();

  const exerciseInfo = exerciseRow ?? { name: 'Unknown', muscle_group: '' };

  // Fetch all completed sessions for this trainee in chronological order
  const { data: sessionsData } = await supabase
    .from('workout_sessions')
    .select('id, completed_at')
    .eq('trainee_auth_uid', traineeId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: true });

  const sessions = sessionsData ?? [];
  const sessionIds = sessions.map((s) => s.id);

  // Fetch all session_sets for this exercise
  const { data: setsData } =
    sessionIds.length > 0
      ? await supabase
          .from('session_sets')
          .select('session_id, set_number, actual_weight_kg, actual_reps')
          .eq('assigned_schema_exercise_id', exerciseId)
          .in('session_id', sessionIds)
          .order('set_number', { ascending: true })
      : { data: [] };

  const allSets = setsData ?? [];

  // Group sets by session
  const setsBySession = new Map<string, typeof allSets>();
  for (const set of allSets) {
    const existing = setsBySession.get(set.session_id) ?? [];
    existing.push(set);
    setsBySession.set(set.session_id, existing);
  }

  const maxSetCount = allSets.reduce((max, s) => Math.max(max, s.set_number), 0);

  type ChartPoint = { label: string } & Record<string, number | null | string>;
  const sessionsWithSets = sessions
    .filter((s) => setsBySession.has(s.id))
    .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime());
  const chartData: ChartPoint[] = sessionsWithSets.map((s, idx) => {
    const sets = setsBySession.get(s.id)!;
    const bySetNumber = new Map(sets.map((ss) => [ss.set_number, ss.actual_weight_kg]));
    const point: ChartPoint = { label: `Workout ${idx + 1}` };
    for (let n = 1; n <= maxSetCount; n++) {
      const raw = bySetNumber.get(n);
      point[`set${n}`] = raw != null ? Math.round(parseFloat(String(raw)) * 10) / 10 : null;
    }
    return point;
  });

  const repsChartData: ChartPoint[] = sessionsWithSets.map((s, idx) => {
    const sets = setsBySession.get(s.id)!;
    const bySetNumber = new Map(sets.map((ss) => [ss.set_number, ss.actual_reps]));
    const point: ChartPoint = { label: `Workout ${idx + 1}` };
    for (let n = 1; n <= maxSetCount; n++) {
      const v = bySetNumber.get(n);
      point[`set${n}`] = v ?? null;
    }
    return point;
  });

  function sessionAvg(point: ChartPoint): number | null {
    const vals: number[] = [];
    for (let n = 1; n <= maxSetCount; n++) {
      const v = point[`set${n}`];
      if (typeof v === 'number') vals.push(v);
    }
    return vals.length > 0
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
      : null;
  }

  const firstSession = chartData[0] ?? null;
  const lastSession = chartData[chartData.length - 1] ?? null;
  const firstAvg = firstSession ? sessionAvg(firstSession) : null;
  const lastAvg = lastSession ? sessionAvg(lastSession) : null;
  const weightDelta =
    firstAvg != null && lastAvg != null && chartData.length > 1
      ? Math.round((lastAvg - firstAvg) * 10) / 10
      : null;

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
        {t('traineeDetail.planView.backToPlan')}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{exerciseInfo.name}</h1>
        {(exerciseInfo.muscle_group || (ase as any).tempo || ((ase as any).progression_mode && (ase as any).progression_mode !== 'none')) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {exerciseInfo.muscle_group && (
              <span className="text-xs text-text-primary border border-border rounded-sm px-1.5 py-0.5">
                {exerciseInfo.muscle_group}
              </span>
            )}
            {(ase as any).tempo && (
              <span className="text-xs text-text-primary border border-border rounded-sm px-1.5 py-0.5">
                Tempo {(ase as any).tempo}
              </span>
            )}
            {(ase as any).progression_mode && (ase as any).progression_mode !== 'none' && (
              <ProgressionBadge mode={(ase as any).progression_mode} />
            )}
          </div>
        )}
        <p className="mt-1 text-sm text-text-primary opacity-60">
          {ase.sets} sets &middot; {ase.reps} reps
          {ase.target_weight_kg != null && (
            <> &middot; {parseFloat(String(ase.target_weight_kg))} kg target</>
          )}
          {(ase as any).progression_mode === 'rpe' && (ase as any).rpe_target != null && (
            <> &middot; RPE {(ase as any).rpe_target}</>
          )}
          {(ase as any).progression_mode === 'rir' && (ase as any).rir_target != null && (
            <> &middot; RIR {(ase as any).rir_target}</>
          )}
          {(ase as any).progression_mode === 'linear' && (ase as any).weight_increment_per_week != null && (
            <> &middot; +{parseFloat(String((ase as any).weight_increment_per_week))} kg/week</>
          )}
        </p>
      </div>

      {/* Start vs finish summary */}
      {chartData.length > 1 && weightDelta !== null && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-bg-surface border border-border rounded-sm px-3 py-3 text-center">
            <p className="text-xs text-text-primary opacity-50 mb-1">{t('traineeDetail.workout.startLabel')}</p>
            <p className="text-lg font-bold text-text-primary">{firstAvg} kg</p>
          </div>
          <div className="bg-bg-surface border border-border rounded-sm px-3 py-3 text-center">
            <p className="text-xs text-text-primary opacity-50 mb-1">{t('traineeDetail.workout.finishLabel')}</p>
            <p className="text-lg font-bold text-text-primary">{lastAvg} kg</p>
          </div>
          <div className="bg-bg-surface border border-border rounded-sm px-3 py-3 text-center">
            <p className="text-xs text-text-primary opacity-50 mb-1">{t('traineeDetail.workout.changeLabel')}</p>
            <p className={`text-lg font-bold ${weightDelta > 0 ? 'text-accent' : weightDelta < 0 ? 'text-red-400' : 'text-text-primary'}`}>
              {weightDelta > 0 ? '+' : ''}{weightDelta} kg
            </p>
          </div>
        </div>
      )}

      {/* Weight chart */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-text-primary opacity-60 uppercase tracking-wide">
          {t('traineeDetail.workout.weightOverSessions')}
        </h2>
        <div className="bg-bg-surface border border-border rounded-sm px-2 py-4">
          <ProgressChart data={chartData} setCount={maxSetCount} unit="kg" />
        </div>
      </section>

      {/* Reps chart */}
      {repsChartData.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-text-primary opacity-60 uppercase tracking-wide">
            {t('traineeDetail.workout.repsOverSessions')}
          </h2>
          <div className="bg-bg-surface border border-border rounded-sm px-2 py-4">
            <ProgressChart data={repsChartData} setCount={maxSetCount} unit="reps" />
          </div>
        </section>
      )}

      {chartData.length === 0 && (
        <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
          <p className="text-sm text-text-primary opacity-50">{t('traineeDetail.workout.noSets')}</p>
        </div>
      )}
    </div>
  );
}
