# Feature Research

**Domain:** Trainer-client workout tracking PWA (strength training / gym)
**Researched:** 2026-02-28
**Confidence:** MEDIUM (competitive landscape well-documented; smartwatch PWA constraints HIGH confidence; specific UX patterns MEDIUM)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Exercise library with sets/reps/weight fields | Every workout tracker since 2015 has this; without it the product is not a workout tracker | LOW | Start with curated list (~100-200 common gym exercises); custom exercise creation is a differentiator |
| Previous session data visible inline during logging | Core value proposition of this product — it's what replaces the spreadsheet. Strong, Hevy, TrainHeroic all show prior session numbers during active logging | MEDIUM | Per-exercise, per-trainee. Must be surfaced without extra taps during the workout |
| Trainer creates multi-week structured plans | TrueCoach, TrainHeroic, Trainerize all have plan builders; trainers expect to see a calendar/week view of their programming | MEDIUM | Week schemas not one-off sessions. Trainer sees N weeks ahead |
| Trainer assigns plan to trainee | Core of the trainer-client relationship; without it the app is a solo logger | LOW | Direct assignment + invite code / link flow both expected |
| Trainee views current week's workout schema | Trainees need to know "what am I doing today"; must work at the gym without confusion | LOW | Show today's session prominently; show full week for context |
| Trainee logs sets/reps/weight during workout | The core in-gym action. Must be fast — under 60 seconds per exercise | LOW | Tapping +1 rep, increment weight — speed matters more than completeness |
| Trainer dashboard with all trainee progress | TrueCoach and TrainHeroic both offer this; trainers expect to scan all clients' compliance and results | MEDIUM | Aggregate view: who trained, what weights, which week of plan |
| Offline-capable logging | Gyms have poor WiFi/signal. Every serious logging app (Strong, Hevy) works offline and syncs later | MEDIUM | Service worker + IndexedDB local queue; sync on reconnect |
| PWA installable to home screen | If users must browser-navigate every gym visit, they won't use it. Home screen install is the key PWA value | LOW | Web App Manifest + HTTPS; works on Android Day 1, iOS Safari requires prompting |
| Multi-trainer isolation | Each trainer manages their own client roster independently; trainers must not see each other's clients | MEDIUM | Multi-tenant data model; trainer = account owner, trainees scoped to trainer |
| Trainee invite / join flow | Standard across all platforms: trainers share a code or link, trainees join without friction | LOW | Short invite code or shareable URL; no admin approval loop needed |
| Rest timer between sets | Every gym app (Strong, Hevy) has one; lifters rely on timed rest periods | LOW | Countdown timer that persists while logging; optional notification on completion |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Last week's results inline — the spreadsheet killer | The explicit core value: trainees see exactly what they lifted last time without navigating away. Setgraph describes this as "you pull up the exercise, see what you did last time, and aim to beat it." TrueCoach and TrainHeroic bury this in history views | MEDIUM | This must be visually prominent during active logging — not a tap-away. Pre-load data before gym visit |
| Trainer sees plan adherence at a glance | Trainers today use Google Sheets to track who did what; a clean dashboard showing "Maria: Week 3, completed 4/5 sessions, squat 1RM up 5kg" is genuinely differentiating | MEDIUM | Per-trainee weekly completion %, weight progression graphs |
| Apple Watch heart rate + workout confirmation import | TrueCoach integrates with Apple Health but most competitors treat it as an afterthought. A first-class "confirm your workout + HR data" import flow makes the trainer's data richer | HIGH | CRITICAL CONSTRAINT: HealthKit requires a native iOS companion app — a PWA running in iOS Safari cannot read HealthKit. Must be a separate iOS shortcut/companion or use a health data aggregator |
| Garmin workout confirmation import | Garmin Connect API is a real web API (unlike HealthKit) — workouts pushed to the web backend via webhook when user syncs. Differentiating because most trainer apps ignore Garmin users | HIGH | Garmin Developer Program requires business approval. Activity API provides workout summaries. No native app required for Garmin — this is web-accessible |
| Progressive overload suggestions | Show "+2.5kg from last week?" as a suggestion when the trainee opens the set logging view. TrainHeroic does working max calculations; most competitors do not surface suggestions proactively | MEDIUM | Simple rule: if trainee completed all reps at target weight last session, suggest weight increment. Can be manual before adding any ML |
| Plan template library for trainers | Trainers often run the same 12-week program with multiple clients. A saved template system saves significant time. TrueCoach has this; smaller tools do not | MEDIUM | Trainer creates plan template, then instantiates for each trainee (with start-date offset) |
| Strength progression chart per exercise | Trainee can see their squat 1RM curve over 8 weeks. TrainHeroic's analytics section is praised in reviews. Most solo loggers (Strong, Hevy) have this; trainer-client apps often don't expose it to trainees | MEDIUM | Per-exercise weight over time. Use estimated 1RM (Epley formula) as well as actual logged maxes |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time trainer-trainee messaging / chat | "Trainers want to communicate with clients in the app" — all major platforms (TrueCoach, Trainerize) have this | Doubles the product scope. Chat is a product unto itself (read receipts, media, notifications, moderation). Most apps that build it find adoption is low because clients use WhatsApp/iMessage anyway | Link to existing tools. Add a "notes" field on each workout session that the trainer can see. Explicit out-of-scope per PROJECT.md |
| AI-generated workout plans | "Make the trainer's job easier" — Hevy and Jefit now ship AI plan generation | Requires significant training data, and trainers do not trust AI output for their clients in v1. Adds LLM integration complexity and cost. Positioning risk: this is about empowering trainers, not replacing them | Build excellent manual plan creation tools first. AI suggestions can layer on top of real usage data in v2. Explicit out-of-scope per PROJECT.md |
| Nutrition / macro tracking | MyFitnessPal integration requests are common | MyFitnessPal has 20.5M food items and 35 integrations. Building even 10% of this is months of work with no differentiation. Nutrition is a separate domain from workout tracking | Offer MyFitnessPal read integration via TrueCoach-style wiring in v2. Don't build the food database |
| Social feed / community | Hevy and TrainHeroic have leaderboards and social feeds; users ask for them | Social features require moderation, content policy, abuse handling. Hevy users explicitly complain that the social feed is distracting and clutters the workout logging experience. Wrong audience: trainer-client relationship is private, not social | Progress sharing via shareable link (e.g., "share your PR") is low-effort and social-lite without the feed overhead |
| Payments and billing | "Complete trainer business management" — Trainerize and TrueCoach both include billing | Payments add significant compliance surface (PCI DSS, Stripe integration, invoice disputes). No competitive value here for v1: trainers handle billing outside the app today and don't need it in the workout tracker | Explicit out-of-scope per PROJECT.md. Add in v2 if trainers request it after adoption |
| Video exercise instructions | Every major competitor (TrueCoach 2,500+ videos, TrainHeroic 1,500+) has exercise demo videos | A video library is a content production problem, not an engineering problem. Building it from scratch costs months. Licensing is expensive | Link to YouTube for exercise demos. Trainers can attach their own custom video URLs. Ship this as a field, not a library |
| Real-time collaboration on plans | "Two trainers editing the same plan" | Adds CRDT/OT complexity with nearly zero market demand for small-trainer use case | Single-owner model: each plan has one trainer. Solves the actual use case |
| Native iOS / Android apps | Users sometimes prefer "real apps" | App store review delays (days-weeks), forced updates, platform fees (30%). PWA covers the gym use case per PROJECT.md | PWA with home-screen installation covers the gym use case. Revisit if retention data demands it |

