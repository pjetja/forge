---
phase: 06-trainee-and-trainer-profile-pages
plan: "04"
subsystem: trainer-dashboard
tags: [trainer, profile, compliance, notes, gravatar]
dependency_graph:
  requires: ["06-01"]
  provides: [trainer-notes, physical-stats-row, compliance-stats]
  affects: [trainer-home, trainee-detail-page]
tech_stack:
  added: []
  patterns: [batch-query, useTransition, server-action]
key_files:
  created:
    - src/app/(trainer)/trainer/trainees/[traineeId]/_components/TrainerNotesEditor.tsx
    - src/app/(trainer)/trainer/trainees/[traineeId]/_components/PhysicalStatsRow.tsx
  modified:
    - src/app/(trainer)/trainer/trainees/actions.ts
    - src/app/(trainer)/trainer/trainees/[traineeId]/page.tsx
    - src/app/(trainer)/trainer/page.tsx
decisions:
  - "[06-04]: PhysicalStatsRow is a server component (no use client) — pure presentational with no interactivity needed"
  - "[06-04]: TrainerNotesEditor uses useTransition (not useActionState) — consistent with Phase 06-02 pattern for simpler state management"
  - "[06-04]: compliance stats query is a single batch .in() fetch — avoids N+1 per trainee"
  - "[06-04]: initials computation removed from trainer home — GravatarAvatar replaces all initials divs"
metrics:
  duration: "2 min"
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_changed: 5
---

# Phase 06 Plan 04: Trainer-Side Enrichment (Notes, Physical Stats, Compliance) Summary

**One-liner:** Private trainer notes editor + trainee physical stats chip row + batch compliance stats on trainer home roster cards.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add updateTrainerNotes action + TrainerNotesEditor + PhysicalStatsRow + enrich trainee detail page | 2e6eeae | actions.ts, TrainerNotesEditor.tsx, PhysicalStatsRow.tsx, [traineeId]/page.tsx |
| 2 | Add compliance stats to trainer home page roster cards | dfdf745 | trainer/page.tsx |

## What Was Built

### Task 1: Trainee Detail Page Enrichment

- `updateTrainerNotes` server action appended to `trainees/actions.ts` — updates `trainer_notes` on `trainer_trainee_connections` for the authenticated trainer
- `TrainerNotesEditor.tsx` — `'use client'` component with textarea, save button (Saving... during pending), success auto-clear (3s), error display, and "Only visible to you" privacy helper under "Trainer notes (private)" heading
- `PhysicalStatsRow.tsx` — server component rendering height/weight/age as a middot-joined chip string; returns null if all props are absent; includes inline `ageFromDob` function
- `[traineeId]/page.tsx` — extended `.select()` to include `goals, height_cm, weight_kg, date_of_birth`; fetches `trainer_notes` from `trainer_trainee_connections` via `maybeSingle()`; replaced initials avatar with `GravatarAvatar`; added `PhysicalStatsRow` below email; added "Trainee goals" read-only section; added `TrainerNotesEditor` — all before the `TabSwitcher`

### Task 2: Trainer Home Compliance Stats

- Imported `getCurrentWeekBounds`, `gravatarUrl`, `GravatarAvatar` into `trainer/page.tsx`
- Added single batch `workout_sessions` query using `.in('trainee_auth_uid', traineeIds)` filtered to `status = 'completed'`, ordered descending by `completed_at`
- Built `statsByTrainee` Record iterating sessions once: first session (desc) = lastSession, count sessions within `weekStart` for `thisWeek`
- Replaced initials `<div>` with `<GravatarAvatar>` in each trainee card
- Removed `const initials = ...` computation
- Added inline compliance line per card: "Last workout: 14 Mar · 2 this week" or "No sessions yet"

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `TrainerNotesEditor.tsx` exists and contains `'use client'`, `Save notes`, `Only visible to you`
- [x] `PhysicalStatsRow.tsx` exists and contains `ageFromDob`, `cm`, `kg`, no `'use client'`
- [x] `actions.ts` exports `updateTrainerNotes`
- [x] `[traineeId]/page.tsx` contains `GravatarAvatar`, `PhysicalStatsRow`, `TrainerNotesEditor`, `Trainee goals`, `No goals set.`
- [x] `trainer/page.tsx` contains `getCurrentWeekBounds`, `workout_sessions`, `statsByTrainee`, `No sessions yet`, `Last workout`, `this week`, `GravatarAvatar`, `gravatarUrl`
- [x] `const initials` removed from trainer/page.tsx
- [x] `npx tsc --noEmit` passes

## Self-Check: PASSED
