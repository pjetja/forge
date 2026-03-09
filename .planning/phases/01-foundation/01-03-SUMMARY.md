---
phase: 01-foundation
plan: 03
subsystem: auth
tags: [nextjs, supabase, middleware, jwt, role-based-routing, server-actions]

# Dependency graph
requires:
  - phase: 01-foundation/01
    provides: Supabase client helpers (createClient, createAdminClient)
  - phase: 01-foundation/02
    provides: signOut Server Action from login/actions.ts

provides:
  - Middleware auth guard using getClaims() with local JWT validation
  - Email verification gate in middleware
  - Role-based routing preventing cross-role access
  - Trainer route group shell at /trainer with empty roster state
  - Trainee route group shell at /trainee with waiting-for-trainer state
  - Sign-out accessible from both route group layouts via form action

affects:
  - 01-foundation/04 (invite system — /trainer route group expanded)
  - All future plans using /trainer or /trainee route groups

# Tech tracking
tech-stack:
  added: []
  patterns:
    - getClaims() for local JWT validation in middleware (no network per request)
    - createServerClient in middleware with cookie mutation for silent token refresh
    - form action={serverAction} pattern for sign-out (no client component needed)
    - Route groups (trainer)/(trainee) for layout isolation without URL segment

key-files:
  created:
    - src/middleware.ts
    - src/app/(trainer)/layout.tsx
    - src/app/(trainer)/trainer/page.tsx
    - src/app/(trainee)/layout.tsx
    - src/app/(trainee)/trainee/page.tsx
  modified: []

key-decisions:
  - "getClaims() used instead of getUser() — validates JWT locally via WebCrypto, no Supabase network call per request"
  - "Route group pages placed under trainer/trainee path segments to avoid Next.js 16 parallel page routing conflict"
  - "middleware.ts retained (not renamed to proxy.ts) — deprecation warning but build succeeds and behavior correct"
  - "email_confirmed_at used as email verification gate in middleware — redirects unverified to /verify-email"

patterns-established:
  - "Auth guard pattern: getClaims() -> check claims null/error -> check email_confirmed_at -> check role -> allow"
  - "Cookie mutation in middleware setAll() enables 30-day silent session refresh"
  - "form action={signOut} in layout.tsx — Server Action invoked without useClient directive on layout"

requirements-completed:
  - AUTH-03
  - AUTH-04

# Metrics
duration: 25min
completed: 2026-03-09
---

# Phase 1 Plan 03: Middleware Auth Guard + Route Group Shells Summary

**Next.js middleware with getClaims() local JWT validation, role-based routing guards, and trainer/trainee app shells with sign-out Server Action**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-09T18:27:04Z
- **Completed:** 2026-03-09T18:52:00Z
- **Tasks:** 2
- **Files modified:** 5 created

## Accomplishments

- Middleware auth guard protecting all routes via getClaims() (local JWT validation, no network per request)
- Email verification gate: unverified users redirected to /verify-email before reaching app
- Cross-role access prevention: trainer blocked from /trainee routes and vice versa
- Trainer home at /trainer with empty roster state and disabled "+ Invite trainee" placeholder
- Trainee home at /trainee with "Waiting for your trainer" empty state
- Sign-out via form action={signOut} Server Action in both route group layouts

## Task Commits

Each task was committed atomically:

1. **Task 1: Middleware auth guard with getClaims()** - `e5caaac` (feat)
2. **Task 2: Trainer and trainee route group shells with home screens** - `1b32ed3` (feat)

**Plan metadata:** `[committed below]` (docs: complete plan)

## Files Created/Modified

- `src/middleware.ts` - Auth guard: getClaims(), email gate, role routing, cookie refresh for silent token renewal
- `src/app/(trainer)/layout.tsx` - Trainer app shell with header and sign-out form action
- `src/app/(trainer)/trainer/page.tsx` - Trainer home: empty roster state with disabled invite button
- `src/app/(trainee)/layout.tsx` - Trainee app shell with header and sign-out form action
- `src/app/(trainee)/trainee/page.tsx` - Trainee home: waiting-for-trainer empty state

