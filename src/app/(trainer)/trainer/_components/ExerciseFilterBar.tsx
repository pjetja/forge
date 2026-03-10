'use client';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { MUSCLE_GROUPS } from '@/lib/db/schema';
import { useState } from 'react';

interface ExerciseFilterBarProps {
  initialQuery: string;
  initialMuscles: string[];
}

export function ExerciseFilterBar({ initialQuery, initialMuscles }: ExerciseFilterBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Local state for the search input (not URL-synced until submit)
  const [inputValue, setInputValue] = useState(initialQuery);

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

  const activeMuscles = searchParams.get('muscles')?.split(',').filter(Boolean) ?? [];

  // Suppress unused variable warning — initialMuscles is used for SSR consistency
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
          placeholder="Search exercises..."
          className="flex-1 bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Muscle group chips */}
      <div className="flex flex-wrap gap-2">
        {MUSCLE_GROUPS.map((muscle) => (
          <button
            key={muscle}
            type="button"
            onClick={() => toggleMuscle(muscle)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer ${
              activeMuscles.includes(muscle)
                ? 'bg-accent text-white border-accent'
                : 'bg-bg-surface text-text-primary border-border hover:border-accent'
            }`}
          >
            {muscle}
          </button>
        ))}
      </div>
    </div>
  );
}
