import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Exercise } from '@/lib/db/schema';
import { ExerciseGrid } from '../_components/ExerciseGrid';
import { ExerciseFilterBar } from '../_components/ExerciseFilterBar';
import { ExerciseAddButton } from '../_components/ExerciseAddButton';

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; muscles?: string; video?: string }>;
}) {
  const t = await getTranslations('trainer');
  const params = await searchParams;
  const query = params?.q?.trim() ?? '';
  const muscleFilter = params?.muscles?.split(',').filter(Boolean) ?? [];
  const videoParam = params?.video ?? '';

  const supabase = await createClient();
  let dbQuery = supabase
    .from('exercises')
    .select('id, name, muscle_group, description, notes, video_url, created_at, updated_at, trainer_auth_uid')
    .order('name', { ascending: true });

  if (query) dbQuery = dbQuery.ilike('name', `%${query}%`);
  if (muscleFilter.length > 0) dbQuery = dbQuery.in('muscle_group', muscleFilter);
  if (videoParam === 'yes') dbQuery = dbQuery.not('video_url', 'is', null);
  if (videoParam === 'no') dbQuery = dbQuery.is('video_url', null);

  const { data, error } = await dbQuery;

  // Map snake_case DB columns to camelCase Exercise type
  const exercises: Exercise[] = (data ?? []).map((row) => ({
    id: row.id,
    trainerAuthUid: row.trainer_auth_uid,
    name: row.name,
    muscleGroup: row.muscle_group,
    description: row.description,
    notes: row.notes,
    videoUrl: row.video_url,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  }));

  const isFiltered = query.length > 0 || muscleFilter.length > 0 || videoParam !== '';

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{t('exercises.heading')}</h1>
        <ExerciseAddButton />
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-sm p-4 text-sm text-red-400">
          {t('exercises.failedToLoad')}
        </div>
      )}

      {!error && (
        <>
          <ExerciseFilterBar initialQuery={query} initialMuscles={muscleFilter} initialHasVideo={videoParam !== ''} />

          {exercises.length === 0 && !isFiltered && (
            <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
              <div className="text-4xl">🏋️</div>
              <h2 className="font-medium text-text-primary">{t('exercises.emptyLibraryHeading')}</h2>
              <p className="text-sm text-text-primary max-w-sm mx-auto">
                {t('exercises.emptyLibraryBody')}
              </p>
            </div>
          )}

          {exercises.length === 0 && isFiltered && (
            <div className="bg-bg-surface border border-border rounded-sm p-12 text-center space-y-3">
              <p className="text-text-primary font-medium">{t('exercises.noExercisesFound')}</p>
              <Link
                href="/trainer/exercises"
                className="inline-block bg-bg-surface hover:bg-bg-page border border-border rounded-sm px-4 py-2 text-sm text-text-primary transition-colors"
              >
                {t('exercises.clearFilters')}
              </Link>
            </div>
          )}

          <ExerciseGrid exercises={exercises} />
        </>
      )}
    </div>
  );
}
