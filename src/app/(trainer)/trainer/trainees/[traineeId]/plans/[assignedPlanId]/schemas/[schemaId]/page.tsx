import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTranslations } from 'next-intl/server';
import { ProgressionBadge } from '@/components/ProgressionBadge';

export default async function TrainerSchemaPreviewPage({
  params,
}: {
  params: Promise<{ traineeId: string; assignedPlanId: string; schemaId: string }>;
}) {
  const { traineeId, assignedPlanId, schemaId } = await params;
  const supabase = await createClient();
  const t = await getTranslations('trainer');

  // Verify plan belongs to this trainee and trainer
  const { data: plan } = await supabase
    .from('assigned_plans')
    .select('id, name, status')
    .eq('id', assignedPlanId)
    .eq('trainee_auth_uid', traineeId)
    .maybeSingle();

  if (!plan) notFound();

  const { data: rawSchema } = await supabase
    .from('assigned_schemas')
    .select(
      'id, name, slot_index, assigned_schema_exercises(id, exercise_id, sort_order, sets, reps, target_weight_kg, tempo, progression_mode)'
    )
    .eq('id', schemaId)
    .eq('assigned_plan_id', assignedPlanId)
    .single();

  if (!rawSchema) notFound();

  type RawExercise = {
    id: string;
    exercise_id: string;
    sort_order: number;
    sets: number;
    reps: number;
    target_weight_kg: string | null;
    tempo: string | null;
    progression_mode: string;
  };

  const rawExercises = (
    Array.isArray(rawSchema.assigned_schema_exercises)
      ? rawSchema.assigned_schema_exercises
      : rawSchema.assigned_schema_exercises
        ? [rawSchema.assigned_schema_exercises]
        : []
  ) as unknown as RawExercise[];

  const admin = createAdminClient();
  const exerciseIds = rawExercises.map((ex) => ex.exercise_id);
  const { data: exerciseRows } = exerciseIds.length > 0
    ? await admin.from('exercises').select('id, name, muscle_group').in('id', exerciseIds)
    : { data: [] };
  const exerciseMap = Object.fromEntries((exerciseRows ?? []).map((e) => [e.id, e]));

  const exercises = rawExercises
    .map((ex) => {
      const info = exerciseMap[ex.exercise_id];
      return {
        id: ex.id,
        sortOrder: ex.sort_order,
        sets: ex.sets,
        reps: ex.reps,
        targetWeightKg: ex.target_weight_kg ? parseFloat(ex.target_weight_kg) : null,
        tempo: ex.tempo,
        progressionMode: ex.progression_mode,
        name: info?.name ?? 'Unknown',
        muscleGroup: info?.muscle_group ?? '',
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <Link
        href={`/trainer/trainees/${traineeId}/plans/${assignedPlanId}`}
        className="inline-flex items-center gap-1 text-sm text-text-primary hover:text-accent transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('traineeDetail.planView.backToPlan')}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">{rawSchema.name}</h1>
        <p className="text-sm text-text-primary opacity-60 mt-0.5">{plan.name}</p>
      </div>

      <div className="bg-border/40 border border-border rounded-sm px-4 py-3 text-sm text-text-primary opacity-70">
        {t('traineeDetail.planView.planNotStartedReadOnly')}
      </div>

      {exercises.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
          <p className="text-sm text-text-primary opacity-50">{t('traineeDetail.planView.noExercisesInWorkout')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="bg-bg-surface border border-border rounded-sm px-4 py-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">{ex.name}</p>
                  {(ex.muscleGroup || ex.tempo || (ex.progressionMode && ex.progressionMode !== 'none')) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {ex.muscleGroup && (
                        <span className="text-xs text-text-primary border border-border rounded-sm px-1.5 py-0.5">
                          {ex.muscleGroup}
                        </span>
                      )}
                      {ex.tempo && (
                        <span className="text-xs text-text-primary border border-border rounded-sm px-1.5 py-0.5">
                          Tempo {ex.tempo}
                        </span>
                      )}
                      {ex.progressionMode && ex.progressionMode !== 'none' && (
                        <ProgressionBadge mode={ex.progressionMode} />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-text-primary opacity-60 shrink-0">
                  {ex.sets} × {ex.reps}
                  {ex.targetWeightKg != null && <> &middot; {ex.targetWeightKg} kg</>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
