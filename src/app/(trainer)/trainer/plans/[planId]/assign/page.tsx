import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AssignPlanClientPage } from './AssignPlanClientPage';

export default async function AssignPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const t = await getTranslations('trainer');
  const supabase = await createClient();

  // Fetch plan template
  const { data: planData } = await supabase
    .from('plans')
    .select('id, name')
    .eq('id', planId)
    .single();

  if (!planData) notFound();

  // Fetch connected trainees
  const { data: connections } = await supabase
    .from('trainer_trainee_connections')
    .select('trainee_auth_uid');

  const traineeAuthUids = (connections ?? []).map((c: any) => c.trainee_auth_uid);

  const { data: userRows } = traineeAuthUids.length > 0
    ? await supabase.from('users').select('auth_uid, name, email').in('auth_uid', traineeAuthUids)
    : { data: [] };

  const usersByAuthUid = Object.fromEntries((userRows ?? []).map((u: any) => [u.auth_uid, u]));

  const trainees = traineeAuthUids.map((uid: string) => ({
    authUid: uid,
    name: usersByAuthUid[uid]?.name ?? 'Unknown',
    email: usersByAuthUid[uid]?.email ?? '',
  }));

  // Check which trainees have existing active/pending plans
  const { data: existingPlans } = await supabase
    .from('assigned_plans')
    .select('trainee_auth_uid')
    .in('trainee_auth_uid', trainees.map((t) => t.authUid))
    .in('status', ['pending', 'active']);

  const traineesWithActivePlan = new Set(
    (existingPlans ?? []).map((p: any) => p.trainee_auth_uid)
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/trainer/plans/${planId}`}
          className="text-sm text-text-primary hover:text-accent transition-colors"
        >
          &larr; {planData.name}
        </Link>
        <h1 className="text-2xl font-bold text-text-primary mt-1">{t('assign.heading')}</h1>
        <p className="text-sm text-text-primary opacity-60">{t('assign.selectTraineeDescription')}</p>
      </div>

      <AssignPlanClientPage
        planId={planId}
        trainees={trainees}
        traineesWithActivePlan={[...traineesWithActivePlan]}
      />
    </div>
  );
}
