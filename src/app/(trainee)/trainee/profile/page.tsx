import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { gravatarUrl } from '@/lib/gravatar';
import { GravatarAvatar } from '@/components/GravatarAvatar';
import { TabSwitcher } from '@/components/TabSwitcher';
import { TraineeProfileForm } from './_components/TraineeProfileForm';
import { TrainerCard } from './_components/TrainerCard';

export default async function TraineeProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) redirect('/login');

  const resolvedSearch = await searchParams;
  const activeTab = resolvedSearch?.tab === 'trainer' ? 'trainer' : 'profile';

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, goals, height_cm, weight_kg, date_of_birth')
    .eq('auth_uid', claims.sub)
    .single();

  const t = await getTranslations('trainee');
  const name = profile?.name ?? '';
  const email = profile?.email ?? '';

  // Fetch trainer connection for "My Trainer" tab
  const { data: connection } = await supabase
    .from('trainer_trainee_connections')
    .select('trainer_auth_uid')
    .eq('trainee_auth_uid', claims.sub)
    .maybeSingle();

  let trainerInfo = null;
  if (connection) {
    const { data: trainer } = await supabase
      .from('trainers')
      .select('name, email, bio')
      .eq('auth_uid', connection.trainer_auth_uid)
      .single();
    if (trainer) {
      trainerInfo = {
        ...trainer,
        avatarUrl: gravatarUrl(trainer.email),
      };
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar + identity header */}
      <div className="flex items-center gap-4">
        <GravatarAvatar
          url={gravatarUrl(email)}
          name={name}
          size={64}
          className="ring-2 ring-accent shrink-0"
        />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
          <p className="text-sm text-text-primary opacity-50">{email}</p>
        </div>
      </div>

      <TabSwitcher
        tabs={[
          { key: 'profile', label: t('profile.tabProfile') },
          { key: 'trainer', label: t('profile.tabMyTrainer') },
        ]}
        activeTab={activeTab}
      />

      {activeTab === 'profile' && (
        <TraineeProfileForm
          initialName={name}
          initialGoals={profile?.goals ?? ''}
          initialHeightCm={profile?.height_cm ?? null}
          initialWeightKg={profile?.weight_kg ? Number(profile.weight_kg) : null}
          initialDateOfBirth={profile?.date_of_birth ?? null}
        />
      )}

      {activeTab === 'trainer' && (
        trainerInfo
          ? <TrainerCard trainer={trainerInfo} />
          : <p className="text-text-primary opacity-50">{t('profile.noTrainer')}</p>
      )}
    </div>
  );
}
