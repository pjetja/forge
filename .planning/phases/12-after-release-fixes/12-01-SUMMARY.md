# Plan 12-01 Summary: Progression mode parameters

**Phase:** 12-after-release-fixes  
**Plan:** 01  
**Status:** Complete  
**Commit:** 02e4fb2

## What was built

Added configurable parameters to progression modes so trainers can specify RPE/RIR targets and weekly weight increments — and trainees see them during workout sessions.

## Tasks completed

| Task | Description                                  | Status |
| ---- | -------------------------------------------- | ------ |
| 1    | DB migration + Drizzle schema fix            | ✓      |
| 2    | SchemaExerciseRow conditional inputs         | ✓      |
| 3    | Trainee exercise session progression display | ✓      |

## Key files

### Created

- `src/lib/db/migrations/0012_progression_targets.sql` — Adds rpe_target, rir_target, weight_increment_per_week to both schema_exercises and assigned_schema_exercises; updates assign_plan() RPC

### Modified

- `src/lib/db/schema.ts` — Added tempo, progressionMode, rpeTarget, rirTarget, weightIncrementPerWeek to schemaExercises and assignedSchemaExercises type definitions
- `src/app/(trainer)/trainer/_components/SchemaExerciseRow.tsx` — Conditional parameter inputs (Target RPE / Target RIR / +kg/week) based on selected progression mode
- `src/app/(trainer)/trainer/plans/actions.ts` — Added rpeTarget/rirTarget/weightIncrementPerWeek to SchemaExerciseData and updateSchemaExercise handler
- `src/app/(trainer)/trainer/plans/[planId]/schemas/[schemaId]/page.tsx` — Fetch and map new fields to SchemaExerciseItem
- `src/app/(trainee)/trainee/plans/[assignedPlanId]/exercises/[exerciseId]/page.tsx` — Fetch + display progression mode info line
- `messages/en/trainer.json`, `messages/pl/trainer.json` — targetRpe, targetRir, kgPerWeek labels
- `messages/en/trainee.json`, `messages/pl/trainee.json` — progressionLinear/Double/Rpe/Rir display strings

## Deviations

- The trainee progress page uses snake_case `progression_mode` (from raw Supabase PostgREST response) rather than camelCase `progressionMode` — this is correct as DB fields come back in snake_case from Supabase client queries [Rule 1 - Bug avoidance]

## Self-Check: PASSED

- ✓ Migration file exists at `src/lib/db/migrations/0012_progression_targets.sql`
- ✓ `rpe_target` in schema.ts (both table defs)
- ✓ `weightIncrementPerWeek` in schema.ts (both table defs)
- ✓ `progressionMode` in schema.ts (both table defs)
- ✓ `rpeTarget` in SchemaExerciseRow.tsx (state + input)
- ✓ `progression_mode` conditional rendering in SchemaExerciseRow.tsx
- ✓ `rpe_target` fetched in trainee exercise page
- ✓ Commit 02e4fb2 present
