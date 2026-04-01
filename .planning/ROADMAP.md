# Roadmap: Forge

## Milestones

- ✅ **v1.0 Forge MVP** — Phases 1–12 (shipped 2026-04-01) — https://forge-three-tau.vercel.app
- 🚧 **v1.1** — In progress — Phases 13–15

## Phases

<details>
<summary>✅ v1.0 Forge MVP — Phases 1–12 — SHIPPED 2026-04-01</summary>

| Phase | Name                        | Plans | Completed  |
| ----- | --------------------------- | ----- | ---------- |
| 1     | Foundation                  | 5/5   | 2026-03-10 |
| 01.1  | UI Design System            | 3/3   | 2026-03-10 |
| 01.2  | Logo Generation             | 2/2   | 2026-03-10 |
| 01.3  | Figma UI Library            | 2/2   | 2026-03-10 |
| 2     | Exercise Library            | 3/3   | 2026-03-11 |
| 02.1  | UI Polish                   | 2/2   | 2026-03-14 |
| 3     | Plan Builder                | 6/6   | 2026-03-13 |
| 03.1  | UI Polish                   | 1/1   | 2026-03-13 |
| 4     | Trainee Workout Logging     | 5/5   | 2026-03-13 |
| 04.1  | UI Polish                   | 2/2   | 2026-03-14 |
| 5     | Trainer Progress Visibility | 2/2   | 2026-03-30 |
| 05.1  | UI Polish                   | 1/1   | 2026-03-18 |
| 6     | Profile Pages               | 4/4   | 2026-03-25 |
| 7     | Landing Page & FAQ          | 2/2   | 2026-03-27 |
| 8     | Training Logs & Body Weight | 3/3   | 2026-03-29 |
| 9     | Internationalization        | 5/5   | 2026-03-30 |
| 10    | Demo Users                  | 3/3   | 2026-03-30 |
| 11    | Deploy                      | 4/4   | 2026-03-31 |
| 12    | After-Release Fixes         | 6/6   | 2026-04-01 |

Full phase details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details open>
<summary>🚧 v1.1 — In Progress</summary>

| Phase | Name                            | Plans | Status     |
| ----- | ------------------------------- | ----- | ---------- |
| 13    | Proxy Trainee                   | TBD   | 📋 Planned |
| 14    | Admin & Global Exercise Library | TBD   | 📋 Planned |
| 15    | Super Trainee User Type         | TBD   | 📋 Planned |

### Phase 13: Proxy Trainee

**Goal:** Trainers can create proxy trainees (athletes without app accounts), log all workout data and body weight on their behalf, and optionally send an activation link that migrates the proxy to a full authenticated trainee account with all historical data intact.

**Depends on:** Phase 12

**Key requirements:**

- Trainer can create a proxy trainee (no real auth account — trainer-managed)
- Trainer can log workout sessions, sets, and body weight for a proxy trainee, using the same flows a real trainee would use
- Trainer sees proxy trainees in their roster alongside real trainees (visually distinguished)
- Trainer can send an activation/invite link to a proxy trainee to upgrade them to a full account
- On activation, all historical data (sessions, body weight, assigned plans) migrates to the new real account seamlessly

**Design considerations:**

- UX: Trainer-side "log on behalf of" flow — minimize extra clicks vs. current trainee self-service flow
- Architecture: Evaluate shared components/logic between trainer-acting-as-trainee and real trainee flows; extract to a shared layer where it reduces duplication
- Assign-plan flow simplification: Trainer currently goes Trainee → Add Plan → Select Plan → Select Trainee → Review. Explore starting from trainee context to collapse steps.

### Phase 14: Admin & Global Exercise Library

**Goal:** An admin/super-user account can curate a global exercise library visible to all trainers. Trainers can use global exercises as-is, duplicate and customise them (copy-on-write), and always distinguish their private exercises from global ones. Editing a global exercise auto-forks it into a private copy.

**Depends on:** Phase 13 (shares shared-component architecture refactor)

**Key requirements:**

