import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { gravatarUrl } from '@/lib/gravatar';
import { GravatarAvatar } from '@/components/GravatarAvatar';
import { signOut } from '@/app/(auth)/login/actions';
import { TraineeProfileForm } from './_components/TraineeProfileForm';
import { TrainerCard } from './_components/TrainerCard';

export default async function TraineeProfilePage() {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, goals, height_cm, weight_kg, date_of_birth')
    .eq('auth_uid', claims.sub)
    .single();

  const name = profile?.name ?? '';
  const email = profile?.email ?? '';

  // Fetch trainer connection for "My Trainer" card
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
    <div className="max-w-xl mx-auto space-y-8">
      {/* Avatar + identity header */}
      <div className="flex items-center gap-4">
        <GravatarAvatar
          url={gravatarUrl(email)}
          name={name}
          size={80}
          className="ring-2 ring-accent shrink-0"
        />
        <div>
          <h1 className="text-[28px] font-bold text-text-primary">{name}</h1>
          <p className="text-sm text-text-primary opacity-50">{email}</p>
          <p className="text-sm text-text-primary opacity-50">
            Set your avatar at gravatar.com
          </p>
        </div>
      </div>

      {/* Profile section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary">Profile</h2>
        <TraineeProfileForm
          initialName={name}
          initialGoals={profile?.goals ?? ''}
          initialHeightCm={profile?.height_cm ?? null}
          initialWeightKg={profile?.weight_kg ? Number(profile.weight_kg) : null}
          initialDateOfBirth={profile?.date_of_birth ?? null}
        />
      </div>

      {/* My Trainer section — only shown when a connection exists */}
      {trainerInfo && <TrainerCard trainer={trainerInfo} />}

      {/* Sign out */}
      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-error hover:text-red-400 transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
