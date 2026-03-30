'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { abandonWorkout } from '../actions';

interface AbandonSessionButtonProps {
  sessionId: string;
}

export default function AbandonSessionButton({ sessionId }: AbandonSessionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('trainee');

  function handleAbandon() {
    startTransition(async () => {
      await abandonWorkout(sessionId);
    });
  }

  return (
    <button
      onClick={handleAbandon}
      disabled={isPending}
      className="px-3 py-1.5 text-sm border border-border rounded-sm text-text-primary hover:border-red-500 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? t('abandon.abandoning') : t('abandon.abandon')}
    </button>
  );
}
