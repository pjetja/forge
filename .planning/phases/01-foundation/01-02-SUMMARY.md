---
phase: 01-foundation
plan: 02
subsystem: auth
tags: [supabase, oauth, google, pkce, server-actions, zod, nextjs]

# Dependency graph
requires:
  - phase: 01-foundation/01
    provides: Supabase client helpers (browser, server, admin), Drizzle schema (trainers, users, invite_links, trainer_trainee_connections)

provides:
  - Email/password signup for trainers with role assignment via Admin API
  - Email/password signup for trainees with role assignment and invite token support
  - Google OAuth signup for trainers and trainees with PKCE callback and role context preservation
  - PKCE OAuth callback route with role assignment on first signup, returning user detection
  - Email/password login with role-based redirect (/trainer or /trainee)
  - Google OAuth login for returning users (no role in redirectTo)
  - signOut Server Action (exported for use in app shell layouts)
  - Auth route group layout (centered card container)
  - Verify-email page shown after email/password signup

affects: [02-trainer-dashboard, 03-trainee-dashboard, middleware, app-shell]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action form pattern with useActionState hook for React 19 progressive enhancement"
    - "Shared client component (SignupForm) accepting Server Action as prop for reuse across trainer/trainee pages"
    - "PKCE OAuth flow with role context preserved in redirectTo query param"
    - "Admin API role assignment via app_metadata — never user-editable JWT claims"
    - "existingRole guard in callback prevents role overwrite for returning OAuth users"

key-files:
  created:
    - src/app/(auth)/layout.tsx
    - src/app/(auth)/signup/trainer/actions.ts
    - src/app/(auth)/signup/trainee/actions.ts
    - src/app/(auth)/signup/trainer/page.tsx
    - src/app/(auth)/signup/trainee/page.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/login/actions.ts
    - src/app/(auth)/login/_components/LoginForm.tsx
    - src/app/(auth)/verify-email/page.tsx
    - src/app/auth/callback/route.ts
    - src/components/auth/SignupForm.tsx
  modified: []

key-decisions:
  - "Used shared SignupForm component (src/components/auth/SignupForm.tsx) accepting role + action props — avoids duplication between trainer and trainee signup pages"
  - "Typed claimInviteToken parameter as ReturnType<typeof createAdminClient> instead of any — maintains type safety while avoiding circular dependency"
  - "getClaims() result accessed as claimsResult.data?.claims?.app_metadata?.role to handle nullable return type in Zod v4 strict TypeScript"
  - "Zod v4 uses .issues instead of .errors on ZodError — auto-fixed in both signup actions"

patterns-established:
  - "Server Action + useActionState: all form submissions use this pattern for progressive enhancement"
  - "Role stored in app_metadata via Admin API (service_role key) — enforced in every signup path"
  - "Auth callback guards: no code -> redirect to auth-code-error; no role after OAuth -> redirect with error param"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 4min
completed: 2026-03-09
---

# Phase 1 Plan 02: Auth Pages and OAuth Integration Summary

**Supabase email/password and Google OAuth signup/login with PKCE callback, role assignment via Admin API, and invite token auto-connect for trainees**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T18:26:53Z
- **Completed:** 2026-03-09T18:30:27Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Trainer and trainee email/password signup Server Actions with Zod validation, Admin API role assignment, and profile row creation
- Google OAuth signup for both roles with role context preserved through PKCE redirectTo, and invite token auto-connect for new trainee OAuth signups
- PKCE callback route that assigns role on first signup, skips role assignment for returning users, and handles trainer profile creation
- Login page with email/password Server Action (role-based redirect) and Google OAuth (no role param for returning users)
- Shared `SignupForm` client component reduces duplication between trainer and trainee pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth layout and signup Server Actions** - `93de7f1` (feat)
2. **Task 2: Signup pages and login page with Google OAuth** - `bc8d736` (feat)
3. **Task 3: PKCE callback route and login Server Action** - `a06d917` (feat)

