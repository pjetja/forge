import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { InviteDialog } from './_components/InviteDialog';

interface TraineeRow {
  trainee_auth_uid: string;
  connected_at: string;
  users: {
    name: string;
    email: string;
  }[];
}

export default async function TrainerHomePage() {
  const supabase = await createClient();

  // Fetch connected trainees — RLS filters to this trainer's connections only
  // Join with users table to get trainee name/email
  const { data: connections, error } = await supabase
    .from('trainer_trainee_connections')
    .select(`
      trainee_auth_uid,
      connected_at,
      users!trainer_trainee_connections_trainee_auth_uid_fkey (
        name,
        email
      )
    `)
    .order('connected_at', { ascending: false });

  const trainees = (connections ?? []) as TraineeRow[];

  // Fetch assigned plans (active or pending) for all connected trainees
  const traineeIds = trainees.map((t) => t.trainee_auth_uid);
  let assignedPlansByTrainee: Record<string, { id: string; name: string; status: string } | null> = {};

  if (traineeIds.length > 0) {
    const { data: assignedPlans } = await supabase
      .from('assigned_plans')
      .select('id, trainee_auth_uid, name, status')
      .in('trainee_auth_uid', traineeIds)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false });

    // Map: one per trainee (first = most recent active/pending)
    for (const ap of assignedPlans ?? []) {
      if (!assignedPlansByTrainee[ap.trainee_auth_uid]) {
        assignedPlansByTrainee[ap.trainee_auth_uid] = {
          id: ap.id,
          name: ap.name,
          status: ap.status,
        };
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Your Trainees</h1>
        <InviteDialog />
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-sm p-4 text-sm text-red-400">
          Failed to load trainees. Please refresh the page.
        </div>
      )}

      {!error && trainees.length === 0 && (
        <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
          <div className="text-4xl">👥</div>
          <h2 className="font-medium text-text-primary">No trainees yet</h2>
          <p className="text-sm text-text-primary max-w-sm mx-auto">
            Invite your first client to get started. They&apos;ll receive a link to join your
            roster.
          </p>
        </div>
      )}

      {!error && trainees.length > 0 && (
        <div className="space-y-3">
          {trainees.map((connection) => {
            const trainee = connection.users[0] ?? null;
            const initials = trainee?.name
              ? trainee.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : '?';
            const currentPlan = assignedPlansByTrainee[connection.trainee_auth_uid] ?? null;

            return (
              <Link
                key={connection.trainee_auth_uid}
                href={`/trainer/trainees/${connection.trainee_auth_uid}`}
                className="bg-bg-surface border border-border rounded-sm p-4 flex items-center gap-4 hover:border-accent transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {initials}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {trainee?.name ?? 'Unknown trainee'}
                  </p>
                  {currentPlan ? (
                    <p className="text-sm text-text-primary truncate">
                      <span
                        className={
                          currentPlan.status === 'active' ? 'text-accent' : 'text-text-primary'
                        }
                      >
                        {currentPlan.status === 'active' ? 'Active' : 'Pending'}:
                      </span>{' '}
                      {currentPlan.name}
                    </p>
                  ) : (
                    <p className="text-sm text-text-primary">No plan assigned</p>
                  )}
                </div>
                {/* Chevron */}
                <span className="text-text-primary flex-shrink-0">&rsaquo;</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
