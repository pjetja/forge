import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

interface WeekSession {
  id: string;
  schemaName: string;
}

interface PastWeek {
  weekNumber: number;
  sessions: WeekSession[];
}

export interface ExerciseItem {
  id: string;
  name: string;
  muscle_group: string;
}

export interface ExerciseGroup {
  schemaId: string;
  schemaName: string;
  exercises: ExerciseItem[];
}

interface CompletedPlanColumnsProps {
  pastWeeks: PastWeek[];
  exercisesBySchema: ExerciseGroup[];
  /** If provided, past week session rows become clickable links */
  getWorkoutHref?: (sessionId: string) => string;
  getExerciseHref: (exerciseId: string) => string;
}

const ChevronRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 text-text-primary opacity-40 flex-shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export async function CompletedPlanColumns({
  pastWeeks,
  exercisesBySchema,
  getWorkoutHref,
  getExerciseHref,
}: CompletedPlanColumnsProps) {
  const t = await getTranslations('common');
  const totalExercises = exercisesBySchema.reduce((sum, g) => sum + g.exercises.length, 0);

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
      {/* ── Left: Workouts ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
          {t('completedPlan.workoutsHeading')}
        </h2>

        {pastWeeks.length === 0 ? (
          <p className="text-sm text-text-primary opacity-40">{t('completedPlan.noCompletedWeeks')}</p>
        ) : (
          <div className="space-y-4">
            {pastWeeks.map((week) => (
              <div key={week.weekNumber} className="space-y-1.5">
                <p className="text-xs font-medium text-text-primary opacity-50 uppercase tracking-wide">
                  {t('completedPlan.week', { number: week.weekNumber })}
                </p>
                <div className="space-y-1.5">
                  {week.sessions.map((s) =>
                    getWorkoutHref ? (
                      <Link
                        key={s.id}
                        href={getWorkoutHref(s.id)}
                        className="bg-bg-surface border border-border rounded-sm px-4 py-3 flex items-center justify-between hover:border-accent/50 transition-colors opacity-70 hover:opacity-100"
                      >
                        <p className="text-sm font-medium text-text-primary">{s.schemaName}</p>
                        <ChevronRight />
                      </Link>
                    ) : (
                      <div
                        key={s.id}
                        className="bg-bg-surface border border-border rounded-sm px-4 py-3"
                      >
                        <p className="text-sm font-medium text-text-primary opacity-70">{s.schemaName}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Exercises grouped by workout ─────────────────────── */}
      <div className="space-y-5">
        <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
          {t('completedPlan.exercisesHeading')}
        </h2>

        {totalExercises === 0 ? (
          <div className="bg-bg-surface border border-border rounded-sm p-8 text-center">
            <p className="text-sm text-text-primary opacity-50">{t('completedPlan.noExercises')}</p>
          </div>
        ) : (
          <>
            {exercisesBySchema.map((group) => (
              <div key={group.schemaId} className="space-y-1.5">
                <p className="text-xs font-medium text-text-primary opacity-50 uppercase tracking-wide">
                  {group.schemaName}
                </p>
                <div className="space-y-1.5">
                  {group.exercises.map((ex) => (
                    <Link
                      key={ex.id}
                      href={getExerciseHref(ex.id)}
                      className="bg-bg-surface border border-border rounded-sm px-4 py-3 flex items-center justify-between hover:border-accent/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                        {ex.muscle_group && (
                          <p className="text-xs text-text-primary opacity-50 mt-0.5">{ex.muscle_group}</p>
                        )}
                      </div>
                      <ChevronRight />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-text-primary opacity-40">
              {t('completedPlan.tapExercise')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
