# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** A trainee can open the app mid-workout, see exactly what they did last week on each exercise, and log today's results in under a minute.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 5 of 5 in current phase — PHASE COMPLETE
Status: Phase 01 Foundation complete — all 5 plans executed, CONN-01 through CONN-04 satisfied
Last activity: 2026-03-09 — Plan 05 (Invite Claim Page + Live Trainer Roster) executed

Progress: [████░░░░░░] 28%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 9.2 min
- Total execution time: 0.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 5/5 | 46 min | 9.2 min |

**Recent Trend:**
- Last 5 plans: 01-01 (13 min), 01-02 (4 min), 01-03 (25 min), 01-04 (2 min), 01-05 (2 min)
- Trend: gap-closure plans fast when patterns already established

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Smartwatch integration deferred out of v1 entirely — no requirements mapped
- [Roadmap]: Exercise Library is a standalone Phase 2 (not merged into Plan Builder) to create a clean reusable-library-first build order
- [Roadmap]: PWA offline capability is part of Phase 4 delivery (logging must work offline at the gym) — no separate offline phase since no standalone offline requirements exist in v1
- [01-01]: Used NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY env var name (new Supabase dashboard naming, matches current docs)
- [01-01]: Hand-written migration SQL instead of drizzle-kit generate — allows RLS policies in same file as table DDL
- [01-01]: Next.js 16.1.6 installed (create-next-app@latest default; plan said 15, 16 is current stable — no functional difference)
- [01-01]: Admin client (service_role) used for all INSERT operations that bypass RLS — no INSERT policies defined on trainer_trainee_connections
- [01-02]: Shared SignupForm component accepts role + action props — avoids duplication between trainer and trainee pages
- [01-02]: signOut Server Action exported from login/actions.ts for app shell use in Plan 03
- [01-02]: Zod v4 uses .issues (not .errors) on ZodError — fixed in signup actions
- [01-02]: getClaims() return accessed with optional chaining — TypeScript strict mode requires nullable handling
- [01-03]: getClaims() used in middleware (not getUser/getSession) — local JWT validation, no network per request
- [01-03]: Route group pages placed under trainer/trainee segments — Next.js 16 parallel page conflict prevented
- [01-03]: middleware.ts convention retained (deprecation warning in Next.js 16 for proxy rename, build still succeeds)
- [01-04]: getClaims() accessed via claimsResult.data?.claims optional chaining in Server Actions — consistent with middleware pattern, required by TypeScript strict mode
- [01-04]: adminClient (service_role) used for invite_links INSERT — no INSERT RLS policy exists, admin client is the intended bypass path
- [01-04]: Server Action returns relative /join/[token] path; client prepends window.location.origin to avoid hardcoding host
- [01-05]: PostgREST join returns users as array[] not single object — TraineeRow.users typed as array, first element extracted via [0] ?? null
- [01-05]: Race condition on simultaneous invite claim — unique constraint violation (23505) treated as idempotent success, redirects to /trainee

### Roadmap Evolution

- Phase 01.1 inserted after Phase 1: UI Design System — dark color scheme, improved contrast, consistent visual language across all auth and app pages (URGENT)

### Pending Todos

- [01-01]: Apply database migration via Supabase SQL Editor — paste src/lib/db/migrations/0001_initial.sql into SQL Editor and run

### Blockers/Concerns

- [01-01 Pending]: Migration not yet applied to Supabase — database tables don't exist yet; user must apply via SQL Editor before Plan 02 auth flows can be tested
- [Pre-Phase 3]: Plan edit behavior for active trainees is an unresolved product decision (snapshot-at-assignment vs. versioned plans) — must be resolved before Phase 3 planning begins
- [Pre-Phase 4]: Week calculation timezone strategy (start_date is a date type, no timezone) must be defined before Phase 4 implementation

## Session Continuity

Last session: 2026-03-09
Stopped at: Completed 01-foundation/05-PLAN.md — invite claim page (/join/[token]) and live trainer roster, CONN-03 and CONN-04 satisfied. Phase 01 Foundation complete.
Resume file: None
