'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface PlanTemplate {
  id: string;
  name: string;
  week_count: number;
  workouts_per_week: number;
}

interface PlanPickerProps {
  plans: PlanTemplate[];
  traineeId: string;
}

export function PlanPicker({ plans, traineeId }: PlanPickerProps) {
  const [query, setQuery] = useState('');
  const t = useTranslations('trainer');

  const filtered = query.trim()
    ? plans.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : plans.slice(0, 3);

  const isSearching = query.trim().length > 0;

  return (
    <div className="space-y-3">
      {/* Search input */}
      {plans.length > 3 && (
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary opacity-40 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('traineeDetail.exercises.searchPlaceholder')}
            className="w-full bg-bg-page border border-border rounded-sm pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-primary placeholder:opacity-40 focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {/* Plan list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-primary opacity-50 py-2">No plans match &ldquo;{query}&rdquo;</p>
        ) : (
          filtered.map((pt) => (
            <Link
              key={pt.id}
              href={`/trainer/plans/${pt.id}/assign/${traineeId}`}
              className="flex items-center justify-between p-3 border border-border rounded-sm hover:border-accent transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{pt.name}</p>
                <p className="text-xs text-text-primary opacity-60">
                  {t('traineeDetail.plans.weeks', { count: pt.week_count })} &middot; {t('traineeDetail.plans.workoutsPerWeek', { count: pt.workouts_per_week })}
                </p>
              </div>
              <span className="text-xs text-accent flex-shrink-0">Assign →</span>
            </Link>
          ))
        )}
      </div>

      {/* "Showing top 3" hint */}
      {!isSearching && plans.length > 3 && (
        <p className="text-xs text-text-primary opacity-40">
          Showing 3 of {plans.length} plans. Search to find others.
        </p>
      )}
    </div>
  );
}
