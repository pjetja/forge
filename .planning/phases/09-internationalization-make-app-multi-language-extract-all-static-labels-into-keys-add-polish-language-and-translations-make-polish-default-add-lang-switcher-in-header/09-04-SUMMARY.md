---
phase: 09-internationalization-make-app-multi-language-extract-all-static-labels-into-keys-add-polish-language-and-translations-make-polish-default-add-lang-switcher-in-header
plan: 04
subsystem: ui
tags: [next-intl, i18n, trainer, trainee, translations, polish, english]

# Dependency graph
requires:
  - phase: 09-01
    provides: next-intl setup, message file structure, getTranslations/useTranslations pattern

provides:
  - All trainer trainee-detail pages (~27 files) use t() calls with trainer.json keys
  - All trainee route group files (~24 files) use t() calls with trainee.json keys
  - messages/pl/trainee.json fully populated with ~80+ keys covering tabs, plans, workout, sets, exercises, bodyWeight, profile
  - messages/en/trainee.json fully populated with matching structure
  - messages/pl/trainer.json expanded with traineeDetail namespace
  - messages/en/trainer.json expanded with traineeDetail namespace

affects: [10-demo-users, 11-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server components use getTranslations('namespace') from next-intl/server
    - Client components use useTranslations('namespace') from next-intl
    - Async server components (e.g. TrainerCard converted from sync to async) to access getTranslations

key-files:
  created:
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/exercises/[exerciseId]/page.tsx
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/exercises/[exerciseId]/_components/ProgressChart.tsx
  modified:
    - messages/en/trainee.json
    - messages/pl/trainee.json
    - messages/en/trainer.json
    - messages/pl/trainer.json
    - src/app/(trainee)/trainee/page.tsx
    - src/app/(trainee)/trainee/_components/AbandonSessionButton.tsx
    - src/app/(trainee)/trainee/_components/TraineeExerciseFilterBar.tsx
    - src/app/(trainee)/trainee/_components/TraineeExercisesTab.tsx
    - src/app/(trainee)/trainee/exercises/page.tsx
    - src/app/(trainee)/trainee/exercises/[exerciseId]/page.tsx
    - src/app/(trainee)/trainee/exercises/[exerciseId]/_components/TraineeCrossPlanChart.tsx
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/page.tsx
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/_components/StartWorkoutButton.tsx
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/page.tsx
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/_components/FinishWorkoutButton.tsx
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/exercises/[exerciseId]/page.tsx
    - src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/exercises/[exerciseId]/_components/SetList.tsx
    - src/app/(trainee)/trainee/body-weight/_components/BodyWeightAccessRequestBanner.tsx
    - src/app/(trainee)/trainee/body-weight/_components/BodyWeightChart.tsx
    - src/app/(trainee)/trainee/body-weight/_components/BodyWeightLogForm.tsx
    - src/app/(trainee)/trainee/body-weight/_components/DeleteBodyWeightButton.tsx
    - src/app/(trainee)/trainee/profile/page.tsx
    - src/app/(trainee)/trainee/profile/_components/TraineeProfileForm.tsx
    - src/app/(trainee)/trainee/profile/_components/TrainerCard.tsx

key-decisions:
  - "TrainerCard converted from sync to async function to allow getTranslations call in server component"
  - "workoutsPerWeek and weeks format strings extracted as separate translation keys rather than inline text"

patterns-established:
  - "Server component conversion: sync function → async function when adding getTranslations"
  - "Client component: add useTranslations hook alongside existing hooks at top of component"

requirements-completed: [I18N-08, I18N-09]

# Metrics
duration: 45min
completed: 2026-03-29
---

# Phase 09 Plan 04: Trainer Trainee-Detail Pages and Complete Trainee Route Group i18n Summary

**i18n extraction for ~51 files: trainer trainee-detail pages and entire trainee workout/profile/body-weight flow, with trainee.json (~80+ keys) and trainer.json traineeDetail namespace fully populated in EN and PL**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-29T00:00:00Z
- **Completed:** 2026-03-29T00:45:00Z
- **Tasks:** 2
- **Files modified:** 46

## Accomplishments
- All 27 trainer trainee-detail files use t() calls with trainer.json traineeDetail namespace
- All 24 trainee route group files use t() calls with trainee.json keys
- messages/en/trainee.json and messages/pl/trainee.json fully populated with 80+ keys covering: home tabs, plans, workout flow, set logging, exercise progress charts, body weight tracking, and profile
- Build passes with zero TypeScript or compilation errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract strings from trainer trainee-detail pages (~27 files)** - `55b2130` (feat)
2. **Task 2: Extract strings from trainee route group files (~24 files)** - `e70747f` (feat)

## Files Created/Modified
- `messages/en/trainee.json` - Full English trainee translations (80+ keys)
- `messages/pl/trainee.json` - Full Polish trainee translations (80+ keys)
- `messages/en/trainer.json` - Expanded with traineeDetail namespace
- `messages/pl/trainer.json` - Expanded with traineeDetail namespace
- `src/app/(trainee)/trainee/page.tsx` - Home page with tabs, plans, log, body-weight
- `src/app/(trainee)/trainee/plans/[assignedPlanId]/page.tsx` - Active/complete plan view
- `src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/page.tsx` - Session page
- `src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/_components/FinishWorkoutButton.tsx` - Finish dialog
- `src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/exercises/[exerciseId]/_components/SetList.tsx` - Set logging table
- `src/app/(trainee)/trainee/profile/_components/TrainerCard.tsx` - Converted to async server component
- All other trainee and trainer-trainee components listed in key-files.modified

## Decisions Made
- TrainerCard was a sync server component and was converted to async to allow `getTranslations` — no functional change, just async keyword added
- `workoutsPerWeek` and `weeks` format strings extracted as separate keys (`{count} workouts/week` and `{count} weeks`) for proper i18n interpolation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All trainer and trainee UI now uses t() calls
- trainee.json and trainer.json fully populated
- Ready for phase 09-05 (language switcher in header and Polish as default locale)

---
*Phase: 09-internationalization*
*Completed: 2026-03-29*
