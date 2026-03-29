import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import StartWorkoutButton from './_components/StartWorkoutButton';
import { CompletedPlanColumns } from '@/components/CompletedPlanColumns';

interface ActivePlanPageProps {
  params: Promise<{ assignedPlanId: string }>;
}

export default async function ActivePlanPage({ params }: ActivePlanPageProps) {
  const { assignedPlanId } = await params;

  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) redirect('/login');

  const { data: plan } = await supabase
    .from('assigned_plans')
    .select('id, name, status, week_count, workouts_per_week, started_at')
    .eq('id', assignedPlanId)
    .eq('trainee_auth_uid', claims.sub)
    .maybeSingle();

  if (!plan) notFound();

  const { data: schemas } = await supabase
    .from('assigned_schemas')
    .select('id, name, slot_index')
    .eq('assigned_plan_id', assignedPlanId)
    .order('slot_index', { ascending: true });

  const schemaList = schemas ?? [];
  const schemaIds = schemaList.map((s) => s.id);
  const schemaById = Object.fromEntries(schemaList.map((s) => [s.id, s]));

  // All completed sessions for this plan in chronological order
  const { data: allCompletedRaw } =
    schemaIds.length > 0
      ? await supabase
          .from('workout_sessions')
          .select('id, assigned_schema_id, completed_at')
          .eq('trainee_auth_uid', claims.sub)
          .eq('status', 'completed')
          .in('assigned_schema_id', schemaIds)
          .order('completed_at', { ascending: true })
      : { data: [] };

  // In-progress session — scoped to this plan's schemas only
  const { data: inProgressSession } =
    schemaIds.length > 0
      ? await supabase
          .from('workout_sessions')
          .select('id, assigned_schema_id')
          .eq('trainee_auth_uid', claims.sub)
          .eq('status', 'in_progress')
          .in('assigned_schema_id', schemaIds)
          .maybeSingle()
      : { data: null };

  // ── Week grouping (meta concept — not calendar dates) ──────────────────────
  // Each "week" = workouts_per_week sequential completed sessions.
  // Last batch: if incomplete → current week. If complete → current week is fresh.

  const N = plan.workouts_per_week;
  const totalRequired = plan.week_count * N;
  // Cap so extra sessions don't create phantom weeks
  const allCompleted = (allCompletedRaw ?? []).slice(0, totalRequired);
  const planComplete = allCompleted.length >= totalRequired;

  const admin = createAdminClient();

  // Proactively mark complete if sessions say so but DB status hasn't caught up
  if (planComplete && plan.status !== 'completed') {
    await admin.from('assigned_plans').update({ status: 'completed' }).eq('id', assignedPlanId);
  }

  // Fetch all assigned_schema_exercises grouped by schema (right column)
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

      const exerciseMap = new Map((exerciseRows ?? []).map((e: { id: string; name: string; muscle_group: string | null }) => [e.id, e]));

      for (const schema of schemaList) {
        const exs = aseRows
          .filter((a) => a.assigned_schema_id === schema.id)
          .map((a) => { const e = exerciseMap.get(a.exercise_id); return e ? { id: a.id, name: e.name, muscle_group: e.muscle_group ?? '' } : null; })
          .filter((e): e is { id: string; name: string; muscle_group: string } => e !== null);
        if (exs.length > 0) exercisesBySchema.push({ schemaId: schema.id, schemaName: schema.name, exercises: exs });
      }
    }
  }

  // Slice completed sessions into week batches
  const batches: Array<typeof allCompleted> = [];
  for (let i = 0; i < allCompleted.length; i += N) {
    batches.push(allCompleted.slice(i, i + N));
  }

  const lastBatch = batches[batches.length - 1];
  const lastBatchComplete = lastBatch && lastBatch.length >= N;

  // Current batch: last incomplete batch, or empty if all complete (fresh week)
  const currentBatch = !lastBatchComplete && lastBatch ? lastBatch : [];
  const completedInCurrentWeek = new Set(currentBatch.map((s) => s.assigned_schema_id));
  // Map schema_id → session for completed workouts this week (for linking)
  const completedSessionBySchema = new Map(currentBatch.map((s) => [s.assigned_schema_id, s]));

  // Past batches: all complete batches (oldest = week 1)
  const pastBatches = lastBatchComplete ? batches : batches.slice(0, -1);
  // Reverse so most recent week is first
  const pastWeeks = [...pastBatches]
    .reverse()
    .map((sessions, revIdx) => ({
      weekNumber: pastBatches.length - revIdx,
      sessions,
    }));

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/trainee"
        className="inline-flex items-center gap-1 text-sm text-text-primary hover:text-accent transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to plans
      </Link>

      {/* Plan header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{plan.name}</h1>
        <p className="text-sm text-text-primary opacity-60 mt-1">
          {plan.workouts_per_week} workouts/week &middot; {plan.week_count} weeks
        </p>
      </div>

      {/* Plan complete banner */}
      {planComplete && (
        <div className="bg-accent/10 border border-accent/30 rounded-sm px-4 py-4 text-center space-y-1">
          <p className="font-semibold text-accent">Plan complete!</p>
          <p className="text-sm text-text-primary">
            You finished all {plan.week_count} weeks. Great work!
          </p>
        </div>
      )}

      {/* Two-column layout — shared component when complete, inline for active plan */}
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
          getWorkoutHref={(sessionId) => `/trainee/plans/${assignedPlanId}/workouts/${sessionId}`}
          getExerciseHref={(exerciseId) => `/trainee/plans/${assignedPlanId}/exercises/${exerciseId}`}
        />
      ) : (
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
          {/* ── Left: Workouts (active plan) ──────────────────────────── */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
              Workouts
            </h2>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-primary opacity-60 uppercase tracking-wide">Current week</h3>
                <span className="text-xs text-text-primary opacity-60">
                  {completedInCurrentWeek.size} of {N} done
                </span>
              </div>

              {schemaList.length === 0 ? (
                <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
                  <p className="text-sm text-text-primary">No workouts in this plan yet.</p>
                </div>
              ) : (
                <>
                  {/* Pending workouts — can be started */}
                  {schemaList.filter((s) => !completedInCurrentWeek.has(s.id)).length > 0 && (
                    <div className="space-y-2">
                      {schemaList
                        .filter((s) => !completedInCurrentWeek.has(s.id))
                        .map((schema) => {
                          const isInProgress = inProgressSession?.assigned_schema_id === schema.id;
                          const otherSessionInProgress = inProgressSession != null && !isInProgress;
                          return (
                            <div
                              key={schema.id}
                              className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between gap-4"
                            >
                              <p className="font-medium text-text-primary">{schema.name}</p>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isInProgress && inProgressSession ? (
                                  <>
                                    <span className="text-xs font-medium text-yellow-400 border border-yellow-400/40 bg-yellow-400/10 rounded-sm px-2 py-0.5">
                                      In progress
                                    </span>
                                    <Link
                                      href={`/trainee/plans/${assignedPlanId}/workouts/${inProgressSession.id}`}
                                      className="px-3 py-1.5 bg-accent text-white text-sm rounded-sm font-medium hover:bg-accent/90 transition-colors"
                                    >
                                      Resume
                                    </Link>
                                  </>
                                ) : (
                                  <StartWorkoutButton
                                    assignedSchemaId={schema.id}
                                    assignedPlanId={assignedPlanId}
                                    disabled={otherSessionInProgress}
                                    disabledReason={otherSessionInProgress ? 'Finish your current workout first' : undefined}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Completed workouts this week — shown below, no start button */}
                  {completedInCurrentWeek.size > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-medium text-text-primary opacity-50 uppercase tracking-wide">Completed this week</p>
                      {schemaList
                        .filter((s) => completedInCurrentWeek.has(s.id))
                        .map((schema) => {
                          const session = completedSessionBySchema.get(schema.id);
                          return (
                            <Link
                              key={schema.id}
                              href={session ? `/trainee/plans/${assignedPlanId}/workouts/${session.id}` : '#'}
                              className="bg-bg-surface border border-accent/30 rounded-sm px-4 py-3 flex items-center justify-between hover:border-accent/60 transition-colors opacity-80 hover:opacity-100"
                            >
                              <p className="text-sm font-medium text-text-primary">{schema.name}</p>
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Done
                              </span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
            </section>

            {pastWeeks.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-text-primary opacity-60 uppercase tracking-wide">Past weeks</h3>
                {pastWeeks.map((week) => (
                  <div key={week.weekNumber} className="space-y-1.5">
                    <p className="text-xs font-medium text-text-primary opacity-50 uppercase tracking-wide">
                      Week {week.weekNumber}
                    </p>
                    <div className="space-y-1.5">
                      {week.sessions.map((s) => {
                        const schema = schemaById[s.assigned_schema_id];
                        return (
                          <Link
                            key={s.id}
                            href={`/trainee/plans/${assignedPlanId}/workouts/${s.id}`}
                            className="bg-bg-surface border border-border rounded-sm px-4 py-3 flex items-center justify-between hover:border-accent/50 transition-colors opacity-70 hover:opacity-100"
                          >
                            <p className="text-sm font-medium text-text-primary">
                              {schema?.name ?? 'Workout'}
                            </p>
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

            {pastWeeks.length === 0 && schemaList.length > 0 && (
              <p className="text-sm text-text-primary opacity-40">No completed weeks yet.</p>
            )}
          </div>

          {/* ── Right: Exercises (active plan — links to progress charts) ── */}
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
              Exercises
            </h2>
            {exercisesBySchema.length === 0 ? (
              <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
                <p className="text-sm text-text-primary opacity-50">No exercises in this plan.</p>
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
                          href={`/trainee/plans/${assignedPlanId}/exercises/${ex.id}`}
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
                <p className="text-xs text-text-primary opacity-40">Tap an exercise to view progress chart.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
