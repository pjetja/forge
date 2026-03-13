'use client';
import { useState, useTransition } from 'react';
import { editAssignedPlan, type AssignedExerciseUpdate } from '../../../../actions';

interface AssignedExercise {
  assignedExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  targetWeightKg: number | null;
  perSetWeights: number[] | null;
}

interface EditAssignedPlanClientProps {
  assignedPlanId: string;
  traineeId: string;
  exercises: AssignedExercise[];
}

export function EditAssignedPlanClient({
  assignedPlanId,
  traineeId,
  exercises,
}: EditAssignedPlanClientProps) {
  const [, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function saveUpdates(updates: AssignedExerciseUpdate[]) {
    startTransition(async () => {
      await editAssignedPlan(assignedPlanId, traineeId, updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const inputClass =
    'w-16 bg-bg-page border border-border rounded-sm px-2 py-1 text-sm text-text-primary text-center focus:border-accent focus:outline-none';

  return (
    <div className="space-y-3">
      {saved && (
        <div className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-sm px-3 py-2">
          Changes saved
        </div>
      )}
      {exercises.map((ex) => (
        <ExerciseEditRow
          key={ex.assignedExerciseId}
          exercise={ex}
          onSave={(updates) => saveUpdates([updates])}
          inputClass={inputClass}
        />
      ))}
      {exercises.length === 0 && (
        <p className="text-sm text-text-primary opacity-60">No exercises in this plan.</p>
      )}
    </div>
  );
}

function ExerciseEditRow({
  exercise,
  onSave,
  inputClass,
}: {
  exercise: AssignedExercise;
  onSave: (update: AssignedExerciseUpdate) => void;
  inputClass: string;
}) {
  const [sets, setSets] = useState(exercise.sets);
  const [reps, setReps] = useState(exercise.reps);
  const [weight, setWeight] = useState(exercise.targetWeightKg ?? 0);

  return (
    <div className="bg-bg-surface border border-border rounded-sm p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-text-primary truncate">{exercise.exerciseName}</p>
        <p className="text-xs text-text-primary opacity-60">{exercise.muscleGroup}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-text-primary opacity-50">Sets</span>
          <input
            type="number"
            className={inputClass}
            value={sets}
            min={1}
            max={99}
            onChange={(e) => setSets(parseInt(e.target.value, 10) || 1)}
            onBlur={(e) =>
              onSave({ assignedExerciseId: exercise.assignedExerciseId, sets: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-text-primary opacity-50">Reps</span>
          <input
            type="number"
            className={inputClass}
            value={reps}
            min={1}
            max={999}
            onChange={(e) => setReps(parseInt(e.target.value, 10) || 1)}
            onBlur={(e) =>
              onSave({ assignedExerciseId: exercise.assignedExerciseId, reps: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-text-primary opacity-50">kg</span>
          <input
            type="number"
            className={inputClass}
            value={weight}
            min={0}
            step={0.5}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            onBlur={(e) =>
              onSave({
                assignedExerciseId: exercise.assignedExerciseId,
                targetWeightKg: parseFloat(e.target.value) || null,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
