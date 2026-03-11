---
phase: 02-exercise-library
plan: "03"
subsystem: ui
tags: [nextjs, react, supabase, server-components, client-components, url-params, filtering]

# Dependency graph
requires:
  - phase: 02-exercise-library/02-01
    provides: exercises table schema, MUSCLE_GROUPS const, Exercise type, Server Actions (create/update/delete)
  - phase: 02-exercise-library/02-02
    provides: ExerciseCard, ExerciseGrid, ExerciseDetailModal, ExerciseFormModal components

provides:
  - ExercisesPage: Server Component page at /trainer/exercises with URL-param-driven filtering
  - ExerciseFilterBar: Client Component with search input (submit-only) + muscle group chip multi-select
  - Trainer nav header with Exercises link
  - Complete Exercise Library feature (search, filter, CRUD modals, empty states)

affects:
  - 02.1-ui-polish
  - 03-plan-builder

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component reads searchParams (awaited Promise) and passes filtered data to Client Components
    - Snake_case DB columns mapped to camelCase Exercise type via manual mapping in page
    - URL-driven filter state: useSearchParams + useRouter().replace() for chip/search navigation
    - Search submit-only pattern (Enter/button press) - not live/keypress filtering

key-files:
  created:
    - src/app/(trainer)/trainer/exercises/page.tsx
    - src/app/(trainer)/trainer/_components/ExerciseFilterBar.tsx
  modified:
    - src/app/(trainer)/layout.tsx

key-decisions:
  - "ExerciseGrid rendered in both empty-library and exercises-found states — empty state adds illustration+message ABOVE grid so 'Add exercise' button is always accessible"
  - "ExerciseFilterBar reads from useSearchParams() (not initialMuscles prop) for active chip state — ensures client-side URL is the single source of truth after hydration"
  - "Snake_case to camelCase mapping done in page.tsx not components — keeps components clean, page owns data shape transformation"

patterns-established:
  - "URL-param filter pattern: Server Component fetches with params, Client Component updates URL via replace()"
  - "Submit-only search: local state for input, form onSubmit syncs to URL"

requirements-completed: [EXLIB-03]

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 2 Plan 03: Exercise Library Page Wiring Summary

**URL-param-driven /trainer/exercises page with Supabase ilike/in filtering, submit-only search bar, multi-select muscle group chip filter, and Exercises nav link in trainer header**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-10T23:55:40Z
- **Completed:** 2026-03-11T00:01:00Z
- **Tasks:** 2 of 3 complete (Task 3 is human-verify checkpoint — paused)
- **Files modified:** 3

## Accomplishments
- ExercisesPage Server Component fetches exercises with conditional ilike/in filters from Supabase URL params
- ExerciseFilterBar Client Component: search triggers on Enter/button only; muscle group chips update URL immediately on toggle
- Trainer layout header updated with "Exercises" nav link between logo and sign-out button
- Two distinct empty states: empty library (no filters, 0 results) vs. no-results (filters applied, 0 results)

## Task Commits

Each task was committed atomically:

1. **Task 1: ExercisesPage + ExerciseFilterBar** - `7da0853` (feat)
2. **Task 2: Exercises nav link in trainer layout** - `044679b` (feat)
3. **Task 3: Human verification** - _pending checkpoint approval_

## Files Created/Modified
- `src/app/(trainer)/trainer/exercises/page.tsx` - Server Component: reads searchParams, fetches filtered exercises, renders ExerciseFilterBar + ExerciseGrid + empty states
- `src/app/(trainer)/trainer/_components/ExerciseFilterBar.tsx` - Client Component: search form (submit-only) + 13 muscle group chip buttons with URL-driven active state
- `src/app/(trainer)/layout.tsx` - Added nav element with "Exercises" Link between Logo and Sign out button

## Decisions Made
- ExerciseGrid is always rendered (even in empty library state) so its "Add exercise" button is always accessible; the empty library illustration+message appears ABOVE the grid
- Active chip state read from `useSearchParams()` not `initialMuscles` prop — ensures client-side URL remains single source of truth after hydration
- Snake_case-to-camelCase DB mapping done in page.tsx so all downstream components use the typed Exercise interface cleanly

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required beyond the already-documented Supabase migration (0002_exercises.sql must be applied before the exercises feature can be tested with real data).

## Next Phase Readiness
- Exercise Library feature is functionally complete pending human verification (Task 3 checkpoint)
- /trainer/exercises route is dynamic, TypeScript-clean, and Next.js build passes
- After human approval: Phase 02.1-ui-polish can begin visual review of the Exercise Library

---
*Phase: 02-exercise-library*
*Completed: 2026-03-11*
