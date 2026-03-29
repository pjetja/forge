import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTranslations } from 'next-intl/server';
import { CompletedPlanColumns } from '@/components/CompletedPlanColumns';

interface TrainerPlanSummaryPageProps {
  params: Promise<{ traineeId: string; assignedPlanId: string }>;
}

export default async function TrainerPlanSummaryPage({ params }: TrainerPlanSummaryPageProps) {
  const { traineeId, assignedPlanId } = await params;

  const supabase = await createClient();
  const t = await getTranslations('trainer');

  const { data: plan } = await supabase
    .from('assigned_plans')
    .select('id, name, week_count, workouts_per_week, status')
    .eq('id', assignedPlanId)
    .eq('trainee_auth_uid', traineeId)
    .maybeSingle();

  if (!plan) notFound();

  const { data: traineeProfile } = await supabase
    .from('users')
    .select('name')
    .eq('auth_uid', traineeId)
    .single();

  const { data: schemas } = await supabase
    .from('assigned_schemas')
    .select('id, name, slot_index')
    .eq('assigned_plan_id', assignedPlanId)
    .order('slot_index', { ascending: true });

  const schemaList = schemas ?? [];
  const schemaIds = schemaList.map((s) => s.id);
  const schemaById = Object.fromEntries(schemaList.map((s) => [s.id, s]));

  // All completed sessions in chronological order
  const { data: allCompletedRaw } =
    schemaIds.length > 0
      ? await supabase
          .from('workout_sessions')
          .select('id, assigned_schema_id, completed_at')
          .eq('trainee_auth_uid', traineeId)
          .eq('status', 'completed')
          .in('assigned_schema_id', schemaIds)
          .order('completed_at', { ascending: true })
      : { data: [] };

  const allCompleted = allCompletedRaw ?? [];

  // In-progress session (if any)
  const { data: inProgressSession } =
    schemaIds.length > 0
      ? await supabase
          .from('workout_sessions')
          .select('id, assigned_schema_id')
          .eq('trainee_auth_uid', traineeId)
          .eq('status', 'in_progress')
          .in('assigned_schema_id', schemaIds)
          .maybeSingle()
      : { data: null };

  // Week grouping
  const N = plan.workouts_per_week;
  const totalRequired = plan.week_count * N;
  const planComplete = allCompleted.length >= totalRequired;

  const batches: Array<typeof allCompleted> = [];
  for (let i = 0; i < allCompleted.length; i += N) {
    batches.push(allCompleted.slice(i, i + N));
  }
  const lastBatch = batches[batches.length - 1];
  const lastBatchComplete = lastBatch && lastBatch.length >= N;

  const currentBatch = !lastBatchComplete && lastBatch ? lastBatch : [];
  const completedInCurrentWeek = new Set(currentBatch.map((s) => s.assigned_schema_id));
  const completedSessionBySchema = new Map(currentBatch.map((s) => [s.assigned_schema_id, s]));

  const pastBatches = lastBatchComplete ? batches : batches.slice(0, -1);
  const pastWeeks = [...pastBatches]
    .reverse()
    .map((sessions, revIdx) => ({
      weekNumber: pastBatches.length - revIdx,
      sessions,
    }));

  // Fetch exercises
  const admin = createAdminClient();
  type ExGroup = { schemaId: string; schemaName: string; exercises: { id: string; name: string; muscle_group: string }[] };
  let exercisesBySchema: ExGroup[] = [];

  if (schemaIds.length > 0) {
    const { data: aseRows } = await supabase
      .from('assigned_schema_exercises')
      .select('id, exercise_id, assigned_schema_id')
      .in('assigned_schema_id', schemaIds)
      .order('sort_order');

    if (aseRows && aseRows.length > 0) {
      const exerciseIds = [...new Set(aseRows.map((r) => r.exercise_id))];
      const { data: exerciseRows } = await admin
        .from('exercises')
        .select('id, name, muscle_group')
        .in('id', exerciseIds);

      const exerciseMap = new Map(
        (exerciseRows ?? []).map((e: { id: string; name: string; muscle_group: string | null }) => [e.id, e])
      );

      for (const schema of schemaList) {
        const exs = aseRows
          .filter((a) => a.assigned_schema_id === schema.id)
          .map((a) => { const e = exerciseMap.get(a.exercise_id); return e ? { id: a.id, name: e.name, muscle_group: e.muscle_group ?? '' } : null; })
          .filter((e): e is { id: string; name: string; muscle_group: string } => e !== null);
        if (exs.length > 0) exercisesBySchema.push({ schemaId: schema.id, schemaName: schema.name, exercises: exs });
      }
    }
  }

  const traineeName = traineeProfile?.name ?? 'Trainee';

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/trainer/trainees/${traineeId}`}
        className="inline-flex items-center gap-1 text-sm text-text-primary hover:text-accent transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('traineeDetail.planView.backTo', { traineeName })}
      </Link>

      {/* Plan header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{plan.name}</h1>
        <p className="text-sm text-text-primary opacity-60 mt-1">
          {t('traineeDetail.planView.workoutsPerWeek', { count: plan.workouts_per_week })} &middot; {t('traineeDetail.planView.weeksCount', { count: plan.week_count })} &middot; {traineeName}
        </p>
      </div>

      {/* Status banner */}
      {planComplete ? (
        <div className="bg-accent/10 border border-accent/30 rounded-sm px-4 py-4 text-center space-y-1">
          <p className="font-semibold text-accent">{t('traineeDetail.planView.planComplete')}</p>
          <p className="text-sm text-text-primary">{t('traineeDetail.planView.planCompleteDescription', { traineeName, weeks: plan.week_count })}</p>
        </div>
      ) : plan.status === 'pending' ? (
        <div className="bg-border/40 border border-border rounded-sm px-4 py-3 text-sm text-text-primary opacity-70">
          {t('traineeDetail.planView.planNotStarted')}
        </div>
      ) : (
        <div className="bg-accent/10 border border-accent/30 rounded-sm px-4 py-3 text-sm text-accent font-medium">
          {t('traineeDetail.planView.activeProgress', { done: allCompleted.length, total: totalRequired })}
        </div>
      )}

      {/* Completed plan: use two-column summary component */}
      {planComplete ? (
        <CompletedPlanColumns
          pastWeeks={pastWeeks.map((w) => ({
            weekNumber: w.weekNumber,
            sessions: w.sessions.map((s) => ({
              id: s.id,
              schemaName: schemaById[s.assigned_schema_id]?.name ?? 'Workout',
            })),
          }))}
          exercisesBySchema={exercisesBySchema}
          getWorkoutHref={(sessionId) =>
            `/trainer/trainees/${traineeId}/plans/${assignedPlanId}/workouts/${sessionId}`
          }
          getExerciseHref={(exerciseId) =>
            `/trainer/trainees/${traineeId}/plans/${assignedPlanId}/exercises/${exerciseId}`
          }
        />
      ) : (
        /* Active / pending plan: two-column layout */
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
          {/* ── Left: Workouts ── */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">{t('traineeDetail.planView.workoutsHeading')}</h2>

            {/* Current week */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-primary opacity-60 uppercase tracking-wide">{t('traineeDetail.planView.currentWeek')}</h3>
                <span className="text-xs text-text-primary opacity-60">{t('traineeDetail.planView.doneOfTotal', { done: completedInCurrentWeek.size, n: N })}</span>
              </div>

              {schemaList.length === 0 ? (
                <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
                  <p className="text-sm text-text-primary">{t('traineeDetail.planView.noWorkoutsInPlan')}</p>
                </div>
              ) : (
                <>
                  {/* Pending workouts */}
                  {schemaList.filter((s) => !completedInCurrentWeek.has(s.id)).length > 0 && (
                    <div className="space-y-2">
                      {schemaList
                        .filter((s) => !completedInCurrentWeek.has(s.id))
                        .map((schema) => {
                          const isInProgress = inProgressSession?.assigned_schema_id === schema.id;
                          const schemaHref = isInProgress && inProgressSession
                            ? `/trainer/trainees/${traineeId}/plans/${assignedPlanId}/workouts/${inProgressSession.id}`
                            : `/trainer/trainees/${traineeId}/plans/${assignedPlanId}/schemas/${schema.id}`;
                          return (
                            <Link
                              key={schema.id}
                              href={schemaHref}
                              className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between gap-4 hover:border-accent/50 transition-colors"
                            >
                              <p className="font-medium text-text-primary">{schema.name}</p>
                              {isInProgress ? (
                                <span className="text-xs font-medium text-yellow-400 border border-yellow-400/40 bg-yellow-400/10 rounded-sm px-2 py-0.5">
                                  {t('traineeDetail.planView.inProgress')}
                                </span>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-text-primary opacity-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              )}
                            </Link>
                          );
                        })}
                    </div>
                  )}

                  {/* Completed this week */}
                  {completedInCurrentWeek.size > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-medium text-text-primary opacity-50 uppercase tracking-wide">{t('traineeDetail.planView.completedThisWeek')}</p>
                      {schemaList
                        .filter((s) => completedInCurrentWeek.has(s.id))
                        .map((schema) => {
                          const session = completedSessionBySchema.get(schema.id);
                          return (
                            <Link
                              key={schema.id}
                              href={session ? `/trainer/trainees/${traineeId}/plans/${assignedPlanId}/workouts/${session.id}` : '#'}
                              className="bg-bg-surface border border-accent/30 rounded-sm px-4 py-3 flex items-center justify-between hover:border-accent/60 transition-colors opacity-80 hover:opacity-100"
                            >
                              <p className="text-sm font-medium text-text-primary">{schema.name}</p>
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {t('traineeDetail.planView.done')}
                              </span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Past weeks */}
            {pastWeeks.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-text-primary opacity-60 uppercase tracking-wide">{t('traineeDetail.planView.pastWeeks')}</h3>
                {pastWeeks.map((week) => (
                  <div key={week.weekNumber} className="space-y-1.5">
                    <p className="text-xs font-medium text-text-primary opacity-50 uppercase tracking-wide">
                      {t('traineeDetail.planView.weekNumber', { number: week.weekNumber })}
                    </p>
                    <div className="space-y-1.5">
                      {week.sessions.map((s) => {
                        const schema = schemaById[s.assigned_schema_id];
                        return (
                          <Link
                            key={s.id}
                            href={`/trainer/trainees/${traineeId}/plans/${assignedPlanId}/workouts/${s.id}`}
                            className="bg-bg-surface border border-border rounded-sm px-4 py-3 flex items-center justify-between hover:border-accent/50 transition-colors opacity-70 hover:opacity-100"
                          >
                            <p className="text-sm font-medium text-text-primary">{schema?.name ?? 'Workout'}</p>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-text-primary opacity-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {pastWeeks.length === 0 && schemaList.length > 0 && allCompleted.length === 0 && (
              <p className="text-sm text-text-primary opacity-40">{t('traineeDetail.planView.noCompletedWorkouts')}</p>
            )}
          </div>

          {/* ── Right: Exercises ── */}
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">{t('traineeDetail.planView.exercisesHeading')}</h2>
            {exercisesBySchema.length === 0 ? (
              <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
                <p className="text-sm text-text-primary opacity-50">{t('traineeDetail.planView.noExercises')}</p>
              </div>
            ) : (
              <>
                {exercisesBySchema.map((group) => (
                  <div key={group.schemaId} className="space-y-1.5">
                    <p className="text-xs font-medium text-text-primary opacity-50 uppercase tracking-wide">{group.schemaName}</p>
                    <div className="space-y-1.5">
                      {group.exercises.map((ex) => (
                        <Link
                          key={ex.id}
                          href={`/trainer/trainees/${traineeId}/plans/${assignedPlanId}/exercises/${ex.id}`}
                          className="bg-bg-surface border border-border rounded-sm px-4 py-3 flex items-center justify-between hover:border-accent/50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                            {ex.muscle_group && (
                              <p className="text-xs text-text-primary opacity-50 mt-0.5">{ex.muscle_group}</p>
                            )}
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-text-primary opacity-40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-text-primary opacity-40">{t('traineeDetail.planView.tapExercise')}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
