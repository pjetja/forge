'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MUSCLE_GROUPS } from '@/lib/db/schema';
import { addExerciseToSchema } from '../plans/actions';

interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup: string;
}

interface ExercisePickerModalProps {
  schemaId: string;
  planId: string;
  currentCount: number;
  allExercises: ExerciseOption[];
  onClose: () => void;
}

export function ExercisePickerModal({
  schemaId,
  planId,
  currentCount,
  allExercises,
  onClose,
}: ExercisePickerModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = allExercises.filter((e) => {
    const matchesSearch =
      search === '' ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = selectedMuscle === null || e.muscleGroup === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  function handleSelect(exercise: ExerciseOption) {
    startTransition(async () => {
      const result = await addExerciseToSchema(schemaId, planId, {
        exerciseId: exercise.id,
        sets: 3,
        reps: 10,
        targetWeightKg: null,
        perSetWeights: null,
        sortOrder: currentCount,
      });
      if ('error' in result) {
        setError(result.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-bg-surface border-t sm:border border-border rounded-t-lg sm:rounded-sm w-full sm:max-w-md flex flex-col h-[92vh] sm:h-auto sm:max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-text-primary">Add exercise</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-primary hover:text-accent transition-colors text-xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-3 border-b border-border flex-shrink-0">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>

        {/* Muscle group filter chips */}
        <div className="px-4 py-2 border-b border-border flex-shrink-0 overflow-x-auto">
          <div className="flex gap-2 w-max">
            <button
              type="button"
              onClick={() => setSelectedMuscle(null)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors cursor-pointer whitespace-nowrap ${
                selectedMuscle === null
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface text-text-primary border-border hover:border-accent'
              }`}
            >
              All
            </button>
            {MUSCLE_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedMuscle(selectedMuscle === g ? null : g)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors cursor-pointer whitespace-nowrap ${
                  selectedMuscle === g
                    ? 'bg-accent text-white border-accent'
                    : 'bg-bg-surface text-text-primary border-border hover:border-accent'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="px-4 py-2 text-sm text-red-400 border-b border-border flex-shrink-0">{error}</p>
        )}

        {/* Exercise list — min-h prevents layout shift when filter reduces results */}
        <div className="overflow-y-auto flex-1 min-h-[120px]">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-text-primary opacity-60 text-center">No exercises found.</p>
          ) : (
            filtered.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => handleSelect(exercise)}
                disabled={isPending}
                className="w-full text-left px-4 py-3 border-b border-border hover:bg-bg-page transition-colors cursor-pointer disabled:opacity-50 last:border-0"
              >
                <p className="font-medium text-sm text-text-primary">{exercise.name}</p>
                <p className="text-xs text-text-primary opacity-60 mt-0.5">{exercise.muscleGroup}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
