import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlanWeekView } from '../../_components/PlanWeekView';
import { AddSchemaButton } from '../../_components/AddSchemaButton';
import { PlanNotesEditor } from '../../_components/PlanNotesEditor';

interface SchemaRow {
  id: string;
  name: string;
  slot_index: number;
  sort_order: number;
}

interface ActiveTrainee {
  traineeAuthUid: string;
  traineeName: string;
  status: string;
}

export default async function PlanEditorPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const supabase = await createClient();

  // Try with metadata columns; fall back to base columns if migration 0004 not applied
  let planData: {
    id: string; name: string; week_count: number; workouts_per_week: number;
    notes?: string | null; tags?: string[] | null;
  } | null = null;

  const { data: fullPlan } = await supabase
    .from('plans')
    .select('id, name, week_count, workouts_per_week, notes, tags')
    .eq('id', planId)
    .single();

  if (fullPlan) {
    planData = fullPlan;
  } else {
    const { data: basePlan } = await supabase
      .from('plans')
      .select('id, name, week_count, workouts_per_week')
      .eq('id', planId)
      .single();
    planData = basePlan;
  }

  if (!planData) notFound();

  const { data: schemasData } = await supabase
    .from('workout_schemas')
    .select('id, name, slot_index, sort_order')
    .eq('plan_id', planId)
    .order('sort_order');

  const schemas = (schemasData ?? []) as SchemaRow[];

  // Active trainees using this plan
  const { data: assignedRows } = await supabase
    .from('assigned_plans')
    .select('trainee_auth_uid, status')
    .eq('source_plan_id', planId)
    .in('status', ['pending', 'active']);

  const traineeIds = (assignedRows ?? []).map((r) => r.trainee_auth_uid);
  let activeTrainees: ActiveTrainee[] = [];
  if (traineeIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('auth_uid, name')
      .in('auth_uid', traineeIds);

    activeTrainees = (assignedRows ?? []).map((row) => {
      const user = (usersData ?? []).find((u) => u.auth_uid === row.trainee_auth_uid);
      return {
        traineeAuthUid: row.trainee_auth_uid,
        traineeName: user?.name ?? 'Unknown',
        status: row.status as string,
      };
    });
  }

  // Find slots that don't have a schema yet
  const assignedSlots = new Set(schemas.map((s) => s.slot_index));
  const unassignedSlots = Array.from(
    { length: planData.workouts_per_week },
    (_, i) => i + 1
  ).filter((slot) => !assignedSlots.has(slot));

  const tags = (planData.tags as string[] | null) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/trainer/plans" className="text-sm text-text-primary hover:text-accent transition-colors">
            &larr; Plans
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-1">{planData.name}</h1>
          <p className="text-sm text-text-primary mt-0.5">
            {planData.week_count} weeks &middot; {planData.workouts_per_week} workouts/week
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-bg-surface border border-border text-text-primary">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          href={`/trainer/plans/${planId}/assign`}
          className="flex-shrink-0 bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors"
        >
          Assign to trainee
        </Link>
      </div>

      {/* Active trainees */}
      {activeTrainees.length > 0 && (
        <div className="bg-bg-surface border border-border rounded-sm p-4">
          <p className="text-sm font-medium text-text-primary mb-3">
            Active trainees ({activeTrainees.length})
          </p>
          <div className="space-y-2">
            {activeTrainees.map((t) => (
              <div key={t.traineeAuthUid} className="flex items-center justify-between">
                <Link
                  href={`/trainer/trainees/${t.traineeAuthUid}`}
                  className="text-sm text-text-primary hover:text-accent transition-colors"
                >
                  {t.traineeName}
                </Link>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  t.status === 'active'
                    ? 'border-green-700 text-green-400'
                    : 'border-border text-text-primary opacity-60'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <PlanNotesEditor planId={planId} initialNotes={planData.notes ?? ''} />

      {/* Week view with slot cards */}
      <PlanWeekView
        planId={planId}
        weekCount={planData.week_count}
        workoutsPerWeek={planData.workouts_per_week}
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
