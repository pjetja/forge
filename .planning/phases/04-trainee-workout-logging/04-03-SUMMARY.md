---
phase: 04-trainee-workout-logging
plan: "03"
subsystem: ui

# Dependency graph
requires:
  - phase: 04-trainee-workout-logging
    provides: getCurrentWeekBounds utility, startWorkout/abandonWorkout Server Actions

provides:
  - /trainee page: plans list with three sections (active/upcoming/past) + in-progress session banner
  - /trainee/plans/[assignedPlanId] page: weekly workout grid with done/remaining count and Start/Resume/Done states

affects:
  - 04-04 (session detail page linked from Start/Resume buttons)
  - 04-05 (finish workout navigates back to this plan page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component data fetching with getClaims() + redirect to /login"
    - "PostgREST join Array.isArray guard for assigned_schemas join result"
    - "Client components (AbandonSessionButton, StartWorkoutButton) extracted from server page for useTransition + router.push"
    - "notFound() from next/navigation for 404 on missing/unauthorized plan"

key-files:
  created:
    - src/app/(trainee)/trainee/_components/AbandonSessionButton.tsx
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/page.tsx
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/_components/StartWorkoutButton.tsx
  modified:
    - src/app/(trainee)/trainee/page.tsx

key-decisions:
  - "PostgREST join result cast via unknown intermediate to satisfy TypeScript strict mode when handling array-or-object union from Supabase"
  - "completedSessionsBySchema is a Map keyed by schemaId — avoids double-counting if multiple completed sessions exist for same schema in same week"
  - "schemaIds guard before weekSessions query — skips Supabase call when plan has no schemas to avoid empty IN() clause"
  - "StartWorkoutButton disabled tooltip uses CSS group-hover — no JavaScript needed for simple hover reveal"

# Metrics
duration: ~2min
completed: 2026-03-13
---

# Phase 4 Plan 03: Trainee Plans List and Active Plan Page Summary

**Plans list page (three sections + in-progress banner) and active plan detail page (weekly workout grid with Start/Resume/Done per schema) — two server-rendered pages using getCurrentWeekBounds and Supabase queries**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-13T14:25:08Z
- **Completed:** 2026-03-13T14:27:24Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Replaced the placeholder trainee home page with a full Server Component showing active, upcoming, and past plans in labeled sections
- Added an in-progress session banner with Resume link and Abandon button (AbandonSessionButton client component) when a session is currently in progress
- Created `/trainee/plans/[assignedPlanId]/page.tsx` showing all workout schemas with per-schema status badges: Done (accent green checkmark), In Progress + Resume button, or Start button
- StartWorkoutButton is a client component that calls startWorkout Server Action and router.push to the new session URL on success
- Start button is disabled with hover tooltip "Finish your current workout first" when another session is in progress
- TypeScript compiles clean — used `unknown` intermediate cast to handle PostgREST join returning array-or-object union

## Task Commits

1. **Task 1: Replace trainee home with plans list** — `b8b18f3`
2. **Task 2: Create active plan page with weekly workout grid** — `c463971`

## Files Created/Modified

- `src/app/(trainee)/trainee/page.tsx` — plans list page (replaced placeholder)
- `src/app/(trainee)/trainee/_components/AbandonSessionButton.tsx` — abandon client component
- `src/app/(trainee)/trainee/plans/[assignedPlanId]/page.tsx` — active plan detail page
- `src/app/(trainee)/trainee/plans/[assignedPlanId]/_components/StartWorkoutButton.tsx` — start workout client component

## Decisions Made

- **PostgREST join TypeScript cast**: Supabase returns `assigned_schemas` join as array or object depending on query; used `as unknown as {...}` intermediate cast to avoid TypeScript error from direct type assertion on incompatible types.
- **completedSessionsBySchema as Map**: Avoids double-counting multiple completed sessions for the same schema in a week edge case.
- **schemaIds guard**: If a plan has no schemas, skip the weekSessions Supabase query entirely rather than passing an empty IN() clause.
- **CSS group-hover tooltip on disabled Start button**: Simple hover reveal without JavaScript state — tooltip text shown via absolute positioned div with `group-hover:block`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type error on PostgREST join cast**
- **Found during:** Task 1 (build verification)
- **Issue:** `activeSchemas as { id: string; name: string; assigned_plan_id: string } | null` failed — TypeScript reports the types don't overlap sufficiently
- **Fix:** Added `as unknown` intermediate: `activeSchemas as unknown as {...} | null | undefined`
- **Files modified:** src/app/(trainee)/trainee/page.tsx
- **Commit:** b8b18f3 (included in task commit)

## Self-Check: PASSED

- FOUND: src/app/(trainee)/trainee/page.tsx
- FOUND: src/app/(trainee)/trainee/_components/AbandonSessionButton.tsx
- FOUND: src/app/(trainee)/trainee/plans/[assignedPlanId]/page.tsx
- FOUND: src/app/(trainee)/trainee/plans/[assignedPlanId]/_components/StartWorkoutButton.tsx
- FOUND: commit b8b18f3 (feat(04-03): replace trainee home with plans list page)
- FOUND: commit c463971 (feat(04-03): create active plan page with weekly workout grid)
