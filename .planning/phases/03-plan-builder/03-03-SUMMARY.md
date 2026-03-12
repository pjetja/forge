---
phase: 03-plan-builder
plan: "03"
subsystem: plan-builder-ui
tags: [ui, next-js, server-components, client-components, plans, workout-schemas]
dependency_graph:
  requires: [03-01-data-layer]
  provides: [plans-list-ui, plan-creation-form, plan-template-editor, week-view, schema-slot-management]
  affects: [03-04-schema-editor, 03-05-plan-assignment]
tech_stack:
  added: []
  patterns: [server-component-data-fetching, client-component-interactivity, server-actions-with-router-refresh]
key_files:
  created:
    - src/app/(trainer)/trainer/_components/PlanCard.tsx
    - src/app/(trainer)/trainer/_components/PlanWeekView.tsx
    - src/app/(trainer)/trainer/_components/AddSchemaButton.tsx
    - src/app/(trainer)/trainer/plans/page.tsx
    - src/app/(trainer)/trainer/plans/new/page.tsx
    - src/app/(trainer)/trainer/plans/[planId]/page.tsx
  modified: []
decisions:
  - "[03-03]: PlanWeekView week tabs are display-only — all tabs show the same schema template; week count is metadata only, no per-week DB copies"
  - "[03-03]: AddSchemaButton is a standalone client component (not inline) to keep the server-only plan editor page clean"
  - "[03-03]: Plan editor imports AddSchemaButton at top of file (not as inline comment per plan draft) — standard ES module import pattern"
metrics:
  duration: "~2 min"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_created: 6
  files_modified: 0
---

# Phase 3 Plan 03: Plan Builder UI Summary

**One-liner:** Plans list, creation form, and template editor — trainers can create multi-week plans, name workout schemas per slot, and navigate week tabs showing the shared schema template.

## What Was Built

### Task 1: Plans List Page and PlanCard Component (f6db2a5)

`src/app/(trainer)/trainer/_components/PlanCard.tsx` — Link card displaying plan name, week count, workouts/week, and assigned trainee count (hidden when zero). Follows project card pattern: `bg-bg-surface border border-border rounded-sm` with `hover:border-accent`.

`src/app/(trainer)/trainer/plans/page.tsx` — Server Component. Two Supabase queries: (1) all trainer plans ordered by creation date descending, (2) count of active/pending `assigned_plans` rows per source plan to show trainee counts. Shows empty state with CTA when no plans exist.

### Task 2: Plan Creation Form, Week View, Schema Add Button, and Plan Editor (42d1cd5)

`src/app/(trainer)/trainer/plans/new/page.tsx` — Client Component with form state + `useTransition`. Fields: plan name (text), number of weeks (number, default 8, max 52), workouts per week (number, default 4, max 7). Calls `createPlan` Server Action; on success navigates to `/trainer/plans/[planId]`.

`src/app/(trainer)/trainer/_components/PlanWeekView.tsx` — Client Component. Renders week tab buttons (1..weekCount) — switching tabs is purely local state; all tabs show the same schemas array. Workout slot cards show schema name (or "Unassigned" dimmed) with "Edit exercises" link to `/trainer/plans/[planId]/schemas/[schemaId]` for assigned schemas.

`src/app/(trainer)/trainer/_components/AddSchemaButton.tsx` — Client Component. Shows a dashed placeholder button that expands inline to a name input + Save/Cancel. Calls `createSchema` Server Action and triggers `router.refresh()` to update the server-rendered slot cards.

`src/app/(trainer)/trainer/plans/[planId]/page.tsx` — Server Component. Fetches plan metadata + all schemas for the plan. Renders PlanWeekView + one AddSchemaButton per unassigned slot. Header includes "Assign to trainee" link to future assignment flow at `/trainer/plans/[planId]/assign`.

## Decisions Made

| Decision | Rationale |
|---|---|
| Week tabs are UI-only (same schemas shown on all tabs) | Matches DB design from 03-01: single schema template, no per-week copies; week_count is display metadata only |
| AddSchemaButton as separate component file | Keeps PlanEditorPage (server component) free of any client-side code; import at top of file per ES module convention |
| router.refresh() after schema creation | Re-fetches server-side data (PlanEditorPage revalidation already called in createSchema action); cleanest pattern for server+client coordination |

## Deviations from Plan

**1. [Rule 3 - Blocking] AddSchemaButton import moved to top of file**
- **Found during:** Task 2
- **Issue:** Plan draft showed `import { AddSchemaButton }` as an inline comment at the bottom of the file inside the JSX return — this would cause a syntax error in TypeScript
- **Fix:** Import placed at the top of the file as a standard ES module import
- **Files modified:** `src/app/(trainer)/trainer/plans/[planId]/page.tsx`
- **Commit:** 42d1cd5 (part of Task 2 commit)

## Self-Check: PASSED

- [x] `src/app/(trainer)/trainer/_components/PlanCard.tsx` exists
- [x] `src/app/(trainer)/trainer/_components/PlanWeekView.tsx` exists
- [x] `src/app/(trainer)/trainer/_components/AddSchemaButton.tsx` exists
- [x] `src/app/(trainer)/trainer/plans/page.tsx` exists
- [x] `src/app/(trainer)/trainer/plans/new/page.tsx` exists
- [x] `src/app/(trainer)/trainer/plans/[planId]/page.tsx` exists
- [x] `node_modules/.bin/tsc --noEmit` passes with zero errors
- [x] Task 1 commit: f6db2a5
- [x] Task 2 commit: 42d1cd5
