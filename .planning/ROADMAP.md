# Roadmap: Forge

## Milestones

- ✅ **v1.0 Forge MVP** — Phases 1–12 (shipped 2026-04-01) — https://forge-three-tau.vercel.app
- 📋 **v1.1** — Planned (run `/gsd:new-milestone` to define)

## Phases

<details>
<summary>✅ v1.0 Forge MVP — Phases 1–12 — SHIPPED 2026-04-01</summary>

| Phase | Name | Plans | Completed |
|-------|------|-------|-----------|
| 1 | Foundation | 5/5 | 2026-03-10 |
| 01.1 | UI Design System | 3/3 | 2026-03-10 |
| 01.2 | Logo Generation | 2/2 | 2026-03-10 |
| 01.3 | Figma UI Library | 2/2 | 2026-03-10 |
| 2 | Exercise Library | 3/3 | 2026-03-11 |
| 02.1 | UI Polish | 2/2 | 2026-03-14 |
| 3 | Plan Builder | 6/6 | 2026-03-13 |
| 03.1 | UI Polish | 1/1 | 2026-03-13 |
| 4 | Trainee Workout Logging | 5/5 | 2026-03-13 |
| 04.1 | UI Polish | 2/2 | 2026-03-14 |
| 5 | Trainer Progress Visibility | 2/2 | 2026-03-30 |
| 05.1 | UI Polish | 1/1 | 2026-03-18 |
| 6 | Profile Pages | 4/4 | 2026-03-25 |
| 7 | Landing Page & FAQ | 2/2 | 2026-03-27 |
| 8 | Training Logs & Body Weight | 3/3 | 2026-03-29 |
| 9 | Internationalization | 5/5 | 2026-03-30 |
| 10 | Demo Users | 3/3 | 2026-03-30 |
| 11 | Deploy | 4/4 | 2026-03-31 |
| 12 | After-Release Fixes | 6/6 | 2026-04-01 |

Full phase details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 Forge MVP | 19 | 59 | ✅ Complete | 2026-04-01 |
| v1.1 | 3 | TBD | 📋 Planned | — |

### v1.1 — Expanded User Roles

- [ ] **Phase 13: Proxy Trainee** — Trainers can manage athletes without app accounts, with full data migration on activation to a real account
- [ ] **Phase 14: Admin and Global Exercise Library** — Admin curates a shared global exercise library with copy-on-write editing for trainers
- [ ] **Phase 15: Super Trainee User Type** — Advanced trainees self-manage training programs without a trainer connection

### Phase 13: Proxy Trainee

**Goal:** Trainers can manage athletes who don't have app accounts, logging workouts and body weight on their behalf, with a clear path to activate them to a full account
**Depends on:** Phase 12
**Requirements**: PROXY-01, PROXY-02, PROXY-03, PROXY-04, PROXY-05, PROXY-06, PROXY-07
**Success Criteria** (what must be TRUE):
  1. Trainer can create a proxy trainee by entering only a name — no email required, no invitation sent
  2. Trainer can log workout sessions and body weight entries on behalf of a proxy trainee using the same flows as for real trainees
  3. Proxy trainees appear in the trainer's roster with a clear "proxy" badge distinguishing them from real account trainees
  4. Trainer can assign a plan to a proxy trainee and review/adjust target weights through the same flow used for real trainees
  5. Trainer can send an activation link to an email; the proxy trainee completes signup and their full session and body weight history appears in the new account
**Plans:** 0 plans
**UI hint**: yes

Plans:
- [ ] TBD (run /gsd:plan-phase 13 to break down)

### Phase 14: Admin and Global Exercise Library

**Goal:** An admin can curate a shared global exercise library visible to all trainers, with copy-on-write editing that preserves trainer independence
**Depends on:** Phase 13
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ADMIN-07, ADMIN-08
**Success Criteria** (what must be TRUE):
  1. Admin signs in via the standard login form and sees an admin section with access to the global exercise library
  2. An exercise created by admin appears in every trainer's exercise library with a "Global" badge and can be added to a plan without modification
  3. When a trainer tries to edit a global exercise, a confirmation asks whether to fork it — after confirming, the trainer edits their own private copy while the global original is unchanged
  4. Trainer can explicitly duplicate a global exercise to create a personal copy before making edits
  5. Delete is disabled on global exercises in the trainer UI; only admin can remove them from the library
**Plans:** 0 plans
**UI hint**: yes

Plans:
- [ ] TBD (run /gsd:plan-phase 14 to break down)

### Phase 15: Super Trainee User Type

**Goal:** Advanced trainees can self-manage their own training programs without a trainer connection, accessing the global library and managing plans end-to-end
**Depends on:** Phase 14
**Requirements**: SUPER-01, SUPER-02, SUPER-03, SUPER-04, SUPER-05, SUPER-06
**Success Criteria** (what must be TRUE):
  1. User can select "Super Trainee" as a role during sign-up
  2. Super trainee can browse the global exercise library and add global exercises directly to their own plans
  3. Super trainee can create, edit, duplicate, and delete their own workout plans using the same plan builder trainers use
  4. Super trainee can assign a plan to themselves and log workout sessions week by week
  5. Super trainee's account shows no trainer-connection section — no roster, no invite flow, no shared visibility with any trainer
**Plans:** 0 plans
**UI hint**: yes

Plans:
- [ ] TBD (run /gsd:plan-phase 15 to break down)

---
*Last updated: 2026-04-01 — v1.1 milestone planning started*