---

## Feature Dependencies

```
[Trainer account + auth]
    └──requires──> [Multi-trainer isolation (tenant model)]

[Trainee account + auth]
    └──requires──> [Invite / join flow]
                       └──requires──> [Trainer account]

[Workout plan creation (trainer)]
    └──requires──> [Exercise library]
    └──requires──> [Multi-week schema structure]

[Trainee views current week]
    └──requires──> [Workout plan creation]
    └──requires──> [Plan assignment to trainee]

[Trainee logs session]
    └──requires──> [Trainee views current week]
    └──enhances──> [Previous session data inline]
                       └──requires──> [At least 1 prior logged session]

[Trainer progress dashboard]
    └──requires──> [Trainee logs session]
    └──requires──> [Multi-trainee roster]

[Rest timer]
    └──enhances──> [Trainee logs session]

[Offline logging]
    └──enhances──> [Trainee logs session]
    └──requires──> [Service worker + local queue]

[Strength progression charts]
    └──requires──> [Trainee logs session] (multiple sessions needed)

[Apple Watch HR import]
    └──requires──> [iOS companion app OR health aggregator] (PWA cannot access HealthKit)
    └──enhances──> [Trainer progress dashboard]

[Garmin workout import]
    └──requires──> [Garmin Connect API webhook setup]
    └──requires──> [Garmin Developer Program approval]
    └──enhances──> [Trainer progress dashboard]
```

### Dependency Notes

