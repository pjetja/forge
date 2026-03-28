# Forge

## What This Is

A mobile-first PWA for personal trainers and their clients. Trainers create structured multi-week workout plans and assign them to trainees. Trainees track their sets, reps, and weights at the gym — with last week's results visible inline — replacing the spreadsheets trainers and clients are using today.

## Core Value

A trainee can open the app mid-workout, see exactly what they did last week on each exercise, and log today's results in under a minute.

## Requirements

### Validated

- [x] Public landing page drives trainer and trainee signups (Validated in Phase 07)
- [x] In-app FAQ/Help page accessible to all users without login (Validated in Phase 07)

### Active

- [ ] Trainer can create a workout plan with multiple weekly schemas
- [ ] Trainer can define exercises per schema (series, reps, target weight)
- [ ] Trainer can assign plans to trainees directly
- [ ] Trainee can request to join a trainer's plan via invite/code
- [ ] Trainee can view their current weekly workout schema
- [ ] Trainee can log sets/reps/weight for each exercise
- [ ] Trainee sees last week's results inline when logging current workout
- [ ] Trainer can view all trainee progress logs (weights, reps, over time)
- [ ] Trainee can import heart rate and workout confirmation data from Apple Watch or Garmin
- [ ] Multiple trainers can use the platform independently with their own client rosters

### Out of Scope

- AI-generated workout plan suggestions — not in v1, focus on manual plan creation
- Real-time messaging between trainer and trainee — future feature
- Native iOS/Android apps — PWA covers the gym use case
- Payments/billing — not in v1

## Context

- Replacing spreadsheets: trainers currently manage plans in Google Sheets, trainees track manually
- Trainees interact with the app at the gym: glance at plan and last week's results, then fill in results after the workout
- Smartwatch integration (Apple Watch / Garmin) is v1: import heart rate and workout confirmation — HealthKit on iOS, Garmin Connect API
- PWA enables home-screen installation without app store friction
- Multi-trainer platform: each trainer manages their own client roster independently

## Constraints

- **Platform**: Progressive Web App (PWA) — mobile-first, installable to home screen
- **Smartwatch**: Apple Watch via HealthKit (iOS Safari), Garmin via Garmin Connect API — both in v1
- **Multi-tenancy**: Multiple trainers with isolated client rosters

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA over native apps | No app store friction, works on all devices, covers gym use case | — Pending |
| Smartwatch in v1 | User-specified as v1 scope; HR + workout confirmation data | — Pending |
| Multi-trainer platform from day 1 | Not personal use — multiple trainers with independent rosters | — Pending |

---
*Last updated: 2026-03-28 — Phase 07 complete*
