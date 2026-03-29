'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExerciseFormModal } from './ExerciseFormModal';

export function ExerciseAddButton() {
  const t = useTranslations('trainer');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
      >
        {t('exercises.addExercise')}
      </button>

      {open && (
        <ExerciseFormModal
          mode="create"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
