---
phase: 01-foundation
verified: 2026-03-09T23:15:00Z
status: human_needed
score: 5/5 success criteria verified
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "A trainer can add a trainee directly by email or generate an invite link/code that a trainee can use to join"
    - "A trainer can view their full roster of connected trainees, and trainees from different trainers cannot see each other's data"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Apply migration SQL and confirm RLS is active"
    expected: "All four tables (trainers, users, invite_links, trainer_trainee_connections) appear in Supabase Table Editor with the lock icon. The trainee_unique_connection UNIQUE constraint is visible on trainer_trainee_connections."
    why_human: "Migration was not applied during execution due to database password issues. Cannot verify programmatically without live database access."
  - test: "Email/password signup flow end-to-end"
    expected: "A new user can sign up as trainer at /signup/trainer with email+password, receive a verification email, click the link, and land at /trainer. Role stored in app_metadata is 'trainer'."
    why_human: "Requires Supabase email sending and live auth flow; cannot verify statically."
  - test: "Google OAuth signup flow end-to-end"
    expected: "Google OAuth button on /signup/trainer initiates PKCE flow. After Google consent, user lands at /trainer with role='trainer' in app_metadata. Returning users are not re-assigned a role."
    why_human: "Requires live Google OAuth and Supabase PKCE exchange; cannot verify statically."
  - test: "Session persistence across browser restarts"
    expected: "After login, closing and reopening the browser keeps the user logged in and middleware routes them to their correct home (/trainer or /trainee) without re-entering credentials."
    why_human: "Requires browser session behavior testing; cannot verify statically."
  - test: "Sign-out from trainer and trainee home"
    expected: "Clicking 'Sign out' from either /trainer or /trainee redirects to /login and clears the session. Navigating back to /trainer afterwards redirects to /login."
    why_human: "Requires live browser interaction to confirm session clearance."
  - test: "Cross-role access prevention"
    expected: "A logged-in trainer who navigates to /trainee is redirected to /trainer. A logged-in trainee who navigates to /trainer is redirected to /trainee."
    why_human: "Requires live middleware behavior with authenticated sessions."
  - test: "Invite link generation end-to-end"
    expected: "Clicking '+ Invite trainee' on /trainer opens a dialog. A link of the form https://[host]/join/[uuid] appears. In Supabase Table Editor, a new row exists in invite_links with the correct trainer_auth_uid and a UUID token."
    why_human: "Requires live Supabase database and browser interaction; cannot verify the INSERT without a running instance."
  - test: "Trainee invite claim flow — new user"
    expected: "Clicking a /join/[token] link while logged out redirects to /signup/trainee?invite=[token]. Completing signup auto-connects the trainee. Trainer sees the trainee in their roster."
    why_human: "Requires live auth flow and database INSERT; cannot verify end-to-end statically."
  - test: "Trainee invite claim flow — logged-in trainee"
    expected: "Clicking a /join/[token] link while logged in as trainee (no existing connection) creates the connection row and redirects to /trainee. The trainer's roster shows the newly connected trainee."
    why_human: "Requires live database and session."
  - test: "Trainer roster — live data"
    expected: "After a trainee claims an invite link, /trainer shows a card with the trainee's initials, name, email, and join date. An empty state ('No trainees yet') appears only when zero connections exist."
    why_human: "Requires live database connection rows to confirm dynamic rendering works correctly."
---

# Phase 1: Foundation Verification Report

**Phase Goal:** Trainers and trainees can securely access the app with isolated accounts, and trainers can connect with their clients
**Verified:** 2026-03-09T23:15:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (Plans 04 and 05 executed since initial verification)

---

## Re-verification Summary

The two gaps identified in the initial verification have been closed:

- **Gap 1 (CONN-01/CONN-02):** A `generateInviteLink` Server Action now exists at `src/app/(trainer)/trainer/actions.ts`. An `InviteDialog` Client Component at `src/app/(trainer)/trainer/_components/InviteDialog.tsx` replaces the previously disabled placeholder button. The action inserts a UUID token into `invite_links` using the admin client and returns a `/join/[token]` URL. The InviteDialog imports and calls the action, displays the link, and provides copy-to-clipboard. All wiring is verified.

