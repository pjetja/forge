import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentWeekBounds } from '@/lib/utils/week';
import StartWorkoutButton from './_components/StartWorkoutButton';

interface ActivePlanPageProps {
  params: Promise<{ assignedPlanId: string }>;
}

export default async function ActivePlanPage({ params }: ActivePlanPageProps) {
  const { assignedPlanId } = await params;

  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) redirect('/login');

  // Fetch the assigned plan (must belong to this trainee)
  const { data: plan } = await supabase
    .from('assigned_plans')
    .select('id, name, status, week_count, workouts_per_week, started_at')
    .eq('id', assignedPlanId)
    .eq('trainee_auth_uid', claims.sub)
    .maybeSingle();

  if (!plan) notFound();

  // Fetch all assigned schemas for this plan, ordered by slot_index
  const { data: schemas } = await supabase
    .from('assigned_schemas')
    .select('id, name, slot_index')
    .eq('assigned_plan_id', assignedPlanId)
    .order('slot_index', { ascending: true });

  const schemaList = schemas ?? [];
  const schemaIds = schemaList.map((s) => s.id);

  const { weekStart, weekEnd } = getCurrentWeekBounds();

  // Fetch this week's completed sessions for this plan
  const { data: weekSessions } =
    schemaIds.length > 0
      ? await supabase
          .from('workout_sessions')
          .select('id, assigned_schema_id')
          .eq('trainee_auth_uid', claims.sub)
          .eq('status', 'completed')
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString())
          .in('assigned_schema_id', schemaIds)
      : { data: [] };

  // Check for any in-progress session for this trainee
  const { data: inProgressSession } = await supabase
    .from('workout_sessions')
    .select('id, assigned_schema_id')
    .eq('trainee_auth_uid', claims.sub)
    .eq('status', 'in_progress')
    .maybeSingle();

  const completedSessionsBySchema = new Map<string, string>(); // schemaId → sessionId
  (weekSessions ?? []).forEach((ws) => {
    if (!completedSessionsBySchema.has(ws.assigned_schema_id)) {
      completedSessionsBySchema.set(ws.assigned_schema_id, ws.id);
    }
  });

  const doneThisWeek = completedSessionsBySchema.size;
  const totalPerWeek = plan.workouts_per_week;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/trainee"
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
        Back to plans
      </Link>

      {/* Plan header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{plan.name}</h1>
        <p className="text-sm text-text-primary mt-1">
          {plan.workouts_per_week} workouts/week &middot; {plan.week_count} weeks
        </p>
      </div>

      {/* Week progress */}
      <div className="bg-bg-surface border border-border rounded-sm px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-text-primary">This week&apos;s progress</span>
        <span className="text-sm font-semibold text-accent">
          {doneThisWeek} of {totalPerWeek} done
        </span>
      </div>

      {/* Workout schema list */}
      {schemaList.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
          <p className="text-sm text-text-primary">No workouts in this plan yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schemaList.map((schema) => {
            const isDone = completedSessionsBySchema.has(schema.id);
            const isInProgress =
              inProgressSession?.assigned_schema_id === schema.id;
            const otherSessionInProgress =
              inProgressSession !== null &&
              inProgressSession !== undefined &&
              !isInProgress;

            return (
              <div
                key={schema.id}
                className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between gap-4"
              >
                <p className="font-medium text-text-primary">{schema.name}</p>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isDone && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent border border-accent/40 bg-accent/10 rounded-sm px-2 py-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5"
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
                      Done
                    </span>
                  )}

                  {isInProgress && inProgressSession && (
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
                  )}

                  {!isDone && !isInProgress && (
                    <StartWorkoutButton
                      assignedSchemaId={schema.id}
                      assignedPlanId={assignedPlanId}
                      disabled={otherSessionInProgress}
                      disabledReason={
                        otherSessionInProgress
                          ? 'Finish your current workout first'
                          : undefined
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
