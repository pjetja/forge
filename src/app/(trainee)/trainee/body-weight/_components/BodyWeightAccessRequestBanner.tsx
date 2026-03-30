'use client';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { respondToBodyWeightAccessRequest } from '@/app/(trainee)/trainee/actions';

interface Props {
  requests: Array<{ id: string; trainer_auth_uid: string; status: string }>;
}

export function BodyWeightAccessRequestBanner({ requests }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('trainee');

  // Show banner for the first pending request
  const request = requests[0];
  if (!request) return null;

  function handleApprove() {
    startTransition(async () => {
      await respondToBodyWeightAccessRequest(request.id, 'approved');
    });
  }

  function handleDecline() {
    startTransition(async () => {
      await respondToBodyWeightAccessRequest(request.id, 'declined');
    });
  }

  return (
    <div className="bg-bg-surface border border-border rounded-sm px-4 py-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="text-sm text-text-primary flex-1">
        {t('bodyWeight.trainerRequestedAccess')}
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="bg-accent text-white text-xs px-3 py-1 rounded-sm cursor-pointer disabled:opacity-60 hover:bg-accent/90 transition-colors"
        >
          {t('bodyWeight.approveAccess')}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={isPending}
          className="border border-border text-text-primary text-xs px-3 py-1 rounded-sm hover:border-error/50 cursor-pointer disabled:opacity-60 transition-colors"
        >
          {t('bodyWeight.declineRequest')}
        </button>
      </div>
    </div>
  );
}
