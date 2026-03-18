---
phase: 05-trainer-progress-visibility
plan: 02
subsystem: ui
tags: [next.js, supabase, tailwind, recharts, trainee, exercises, progress]

# Dependency graph
requires:
  - phase: 05-01
    provides: TabSwitcher, DateRangeToggle, CrossPlanChartSection pattern, ExercisesTab pattern, ExerciseListFilterBar pattern
provides:
  - Trainee home page with Plans/Exercises tab switcher at /trainee
  - TraineeExercisesTab server component with personal best, last logged, search, muscle filter
  - TraineeExerciseFilterBar client component for search + muscle group filtering
  - Trainee cross-plan exercise progress page at /trainee/exercises/[exerciseId]
  - TraineeCrossPlanChart client component with DateRangeToggle, ProgressChart, summary cards
affects:
  - 05.1-ui-polish
  - 06-trainee-and-trainer-profile-pages

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Trainee cross-plan exercise aggregation — completed sessions -> session_sets -> admin client exercise names
    - Trainee exercises tab uses trainee's own session client for workout_sessions/session_sets (RLS allows self-read), admin client for exercises table (trainer-owned RLS)
    - Tab-conditional server rendering — activeTab resolved from searchParams, plans tab data always fetched (needed for in-progress banner check), exercises tab renders TraineeExercisesTab component

key-files:
  created:
    - src/app/(trainee)/trainee/_components/TraineeExercisesTab.tsx
    - src/app/(trainee)/trainee/_components/TraineeExerciseFilterBar.tsx
    - src/app/(trainee)/trainee/exercises/[exerciseId]/page.tsx
    - src/app/(trainee)/trainee/exercises/[exerciseId]/_components/TraineeCrossPlanChart.tsx
  modified:
    - src/app/(trainee)/trainee/page.tsx

key-decisions:
  - "Plans tab data (assignedPlans, weekSessions, activeSession) always fetched regardless of active tab — needed for in-progress banner which only shows on Plans tab"
  - "TraineeExerciseFilterBar created as copy of ExerciseListFilterBar rather than reusing trainer-side component — avoids cross-route-group imports between (trainer) and (trainee) route groups"
  - "TraineeCrossPlanChart created as copy of CrossPlanChartSection — CrossPlanChartSection lives in trainer route group, so a separate trainee-side copy avoids coupling"

patterns-established:
  - "Trainee exercises use claims.sub as traineeAuthUid — no route param; trainee is always viewing their own data"
  - "Cross-plan exercise page uses base exercise_id from exercises table, not assigned_schema_exercise_id"

requirements-completed: [PROG-02]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 05 Plan 02: Trainee-Side Exercise Tab and Cross-Plan Progress Page Summary

**Trainee home page gains Plans/Exercises tab switcher; new cross-plan exercise progress page at /trainee/exercises/[exerciseId] shows top-set weight over time with date range toggle and summary cards**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T12:11:43Z
- **Completed:** 2026-03-18T12:14:46Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Trainee home page at /trainee now has Plans and Exercises tabs via TabSwitcher component
- Exercises tab shows all exercises the trainee has ever logged (sorted by most recently logged) with personal best weight, last logged date, search bar, and muscle group filter chips
- New /trainee/exercises/[exerciseId] page shows cross-plan top-set weight chart with All time / Last 3 months / Last month date range toggle and Start/Finish/Change summary cards
- All existing Plans tab content (in-progress banner, active plans, pending plans, past plans) remains unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Exercise tab to trainee home page with exercise list and filter bar** - `6bafb27` (feat)
2. **Task 2: Create trainee cross-plan exercise progress page** - `0686d0c` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/app/(trainee)/trainee/page.tsx` - Added searchParams prop, TabSwitcher, tab-conditional rendering for Plans and Exercises tabs
- `src/app/(trainee)/trainee/_components/TraineeExercisesTab.tsx` - Server component that aggregates exercise history for logged-in trainee with personal best and last logged date
- `src/app/(trainee)/trainee/_components/TraineeExerciseFilterBar.tsx` - Client component for search + muscle group filter chips (mirrors trainer-side ExerciseListFilterBar)
- `src/app/(trainee)/trainee/exercises/[exerciseId]/page.tsx` - Cross-plan exercise progress page scoped to claims.sub; fetches top-set weight per completed session
- `src/app/(trainee)/trainee/exercises/[exerciseId]/_components/TraineeCrossPlanChart.tsx` - Client component with DateRangeToggle, ProgressChart (setCount=1), summary cards

## Decisions Made
- Plans tab data always fetched regardless of active tab because the in-progress banner check (activeSession) is required on the Plans tab only — acceptable since plans data is lightweight
- Separate TraineeExerciseFilterBar copy (not reusing trainer-side) to avoid importing across Next.js route groups `(trainer)` and `(trainee)`
- Separate TraineeCrossPlanChart copy (not reusing CrossPlanChartSection from trainer route) for the same reason

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 05 Wave 2 complete — both trainer-side (Plan 01) and trainee-side (Plan 02) exercise progress views are built
- Phase 05.1 UI Polish can begin reviewing both trainer and trainee exercise tabs
- All routes verified with `npm run build` — no TypeScript errors

## Self-Check: PASSED

All files confirmed present, all commits verified in git history.

---
*Phase: 05-trainer-progress-visibility*
*Completed: 2026-03-18*
