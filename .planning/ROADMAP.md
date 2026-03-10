# Roadmap: Forge

## Overview

Five phases deliver a complete trainer-trainee workout tracking platform. The build order is driven by data dependencies: users must exist before plans, plans must exist before logging, and logging must exist before progress analytics. Phase 1 establishes the multi-tenant foundation that everything else rests on. Phases 2-3 build the trainer's side of the product. Phase 4 delivers the core value — a trainee logging their workout mid-session with last week's results visible inline. Phase 5 closes the loop for trainers who need to see client progress over time.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Auth, roles, multi-tenant isolation, and trainer-trainee connections (COMPLETE)
- [ ] **Phase 2: Exercise Library** - Trainer-scoped exercise library with search and filtering
- [ ] **Phase 3: Plan Builder** - Multi-week workout plan creation, assignment, and editing
- [ ] **Phase 4: Trainee Workout Logging** - The core value loop — log sets mid-session with last week's results inline
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
**Plans**: TBD

### Phase 02.1: UI Polish (INSERTED)

**Goal:** Visual review and polish of Exercise Library UI — Figma screens reviewed against built components, spacing/typography/interaction states refined before Phase 3
**Requirements**: TBD
**Depends on:** Phase 2
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 02.1 to break down)

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
**Plans**: TBD

### Phase 03.1: UI Polish (INSERTED)

**Goal:** Visual review and polish of Plan Builder UI — Figma screens reviewed against built components, multi-week calendar and schema editor interactions refined before Phase 4
**Requirements**: TBD
**Depends on:** Phase 3
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 03.1 to break down)

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
**Plans**: TBD

### Phase 04.1: UI Polish (INSERTED)

**Goal:** Visual review and polish of Trainee Workout Logging UI — Figma screens reviewed against built components, inline last-week results display and set logging flow refined before Phase 5
**Requirements**: TBD
**Depends on:** Phase 4
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 04.1 to break down)

### Phase 5: Trainer Progress Visibility
**Goal**: Trainers can review each trainee's workout history to monitor progress and adjust plans
**Depends on**: Phase 4
**Requirements**: PROG-01, PROG-02
**Success Criteria** (what must be TRUE):
  1. A trainer can view a list of all their trainees with each trainee's currently assigned plan shown at a glance
  2. A trainer can open any trainee's profile and see their full workout log history: every session, every exercise, with the sets, reps, and weights actually logged
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete   | 2026-03-10 |
| 01.1. UI Design System | 3/3 | Complete    | 2026-03-10 |
| 01.2. Logo Generation | 2/2 | Complete    | 2026-03-10 |
| 01.3. Figma UI Library | 2/2 | Complete   | 2026-03-10 |
| 2. Exercise Library | 0/TBD | Not started | - |
| 3. Plan Builder | 0/TBD | Not started | - |
| 4. Trainee Workout Logging | 0/TBD | Not started | - |
| 5. Trainer Progress Visibility | 0/TBD | Not started | - |

### Phase 05.1: UI Polish (INSERTED)

**Goal:** Visual review and polish of Trainer Progress Visibility UI — Figma screens reviewed against built workout history views, data density and trainer dashboard interactions finalized
**Requirements**: TBD
**Depends on:** Phase 5
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 05.1 to break down)
