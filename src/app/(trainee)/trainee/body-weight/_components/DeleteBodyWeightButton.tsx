'use client';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { deleteBodyWeight } from '@/app/(trainee)/trainee/actions';

interface DeleteBodyWeightButtonProps {
  entryId: string;
}

export function DeleteBodyWeightButton({ entryId }: DeleteBodyWeightButtonProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('trainee');

  function handleClick() {
    startTransition(async () => {
      await deleteBodyWeight(entryId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={t('bodyWeight.deleteEntry')}
      className="text-text-primary opacity-40 hover:opacity-100 hover:text-accent transition cursor-pointer disabled:opacity-20"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    </button>
  );
}
