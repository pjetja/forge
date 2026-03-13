---
phase: 04-trainee-workout-logging
plan: "02"
subsystem: api
tags: [supabase, server-actions, next-js, typescript, workout-logging, rls]

# Dependency graph
requires:
  - phase: 04-trainee-workout-logging
    provides: workout_sessions and session_sets tables with RLS, Drizzle types WorkoutSession/SessionSet

provides:
  - getCurrentWeekBounds() utility returning Mon–Sun ISO week boundaries in local time
  - getPreviousWeekBounds() utility returning prior week boundaries for history queries
  - startWorkout Server Action: creates session, blocks concurrent sessions, activates pending plan
  - completeSet Server Action: idempotent upsert on (sessionId, exerciseId, setNumber)
  - addSet Server Action: inserts placeholder row for extra sets beyond plan
  - finishWorkout Server Action: marks completed, returns setsCompleted/totalPlanSets summary
  - abandonWorkout Server Action: marks abandoned, preserves session_sets for analytics

affects:
  - 04-03 (workout logging UI calls startWorkout, completeSet, addSet)
  - 04-04 (weekly progress UI calls getCurrentWeekBounds, getPreviousWeekBounds)
  - 04-05 (session summary uses finishWorkout summary return value)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getClaims() auth pattern — consistent with all Phase 1–3 server actions"
    - "upsert with onConflict on named unique constraint for idempotent set saves"
    - "maybeSingle() for optional single-row checks (no error if no row found)"
    - "reduce() to sum sets column for totalPlanSets computation"

key-files:
  created:
    - src/lib/utils/week.ts
    - src/app/(trainee)/trainee/actions.ts
  modified: []

key-decisions:
  - "revalidatePath('/trainee') called in startWorkout, finishWorkout, abandonWorkout — completeSet intentionally skips it (optimistic UI handles display)"
  - "assigned_plans status activated inline in startWorkout rather than a separate action — reduces round trips and keeps session start atomic with plan activation"
  - "finishWorkout counts totalPlanSets via in-process reduce() — avoids Postgres SUM aggregate; acceptable at small plan sizes"
  - "week boundaries computed in local time (not UTC) — matches gym-day semantics; toISOString() handles UTC conversion for Supabase queries"

patterns-established:
  - "Trainee actions use createClient() (not adminClient) — RLS handles trainee-owns-session access control"
  - "All Server Actions guard with getClaims() returning early on unauthenticated"

requirements-completed: [TRACK-01, TRACK-03, TRACK-05]

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 4 Plan 02: Trainee Workout Server Actions Summary

**Week boundary utility + five Server Actions (startWorkout, completeSet, addSet, finishWorkout, abandonWorkout) using Supabase RLS and idempotent upsert pattern**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-13T14:20:56Z
- **Completed:** 2026-03-13T14:26:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `src/lib/utils/week.ts` with getCurrentWeekBounds() and getPreviousWeekBounds() for Mon–Sun ISO week boundaries in local time
- Created `src/app/(trainee)/trainee/actions.ts` with all 5 Server Actions following established getClaims/createClient/revalidatePath patterns
- TypeScript compiles clean with no errors across both files

## Task Commits

Each task was committed atomically:

1. **Task 1: Create week boundary utility** - `9ecb38b` (feat)
2. **Task 2: Create trainee Server Actions** - `588c6fd` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `src/lib/utils/week.ts` — getCurrentWeekBounds() and getPreviousWeekBounds() pure TypeScript utilities
- `src/app/(trainee)/trainee/actions.ts` — All 5 Server Actions for workout session lifecycle

## Decisions Made
- **revalidatePath selective**: completeSet intentionally omits revalidatePath — optimistic UI handles display; full revalidate happens on page navigation. startWorkout, finishWorkout, abandonWorkout all revalidate '/trainee'.
- **Plan activation inline**: assigned_plans status change (pending → active) happens inside startWorkout rather than a separate action — keeps first-session start atomic and reduces round trips.
- **Local time week boundaries**: getCurrentWeekBounds() uses local timezone (not UTC) to match gym-day semantics. Results passed as .toISOString() to Supabase which handles UTC conversion automatically.
- **finishWorkout summary**: totalPlanSets computed via in-process reduce() on assigned_schema_exercises rows rather than a Postgres SUM aggregate — simpler query, acceptable performance at plan scale.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. The SQL migration (0005_workout_sessions.sql) was already created in Plan 01 and must be applied before these actions can be tested end-to-end.

## Next Phase Readiness
- All 5 Server Actions ready for UI integration in Plans 03–05
- Week boundary utilities ready for weekly progress queries in Plan 04
- TypeScript types from schema.ts (WorkoutSession, SessionSet) work directly with these actions
- No new dependencies added; actions follow all established project patterns

---
*Phase: 04-trainee-workout-logging*
*Completed: 2026-03-13*

## Self-Check: PASSED

- FOUND: src/lib/utils/week.ts
- FOUND: src/app/(trainee)/trainee/actions.ts
- FOUND: .planning/phases/04-trainee-workout-logging/04-02-SUMMARY.md
- FOUND: commit 9ecb38b (feat: week boundary utility)
- FOUND: commit 588c6fd (feat: trainee Server Actions)
