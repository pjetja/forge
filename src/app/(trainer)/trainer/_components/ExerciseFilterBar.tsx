'use client';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { MUSCLE_GROUPS } from '@/lib/db/schema';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FilterDropdown } from '@/components/FilterDropdown';
import { MultiFilterDropdown } from '@/components/MultiFilterDropdown';

interface ExerciseFilterBarProps {
  initialQuery: string;
  initialMuscles: string[];
  initialHasVideo: boolean;
}

export function ExerciseFilterBar({ initialQuery, initialMuscles, initialHasVideo }: ExerciseFilterBarProps) {
  const t = useTranslations('trainer');
  const tc = useTranslations('common');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [inputValue, setInputValue] = useState(initialQuery);

  const VIDEO_OPTIONS = [
    { value: '', label: tc('video.all') },
    { value: 'yes', label: tc('video.yes') },
    { value: 'no', label: tc('video.no') },
  ];

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (inputValue.trim()) {
      params.set('q', inputValue.trim());
    } else {
      params.delete('q');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  function toggleMuscle(muscle: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get('muscles')?.split(',').filter(Boolean) ?? [];
    const next = current.includes(muscle)
      ? current.filter((m) => m !== muscle)
      : [...current, muscle];
    if (next.length > 0) {
      params.set('muscles', next.join(','));
    } else {
      params.delete('muscles');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  function handleVideoFilter(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set('video', val);
    } else {
      params.delete('video');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  const activeMuscles = searchParams.get('muscles')?.split(',').filter(Boolean) ?? [];
  const videoFilter = searchParams.get('video') ?? '';
  const hasActiveFilters = activeMuscles.length > 0 || (searchParams.get('q') ?? '').length > 0 || videoFilter !== '';

  function clearFilters() {
    setInputValue('');
    replace(pathname);
  }

  void initialMuscles;
  void initialHasVideo;

  const muscleOptions = MUSCLE_GROUPS.map((g) => ({ value: g, label: g }));

  const chipClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer ${
      active
        ? 'bg-accent text-white border-accent'
        : 'bg-bg-surface text-text-primary border-border hover:border-accent'
    }`;

  function handleMusclesChange(values: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (values.length > 0) {
      params.set('muscles', values.join(','));
    } else {
      params.delete('muscles');
    }
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          name="q"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          autoComplete="off"
          placeholder={t('exercises.searchPlaceholder')}
          className="flex-1 bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          {t('exercises.searchButton')}
        </button>
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          aria-label={tc('label.search')}
          className="border border-border rounded-sm px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:text-text-primary enabled:hover:border-accent enabled:cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </form>

      {/* Mobile: dropdowns only */}
      <div className="flex md:hidden items-center gap-2">
        <FilterDropdown label={t('exercises.videoLabel')} options={VIDEO_OPTIONS} value={videoFilter} onChange={handleVideoFilter} />
        <MultiFilterDropdown label={tc('nav.exercises')} options={muscleOptions} values={activeMuscles} onChange={handleMusclesChange} />
      </div>

      {/* Desktop: Video dropdown + muscle chips */}
      <div className="hidden md:flex flex-wrap items-center gap-2">
        <FilterDropdown label={t('exercises.videoLabel')} options={VIDEO_OPTIONS} value={videoFilter} onChange={handleVideoFilter} />
        {MUSCLE_GROUPS.map((muscle) => (
          <button
            key={muscle}
            type="button"
            onClick={() => toggleMuscle(muscle)}
            className={chipClass(activeMuscles.includes(muscle))}
          >
            {muscle}
          </button>
        ))}
      </div>
    </div>
  );
}
