# Roadmap: Forge

## Overview

Five phases deliver a complete trainer-trainee workout tracking platform. The build order is driven by data dependencies: users must exist before plans, plans must exist before logging, and logging must exist before progress analytics. Phase 1 establishes the multi-tenant foundation that everything else rests on. Phases 2-3 build the trainer's side of the product. Phase 4 delivers the core value — a trainee logging their workout mid-session with last week's results visible inline. Phase 5 closes the loop for trainers who need to see client progress over time.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

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
- [ ] 05-01-PLAN.md — Shared TabSwitcher + DateRangeToggle components + Trainer-side Exercise tab on trainee profile + cross-plan exercise progress page
- [ ] 05-02-PLAN.md — Trainee-side Exercise tab on home page + cross-plan exercise progress page at /trainee/exercises/[exerciseId]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete   | 2026-03-10 |
| 01.1. UI Design System | 3/3 | Complete    | 2026-03-10 |
| 01.2. Logo Generation | 2/2 | Complete    | 2026-03-10 |
| 01.3. Figma UI Library | 2/2 | Complete    | 2026-03-10 |
| 2. Exercise Library | 3/3 | Complete   | 2026-03-11 |
| 02.1. UI Polish | Complete | Complete | 2026-03-14 |
| 3. Plan Builder | 6/6 | Complete | 2026-03-13 |
| 03.1. UI Polish | Complete | Complete | 2026-03-13 |
| 4. Trainee Workout Logging | 5/5 | Complete   | 2026-03-13 |
| 04.1. UI Polish | Complete | Complete | 2026-03-14 |
| 5. Trainer Progress Visibility | 1/2 | In Progress|  |

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
**Plans:** 2 plans

Plans:
- [ ] 07-01-PLAN.md — Landing page (hero + 3 feature cards + footer) + middleware /help publicPaths fix
- [ ] 07-02-PLAN.md — FAQ/Docs page at /help + Help link in both nav headers + visual verification checkpoint

### Phase 8: Training logs and body weight progression tracking

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 7
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 8 to break down)
