'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { startWorkout } from '../../../actions';

interface StartWorkoutButtonProps {
  assignedSchemaId: string;
  assignedPlanId: string;
  disabled: boolean;
  disabledReason?: string;
}

export default function StartWorkoutButton({
  assignedSchemaId,
  assignedPlanId,
  disabled,
  disabledReason,
}: StartWorkoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('trainee');

  function handleStart() {
    startTransition(async () => {
      const result = await startWorkout(assignedSchemaId, assignedPlanId);
      if ('sessionId' in result) {
        router.push(`/trainee/plans/${assignedPlanId}/workouts/${result.sessionId}`);
      }
    });
  }

  return (
    <div className="relative group">
      <button
        onClick={handleStart}
        disabled={disabled || isPending}
        className="px-3 py-1.5 bg-accent text-white text-sm rounded-sm font-medium hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title={disabled && disabledReason ? disabledReason : undefined}
      >
        {isPending ? t('startWorkout.starting') : t('startWorkout.start')}
      </button>
      {disabled && disabledReason && (
        <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block z-10 w-56 bg-bg-surface border border-border rounded-sm px-2.5 py-1.5 text-xs text-text-primary shadow-lg pointer-events-none">
          {disabledReason}
        </div>
      )}
    </div>
  );
}
