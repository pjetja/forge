import { createClient } from '@/lib/supabase/server';
import { PlansClient } from '../_components/PlansClient';

export default async function PlansPage() {
  const supabase = await createClient();

  // Try with Phase 4 metadata columns (status, tags). Fall back to base columns
  // if migration 0004 hasn't been applied yet.
  let plansData: Array<{
    id: string;
    name: string;
    week_count: number;
    workouts_per_week: number;
    tags?: string[] | null;
  }> | null = null;

  const { data: full, error: fullError } = await supabase
    .from('plans')
    .select('id, name, week_count, workouts_per_week, tags')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (!fullError) {
    plansData = full;
  } else {
    // Migration 0004 not applied — fall back to base columns, show all plans
    const { data: base } = await supabase
      .from('plans')
      .select('id, name, week_count, workouts_per_week')
      .order('created_at', { ascending: false });
    plansData = base;
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
    for (const tag of plan.tags ?? []) {
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
    tags: plan.tags ?? [],
  }));

  return <PlansClient plans={planItems} allTags={allTags} migrationPending={!!fullError} />;
}
