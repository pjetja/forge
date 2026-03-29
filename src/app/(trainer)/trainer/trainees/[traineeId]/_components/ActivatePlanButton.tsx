'use client';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { activateAssignedPlan } from '../../actions';

export function ActivatePlanButton({
  assignedPlanId,
  traineeAuthUid,
}: {
  assignedPlanId: string;
  traineeAuthUid: string;
}) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('trainer');

  function handleClick() {
    startTransition(async () => {
      await activateAssignedPlan(assignedPlanId, traineeAuthUid);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-sm bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-sm px-3 py-1.5 font-medium transition-colors cursor-pointer"
    >
      {isPending ? t('traineeDetail.plan.activating') : t('traineeDetail.plan.startPlan')}
    </button>
  );
}
