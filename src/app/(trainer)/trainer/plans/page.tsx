import { createClient } from '@/lib/supabase/server';
import { PlansClient } from '../_components/PlansClient';

export default async function PlansPage() {
  const supabase = await createClient();

  const { data: plansData, error } = await supabase
    .from('plans')
    .select('id, name, week_count, workouts_per_week, tags')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-sm p-4 text-sm text-red-400">
        Failed to load plans. Please refresh.
      </div>
    );
  }

  const plans = plansData ?? [];

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

  // Collect all unique tags across plans (sorted alphabetically)
  const allTagsSet = new Set<string>();
  for (const plan of plans) {
    for (const tag of (plan.tags as string[] | null) ?? []) {
      allTagsSet.add(tag);
    }
  }
  const allTags = Array.from(allTagsSet).sort();

  const planItems = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    weekCount: plan.week_count,
    workoutsPerWeek: plan.workouts_per_week,
    assignedCount: countByPlan[plan.id] ?? 0,
    tags: (plan.tags as string[] | null) ?? [],
  }));

  return <PlansClient plans={planItems} allTags={allTags} />;
}
