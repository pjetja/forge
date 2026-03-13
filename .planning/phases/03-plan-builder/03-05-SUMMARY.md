---
phase: 03-plan-builder
plan: "05"
subsystem: ui
tags: [nextjs, react, supabase, server-actions, client-components]

# Dependency graph
requires:
  - phase: 03-plan-builder
    provides: assignPlan + editAssignedPlan + duplicatePlan server actions (03-01); trainee detail page (03-02); plan editor pages (03-03, 03-04)
provides:
  - Assign plan page at /trainer/plans/[planId]/assign with trainee picker and weight review modal
  - AssignPlanModal client component — weight override inputs, warning for existing active plans, confirmation checkbox
  - Edit assigned plan page at /trainer/trainees/[traineeId]/assigned-plans/[assignedPlanId]/edit
  - Duplicate plan button wired to PlanCard in plans list
affects: 03-06, 03.1-ui-polish, 04-workout-logging

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component shell + Client Component pattern (page.tsx + ClientPage.tsx co-located)
    - Blob mutation on blur — editAssignedPlan called on input onBlur to avoid per-keystroke server calls

key-files:
  created:
    - src/app/(trainer)/trainer/_components/AssignPlanModal.tsx
    - src/app/(trainer)/trainer/plans/[planId]/assign/page.tsx
    - src/app/(trainer)/trainer/plans/[planId]/assign/AssignPlanClientPage.tsx
    - src/app/(trainer)/trainer/trainees/[traineeId]/assigned-plans/[assignedPlanId]/edit/page.tsx
    - src/app/(trainer)/trainer/trainees/[traineeId]/assigned-plans/[assignedPlanId]/edit/EditAssignedPlanClient.tsx
  modified:
    - src/app/(trainer)/trainer/_components/PlanCard.tsx

key-decisions:
  - "AssignPlanModal accepts exerciseHistory as Record<exerciseId, { lastWeight: number } | null> — Phase 3 passes {} (all-null); Phase 4 will inject real history data. Phase 4 inject point commented."
  - "PlanCard converted to 'use client' component to support inline Duplicate button — stopPropagation prevents Link navigation triggering on duplicate click"
  - "Import path from plans/[planId]/assign/ to trainer/_components/ is 3 levels up (../../../), not 4 — verified by TypeScript"

patterns-established:
  - "Server Component + co-located Client Component: page.tsx (server, fetches data) + ClientPage.tsx (client, handles state/interaction)"
  - "exerciseHistory prop typed as Record<exerciseId, { lastWeight } | null> — all-null in Phase 3, real data in Phase 4"

requirements-completed: [PLAN-05, PLAN-06]

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 3 Plan 05: Plan Assignment and Edit Summary

**Plan assignment flow with trainee picker, weight review step + warning for active plans; edit assigned plan page; and duplicate plan button in PlanCard**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T08:26:30Z
- **Completed:** 2026-03-13T08:29:16Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Assign plan page (/trainer/plans/[planId]/assign) lists all connected trainees with active-plan warning badges
- AssignPlanModal shows all exercises with weight inputs pre-filled from template; warning + checkbox when trainee already has pending/active plan; on confirm calls assignPlan RPC
- Edit assigned plan page (/trainer/trainees/[id]/assigned-plans/[id]/edit) renders all exercises with sets/reps/weight inputs that save on blur via editAssignedPlan
- PlanCard updated to client component with Duplicate button calling duplicatePlan RPC and refreshing

## Task Commits

Each task was committed atomically:

1. **Task 1: Assign plan flow — trainee picker and review step** - `b1681a2` (feat)
2. **Task 2: Edit assigned plan page + duplicate plan wiring in Plans list** - `1e24bde` (feat)

## Files Created/Modified
- `src/app/(trainer)/trainer/_components/AssignPlanModal.tsx` - Client component: exercise weight review inputs, existing-plan warning, confirms via assignPlan
- `src/app/(trainer)/trainer/plans/[planId]/assign/page.tsx` - Server component: fetches plan exercises, connected trainees, existing plan status
- `src/app/(trainer)/trainer/plans/[planId]/assign/AssignPlanClientPage.tsx` - Client shell: trainee list, opens AssignPlanModal on selection
- `src/app/(trainer)/trainer/trainees/[traineeId]/assigned-plans/[assignedPlanId]/edit/page.tsx` - Server component: fetches assigned plan + exercises
- `src/app/(trainer)/trainer/trainees/[traineeId]/assigned-plans/[assignedPlanId]/edit/EditAssignedPlanClient.tsx` - Client component: per-exercise edit rows with blur-save
- `src/app/(trainer)/trainer/_components/PlanCard.tsx` - Added 'use client', Duplicate button with stopPropagation

## Decisions Made
- `AssignPlanModal` accepts `exerciseHistory` prop typed as `Record<string, { lastWeight: number } | null>` — Phase 3 passes `{}` (all-null); Phase 4 inject point documented in comments
- `PlanCard` converted to a `'use client'` component (was a pure server component) to support the Duplicate button; `e.stopPropagation()` prevents Link navigation on duplicate click
- Import path from `plans/[planId]/assign/` to `trainer/_components/` corrected to 3 levels up (`../../../`) not 4

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect import path depth in AssignPlanClientPage**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** Plan specified `../../../../_components/AssignPlanModal` (4 levels up) but the file is at `plans/[planId]/assign/` which only needs 3 levels up to reach `trainer/`
- **Fix:** Corrected to `../../../_components/AssignPlanModal`
- **Files modified:** src/app/(trainer)/trainer/plans/[planId]/assign/AssignPlanClientPage.tsx
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** b1681a2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — wrong import path depth)
**Impact on plan:** Minor path correction. No scope creep.

## Issues Encountered
- None beyond the import path fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan assignment flow fully wired; assign button should be added to plan editor page (03-06) to link to /trainer/plans/[planId]/assign
- Edit assigned plan page is accessible from trainee detail page (already linked in 03-02)
- Phase 4 (workout logging) can inject real exercise history into AssignPlanModal via exerciseHistory prop

---
*Phase: 03-plan-builder*
*Completed: 2026-03-13*

## Self-Check: PASSED

All files exist, all commits verified.
