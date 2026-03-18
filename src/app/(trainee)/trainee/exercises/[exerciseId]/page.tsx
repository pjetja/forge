import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TraineeCrossPlanChart } from './_components/TraineeCrossPlanChart';

interface TraineeCrossPlanExercisePageProps {
  params: Promise<{ exerciseId: string }>;
}

export default async function TraineeCrossPlanExercisePage({ params }: TraineeCrossPlanExercisePageProps) {
  const { exerciseId } = await params;

  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) redirect('/login');

  // Fetch exercise name + muscle_group via admin client (exercises table is trainer-owned RLS)
  const admin = createAdminClient();
  const { data: exerciseRow } = await admin
    .from('exercises')
    .select('name, muscle_group')
    .eq('id', exerciseId)
    .single();

  if (!exerciseRow) notFound();

  // Get all assigned_schema_exercise IDs for this base exercise_id (cross-plan)
  const { data: aseRows } = await supabase
    .from('assigned_schema_exercises')
    .select('id')
    .eq('exercise_id', exerciseId);

  const aseIds = (aseRows ?? []).map((r) => r.id);

  // Get all completed sessions for this trainee in chronological order
  const { data: sessionsData } = await supabase
    .from('workout_sessions')
    .select('id, completed_at')
    .eq('trainee_auth_uid', claims.sub)
    .eq('status', 'completed')
    .order('completed_at', { ascending: true });

  const sessions = sessionsData ?? [];
  const sessionIds = sessions.map((s) => s.id);

  // Get all session_sets for those ASE IDs in those sessions
  const { data: setsData } =
    aseIds.length > 0 && sessionIds.length > 0
      ? await supabase
          .from('session_sets')
          .select('session_id, actual_weight_kg')
          .in('assigned_schema_exercise_id', aseIds)
          .in('session_id', sessionIds)
      : { data: [] };

  // Group by session_id, compute top-set weight (max actual_weight_kg per session)
  const topSetBySession = new Map<string, number | null>();
  for (const set of setsData ?? []) {
    const w =
      set.actual_weight_kg != null
        ? Math.round(parseFloat(String(set.actual_weight_kg)) * 10) / 10
        : null;
    const existing = topSetBySession.get(set.session_id);
    if (existing === undefined) {
      topSetBySession.set(set.session_id, w);
    } else if (w != null && (existing == null || w > existing)) {
      topSetBySession.set(set.session_id, w);
    }
  }

  // Build chart data — one point per session that has sets for this exercise
  const sessionsWithData = sessions.filter((s) => topSetBySession.has(s.id));
  const allChartData = sessionsWithData.map((s) => {
    const dateStr = s.completed_at
      ? new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '—';
    return {
      label: dateStr,
      set1: topSetBySession.get(s.id) ?? null,
      completedAt: s.completed_at ?? '',
    };
  });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/trainee/exercises"
        className="inline-flex items-center gap-1 text-sm text-text-primary hover:text-accent transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{exerciseRow.name}</h1>
        {exerciseRow.muscle_group && (
          <span className="inline-block mt-1 text-xs text-text-primary border border-border rounded-sm px-1.5 py-0.5">
            {exerciseRow.muscle_group}
          </span>
        )}
      </div>

      {/* Cross-plan chart section (client component) */}
      <TraineeCrossPlanChart allChartData={allChartData} />
    </div>
  );
}
