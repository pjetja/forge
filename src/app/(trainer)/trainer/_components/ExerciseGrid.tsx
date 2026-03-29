'use client';
import { useState } from 'react';
import { Exercise } from '@/lib/db/schema';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ExerciseFormModal } from './ExerciseFormModal';

interface ExerciseGridProps {
  exercises: Exercise[];
}

export function ExerciseGrid({ exercises }: ExerciseGridProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);

  function handleEdit(exercise: Exercise) {
    // Close detail modal, open edit form
    setSelectedExercise(null);
    setEditExercise(exercise);
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onClick={() => setSelectedExercise(exercise)}
          />
        ))}
      </div>

      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onEdit={handleEdit}
        />
      )}

      {editExercise && (
        <ExerciseFormModal
          mode="edit"
          exerciseId={editExercise.id}
          initialValues={{
            name: editExercise.name,
            muscleGroup: editExercise.muscleGroup,
            description: editExercise.description ?? undefined,
            notes: editExercise.notes ?? undefined,
            videoUrl: editExercise.videoUrl ?? undefined,
          }}
          onClose={() => setEditExercise(null)}
        />
      )}
    </div>
  );
}