- **Trainee session logging requires previous-session data to be meaningful**: The inline "last week" view only has value after the first logged workout. Design the empty state carefully.
- **Offline logging conflicts with real-time sync**: If two devices log the same session (e.g., trainee logs on phone + web), conflict resolution is needed. Prevent with a "session lock" model.
- **Apple Watch integration requires a native iOS component**: This is a hard platform constraint. HealthKit has no web API. The PWA cannot read Apple Health data directly from iOS Safari. Plan for a separate iOS shortcut/companion app or a health aggregator (e.g., Thryve) that bridges HealthKit to your web backend.
- **Garmin is different from Apple**: Garmin Connect API is a real REST/webhook API. Garmin Developer Program approval takes ~2 business days. No native app required.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Trainer auth + account creation** — foundation for multi-tenant isolation
- [ ] **Multi-trainer isolation** — each trainer sees only their own clients
- [ ] **Exercise library (curated, ~150 exercises)** — trainers need exercises to build plans
- [ ] **Workout plan creation with multi-week schemas** — trainer creates N-week program, defines exercises/sets/reps/weight targets per week
- [ ] **Plan template save + instantiate** — trainer can reuse a plan across multiple clients
- [ ] **Trainee invite flow (invite code / link)** — trainer shares code, trainee joins
- [ ] **Trainee views current week's workout** — today's session prominent, full week available
- [ ] **Trainee logs sets/reps/weight** — fast tap-based logging with +/- increments
- [ ] **Previous session data inline during logging** — the core value; must be visually prominent
- [ ] **Rest timer** — between sets; persistent while logging
- [ ] **Offline-capable logging with sync** — service worker + local queue; essential for gym use
- [ ] **Trainer dashboard: per-trainee progress** — who logged what, weights over time
- [ ] **PWA installable to home screen** — Web App Manifest, HTTPS, install prompt
- [ ] **Apple Watch HR + workout confirmation import** — user-specified v1 requirement; NOTE: requires iOS companion or health aggregator; must be scoped before building
- [ ] **Garmin workout confirmation import** — user-specified v1 requirement; web API available

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Strength progression charts (trainee view)** — add once trainees have 3+ sessions of data to chart
- [ ] **Progressive overload weight suggestions** — simple rule-based: suggest increment when all reps completed
- [ ] **Custom exercise creation** — trainers add their own exercises with notes/video URL
- [ ] **Workout plan compliance % per trainee** — aggregate completion rate once enough data exists
- [ ] **Push notifications** — remind trainee of scheduled session; notify trainer when trainee logs

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **AI workout plan generation** — requires real usage data and trainer trust; explicit v1 out-of-scope
- [ ] **In-app messaging** — WhatsApp/iMessage covers this; build only with strong evidence trainers want it in-app
- [ ] **Nutrition / macro tracking** — separate domain; integrate with MyFitnessPal if needed
- [ ] **Social feed / leaderboard** — wrong fit for trainer-client relationship model
- [ ] **Payments / billing** — trainers handle this outside the app today
- [ ] **Native iOS/Android apps** — revisit after PWA adoption data

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Trainee logs sets/reps/weight | HIGH | LOW | P1 |
| Previous session data inline | HIGH | MEDIUM | P1 |
| Trainer creates multi-week plan | HIGH | MEDIUM | P1 |
| Plan assignment to trainee | HIGH | LOW | P1 |
| Trainee views current week | HIGH | LOW | P1 |
| Multi-trainer isolation | HIGH | MEDIUM | P1 |
| Offline logging (PWA) | HIGH | MEDIUM | P1 |
| Exercise library | HIGH | LOW | P1 |
| Trainer progress dashboard | HIGH | MEDIUM | P1 |
| Invite / join flow | HIGH | LOW | P1 |
| Rest timer | MEDIUM | LOW | P1 |
| Apple Watch HR import | MEDIUM | HIGH | P1 (v1 requirement, but complex) |
| Garmin workout import | MEDIUM | HIGH | P1 (v1 requirement, web API available) |
| Plan template library | MEDIUM | MEDIUM | P2 |
| Strength progression charts | MEDIUM | MEDIUM | P2 |
| Progressive overload suggestions | MEDIUM | LOW | P2 |
| Custom exercise creation | LOW | LOW | P2 |
| Push notifications | MEDIUM | MEDIUM | P2 |
| AI plan generation | LOW | HIGH | P3 |
| In-app messaging | LOW | HIGH | P3 |
| Nutrition tracking | LOW | HIGH | P3 |
| Social feed | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | TrueCoach | TrainHeroic | Hevy | Strong | Our Approach |
|---------|-----------|-------------|------|--------|--------------|
| Plan builder | Calendar-based, multi-week | Yes, with marketplace | Routine templates (not multi-week programs) | Routine templates | Multi-week schema with week-number progression |
| Previous session inline | Visible in workout | Visible in workout | Visible (last session) | Visible (last session) | Prominent, primary UI element — not buried |
| Trainer dashboard | Yes, per-client compliance | Yes, analytics section | Hevy Coach add-on | N/A (solo app) | Lightweight but actionable: who trained, weights trending |
| Progress charts | Yes (trainer view) | Strong analytics | Monthly reports, muscle group charts | Basic charts | Trainee-visible charts (v1.x); trainer-visible v1 |
| Exercise library | 2,500+ with videos | 1,500+ with videos | Large library + custom | Large library | ~150 curated, no video library (link YouTube) |
| Smartwatch integration | Apple Health, Garmin, OURA, Fitbit | Limited | Strava only | None | Apple Watch (requires iOS companion) + Garmin (web API) |
| Offline support | Native app (always offline) | Native app | Native app | Native app | PWA with service worker + IndexedDB |
| Messaging | Yes, in-app | Limited | No | No | No (out of scope v1) |
| Payments | Yes | Yes | Hevy Coach subscription | N/A | No (out of scope v1) |
| Social / community | No | Leaderboards, team features | Social feed, 11M users | No | No (wrong fit for trainer-client model) |
| Invite flow | Client management via email | Invite by email/code | Friend request | N/A | Short invite code + shareable link |
| AI features | No | No | HevyGPT (beta) | No | No (out of scope v1) |