- A designated admin role exists (Supabase role or flag); admin can sign in with the normal auth flow
- Admin can create, edit, and delete exercises in the global library (same CRUD interface, different scope)
- Global exercises are visible in every trainer's exercise library, clearly badged (e.g. "Global" chip)
- A trainer cannot directly edit a global exercise — editing triggers a copy-on-write fork: the exercise becomes a private clone owned by that trainer
- A trainer can explicitly duplicate a global exercise to customise it (e.g. swap the YouTube video) without triggering an edit
- Global exercises cannot be deleted by trainers; only the admin can remove them

**Design considerations:**

- UX: admin exercise management UI (could reuse trainer exercise CRUD with an admin flag toggling "global" scope)
- Data model: add `is_global` flag (or `owner_id IS NULL`) to exercises table; RLS policies differentiate read vs. write by role
- Copy-on-write trigger: intercept trainer edit attempt on a global exercise, clone the row, redirect edit to the clone
- Shared component opportunity: exercise CRUD form used by both admin and trainers, parameterised by scope

### Phase 15: Super Trainee User Type

**Goal:** A new "super trainee" role allows advanced gym-goers to self-manage their training without a trainer. They access the global exercise library, build their own plans, assign those plans to themselves, and manage all schemas and workouts independently.

**Depends on:** Phase 14 (global exercise library must exist before super trainees can consume it)

**Key requirements:**
- A new `super_trainee` role can be selected at sign-up (not advertised on the public landing page for now)
- Super trainees have read access to the global exercise library (same as trainers, no copy-on-write needed unless they want to customise)
- Super trainees can create, edit, duplicate, and delete their own workout plans (plan builder parity with trainers, scoped to self)
- Super trainees can assign plans to themselves and progress through them the same way a regular trainee does
- Super trainees have no trainer connection — no roster, no invite flow, no shared visibility
- A dummy super trainee seed account is provided for manual testing

**Design considerations:**
- UX: single-user dashboard that merges the trainer plan-builder view and the trainee workout-logging view into one coherent experience
- Architecture: super trainee surfaces the largest shared-component opportunity across all v1.1 phases — plan builder, workout logging, and exercise library components should be extracted to a shared layer usable by trainer, trainee, and super trainee
- Role gating: middleware and RLS must distinguish `super_trainee` from `trainee` and `trainer` cleanly

</details>

## Progress

| Milestone      | Phases | Plans | Status      | Shipped    |
| -------------- | ------ | ----- | ----------- | ---------- |
| v1.0 Forge MVP | 19     | 59    | ✅ Complete | 2026-04-01 |
| v1.1           | 3+     | TBD   | 🚧 Active   | —          |

---

_Last updated: 2026-04-01 — v1.1: Phases 13 (Proxy Trainee), 14 (Admin & Global Exercise Library), and 15 (Super Trainee) added_

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Auth, roles, multi-tenant isolation, and trainer-trainee connections (COMPLETE)
- [x] **Phase 2: Exercise Library** - Trainer-scoped exercise library with search and filtering (completed 2026-03-10)
- [ ] **Phase 3: Plan Builder** - Multi-week workout plan creation, assignment, and editing
- [x] **Phase 4: Trainee Workout Logging** - The core value loop — log sets mid-session with last week's results inline (completed 2026-03-13)
- [ ] **Phase 5: Trainer Progress Visibility** - Trainer views trainee workout logs and progress over time

## Phase Details

### Phase 1: Foundation

**Goal**: Trainers and trainees can securely access the app with isolated accounts, and trainers can connect with their clients
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, CONN-01, CONN-02, CONN-03, CONN-04
**Success Criteria** (what must be TRUE):

1. A user can sign up with email and password, choosing either trainer or trainee role, and their role is enforced across all sessions
2. A logged-in user stays logged in across browser sessions and device restarts without re-entering credentials
3. A user can log out from any page and is immediately redirected away from protected content
4. A trainer can add a trainee directly by email or generate an invite link/code that a trainee can use to join
5. A trainer can view their full roster of connected trainees, and trainees from different trainers cannot see each other's data
   **Plans**: 5 (01: Scaffold+Schema, 02: Auth, 03: Middleware+Shells, 04: Invite Link Generation [gap], 05: Trainee Join Flow [gap])