- **Gap 2 (CONN-03/CONN-04):** A `/join/[token]` invite claim page now exists at `src/app/join/[token]/page.tsx`. It handles all 6 invite states (invalid token, not logged in, trainer role, already connected same trainer, already connected different trainer, new connection). The trainer home page at `src/app/(trainer)/trainer/page.tsx` now queries `trainer_trainee_connections` joined with `users` via RLS and renders real trainee cards — the hardcoded empty stub and disabled button have been fully replaced.

No regressions were found in previously-passing artifacts from Plans 01-03.

---

## Goal Achievement

### Success Criteria

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| 1 | A user can sign up with email and password, choosing either trainer or trainee role, and their role is enforced across all sessions | ? HUMAN | Auth flow code is complete and substantive. Role set via Admin API in `app_metadata`. Middleware reads role from claims. Cannot verify end-to-end without live Supabase instance and applied migration. |
| 2 | A logged-in user stays logged in across browser sessions and device restarts without re-entering credentials | ? HUMAN | Middleware creates Supabase server client with cookie mutation enabling 30-day silent refresh. Pattern is correct. Cannot verify session persistence without browser testing. |
| 3 | A user can log out from any page and is immediately redirected away from protected content | ? HUMAN | `signOut` Server Action exists, exported, and wired via `form action={signOut}` in both trainer and trainee layouts. Middleware redirects unauthenticated users to /login. Code is correct. Needs live testing. |
| 4 | A trainer can add a trainee directly by email or generate an invite link/code that a trainee can use to join | VERIFIED | `generateInviteLink` Server Action inserts into `invite_links` using admin client. `InviteDialog` component calls the action and displays the full URL. Invite link at `/join/[token]` redirects unauthenticated trainees to `/signup/trainee?invite=[token]`. |
| 5 | A trainer can view their full roster of connected trainees, and trainees from different trainers cannot see each other's data | VERIFIED (code) | `trainer/page.tsx` queries `trainer_trainee_connections` joined with `users`. RLS policies in migration SQL enforce trainer isolation. Migration not yet confirmed applied. |

**Score:** 5/5 success criteria have complete code-level implementations. 3/5 require human verification of live behavior (SC1-SC3 unchanged from initial verification). SC4 and SC5 are now code-complete.

---

## Required Artifacts

### Plan 01 Artifacts (Scaffold + Schema + Clients) — Regression Check

| Artifact | Status | Notes |
|----------|--------|-------|
| `src/lib/supabase/client.ts` | VERIFIED | Unchanged since initial verification |
| `src/lib/supabase/server.ts` | VERIFIED | Unchanged since initial verification |
| `src/lib/supabase/admin.ts` | VERIFIED | Unchanged since initial verification |
| `src/lib/db/schema.ts` | VERIFIED | Unchanged since initial verification |
| `src/lib/db/migrations/0001_initial.sql` | VERIFIED | Unchanged since initial verification |
| `drizzle.config.ts` | VERIFIED | Unchanged since initial verification |
| `.env.local.example` | VERIFIED | Unchanged since initial verification |

### Plan 02 Artifacts (Auth Pages) — Regression Check

| Artifact | Status | Notes |
|----------|--------|-------|
| `src/app/(auth)/signup/trainer/actions.ts` | VERIFIED | Unchanged since initial verification |
| `src/app/(auth)/signup/trainee/actions.ts` | VERIFIED | Unchanged since initial verification |
| `src/app/auth/callback/route.ts` | VERIFIED | Unchanged since initial verification |
| `src/app/(auth)/login/actions.ts` | VERIFIED | Unchanged since initial verification |
| `src/components/auth/SignupForm.tsx` | VERIFIED | Unchanged since initial verification |

### Plan 03 Artifacts (Middleware + Route Shells) — Regression Check