## Decisions Made

- **getClaims() vs getUser():** getClaims() validates JWT signature locally via WebCrypto API — no Supabase network call on every request. Only hits network if session near expiry (refresh needed). This is the correct choice per RESEARCH.md and official Supabase SSR docs.

- **Route group page placement:** Next.js 16 does not allow two route groups with a page resolving to the same URL path. Placing `page.tsx` directly in `(trainer)/` and `(trainee)/` both resolve to `/` causing a build error. Fixed by placing pages at `(trainer)/trainer/page.tsx` and `(trainee)/trainee/page.tsx` which resolve to `/trainer` and `/trainee` correctly.

- **middleware.ts retained (not proxy.ts):** Next.js 16 shows a deprecation warning for middleware.ts convention in favor of proxy, but the implementation works correctly. Since the plan specified middleware.ts and this is a minor naming deprecation (not a breaking change), we kept the file name.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed getClaims() TypeScript destructuring incompatibility**
- **Found during:** Task 1 (Middleware auth guard)
- **Issue:** The plan's code used `const { data: { claims }, error } = await supabase.auth.getClaims()` but the getClaims() return type is a union (`{ data: { claims, header, signature }, error: null } | { data: null, error: AuthError }`). TypeScript can't destructure `data.claims` from a union type where `data` may be null.
- **Fix:** Changed to `const claimsResult = await supabase.auth.getClaims(); const claims = claimsResult.data?.claims;` using optional chaining
- **Files modified:** src/middleware.ts
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** e5caaac (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed Next.js 16 parallel page routing conflict**
- **Found during:** Task 2 (Route group shells)
- **Issue:** `(trainer)/page.tsx` and `(trainee)/page.tsx` both resolve to `/`, causing build error: "You cannot have two parallel pages that resolve to the same path"
- **Fix:** Moved pages to `(trainer)/trainer/page.tsx` → `/trainer` and `(trainee)/trainee/page.tsx` → `/trainee`
- **Files modified:** Created trainer/page.tsx and trainee/page.tsx at correct paths; removed incorrectly placed page.tsx files
- **Verification:** `npm run build` exits 0, routes show /trainer and /trainee in build output
- **Committed in:** 1b32ed3 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 type bug, 1 blocking routing conflict)
**Impact on plan:** Both auto-fixes necessary for TypeScript correctness and build success. No scope creep. Route group structure functionally identical to plan intent — URLs /trainer and /trainee are correct.

## Issues Encountered

- Next.js 16 deprecation warning for middleware.ts convention (renamed to proxy in Next.js 16). Build succeeds, behavior correct. Noted for future upgrade path.
- Plan 02 (auth pages) was confirmed complete with commits already in git history before Plan 03 execution. STATE.md showed outdated position (Plan: 1 of 3).

## User Setup Required

None - no external service configuration required for this plan. Middleware auth guard requires existing Supabase environment variables (already set up in Plan 01).

## Next Phase Readiness

- Full auth loop is functional: sign in (Plan 02) -> middleware redirects to role home (this plan) -> sign out -> back to /login
- Plan 04 (invite links) can now build on the /trainer route group — replace the disabled invite button with a functional one
- Middleware pattern established: getClaims() in middleware, role-based redirects, email gate

## Self-Check: PASSED

All created files verified to exist:
- FOUND: src/middleware.ts
- FOUND: src/app/(trainer)/layout.tsx
- FOUND: src/app/(trainer)/trainer/page.tsx
- FOUND: src/app/(trainee)/layout.tsx
- FOUND: src/app/(trainee)/trainee/page.tsx
- FOUND: .planning/phases/01-foundation/01-03-SUMMARY.md

All task commits verified in git history:
- FOUND: e5caaac (feat(01-03): middleware auth guard)
- FOUND: 1b32ed3 (feat(01-03): trainer and trainee route group shells)

---
*Phase: 01-foundation*
*Completed: 2026-03-09*
