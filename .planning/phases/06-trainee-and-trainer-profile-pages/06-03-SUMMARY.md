---
phase: 06-trainee-and-trainer-profile-pages
plan: 03
subsystem: ui
tags: [nextjs, supabase, zod, gravatar, server-actions, react]

# Dependency graph
requires:
  - phase: 06-01
    provides: gravatar utility, GravatarAvatar component, DB schema with users.date_of_birth, trainer RLS policies
provides:
  - Trainee profile page at /trainee/profile with editable fields and trainer card
  - updateTraineeProfile Server Action (validates 5 fields, persists to users table)
  - TraineeProfileForm client component (name, goals, heightCm, weightKg, dateOfBirth)
  - TrainerCard server component (read-only trainer info with avatar, name, email, bio)
affects: [06-04, 07-main-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - z.coerce.number() for numeric form fields (string-to-number coercion at schema boundary)
    - TrainerCard self-contains section heading to satisfy artifact requirements
    - Conditional trainer section rendered only when DB connection row exists

key-files:
  created:
    - src/app/(trainee)/trainee/profile/actions.ts
    - src/app/(trainee)/trainee/profile/page.tsx
    - src/app/(trainee)/trainee/profile/_components/TraineeProfileForm.tsx
    - src/app/(trainee)/trainee/profile/_components/TrainerCard.tsx
  modified: []

key-decisions:
  - "TrainerCard includes its own My Trainer heading — places section heading inside the component for encapsulation"
  - "weight_kg stored as numeric in DB, cast to Number() before passing as initialWeightKg prop — avoids string/number type mismatch"

patterns-established:
  - "useTransition + manual useState for form submission — consistent with TrainerProfileForm pattern"
  - "Optional numeric fields use defaultValue (not controlled value) to avoid sending empty string as 0"
  - "maybeSingle() for trainer_trainee_connections query — connection may not exist, null is valid"

requirements-completed: [PROF-TRAINEE-OWN, PROF-TRAINER-CARD]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 6 Plan 03: Trainee Profile Page Summary

**Trainee profile page with Gravatar header, 5-field editable form, conditional trainer card, and sign-out — backed by Zod-validated Server Action persisting to users table**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T14:02:15Z
- **Completed:** 2026-03-18T14:04:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `updateTraineeProfile` Server Action validates name, goals, height_cm, weight_kg, date_of_birth with Zod using z.coerce.number() for numeric fields
- TraineeProfileForm 'use client' component with all 5 editable fields, useTransition submission, and 3-second auto-clearing success feedback
- TrainerCard read-only server component with GravatarAvatar, trainer name, email, bio
- page.tsx fetches trainer connection and conditionally renders TrainerCard only when connection exists

## Task Commits

Each task was committed atomically:

1. **Task 1: Create trainee profile Server Action** - `0d8dc55` (feat)
2. **Task 2: Create trainee profile page with form, trainer card, and sign-out** - `780dcd7` (feat)

## Files Created/Modified
- `src/app/(trainee)/trainee/profile/actions.ts` - updateTraineeProfile Server Action with Zod validation
- `src/app/(trainee)/trainee/profile/page.tsx` - Server page fetching profile, connection, trainer info
- `src/app/(trainee)/trainee/profile/_components/TraineeProfileForm.tsx` - Client form with 5 fields and feedback
- `src/app/(trainee)/trainee/profile/_components/TrainerCard.tsx` - Read-only trainer info card

## Decisions Made
- `weight_kg` is stored as numeric string by PostgREST — cast with `Number()` before passing as `initialWeightKg` prop to avoid TypeScript type mismatch
- TrainerCard self-contains the "My Trainer" section heading for component encapsulation and to satisfy artifact must_have check

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Trainee profile page is complete and ready for visual review in phase 06.1-ui-polish
- updateTraineeProfile is available for other trainee-side features to reference

---
*Phase: 06-trainee-and-trainer-profile-pages*
*Completed: 2026-03-18*

## Self-Check: PASSED

- FOUND: src/app/(trainee)/trainee/profile/actions.ts
- FOUND: src/app/(trainee)/trainee/profile/page.tsx
- FOUND: src/app/(trainee)/trainee/profile/_components/TraineeProfileForm.tsx
- FOUND: src/app/(trainee)/trainee/profile/_components/TrainerCard.tsx
- FOUND: commit 0d8dc55 (Task 1)
- FOUND: commit 780dcd7 (Task 2)
