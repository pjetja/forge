'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { finishWorkout } from '@/app/(trainee)/trainee/actions';

interface FinishWorkoutButtonProps {
  sessionId: string;
  assignedPlanId: string;
  loggedSetCount: number;
  totalPlanSets: number;
}

type State = 'idle' | 'confirming' | 'submitting' | 'done';

export default function FinishWorkoutButton({
  sessionId,
  assignedPlanId,
  loggedSetCount,
  totalPlanSets,
}: FinishWorkoutButtonProps) {
  const [uiState, setUiState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Keep assignedPlanId in scope for future use (e.g., post-finish navigation variants)
  void assignedPlanId;

  const allSetsLogged = loggedSetCount >= totalPlanSets;

  function handleFinishClick() {
    setError(null);
    setUiState('confirming');
  }

  function handleKeepGoing() {
    setUiState('idle');
    setError(null);
  }

  function handleConfirm() {
    setUiState('submitting');
    setError(null);

    startTransition(async () => {
      const result = await finishWorkout(sessionId);

      if ('error' in result) {
        setError(result.error);
        setUiState('confirming');
        return;
      }

      setUiState('done');
      router.push('/trainee');
    });
  }

  if (uiState === 'idle') {
    return (
      <button
        onClick={handleFinishClick}
        className="w-full py-3 bg-accent text-white font-semibold rounded-sm hover:bg-accent/90 transition-colors"
      >
        Finish Workout
      </button>
    );
  }

  if (uiState === 'done') {
    return (
      <div className="w-full py-3 bg-accent/10 border border-accent/30 rounded-sm text-center text-sm text-accent font-medium">
        Workout finished — redirecting...
      </div>
    );
  }

  // confirming or submitting
  return (
    <div className="bg-bg-surface border border-border rounded-sm p-4 space-y-3">
      <h2 className="text-base font-semibold text-text-primary">Finish this workout?</h2>

      <p className="text-sm text-text-primary">
        {loggedSetCount} of {totalPlanSets} sets logged
      </p>

      {!allSetsLogged && (
        <p className="text-sm text-amber-400">
          You haven&apos;t logged all planned sets. Finish anyway?
        </p>
      )}

      {allSetsLogged && (
        <p className="text-sm text-accent font-medium">All sets completed!</p>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          onClick={handleConfirm}
          disabled={isPending || uiState === 'submitting'}
          className="flex-1 py-2.5 bg-accent text-white font-semibold rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending || uiState === 'submitting' ? 'Finishing...' : 'Confirm & Finish'}
        </button>

        <button
          onClick={handleKeepGoing}
          disabled={isPending || uiState === 'submitting'}
          className="flex-1 py-2.5 border border-border text-text-primary font-medium rounded-sm hover:border-accent/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Keep going
        </button>
      </div>
    </div>
  );
}