**Plan metadata:** (see final commit after SUMMARY creation)

## Files Created/Modified

- `src/app/(auth)/layout.tsx` - Centered card layout for all auth pages
- `src/app/(auth)/signup/trainer/actions.ts` - signUpTrainer Server Action with Zod validation and Admin API role assignment
- `src/app/(auth)/signup/trainee/actions.ts` - signUpTrainee Server Action with invite token support
- `src/app/(auth)/signup/trainer/page.tsx` - Trainer signup page using shared SignupForm
- `src/app/(auth)/signup/trainee/page.tsx` - Trainee signup page, reads invite from searchParams
- `src/app/(auth)/login/page.tsx` - Login page shell
- `src/app/(auth)/login/actions.ts` - signIn and signOut Server Actions
- `src/app/(auth)/login/_components/LoginForm.tsx` - Login form with Google OAuth and email/password
- `src/app/(auth)/verify-email/page.tsx` - Post-signup email verification gate page
- `src/app/auth/callback/route.ts` - PKCE callback: exchanges code, assigns role, creates profile, handles invite tokens
- `src/components/auth/SignupForm.tsx` - Shared client component for Google OAuth button + email/password form

## Decisions Made

- Used a single shared `SignupForm` component that accepts `role`, `action`, and optional `inviteToken` props to avoid duplication across trainer/trainee signup pages.
- Typed `claimInviteToken` parameter as `ReturnType<typeof createAdminClient>` instead of `any` to maintain type safety.
- `signOut` exported from `login/actions.ts` for reuse in app shell layouts (Plan 03).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 uses .issues not .errors on ZodError**
- **Found during:** Task 1 (signup Server Actions)
- **Issue:** Plan code used `result.error.errors[0].message` but Zod v4 renamed the property to `.issues`
- **Fix:** Changed `.errors` to `.issues` in both trainer and trainee signup actions
- **Files modified:** src/app/(auth)/signup/trainer/actions.ts, src/app/(auth)/signup/trainee/actions.ts
- **Verification:** TypeScript compiled without errors after fix
- **Committed in:** `93de7f1` (Task 1 commit)

**2. [Rule 1 - Bug] getClaims() return type is nullable — destructuring fails TypeScript strict check**
- **Found during:** Task 2 (login actions.ts)
- **Issue:** Plan code used `const { data: { claims } } = await supabase.auth.getClaims()` but the data object's `claims` property is inside a nullable return value, causing TS2339
- **Fix:** Changed to `claimsResult.data?.claims?.app_metadata?.role` with optional chaining
- **Files modified:** src/app/(auth)/login/actions.ts
- **Verification:** TypeScript compiled without errors after fix
- **Committed in:** `bc8d736` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes required for TypeScript strict mode compliance. No scope creep — all changes within planned files.

## Issues Encountered

None beyond the auto-fixed TypeScript issues above.

## User Setup Required

None - no new external service configuration required beyond Plan 01.

Note: Migration from Plan 01 (src/lib/db/migrations/0001_initial.sql) must still be applied to Supabase before auth flows can be end-to-end tested. The callback route references `trainers`, `users`, `invite_links`, and `trainer_trainee_connections` tables.

## Next Phase Readiness

- All auth flows wired end-to-end: signup (email + Google), login (email + Google), logout, email verification gate
- `signOut` Server Action exported from login/actions.ts for app shell in Plan 03
- Role always stored in `app_metadata` via Admin API — ready for middleware-based route protection in Plan 03
- Invite token auto-connect flow in callback route ready for invite link feature (Phase 3)
- `npm run build` exits 0 — all routes compile and render correctly

---
*Phase: 01-foundation*
*Completed: 2026-03-09*

## Self-Check: PASSED

All 11 source files present. All 3 task commits verified (93de7f1, bc8d736, a06d917). Build exits 0.
