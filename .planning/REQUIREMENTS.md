# Requirements: Forge v1.1

**Defined:** 2026-04-01
**Core Value:** A trainee can open the app mid-workout, see exactly what they did last week on each exercise, and log today's results in under a minute.

## v1.1 Requirements

Requirements for milestone v1.1 — Expanded User Roles.

### Proxy Trainee

- [ ] **PROXY-01**: Trainer can create a proxy trainee (name only, no email/account required)
- [ ] **PROXY-02**: Trainer can log workout sessions and sets on behalf of a proxy trainee using the same flow a real trainee would use
- [ ] **PROXY-03**: Trainer can record body weight entries for a proxy trainee
- [ ] **PROXY-04**: Proxy trainees appear in the trainer's roster alongside real trainees, visually distinguished (e.g. badge or icon)
- [ ] **PROXY-05**: Trainer can send an activation/invite link to a proxy trainee's email address to upgrade them to a full account
- [ ] **PROXY-06**: On activation, all historical data (sessions, body weight, assigned plans) migrates to the new real account with no data loss
- [ ] **PROXY-07**: Trainer can assign plans to a proxy trainee and review/adjust weights the same way as for real trainees

### Admin and Global Exercise Library

- [ ] **ADMIN-01**: A designated admin account can sign in via the normal auth flow (flag or role in DB, not a separate signup path)
- [ ] **ADMIN-02**: Admin can create exercises in the global library (name, muscle group, description, YouTube video)
- [ ] **ADMIN-03**: Admin can edit and delete exercises in the global library
- [ ] **ADMIN-04**: Global exercises are visible in every trainer's exercise library, clearly badged (e.g. "Global" chip)
- [ ] **ADMIN-05**: A trainer can use a global exercise in a plan without modification
- [ ] **ADMIN-06**: A trainer attempting to edit a global exercise is shown a confirmation; on confirm the exercise is forked into a private copy and the trainer edits that copy (copy-on-write)
- [ ] **ADMIN-07**: A trainer can explicitly duplicate a global exercise to create a private copy immediately (e.g. to swap the YouTube video)
- [ ] **ADMIN-08**: Trainers cannot delete global exercises; only the admin can

### Super Trainee

- [ ] **SUPER-01**: A new "super trainee" role is available at sign-up (role selector, not advertised on the public landing page)
- [ ] **SUPER-02**: Super trainee has read access to the global exercise library and can use global exercises in plans
- [ ] **SUPER-03**: Super trainee can create, edit, duplicate, and delete their own workout plans (plan builder parity with trainers, scoped to self)
- [ ] **SUPER-04**: Super trainee can assign a plan to themselves and log progress through it the same way a regular trainee does
- [ ] **SUPER-05**: Super trainee has no trainer connection — no roster, invite flow, or shared visibility with any trainer
- [ ] **SUPER-06**: A dummy super trainee seed account is available for manual testing (not accessible in production demos)

## v1 Requirements (Complete)

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User selects role at signup (trainer or trainee)
- [x] **AUTH-03**: User can log in and stay logged in across sessions
- [x] **AUTH-04**: User can log out from any page

### Connections

- [x] **CONN-01**: Trainer can add a trainee directly by email
- [x] **CONN-02**: Trainer can generate an invite code/link for a trainee to join
- [x] **CONN-03**: Trainee can join a trainer by entering an invite code or clicking invite link
- [x] **CONN-04**: Trainer can view their roster of connected trainees

### Exercise Library

- [x] **EXLIB-01**: Trainer can create named exercises (name, muscle group, description)
- [x] **EXLIB-02**: Exercise library is shared across all of a trainer's plans
- [x] **EXLIB-03**: Trainer can search and filter the exercise library

### Plan Builder

- [x] **PLAN-01**: Trainer can create a named workout plan spanning multiple weeks
- [x] **PLAN-02**: Trainer can define named workout schemas within a plan (e.g. "Push Day", "Pull Day")
- [x] **PLAN-03**: Trainer can assign workout schemas to specific days within each week
- [x] **PLAN-04**: Trainer can add exercises to a schema with sets, reps, and target weight
- [x] **PLAN-05**: Trainer can assign a plan to a connected trainee
- [x] **PLAN-06**: Trainer can duplicate (template) an existing plan to reuse for another trainee
- [x] **PLAN-07**: Trainer can edit a plan that is currently assigned to an active trainee

### Trainee Workout Tracking

- [x] **TRACK-01**: Trainee can view their current week's scheduled workout schemas
- [x] **TRACK-02**: Trainee can open a workout session and see all exercises with sets, reps, and target weight
- [x] **TRACK-03**: Trainee can log actual sets/reps/weight for each exercise in a session
- [x] **TRACK-04**: Trainee sees last week's actual results inline for each exercise while logging
- [x] **TRACK-05**: Trainee can mark a workout session as complete

### Trainer Progress Visibility

- [x] **PROG-01**: Trainer can view all trainees with their currently assigned plans
- [x] **PROG-02**: Trainer can view a trainee's full workout log history (sets, reps, weight per session)

## Future Requirements (post v1.1)

### Usability

- **UX-01**: Trainee can browse full workout history (all past sessions, pagination)
- **UX-02**: Rest timer between sets (countdown after logging a set)

### Connections

- **CONN-05**: Trainer can add a trainee directly by email without an invite link

### Notifications

- **NOTIF-01**: Trainee receives push notification reminder for scheduled workout
- **NOTIF-02**: Trainer receives notification when trainee completes a session

## Out of Scope

| Feature                                         | Reason                                       |
| ----------------------------------------------- | -------------------------------------------- |
| AI-generated workout plan suggestions           | Not in v1 or v1.1 — focus on usability first |
| Real-time messaging between trainer and trainee | Future feature                               |
| Native iOS/Android apps                         | PWA covers the gym use case well             |
| Payments/billing                                | Not in scope                                 |
| Offline logging with sync                       | Significant complexity — defer post v1.1     |
| Social feed / community features                | Anti-feature for current focus               |
| Super trainee progress visible to any trainer   | Super trainees are fully independent         |
| Smartwatch integration (Apple Watch, Garmin)    | Deferred — significant complexity            |

## Traceability

Which phases cover which requirements.

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| PROXY-01    | Phase 13 | Pending |
| PROXY-02    | Phase 13 | Pending |
| PROXY-03    | Phase 13 | Pending |
| PROXY-04    | Phase 13 | Pending |
| PROXY-05    | Phase 13 | Pending |
| PROXY-06    | Phase 13 | Pending |
| PROXY-07    | Phase 13 | Pending |
| ADMIN-01    | Phase 14 | Pending |
| ADMIN-02    | Phase 14 | Pending |
| ADMIN-03    | Phase 14 | Pending |
| ADMIN-04    | Phase 14 | Pending |
| ADMIN-05    | Phase 14 | Pending |
| ADMIN-06    | Phase 14 | Pending |
| ADMIN-07    | Phase 14 | Pending |
| ADMIN-08    | Phase 14 | Pending |
| SUPER-01    | Phase 15 | Pending |
| SUPER-02    | Phase 15 | Pending |
| SUPER-03    | Phase 15 | Pending |
| SUPER-04    | Phase 15 | Pending |
| SUPER-05    | Phase 15 | Pending |
| SUPER-06    | Phase 15 | Pending |

**Coverage:**

- v1.1 requirements: 21 total
- Mapped to phases: 21/21
- Unmapped: 0 ✓

---

_Requirements defined: 2026-04-01_
_Last updated: 2026-04-01 — milestone v1.1 initialized_
