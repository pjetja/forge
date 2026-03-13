'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PlanCard } from './PlanCard';

interface Plan {
  id: string;
  name: string;
  weekCount: number;
  workoutsPerWeek: number;
  assignedCount: number;
  tags: string[];
}

interface PlansClientProps {
  plans: Plan[];
  allTags: string[];
  migrationPending?: boolean;
}

export function PlansClient({ plans, allTags, migrationPending }: PlansClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filtered = selectedTag
    ? plans.filter((p) => p.tags.includes(selectedTag))
    : plans;

  return (
    <div className="space-y-6">
      {migrationPending && (
        <div className="bg-yellow-950 border border-yellow-700 rounded-sm p-3 text-sm text-yellow-300">
          Apply <strong>migration 0004</strong> in Supabase SQL Editor to enable tags, notes, and archive features.
          Plans are shown without filtering until then.
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Plans</h1>
        <Link
          href="/trainer/plans/new"
          className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors"
        >
          + New plan
        </Link>
      </div>

      {/* Tag filter bar — always shown */}
      <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer ${
              selectedTag === null
                ? 'bg-accent text-white border-accent'
                : 'bg-bg-surface text-text-primary border-border hover:border-accent'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface text-text-primary border-border hover:border-accent'
              }`}
            >
              {tag}
            </button>
          ))}
      </div>

      {plans.length === 0 && (
        <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
          <div className="text-4xl">📋</div>
          <h2 className="font-medium text-text-primary">No plans yet</h2>
          <p className="text-sm text-text-primary opacity-60 max-w-sm mx-auto">
            Create your first workout plan template. You can assign it to trainees after building it.
          </p>
          <Link
            href="/trainer/plans/new"
            className="inline-block mt-2 bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors"
          >
            Create a plan
          </Link>
        </div>
      )}

      {plans.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-text-primary opacity-60 text-center py-8">
          No plans with tag &ldquo;{selectedTag}&rdquo;.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((plan) => (
            <PlanCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              weekCount={plan.weekCount}
              workoutsPerWeek={plan.workoutsPerWeek}
              assignedCount={plan.assignedCount}
              tags={plan.tags}
            />
          ))}
        </div>
      )}
    </div>
  );
}
