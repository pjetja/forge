---
phase: 02-exercise-library
plan: "02"
subsystem: ui

tags: [react, nextjs, tailwind, react-hook-form, zod, server-actions]

# Dependency graph
requires:
  - phase: 02-exercise-library/02-01
    provides: Exercise type, MUSCLE_GROUPS const, createExercise/updateExercise/deleteExercise Server Actions
provides:
  - ExerciseCard — presentational card showing name, muscle group, optional video icon
  - ExerciseGrid — card grid with Add exercise button and modal state management
  - ExerciseDetailModal — view/edit/delete modal with YouTube embed and two-step delete confirmation
  - ExerciseFormModal — create and edit form modal with React Hook Form + Zod v4 validation
affects:
  - 02-03 (exercises page will compose ExerciseGrid with server-fetched exercises array)
  - 02.1-ui-polish (visual polish review)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Hand-rolled modal pattern (fixed inset-0 bg-black/40) consistent with InviteDialog
    - useTransition wrapping async Server Action calls for all mutations
    - router.refresh() called after successful mutation to revalidate RSC data
    - extractYouTubeId utility for parsing YouTube URLs (module-level, not exported)
    - Zod v4 .enum() with error string property (not errorMap)
    - Inline two-step delete confirmation with deleteConfirming boolean state

key-files:
  created:
    - src/app/(trainer)/trainer/_components/ExerciseCard.tsx
    - src/app/(trainer)/trainer/_components/ExerciseGrid.tsx
    - src/app/(trainer)/trainer/_components/ExerciseDetailModal.tsx
    - src/app/(trainer)/trainer/_components/ExerciseFormModal.tsx
  modified: []

key-decisions:
  - "ExerciseGrid manages editExercise state separately from selectedExercise to cleanly coordinate detail->edit transition (close detail, open form)"
  - "extractYouTubeId defined as module-level utility in both ExerciseDetailModal and ExerciseFormModal — not shared to avoid coupling, not exported per plan"
  - "Zod v4 z.enum() used with { error: 'message' } property matching established Zod v4 pattern from Phase 1"
  - "ExerciseCard name truncated with pr-6 padding-right to avoid overlap with video icon in top-right corner"

patterns-established:
  - "Modal pattern: fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 with bg-bg-surface border border-border rounded-sm w-full max-w-lg p-6 inner panel"
  - "Two-step delete: deleteConfirming boolean state, first click shows Confirm/Cancel, confirm calls Server Action via useTransition"
  - "Form submit pattern: startTransition(async () => { result = await serverAction(); if error: setError; else: router.refresh(); onClose(); })"

requirements-completed: [EXLIB-01, EXLIB-02]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 2 Plan 02: Exercise UI Components Summary

**Four React Client Components delivering exercise CRUD UI: card grid with Add button, detail/edit/delete modal with YouTube embed, and create/edit form modal using React Hook Form + Zod v4**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T23:50:57Z
- **Completed:** 2026-03-10T23:52:33Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- ExerciseCard and ExerciseGrid deliver a responsive card grid with Add exercise button, full modal orchestration state, and conditional video camera icon on cards
- ExerciseDetailModal renders all exercise fields, YouTube iframe embed via youtube-nocookie.com, non-YouTube fallback link, and inline two-step delete confirmation without window.confirm
- ExerciseFormModal provides create/edit form with React Hook Form + Zod v4 validation, 13-option muscle group select, YouTube URL validation, and proper Server Action error handling

## Task Commits

Each task was committed atomically:

1. **Task 1: ExerciseCard and ExerciseGrid components** - `8f2ae4f` (feat)
2. **Task 2: ExerciseDetailModal — view, edit, and delete** - `0f830cc` (feat)
3. **Task 3: ExerciseFormModal — create and edit form** - `3a873e0` (feat)

## Files Created/Modified
- `src/app/(trainer)/trainer/_components/ExerciseCard.tsx` - Presentational card with name, muscle group, conditional video icon; entire card is clickable
- `src/app/(trainer)/trainer/_components/ExerciseGrid.tsx` - Responsive grid with Add exercise button, selectedExercise and editExercise state, conditionally renders detail and form modals
- `src/app/(trainer)/trainer/_components/ExerciseDetailModal.tsx` - Full detail view with YouTube embed (youtube-nocookie.com), two-step delete confirmation, edit button
- `src/app/(trainer)/trainer/_components/ExerciseFormModal.tsx` - Create/edit form modal with React Hook Form + Zod v4, all five fields, YouTube URL validation

## Decisions Made
- ExerciseGrid manages `editExercise` state separately from `selectedExercise` to cleanly coordinate the detail-to-edit transition (close detail modal, open form modal) without flicker
- `extractYouTubeId` defined as module-level utility in both files that need it — not extracted to a shared util to avoid coupling, consistent with plan specification
- Zod v4 `z.enum(MUSCLE_GROUPS, { error: 'Select a muscle group' })` used to match the established Zod v4 pattern from Phase 1 (not errorMap)
- ExerciseCard name uses `pr-6` padding-right to prevent text truncation from overlapping the video icon in the top-right corner

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All four components are ready to be composed into the exercises page in Plan 03
- ExerciseGrid accepts `exercises: Exercise[]` prop — the page server component will fetch and pass this
- TypeScript compiles cleanly across all new components
- Pending: exercises migration (0002_exercises.sql) must be applied before UI can be tested end-to-end

---
*Phase: 02-exercise-library*
*Completed: 2026-03-10*

## Self-Check: PASSED

- FOUND: src/app/(trainer)/trainer/_components/ExerciseCard.tsx
- FOUND: src/app/(trainer)/trainer/_components/ExerciseGrid.tsx
- FOUND: src/app/(trainer)/trainer/_components/ExerciseDetailModal.tsx
- FOUND: src/app/(trainer)/trainer/_components/ExerciseFormModal.tsx
- FOUND: .planning/phases/02-exercise-library/02-02-SUMMARY.md
- FOUND commit: 8f2ae4f (Task 1 — ExerciseCard + ExerciseGrid)
- FOUND commit: 0f830cc (Task 2 — ExerciseDetailModal)
- FOUND commit: 3a873e0 (Task 3 — ExerciseFormModal)
