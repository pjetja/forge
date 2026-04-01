---
phase: 10-demo-users
plan: "03"
subsystem: auth
tags: [supabase, next-auth, i18n, react, password-protection, demo-guard]

requires:
  - phase: 10-02
    provides: Demo login actions and landing page with is_demo flag set in user_metadata

provides:
  - changePassword server action with is_demo guard in both trainer and trainee profile actions
  - is_demo guard added to reset-password updatePassword action (defence-in-depth)
  - Change Password UI section in TrainerProfileForm and TraineeProfileForm (hidden for demo users)
  - isDemo prop threading from profile page → form component in both layouts
  - i18n keys for Change Password UI in en/trainer.json, pl/trainer.json, en/trainee.json, pl/trainee.json

affects: [auth, profiles, demo-users]

tech-stack:
  added: []
  patterns:
    - "is_demo guard: getClaims() → user_metadata.is_demo === true → early return error before any mutation"
    - "isDemo prop threading: server component reads claims → passes boolean prop to client form"
    - "Dual-layer protection: server action guard + UI conditional render (!isDemo)"

key-files:
  created: []
  modified:
    - src/app/(auth)/reset-password/actions.ts
    - src/app/(trainer)/trainer/profile/actions.ts
    - src/app/(trainee)/trainee/profile/actions.ts
    - src/app/(trainer)/trainer/profile/page.tsx
    - src/app/(trainee)/trainee/profile/page.tsx
    - src/app/(trainer)/trainer/profile/_components/TrainerProfileForm.tsx
    - src/app/(trainee)/trainee/profile/_components/TraineeProfileForm.tsx
    - messages/en/trainer.json
    - messages/pl/trainer.json
    - messages/en/trainee.json
    - messages/pl/trainee.json

key-decisions:
  - "Guard placed before schema validation in changePassword — demo check short-circuits without touching Zod"
  - "UI section conditionally not rendered (not just disabled) for demo users — cleaner UX, no accidental form submission"
  - "On successful password change: signOut then redirect('/login') — forces fresh session"

patterns-established:
  - "Demo guard pattern: supabase.auth.getClaims() → claims.user_metadata?.is_demo === true → return error"

requirements-completed: [DEMO-GUARD]

duration: gap-fill
completed: 2026-04-01
---

# Plan 10-03: Password Change + Demo Guard Summary

**Demo users are fully blocked from changing passwords at both the UI and server layers; real users get a "Change Password" section on their profile pages.**

## Performance

- **Duration:** gap-fill (code was partially committed in Phase 10 bulk commit; this plan closes the i18n gap and creates this summary)
- **Completed:** 2026-04-01
- **Tasks:** 10 (9 auto + 1 human-verify)
- **Files modified:** 11

## Accomplishments

- Added `changePassword` server action to both trainer and trainee profile `actions.ts` with `is_demo` guard — demo users receive an error, real users get password updated and are signed out
- Added `is_demo` guard to `reset-password/updatePassword` as defence-in-depth
- `TrainerProfileForm` and `TraineeProfileForm` now accept `isDemo: boolean` prop and conditionally render the Change Password section only for non-demo users
- Both profile pages read `user_metadata.is_demo` from Supabase claims and thread it down to the form component
- All 7 i18n keys (`changePasswordHeading`, `changePasswordNewLabel`, `changePasswordConfirmLabel`, `changePasswordSubmit`, `changePasswordSaving`, `changePasswordSuccess`, `changePasswordError`) added to all 4 locale files (en+pl, trainer+trainee)

## Task Commits

1. **Tasks 1–9: Server actions, profile pages, form components, i18n** - `32d9fe4` (feat: demo users seed script, login instructions, and demo-user password protection)
2. **Task 2+3 gap: missing changePasswordSuccess/Error i18n keys** - `d31176e` (feat(10-03): add missing changePasswordSuccess/Error i18n keys)

## Files Created/Modified

- `src/app/(auth)/reset-password/actions.ts` — Added is_demo guard before updateUser call
- `src/app/(trainer)/trainer/profile/actions.ts` — Added changePassword action with is_demo guard, schema validation, signOut + redirect
- `src/app/(trainee)/trainee/profile/actions.ts` — Same as trainer profile actions
- `src/app/(trainer)/trainer/profile/page.tsx` — Derives isDemo from claims, passes to TrainerProfileForm
- `src/app/(trainee)/trainee/profile/page.tsx` — Same for trainee
- `src/app/(trainer)/trainer/profile/_components/TrainerProfileForm.tsx` — Added isDemo prop, Change Password form section with cpPending/cpError state
- `src/app/(trainee)/trainee/profile/_components/TraineeProfileForm.tsx` — Same for trainee
- `messages/en/trainer.json` — 7 changePassword i18n keys
- `messages/pl/trainer.json` — 7 changePassword i18n keys (Polish)
- `messages/en/trainee.json` — 7 changePassword i18n keys
- `messages/pl/trainee.json` — 7 changePassword i18n keys (Polish)
