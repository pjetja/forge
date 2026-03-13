'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = allExercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-bg-surface border border-border rounded-sm w-full max-w-md flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">Add exercise</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-primary hover:text-accent transition-colors text-xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>

        {error && (
          <p className="px-4 py-2 text-sm text-red-400 border-b border-border">{error}</p>
        )}

        <div className="overflow-y-auto flex-1">
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
