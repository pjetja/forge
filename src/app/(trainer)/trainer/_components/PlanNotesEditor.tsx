'use client';
import { useState, useTransition } from 'react';
import { updatePlan } from '../plans/actions';

interface PlanNotesEditorProps {
  planId: string;
  initialNotes: string;
}

export function PlanNotesEditor({ planId, initialNotes }: PlanNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  function handleBlur() {
    if (notes === initialNotes) return;
    startTransition(async () => {
      await updatePlan(planId, { notes: notes.trim() || undefined });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">Notes</label>
        {saved && <span className="text-xs text-green-400">Saved</span>}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        rows={3}
        placeholder="Training goals, equipment needed, special instructions..."
        className="w-full bg-bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text-primary placeholder:text-text-primary/40 focus:border-accent focus:outline-none resize-none"
      />
    </div>
  );
}
