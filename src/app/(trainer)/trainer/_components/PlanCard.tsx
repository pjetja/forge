'use client';
import Link from 'next/link';
import { useTransition, useState } from 'react';
import { duplicatePlan, deletePlan } from '../plans/actions';
import { useRouter } from 'next/navigation';

interface PlanCardProps {
  id: string;
  name: string;
  weekCount: number;
  workoutsPerWeek: number;
  assignedCount: number;
  tags: string[];
}

export function PlanCard({ id, name, weekCount, workoutsPerWeek, assignedCount, tags }: PlanCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await duplicatePlan(id, `Copy of ${name}`);
      if (!('error' in result)) router.refresh();
    });
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete(true);
  }

  function handleDeleteConfirm(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await deletePlan(id);
      if (!('error' in result)) {
        if (result.archived) {
          alert(`"${name}" is archived — trainees with this plan can still use it, but it's hidden from your list.`);
        }
        router.refresh();
      }
      setConfirmDelete(false);
    });
  }

  function handleDeleteCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete(false);
  }

  return (
    <Link
      href={`/trainer/plans/${id}`}
      className="bg-bg-surface border border-border rounded-sm p-4 flex items-start justify-between hover:border-accent transition-colors"
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
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs bg-bg-page border border-border text-text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        {confirmDelete ? (
          <>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-30"
            >
              {isPending ? '...' : assignedCount > 0 ? 'Archive' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={handleDeleteCancel}
              className="text-xs text-text-primary opacity-50 hover:opacity-100 cursor-pointer"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isPending}
              className="text-xs text-text-primary opacity-50 hover:opacity-100 hover:text-accent transition-opacity cursor-pointer disabled:opacity-30"
              title="Duplicate plan"
            >
              {isPending ? '...' : 'Duplicate'}
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isPending}
              className="text-xs text-text-primary opacity-50 hover:opacity-100 hover:text-red-400 transition-opacity cursor-pointer disabled:opacity-30"
              title={assignedCount > 0 ? 'Archive plan' : 'Delete plan'}
            >
              {assignedCount > 0 ? 'Archive' : 'Delete'}
            </button>
            <span className="text-text-primary">&rsaquo;</span>
          </>
        )}
      </div>
    </Link>
  );
}
