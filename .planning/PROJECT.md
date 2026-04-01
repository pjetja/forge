# Forge

## What This Is

A mobile-first PWA for personal trainers and their clients. Trainers create structured multi-week workout plans, define exercises with sets/reps/target weights and progression modes (linear, double-progression, RPE, RIR), and assign plans to trainees. Trainees track their sets, reps, and weights at the gym — with last week's results visible inline — and log body weight and workout enrichment data. Trainers monitor progress via cross-plan exercise charts and body weight trends. The app is live at https://forge-three-tau.vercel.app with Polish as the default language.

## Core Value

A trainee can open the app mid-workout, see exactly what they did last week on each exercise, and log today's results in under a minute.

## Requirements

### Validated (v1.0)

- ✓ Trainer and trainee can sign up, log in, stay logged in, and log out — v1.0
- ✓ Trainer can connect with trainees via invite link; trainee joins via /join/[token] — v1.0
- ✓ Trainer can build and manage an exercise library with search and muscle-group filtering — v1.0
- ✓ Trainer can create multi-week plans with schemas, assign exercises with sets/reps/weight and progression mode — v1.0
- ✓ Trainer can assign a plan to a connected trainee with per-trainee weight review step — v1.0
- ✓ Trainer can duplicate a plan as a template for another trainee — v1.0
- ✓ Trainer can edit a plan currently assigned to an active trainee — v1.0
- ✓ Trainee sees their current week's scheduled schemas and can open a workout session — v1.0
- ✓ Trainee logs actual sets/reps/weight with last-week results inline per exercise — v1.0
- ✓ Trainer views cross-plan exercise progress charts per trainee — v1.0
- ✓ Trainee views their own cross-plan exercise progress — v1.0
- ✓ Both roles have profile pages (name, bio, goals, stats, Gravatar avatar) — v1.0
- ✓ Trainer sees trainee roster with compliance stats and private per-trainee notes — v1.0
- ✓ Public landing page drives signups; all users can access /help and /guide — v1.0
- ✓ Trainee logs workout enrichment (duration, kcal, RPE) and daily body weight — v1.0
- ✓ Trainer can request access to trainee body weight data; trainee approves/declines — v1.0
- ✓ Full PL/EN i18n with LanguageSwitcher in both nav headers; Polish default — v1.0
- ✓ Demo trainer and trainee accounts with pre-seeded data, one-click login from landing page — v1.0
- ✓ App deployed to Vercel with Supabase production config, PWA manifest, GitHub CI — v1.0
- ✓ RPE/RIR/linear progression parameters editable on plan schema, assign-review, and exercise detail pages — v1.0
- ✓ Public landing page drives trainer and trainee signups — v1.0
- ✓ In-app FAQ/Help page and /guide usage-flow walkthrough accessible to all users — v1.0

### Active (v1.1 — defined)

- [ ] **Phase 13: Proxy Trainee** — Trainer creates proxy trainees (no app account), logs workouts + body weight on their behalf, can activate to full account via invite link; includes assign-plan flow simplification and shared-component architecture refactor
- [ ] **Phase 14: Admin & Global Exercise Library** — Admin role + global exercise library; trainers see and use global exercises, fork on edit (copy-on-write); shared exercise CRUD component
- [ ] **Phase 15: Super Trainee User Type** — New role for advanced self-managing users; access to global exercise library, full plan-builder parity, self-assigned plans, no trainer required; dummy seed account for testing

### Backlog (post v1.1)

- [ ] Trainee browse full workout history (all past sessions, pagination)
- [ ] Rest timer between sets (countdown after logging a set)
- [ ] Email invite: trainer can add trainee directly by email without a link
- [ ] Push notifications: trainee reminded of scheduled workout; trainer notified when trainee completes session

### Out of Scope

- AI-generated workout plan suggestions — not in v1 or v1.1, focus on usability first
- Real-time messaging between trainer and trainee — future feature
- Native iOS/Android apps — PWA covers the gym use case well
- Payments/billing — not in v1
- Offline logging with sync — significant complexity, defer post v1.1
- Smartwatch integration (Apple Watch, Garmin) — deferred, storage/bandwidth concerns
- Social feed / community features — anti-feature for current focus

## Context

- **Deployed:** https://forge-three-tau.vercel.app (public beta since 2026-03-31)
- **Stack:** Next.js 15 App Router · TypeScript · Supabase (Postgres + RLS + Auth) · Drizzle ORM (types) · Tailwind CSS · next-intl · @dnd-kit · recharts · Zod · React Hook Form
- **Codebase:** 130 TS/TSX files · ~15,600 lines · 265 commits
- **i18n:** Polish default, English available; 8 translation JSON files (~170 keys)
- **DB migrations:** 0001–0012 (latest: 0012 adds rpe_target/rir_target/weight_increment_per_week to schema_exercises and assigned_schema_exercises)
- **Design system:** Dark navy (#0f172a base) + emerald accent (#34d399) + Lato font; 8 color tokens as Tailwind `@theme` inline utilities
- **Beta feedback addressed:** Post-launch Phase 12 fixed progression parameter display, nav alignment, DnD on assigned schema editor, body-weight tab visibility, loading skeletons, Gravatar docs, i18n audit

## Constraints

- **Platform**: Progressive Web App (PWA) — mobile-first, installable to home screen
- **Multi-tenancy**: Multiple trainers with isolated client rosters (RLS on all tables)
- **Demo accounts**: Cannot change password (server-action guard + UI hide)

## Key Decisions

| Decision                                                      | Rationale                                                            | Outcome                                                             |
| ------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| PWA over native apps                                          | No app store friction, works on all devices, covers gym use case     | ✓ Good — works well in mobile browser, home-screen install works    |
| Supabase + RLS for multi-tenancy                              | Server-enforced isolation without application-layer complexity       | ✓ Good — zero cross-tenant data leaks in testing                    |
| Invite-link connection (not direct email)                     | Simpler UX, no email lookup privacy issues                           | ✓ Good — trainers prefer sharing a link over knowing trainee emails |
| next-intl 4.x with cookie-based locale                        | Polish-first market, simple switcher                                 | ✓ Good — no URL prefix needed, works with App Router middleware     |
| Server Actions for mutations                                  | Avoids API route boilerplate, type-safe end-to-end                   | ✓ Good — consistent pattern across all 50+ mutations                |
| Recharts for progress charts                                  | Lightweight, good React integration, no license cost                 | ✓ Good — renders well on mobile                                     |
| @dnd-kit for exercise reordering                              | Accessible, works in Next.js App Router without issues               | ✓ Good — used on both plan template and assigned schema editors     |
| Smartwatch integration deferred                               | Too complex for MVP scope, HealthKit needs native bridge             | — Deferred to v2+                                                   |
| Progression modes (linear/RPE/RIR/double) on schema exercises | Beta feedback: trainers need to specify target values, not just mode | ✓ Built in Phase 12                                                 |

---

_Last updated: 2026-04-01 after v1.0 milestone shipped_
