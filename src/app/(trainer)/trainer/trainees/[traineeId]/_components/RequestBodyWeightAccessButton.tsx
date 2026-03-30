'use client';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  requestBodyWeightAccess,
  revokeBodyWeightRequest,
} from '@/app/(trainer)/trainer/trainees/actions';

interface Props {
  traineeId: string;
  accessStatus: string | null; // null | 'pending' | 'approved' | 'declined'
}

export function RequestBodyWeightAccessButton({ traineeId, accessStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('trainer');

  function handleRequest() {
    startTransition(async () => {
      await requestBodyWeightAccess(traineeId);
    });
  }

  function handleRevoke() {
    startTransition(async () => {
      await revokeBodyWeightRequest(traineeId);
    });
  }

  // No request or previously declined — show request button
  if (!accessStatus || accessStatus === 'declined') {
    return (
      <button
        type="button"
        onClick={handleRequest}
        disabled={isPending}
        className="border border-border text-text-primary text-sm font-bold px-3 py-2 rounded-sm hover:border-accent/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? t('traineeDetail.bodyWeight.requesting') : t('traineeDetail.bodyWeight.requestAccess')}
      </button>
    );
  }

  // Pending — show status + revoke link
  if (accessStatus === 'pending') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-primary opacity-60">{t('traineeDetail.bodyWeight.accessRequested')}</span>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={isPending}
          className="text-xs text-error hover:text-error-light cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? t('traineeDetail.bodyWeight.revoking') : t('traineeDetail.bodyWeight.revokeRequest')}
        </button>
      </div>
    );
  }

  // Approved — show revoke link (Body Weight tab is visible in this state)
  if (accessStatus === 'approved') {
    return (
      <button
        type="button"
        onClick={handleRevoke}
        disabled={isPending}
        className="text-xs text-error hover:text-error-light cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? t('traineeDetail.bodyWeight.revoking') : t('traineeDetail.bodyWeight.revokeAccess')}
      </button>
    );
  }

  return null;
}
