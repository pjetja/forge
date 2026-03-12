import Link from 'next/link';

interface PlanCardProps {
  id: string;
  name: string;
  weekCount: number;
  workoutsPerWeek: number;
  assignedCount: number;
}

export function PlanCard({ id, name, weekCount, workoutsPerWeek, assignedCount }: PlanCardProps) {
  return (
    <Link
      href={`/trainer/plans/${id}`}
      className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between hover:border-accent transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium text-text-primary truncate">{name}</p>
        <p className="text-sm text-text-primary mt-1">
          {weekCount} {weekCount === 1 ? 'week' : 'weeks'} &middot;{' '}
          {workoutsPerWeek} workout{workoutsPerWeek !== 1 ? 's' : ''}/week
          {assignedCount > 0 && (
            <> &middot; {assignedCount} {assignedCount === 1 ? 'trainee' : 'trainees'}</>
          )}
        </p>
      </div>
      <span className="text-text-primary flex-shrink-0 ml-3">&rsaquo;</span>
    </Link>
  );
}
