'use client';
import Link from 'next/link';
import { useTransition } from 'react';
import { duplicatePlan } from '../plans/actions';
import { useRouter } from 'next/navigation';

interface PlanCardProps {
  id: string;
  name: string;
  weekCount: number;
  workoutsPerWeek: number;
  assignedCount: number;
}

export function PlanCard({ id, name, weekCount, workoutsPerWeek, assignedCount }: PlanCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();
    startTransition(async () => {
      const result = await duplicatePlan(id, `Copy of ${name}`);
      if (!('error' in result)) {
        router.refresh();
      }
    });
  }

  return (
    <Link
      href={`/trainer/plans/${id}`}
      className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between hover:border-accent transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text-primary truncate">{name}</p>
        <p className="text-sm text-text-primary mt-1">
          {weekCount} {weekCount === 1 ? 'week' : 'weeks'} &middot;{' '}
          {workoutsPerWeek} workout{workoutsPerWeek !== 1 ? 's' : ''}/week
          {assignedCount > 0 && (
            <> &middot; {assignedCount} {assignedCount === 1 ? 'trainee' : 'trainees'}</>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={isPending}
          className="text-xs text-text-primary opacity-50 hover:opacity-100 hover:text-accent transition-opacity cursor-pointer disabled:opacity-30"
          title="Duplicate plan"
        >
          {isPending ? '...' : 'Duplicate'}
        </button>
        <span className="text-text-primary">&rsaquo;</span>
      </div>
    </Link>
  );
}
