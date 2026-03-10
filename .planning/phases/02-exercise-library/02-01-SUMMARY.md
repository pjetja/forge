---
phase: 02-exercise-library
plan: "01"
subsystem: database
tags: [supabase, drizzle, rls, postgres, server-actions, nextjs]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase client setup, getClaims() auth pattern, Server Action conventions

provides:
  - exercises table DDL with RLS (FOR ALL USING + WITH CHECK) and performance indexes
  - MUSCLE_GROUPS const and MuscleGroup, Exercise, NewExercise Drizzle types
  - createExercise, updateExercise, deleteExercise Server Actions using createClient()

affects:
  - 02-02 (exercise list/search UI — reads exercises via supabase.from('exercises'))
  - 02-03 (exercise form/detail UI — calls these Server Actions)
  - 03-plan-builder (exercises are the leaf nodes of workout plans)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Exercises use createClient() with RLS for ownership enforcement — no adminClient needed"
    - "(SELECT auth.uid()) wrapper in RLS policies for 95% query performance improvement"
    - "muscle_group stored as TEXT + Zod enum validation — avoids DDL migrations for new values"
    - "Empty optional strings normalized to null before insert/update via || null"

key-files:
  created:
    - src/lib/db/migrations/0002_exercises.sql
    - src/app/(trainer)/trainer/exercises/actions.ts
  modified:
    - src/lib/db/schema.ts

key-decisions:
  - "createClient() (not adminClient) used for all exercise operations — RLS policy enforces trainer ownership, no service role bypass needed"
  - "muscle_group stored as TEXT not PostgreSQL ENUM — TEXT + MUSCLE_GROUPS const + Zod validation avoids DDL migrations when adding new muscle groups"
  - "RLS WITH CHECK required alongside USING for INSERT to work in all Postgres versions"
  - "updatedAt set via new Date().toISOString() in Server Action (not DB trigger) — simpler, consistent with existing patterns"

patterns-established:
  - "Exercise Server Actions: getClaims() optional chaining + createClient() + revalidatePath('/trainer/exercises')"
  - "RLS policy: FOR ALL USING + WITH CHECK using (SELECT auth.uid()) wrapper for performance"

requirements-completed: [EXLIB-01, EXLIB-02]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 2 Plan 01: Exercise Library Summary

**Exercises table with RLS-enforced trainer isolation, Drizzle schema types (MUSCLE_GROUPS, Exercise, NewExercise), and three Server Actions (createExercise, updateExercise, deleteExercise) using createClient() with no admin bypass needed**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-10T23:46:27Z
- **Completed:** 2026-03-10T23:51:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created 0002_exercises.sql with CREATE TABLE, RLS policy using FOR ALL USING + WITH CHECK, and two performance indexes (trainer_auth_uid, name)
- Extended schema.ts with MUSCLE_GROUPS const (13 groups), MuscleGroup type, exercises table definition, Exercise and NewExercise inferred types
- Created exercises/actions.ts with createExercise, updateExercise, deleteExercise — all using createClient(), getClaims() with optional chaining, and revalidatePath on success

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration SQL and Drizzle schema update** - `445b9b0` (feat)
2. **Task 2: Server Actions for exercise CRUD** - `e5776a5` (feat)

**Plan metadata:** (docs commit — see final_commit below)

## Files Created/Modified
- `src/lib/db/migrations/0002_exercises.sql` - exercises table DDL, RLS policy with WITH CHECK, trainer_auth_uid and name indexes
- `src/lib/db/schema.ts` - added MUSCLE_GROUPS const, MuscleGroup type, exercises pgTable, Exercise and NewExercise types
- `src/app/(trainer)/trainer/exercises/actions.ts` - createExercise, updateExercise, deleteExercise Server Actions

## Decisions Made
- `createClient()` (not `adminClient`) used for all exercise mutations — RLS policy provides full ownership enforcement; no service role bypass required unlike invite_links in Phase 1
- `muscle_group` stored as TEXT (not PostgreSQL ENUM) to avoid DDL migrations when adding new muscle group values; validation enforced at application layer via `MUSCLE_GROUPS` const
- `WITH CHECK` included alongside `USING` in the RLS policy — required for INSERT to work correctly across all Postgres versions; `FOR ALL USING` alone is insufficient for inserts
- `updated_at` set in Server Action via `new Date().toISOString()` rather than a DB trigger — consistent with existing Phase 1 patterns, simpler deployment

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

**External service configuration required before this feature can be tested.**

The exercises table does not yet exist in the Supabase database. Apply the migration before using any exercises functionality:

1. Open Supabase Dashboard -> SQL Editor
2. Paste the contents of `src/lib/db/migrations/0002_exercises.sql`
3. Click Run
4. Verify: table `exercises` appears in Table Editor with RLS enabled

## Next Phase Readiness
- Migration SQL ready to paste into Supabase SQL Editor
- Drizzle types (Exercise, NewExercise, MUSCLE_GROUPS) available to import in UI components
- Three Server Actions callable from Plan 02 (exercise list) and Plan 03 (exercise form) UI components
- No TypeScript errors — all three files compile cleanly

---
*Phase: 02-exercise-library*
*Completed: 2026-03-11*
