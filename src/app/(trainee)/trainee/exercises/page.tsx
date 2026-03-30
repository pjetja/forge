import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { TraineeExercisesTab } from '../_components/TraineeExercisesTab';

export default async function TraineeExercisesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; muscles?: string }>;
}) {
  const resolvedSearch = await searchParams;

  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) redirect('/login');

  const t = await getTranslations('trainee');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">{t('exercises.heading')}</h1>
      <TraineeExercisesTab
        traineeAuthUid={claims.sub}
        searchQuery={resolvedSearch?.q ?? ''}
        muscleFilter={resolvedSearch?.muscles ?? ''}
      />
    </div>
  );
}
