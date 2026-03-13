---
phase: 03-plan-builder
plan: "04"
subsystem: schema-editor-ui
tags: [ui, dnd-kit, drag-and-drop, server-components, client-components, schema-editor]
dependency_graph:
  requires: [03-03-plans-ui, 03-01-data-layer]
  provides: [schema-editor-page, dnd-exercise-list, per-set-weights-ui, exercise-picker-modal]
  affects: [03-05-plan-assignment, 04-trainee-workout-logging]
tech_stack:
  added: ["@dnd-kit/core 6.3.1", "@dnd-kit/sortable 10.0.0", "@dnd-kit/utilities 3.2.2"]
  patterns: [dnd-sortable-list, optimistic-drag-reorder, on-blur-auto-save, server-component-data-fetching]
key_files:
  created:
    - src/app/(trainer)/trainer/_components/SchemaExerciseRow.tsx
    - src/app/(trainer)/trainer/_components/SchemaExerciseList.tsx
    - src/app/(trainer)/trainer/_components/ExercisePickerModal.tsx
    - src/app/(trainer)/trainer/_components/SchemaEditorAddButton.tsx
    - src/app/(trainer)/trainer/plans/[planId]/schemas/[schemaId]/page.tsx
  modified: []
decisions:
  - "[03-04]: Drag listeners attached only to the handle button (not the row div) — prevents input clicks from triggering drag; PointerSensor activationConstraint distance:8 for same reason"
  - "[03-04]: exercises PostgREST join normalised with Array.isArray guard — PostgREST can return object or array depending on FK cardinality; guard ensures both cases handled"
  - "[03-04]: Import path corrected to 4x ../ from schemas/[schemaId]/ — plan's draft had 5x which was one level too deep"
metrics:
  duration: "~3 min"
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_created: 5
  files_modified: 0
---

# Phase 3 Plan 04: Schema Editor Summary

**One-liner:** Full schema editor at `/trainer/plans/[planId]/schemas/[schemaId]` with @dnd-kit drag-and-drop reordering, on-blur auto-save for sets/reps/weight, per-set weight toggle, and an exercise picker modal that searches the exercise library.

## What Was Built

### Task 1: Install @dnd-kit packages (129d4d8)

`pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` — installed versions 6.3.1 / 10.0.0 / 3.2.2 and verified resolvable from Node.

### Task 2: Schema editor components and page (52ca9fb)

**`SchemaExerciseRow.tsx`** — Client Component. Each exercise row shows:
- Drag handle button (only element with DnD listeners) — prevents inputs from accidentally starting drag
- Exercise name + muscle group (truncated)
- Sets / Reps number inputs — saved to DB on `onBlur` via `updateSchemaExercise`
- Single weight input (kg) — shown only in single-weight mode
- "Per-set weights" / "Single weight" toggle — switches between single `target_weight_kg` and `per_set_weights` JSONB array
- Per-set weight inputs (one per set) expanded when in per-set mode
- Remove button (×) — calls `removeExerciseFromSchema` and notifies parent via `onRemoved` callback

**`SchemaExerciseList.tsx`** — Client Component. Wraps rows in `DndContext` + `SortableContext` (vertical list strategy). Uses `PointerSensor` with `activationConstraint: { distance: 8 }` and `TouchSensor` for mobile gym use. On drag end: `arrayMove` for optimistic state update → `reorderSchemaExercises` Server Action for persistence. Renders an empty-state card when no exercises exist.

**`ExercisePickerModal.tsx`** — Client Component. Bottom-sheet on mobile / centered dialog on sm+. Client-side search filter across name and muscle group. Selecting an exercise calls `addExerciseToSchema` with defaults (sets=3, reps=10) then `router.refresh()` to reload the server-rendered exercise list.

**`SchemaEditorAddButton.tsx`** — Client Component. Thin wrapper that shows the dashed "+ Add Exercise" button and conditionally renders `ExercisePickerModal` when open. Keeps the server-only page clean.

**`plans/[planId]/schemas/[schemaId]/page.tsx`** — Server Component. Three Supabase queries: (1) schema metadata, (2) schema exercises with joined exercise name/muscle via PostgREST, (3) all trainer exercises for the picker. Normalises PostgREST join result (Array.isArray guard). Renders breadcrumb → `SchemaExerciseList` → `SchemaEditorAddButton`.

## Decisions Made

| Decision | Rationale |
|---|---|
| DnD listeners on handle button only | Prevents input clicks from triggering drag; PointerSensor activationConstraint distance:8 adds second layer of protection |
| exercises join with Array.isArray guard | PostgREST returns object for many-to-one FK joins but may return array; guard makes the mapping robust |
| Import path 4x ../ not 5x | From `schemas/[schemaId]/` to `trainer/_components/` is 4 directories up: `[schemaId]/` → `schemas/` → `[planId]/` → `plans/` → `_components/` |

## Deviations from Plan

**1. [Rule 3 - Blocking] Import path corrected from 5x to 4x `../`**
- **Found during:** Task 2 TypeScript check
- **Issue:** Plan draft had `'../../../../../_components/...'` (5 levels) — incorrect, caused TS2307 module-not-found errors
- **Fix:** Changed all three imports to `'../../../../_components/...'` (4 levels)
- **Files modified:** `src/app/(trainer)/trainer/plans/[planId]/schemas/[schemaId]/page.tsx`
- **Commit:** 52ca9fb (part of Task 2 commit)

**2. [Rule 2 - Missing handling] PostgREST join normalised with Array.isArray guard**
- **Found during:** Task 2 implementation
- **Issue:** Plan draft used `row.exercises?.name` directly — PostgREST join on many-to-one can return either an object or array depending on schema; accessing `.name` on an array returns `undefined`
- **Fix:** Added `Array.isArray(row.exercises) ? row.exercises[0] : row.exercises` to reliably extract the joined exercise row
- **Files modified:** `src/app/(trainer)/trainer/plans/[planId]/schemas/[schemaId]/page.tsx`
- **Commit:** 52ca9fb

## Self-Check: PASSED

- [x] `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` in node_modules — verified via `node -e "require(...)"` → `ok`
- [x] `SchemaExerciseRow.tsx` exists with `useSortable`, listeners on handle button only
- [x] `SchemaExerciseList.tsx` exists with `DndContext`, `PointerSensor` activationConstraint distance:8, `TouchSensor`
- [x] `ExercisePickerModal.tsx` exists with client-side search + `addExerciseToSchema` call
- [x] `SchemaEditorAddButton.tsx` exists
- [x] `plans/[planId]/schemas/[schemaId]/page.tsx` exists with PostgREST join guard
- [x] `node_modules/.bin/tsc --noEmit` passes with zero errors
- [x] Task 1 commit: 129d4d8
- [x] Task 2 commit: 52ca9fb
