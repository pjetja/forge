'use client';
import { useState, useTransition } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { updateSchemaExercise, removeExerciseFromSchema } from '../plans/actions';

export interface SchemaExerciseItem {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  targetWeightKg: number | null;
  perSetWeights: number[] | null;
}

interface SchemaExerciseRowProps {
  item: SchemaExerciseItem;
  schemaId: string;
  planId: string;
  onRemoved: (id: string) => void;
}

export function SchemaExerciseRow({ item, schemaId, planId, onRemoved }: SchemaExerciseRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [sets, setSets] = useState(item.sets);
  const [reps, setReps] = useState(item.reps);
  const [targetWeight, setTargetWeight] = useState(item.targetWeightKg ?? 0);
  const [perSetMode, setPerSetMode] = useState(item.perSetWeights !== null);
  const [perSetWeights, setPerSetWeights] = useState<number[]>(
    item.perSetWeights ?? Array(item.sets).fill(item.targetWeightKg ?? 0)
  );
  const [isPending, startTransition] = useTransition();

  function saveField(updates: Parameters<typeof updateSchemaExercise>[3]) {
    startTransition(async () => {
      await updateSchemaExercise(item.id, schemaId, planId, updates);
    });
  }

  function handleSetsBlur(newSets: number) {
    const validated = Math.max(1, Math.min(99, newSets));
    setSets(validated);
    if (perSetMode) {
      setPerSetWeights((prev) => {
        const copy = [...prev];
        while (copy.length < validated) copy.push(copy[copy.length - 1] ?? 0);
        return copy.slice(0, validated);
      });
    }
    saveField({ sets: validated });
  }

  function handleRepsBlur(newReps: number) {
    const validated = Math.max(1, Math.min(999, newReps));
    setReps(validated);
    saveField({ reps: validated });
  }

  function handleWeightBlur(newWeight: number) {
    setTargetWeight(newWeight);
    saveField({ targetWeightKg: newWeight || null });
  }

  function handlePerSetWeightBlur(index: number, val: number) {
    const updated = [...perSetWeights];
    updated[index] = val;
    setPerSetWeights(updated);
    saveField({ perSetWeights: updated });
  }

  function togglePerSetMode() {
    const newMode = !perSetMode;
    setPerSetMode(newMode);
    if (newMode) {
      const weights = Array(sets).fill(targetWeight);
      setPerSetWeights(weights);
      saveField({ perSetWeights: weights });
    } else {
      const avg = perSetWeights.reduce((a, b) => a + b, 0) / (perSetWeights.length || 1);
      const single = Math.round(avg * 4) / 4;
      setTargetWeight(single);
      saveField({ perSetWeights: null, targetWeightKg: single });
    }
  }

  function handleRemove() {
    if (!confirm(`Remove "${item.exerciseName}" from this workout?`)) return;
    startTransition(async () => {
      const result = await removeExerciseFromSchema(item.id, schemaId, planId);
      if (!('error' in result)) onRemoved(item.id);
    });
  }

  const inputClass =
    'w-16 bg-bg-page border border-border rounded-sm px-2 py-1 text-sm text-text-primary text-center focus:border-accent focus:outline-none';

  return (
    <div ref={setNodeRef} style={style} className="bg-bg-surface border border-border rounded-sm p-3 space-y-2">
      {/* Row header: drag handle + exercise name + remove */}
      <div className="flex items-center gap-2">
        {/* Drag handle — listeners ONLY here, not on the row div */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-text-primary opacity-40 hover:opacity-100 transition-opacity flex-shrink-0"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary text-sm truncate">{item.exerciseName}</p>
          <p className="text-xs text-text-primary opacity-60">{item.muscleGroup}</p>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          disabled={isPending}
          className="text-text-primary opacity-40 hover:opacity-100 hover:text-red-400 transition-opacity flex-shrink-0 text-lg leading-none cursor-pointer"
          aria-label="Remove exercise"
        >
          &times;
        </button>
      </div>

      {/* Inputs: sets | reps | weight + per-set toggle */}
      <div className="flex items-center gap-2 pl-7 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-xs text-text-primary opacity-60">Sets</label>
          <input
            type="number"
            className={inputClass}
            value={sets}
            min={1}
            max={99}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setSets(parseInt(e.target.value, 10) || 1)}
            onBlur={(e) => handleSetsBlur(parseInt(e.target.value, 10) || 1)}
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-text-primary opacity-60">Reps</label>
          <input
            type="number"
            className={inputClass}
            value={reps}
            min={1}
            max={999}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setReps(parseInt(e.target.value, 10) || 1)}
            onBlur={(e) => handleRepsBlur(parseInt(e.target.value, 10) || 1)}
          />
        </div>

        {!perSetMode && (
          <div className="flex items-center gap-1">
            <label className="text-xs text-text-primary opacity-60">kg</label>
            <input
              type="number"
              className={inputClass}
              value={targetWeight}
              min={0}
              step={0.5}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
              onBlur={(e) => handleWeightBlur(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={togglePerSetMode}
          className="text-xs text-accent hover:underline cursor-pointer flex-shrink-0"
        >
          {perSetMode ? 'Single weight' : 'Per-set weights'}
        </button>
      </div>

      {/* Per-set weight inputs */}
      {perSetMode && (
        <div className="pl-7 flex flex-wrap gap-2">
          {perSetWeights.map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <label className="text-xs text-text-primary opacity-60">S{i + 1}</label>
              <input
                type="number"
                className={inputClass}
                value={w}
                min={0}
                step={0.5}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const updated = [...perSetWeights];
                  updated[i] = parseFloat(e.target.value) || 0;
                  setPerSetWeights(updated);
                }}
                onBlur={(e) => handlePerSetWeightBlur(i, parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-text-primary opacity-60">kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
