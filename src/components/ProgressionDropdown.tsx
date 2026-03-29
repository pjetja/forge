'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FilterDropdown } from './FilterDropdown';
import { Modal } from './Modal';

function ProgressionInfoModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('common');

  const progressionModes = [
    { key: 'fixed' },
    { key: 'linear' },
    { key: 'doubleProgression' },
    { key: 'rpe' },
    { key: 'rir' },
  ];

  return (
    <Modal title={t('progression.modesModalTitle')} onClose={onClose}>
      <div className="space-y-4">
        {progressionModes.map((item) => (
          <div key={item.key}>
            <p className="text-sm font-medium text-text-primary mb-0.5">
              {t(`progression.${item.key}.label`)}
            </p>
            <p className="text-xs text-text-primary opacity-60 leading-relaxed">
              {t(`progression.${item.key}.description`)}
            </p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

interface ProgressionDropdownProps {
  value: string;
  onChange: (value: string) => void;
  buttonClassName?: string;
}

/**
 * Shared progression-mode selector used on the schema editor and plan assign review.
 * Renders a label row with an info button (opens an explanatory modal) and a FilterDropdown.
 *
 * CONVENTION: Any new dropdown in the app should be built with FilterDropdown from
 * @/components/FilterDropdown — it gives consistent styling, keyboard-accessible
 * open/close, and outside-click dismissal out of the box.
 */
export function ProgressionDropdown({ value, onChange, buttonClassName }: ProgressionDropdownProps) {
  const [showInfo, setShowInfo] = useState(false);
  const t = useTranslations('common');

  const progressionOptions = [
    { value: 'none', label: t('progression.fixed.label') },
    { value: 'linear', label: t('progression.linear.label') },
    { value: 'double_progression', label: t('progression.doubleProgression.label') },
    { value: 'rpe', label: t('progression.rpe.label') },
    { value: 'rir', label: t('progression.rir.label') },
  ];

  return (
    <>
      {showInfo && <ProgressionInfoModal onClose={() => setShowInfo(false)} />}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <label className="text-xs text-text-primary opacity-50">{t('progression.label')}</label>
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-border text-text-primary opacity-40 hover:opacity-100 hover:border-accent hover:text-accent transition-all cursor-pointer shrink-0"
            aria-label={t('progression.infoAriaLabel')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-2.5 h-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </div>
        <FilterDropdown
          label=""
          options={progressionOptions}
          value={value}
          onChange={onChange}
          buttonClassName={`min-w-[152px] ${buttonClassName ?? ''}`}
        />
      </div>
    </>
  );
}

export const PROGRESSION_OPTIONS = [
  { value: 'none', label: 'Fixed' },
  { value: 'linear', label: 'Linear' },
  { value: 'double_progression', label: 'Double progression' },
  { value: 'rpe', label: 'RPE' },
  { value: 'rir', label: 'RIR' },
];
