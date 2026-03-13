'use client';
import { useOptimistic, useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeSet, addSet } from '@/app/(trainee)/trainee/actions';
import type { SetRow } from '../page';

interface SetListProps {
  sets: SetRow[];
  sessionId: string;
  exerciseId: string; // assigned_schema_exercise_id
}

export default function SetList({ sets, sessionId, exerciseId }: SetListProps) {
  const router = useRouter();

  // Optimistic state: mark set as completed before server confirms
  const [optimisticSets, addOptimistic] = useOptimistic(
    sets,
    (
      state,
      update: {
        setNumber: number;
        reps: number;
        weight: number | null;
        failure: boolean;
      }
    ) =>
      state.map((s) =>
        s.setNumber === update.setNumber
          ? {
              ...s,
              completed: true,
              actualReps: update.reps,
              actualWeightKg: update.weight,
              muscleFailure: update.failure,
            }
          : s
      )
  );

  // Editable per-row state: reps, weight (as string for input), failure
  const [editState, setEditState] = useState<
    Record<number, { reps: number; weight: string; failure: boolean }>
  >(() =>
    Object.fromEntries(
      sets.map((s) => [
        s.setNumber,
        {
          reps: s.actualReps,
          weight: s.actualWeightKg?.toString() ?? '',
          failure: s.muscleFailure,
        },
      ])
    )
  );

  const [isPending, startTransition] = useTransition();
  const [errorBySet, setErrorBySet] = useState<Record<number, string>>({});

  const handleComplete = (setNumber: number) => {
    const edit = editState[setNumber];
    if (!edit) return;
    const weightVal = edit.weight === '' ? null : parseFloat(edit.weight);

    // Clear any prior error for this set
    setErrorBySet((prev) => {
      const next = { ...prev };
      delete next[setNumber];
      return next;
    });

    startTransition(async () => {
      addOptimistic({ setNumber, reps: edit.reps, weight: weightVal, failure: edit.failure });
      const result = await completeSet({
        sessionId,
        assignedSchemaExerciseId: exerciseId,
        setNumber,
        actualReps: edit.reps,
        actualWeightKg: weightVal,
        muscleFailure: edit.failure,
      });
      if ('error' in result) {
        setErrorBySet((prev) => ({ ...prev, [setNumber]: result.error }));
      }
    });
  };

  const handleAddSet = () => {
    const nextSetNumber = optimisticSets.length + 1;
    const lastSet = optimisticSets[optimisticSets.length - 1];
    const targetReps = lastSet?.targetReps ?? 10;
    const targetWeightKg = lastSet?.targetWeightKg ?? null;

    // Add a default edit state row for the new set
    setEditState((prev) => ({
      ...prev,
      [nextSetNumber]: {
        reps: targetReps,
        weight: targetWeightKg?.toString() ?? '',
        failure: false,
      },
    }));

    startTransition(async () => {
      const result = await addSet({
        sessionId,
        assignedSchemaExerciseId: exerciseId,
        setNumber: nextSetNumber,
        targetReps,
        targetWeightKg,
      });
      if ('error' in result) {
        console.error(result.error);
      }
      // Refresh server data to include the new set row
      router.refresh();
    });
  };

  return (
    <div className="space-y-1">
      {/* Column headers */}
      <div className="grid grid-cols-[2rem_1fr_1fr_auto_2rem_5rem] gap-2 px-1 pb-1 text-xs text-text-secondary font-medium">
        <span>#</span>
        <span>Reps</span>
        <span>Weight (kg)</span>
        <span>Fail</span>
        <span></span>
        <span className="text-right">Last wk</span>
      </div>

      {/* Set rows */}
      <div className="space-y-0">
        {optimisticSets.map((set) => {
          const edit = editState[set.setNumber] ?? {
            reps: set.actualReps,
            weight: set.actualWeightKg?.toString() ?? '',
            failure: set.muscleFailure,
          };

          const lastWeekLabel =
            set.lastWeekReps != null
              ? `${set.lastWeekReps}×${set.lastWeekWeightKg != null ? set.lastWeekWeightKg + 'kg' : 'bw'}${set.lastWeekFailure ? ' F' : ''}`
              : '—';

          return (
            <div
              key={set.setNumber}
              className={`grid grid-cols-[2rem_1fr_1fr_auto_2rem_5rem] gap-2 items-center py-3 border-b border-border transition-opacity ${
                set.completed ? 'opacity-60' : ''
              }`}
            >
              {/* Set number */}
              <span className="text-xs text-text-secondary font-medium">{set.setNumber}</span>

              {/* Reps input */}
              <input
                type="number"
                min="1"
                max="100"
                inputMode="numeric"
                value={edit.reps}
                onChange={(e) =>
                  setEditState((prev) => ({
                    ...prev,
                    [set.setNumber]: { ...edit, reps: parseInt(e.target.value, 10) || 0 },
                  }))
                }
                className="w-full text-center bg-bg-page border border-border rounded-sm px-2 py-1.5 text-text-primary text-sm focus:border-accent focus:outline-none"
                aria-label={`Set ${set.setNumber} reps`}
              />

              {/* Weight input */}
              <input
                type="number"
                step="0.5"
                min="0"
                inputMode="decimal"
                value={edit.weight}
                onChange={(e) =>
                  setEditState((prev) => ({
                    ...prev,
                    [set.setNumber]: { ...edit, weight: e.target.value },
                  }))
                }
                placeholder="—"
                className="w-full text-center bg-bg-page border border-border rounded-sm px-2 py-1.5 text-text-primary text-sm focus:border-accent focus:outline-none"
                aria-label={`Set ${set.setNumber} weight kg`}
              />

              {/* Muscle failure checkbox */}
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={edit.failure}
                  onChange={(e) =>
                    setEditState((prev) => ({
                      ...prev,
                      [set.setNumber]: { ...edit, failure: e.target.checked },
                    }))
                  }
                  className="accent-red-500 w-4 h-4 cursor-pointer"
                  aria-label={`Set ${set.setNumber} muscle failure`}
                />
              </label>

              {/* Complete button */}
              <button
                type="button"
                onClick={() => handleComplete(set.setNumber)}
                disabled={isPending}
                aria-label={set.completed ? `Set ${set.setNumber} completed` : `Complete set ${set.setNumber}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  set.completed
                    ? 'bg-accent text-white border border-accent'
                    : 'border border-border text-text-secondary hover:border-accent hover:text-accent'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>

              {/* Last week column */}
              <span
                className={`text-xs text-right min-w-[5rem] ${
                  set.lastWeekFailure ? 'text-red-400' : 'text-text-secondary'
                }`}
              >
                {lastWeekLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error messages */}
      {Object.entries(errorBySet).map(([setNum, msg]) => (
        <p key={setNum} className="text-xs text-red-400 px-1">
          Set {setNum}: {msg}
        </p>
      ))}

      {/* +Add set button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleAddSet}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-border rounded-sm text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add set
        </button>
      </div>
    </div>
  );
}
