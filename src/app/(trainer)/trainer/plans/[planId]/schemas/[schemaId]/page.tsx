import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SchemaExerciseList } from '../../../../_components/SchemaExerciseList';
import { SchemaEditorAddButton } from '../../../../_components/SchemaEditorAddButton';
import type { SchemaExerciseItem } from '../../../../_components/SchemaExerciseRow';

export default async function SchemaEditorPage({
  params,
}: {
  params: Promise<{ planId: string; schemaId: string }>;
}) {
  const { planId, schemaId } = await params;
  const t = await getTranslations('trainer');
  const supabase = await createClient();

  const { data: schemaData } = await supabase
    .from('workout_schemas')
    .select('id, name, slot_index, plan_id')
    .eq('id', schemaId)
    .single();

  if (!schemaData) notFound();

  const { data: planData } = await supabase
    .from('plans')
    .select('id, name')
    .eq('id', planId)
    .single();

  if (!planData) notFound();

  // Fetch exercises already in this schema ordered by sort_order
  const { data: schemaExercises } = await supabase
    .from('schema_exercises')
    .select(
      `id,
       exercise_id,
       sort_order,
       sets,
       reps,
       target_weight_kg,
       per_set_weights,
       tempo,
       progression_mode,
       exercises (id, name, muscle_group)`
    )
    .eq('schema_id', schemaId)
    .order('sort_order');

  const items: SchemaExerciseItem[] = (schemaExercises ?? []).map((row) => {
    // exercises is a joined object (single row via FK), PostgREST returns object not array here
    const exercise = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises;
    return {
      id: row.id,
      exerciseId: row.exercise_id,
      exerciseName: exercise?.name ?? 'Unknown',
      muscleGroup: exercise?.muscle_group ?? '',
      sets: row.sets,
      reps: row.reps,
      targetWeightKg: row.target_weight_kg ? parseFloat(String(row.target_weight_kg)) : null,
      perSetWeights: Array.isArray(row.per_set_weights) ? (row.per_set_weights as number[]) : null,
      tempo: (row as { tempo?: string | null }).tempo ?? null,
      progressionMode: (row as { progression_mode?: string | null }).progression_mode ?? 'none',
    };
  });

  // Fetch all trainer exercises for the picker modal
  const { data: allExercisesData } = await supabase
    .from('exercises')
    .select('id, name, muscle_group')
    .order('name');

  const allExercises = (allExercisesData ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    muscleGroup: e.muscle_group,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/trainer/plans/${planId}`}
          className="text-sm text-text-primary hover:text-accent transition-colors"
        >
          &larr; {planData.name}
        </Link>
        <h1 className="text-2xl font-bold text-text-primary mt-1">{schemaData.name}</h1>
        <p className="text-sm text-text-primary opacity-60">{t('schemas.workoutLabel', { slot: schemaData.slot_index })}</p>
      </div>

      <SchemaExerciseList initialItems={items} schemaId={schemaId} planId={planId} />

      <SchemaEditorAddButton
        schemaId={schemaId}
        planId={planId}
        currentCount={items.length}
        allExercises={allExercises}
      />
    </div>
  );
}
