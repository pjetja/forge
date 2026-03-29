'use client';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Shared centered modal shell.
 *
 * CONVENTION: Any new centered dialog/modal in the app should use this component.
 * It handles the backdrop, panel chrome, header (title + close button), optional
 * footer, and scroll containment.
 *
 * For slide-in panels (e.g. ExerciseDetailModal, ExerciseFormModal) keep their
 * own bespoke layout — they have responsive mobile/desktop behaviour that doesn't
 * fit the centered pattern.
 *
 * Usage:
 *   <Modal title="Confirm delete" onClose={() => setOpen(false)}
 *          footer={<><Button>Cancel</Button><Button>Delete</Button></>}>
 *     <p>Are you sure?</p>
 *   </Modal>
 */

interface ModalProps {
  onClose: () => void;
  title?: string;
  /** Tailwind max-width class, e.g. "max-w-sm" or "max-w-lg". Defaults to "max-w-md". */
  maxWidth?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ onClose, title, maxWidth = 'max-w-md', children, footer }: ModalProps) {
  const t = useTranslations('common');

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full ${maxWidth} bg-bg-surface border border-border rounded-sm shadow-xl flex flex-col max-h-[90vh]`}
        >
          {title !== undefined && (
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
              <h2 className="text-base font-semibold text-text-primary">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-text-primary hover:text-accent transition-colors text-xl leading-none cursor-pointer"
                aria-label={t('modal.closeAriaLabel')}
              >
                &times;
              </button>
            </div>
          )}

          <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>

          {footer && (
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
