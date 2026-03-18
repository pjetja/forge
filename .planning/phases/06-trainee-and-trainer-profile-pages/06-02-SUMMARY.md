---
phase: 06-trainee-and-trainer-profile-pages
plan: 02
subsystem: ui
tags: [gravatar, next-auth, server-actions, zod, profile, nav]

# Dependency graph
requires:
  - phase: 06-01
    provides: gravatarUrl utility, GravatarAvatar component, DB bio/goals columns
provides:
  - Gravatar avatar in both NavHeader and TraineeNavHeader linking to profile pages
  - Trainer profile page at /trainer/profile with editable name + bio
  - updateTrainerProfile Server Action with Zod validation
  - Sign-out relocated from nav headers to profile page
affects:
  - 06-03-trainee-profile (same nav header pattern; same async layout pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Async layout pattern: TrainerLayout/TraineeLayout fetch user data server-side and pass avatarUrl+userName as props to client nav headers
    - Profile page pattern: server component fetches trainer row, passes initialName/initialBio to client form component
    - Sign-out relocated to profile page (not in nav) — consistent pattern for both trainer and trainee

key-files:
  created:
    - src/app/(trainer)/trainer/profile/page.tsx
    - src/app/(trainer)/trainer/profile/actions.ts
    - src/app/(trainer)/trainer/profile/_components/TrainerProfileForm.tsx
  modified:
    - src/app/(trainer)/layout.tsx
    - src/app/(trainee)/layout.tsx
    - src/app/(trainer)/_components/NavHeader.tsx
    - src/app/(trainee)/_components/TraineeNavHeader.tsx

key-decisions:
  - "Layouts converted to async server components — needed to fetch trainer/user email for gravatarUrl computation server-side before passing to client nav header"
  - "avatarUrl and userName passed as props to client nav header components — props bridge is the correct RSC/client component boundary pattern"
  - "SignOutButton removed from both nav headers entirely — sign-out now lives on profile page, keeps nav clean"
  - "GravatarAvatar size=32 in nav header; size=80 on profile page with ring-2 ring-accent"
  - "useTransition used for form submission (not useActionState) — React 19 compatible, simpler state management for this case"

patterns-established:
  - "Profile page pattern: async server component fetches own user row + passes to client form; sign-out form at bottom"
  - "Nav avatar pattern: desktop shows avatar-only link top-right; mobile sidebar shows avatar + 'Profile' text at bottom"

requirements-completed: [PROF-NAV-AVATAR, PROF-TRAINER-OWN]

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 06 Plan 02: Nav Avatar + Trainer Profile Page Summary

**Gravatar avatar added to both nav headers with profile page link, trainer profile page with editable name/bio form, and sign-out relocated from nav to profile pages**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T13:57:15Z
- **Completed:** 2026-03-18T14:00:18Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Both TrainerLayout and TraineeLayout converted to async server components computing gravatarUrl and fetching user name server-side
- Both NavHeader and TraineeNavHeader updated to accept avatarUrl/userName props and render GravatarAvatar linking to respective profile pages; SignOutButton removed
- Trainer profile page created at /trainer/profile with 80px Gravatar (ring-accent), display name, read-only email, Gravatar helper text, editable name+bio form, and sign-out at bottom
- updateTrainerProfile Server Action with Zod validation (name required, bio optional up to 1000 chars), revalidates both /trainer/profile and /trainer

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade layouts and nav headers with Gravatar avatar** - `e8b37b1` (feat)
2. **Task 2: Create trainer profile page with form and Server Action** - `1ea8d46` (feat)

## Files Created/Modified

- `src/app/(trainer)/layout.tsx` - Converted to async, fetches email + trainer name, passes avatarUrl+userName to NavHeader
- `src/app/(trainee)/layout.tsx` - Converted to async, fetches email + user name, passes avatarUrl+userName to TraineeNavHeader
- `src/app/(trainer)/_components/NavHeader.tsx` - Accepts avatarUrl+userName props, shows GravatarAvatar linking to /trainer/profile; SignOutButton removed
- `src/app/(trainee)/_components/TraineeNavHeader.tsx` - Accepts avatarUrl+userName props, shows GravatarAvatar linking to /trainee/profile; SignOutButton removed
- `src/app/(trainer)/trainer/profile/page.tsx` - Server component: Gravatar (80px, ring-accent), name, email, bio form, sign-out
- `src/app/(trainer)/trainer/profile/actions.ts` - updateTrainerProfile Server Action with Zod validation
- `src/app/(trainer)/trainer/profile/_components/TrainerProfileForm.tsx` - Client form with useTransition, success (auto-clears 3s) and error feedback

## Decisions Made

- Layouts made async to compute gravatarUrl server-side — avoids exposing email to client bundle
- `useTransition` chosen over `useActionState` — simpler state management, works cleanly with manual FormData construction
- GravatarAvatar size=32 in nav header (compact), size=80 on profile page (identity anchor)
- Mobile sidebar: avatar + "Profile" text link replaces sign-out at the bottom of the panel

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — TypeScript check (`npx tsc --noEmit`) passed with zero errors on first attempt.

## User Setup Required

Migration 0009_profile_fields.sql must be applied via Supabase SQL Editor (documented in plan frontmatter user_setup section). This was planned — no new setup required beyond what the plan specified.

## Next Phase Readiness

- Trainer nav avatar + profile page fully functional
- Plan 06-03 (trainee profile page) can proceed — same patterns apply: async layout already done, just needs /trainee/profile page
- No blockers

---
*Phase: 06-trainee-and-trainer-profile-pages*
*Completed: 2026-03-18*
