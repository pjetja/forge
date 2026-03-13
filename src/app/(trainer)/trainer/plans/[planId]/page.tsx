import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlanWeekView } from '../../_components/PlanWeekView';
import { AddSchemaButton } from '../../_components/AddSchemaButton';
import { PlanNotesEditor } from '../../_components/PlanNotesEditor';
import { PlanDetailHeader } from '../../_components/PlanDetailHeader';
import { PlanTagsEditor } from '../../_components/PlanTagsEditor';

interface SchemaRow { id: string; name: string; slot_index: number; sort_order: number; }
interface ActiveTrainee { traineeAuthUid: string; traineeName: string; status: string; }

export default async function PlanEditorPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const supabase = await createClient();

  // Try with metadata columns; fall back if migration 0004 not applied
  let planData: { id: string; name: string; week_count: number; workouts_per_week: number; notes?: string | null; tags?: string[] | null; } | null = null;
  let hasMeta = false;

  const { data: fullPlan } = await supabase
    .from('plans').select('id, name, week_count, workouts_per_week, notes, tags').eq('id', planId).single();

  if (fullPlan) {
    planData = fullPlan;
    hasMeta = true;
  } else {
    const { data: basePlan } = await supabase
      .from('plans').select('id, name, week_count, workouts_per_week').eq('id', planId).single();
    planData = basePlan;
  }

  if (!planData) notFound();

  const { data: schemasData } = await supabase
    .from('workout_schemas').select('id, name, slot_index, sort_order').eq('plan_id', planId).order('sort_order');
  const schemas = (schemasData ?? []) as SchemaRow[];

  // Active/pending trainees using this plan
  const { data: assignedRows } = await supabase
    .from('assigned_plans').select('trainee_auth_uid, status')
    .eq('source_plan_id', planId).in('status', ['pending', 'active']);

  const traineeIds = (assignedRows ?? []).map((r) => r.trainee_auth_uid);
  let activeTrainees: ActiveTrainee[] = [];
  if (traineeIds.length > 0) {
    const { data: usersData } = await supabase.from('users').select('auth_uid, name').in('auth_uid', traineeIds);
    activeTrainees = (assignedRows ?? []).map((row) => {
      const user = (usersData ?? []).find((u) => u.auth_uid === row.trainee_auth_uid);
      return { traineeAuthUid: row.trainee_auth_uid, traineeName: user?.name ?? 'Unknown', status: row.status as string };
    });
  }

  const assignedSlots = new Set(schemas.map((s) => s.slot_index));
  const unassignedSlots = Array.from({ length: planData.workouts_per_week }, (_, i) => i + 1).filter((s) => !assignedSlots.has(s));
  const tags = (planData.tags as string[] | null) ?? [];

  return (
    <div className="space-y-6">
      {/* Section 1: Header — name, actions, weeks/workouts */}
      <PlanDetailHeader
        planId={planId}
        initialName={planData.name}
        weekCount={planData.week_count}
        workoutsPerWeek={planData.workouts_per_week}
        assignedCount={activeTrainees.length}
      />

      {/* Section 2: Tags + Notes (only when migration 0004 applied) */}
      {hasMeta && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlanTagsEditor planId={planId} initialTags={tags} />
          <PlanNotesEditor planId={planId} initialNotes={planData.notes ?? ''} />
        </div>
      )}

      {/* Section 3: Workouts */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-text-primary">Workouts</p>
        <PlanWeekView
          planId={planId}
          workoutsPerWeek={planData.workouts_per_week}
          schemas={schemas.map((s) => ({ id: s.id, name: s.name, slotIndex: s.slot_index, sortOrder: s.sort_order }))}
        />
        {unassignedSlots.length > 0 && (
          <div className="space-y-2 pt-1">
            {unassignedSlots.map((slot) => (
              <AddSchemaButton key={slot} planId={planId} slotIndex={slot} sortOrder={slot - 1} />
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Trainees + Assign button */}
      <div className="bg-bg-surface border border-border rounded-sm p-4 space-y-3">
        <p className="text-sm font-medium text-text-primary">
          Trainees ({activeTrainees.length})
        </p>
        {activeTrainees.length === 0 ? (
          <p className="text-sm text-text-primary opacity-50">No trainees assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {activeTrainees.map((t) => (
              <div key={t.traineeAuthUid} className="flex items-center justify-between">
                <Link href={`/trainer/trainees/${t.traineeAuthUid}`}
                  className="text-sm text-text-primary hover:text-accent transition-colors">
                  {t.traineeName}
                </Link>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  t.status === 'active' ? 'border-green-700 text-green-400' : 'border-border text-text-primary opacity-60'
                }`}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
        <Link
          href={`/trainer/plans/${planId}/assign`}
          className="block w-full bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors text-center"
        >
          Assign to trainee
        </Link>
      </div>
    </div>
  );
}
