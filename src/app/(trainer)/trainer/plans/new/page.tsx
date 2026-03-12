'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPlan } from '../actions';

export default function NewPlanPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get('name') as string).trim();
    const weekCount = parseInt(data.get('weekCount') as string, 10);
    const workoutsPerWeek = parseInt(data.get('workoutsPerWeek') as string, 10);

    if (!name || isNaN(weekCount) || isNaN(workoutsPerWeek)) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createPlan({ name, weekCount, workoutsPerWeek });
      if ('error' in result) {
        setError(result.error);
      } else {
        router.push(`/trainer/plans/${result.planId}`);
      }
    });
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <a href="/trainer/plans" className="text-sm text-text-primary hover:text-accent transition-colors">
          &larr; Plans
        </a>
        <h1 className="text-2xl font-bold text-text-primary mt-2">New plan</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
            Plan name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. 8-Week Hypertrophy"
            className="w-full bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary placeholder:text-text-primary focus:border-accent focus:outline-none text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="weekCount" className="block text-sm font-medium text-text-primary mb-1">
              Number of weeks
            </label>
            <input
              id="weekCount"
              name="weekCount"
              type="number"
              required
              min={1}
              max={52}
              defaultValue={8}
              className="w-full bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none text-sm"
            />
          </div>

          <div>
            <label htmlFor="workoutsPerWeek" className="block text-sm font-medium text-text-primary mb-1">
              Workouts per week
            </label>
            <input
              id="workoutsPerWeek"
              name="workoutsPerWeek"
              type="number"
              required
              min={1}
              max={7}
              defaultValue={4}
              className="w-full bg-bg-surface border border-border rounded-sm px-3 py-2 text-text-primary focus:border-accent focus:outline-none text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-white bg-error/10 border border-error/30 rounded-sm px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-sm py-2 text-sm font-medium transition-colors cursor-pointer"
        >
          {isPending ? 'Creating...' : 'Create plan'}
        </button>
      </form>
    </div>
  );
}
