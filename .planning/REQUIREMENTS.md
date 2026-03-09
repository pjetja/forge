# Requirements: GYM AI Assistant

**Defined:** 2026-02-28
**Core Value:** A trainee can open the app mid-workout, see exactly what they did last week on each exercise, and log today's results in under a minute.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User selects role at signup (trainer or trainee)
- [ ] **AUTH-03**: User can log in and stay logged in across sessions
- [ ] **AUTH-04**: User can log out from any page

### Connections

- [ ] **CONN-01**: Trainer can add a trainee directly by email
- [ ] **CONN-02**: Trainer can generate an invite code/link for a trainee to join
- [ ] **CONN-03**: Trainee can join a trainer by entering an invite code or clicking invite link
- [ ] **CONN-04**: Trainer can view their roster of connected trainees

### Exercise Library

- [ ] **EXLIB-01**: Trainer can create named exercises (name, muscle group, description)
- [ ] **EXLIB-02**: Exercise library is shared across all of a trainer's plans
- [ ] **EXLIB-03**: Trainer can search and filter the exercise library

### Plan Builder

- [ ] **PLAN-01**: Trainer can create a named workout plan spanning multiple weeks
- [ ] **PLAN-02**: Trainer can define named workout schemas within a plan (e.g. "Push Day", "Pull Day")
- [ ] **PLAN-03**: Trainer can assign workout schemas to specific days within each week
- [ ] **PLAN-04**: Trainer can add exercises to a schema with sets, reps, and target weight
- [ ] **PLAN-05**: Trainer can assign a plan to a connected trainee
- [ ] **PLAN-06**: Trainer can duplicate (template) an existing plan to reuse for another trainee
- [ ] **PLAN-07**: Trainer can edit a plan that is currently assigned to an active trainee

### Trainee Workout Tracking

- [ ] **TRACK-01**: Trainee can view their current week's scheduled workout schemas
- [ ] **TRACK-02**: Trainee can open a workout session and see all exercises with sets, reps, and target weight
- [ ] **TRACK-03**: Trainee can log actual sets/reps/weight for each exercise in a session
- [ ] **TRACK-04**: Trainee sees last week's actual results inline for each exercise while logging
- [ ] **TRACK-05**: Trainee can mark a workout session as complete

### Trainer Progress Visibility

- [ ] **PROG-01**: Trainer can view all trainees with their currently assigned plans
- [ ] **PROG-02**: Trainer can view a trainee's full workout log history (sets, reps, weight per session)

## v2 Requirements

### Trainee Experience

- **TRACK-06**: Trainee can browse full workout history (all past sessions)
- **TRACK-07**: Rest timer between sets (countdown after logging a set)
- **TRACK-08**: Offline logging with sync when back online

### Trainer Analytics

- **PROG-03**: Progress charts per trainee (weight trends over time)
- **PROG-04**: Compliance tracking (session completion rates)

### Notifications

- **NOTF-01**: Trainee receives reminder notification for scheduled workout
- **NOTF-02**: Trainer receives notification when trainee completes a session

## Out of Scope

| Feature | Reason |
|---------|--------|
| Smartwatch integration (Apple Watch, Garmin) | Deferred to v4/v5 — significant complexity, ship core product first |
| In-app messaging between trainer and trainee | Out of scope — not core to workout tracking value |
| AI-generated workout plan suggestions | Out of scope v1 — focus on manual plan creation |
| Payments / billing | Out of scope — not in v1 |
| Nutrition tracking | Out of scope — different product |
| Social feed / community features | Out of scope — anti-feature for v1 focus |
| Native iOS / Android apps | PWA covers gym use case |
| Video exercise library | Out of scope — storage/bandwidth cost, defer |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 (Plan 01: infra; Plan 02: auth UI) | In Progress |
| AUTH-02 | Phase 1 (Plan 01: infra; Plan 02: auth UI) | In Progress |
| AUTH-03 | Phase 1 (Plan 01: infra; Plan 02: auth UI) | In Progress |
| AUTH-04 | Phase 1 (Plan 01: infra; Plan 02: auth UI) | In Progress |
| CONN-01 | Phase 1 (Plan 01: infra; Plan 03: invite flow) | In Progress |
| CONN-02 | Phase 1 (Plan 01: infra; Plan 03: invite flow) | In Progress |
| CONN-03 | Phase 1 (Plan 01: infra; Plan 03: invite flow) | In Progress |
| CONN-04 | Phase 1 (Plan 01: infra; Plan 03: invite flow) | In Progress |
| EXLIB-01 | Phase 2 | Pending |
| EXLIB-02 | Phase 2 | Pending |
| EXLIB-03 | Phase 2 | Pending |
| PLAN-01 | Phase 3 | Pending |
| PLAN-02 | Phase 3 | Pending |
| PLAN-03 | Phase 3 | Pending |
| PLAN-04 | Phase 3 | Pending |
| PLAN-05 | Phase 3 | Pending |
| PLAN-06 | Phase 3 | Pending |
| PLAN-07 | Phase 3 | Pending |
| TRACK-01 | Phase 4 | Pending |
| TRACK-02 | Phase 4 | Pending |
| TRACK-03 | Phase 4 | Pending |
| TRACK-04 | Phase 4 | Pending |
| TRACK-05 | Phase 4 | Pending |
| PROG-01 | Phase 5 | Pending |
| PROG-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25/25
- Unmapped: 0

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-03-09 after Phase 1 Plan 01 — AUTH and CONN infrastructure scaffolded; full implementation in Plans 02-03*
