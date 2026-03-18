'use client';

import { useState, useTransition } from 'react';
import { updateTrainerNotes } from '@/app/(trainer)/trainer/trainees/actions';

interface TrainerNotesEditorProps {
  traineeId: string;
  initialNotes: string;
}

export function TrainerNotesEditor({ traineeId, initialNotes }: TrainerNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSave() {
    setSuccessMessage(null);
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateTrainerNotes(traineeId, notes);
      if ('error' in result) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage('Changes saved.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    });
  }

  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold text-text-primary">Trainer notes (private)</h2>
      <p className="text-sm text-text-primary opacity-50">Only visible to you</p>
      <textarea
        rows={4}
        className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none w-full resize-y"
        placeholder="Add private notes about this trainee..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isPending}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving...' : 'Save notes'}
        </button>
        {successMessage && (
          <p className="text-accent text-sm">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="text-error text-sm">{errorMessage}</p>
        )}
      </div>
    </section>
  );
}
