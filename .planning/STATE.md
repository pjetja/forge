---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 12 added — ready to plan post-release bug fixes
last_updated: "2026-03-30"
last_activity: 2026-03-30
progress:
  total_phases: 19
  completed_phases: 18
  total_plans: 53
  completed_plans: 53
  percent: 95
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28)

**Core value:** A trainee can open the app mid-workout, see exactly what they did last week on each exercise, and log today's results in under a minute.
**Current focus:** Phase 08 — training-logs-and-body-weight-progression-tracking

## Current Position

Phase: 12
Plan: planning — run /gsd:plan-phase 12 to create plans
Status: Phase 12 (after-release fixes) added, pending planning
Last activity: 2026-03-30

Progress: [█████████░] 95%

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: 8 min
- Total execution time: 0.8 hours

**By Phase:**

| Phase                 | Plans | Total  | Avg/Plan |
| --------------------- | ----- | ------ | -------- |
| 01-foundation         | 5/5   | 46 min | 9.2 min  |
| 01.1-ui-design-system | 3/3   | 19 min | 6.3 min  |
| 01.3-figma-ui-library | 2/2   | 34 min | 17 min   |
| 02-exercise-library   | 3/3   | 12 min | 4 min    |

**Recent Trend:**

- Last 5 plans: 01-05 (2 min), 01.1-01 (2 min), 01.1-02 (2 min), 01.1-03 tasks 1-2 (2 min), 01.1-03 task 3 fixes (15 min)
- Trend: human-verify checkpoints add time for visual review and polish cycles; core restyling remains fast

