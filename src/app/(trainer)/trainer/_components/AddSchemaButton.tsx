'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createSchema } from '../plans/actions';

interface AddSchemaButtonProps {
  planId: string;
  slotIndex: number;
  sortOrder: number;
}

export function AddSchemaButton({ planId, slotIndex, sortOrder }: AddSchemaButtonProps) {
  const t = useTranslations('trainer');
  const tc = useTranslations('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError(t('schemas.nameRequired')); return; }
    setError(null);
    startTransition(async () => {
      const result = await createSchema(planId, { name: trimmed, slotIndex, sortOrder });
      if ('error' in result) {
        setError(result.error);
      } else {
        setOpen(false);
        setName('');
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-bg-surface border border-dashed border-border rounded-sm p-3 text-sm text-text-primary opacity-60 hover:opacity-100 hover:border-accent transition-all cursor-pointer text-left"
      >
        {t('schemas.addWorkout', { slot: slotIndex })}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg-surface border border-accent rounded-sm p-3 flex gap-2 items-center">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('schemas.workoutNamePlaceholder', { slot: slotIndex })}
        className="flex-1 bg-bg-page border border-border rounded-sm px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-sm px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer"
      >
        {isPending ? '...' : tc('button.save')}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setName(''); setError(null); }}
        className="text-text-primary hover:text-accent transition-colors text-xl leading-none cursor-pointer"
      >
        &times;
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