### Phase 01.3: Figma UI Library (INSERTED)

**Goal:** Build a Figma component library matching the dark navy/emerald design system — tokens, atoms, molecules, organisms, and Phase 2 patterns — to serve as the design source for all future UI sub-phases
**Requirements**: TBD
**Depends on:** Phase 1
**Plans:** 2/2 plans complete

Plans:

- [x] 01.3-01-PLAN.md — Generate design-tokens.md, FIGMA-WORKFLOW.md, figma-bootstrap.js, update ROADMAP.md goals
- [x] 01.3-02-PLAN.md — Create Figma file, run bootstrap script, visual review and approval; FIGMA-WORKFLOW.md updated with real link

### Phase 01.2: Logo Generation (INSERTED)

**Goal:** Design and integrate a custom SVG logo for Forge — replacing the ⚡ Forge emoji placeholder in nav layouts and auth pages, with a favicon
**Requirements**: TBD
**Depends on:** Phase 01.1
**Plans:** 2/2 plans complete

Plans:

- [ ] 01.2-01-PLAN.md — Author ForgeLogo component (horizontal + icon variants) + icon.svg favicon + visual review checkpoint
- [ ] 01.2-02-PLAN.md — Integrate logo into trainer/trainee nav layouts and all three auth pages

### Phase 01.1: UI Design System (INSERTED)

**Goal:** Replace light theme with dark navy design system (Tailwind tokens, Lato font, emerald accents) across all existing auth and app pages
**Requirements**: TBD
**Depends on:** Phase 1
**Plans:** 3/3 plans complete

Plans:

- [ ] 01.1-01-PLAN.md — Design tokens (globals.css @theme) + Lato font (root layout) + dark auth layout
- [ ] 01.1-02-PLAN.md — Restyle auth pages (login, signup x2, verify-email) and form components (LoginForm, SignupForm)
- [ ] 01.1-03-PLAN.md — Restyle app shells (trainer/trainee layouts + pages, InviteDialog, join page) + human verify checkpoint

### Phase 2: Exercise Library

**Goal**: Trainers can build and maintain a reusable library of exercises that feeds into all their workout plans
**Depends on**: Phase 1
**Requirements**: EXLIB-01, EXLIB-02, EXLIB-03
**Success Criteria** (what must be TRUE):

1. A trainer can create a named exercise with muscle group and description, and it immediately appears in their library
2. An exercise created by one trainer is not visible to any other trainer
3. A trainer can search their exercise library by name and filter by muscle group to find exercises quickly
   **Plans**: 3 plans

Plans:

- [x] 02-01-PLAN.md — DB migration (exercises table + RLS) + Drizzle schema update + Server Actions (create/update/delete)
- [x] 02-02-PLAN.md — Exercise UI components (ExerciseCard, ExerciseGrid, ExerciseDetailModal, ExerciseFormModal)
- [x] 02-03-PLAN.md — ExercisesPage + ExerciseFilterBar (search + muscle group chips) + nav link + human verify

### Phase 02.1: UI Polish (INSERTED)

**Goal:** Visual review and polish of Exercise Library UI — Figma screens reviewed against built components, spacing/typography/interaction states refined before Phase 3
**Requirements**: TBD
**Depends on:** Phase 2
**Plans:** Complete

Plans:

- [x] Iterative UI polish delivered inline during development (completed 2026-03-14)

### Phase 3: Plan Builder

**Goal**: Trainers can create structured multi-week workout plans and assign them to connected trainees
**Depends on**: Phase 2
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07
**Success Criteria** (what must be TRUE):

1. A trainer can create a named multi-week plan containing named workout schemas (e.g., "Push Day", "Pull Day") scheduled to specific days within each week
2. A trainer can add exercises from their library to a schema, specifying sets, reps, and target weight for each
3. A trainer can assign a plan to a connected trainee, and that trainee immediately has a scheduled program
4. A trainer can duplicate an existing plan to use as a template for a new trainee without re-entering all exercises
5. A trainer can edit a plan that is currently active for a trainee and the trainee sees the updated schedule
   **Plans**: 6 plans

