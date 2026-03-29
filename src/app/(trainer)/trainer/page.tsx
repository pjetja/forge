import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { InviteDialog } from './_components/InviteDialog';
import { getCurrentWeekBounds } from '@/lib/utils/week';
import { gravatarUrl } from '@/lib/gravatar';
import { GravatarAvatar } from '@/components/GravatarAvatar';

export default async function TrainerHomePage() {
  const t = await getTranslations('trainer');
  const supabase = await createClient();

  // Fetch connected trainees — RLS filters to this trainer's connections only
  const { data: connections, error } = await supabase
    .from('trainer_trainee_connections')
    .select('trainee_auth_uid, connected_at')
    .order('connected_at', { ascending: false });

  const traineeIds = (connections ?? []).map((c) => c.trainee_auth_uid);

  // Fetch user profiles separately — avoids PostgREST FK hint issues
  const { data: userRows } = traineeIds.length > 0
    ? await supabase
        .from('users')
        .select('auth_uid, name, email')
        .in('auth_uid', traineeIds)
    : { data: [] };

  const usersByAuthUid = Object.fromEntries(
    (userRows ?? []).map((u) => [u.auth_uid, u])
  );

  // Fetch assigned plans (active or pending) for all connected trainees
  let assignedPlansByTrainee: Record<string, { id: string; name: string; status: string } | null> = {};

  if (traineeIds.length > 0) {
    const { data: assignedPlans } = await supabase
      .from('assigned_plans')
      .select('id, trainee_auth_uid, name, status')
      .in('trainee_auth_uid', traineeIds)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false });

    // Map: one per trainee — prefer active over pending
    for (const ap of assignedPlans ?? []) {
      const existing = assignedPlansByTrainee[ap.trainee_auth_uid];
      if (!existing || (ap.status === 'active' && existing.status !== 'active')) {
        assignedPlansByTrainee[ap.trainee_auth_uid] = {
          id: ap.id,
          name: ap.name,
          status: ap.status,
        };
      }
    }
  }

  // Compliance stats — batch query across all trainees
  const { weekStart } = getCurrentWeekBounds();

  const { data: sessions } = traineeIds.length > 0
    ? await supabase
        .from('workout_sessions')
        .select('trainee_auth_uid, completed_at')
        .in('trainee_auth_uid', traineeIds)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
    : { data: [] };

  const statsByTrainee: Record<string, { lastSession: string | null; thisWeek: number }> = {};
  for (const session of sessions ?? []) {
    const uid = session.trainee_auth_uid;
    const stat = statsByTrainee[uid] ??= { lastSession: null, thisWeek: 0 };
    if (!stat.lastSession) stat.lastSession = session.completed_at; // first = most recent (desc order)
    if (new Date(session.completed_at) >= weekStart) stat.thisWeek++;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{t('trainees.heading')}</h1>
        <InviteDialog />
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-sm p-4 text-sm text-red-400">
          {t('trainees.failedToLoad')}
        </div>
      )}

      {!error && traineeIds.length === 0 && (
        <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
          <div className="text-4xl">👥</div>
          <h2 className="font-medium text-text-primary">{t('trainees.noTraineesYet')}</h2>
          <p className="text-sm text-text-primary max-w-sm mx-auto">
            {t('trainees.noTraineesBody')}
          </p>
        </div>
      )}

      {!error && traineeIds.length > 0 && (
        <div className="space-y-3">
          {(connections ?? []).map((connection) => {
            const trainee = usersByAuthUid[connection.trainee_auth_uid] ?? null;
            const currentPlan = assignedPlansByTrainee[connection.trainee_auth_uid] ?? null;

            return (
              <Link
                key={connection.trainee_auth_uid}
                href={`/trainer/trainees/${connection.trainee_auth_uid}`}
                className="bg-bg-surface border border-border rounded-sm p-4 flex items-center gap-4 hover:border-accent transition-colors"
              >
                {/* Avatar */}
                <GravatarAvatar url={gravatarUrl(trainee?.email ?? '')} name={trainee?.name ?? ''} size={40} />
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {trainee?.name ?? t('trainees.unknownTrainee')}
                  </p>
                  {currentPlan ? (
                    <p className="text-sm text-text-primary truncate">
                      <span
                        className={
                          currentPlan.status === 'active' ? 'text-accent' : 'text-text-primary opacity-50'
                        }
                      >
                        {currentPlan.status === 'active' ? t('trainees.activePlan') : t('trainees.upcomingPlan')}:
                      </span>{' '}
                      {currentPlan.name}
                    </p>
                  ) : (
                    <p className="text-sm text-text-primary opacity-40">{t('trainees.noPlanAssigned')}</p>
                  )}
                  {(() => {
                    const stat = statsByTrainee[connection.trainee_auth_uid];
                    if (!stat || (!stat.lastSession && stat.thisWeek === 0)) {
                      return <p className="text-sm text-text-primary opacity-50">{t('trainees.noSessionsYet')}</p>;
                    }
                    const parts: string[] = [];
                    if (stat.lastSession) {
                      parts.push(`${t('trainees.lastWorkout')}: ${new Date(stat.lastSession).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`);
                    }
                    parts.push(t('trainees.thisWeek', { count: stat.thisWeek }));
                    return <p className="text-sm text-text-primary opacity-50">{parts.join(' \u00B7 ')}</p>;
                  })()}
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
