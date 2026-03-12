import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface AssignedPlanRow {
  id: string;
  name: string;
  week_count: number;
  workouts_per_week: number;
  status: string;
  started_at: string | null;
  plan_updated_at: string;
  created_at: string;
}

export default async function TraineeDetailPage({
  params,
}: {
  params: Promise<{ traineeId: string }>;
}) {
  const { traineeId } = await params;
  const supabase = await createClient();

  // Fetch trainee profile
  const { data: traineeProfile } = await supabase
    .from('users')
    .select('name, email')
    .eq('auth_uid', traineeId)
    .single();

  if (!traineeProfile) notFound();

  // Fetch all assigned plans for this trainee (ordered newest first)
  const { data: assignedPlans } = await supabase
    .from('assigned_plans')
    .select('id, name, week_count, workouts_per_week, status, started_at, plan_updated_at, created_at')
    .eq('trainee_auth_uid', traineeId)
    .order('created_at', { ascending: false });

  const plans = (assignedPlans ?? []) as AssignedPlanRow[];
  const currentPlan = plans.find((p) => p.status === 'active' || p.status === 'pending') ?? null;
  const pastPlans = plans.filter((p) => p.status === 'completed' || p.status === 'terminated');

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/trainer" className="text-sm text-text-primary hover:text-accent transition-colors">
        &larr; All trainees
      </Link>

      {/* Trainee header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center text-lg font-semibold flex-shrink-0">
          {traineeProfile.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{traineeProfile.name}</h1>
          <p className="text-sm text-text-primary">{traineeProfile.email}</p>
        </div>
      </div>

      {/* Current plan */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Current Plan</h2>
        {currentPlan ? (
          <div className="bg-bg-surface border border-border rounded-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-text-primary">{currentPlan.name}</p>
                <p className="text-sm text-text-primary mt-1">
                  {currentPlan.week_count} weeks &middot; {currentPlan.workouts_per_week} workouts/week
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  currentPlan.status === 'active'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-border text-text-primary'
                }`}
              >
                {currentPlan.status === 'active' ? 'Active' : 'Pending'}
              </span>
            </div>
            {/* Edit assigned plan link */}
            <Link
              href={`/trainer/trainees/${traineeId}/assigned-plans/${currentPlan.id}/edit`}
              className="inline-block text-sm text-accent hover:underline"
            >
              Edit plan exercises
            </Link>
          </div>
        ) : (
          <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
            <p className="text-text-primary text-sm">No plan assigned yet.</p>
            <Link
              href="/trainer/plans"
              className="mt-3 inline-block text-sm text-accent hover:underline"
            >
              Go to Plans to assign one
            </Link>
          </div>
        )}
      </section>

      {/* Past plans */}
      {pastPlans.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Past Plans</h2>
          <div className="space-y-2">
            {pastPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-text-primary">{plan.name}</p>
                  <p className="text-xs text-text-primary mt-1">
                    {plan.week_count} weeks &middot;{' '}
                    {plan.status === 'completed' ? 'Completed' : 'Terminated'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
