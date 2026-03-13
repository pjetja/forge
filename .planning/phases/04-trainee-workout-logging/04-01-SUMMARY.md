---
phase: 04-trainee-workout-logging
plan: "01"
subsystem: database
tags: [postgres, supabase, drizzle, rls, migrations]

# Dependency graph
requires:
  - phase: 03-plan-builder
    provides: assigned_schemas and assigned_schema_exercises tables that workout_sessions and session_sets reference via foreign keys

provides:
  - workout_sessions table with RLS (trainee write, trainer read)
  - session_sets table with UNIQUE upsert constraint and RLS (trainee write, trainer read)
  - Drizzle ORM types: WorkoutSession, NewWorkoutSession, SessionSet, NewSessionSet, SessionWithSets
  - SQL migration 0005_workout_sessions.sql ready to apply via Supabase SQL Editor

affects:
  - 04-02 (Server Actions depend on these tables)
  - 04-03 (UI pages use Drizzle types from schema.ts)
  - 05-trainer-progress-visibility (trainer RLS read policies)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "boolean import added to drizzle-orm/pg-core for muscle_failure column"
    - "FOR ALL RLS policy with both USING + WITH CHECK (established Phase 2 pattern, re-applied)"
    - "UNIQUE constraint on (session_id, assigned_schema_exercise_id, set_number) enables upsert idempotency"
    - "status enum includes 'abandoned' to support abandon-session flow"

key-files:
  created:
    - src/lib/db/migrations/0005_workout_sessions.sql
  modified:
    - src/lib/db/schema.ts

key-decisions:
  - "status CHECK constraint includes 'abandoned' — resolves open question from RESEARCH.md; needed for abandon session flow in later plans"
  - "workoutSessions status enum includes 'abandoned' in Drizzle schema to match SQL CHECK constraint"
  - "Trainer RLS policies (FOR SELECT) added now — Phase 5 prep; zero cost, avoids a future migration"
  - "boolean added to drizzle-orm/pg-core imports — required for muscle_failure column"

patterns-established:
  - "Session upsert pattern: UNIQUE (session_id, exercise_id, set_number) + Supabase .upsert({ onConflict }) = idempotent per-set saves"
  - "Trainer read-ahead RLS: define trainer SELECT policies in same migration as trainee write policies"

requirements-completed: [TRACK-01, TRACK-02, TRACK-03, TRACK-04, TRACK-05]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 4 Plan 01: Workout Sessions Database Migration Summary

**PostgreSQL migration and Drizzle types for workout_sessions + session_sets tables with trainee-write/trainer-read RLS and upsert-safe UNIQUE constraint**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-13T14:17:11Z
- **Completed:** 2026-03-13T14:19:05Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created 0005_workout_sessions.sql with both tables, 4 RLS policies (trainee FOR ALL + trainer FOR SELECT per table), and 4 indexes
- Added Drizzle ORM types for workoutSessions and sessionSets to schema.ts including composite SessionWithSets type
- TypeScript compilation passes with no errors (npx tsc --noEmit)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write 0005_workout_sessions.sql migration** - `5872622` (feat)
2. **Task 2: Add Drizzle types to schema.ts** - `242f7a3` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `src/lib/db/migrations/0005_workout_sessions.sql` — DDL for workout_sessions + session_sets + RLS policies + indexes
- `src/lib/db/schema.ts` — Drizzle ORM types for new tables, boolean import added

## Decisions Made
- **'abandoned' in status CHECK:** RESEARCH.md left this as an open question. The PLAN explicitly resolved it: include 'abandoned' in the CHECK constraint and Drizzle enum to support the abandon-session flow (avoids a future migration).
- **Trainer RLS at creation time:** Added trainer FOR SELECT policies in the same migration as the trainee policies — zero-cost Phase 5 prep that avoids needing a follow-up migration later.
- **boolean import:** Added to drizzle-orm/pg-core destructured import since muscle_failure column requires it; was not previously imported.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Apply migration via Supabase SQL Editor before Phase 4 UI can be tested end-to-end:
- Open Supabase project SQL Editor
- Paste full contents of `src/lib/db/migrations/0005_workout_sessions.sql`
- Click Run

## Next Phase Readiness
- workout_sessions and session_sets tables defined and ready for Plan 02 Server Actions
- Drizzle types exported and importable in Server Actions and page components
- All Phase 4 server-side writes (startWorkout, completeSet, finishWorkout) can now be implemented

---
*Phase: 04-trainee-workout-logging*
*Completed: 2026-03-13*
