'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlanPicker } from './PlanPicker';
import { ActivatePlanButton } from './ActivatePlanButton';
import { DeletePlanButton } from './DeletePlanButton';
import { reorderPendingPlans } from '../../actions';

interface PendingPlan {
  id: string;
  name: string;
  week_count: number;
  workouts_per_week: number;
}

interface PlanTemplate {
  id: string;
  name: string;
  week_count: number;
  workouts_per_week: number;
}

interface NextPlanSectionProps {
  traineeId: string;
  pendingPlans: PendingPlan[];
  planTemplates: PlanTemplate[];
  hasActivePlan: boolean;
}

function SortablePlanCard({
  plan,
  traineeId,
  hasActivePlan,
  showDragHandle,
}: {
  plan: PendingPlan;
  traineeId: string;
  hasActivePlan: boolean;
  showDragHandle: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: plan.id,
  });
  const t = useTranslations('trainer');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-bg-surface border border-border rounded-sm p-4 space-y-3">
      <div className="flex items-start gap-3">
        {showDragHandle && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none' }}
            className="cursor-grab active:cursor-grabbing text-text-primary opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 p-1 mt-0.5"
            aria-label={t('traineeDetail.nextPlan.dragReorder')}
          >
            ⠿
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary">{plan.name}</p>
          <p className="text-sm text-text-primary mt-1">
            {t('traineeDetail.plans.weeks', { count: plan.week_count })} &middot; {t('traineeDetail.plans.workoutsPerWeek', { count: plan.workouts_per_week })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!hasActivePlan && (
            <ActivatePlanButton assignedPlanId={plan.id} traineeAuthUid={traineeId} />
          )}
          <DeletePlanButton assignedPlanId={plan.id} traineeAuthUid={traineeId} planName={plan.name} />
        </div>
      </div>
      <div className={`flex items-center gap-4 ${showDragHandle ? 'pl-7' : ''}`}>
        <Link
          href={`/trainer/trainees/${traineeId}/plans/${plan.id}`}
          className="inline-block text-sm text-accent hover:underline"
        >
          {t('traineeDetail.nextPlan.viewPlan')}
        </Link>
        <Link
          href={`/trainer/trainees/${traineeId}/assigned-plans/${plan.id}/edit`}
          className="inline-block text-sm text-text-primary opacity-60 hover:opacity-100 hover:underline"
        >
          {t('traineeDetail.nextPlan.editExercises')}
        </Link>
      </div>
    </div>
  );
}

export function NextPlanSection({
  traineeId,
  pendingPlans: initialPendingPlans,
  planTemplates,
  hasActivePlan,
}: NextPlanSectionProps) {
  const [showPicker, setShowPicker] = useState(initialPendingPlans.length === 0);
  const [pendingPlans, setPendingPlans] = useState(initialPendingPlans);
  const [, startTransition] = useTransition();
  const t = useTranslations('trainer');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pendingPlans.findIndex((p) => p.id === active.id);
    const newIndex = pendingPlans.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(pendingPlans, oldIndex, newIndex);
    setPendingPlans(reordered);
    startTransition(async () => {
      await reorderPendingPlans(traineeId, reordered.map((p) => p.id));
    });
  }

  const showDragHandle = pendingPlans.length > 1;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text-primary">{t('traineeDetail.nextPlan.heading')}</h2>
        {planTemplates.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="text-sm text-accent hover:underline cursor-pointer"
          >
            {showPicker ? t('traineeDetail.nextPlan.hidePicker') : t('traineeDetail.nextPlan.queuePlan')}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Plan picker — shown above the list */}
        {showPicker && planTemplates.length > 0 && (
          <div className="bg-bg-surface border border-dashed border-border rounded-sm p-4 space-y-3">
            <p className="text-sm text-text-primary opacity-60">
              {pendingPlans.length === 0
                ? t('traineeDetail.nextPlan.assignWhileActive')
                : t('traineeDetail.nextPlan.queueAnother')}
            </p>
            <PlanPicker plans={planTemplates} traineeId={traineeId} />
          </div>
        )}

        {planTemplates.length === 0 && pendingPlans.length === 0 && (
          <div className="bg-bg-surface border border-border rounded-sm p-4">
            <p className="text-sm text-text-primary">
              {t('traineeDetail.nextPlan.noPlansCreated')}{' '}
              <Link href="/trainer/plans/new" className="text-accent hover:underline">
                {t('traineeDetail.nextPlan.createFirst')}
              </Link>
            </p>
          </div>
        )}

        {/* Queued plans with drag-to-reorder when >1 */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pendingPlans.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {pendingPlans.map((plan) => (
                <SortablePlanCard
                  key={plan.id}
                  plan={plan}
                  traineeId={traineeId}
                  hasActivePlan={hasActivePlan}
                  showDragHandle={showDragHandle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
