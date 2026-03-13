import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentWeekBounds } from '@/lib/utils/week';
import AbandonSessionButton from './_components/AbandonSessionButton';

export default async function TraineeHomePage() {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) redirect('/login');

  const { weekStart, weekEnd } = getCurrentWeekBounds();

  // Fetch all assigned plans for this trainee
  const { data: assignedPlans } = await supabase
    .from('assigned_plans')
    .select('id, name, status, week_count, workouts_per_week, started_at, created_at')
    .eq('trainee_auth_uid', claims.sub)
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
  const pastPlans = plans.filter(
    (p) => p.status === 'completed' || p.status === 'terminated'
  );

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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text-primary">Your Training</h1>

      {/* In-progress session banner */}
      {activeSession && activeSchemaInfo && (
        <div className="bg-accent/10 border border-accent rounded-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-accent">Workout in progress</p>
            <p className="text-text-primary font-semibold">{activeSchemaInfo.name}</p>
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

      {!hasAnyPlans && (
        <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
          <div className="text-4xl">🏋️</div>
          <h2 className="font-medium text-text-primary">Waiting for your trainer</h2>
          <p className="text-sm text-text-primary max-w-xs mx-auto">
            Your trainer will assign a workout plan shortly. Once assigned, your schedule
            will appear here.
          </p>
        </div>
      )}

      {/* Current Plan */}
      {activePlans.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
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
                      <p className="font-semibold text-text-primary">{plan.name}</p>
                      <p className="text-sm text-text-primary mt-0.5">
                        {plan.workouts_per_week} workouts/week &middot; {plan.week_count} weeks
                      </p>
                    </div>
                    <span className="text-sm text-accent font-medium flex-shrink-0">
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
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
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
                    <p className="font-semibold text-text-primary">{plan.name}</p>
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
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Past Plans
          </h2>
          <div className="space-y-2">
            {pastPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-bg-surface border border-border rounded-sm p-4 opacity-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold text-text-primary">{plan.name}</p>
                  <span className="text-xs text-text-primary border border-border rounded-sm px-2 py-0.5 flex-shrink-0">
                    {plan.status === 'completed' ? 'Completed' : 'Ended'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
