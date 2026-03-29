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

  // Enrichment state (Phase 8)
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [kcalBurned, setKcalBurned] = useState<string>('');
  const [rpe, setRpe] = useState<number | null>(null);

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
    setDurationMinutes('');
    setKcalBurned('');
    setRpe(null);
  }

  function handleConfirm() {
    setUiState('submitting');
    setError(null);

    startTransition(async () => {
      const enrichment = {
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        kcalBurned: kcalBurned ? parseInt(kcalBurned, 10) : null,
        rpe: rpe,
      };
      const result = await finishWorkout(sessionId, enrichment);

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

      {/* ── Enrichment fields (Phase 8) ── */}
      <div className="border-t border-border pt-3 mt-1 space-y-3">
        <p className="text-xs text-text-primary opacity-60 mb-2">Optional session notes</p>

        {/* Training time */}
        <div>
          <label className="text-xs text-text-primary opacity-60 mb-1 block">Training time (min)</label>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            disabled={uiState === 'submitting' || isPending}
            placeholder="e.g. 52"
            className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text-primary w-full focus:border-accent focus:outline-none disabled:opacity-60"
          />
        </div>

        {/* Kcal burned */}
        <div>
          <label className="text-xs text-text-primary opacity-60 mb-1 block">Kcal burned</label>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={kcalBurned}
            onChange={(e) => setKcalBurned(e.target.value)}
            disabled={uiState === 'submitting' || isPending}
            placeholder="e.g. 350"
            className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text-primary w-full focus:border-accent focus:outline-none disabled:opacity-60"
          />
        </div>

        {/* Difficulty (RPE 1-10) */}
        <div>
          <label className="text-xs text-text-primary opacity-60 mb-1 block">Difficulty (1–10)</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRpe(rpe === n ? null : n)}
                disabled={uiState === 'submitting' || isPending}
                className={`flex-1 min-h-[44px] text-sm font-bold rounded-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  rpe === n
                    ? 'bg-accent text-white'
                    : 'bg-bg-surface border border-border text-text-primary hover:border-accent/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

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
