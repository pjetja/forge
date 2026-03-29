'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateTraineeGoals } from '@/app/(trainer)/trainer/trainees/actions';

interface TraineeGoalsEditorProps {
  traineeId: string;
  initialGoals: string;
}

export function TraineeGoalsEditor({ traineeId, initialGoals }: TraineeGoalsEditorProps) {
  const [goals, setGoals] = useState(initialGoals);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = useTranslations('trainer');

  function handleSave() {
    setSuccessMessage(null);
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateTraineeGoals(traineeId, goals);
      if ('error' in result) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage(t('traineeDetail.editPlan.changesSaved'));
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    });
  }

  return (
    <section className="space-y-2">
      <textarea
        rows={4}
        className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full resize-y"
        placeholder={t('traineeDetail.goals.placeholder')}
        value={goals}
        onChange={(e) => setGoals(e.target.value)}
        disabled={isPending}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? t('traineeDetail.goals.saving') : t('traineeDetail.goals.save')}
        </button>
        {successMessage && <p className="text-accent text-sm">{successMessage}</p>}
        {errorMessage && <p className="text-error text-sm">{errorMessage}</p>}
      </div>
    </section>
  );
}
