'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/Modal';
import { deleteAssignedPlan } from '../../actions';

export function DeletePlanButton({
  assignedPlanId,
  traineeAuthUid,
  planName,
}: {
  assignedPlanId: string;
  traineeAuthUid: string;
  planName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('trainer');
  const tc = useTranslations('common');

  function handleDelete() {
    startTransition(async () => {
      await deleteAssignedPlan(assignedPlanId, traineeAuthUid);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('traineeDetail.plan.deleteAriaLabel')}
        className="w-8 h-8 flex items-center justify-center rounded-sm bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
      </button>

      {open && (
        <Modal
          title={t('traineeDetail.plan.deletePlanTitle')}
          onClose={() => setOpen(false)}
          maxWidth="max-w-sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="text-sm text-text-primary opacity-60 hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-30"
              >
                {tc('button.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="text-sm bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-sm px-4 py-1.5 font-medium transition-colors cursor-pointer"
              >
                {isPending ? '...' : tc('button.delete')}
              </button>
            </>
          }
        >
          <p className="text-sm text-text-primary opacity-70 leading-relaxed">
            {t('traineeDetail.plan.deletePlanConfirm', { planName })}
          </p>
        </Modal>
      )}
    </>
  );
}
