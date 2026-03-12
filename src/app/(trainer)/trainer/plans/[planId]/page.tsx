import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlanWeekView } from '../../_components/PlanWeekView';
import { AddSchemaButton } from '../../_components/AddSchemaButton';

interface PlanRow {
  id: string;
  name: string;
  week_count: number;
  workouts_per_week: number;
}

interface SchemaRow {
  id: string;
  name: string;
  slot_index: number;
  sort_order: number;
}

export default async function PlanEditorPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const supabase = await createClient();

  const { data: planData } = await supabase
    .from('plans')
    .select('id, name, week_count, workouts_per_week')
    .eq('id', planId)
    .single();

  if (!planData) notFound();
  const plan = planData as PlanRow;

  const { data: schemasData } = await supabase
    .from('workout_schemas')
    .select('id, name, slot_index, sort_order')
    .eq('plan_id', planId)
    .order('sort_order');

  const schemas = (schemasData ?? []) as SchemaRow[];

  // Find slots that don't have a schema yet
  const assignedSlots = new Set(schemas.map((s) => s.slot_index));
  const unassignedSlots = Array.from(
    { length: plan.workouts_per_week },
    (_, i) => i + 1
  ).filter((slot) => !assignedSlots.has(slot));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/trainer/plans" className="text-sm text-text-primary hover:text-accent transition-colors">
            &larr; Plans
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-1">{plan.name}</h1>
          <p className="text-sm text-text-primary mt-0.5">
            {plan.week_count} weeks &middot; {plan.workouts_per_week} workouts/week
          </p>
        </div>
        {/* Assign plan — links to the assignment flow (Plan 05) */}
        <Link
          href={`/trainer/plans/${planId}/assign`}
          className="flex-shrink-0 bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors"
        >
          Assign to trainee
        </Link>
      </div>

      {/* Week view with slot cards */}
      <PlanWeekView
        planId={planId}
        weekCount={plan.week_count}
        workoutsPerWeek={plan.workouts_per_week}
        schemas={schemas.map((s) => ({
          id: s.id,
          name: s.name,
          slotIndex: s.slot_index,
          sortOrder: s.sort_order,
        }))}
      />

      {/* Add schema buttons for unassigned slots */}
      {unassignedSlots.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">Add workouts:</p>
          {unassignedSlots.map((slot) => (
            <AddSchemaButton
              key={slot}
              planId={planId}
              slotIndex={slot}
              sortOrder={slot - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
