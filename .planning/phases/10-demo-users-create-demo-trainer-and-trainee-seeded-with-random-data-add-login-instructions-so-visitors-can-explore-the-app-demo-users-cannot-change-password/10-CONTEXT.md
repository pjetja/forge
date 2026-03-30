# Phase 10: Demo Users - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 10 delivers a "try the app" experience for unauthenticated visitors:

1. **Demo accounts** — One demo trainer and one demo trainee, created via Supabase admin client, pre-seeded with realistic workout data. These accounts are permanent (not ephemeral).

2. **Landing page demo section** — A dedicated section on the `/` landing page with two CTAs: "Test as Trainer" and "Test as Trainee". Clicking either auto-logs the visitor in as the corresponding demo account. Must include Polish and English translations.

3. **Password change protection** — Demo users cannot change their password. Enforced via `is_demo: true` flag in Supabase user metadata, checked in server actions. Password change UI is hidden for demo users as an additional layer.

4. **Seeded data** — Realistic volume: 1 workout plan with 2–3 schemas, approximately 2 weeks of logged sessions with varied weights/reps showing progression, and a series of body weight entries that produce a visible chart trend.

5. **Static data** — No reset mechanism. Data is seeded once at setup and accumulates naturally as visitors interact.

</domain>

<decisions>
## Implementation Decisions

### Landing page demo section

- A dedicated section on the home page `/` positioned after the existing features/CTA section
- Contains two CTAs side by side: **"Test as Trainer"** and **"Test as Trainee"** (Polish: **"Wypróbuj jako Trener"** and **"Wypróbuj jako Podopieczny"**)
- Clicking a CTA auto-logs the visitor in using the demo credentials (server action that calls Supabase `signInWithPassword` with hardcoded demo credentials, then redirects to the appropriate dashboard)
- No credentials shown to the user — the login is seamless/invisible
- i18n keys must be added to both `pl/common.json` and `en/common.json`

### Password change protection

- Demo users have `user_metadata.is_demo = true` set on their Supabase auth account (set via admin client during seeding)
- All server actions that modify auth credentials (password change, email change) check for this flag and return an error if `is_demo` is true
- In the UI, the password change option/button is hidden when the logged-in user has `is_demo: true` in their session metadata
- This is defence in depth: server action guard (primary) + UI hide (secondary)

### Seeded data — trainer side

- **1 workout plan**: e.g., "Push/Pull/Legs Program" with 3 schemas:
  - "Push Day" — 3–4 exercises (e.g., Bench Press, Overhead Press, Tricep Pushdown)
  - "Pull Day" — 3–4 exercises (e.g., Barbell Row, Pull-up, Bicep Curl)
  - "Legs Day" — 3 exercises (e.g., Squat, Romanian Deadlift, Leg Press)
- Plan is assigned to the demo trainee
- Trainer profile: name "Demo Trainer", no bio required

### Seeded data — trainee side

- **~2 weeks of workout sessions** (approximately 6–8 sessions across the 3 schemas), with:
  - Realistic progressive overload — weights increase slightly session to session
  - Varied reps (e.g., sometimes hitting target, sometimes exceeding)
  - Sessions dated in the past (e.g., last 14 days)
- **Body weight entries**: ~14 daily entries over the past 2 weeks showing a slight downward trend (e.g., 84.2 → 83.5 kg), enough to render a visible chart trend
- Trainee profile: name "Demo Trainee"

### Demo data freshness

- Static — seeded once at setup, never automatically reset
- Visitors can interact (log new sessions, add body weight), data accumulates
- No cron job, no reset endpoint

### Seed delivery mechanism

- A standalone seed script (e.g., `src/lib/db/seeds/demo.ts` or `scripts/seed-demo.ts`) that can be run with `pnpm tsx scripts/seed-demo.ts` (or similar)
- Uses `createAdminClient()` (already exists at `src/lib/supabase/admin.ts`) to create Supabase auth users and insert DB rows bypassing RLS
- Idempotent: checks whether demo accounts already exist before creating, skips if already seeded
- Credentials stored in `.env.local` as `DEMO_TRAINER_EMAIL`, `DEMO_TRAINER_PASSWORD`, `DEMO_TRAINEE_EMAIL`, `DEMO_TRAINEE_PASSWORD` (or hardcoded constants in the script — Claude's Discretion)

### Claude's Discretion

- Exact visual design of the demo section on the landing page (card, banner, or inline block)
- Whether the "Test as Trainer/Trainee" CTAs use a different visual style from the "Sign up" CTAs (e.g., secondary/outlined vs. primary)
- Exact exercise names and weight values in the seed data
- Whether trainer body weight access is pre-granted for demo accounts or left for the visitor to request

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth & Supabase

- `src/lib/supabase/admin.ts` — `createAdminClient()` used by seed script and server action guards
- `src/lib/supabase/server.ts` — Server-side client for reading session metadata in server actions
- `src/app/(auth)/login/actions.ts` — Existing login server action pattern to replicate/extend for demo login

### Landing page

- `src/app/page.tsx` — Landing page to extend with the demo section
- `messages/pl/common.json` — Polish translations (add demo section keys here)
- `messages/en/common.json` — English translations (add demo section keys here)

### DB schema

- `src/lib/db/schema.ts` — Drizzle schema for all tables (plans, schemas, exercises, sessions, sets, body_weight_logs, etc.)
- `src/lib/db/seeds/exercises.sql` — Existing seed pattern to follow

### Profile pages (for password change guard)

- `src/app/(trainer)/trainer/profile/` — Trainer profile page where password change lives
- `src/app/(trainee)/trainee/profile/` — Trainee profile page where password change lives

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `createAdminClient()` (`src/lib/supabase/admin.ts`) — Already set up for bypassing RLS; use in seed script
- `DateRangeToggle` component — Already used on body weight tab, no changes needed
- Landing page (`src/app/page.tsx`) — Existing section structure to extend

### Established Patterns

- Server actions in this codebase check auth via `createClient()` and `getUser()` — the `is_demo` guard follows the same pattern, checking `user.user_metadata.is_demo` after `getUser()`
- Translations added to `messages/pl/common.json` and `messages/en/common.json` with matching key structure; consumed via `getTranslations('common')` in server components

### Integration Points

- Landing page `/` — new demo section renders after existing features section
- Profile server actions — add `is_demo` guard before password/email change logic
- New `scripts/seed-demo.ts` — standalone, not imported by app code

</code_context>

<specifics>
## Specific Ideas

- Demo section CTA labels (both languages agreed during discussion):
  - EN: "Test as Trainer" / "Test as Trainee"
  - PL: "Wypróbuj jako Trener" / "Wypróbuj jako Podopieczny"
- Seed data should show visible progressive overload so the trainer progress charts demonstrate real value
- Body weight trend should be slightly downward (weight loss scenario) to make the chart meaningful

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 10-demo-users_
_Context gathered: 2026-03-30_