---

## Smartwatch Integration: Critical Constraints

This section surfaces constraints that affect scope and architecture decisions.

### Apple Watch / HealthKit

**Constraint (HIGH confidence):** HealthKit has no web API. A PWA running in iOS Safari cannot read Apple Health or Apple Watch data directly. This is a hard platform constraint from Apple.

**What this means for v1:**
- Option A: Build a minimal iOS companion app (Swift shortcut or small iOS app) that reads HealthKit and POSTs workout data + HR to the backend. This is the standard pattern (TrueCoach, Trainerize all do this via native apps).
- Option B: Use a health aggregator like Terra API or Thryve that provides an SDK bridging HealthKit to a web backend. Requires trusting a third party with user health data.
- Option C: Manual import — user exports health data from Apple Health and uploads. Low friction but not seamless.

**Recommendation:** Treat Apple Watch as a "confirm workout happened + HR summary" feature, not deep integration. Option A (small iOS shortcut) is the most defensible path but increases scope. Plan a dedicated research spike before building.

### Garmin

**Constraint (MEDIUM confidence):** Garmin Connect Developer Program provides a real REST/webhook API. Garmin sends workout summaries to a webhook endpoint when the user syncs their device. No native app required. Requires business approval (~2 business days) and some premium metrics have license fees.

**What this means for v1:** Garmin integration is feasible as a pure web feature. The main complexity is OAuth flow (user authorizes Garmin Connect to push data to the app) and webhook ingestion endpoint.

---

## Sources

- [TrueCoach Features](https://truecoach.co/features/) — Official feature list (MEDIUM confidence, page content sparse)
- [TrainHeroic Athlete Page](https://www.trainheroic.com/athlete/) — Official (MEDIUM confidence)
- [Hevy Features](https://www.hevyapp.com/features/) — Official feature list (HIGH confidence, fetched directly)
- [Strong vs Hevy Comparison 2026](https://gymgod.app/blog/strong-vs-hevy) — Third party comparison (MEDIUM confidence)
- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit) — Official Apple docs (HIGH confidence)
- [What You Can (and Can't) Do With Apple HealthKit Data](https://www.themomentum.ai/blog/what-you-can-and-cant-do-with-apple-healthkit-data) — HealthKit PWA constraint (MEDIUM confidence, corroborated by official docs)
- [Garmin Connect Developer Program — Training API](https://developer.garmin.com/gc-developer-program/training-api/) — Official Garmin docs (HIGH confidence)
- [Garmin Activity API](https://developer.garmin.com/gc-developer-program/activity-api/) — Official Garmin docs (HIGH confidence)
- [TrueCoach vs Trainerize comparison](https://www.exercise.com/grow/comparison/trainerize-vs-trainerize/) — Competitive analysis (LOW confidence, single source)
- [Setgraph workout tracker review](https://setgraph.app/ai-blog/best-app-to-log-workout-tested-by-lifters) — In-workout UX patterns (MEDIUM confidence)
- [Stormotion fitness app UX](https://stormotion.io/blog/fitness-app-ux/) — UX patterns for gym apps (MEDIUM confidence)
- [Trainerize client onboarding guide](https://www.trainerize.com/blog/the-ultimate-guide-to-onboarding-new-fitness-clients/) — Onboarding best practices (MEDIUM confidence)
- [PWA best practices 2026](https://wirefuture.com/post/progressive-web-apps-pwa-best-practices-for-2026) — PWA offline patterns (MEDIUM confidence)

---

*Feature research for: Trainer-client workout tracking PWA*
*Researched: 2026-02-28*