_Updated after each plan completion_
| Phase 01.2-logo-generation P02 | 5 | 2 tasks | 5 files |
| Phase 01.3-figma-ui-library P01 | 4 | 2 tasks (T2+T3) | 4 files |
| Phase 01.3-figma-ui-library P02 | 30min | 2 tasks | 1 files |
| Phase 02-exercise-library P01 | 5min | 2 tasks | 3 files |
| Phase 02-exercise-library P02 | 2 | 3 tasks | 4 files |
| Phase 03-plan-builder P01 | 25min | 2 tasks | 4 files |
| Phase 03-plan-builder P02 | 8 | 2 tasks | 3 files |
| Phase 03-plan-builder P03 | 2 | 2 tasks | 6 files |
| Phase 03-plan-builder P04 | 3 | 2 tasks | 5 files |
| Phase 03-plan-builder P05 | 3min | 2 tasks | 6 files |
| Phase 03 P06 | 1 | 0 tasks | 0 files |
| Phase 04-trainee-workout-logging P01 | 2 | 2 tasks | 2 files |
| Phase 04-trainee-workout-logging P02 | 5 | 2 tasks | 2 files |
| Phase 04-trainee-workout-logging P03 | 2min | 2 tasks | 4 files |
| Phase 04-trainee-workout-logging P04 | 2min | 2 tasks | 2 files |
| Phase 04-trainee-workout-logging P04 | 2 | 2 tasks | 2 files |
| Phase 05 P01 | 25 | 3 tasks | 7 files |
| Phase 05 P02 | 3 | 2 tasks | 5 files |
| Phase 06-trainee-and-trainer-profile-pages P01 | 2 | 2 tasks | 4 files |
| Phase 06-trainee-and-trainer-profile-pages P02 | 5 | 2 tasks | 7 files |
| Phase 06 P03 | 3 | 2 tasks | 4 files |
| Phase 06 P04 | 2 | 2 tasks | 5 files |
| Phase 07 P01 | 1 | 2 tasks | 2 files |
| Phase 07 P02 | 5 | 3 tasks | 3 files |
| Phase 08-training-logs-and-body-weight-progression-tracking P01 | 8 | 2 tasks | 4 files |
| Phase 08-training-logs-and-body-weight-progression-tracking P02 | 2 | 2 tasks | 5 files |
| Phase 08-training-logs-and-body-weight-progression-tracking P03 | 2 | 1 tasks | 4 files |
| Phase 09-internationalization P01 | 4 | 2 tasks | 17 files |
| Phase 09-internationalization P02 | 15 | 2 tasks | 20 files |
| Phase 09-internationalization P04 | 45min | 2 tasks | 46 files |
| Phase 09 P05 | 30 | 2 tasks | 11 files |
| Phase 11-deploy P01 | 5m | 5 tasks | 3 files |

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
- [Phase 01.1-01]: @theme inline used (not plain @theme) because --font-sans references var(--font-lato) — plain @theme breaks chained CSS variable resolution
- [Phase 01.1-01]: lato.variable class applied to <html> element so @theme inline can resolve var(--font-lato) at root scope
- [Phase 01.1-01]: weight: ['400', '700'] explicitly specified — Lato is not a variable font, omitting weight causes Next.js build error
- [Phase 01.1-02]: 'or' divider span uses bg-bg-surface (card surface) not bg-bg-page — sits on card so must match card background
- [Phase 01.1-02]: Google OAuth button uses ghost style (border only, no background fill) — secondary action pattern for dark cards
- [Phase 01.1-02]: Input focus uses focus:border-accent focus:outline-none — clean emerald border highlight with no blue glow ring
- [Phase 01.1-03]: Inline SVG used for sign-out icon — avoided adding lucide-react dependency for single icon; uses currentColor for hover inheritance
- [Phase 01.1-03]: Logo wrapped in Next.js Link (not <a>) to /trainer and /trainee respectively — client-side navigation with prefetching
- [Phase 01.1-03]: cursor-pointer required explicitly on all button elements — browser default is not always pointer (OS/browser variation)
- [Phase 01.2-01]: ForgeLogo horizontal variant uses inline-flex items-center + h-full SVG icon + text-xl span — SVG dominantBaseline="central" unreliable cross-browser
- [Phase 01.2-01]: Hard-coded hex fills in ForgeLogo (#10b981 emerald, #e2e8f0 slate) — brand constants, not theme-switchable
- [Phase 01.2-01]: icon.svg placed in src/app/ (Next.js file convention) — auto-generates favicon link, no layout.tsx changes needed
- [Phase 01.2-logo-generation]: ForgeLogo uses h-7 (not h-7 w-auto) in nav — w-auto redundant; h-10 on auth pages for more visual breathing room
- [Phase 01.2-logo-generation]: React fragment used on auth pages — auth layout already handles centering, extra div wrapper would double-center
- [Phase 01.3-01]: Official Figma MCP (mcp.figma.com) is read-only for component authoring — write tools cannot create arbitrary nodes; Plugin API bootstrap script is primary path
- [Phase 01.3-01]: figma-bootstrap.js uses setCurrentPageAsync (async) not deprecated figma.currentPage = (sync) for page switching
- [Phase 01.3-01]: generate_figma_design MCP tool noted as potentially useful for importing live app screens in future UI sub-phases
- [Phase 01.3]: Figma file 'Forge UI Library' created in personal Drafts and approved — shareable URL: https://www.figma.com/design/hTbhUu5ow4BhAatBTLjxNe/Forge-UI-Library
- [02-01]: createClient() (not adminClient) used for exercise CRUD — RLS policy enforces trainer ownership, no service role bypass needed
- [02-01]: muscle_group stored as TEXT not PostgreSQL ENUM — TEXT + MUSCLE_GROUPS const + Zod validation avoids DDL migrations for new values
- [02-01]: RLS WITH CHECK required alongside USING for INSERT to work in all Postgres versions (FOR ALL USING alone is insufficient for inserts)
- [02-01]: updated_at set via new Date().toISOString() in Server Action — consistent with existing Phase 1 patterns, no DB trigger needed
- [Phase 02-02]: ExerciseGrid manages editExercise state separately from selectedExercise to cleanly coordinate detail->edit transition
- [Phase 02-02]: extractYouTubeId defined as module-level utility in both files that need it, not shared to avoid coupling
- [Phase 02-03]: ExerciseGrid rendered in all states so 'Add exercise' button is always accessible; empty library illustration appears above grid
- [Phase 02-03]: Active chip state read from useSearchParams() (not initialMuscles prop) — client-side URL is single source of truth after hydration
- [Phase 02-03]: Snake_case to camelCase mapping done in page.tsx — keeps downstream Exercise components clean with typed interface
- [03-01]: snapshot-at-assignment chosen — assigned_plans/schemas/exercises are full copies; trainer edits live in assigned_schema_exercises directly; plan_updated_at bumped to signal trainee
- [03-01]: per_set_weights stored as JSONB number array — supports per-set weight variation (e.g., [80, 82.5, 85]); NULL = single-weight mode; avoids separate table
- [03-01]: assign_plan and duplicate_plan are SECURITY DEFINER RPC functions — atomic multi-table inserts cannot be done safely client-side through RLS
- [Phase 03-02]: per-link isActive() function used in navLinks (not pathname.startsWith(href)) — prevents /trainer matching all trainer/\* routes simultaneously
- [Phase 03-02]: Separate Supabase query for assigned_plans (not JOIN) — in-memory Map used to map one plan per trainee
- [Phase 03-03]: [03-03]: PlanWeekView week tabs are UI-only — all tabs show same schema template; week_count is display metadata, no per-week DB copies
- [Phase 03-03]: [03-03]: AddSchemaButton is a separate client component to keep PlanEditorPage (server component) clean
- [Phase 03-04]: [03-04]: DnD listeners on handle button only — prevents input clicks triggering drag; PointerSensor activationConstraint distance:8 adds second protection layer
- [Phase 03-04]: [03-04]: PostgREST exercises join uses Array.isArray guard — join can return object or array; guard ensures name/muscle_group extracted correctly
- [Phase 03-05]: AssignPlanModal accepts exerciseHistory prop typed as Record<exerciseId, { lastWeight: number } | null> — Phase 3 passes {} (all-null); Phase 4 will inject real history data
- [Phase 03-05]: PlanCard converted to 'use client' component to support inline Duplicate button; stopPropagation prevents Link navigation on duplicate click
- [Phase 04-trainee-workout-logging]: [04-01]: status CHECK constraint includes 'abandoned' — resolves RESEARCH.md open question; needed for abandon-session flow
- [Phase 04-trainee-workout-logging]: [04-01]: Trainer RLS SELECT policies added in same migration as trainee write policies — Phase 5 prep, avoids future migration
- [Phase 04-trainee-workout-logging]: completeSet omits revalidatePath — optimistic UI handles display; revalidate on page navigation only
- [Phase 04-trainee-workout-logging]: Plan activation (pending→active) is inline in startWorkout — atomic with session creation, fewer round trips
- [Phase 04-trainee-workout-logging]: Week boundaries computed in local time — matches gym-day semantics; toISOString() handles UTC conversion for Supabase
- [Phase 04-trainee-workout-logging]: [04-03]: completedSessionsBySchema Map keyed by schemaId avoids double-counting multiple completed sessions for same schema in same week
- [Phase 04-trainee-workout-logging]: Inline confirmation panel (not modal) for FinishWorkoutButton — simpler and gym-friendly; state machine manages idle/confirming/submitting/done
- [Phase 04-trainee-workout-logging]: [04-05]: SetRow type exported from page.tsx — imported by SetList for shared type without a separate types file
- [Phase 04-trainee-workout-logging]: [04-05]: useOptimistic in SetList marks set completed optimistically before server confirms; per-row editable state via useState map keyed by setNumber
- [Phase 04-trainee-workout-logging]: [04-05]: router.refresh() after addSet — reloads server-rendered SetRow[] to include the new set row
- [Phase 05-01]: CrossPlanChartSection extends Record index signature to satisfy ProgressChart generic prop type in TypeScript strict mode
- [Phase 05-01]: Date range filtering done client-side — allChartData serialized from server as prop, no re-fetch on toggle
- [Phase 05-01]: Top-set weight computed per session (max actual_weight_kg across all ASE IDs for base exercise_id) for cross-plan chart
- [Phase 05-02]: Plans tab data always fetched regardless of active tab — needed for in-progress banner check on Plans tab; acceptable cost since plans data is lightweight
- [Phase 05-02]: TraineeExerciseFilterBar and TraineeCrossPlanChart created as separate copies (not reusing trainer-side components) to avoid cross-route-group imports between (trainer) and (trainee) route groups
- [Phase 06-01]: text('date_of_birth') used in Drizzle (not date()) — PostgREST serializes PostgreSQL date columns as ISO strings
- [Phase 06-01]: GravatarAvatar has no use client directive — pure presentational component works in both server and client contexts
- [Phase 06-01]: trainer_updates_own_connection and trainee_sees_connected_trainer RLS policies added in profile migration
- [Phase 06-02]: Layouts converted to async server components to compute gravatarUrl server-side before passing to client nav headers
- [Phase 06-02]: SignOutButton removed from both nav headers; sign-out relocated to profile page bottom
- [Phase 06-02]: useTransition used for TrainerProfileForm submission (not useActionState) — simpler state management for this case
- [Phase 06-03]: TrainerCard self-contains My Trainer heading — component encapsulation and artifact requirement
- [Phase 06-03]: weight_kg cast to Number() before passing as initialWeightKg prop — PostgREST returns numeric as string
- [Phase 06-04]: PhysicalStatsRow is a server component (no use client) — pure presentational with no interactivity needed
- [Phase 06-04]: compliance stats query is a single batch .in() fetch — avoids N+1 per trainee
- [Phase 07-01]: Landing page is a pure server component with no 'use client' directive — no client-side JS shipped for the marketing page
- [Phase 07-01]: '/help' added to publicPaths only — unauthenticated users pass through; authenticated users at /help already fall through correctly via existing middleware logic
- [Phase 08-01]: text('logged_date') used in Drizzle for body_weight_logs — PostgREST returns DATE as ISO strings
- [Phase 08-01]: Migration SQL ordering: body_weight_access_requests CREATE TABLE before trainer SELECT policy on body_weight_logs
- [Phase 08-01]: RPE is toggle-deselectable tap-select (1-10) rather than text input — gym-friendly touch targets (44px)
- [Phase 08-02]: BodyWeightTabContent defined as inline server function in page.tsx — avoids separate server component file while keeping client component imports clean
- [Phase 08-02]: Tab-conditional data fetching: plans always fetched (in-progress banner check), log/body-weight data only fetched when their tab is active
- [Phase 08-02]: Exercises tab reuses TraineeExercisesTab server component inline — standalone exercises route preserved for deep-link back navigation
- [Phase 08-03]: BodyWeightTab created as separate copy (not reusing BodyWeightChart) — maintains no cross-route-group imports convention
- [Phase 08-03]: Body Weight tab dynamically included in TabSwitcher only when access is approved; RequestBodyWeightAccessButton shown on Plans tab
- [Phase 09-01]: Cookie-based locale (NEXT_LOCALE) without URL path segments — simpler routing, no [locale] segment needed
- [Phase 09-01]: 4 namespace JSON files per locale spread-merged in request.ts — flat message object with top-level namespace keys prevents collision
- [Phase 09-01]: Locale prop threaded from server layout through to client nav components — avoids client-side async, locale is server-authoritative
- [Phase 09-02]: Client auth pages retain 'use client' and use useTranslations — avoids architectural changes for pages that already need client-side state
- [Phase 09-02]: VerifyEmailFallback extracted as separate component — React hooks cannot be used inline in JSX props
- [Phase 09-02]: CompletedPlanColumns converted to async server component for getTranslations — callers are all server components, no breaking change
- [Phase 09-04]: TrainerCard converted from sync to async server component for getTranslations — no breaking change, pure presentational server component
- [Phase 09-04]: workoutsPerWeek and weeks format strings extracted as separate i18n keys with {count} interpolation — enables proper Polish pluralization in future
- [Phase 09-05]: min-w-[768px] removed from trainer/trainee layouts — hardcoded minimum width broke mobile viewport and made PL|EN switcher inaccessible on small screens
- [Phase 09-05]: Duplicate count string removed from trainee page — translation value already included {count}; appending literal count in JSX doubled the number

### Roadmap Evolution

- Phase 01.1 inserted after Phase 1: UI Design System — dark color scheme, improved contrast, consistent visual language across all auth and app pages (URGENT)
- Phase 01.2 inserted after Phase 1.1: Logo Generation — design and generate the Forge app logo
- Phase 01.3 inserted after Phase 1.2: Figma UI Library — build component library in Figma matching the dark navy/green design system, used as design source for all future phases
- Phase 02.1 inserted after Phase 2: UI Polish — visual review and polish after Exercise Library is built
- Phase 03.1 inserted after Phase 3: UI Polish — visual review and polish after Plan Builder is built
- Phase 04.1 inserted after Phase 4: UI Polish — visual review and polish after Trainee Workout Logging is built
- Phase 05.1 inserted after Phase 5: UI Polish — visual review and polish after Trainer Progress Visibility is built
- Phase 6 added: trainee and trainer profile pages
- Phase 7 added: main page / landing page with teasers to drive app adoption
- Phase 8 added: Training logs and body weight progression tracking

### Pending Todos

- [01-01]: Apply database migration via Supabase SQL Editor — paste src/lib/db/migrations/0001_initial.sql into SQL Editor and run
- [02-01]: Apply exercises migration via Supabase SQL Editor — paste src/lib/db/migrations/0002_exercises.sql into SQL Editor and run (required before exercises UI can be tested)
- [03-01]: Apply plans migration via Supabase SQL Editor — paste src/lib/db/migrations/0003_plans.sql into SQL Editor and run (required before Plan Builder UI can be tested end-to-end)
- [04-01]: Apply workout sessions migration via Supabase SQL Editor — paste src/lib/db/migrations/0005_workout_sessions.sql into SQL Editor and run (required before Phase 4 UI can be tested)

### Blockers/Concerns

- [01-01 Pending]: Migration not yet applied to Supabase — database tables don't exist yet; user must apply via SQL Editor before Plan 02 auth flows can be tested
- [Pre-Phase 3 RESOLVED]: Plan edit behavior resolved — snapshot-at-assignment chosen; trainer edits assigned_schema_exercises directly; plan_updated_at signals changes to trainee
- [Pre-Phase 4 RESOLVED]: Week calculation timezone strategy resolved — boundaries computed in local time (not UTC) to match gym-day semantics; .toISOString() handles UTC conversion for Supabase

## Session Continuity

Last session: 2026-03-30T15:03:03.686Z
Stopped at: Completed 11-01-PLAN.md
Resume file: None