| Artifact | Status | Notes |
|----------|--------|-------|
| `src/middleware.ts` | VERIFIED | Unchanged since initial verification |
| `src/app/(trainer)/layout.tsx` | VERIFIED | Unchanged since initial verification |
| `src/app/(trainee)/layout.tsx` | VERIFIED | Unchanged since initial verification |
| `src/app/(trainee)/trainee/page.tsx` | VERIFIED | Unchanged since initial verification |

### Plan 04 Artifacts (Invite Link Generation) — New

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(trainer)/trainer/actions.ts` | `generateInviteLink` Server Action | VERIFIED | `'use server'` directive present. Exports `generateInviteLink`. Uses `claimsResult.data?.claims` (TypeScript strict mode compliant). Calls `adminClient.from('invite_links').insert(...)`. Returns `{ url: '/join/${token}' }` or `{ error: string }`. 33 lines — substantive. |
| `src/app/(trainer)/trainer/_components/InviteDialog.tsx` | Client component for invite generation UI | VERIFIED | `'use client'` directive present. Exports `InviteDialog`. Imports and calls `generateInviteLink`. Uses `useTransition` for non-blocking action call. Shows loading state, error state, and generated link. Copy-to-clipboard with `Copied!` feedback. 91 lines — substantive. |

### Plan 05 Artifacts (Invite Claim + Live Roster) — New

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/join/[token]/page.tsx` | Invite claim page — all 6 states handled | VERIFIED | Server Component. Awaits async params. Uses `adminClient` for invite_links lookup and trainer_trainee_connections INSERT. Handles: invalid/revoked token (error UI), not logged in (redirect to signup with token), trainer role (redirect to /trainer), already connected same trainer (idempotent redirect to /trainee), already connected different trainer (conflict screen), new connection (insert + redirect to /trainee). Unique constraint violation (23505) treated as success. 117 lines — substantive. |
| `src/app/(trainer)/trainer/page.tsx` | Trainer home with live roster query | VERIFIED | Server Component. Imports `InviteDialog`. Queries `trainer_trainee_connections` with `users` join via FK hint `users!trainer_trainee_connections_trainee_auth_uid_fkey`. Uses `(connections ?? []) as TraineeRow[]`. Renders: error banner, empty state (0 trainees), or trainee cards with initials avatar / name / email / join date. No hardcoded empty state, no disabled button. 103 lines — substantive. |

---

## Key Link Verification

### Plan 04 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `InviteDialog.tsx` | `trainer/actions.ts` | `import { generateInviteLink }` | WIRED | Line 3: `import { generateInviteLink } from '../actions'`; Line 19: `const result = await generateInviteLink()` |
| `trainer/actions.ts` | `invite_links` table | `adminClient.from('invite_links').insert` | WIRED | Line 20: `.from('invite_links')` with `.insert({ trainer_auth_uid, token })` |
| `trainer/page.tsx` | `InviteDialog.tsx` | `import { InviteDialog }` | WIRED | Line 2: `import { InviteDialog } from './_components/InviteDialog'`; Line 36: `<InviteDialog />` |

### Plan 05 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `join/[token]/page.tsx` | `invite_links` table | `adminClient.from('invite_links').select` | WIRED | Line 17: `.from('invite_links').select('id, trainer_auth_uid, revoked_at').eq('token', token).single()` |
| `join/[token]/page.tsx` | `trainer_trainee_connections` table | `adminClient.from('trainer_trainee_connections').insert` | WIRED | Lines 56 (SELECT existing) and 89 (INSERT new connection) |
| `trainer/page.tsx` | `trainer_trainee_connections` joined with `users` | `supabase.from('trainer_trainee_connections').select` | WIRED | Lines 19-28: `.from('trainer_trainee_connections').select('trainee_auth_uid, connected_at, users!...fkey(name, email)')` |

### Plans 01-03 Key Links — Regression Check

