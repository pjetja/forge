import { createClient } from '@/lib/supabase/server';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Your Trainees</h1>
        <InviteDialog />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Failed to load trainees. Please refresh the page.
        </div>
      )}

      {!error && trainees.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
          <div className="text-4xl text-gray-300">👥</div>
          <h2 className="font-medium text-gray-700">No trainees yet</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
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
            const connectedDate = new Date(connection.connected_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={connection.trainee_auth_uid}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {initials}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {trainee?.name ?? 'Unknown trainee'}
                  </p>
                  <p className="text-sm text-gray-400 truncate">
                    {trainee?.email ?? connection.trainee_auth_uid}
                  </p>
                </div>
                {/* Connected date */}
                <div className="text-xs text-gray-400 flex-shrink-0">
                  Joined {connectedDate}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
