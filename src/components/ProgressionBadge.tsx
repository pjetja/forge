'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from './Modal';

export function ProgressionBadge({ mode }: { mode: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('common');

  const keyMap: Record<string, string> = {
    linear: 'linear',
    double_progression: 'doubleProgression',
    rpe: 'rpe',
    rir: 'rir',
  };

  const translationKey = keyMap[mode];
  if (!translationKey) return null;

  const label = t(`progression.${translationKey}.label`);
  const description = t(`progression.${translationKey}.description`);
  const aboutAriaLabel = t(`progression.${translationKey}.aboutAriaLabel`);

  return (
    <>
      <span className="inline-flex items-center gap-1">
        <span className="text-xs text-accent border border-accent/30 rounded-sm px-1.5 py-0.5">
          {label}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-border text-text-primary opacity-40 hover:opacity-100 hover:border-accent hover:text-accent transition-all cursor-pointer shrink-0"
          aria-label={aboutAriaLabel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </span>

      {open && (
        <Modal title={label} onClose={() => setOpen(false)} maxWidth="max-w-sm">
          <p className="text-sm text-text-primary opacity-70 leading-relaxed">{description}</p>
        </Modal>
      )}
    </>
  );
}
