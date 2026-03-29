'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { assignPlan, type WeightOverride } from '../trainees/actions';

interface ExerciseForReview {
  schemaExerciseId: string; // ID in schema_exercises table
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  templateWeightKg: number | null;
  templatePerSetWeights: number[] | null;
}

interface AssignPlanModalProps {
  planId: string;
  traineeAuthUid: string;
  traineeName: string;
  hasExistingActivePlan: boolean;
  exercises: ExerciseForReview[];
  // Phase 3: always {} (no history). Phase 4 will populate with real last-logged weights.
  // Inject point: exerciseHistory[exerciseId]?.lastWeight ?? templateWeightKg
  exerciseHistory: Record<string, { lastWeight: number } | null>;
  onClose: () => void;
}

export function AssignPlanModal({
  planId,
  traineeAuthUid,
  traineeName,
  hasExistingActivePlan,
  exercises,
  exerciseHistory,
  onClose,
}: AssignPlanModalProps) {
  const t = useTranslations('trainer');
  const tc = useTranslations('common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(!hasExistingActivePlan);

  // Initialize weight overrides from history or template values
  const [weightOverrides, setWeightOverrides] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    for (const ex of exercises) {
      // Phase 3: exerciseHistory[ex.exerciseId] is always null — falls back to templateWeightKg
      init[ex.exerciseId] = exerciseHistory[ex.exerciseId]?.lastWeight ?? ex.templateWeightKg;
    }
    return init;
  });

  function handleConfirm() {
    if (!confirmed) { setError(t('assign.confirmWarningError')); return; }
    startTransition(async () => {
      const overrides: WeightOverride[] = exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        targetWeightKg: weightOverrides[ex.exerciseId] ?? null,
        perSetWeights: null,
        tempo: null,
        progressionMode: 'none',
      }));
      const result = await assignPlan(planId, traineeAuthUid, overrides);
      if ('error' in result) {
        setError(result.error);
      } else {
        router.push(`/trainer/trainees/${traineeAuthUid}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-bg-surface border border-border rounded-sm w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">
            {t('assign.reviewPlanFor', { name: traineeName })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-primary hover:text-accent transition-colors text-xl leading-none cursor-pointer"
            aria-label={tc('aria.close')}
          >
            &times;
          </button>
        </div>

        {/* Existing plan warning */}
        {hasExistingActivePlan && (
          <div className="p-4 border-b border-border bg-yellow-950/30 border-yellow-800/40">
            <p className="text-sm text-yellow-300 font-medium">{t('assign.existingPlanWarning')}</p>
            <p className="text-xs text-yellow-400 mt-1">{t('assign.existingPlanDetail')}</p>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-sm text-text-primary">{t('assign.confirmWarning')}</span>
            </label>
          </div>
        )}

        {/* Exercise weight review */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          <p className="text-xs text-text-primary opacity-60">
            {t('assign.adjustWeightsHint', { name: traineeName })}
          </p>
          {exercises.map((ex) => (
            <div
              key={ex.schemaExerciseId}
              className="bg-bg-page border border-border rounded-sm p-3 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm text-text-primary truncate">{ex.exerciseName}</p>
                <p className="text-xs text-text-primary opacity-60">
                  {ex.sets} sets &times; {ex.reps} reps
                  {exerciseHistory[ex.exerciseId]?.lastWeight != null && (
                    <> &middot; {t('assign.lastWeight', { weight: exerciseHistory[ex.exerciseId]!.lastWeight })}</>
                  )}
                  {exerciseHistory[ex.exerciseId] == null && (
                    <> &middot; {t('assign.noPreviousData')}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  type="number"
                  value={weightOverrides[ex.exerciseId] ?? ''}
                  min={0}
                  step={0.5}
                  placeholder="kg"
                  onChange={(e) =>
                    setWeightOverrides((prev) => ({
                      ...prev,
                      [ex.exerciseId]: e.target.value === '' ? null : parseFloat(e.target.value),
                    }))
                  }
                  className="w-20 bg-bg-surface border border-border rounded-sm px-2 py-1 text-sm text-text-primary text-center focus:border-accent focus:outline-none"
                />
                <span className="text-xs text-text-primary opacity-60">kg</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !confirmed}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-sm py-2 text-sm font-medium transition-colors cursor-pointer"
          >
            {isPending ? t('assign.assigning') : t('assign.assignPlanTo', { name: traineeName })}
          </button>
        </div>
      </div>
    </div>
  );
}
