---
phase: 04-trainee-workout-logging
plan: "04"
subsystem: ui

# Dependency graph
requires:
  - phase: 04-trainee-workout-logging
    provides: finishWorkout Server Action, workout_sessions + session_sets DB schema, StartWorkoutButton navigating to session URL

provides:
  - /trainee/plans/[assignedPlanId]/workouts/[sessionId] page: exercise list with per-exercise set completion status
  - FinishWorkoutButton: inline confirmation panel with incomplete-set warning and redirect on finish

affects:
  - 04-05 (exercise detail page linked from each exercise row in session page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component data fetching with PostgREST join Array.isArray guard for nested assigned_schema_exercises and exercises join"
    - "Client component state machine (idle -> confirming -> submitting -> done) for multi-step confirmation flow without modal"
    - "useTransition wrapping Server Action call in client component"

key-files:
  created:
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/page.tsx
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/_components/FinishWorkoutButton.tsx
  modified: []

key-decisions:
  - "Inline confirmation panel (not modal) for FinishWorkoutButton — simpler and gym-friendly; state machine manages idle/confirming/submitting/done"
  - "Array.isArray guard on both assigned_schema_exercises and nested exercises join — PostgREST can return array or single object"
  - "loggedSetCount computed as total session_sets rows for session (not per-exercise); totalPlanSets is sum of exercise.sets — these are passed to FinishWorkoutButton to avoid re-fetching"
  - "slot_index + 1 used for Workout N label — matches schema sort order visible to trainer"

patterns-established:
  - "Per-exercise set progress: setsLoggedByExercise Map keyed by assignedSchemaExerciseId"
  - "Status-coloured exercise rows: green (complete), yellow (partial), neutral (not started)"

requirements-completed:
  - TRACK-02
  - TRACK-05

# Metrics
duration: ~2min
completed: 2026-03-13
---

# Phase 4 Plan 04: Workout Session View Summary

**Workout session page with exercise list and colour-coded set completion status, plus FinishWorkoutButton inline confirmation panel with incomplete-set warning and finishWorkout Server Action integration**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-13T14:29:47Z
- **Completed:** 2026-03-13T14:31:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created workout session page (Server Component) showing all exercises sorted by sort_order with per-exercise set completion status (setsLogged/setsRequired)
- Colour-coded exercise rows: green checkmark when complete, yellow info icon when partial, neutral when not started — each row is a tappable Link to the exercise detail page
- Shows "Workout completed" banner when session.status is 'completed' so history browsing is supported
- Created FinishWorkoutButton with four-state machine (idle → confirming → submitting → done): shows set count, amber warning if not all sets logged, green confirmation if all complete
- On confirm, calls finishWorkout Server Action via useTransition and router.push('/trainee') on success

## Task Commits

1. **Task 1: Create workout session page (exercise list)** — `2560e5d`
2. **Task 2: Create FinishWorkoutButton with summary screen** — `94a16a4`

## Files Created/Modified

- `src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/page.tsx` — session page with exercise list, set completion status, and Finish Workout footer
- `src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/_components/FinishWorkoutButton.tsx` — client component with inline confirmation panel

## Decisions Made

- **Inline confirmation panel**: Used an inline panel below the button instead of a modal — simpler DOM, no z-index issues, easier to use with one thumb in the gym.
- **PostgREST Array.isArray guard**: Applied on both the top-level `assigned_schema_exercises` join and the nested `exercises` join — consistent with Phase 03-04 pattern.
- **Set count propagation**: `totalPlanSets` and `loggedSetCount` computed in the server component and passed as props to avoid an extra client-side fetch in FinishWorkoutButton.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Session page is complete; exercise rows link to `/trainee/plans/[assignedPlanId]/workouts/[sessionId]/exercises/[exerciseId]` — Plan 05 builds that page.
- FinishWorkoutButton calls the finishWorkout Server Action already built in Plan 01.

---
*Phase: 04-trainee-workout-logging*
*Completed: 2026-03-13*

## Self-Check: PASSED

- FOUND: src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/page.tsx
- FOUND: src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/_components/FinishWorkoutButton.tsx
- FOUND: commit 2560e5d (feat(04-04): create workout session page with exercise list)
- FOUND: commit 94a16a4 (feat(04-04): create FinishWorkoutButton with confirmation panel)
