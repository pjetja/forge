'use client';
import { useTransition, useState } from 'react';
import { useTranslations } from 'next-intl';
import { logBodyWeight } from '@/app/(trainee)/trainee/actions';

interface BodyWeightLogFormProps {
  todayEntry: { id: string; logged_date: string; weight_kg: string } | null;
}

export function BodyWeightLogForm({ todayEntry }: BodyWeightLogFormProps) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(todayEntry?.weight_kg ?? '');
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('trainee');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 1 || parsed > 500) {
      setError(t('bodyWeight.invalidWeight'));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await logBodyWeight(parsed);
      if ('error' in result) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="1"
          max="500"
          placeholder="e.g. 82.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isPending}
          className="bg-bg-surface border border-border rounded-sm px-3 py-2 text-sm text-text-primary w-full focus:border-accent focus:outline-none disabled:opacity-60"
        />
        <span className="text-sm text-text-primary opacity-60 flex-shrink-0">kg</span>
        <button
          type="submit"
          disabled={isPending}
          className="bg-accent text-white text-sm font-bold px-4 py-2 rounded-sm hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-60 flex-shrink-0"
        >
          {isPending ? '...' : todayEntry ? t('bodyWeight.logWeightUpdate') : t('bodyWeight.logWeightButton')}
        </button>
      </div>
      {error && (
        <p className="text-sm text-error-light">{error}</p>
      )}
    </form>
  );
}