Plans:

- [x] 03-01-PLAN.md — DB migration (6 tables + 2 RPC functions + RLS) + Drizzle schema types + Server Actions (plan/schema/exercise/assign CRUD)
- [ ] 03-02-PLAN.md — NavHeader 3-tab update + Trainees landing page (plan context per trainee) + Trainee detail page
- [ ] 03-03-PLAN.md — Plans list + Plan creation form + Plan template editor (week tabs + workout slot cards) + AddSchemaButton
- [ ] 03-04-PLAN.md — Schema editor page + SchemaExerciseList (DnD) + SchemaExerciseRow + ExercisePickerModal
- [ ] 03-05-PLAN.md — Assign plan flow (trainee picker + weight review modal) + Edit assigned plan page + Duplicate plan wiring
- [ ] 03-06-PLAN.md — Human verify checkpoint (all 7 requirements end-to-end)

### Phase 03.1: UI Polish (INSERTED)

**Goal:** Visual review and polish of Plan Builder UI — Figma screens reviewed against built components, multi-week calendar and schema editor interactions refined before Phase 4
**Requirements**: TBD
**Depends on:** Phase 3
**Plans:** Complete

Plans:

- [x] UAT iteration rounds 1-3: inline tags, trainees layout, hover titles, section headings, vertical spacing, clickable workout rows (completed 2026-03-13)

### Phase 4: Trainee Workout Logging

**Goal**: A trainee can open the app at the gym, see today's workout with last week's results, and log their sets in under a minute
**Depends on**: Phase 3
**Requirements**: TRACK-01, TRACK-02, TRACK-03, TRACK-04, TRACK-05
**Success Criteria** (what must be TRUE):

1. A trainee can open the app and immediately see which workout schemas are scheduled for the current week
2. A trainee can open a workout session and see every exercise with its prescribed sets, reps, and target weight
3. While logging a set, the trainee can see what they actually did for that exercise in the previous week's session, displayed inline next to the input fields
4. A trainee can log actual sets, reps, and weight for each exercise with minimal taps, and the data is saved to their history
5. A trainee can mark a workout session as complete and the session is recorded with a timestamp
   **Plans**: 5 plans

Plans:

- [ ] 04-01-PLAN.md — DB migration (workout_sessions + session_sets tables + RLS) + Drizzle schema types
- [ ] 04-02-PLAN.md — Week boundary utility + Server Actions (startWorkout, completeSet, addSet, finishWorkout, abandonWorkout)
- [ ] 04-03-PLAN.md — Plans list page (three sections + in-progress banner) + Active plan page (weekly workout list)
- [ ] 04-04-PLAN.md — Workout session page (exercise list + set completion status) + FinishWorkoutButton (summary confirmation)
- [ ] 04-05-PLAN.md — Exercise detail page (set logging inputs + last-week results inline) + SetList (useOptimistic auto-save) + human verify

### Phase 04.1: UI Polish (INSERTED)

**Goal:** Visual review and polish of Trainee Workout Logging UI — Figma screens reviewed against built components, inline last-week results display and set logging flow refined before Phase 5
**Requirements**: TBD
**Depends on:** Phase 4
**Plans:** Complete

Plans:

- [x] Iterative UI polish delivered inline during development (completed 2026-03-14)

### Phase 5: Trainer Progress Visibility

**Goal**: Trainers can review each trainee's workout history to monitor progress and adjust plans; trainees can view their own cross-plan exercise progress
**Depends on**: Phase 4
**Requirements**: PROG-01, PROG-02
**Success Criteria** (what must be TRUE):

1. A trainer can view a list of all their trainees with each trainee's currently assigned plan shown at a glance
2. A trainer can open any trainee's profile and see their full workout log history: every session, every exercise, with the sets, reps, and weights actually logged
   **Plans**: 2 plans

Plans:

- [x] 05-01-PLAN.md — Shared TabSwitcher + DateRangeToggle components + Trainer-side Exercise tab on trainee profile + cross-plan exercise progress page
- [x] 05-02-PLAN.md — Trainee-side Exercise tab on home page + cross-plan exercise progress page at /trainee/exercises/[exerciseId]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase                          | Plans Complete | Status   | Completed  |
| ------------------------------ | -------------- | -------- | ---------- |
| 1. Foundation                  | 5/5            | Complete | 2026-03-10 |
| 01.1. UI Design System         | 3/3            | Complete | 2026-03-10 |
| 01.2. Logo Generation          | 2/2            | Complete | 2026-03-10 |
| 01.3. Figma UI Library         | 2/2            | Complete | 2026-03-10 |
| 2. Exercise Library            | 3/3            | Complete | 2026-03-11 |
| 02.1. UI Polish                | Complete       | Complete | 2026-03-14 |
| 3. Plan Builder                | 6/6            | Complete | 2026-03-13 |
| 03.1. UI Polish                | Complete       | Complete | 2026-03-13 |
| 4. Trainee Workout Logging     | 5/5            | Complete | 2026-03-13 |
| 04.1. UI Polish                | Complete       | Complete | 2026-03-14 |
| 5. Trainer Progress Visibility | 2/2            | Complete | 2026-03-30 |

### Phase 05.1: UI Polish (INSERTED)

**Goal:** Visual review and polish of Trainer Progress Visibility UI — Figma screens reviewed against built workout history views, data density and trainer dashboard interactions finalized
**Requirements**: TBD
**Depends on:** Phase 5
**Plans:** 0/0 plans complete

Plans:

- [x] TBD (run /gsd:plan-phase 05.1 to break down) (completed 2026-03-18)

### Phase 6: Trainee and Trainer Profile Pages

**Goal:** Both trainers and trainees can manage their own profiles (name, bio, goals, physical stats), trainers can write private notes per trainee, and compliance stats (last session + this-week count) appear on the trainer roster
**Requirements**: PROF-SCHEMA, PROF-GRAVATAR, PROF-NAV-AVATAR, PROF-TRAINER-OWN, PROF-TRAINEE-OWN, PROF-TRAINER-CARD, PROF-TRAINER-NOTES, PROF-TRAINEE-ENRICHED, PROF-COMPLIANCE-STATS
**Depends on:** Phase 5
**Plans:** 2/4 plans executed

Plans:

- [ ] 06-01-PLAN.md — DB migration (profile fields + RLS) + Gravatar utility + GravatarAvatar component + Drizzle schema update
- [ ] 06-02-PLAN.md — Nav header avatars (both roles) + trainer profile page (name + bio editing + sign-out)
- [ ] 06-03-PLAN.md — Trainee profile page (name, goals, stats editing + My Trainer card + sign-out)
- [ ] 06-04-PLAN.md — Trainee detail enrichment (goals, stats, notes) + compliance stats on trainer home roster cards

### Phase 7: Landing Page & FAQ/Docs

**Goal:** Unauthenticated visitors see a marketing landing page that drives trainer and trainee signups; all users can access a Help/FAQ page with documentation on how to use the app
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04
**Depends on:** Phase 6
**Plans:** 1/2 plans executed

Plans:

- [x] 07-01-PLAN.md — Landing page (hero + 3 feature cards + footer) + middleware /help publicPaths fix
- [ ] 07-02-PLAN.md — FAQ/Docs page at /help + Help link in both nav headers + visual verification checkpoint

### Phase 8: Training logs and body weight progression tracking

**Goal:** Finish Workout gains optional enrichment fields (duration, kcal, RPE), trainee home becomes a 4-tab layout with a chronological training log and body weight tracking (list + chart), and trainers can request permission to view trainee body weight data
**Requirements**: LOG-01, LOG-02, LOG-03, LOG-04, LOG-05, LOG-06
**Depends on:** Phase 7
**Plans:** 3/3 plans complete

Plans:

- [x] 08-01-PLAN.md — DB migration (enrichment columns + body_weight_logs + body_weight_access_requests tables + RLS) + Drizzle schema + finishWorkout enrichment + FinishWorkoutButton UI
- [x] 08-02-PLAN.md — Trainee home 4-tab restructuring (Plans | Exercises | Log | Body Weight) + training log feed + body weight tab (list + chart + inline form)
- [x] 08-03-PLAN.md — Trainer body weight access permission flow (request/approve/decline/revoke) + trainer Body Weight tab on trainee profile + end-to-end verification

### Phase 9: Internationalization — make app multi-language: extract all static labels into keys, add Polish language and translations, make Polish default, add lang switcher in header

**Goal:** All user-visible UI text is extracted into i18n keys with Polish and English translations, Polish is the default locale, and a PL | EN language switcher toggle appears in both nav headers
**Requirements**: I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, I18N-06, I18N-07, I18N-08, I18N-09
**Depends on:** Phase 8
**Plans:** 3/5 plans executed

Plans:

- [x] 09-01-PLAN.md — Install next-intl, i18n infrastructure (request config, next.config plugin, root layout provider), LanguageSwitcher component, translation JSON scaffolds, Lato latin-ext fix
- [x] 09-02-PLAN.md — String extraction: auth pages + shared components + landing/help/join pages
- [x] 09-03-PLAN.md — String extraction: trainer core pages + 19 trainer \_components
- [x] 09-04-PLAN.md — String extraction: trainer trainee-detail pages + all trainee route group pages
- [x] 09-05-PLAN.md — End-to-end verification (automated scan + human walkthrough)

### Phase 10: Demo users — create demo trainer and trainee seeded with random data, add login instructions so visitors can explore the app, demo users cannot change password

**Goal:** Visitors can explore the app as a demo trainer or trainee in one click from the landing page; demo accounts are pre-seeded with realistic Push/Pull/Legs workout data and body weight logs; demo users cannot change their password
**Requirements**: DEMO-SEED, DEMO-LANDING, DEMO-GUARD
**Depends on:** Phase 9
**Plans:** 3 plans

Plans:

- [ ] 10-01-PLAN.md — Demo seed script (scripts/seed-demo.ts): create demo trainer + trainee auth accounts, exercises, plan, assigned plan snapshot, 6 workout sessions with progressive overload, 14 body weight logs
- [ ] 10-02-PLAN.md — Landing page demo section: two server actions (loginAsDemoTrainer / loginAsDemoTrainee) + demo section UI on page.tsx + i18n keys in both locales
- [ ] 10-03-PLAN.md — Password change protection: add Change Password section to both profile pages, guard with is_demo check in server actions, hide section in UI for demo users

Plans:

- [ ] TBD (run /gsd:plan-phase 10 to break down)

### Phase 11: Deploy — connect code to GitHub, deploy app for public beta testing and feedback gathering

**Goal:** Push code to GitHub, deploy to Vercel, configure Supabase for production, add PWA manifest, run demo seed, and verify the live URL works end-to-end for public beta testing.
**Requirements**: DEPLOY-ENV, DEPLOY-PWA, DEPLOY-GIT, DEPLOY-CI, DEPLOY-VERCEL, DEPLOY-SUPABASE, DEPLOY-SEED, DEPLOY-E2E
**Depends on:** Phase 10
**Plans:** 4/4 plans executed
**Live URL:** https://forge-three-tau.vercel.app

Plans:

- [x] 11-01-PLAN.md — Git cleanup, PWA manifest + icons, production env var docs, pnpm build verification
- [x] 11-02-PLAN.md — GitHub repo creation, push, and CI workflow
- [x] 11-03-PLAN.md — Vercel import, env var configuration, first deploy
- [x] 11-04-PLAN.md — Supabase production Auth config, demo seed, end-to-end verification

### Phase 12: After Release Fixes — post-release bugfixing based on beta feedback

**Goal:** Investigate and fix bugs discovered after the public beta release. No new features — stability and correctness only.
**Requirements**: TBD (driven by bug reports)
**Depends on:** Phase 11
**Plans:** TBD (run /gsd:plan-phase 12 to break down)
