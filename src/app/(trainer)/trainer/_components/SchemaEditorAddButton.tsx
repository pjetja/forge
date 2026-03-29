'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExercisePickerModal } from './ExercisePickerModal';

interface SchemaEditorAddButtonProps {
  schemaId: string;
  planId: string;
  currentCount: number;
  allExercises: { id: string; name: string; muscleGroup: string }[];
}

export function SchemaEditorAddButton({
  schemaId,
  planId,
  currentCount,
  allExercises,
}: SchemaEditorAddButtonProps) {
  const t = useTranslations('trainer');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-bg-surface border border-dashed border-border rounded-sm p-3 text-sm text-text-primary opacity-60 hover:opacity-100 hover:border-accent transition-all cursor-pointer"
      >
        {t('schemas.addExercise')}
      </button>

      {open && (
        <ExercisePickerModal
          schemaId={schemaId}
          planId={planId}
          currentCount={currentCount}
          allExercises={allExercises}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