All key links previously verified remain intact. No changes detected to `src/middleware.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, or either layout file.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| AUTH-01 | Plan 02 | User can sign up with email and password | SATISFIED (code) | `signUpTrainer` and `signUpTrainee` Server Actions call `supabase.auth.signUp`; Zod-validated forms exist at /signup/trainer and /signup/trainee |
| AUTH-02 | Plan 02 | User selects role at signup (trainer or trainee) | SATISFIED (code) | Role assigned to `app_metadata` via Admin API in both signup actions and in OAuth callback; middleware reads role from claims |
| AUTH-03 | Plans 02, 03 | User can log in and stay logged in across sessions | SATISFIED (code) | `signInWithPassword` in login actions; middleware cookie mutation enables 30-day silent refresh; Google OAuth PKCE flow complete |
| AUTH-04 | Plans 02, 03 | User can log out from any page | SATISFIED (code) | `signOut` exported from `login/actions.ts`; wired via `form action={signOut}` in both trainer and trainee layout.tsx files |
| CONN-01 | Plan 04 | Trainer can add a trainee directly by email | NOTE: Satisfied via invite link | REQUIREMENTS.md marks this complete. The actual implementation is invite link generation, not a direct "add by email" flow. Plan 04 interprets CONN-01 as "trainer can add a trainee" (via invite link). No email-based direct add exists. The project owner has accepted this via REQUIREMENTS.md update. |
| CONN-02 | Plan 04 | Trainer can generate an invite code/link for a trainee to join | SATISFIED | `generateInviteLink` Server Action inserts UUID token into `invite_links` using admin client. `InviteDialog` displays shareable `/join/[token]` URL. |
| CONN-03 | Plan 05 | Trainee can join a trainer by entering an invite code or clicking invite link | SATISFIED | `/join/[token]` page validates token, redirects unauthenticated users to `/signup/trainee?invite=[token]`, creates `trainer_trainee_connections` row for authenticated trainees. |
| CONN-04 | Plan 05 | Trainer can view their roster of connected trainees | SATISFIED (code) | `trainer/page.tsx` queries `trainer_trainee_connections` joined with `users` via RLS; renders trainee cards with initials, name, email, join date. |

**CONN-01 interpretation note:** The literal requirement is "add a trainee directly by email" but REQUIREMENTS.md has been updated by the project owner to mark it complete via invite link generation (Plan 04). No email-based direct-add Server Action was built. If the project owner intended "add by email" as a distinct feature from invite links, this requirement remains partially unfulfilled. As-is, the invite link flow satisfies the spirit of "trainer can add a trainee" though not the literal email mechanism.

**Orphaned Requirements:** None. All 8 requirement IDs (AUTH-01 through AUTH-04, CONN-01 through CONN-04) are claimed by plans and have implementation evidence.

---

## Anti-Patterns Found

No blocker or warning anti-patterns found in the new artifacts (Plans 04 and 05). No remaining `disabled` buttons, "Plan XX will replace this" comments, hardcoded empty states that ignore DB data, or stub implementations.

The previously-flagged warning in `src/app/(auth)/signup/trainer/actions.ts` (non-fatal profile creation failure silently ignored) remains but was present in initial verification. It does not block any CONN requirement.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/(auth)/signup/trainer/actions.ts` | 56-58 | `console.error('Trainer profile creation failed:')` — profile row failure is non-fatal | WARNING | If profile creation silently fails, `trainers` table row won't exist; downstream trainer roster queries may return empty. Pre-existing from Plan 02, unchanged. |

---

## Human Verification Required

### 1. Database Migration Applied

**Test:** Open Supabase Dashboard for the project → Table Editor.
**Expected:** All four tables exist: `trainers`, `users`, `invite_links`, `trainer_trainee_connections`. Each table shows the lock icon (RLS enabled). The `trainer_trainee_connections` table has `trainee_unique_connection` visible in its constraints.
**Why human:** Migration SQL (0001_initial.sql) was not confirmed applied during execution. All CONN requirements depend on this schema existing in the live database.

### 2. Email/Password Signup and Role Enforcement

**Test:** Sign up as trainer at `/signup/trainer` with email+password. Verify email. Attempt to navigate to `/trainee`.
**Expected:** After email verification, user lands at `/trainer`. Navigating to `/trainee` redirects back to `/trainer`. Role in Supabase Auth user's `app_metadata.role` is `'trainer'`.
**Why human:** Requires live Supabase email sending and session management.

