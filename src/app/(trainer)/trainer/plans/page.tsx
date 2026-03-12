import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PlanCard } from '../_components/PlanCard';

interface PlanRow {
  id: string;
  name: string;
  week_count: number;
  workouts_per_week: number;
}

export default async function PlansPage() {
  const supabase = await createClient();

  const { data: plansData, error } = await supabase
    .from('plans')
    .select('id, name, week_count, workouts_per_week')
    .order('created_at', { ascending: false });

  const plans = (plansData ?? []) as PlanRow[];

  // Count active/pending assigned plans per template plan
  const { data: assignedCounts } = await supabase
    .from('assigned_plans')
    .select('source_plan_id')
    .in('status', ['pending', 'active'])
    .in('source_plan_id', plans.map((p) => p.id));

  const countByPlan: Record<string, number> = {};
  for (const ap of assignedCounts ?? []) {
    if (ap.source_plan_id) {
      countByPlan[ap.source_plan_id] = (countByPlan[ap.source_plan_id] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Plans</h1>
        <Link
          href="/trainer/plans/new"
          className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors"
        >
          + New plan
        </Link>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-sm p-4 text-sm text-red-400">
          Failed to load plans. Please refresh.
        </div>
      )}

      {!error && plans.length === 0 && (
        <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
          <div className="text-4xl">📋</div>
          <h2 className="font-medium text-text-primary">No plans yet</h2>
          <p className="text-sm text-text-primary max-w-sm mx-auto">
            Create your first workout plan template. You can assign it to trainees after building it.
          </p>
          <Link
            href="/trainer/plans/new"
            className="inline-block mt-2 bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors"
          >
            Create a plan
          </Link>
        </div>
      )}

      {!error && plans.length > 0 && (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              weekCount={plan.week_count}
              workoutsPerWeek={plan.workouts_per_week}
              assignedCount={countByPlan[plan.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
