import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ExerciseListFilterBar } from './ExerciseListFilterBar';

interface ExercisesTabProps {
  traineeId: string;
  searchQuery: string;
  muscleFilter: string;
}

export async function ExercisesTab({ traineeId, searchQuery, muscleFilter }: ExercisesTabProps) {
  const supabase = await createClient();

  // Step 1: Get all completed session IDs for this trainee
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('trainee_auth_uid', traineeId)
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
      <ExerciseListFilterBar initialQuery={searchQuery} initialMuscles={initialMuscles} />

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
                href={`/trainer/trainees/${traineeId}/exercises/${ex.id}`}
                className="bg-bg-surface border border-border rounded-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:border-accent/50 transition-colors"
              >
                {/* Row 1 (mobile) / Left (desktop): name + muscle group tag */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-text-primary truncate">{ex.name}</span>
                  <span className="text-xs border border-border rounded-sm px-1.5 py-0.5 flex-shrink-0">
                    {ex.muscleGroup}
                  </span>
                </div>

                {/* Row 2: best + last logged as badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-bg-page border border-border ${ex.personalBest != null ? 'text-accent font-bold' : 'text-text-primary opacity-50'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                    {ex.personalBest != null ? `${ex.personalBest} kg` : 'No best'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-bg-page border border-border text-text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {lastLoggedDate}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
