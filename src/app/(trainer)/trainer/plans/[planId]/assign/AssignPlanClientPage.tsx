import Link from 'next/link';

interface Trainee {
  authUid: string;
  name: string;
  email: string;
}

interface AssignPlanClientPageProps {
  planId: string;
  trainees: Trainee[];
  traineesWithActivePlan: string[];
}

export function AssignPlanClientPage({
  planId,
  trainees,
  traineesWithActivePlan,
}: AssignPlanClientPageProps) {
  const activePlanSet = new Set(traineesWithActivePlan);

  if (trainees.length === 0) {
    return (
      <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
        <p className="text-sm text-text-primary opacity-60">No trainees connected yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trainees.map((trainee) => {
        const hasActivePlan = activePlanSet.has(trainee.authUid);
        return (
          <Link
            key={trainee.authUid}
            href={`/trainer/plans/${planId}/assign/${trainee.authUid}`}
            className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between hover:border-accent transition-colors"
          >
            <div>
              <p className="font-medium text-text-primary">{trainee.name}</p>
              <p className="text-sm text-text-primary opacity-60">{trainee.email}</p>
            </div>
            {hasActivePlan && (
              <span className="text-xs bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded-full flex-shrink-0">
                Has active plan
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
