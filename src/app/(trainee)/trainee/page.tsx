import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentWeekBounds } from '@/lib/utils/week';
import AbandonSessionButton from './_components/AbandonSessionButton';
import { TabSwitcher } from '@/components/TabSwitcher';
import { TraineeExercisesTab } from './_components/TraineeExercisesTab';

export default async function TraineeHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; q?: string; muscles?: string }>;
}) {
  const resolvedSearch = await searchParams;
  const activeTab = ['exercises', 'log', 'body-weight'].includes(resolvedSearch?.tab ?? '')
    ? (resolvedSearch!.tab as string)
    : 'plans';

  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) redirect('/login');

  const { weekStart, weekEnd } = getCurrentWeekBounds();

  // Plans data — always fetched (needed for in-progress banner check)
  const { data: assignedPlans } = await supabase
    .from('assigned_plans')
    .select('id, name, status, week_count, workouts_per_week, started_at, created_at')
    .eq('trainee_auth_uid', claims.sub)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  // Fetch this week's completed sessions with plan linkage
  const { data: weekSessions } = await supabase
    .from('workout_sessions')
    .select('id, assigned_schema_id, assigned_schemas!inner(assigned_plan_id)')
    .eq('trainee_auth_uid', claims.sub)
    .in('status', ['completed'])
    .gte('completed_at', weekStart.toISOString())
    .lte('completed_at', weekEnd.toISOString());

  // Check for in-progress session
  const { data: activeSession } = await supabase
    .from('workout_sessions')
    .select('id, assigned_schema_id, assigned_schemas!inner(id, name, assigned_plan_id)')
    .eq('trainee_auth_uid', claims.sub)
    .eq('status', 'in_progress')
    .maybeSingle();

  const plans = assignedPlans ?? [];
  const activePlans = plans.filter((p) => p.status === 'active');
  const pendingPlans = plans.filter((p) => p.status === 'pending');
  const pastPlans = plans
    .filter((p) => p.status === 'completed' || p.status === 'terminated')
    .sort((a, b) => {
      const aTime = a.started_at ? new Date(a.started_at).getTime() : 0;
      const bTime = b.started_at ? new Date(b.started_at).getTime() : 0;
      return bTime - aTime;
    });

  const hasAnyPlans = plans.length > 0;

  // Count completed sessions per plan for this week
  function weekDoneCountForPlan(planId: string): number {
    if (!weekSessions) return 0;
    return weekSessions.filter((ws) => {
      const schemas = ws.assigned_schemas;
      const assignedPlanId = Array.isArray(schemas)
        ? schemas[0]?.assigned_plan_id
        : (schemas as { assigned_plan_id: string } | null)?.assigned_plan_id;
      return assignedPlanId === planId;
    }).length;
  }

  // Extract in-progress session info
  const activeSchemas = activeSession?.assigned_schemas;
  const activeSchemaInfo = Array.isArray(activeSchemas)
    ? (activeSchemas[0] as { id: string; name: string; assigned_plan_id: string } | undefined)
    : (activeSchemas as unknown as { id: string; name: string; assigned_plan_id: string } | null | undefined);

  // Log tab data — only fetch when on log tab
  let logSessions: Array<{
    id: string;
    completed_at: string;
    duration_minutes: number | null;
    kcal_burned: number | null;
    rpe: number | null;
    assigned_schemas: { name: string } | { name: string }[] | null;
  }> | null = null;

  if (activeTab === 'log') {
    const { data } = await supabase
      .from('workout_sessions')
      .select('id, completed_at, duration_minutes, kcal_burned, rpe, assigned_schemas!inner(name)')
      .eq('trainee_auth_uid', claims.sub)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });
    logSessions = data;
  }

  // Body weight tab data — only fetch when on body-weight tab
  let weightEntries: Array<{
    id: string;
    logged_date: string;
    weight_kg: string;
    created_at: string;
  }> | null = null;
  let accessRequests: Array<{
    id: string;
    trainer_auth_uid: string;
    status: string;
  }> | null = null;

  if (activeTab === 'body-weight') {
    const { data: weights } = await supabase
      .from('body_weight_logs')
      .select('id, logged_date, weight_kg, created_at')
      .eq('trainee_auth_uid', claims.sub)
      .order('logged_date', { ascending: false });
    weightEntries = weights;

    const { data: requests } = await supabase
      .from('body_weight_access_requests')
      .select('id, trainer_auth_uid, status')
      .eq('trainee_auth_uid', claims.sub)
      .eq('status', 'pending');
    accessRequests = requests;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text-primary">Your Training</h1>

      {/* In-progress session banner */}
      {activeSession && activeSchemaInfo && (
        <div className="bg-accent/10 border border-accent rounded-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-accent">Workout in progress</p>
            <p className="text-text-primary font-bold">{activeSchemaInfo.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/trainee/plans/${activeSchemaInfo.assigned_plan_id}/workouts/${activeSession.id}`}
              className="px-3 py-1.5 bg-accent text-white text-sm rounded-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Resume
            </Link>
            <AbandonSessionButton sessionId={activeSession.id} />
          </div>
        </div>
      )}

      <TabSwitcher
        tabs={[
          { key: 'plans', label: 'Plans' },
          { key: 'exercises', label: 'Exercises' },
          { key: 'log', label: 'Log' },
          { key: 'body-weight', label: 'Body Weight' },
        ]}
        activeTab={activeTab}
      />

      {/* Plans tab content */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          {!hasAnyPlans && (
            <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
              <div className="text-4xl">🏋️</div>
              <h2 className="font-bold text-text-primary">Waiting for your trainer</h2>
              <p className="text-sm text-text-primary max-w-xs mx-auto">
                Your trainer will assign a workout plan shortly. Once assigned, your schedule
                will appear here.
              </p>
            </div>
          )}

          {/* Current Plan */}
          {activePlans.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                Current Plan
              </h2>
              <div className="space-y-2">
                {activePlans.map((plan) => {
                  const done = weekDoneCountForPlan(plan.id);
                  const total = plan.workouts_per_week;
                  return (
                    <Link
                      key={plan.id}
                      href={`/trainee/plans/${plan.id}`}
                      className="block bg-bg-surface border border-border rounded-sm p-4 hover:border-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-text-primary">{plan.name}</p>
                          <p className="text-sm text-text-primary mt-0.5">
                            {plan.workouts_per_week} workouts/week &middot; {plan.week_count} weeks
                          </p>
                        </div>
                        <span className="text-sm text-accent font-bold flex-shrink-0">
                          {done} of {total} done this week
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Upcoming Plans */}
          {pendingPlans.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                Upcoming Plans
              </h2>
              <div className="space-y-2">
                {pendingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-bg-surface border border-border rounded-sm p-4 opacity-60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-text-primary">{plan.name}</p>
                        <p className="text-sm text-text-primary mt-0.5">
                          {plan.workouts_per_week} workouts/week &middot; {plan.week_count} weeks
                        </p>
                      </div>
                      <span className="text-xs text-text-primary border border-border rounded-sm px-2 py-0.5 flex-shrink-0">
                        Not started yet
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Past Plans */}
          {pastPlans.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                Past Plans
              </h2>
              <div className="space-y-2">
                {pastPlans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/trainee/plans/${plan.id}`}
                    className="block bg-bg-surface border border-border rounded-sm p-4 opacity-60 hover:opacity-100 hover:border-accent/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-text-primary">{plan.name}</p>
                      <span className="text-xs text-text-primary border border-border rounded-sm px-2 py-0.5 flex-shrink-0">
                        {plan.status === 'completed' ? 'Completed' : 'Ended'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Exercises tab content */}
      {activeTab === 'exercises' && (
        <TraineeExercisesTab
          traineeAuthUid={claims.sub}
          searchQuery={resolvedSearch?.q ?? ''}
          muscleFilter={resolvedSearch?.muscles ?? ''}
        />
      )}

      {/* Log tab content */}
      {activeTab === 'log' && (
        <div>
          {!logSessions || logSessions.length === 0 ? (
            <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
              <h2 className="font-bold text-text-primary">No sessions yet</h2>
              <p className="text-sm text-text-primary opacity-60">
                Complete your first workout to see your training history here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logSessions.map((session) => {
                const schemaData = session.assigned_schemas;
                const workoutName = Array.isArray(schemaData)
                  ? (schemaData[0] as { name: string } | undefined)?.name ?? '—'
                  : (schemaData as { name: string } | null)?.name ?? '—';
                const dateStr = session.completed_at
                  ? new Date(session.completed_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';

                const enrichmentParts: string[] = [];
                if (session.duration_minutes != null) {
                  enrichmentParts.push(`${session.duration_minutes} min`);
                }
                if (session.kcal_burned != null) {
                  enrichmentParts.push(`${session.kcal_burned} kcal`);
                }
                if (session.rpe != null) {
                  enrichmentParts.push(`RPE ${session.rpe}`);
                }

                return (
                  <div
                    key={session.id}
                    className="bg-bg-surface border border-border rounded-sm px-4 py-3 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm text-text-primary font-bold">{dateStr}</p>
                      <p className="text-sm text-text-primary">{workoutName}</p>
                    </div>
                    {enrichmentParts.length > 0 && (
                      <p className="text-xs text-text-primary opacity-70 flex-shrink-0 ml-4">
                        {enrichmentParts.join(' · ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Body Weight tab content */}
      {activeTab === 'body-weight' && (
        <BodyWeightTabContent
          weightEntries={weightEntries}
          accessRequests={accessRequests}
        />
      )}
    </div>
  );
}

// ── Body Weight tab inline content ────────────────────────────────────────────
// Lazy-imported client components are referenced here as a server-component wrapper
// so we can pass serializable props from the server fetch above.

import { BodyWeightLogForm } from './body-weight/_components/BodyWeightLogForm';
import { BodyWeightChart } from './body-weight/_components/BodyWeightChart';
import { BodyWeightAccessRequestBanner } from './body-weight/_components/BodyWeightAccessRequestBanner';
import { DeleteBodyWeightButton } from './body-weight/_components/DeleteBodyWeightButton';

interface BodyWeightTabContentProps {
  weightEntries: Array<{
    id: string;
    logged_date: string;
    weight_kg: string;
    created_at: string;
  }> | null;
  accessRequests: Array<{
    id: string;
    trainer_auth_uid: string;
    status: string;
  }> | null;
}

function BodyWeightTabContent({ weightEntries, accessRequests }: BodyWeightTabContentProps) {
  const todayStr = new Date().toLocaleDateString('en-CA'); // "2026-03-28"
  const todayEntry = weightEntries?.find((e) => e.logged_date === todayStr) ?? null;

  return (
    <div className="space-y-4">
      {accessRequests && accessRequests.length > 0 && (
        <BodyWeightAccessRequestBanner requests={accessRequests} />
      )}
      <BodyWeightLogForm todayEntry={todayEntry} />
      {!weightEntries || weightEntries.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
          <h2 className="font-bold text-text-primary">No weight entries yet</h2>
          <p className="text-sm text-text-primary opacity-60">
            Log your first body weight to start tracking your progress.
          </p>
        </div>
      ) : (
        <>
          <BodyWeightChart entries={weightEntries} />
          <div className="space-y-2">
            {weightEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-bg-surface border border-border rounded-sm px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm text-text-primary font-bold">{entry.logged_date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-primary font-bold">{entry.weight_kg} kg</span>
                  <DeleteBodyWeightButton entryId={entry.id} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
