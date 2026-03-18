'use client';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { MUSCLE_GROUPS } from '@/lib/db/schema';
import { MultiFilterDropdown } from '@/components/MultiFilterDropdown';

interface TraineeExerciseFilterBarProps {
  initialQuery: string;
  initialMuscles: string[];
}

export function TraineeExerciseFilterBar({ initialQuery, initialMuscles }: TraineeExerciseFilterBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [inputValue, setInputValue] = useState(initialQuery);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (inputValue.trim()) {
      params.set('q', inputValue.trim());
    } else {
      params.delete('q');
    }
    // Always preserve tab=exercises
    params.set('tab', 'exercises');
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
    params.set('tab', 'exercises');
    replace(`${pathname}?${params.toString()}`);
  }

  const activeMuscles = searchParams.get('muscles')?.split(',').filter(Boolean) ?? [];
  const hasActiveFilters = activeMuscles.length > 0 || (searchParams.get('q') ?? '').length > 0;

  function clearFilters() {
    setInputValue('');
    replace(`${pathname}?tab=exercises`);
  }

  function handleMusclesChange(values: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (values.length > 0) {
      params.set('muscles', values.join(','));
    } else {
      params.delete('muscles');
    }
    params.set('tab', 'exercises');
    replace(`${pathname}?${params.toString()}`);
  }

  const muscleOptions = MUSCLE_GROUPS.map((g) => ({ value: g, label: g }));

  const chipClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer ${
      active
        ? 'bg-accent text-white border-accent'
        : 'bg-bg-surface text-text-primary border-border hover:border-accent'
    }`;

  void initialMuscles;

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
          placeholder="Search exercises..."
          className="flex-1 bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          Search
        </button>
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          aria-label="Clear filters"
          className="border border-border rounded-sm px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:text-text-primary enabled:hover:border-accent enabled:cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </form>

      {/* Mobile: dropdown only */}
      <div className="flex md:hidden items-center gap-2">
        <MultiFilterDropdown label="Muscles" options={muscleOptions} values={activeMuscles} onChange={handleMusclesChange} />
      </div>

      {/* Desktop: muscle chips */}
      <div className="hidden md:flex flex-wrap items-center gap-2">
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
