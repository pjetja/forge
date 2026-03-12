---
phase: 03-plan-builder
plan: "01"
subsystem: database-and-server-actions
tags: [database, drizzle, server-actions, rls, rpc, plan-builder]
dependency_graph:
  requires: [02-exercise-library]
  provides: [plan-crud, schema-crud, exercise-assignment, assigned-plan-management]
  affects: [03-02-plan-builder-ui, 04-trainee-workout-logging]
tech_stack:
  added: [integer, numeric, jsonb (drizzle-orm/pg-core)]
  patterns: [server-actions-with-rpc, rls-cascade-policies, snapshot-assignment-pattern]
key_files:
  created:
    - src/lib/db/migrations/0003_plans.sql
    - src/app/(trainer)/trainer/plans/actions.ts
    - src/app/(trainer)/trainer/trainees/actions.ts
  modified:
    - src/lib/db/schema.ts
decisions:
  - "[03-01]: snapshot-at-assignment used for assigned plans — assigned_plans/schemas/exercises are full copies; trainer edits live in assigned_schema_exercises directly, plan_updated_at bumped to signal trainee"
  - "[03-01]: per_set_weights stored as JSONB (number array) — supports per-set weight variation (e.g., [80, 82.5, 85]); NULL means single-weight mode"
  - "[03-01]: assign_plan and duplicate_plan are SECURITY DEFINER RPC functions — atomic multi-table inserts cannot be done safely client-side through RLS"
  - "[03-01]: reorderSchemaExercises uses Promise.all for bulk sort_order update — no revalidatePath since this is called optimistically from the client"
  - "[03-01]: void existingActivePlan used in assignPlan — variable fetched for UX warning context but not used server-side; void silences TypeScript unused-variable warning"
metrics:
  duration: "25 min (across two sessions)"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 3 Plan 01: Database Schema and Server Actions Summary

**One-liner:** Complete Phase 3 data layer — 6 SQL tables with RLS/RPC functions, Drizzle types, and 14 Server Actions for plan template management and trainee assignment.

## What Was Built

### Task 1: Database Migration (b319f04)

`src/lib/db/migrations/0003_plans.sql` — paste into Supabase SQL Editor to apply.

**6 tables:**
- `plans` — trainer's reusable plan templates (name, week_count, workouts_per_week)
- `workout_schemas` — named workouts within a plan (e.g., "Push Day"), ordered by slot_index
- `schema_exercises` — exercises within a schema with sets/reps/weight, supports per-set weights via JSONB
- `assigned_plans` — snapshot copy of a plan assigned to a specific trainee; status: pending/active/completed/terminated
- `assigned_schemas` — schema copies for an assigned plan
- `assigned_schema_exercises` — exercise copies with trainer-editable weight fields

**RLS policies:** Trainers own their template rows. Trainees can SELECT their own assigned rows. Cascade deletes preserve referential integrity.

**2 RPC functions (SECURITY DEFINER):**
- `duplicate_plan(source_plan_id, new_trainer_auth_uid, new_name)` — atomically clones a plan template with all schemas and exercises
- `assign_plan(p_plan_id, p_trainer_auth_uid, p_trainee_auth_uid, p_weight_overrides)` — atomically clones a template into assigned tables, applies per-exercise weight overrides from a JSONB array

### Task 2: Types and Server Actions (96c1414)

**schema.ts additions:**
- 6 Drizzle table definitions with proper FK references and `onDelete` behavior
- 7 inferred TypeScript types: `Plan`, `NewPlan`, `WorkoutSchema`, `SchemaExercise`, `AssignedPlan`, `AssignedSchema`, `AssignedSchemaExercise`
- 3 composite UI types: `SchemaWithExercises`, `PlanWithSchemas`, `AssignedPlanWithSchemas`

**plans/actions.ts (11 Server Actions):**
- Plan CRUD: `createPlan`, `updatePlan`, `deletePlan`
- Duplicate: `duplicatePlan` (calls `duplicate_plan` RPC)
- Schema CRUD: `createSchema`, `updateSchema`, `deleteSchema`
- Exercise management: `addExerciseToSchema`, `updateSchemaExercise`, `removeExerciseFromSchema`, `reorderSchemaExercises`

**trainees/actions.ts (3 Server Actions):**
- `assignPlan` — calls `assign_plan` RPC with weight overrides; returns `assignedPlanId`
- `editAssignedPlan` — updates individual `assigned_schema_exercises` rows, bumps `plan_updated_at`
- `terminateAssignedPlan` — sets status to 'terminated'

All Server Actions follow the established pattern: `getClaims()`, null-check, operate via RLS client, `revalidatePath`.

## Decisions Made

| Decision | Rationale |
|---|---|
| Snapshot-at-assignment (not versioned) | Simpler Phase 4 reads; trainer edits live directly in assigned_schema_exercises; plan_updated_at signals changes to trainee |
| per_set_weights as JSONB | Flexible array (e.g., [80, 82.5, 85]); NULL = single-weight mode; avoids a separate per_set_weights table |
| SECURITY DEFINER RPCs for assign/duplicate | Multi-table atomic inserts cannot be safely done through client-side RLS; DEFINER bypasses RLS for the function body only |
| Promise.all for reorderSchemaExercises | N parallel updates faster than sequential; no revalidatePath since client-side optimistic only |

## Deviations from Plan

None — plan executed exactly as written. The only addition was `void existingActivePlan` to silence a TypeScript unused-variable warning (Rule 1 auto-fix inline).

## Pending Todo

- Apply migration via Supabase SQL Editor: paste `src/lib/db/migrations/0003_plans.sql` contents into SQL Editor and click Run. Required before any Phase 3 UI (03-02) can be tested end-to-end.

## Self-Check: PASSED

- [x] `src/lib/db/migrations/0003_plans.sql` exists — 8 CREATE TABLE/FUNCTION statements confirmed
- [x] `src/lib/db/schema.ts` exports Plan, WorkoutSchema, SchemaExercise, AssignedPlan, AssignedSchema, AssignedSchemaExercise
- [x] `src/app/(trainer)/trainer/plans/actions.ts` exists with 11 exported async functions
- [x] `src/app/(trainer)/trainer/trainees/actions.ts` exists with 3 exported async functions
- [x] `npx tsc --noEmit` passes with zero errors
- [x] Task 1 commit: b319f04
- [x] Task 2 commit: 96c1414
