import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { TraineeExerciseFilterBar } from './TraineeExerciseFilterBar';

interface TraineeExercisesTabProps {
  traineeAuthUid: string;
  searchQuery: string;
  muscleFilter: string;
}

export async function TraineeExercisesTab({ traineeAuthUid, searchQuery, muscleFilter }: TraineeExercisesTabProps) {
  const supabase = await createClient();

  // Step 1: Get all completed session IDs for this trainee
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('trainee_auth_uid', traineeAuthUid)
    .eq('status', 'completed');
  const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);

  // Step 2: Get all session_sets with exercise_id join
  const { data: setsData } = sessionIds.length > 0
    ? await supabase
        .from('session_sets')
        .select('actual_weight_kg, completed_at, assigned_schema_exercises!inner(exercise_id)')
        .in('session_id', sessionIds)
    : { data: [] };

  // Step 3: Aggregate in-memory — group by exercise_id
  const exerciseMap = new Map<string, { maxWeight: number | null; lastDate: string }>();
  for (const set of (setsData ?? [])) {
    const exerciseId = (set.assigned_schema_exercises as unknown as { exercise_id: string }).exercise_id;
    const weight = set.actual_weight_kg != null
      ? Math.round(parseFloat(String(set.actual_weight_kg)) * 10) / 10
      : null;
    const existing = exerciseMap.get(exerciseId);
    if (!existing) {
      exerciseMap.set(exerciseId, { maxWeight: weight, lastDate: set.completed_at });
    } else {
      exerciseMap.set(exerciseId, {
        maxWeight: weight != null && (existing.maxWeight == null || weight > existing.maxWeight)
          ? weight : existing.maxWeight,
        lastDate: set.completed_at > existing.lastDate ? set.completed_at : existing.lastDate,
      });
    }
  }

  // Step 4: Fetch exercise names via admin client (exercises table is trainer-owned RLS)
  const exerciseIds = Array.from(exerciseMap.keys());
  const admin = createAdminClient();
  const { data: exerciseRows } = exerciseIds.length > 0
    ? await admin.from('exercises').select('id, name, muscle_group').in('id', exerciseIds)
    : { data: [] };

  // Step 5: Join and sort by lastDate descending
  const exerciseList = (exerciseRows ?? []).map((ex: { id: string; name: string; muscle_group: string }) => ({
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.muscle_group,
    personalBest: exerciseMap.get(ex.id)?.maxWeight ?? null,
    lastLogged: exerciseMap.get(ex.id)?.lastDate ?? '',
  })).sort((a, b) => b.lastLogged.localeCompare(a.lastLogged));

  // Step 6: Apply search and muscle group filters in-memory
  let filtered = exerciseList;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((ex) => ex.name.toLowerCase().includes(q));
  }
  if (muscleFilter) {
    const muscles = muscleFilter.split(',').filter(Boolean);
    if (muscles.length > 0) {
      filtered = filtered.filter((ex) => muscles.includes(ex.muscleGroup));
    }
  }

  const initialMuscles = muscleFilter ? muscleFilter.split(',').filter(Boolean) : [];

  return (
    <div>
      <TraineeExerciseFilterBar initialQuery={searchQuery} initialMuscles={initialMuscles} />

      {exerciseList.length === 0 ? (
        // Empty state — no exercises logged at all
        <div className="flex flex-col items-center justify-center p-12 bg-bg-surface border border-border rounded-sm text-center">
          <h3 className="text-sm font-bold text-text-primary mb-1">No exercises logged yet</h3>
          <p className="text-sm text-text-primary opacity-60">
            Completed workouts will appear here once sets are logged.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        // No results after filtering
        <p className="text-sm text-text-primary opacity-60">No exercises match your search.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((ex) => {
            const lastLoggedDate = ex.lastLogged
              ? new Date(ex.lastLogged).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '—';

            return (
              <Link
                key={ex.id}
                href={`/trainee/exercises/${ex.id}`}
                className="bg-bg-surface border border-border rounded-sm p-4 flex items-center justify-between hover:border-accent/50 transition-colors"
              >
                {/* Left: name + muscle group */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold text-text-primary truncate">{ex.name}</span>
                  <span className="text-xs border border-border rounded-sm px-1.5 py-0.5 inline-block w-fit">
                    {ex.muscleGroup}
                  </span>
                </div>

                {/* Right: personal best + last logged */}
                <div className="text-right space-y-1 flex-shrink-0 ml-4">
                  <div>
                    <span className="text-xs text-text-primary opacity-50">Best</span>
                    <p className={`text-sm font-bold ${ex.personalBest != null ? 'text-accent' : 'text-text-primary opacity-50'}`}>
                      {ex.personalBest != null ? `${ex.personalBest} kg` : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-text-primary opacity-50">Last logged</span>
                    <p className="text-sm text-text-primary">{lastLoggedDate}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