### 3. Google OAuth Signup with Role Context

**Test:** Click "Continue with Google" on `/signup/trainer`. Complete Google consent. Verify Supabase user's `app_metadata.role` is `'trainer'`. Log out, then log in again with the same Google account — confirm role is NOT re-assigned.
**Expected:** First login assigns role. Subsequent logins skip role assignment (`existingRole` guard works).
**Why human:** Requires live Google OAuth and Supabase PKCE exchange.

### 4. Session Persistence

**Test:** Log in as any user. Close browser completely. Reopen and navigate to the app root (`/`).
**Expected:** User is redirected to their role home (`/trainer` or `/trainee`) without re-authenticating. Token refresh is silent.
**Why human:** Browser session behavior cannot be verified statically.

### 5. Sign-Out Clears Session

**Test:** Log in, then click "Sign out" on the home page. Attempt to navigate to `/trainer` directly.
**Expected:** Redirected to `/login` immediately.
**Why human:** Requires live session clearance testing.

### 6. Invite Link Generation End-to-End

**Test:** As a logged-in trainer at `/trainer`, click `+ Invite trainee`. Observe the dialog.
**Expected:** A dialog opens showing "Generating link…" briefly. A full URL of the form `https://[host]/join/[uuid]` appears with a "Copy link" button. After clicking "Copy link", the button reads "Copied!" for 2 seconds. In Supabase Table Editor, a new row in `invite_links` has the correct `trainer_auth_uid` UUID and the matching token, with `revoked_at` NULL.
**Why human:** Requires live Supabase database and browser interaction.

### 7. Trainee Invite Claim — Unauthenticated User

**Test:** Copy an invite link (`/join/[uuid]`). Open an incognito window and navigate to it.
**Expected:** Redirected to `/signup/trainee?invite=[uuid]`. After completing signup, the trainee is connected to the trainer. The trainer's `/trainer` page shows the new trainee card.
**Why human:** Requires live auth signup flow and database INSERT.

### 8. Trainee Invite Claim — Logged-In Trainee

**Test:** Log in as a trainee (no existing connection). Navigate directly to a valid `/join/[uuid]` invite link.
**Expected:** Connection row inserted in `trainer_trainee_connections`. Redirected to `/trainee`. Trainer's `/trainer` page shows the trainee card with initials, name, email, and today's join date.
**Why human:** Requires live database INSERT and session.

### 9. Trainer Roster — Live Data Display

**Test:** After completing the invite claim test above, refresh `/trainer` as the trainer.
**Expected:** The page shows a trainee card (not the "No trainees yet" empty state) with the trainee's initials avatar, full name, email, and "Joined [date]" formatted in British date format.
**Why human:** Requires live database connection rows to confirm the Supabase PostgREST join query returns data and renders correctly.

### 10. Cross-Role Access Prevention

**Test:** As a logged-in trainer, navigate to `/trainee`. As a logged-in trainee, navigate to `/trainer`.
**Expected:** Trainer is redirected to `/trainer`. Trainee is redirected to `/trainee`.
**Why human:** Requires live middleware behavior with authenticated sessions.

---

## Gaps Summary

No gaps remain. All 5 success criteria are code-complete and their implementation has been verified against the actual source files:

- SC1 (email/password signup with role): code complete — human verification needed for live flow
- SC2 (session persistence): code complete — human verification needed for browser behavior
- SC3 (sign-out): code complete — human verification needed for live session clearance
- SC4 (invite link generation and trainee join): code complete and fully wired — human verification needed for live database interaction
- SC5 (trainer roster): code complete and fully wired — human verification needed for live data rendering

The only remaining blocker for declaring Phase 1 fully done is applying the database migration (`0001_initial.sql`) to the Supabase instance. All 10 human verification tests above depend on this being done first.

---

_Verified: 2026-03-09T23:15:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — initial verification found gaps_found (3/5), gaps closed by Plans 04 and 05_
