---
phase: 09-internationalization
plan: 03
subsystem: trainer-core
tags: [i18n, trainer, extraction, translations]
dependency_graph:
  requires: ["09-01"]
  provides: ["trainer-core-i18n"]
  affects: ["trainer-pages", "trainer-components"]
tech_stack:
  added: []
  patterns: ["getTranslations (server components)", "useTranslations (client components)", "trainer namespace"]
key_files:
  created: []
  modified:
    - messages/en/trainer.json
    - messages/pl/trainer.json
    - messages/en/common.json
    - messages/pl/common.json
    - src/app/(trainer)/trainer/page.tsx
    - src/app/(trainer)/trainer/exercises/page.tsx
    - src/app/(trainer)/trainer/plans/page.tsx (via PlansClient)
    - src/app/(trainer)/trainer/plans/new/page.tsx
    - src/app/(trainer)/trainer/plans/[planId]/page.tsx
    - src/app/(trainer)/trainer/plans/[planId]/schemas/[schemaId]/page.tsx
    - src/app/(trainer)/trainer/plans/[planId]/assign/page.tsx
    - src/app/(trainer)/trainer/plans/[planId]/assign/AssignPlanClientPage.tsx
    - src/app/(trainer)/trainer/profile/page.tsx
    - src/app/(trainer)/trainer/profile/_components/TrainerProfileForm.tsx
    - src/app/(trainer)/trainer/_components/AddSchemaButton.tsx
    - src/app/(trainer)/trainer/_components/AssignPlanModal.tsx
    - src/app/(trainer)/trainer/_components/ExerciseAddButton.tsx
    - src/app/(trainer)/trainer/_components/ExerciseCard.tsx
    - src/app/(trainer)/trainer/_components/ExerciseDetailModal.tsx
    - src/app/(trainer)/trainer/_components/ExerciseFilterBar.tsx
    - src/app/(trainer)/trainer/_components/ExerciseFormModal.tsx
    - src/app/(trainer)/trainer/_components/ExerciseGrid.tsx
    - src/app/(trainer)/trainer/_components/ExercisePickerModal.tsx
    - src/app/(trainer)/trainer/_components/InviteDialog.tsx
    - src/app/(trainer)/trainer/_components/PlanCard.tsx
    - src/app/(trainer)/trainer/_components/PlanDetailHeader.tsx
    - src/app/(trainer)/trainer/_components/PlanNotesEditor.tsx
    - src/app/(trainer)/trainer/_components/PlanTagsEditor.tsx
    - src/app/(trainer)/trainer/_components/PlanWeekView.tsx
    - src/app/(trainer)/trainer/_components/PlansClient.tsx
    - src/app/(trainer)/trainer/_components/SchemaEditorAddButton.tsx
    - src/app/(trainer)/trainer/_components/SchemaExerciseList.tsx
    - src/app/(trainer)/trainer/_components/SchemaExerciseRow.tsx
decisions:
  - "AssignPlanClientPage converted from client to server component to use getTranslations"
  - "Muscle group names kept as raw DB values in chip buttons since they come from MUSCLE_GROUPS constant; translations in common.muscleGroup not yet applied to display in trainer components (deferred)"
metrics:
  duration: "~90 minutes"
  completed: "2026-03-29"
  tasks: 2
  files: 33
---

# Phase 09 Plan 03: Trainer Core i18n Extraction Summary

**One-liner:** i18n extraction for all 19 trainer components and 14 trainer pages using useTranslations/getTranslations with ~100 keys in trainer.json for both EN and PL locales.

## What Was Built

Extracted all hardcoded English strings from the entire trainer core section of the app:

- **19 trainer _components** — all use `useTranslations('trainer')` (and `useTranslations('common')` for shared labels like Cancel, Delete, Close)
- **14 trainer pages** — server page.tsx files use `getTranslations('trainer')`, client form components use `useTranslations('trainer')`
- **messages/en/trainer.json** — fully populated with ~100 keys across 7 namespaces: trainees, invite, exercises, plans, planDetail, schemas, assign, profile
- **messages/pl/trainer.json** — fully populated with Polish translations for all keys
- **messages/en/common.json** and **messages/pl/common.json** — expanded with muscleGroup, day names, and video filter labels

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: 19 _components | 66c9f9d | feat(09-03): extract strings from all 19 trainer _components |
| Task 2: 14 pages | 42deec6 | feat(09-03): extract strings from all trainer pages |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Refactor] AssignPlanClientPage converted to server component**
- **Found during:** Task 2
- **Issue:** File was named "ClientPage" but had no client-side state or hooks — it was a pure server-rendered list of trainee links
- **Fix:** Changed from client component to server async function using `getTranslations` instead of `useTranslations`
- **Files modified:** `src/app/(trainer)/trainer/plans/[planId]/assign/AssignPlanClientPage.tsx`
- **Commit:** 42deec6

### Deferred Items

- `[traineeId]/page.tsx` and `[traineeId]/AssignReviewForm.tsx` under the assign flow do not exist in this worktree (they exist in main branch untracked files). These will be covered when those files are merged.
- Muscle group display names in trainer exercise filter chips still show raw DB values (e.g. "Chest"). The `common.muscleGroup` translations exist but the MUSCLE_GROUPS constant drives the chip values. Full localization of muscle group display would require mapping constant values to translation keys — deferred to a future cleanup.

## Acceptance Criteria Check

- [x] messages/pl/trainer.json contains "trainer" top-level key with nested exercises, plans, schemas, trainees, invite, planDetail, assign, profile objects
- [x] messages/en/trainer.json mirrors the same structure
- [x] All 19 _components files contain "useTranslations" import
- [x] ExerciseGrid.tsx contains no hardcoded English strings
- [x] InviteDialog.tsx contains no hardcoded English strings like "Copy Link" or "Invite"
- [x] PlanWeekView.tsx uses t('schemas.workoutLabel', { slot }) instead of hardcoded "Workout {slot}"
- [x] messages/pl/common.json contains "muscleGroup" and "day" sections
- [x] pnpm build succeeds

## Self-Check: PASSED

All committed files exist and build passes with zero errors.
