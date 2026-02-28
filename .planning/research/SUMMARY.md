# Project Research Summary

**Project:** Gym AI Assistant — Trainer/Trainee Workout Tracking PWA
**Domain:** Multi-tenant mobile-first PWA, strength training / gym, smartwatch integration
**Researched:** 2026-02-28
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a multi-tenant SaaS PWA where personal trainers create and assign structured workout plans to their clients, clients log sets and reps at the gym, and trainers review progress. The canonical implementation approach is Next.js 15 (App Router) with Supabase as the full backend — PostgreSQL Row-Level Security enforces tenant isolation natively, eliminating the need for a custom authorization layer. Offline capability is non-negotiable: gyms have poor connectivity, and trainees must be able to log sets without a network and have them sync automatically on reconnect. This is achieved through Serwist (service worker) and TanStack Query's IndexedDB-persisted offline mutation queue.

The most strategically important early decision is smartwatch integration. Apple Watch / HealthKit has no web API — this is a hard platform constraint from Apple. Accessing HealthKit requires a native iOS companion app (Expo + `react-native-health`). Garmin Connect has a proper REST/webhook API but requires a formal business application with a 1-4 week integration lead time after approval. Both constraints must be acknowledged before the project begins, not discovered mid-development. The recommended mitigation is to apply for Garmin Developer Program access on day one and to treat Terra API (a paid unified wearable aggregator) as a ready fallback for both integrations if timelines are at risk.

The architecture cleanly separates trainer and trainee surfaces via Next.js route groups: trainer pages use React Server Components for fast initial loads of large client rosters; trainee workout logging uses Client Components with TanStack Query for optimistic updates and offline queuing. Multi-tenant isolation is enforced entirely at the database layer via Supabase RLS policies. The recommended build order is: foundation and auth first, then trainer plan builder, then trainee logging (the core value loop), then offline/PWA hardening, then trainer dashboard analytics, and finally smartwatch integration. Building in this dependency order avoids the trap of building dashboards before any data exists to display.

## Key Findings

### Recommended Stack

The core stack is Next.js 15 (App Router) + React 19 + TypeScript + Supabase + Drizzle ORM + Tailwind CSS v4 + shadcn/ui. Drizzle is preferred over Prisma for its smaller bundle size and edge runtime compatibility. Serwist is the only maintained option for Next.js service workers — the popular `next-pwa` (shadowwalker) package is unmaintained and incompatible with Next.js 15. For smartwatch integration, the paths diverge sharply: Garmin uses a standard OAuth 2.0/webhook flow from the web backend, while HealthKit requires an Expo React Native companion app. Terra API is a viable $0.01-0.05/user/month fallback that covers both paths with no approval process.

**Core technologies:**
- **Next.js 15 (App Router):** Full-stack framework — Server Components for trainer dashboard, Server Actions for plan creation, PWA manifest support
- **Supabase:** Auth + PostgreSQL + Realtime + Storage — RLS enforces multi-tenant isolation natively; JWT roles; Realtime WebSocket for trainer dashboard live updates
- **Drizzle ORM:** Type-safe DB queries — smaller bundle than Prisma, edge-runtime compatible, drives both schema and TypeScript types
- **Serwist:** Service worker / offline — officially recommended by Next.js docs; Workbox successor with active maintenance
- **TanStack Query v5:** Client-side state + offline mutations — `networkMode: 'offlineFirst'` with IndexedDB persister for gym offline use
- **Zustand:** In-workout UI state only — active exercise, timer state, unsaved rep counts (server state stays in TanStack Query)
- **Tailwind CSS v4 + shadcn/ui:** Styling — CSS-first config, mobile-first utilities, unstyled components that avoid mobile screen conflicts
- **Expo + react-native-health:** iOS companion app for HealthKit bridge — required because HealthKit has no web API
- **Terra API (fallback):** Unified wearable aggregator covering Garmin and HealthKit — use if timeline is tight

**Critical version notes:**
- Serwist requires webpack (not Turbopack) for service worker builds — use `--no-turbopack` when testing offline behavior
- Use `@supabase/ssr` (not the deprecated `@supabase/auth-helpers-nextjs`)
- HealthKit companion app requires `expo prebuild` custom dev client — does NOT work in Expo Go

### Expected Features

The core value proposition is: trainers create multi-week structured programs, trainees log sets at the gym while seeing exactly what they lifted last time, and trainers monitor progress without spreadsheets. Every feature decision maps to this loop.

**Must have (table stakes):**
- Exercise library with sets/reps/weight fields — product is not a workout tracker without this
- Trainer creates multi-week structured plans — trainers expect week-by-week schema building
- Plan assignment to trainee with start date — the trainer-client relationship foundation
- Trainee views current week's workout — must resolve "what am I doing today" immediately
- Previous session data inline during logging — the core differentiator, must be visually prominent during active sets
- Trainee logs sets/reps/weight — fast one-handed tap-based UX, under 60 seconds per exercise
- Rest timer — every gym app has one; lifters rely on it
- Offline-capable logging with sync — essential for gym environments
- Trainer dashboard with per-trainee progress — compliance rates and weight progression
- Multi-trainer isolation — Supabase RLS at DB level
- Trainee invite/join flow — invite code or shareable link
- PWA installable to home screen — required for iOS push and offline reliability
- Apple Watch HR + workout confirmation import — user-specified v1 requirement (high complexity)
- Garmin workout confirmation import — user-specified v1 requirement (web API available)

**Should have (competitive differentiators):**
- Progressive overload weight suggestions — rule-based increment suggestions when all reps completed
- Plan template save + instantiate — trainer reuses programs across clients
- Strength progression charts (trainee-visible) — add after trainees have 3+ sessions of data
- Custom exercise creation with trainer notes/video URL
- Push notifications — workout reminders, trainer alerts on client log completion
- Workout plan compliance percentage per trainee

**Defer to v2+:**
- AI-generated workout plans — requires real usage data and trainer trust; positioning risk in v1
- In-app messaging — WhatsApp/iMessage already covers this; low adoption when built
- Nutrition/macro tracking — separate domain entirely; integrate with MyFitnessPal if needed
- Social feed or leaderboard — wrong fit for private trainer-client relationship model
- Payments/billing — trainers handle this outside the app today
- Native iOS/Android apps — revisit after PWA adoption data

### Architecture Approach

The system uses Next.js route groups to enforce a clean separation between trainer and trainee surfaces — `(trainer)` renders a desktop-friendly sidebar layout with Server Components; `(trainee)` renders a mobile bottom-nav layout with Client Components backed by TanStack Query. Supabase RLS policies handle all tenant isolation at the database layer, meaning there is no application-level authorization code to maintain or audit. Roles are stored in `auth.users.raw_app_meta_data` (server-only, unmodifiable by clients) and read in Next.js middleware via JWT claims. Offline writes are queued in IndexedDB via TanStack Query's `persistQueryClient` persister and replayed on reconnect via `resumePausedMutations`. Smartwatch data arrives via two paths: Garmin pushes webhook events to a Next.js Route Handler; Apple Watch data is POSTed by the iOS companion app to a separate sync endpoint.

**Major components:**
1. **Next.js Middleware** — auth check + role-based route guard at the edge before any page renders
2. **`/(trainer)` Route Group** — Server Component-driven plan builder, client roster, and progress charts
3. **`/(trainee)` Route Group** — Client Component-driven workout logging with optimistic updates and offline queue
4. **Supabase RLS** — multi-tenant data isolation enforced at PostgreSQL row level
5. **Service Worker (Serwist)** — static asset precache, StaleWhileRevalidate for workout plan data, offline write queue
6. **Garmin OAuth + Webhook Handlers** — Route Handlers in `app/api/garmin/` for OAuth exchange and activity push
7. **HealthKit Sync Endpoint** — `app/api/healthkit/sync/` receives POSTs from iOS companion app
8. **iOS Companion App (Expo)** — reads HealthKit on-device, posts to backend; minimal app, not a full product experience

**Key data model decisions:**
- Trainer-scoped exercise library (no global shared library in v1 — avoids naming conflicts and RLS complexity)
- `plan_assignments.start_date` anchors week calculation — week number is computed from date arithmetic
- `set_logs(trainee_id, exercise_id, logged_at)` composite index required from day one
- `health_events` table normalizes wearable data with `raw_data jsonb` for future parsing
- Garmin OAuth tokens encrypted at rest using Supabase Vault or pgcrypto

### Critical Pitfalls

1. **HealthKit has no web API** — accept this as a hard constraint on day one. A PWA running in iOS Safari cannot read Apple Health data. The only options are: (a) Expo companion app with custom dev client and HealthKit entitlements, (b) Terra API as a third-party bridge. Planning any other approach is wasted work.

2. **Garmin Developer Program approval is a hard dependency with unknown timeline** — apply to the Garmin Connect Developer Program (`developer.garmin.com`) on project kickoff, not when smartwatch work begins. Approval takes 2 business days for initial response but 1-4 weeks for full integration. Build the OAuth UI and mock webhook handler while waiting. Have Terra API as a confirmed fallback plan.

3. **TanStack Query offline mutations silently fail after page refresh** — mutation functions cannot be serialized to IndexedDB. After a page reload, queued mutations have state but no function to execute. Fix: call `queryClient.setMutationDefaults()` for every offline-capable mutation at app startup, then call `resumePausedMutations()` after session confirmation. This is the foundational offline contract — document it and enforce it in code review.

4. **Supabase RLS disabled by default, and SQL Editor bypasses it entirely** — every new table created during development must have RLS enabled and at least a deny-all default policy in the same migration. Never treat a query that "works in Studio" as proof that RLS is correct — test using the Supabase client SDK with a real user session.

5. **iOS PWA push notifications require home screen installation** — push only works for PWAs installed in standalone mode on iOS 16.4+. Most iOS users never complete the multi-step Add to Home Screen flow. Build a first-run onboarding screen with step-by-step iOS install instructions. Never test push only on Android and call it done. Plan fallback in-app reminders for users who do not install.

6. **iOS Safari evicts PWA storage after 2-3 weeks of inactivity** — offline set logs that were queued and not yet synced can be permanently lost. Mitigate by double-writing offline mutations to both IndexedDB and a Supabase "pending sync" queue, and by showing the trainee a "last synced" timestamp with a manual refresh button. Do not cache exercise demo videos in Cache Storage — the 50MB limit evaporates quickly with video content.

7. **N+1 queries for previous session inline results** — fetching last week's set logs per-exercise (8-10 separate queries) causes a timeout cascade on poor gym WiFi. Instead, fetch all set logs for the previous session in a single query at page load and distribute to exercise cards from the TanStack Query cache. One query, instant offline render.

## Implications for Roadmap

Research strongly supports a 6-phase build order. The order is driven by data dependencies (cannot show progress without logs, cannot log without a plan) and risk mitigation (complex external integrations come last, after the core works).

### Phase 0: Project Setup and External Blockers
**Rationale:** Two hard dependencies require lead time that cannot be parallelized with development. Both must be addressed before code is written.
**Delivers:** Confirmed Garmin API access (or Terra API fallback decision made), scoped HealthKit approach (companion app vs. Terra), initialized Next.js project with Supabase, development tooling configured.
**Addresses:** Garmin Developer Program application (Pitfall 2), HealthKit strategy decision (Pitfall 1), Vercel Hobby-to-Pro upgrade path confirmed.
**Avoids:** Discovering external API access is blocked mid-development when it halts the entire smartwatch phase.

### Phase 1: Foundation — Auth, Multi-Tenant, RLS
**Rationale:** Everything else depends on a correct auth and data isolation layer. Getting this wrong is expensive to fix later. Role storage in `app_metadata`, RLS policies, and middleware routing must be correct from the start.
**Delivers:** Trainer and trainee auth flows, multi-tenant isolation enforced at DB level, role-based route protection in middleware, invite/join flow, core DB schema with indexes.
**Addresses:** Exercise library, auth, trainer/trainee account creation, multi-trainer isolation.
**Avoids:** Role stored in user-editable profile field (Pitfall 8), RLS disabled on new tables (Pitfall 6), missing composite index on `set_logs` (add in initial migration).
**Research flag:** Standard patterns — Supabase RLS + Next.js middleware are well-documented. No phase research needed.

### Phase 2: Trainer Plan Builder
**Rationale:** Trainers must be able to create plans before trainees can log anything. The plan builder drives the `workout_plans`, `plan_weeks`, `plan_sessions`, `plan_exercises` schema and the trainer-facing UI.
**Delivers:** Trainer creates multi-week programs, defines exercises/sets/reps/weight per week, assigns plans to trainees with a start date, saves plan templates for reuse.
**Addresses:** Exercise library CRUD, plan creation UI, multi-week schema, plan template save + instantiate, plan assignment.
**Avoids:** Building trainer dashboard before logging works (anti-pattern).
**Research flag:** Standard patterns. No phase research needed.

### Phase 3: Trainee Workout Logging (Core Value Loop)
**Rationale:** This is the product's core value — the feature that replaces the spreadsheet. Must be fast, simple, and correct. All subsequent phases depend on real workout data existing.
**Delivers:** Trainee opens app, sees today's workout, logs sets with previous-week results visible inline, rest timer between sets, workout history view.
**Addresses:** Trainee views current week, logs sets/reps/weight, previous session inline, rest timer.
**Avoids:** N+1 queries for inline last-week results (Pitfall 7), plan week calculation timezone bugs.
**Research flag:** Standard patterns for the logging UI. Week resolution logic (date arithmetic from `start_date`) needs careful timezone testing — document the shared pure function used server-side and client-side.

### Phase 4: PWA Hardening and Offline Capability
**Rationale:** Offline logging is table stakes for gym use. Must follow Phase 3 (needs real mutations to queue), not precede it. iOS Safari storage constraints and push notification limitations are the most surprising pitfalls in this phase.
**Delivers:** Serwist service worker with workout plan caching, TanStack Query `persistQueryClient` with offline mutation queue, iOS Add to Home Screen onboarding, offline indicator UI, push notification scaffolding (web-push), PWA manifest for installability.
**Addresses:** Offline-capable logging, PWA installable to home screen, rest timer persisting while offline.
**Avoids:** TanStack Query offline mutations silently failing (Pitfall 5 — `setMutationDefaults` + `resumePausedMutations` must be wired here), iOS Safari storage eviction (Pitfall 4), iOS PWA push limitations (Pitfall 3).
**Research flag:** Needs careful implementation — multiple documented failure modes. The offline mutation contract (`setMutationDefaults` + `resumePausedMutations`) must be treated as a first-class feature with explicit test cases: offline → log sets → close app → reopen → reconnect → confirm sync.

### Phase 5: Trainer Dashboard and Progress Analytics
**Rationale:** Can only be built meaningfully after real workout logs exist from Phase 3. Progress charts with no data are untestable and give false confidence.
**Delivers:** Trainer client roster overview, per-trainee progress charts (Recharts), weight progression over time, plan compliance percentage, Supabase Realtime subscriptions for live dashboard updates.
**Addresses:** Trainer dashboard with all trainee progress, strength progression charts, plan adherence at a glance.
**Avoids:** RLS subquery performance trap (Pitfall 7 — verify `EXPLAIN ANALYZE` with `(SELECT auth.uid())` wrapping and composite index on `set_logs`), Realtime subscriptions accumulating for inactive tabs.
**Research flag:** Standard patterns for Recharts + Supabase Realtime. No phase research needed. Run `EXPLAIN ANALYZE` with realistic row counts before calling this phase done.

### Phase 6: Smartwatch Integration
**Rationale:** Technically the most complex phase due to external APIs, OAuth flows, and a native iOS app. Comes last because it enhances an already-working product — it never blocks the core loop.
**Delivers:** Garmin Connect OAuth flow, webhook ingestion, health_events import and linking to workout logs; iOS Expo companion app reading HealthKit, posting to sync endpoint; health data visible in trainee profile and trainer client view.
**Addresses:** Apple Watch HR + workout confirmation import, Garmin workout confirmation import.
**Avoids:** HealthKit web API assumption (Pitfall 1), Garmin API access not confirmed (Pitfall 2), Garmin tokens stored unencrypted (security), webhook endpoint without HMAC validation.
**Research flag:** NEEDS PHASE RESEARCH. Both Garmin and HealthKit integrations have complex setup requirements. Garmin webhook HMAC validation, token refresh (3-month expiry), FIT file parsing, and Expo custom dev client build process all need specific implementation guidance. If Garmin approval is not confirmed by the time this phase begins, activate Terra API fallback.

### Phase Ordering Rationale

- Phases 0-3 deliver the complete core value loop (trainer creates plan, trainee logs workout) before touching infrastructure complexity
- Phase 4 (offline) deliberately follows Phase 3 — you need real mutations to queue and test; building offline infrastructure before there are mutations to queue is premature
- Phase 5 (dashboard) comes after Phase 3 because trainer analytics charts are meaningless without real logging data — building charts first leads to schema bugs discovered too late
- Phase 6 (smartwatch) is last because both integration paths are complex and external-dependent. The core product works completely without them

### Research Flags

Phases needing deeper research during planning:
- **Phase 6 (Smartwatch Integration):** Both Garmin webhook mechanics and Expo HealthKit companion app are complex integrations with multiple documented failure modes. Needs a dedicated research spike before implementation planning.
- **Phase 4 (PWA Offline):** iOS Safari storage eviction and TanStack Query offline mutation edge cases are well-documented but tricky to implement correctly. Worth reviewing current Serwist + Next.js 15 compatibility notes before starting.

Phases with standard patterns (skip research phase):
- **Phase 1 (Foundation):** Supabase RLS + Next.js App Router middleware patterns are extensively documented with official guides.
- **Phase 2 (Plan Builder):** CRUD with complex nested schema — standard Next.js Server Actions + Drizzle patterns.
- **Phase 3 (Trainee Logging):** TanStack Query optimistic updates + Supabase inserts — well-documented patterns.
- **Phase 5 (Trainer Dashboard):** Recharts + Supabase Realtime subscriptions — straightforward integrations.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core choices verified against official docs (Next.js, Supabase, Serwist, TanStack Query). Smartwatch integration researched against official Apple and Garmin developer docs. |
| Features | MEDIUM-HIGH | Competitor analysis covers TrueCoach, TrainHeroic, Hevy, Strong. HealthKit and Garmin constraints are HIGH confidence from official sources. Specific UX patterns are MEDIUM. |
| Architecture | MEDIUM-HIGH | Core patterns (RSC/Client split, RLS, route groups, offline mutation queue) are verified against official docs. Some data model details synthesized from domain patterns. |
| Pitfalls | HIGH | iOS PWA push, iOS storage eviction, TanStack offline mutation serialization, and RLS default-off are all verified against official Apple/Supabase/TanStack docs or official GitHub issue trackers. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Garmin API approval status:** Must be confirmed before Phase 6 begins. Initiate the business application immediately. This is the only pitfall that cannot be mitigated by better code.
- **Terra API evaluation:** If Garmin approval or HealthKit companion app build threatens v1 timeline, Terra API ($0.01-$0.05/user/month) eliminates both integrations. A decision should be made at Phase 0, not mid-Phase 6.
- **iOS App Store strategy for companion app:** If building the Expo companion app, decide between App Store submission and TestFlight (for v1) early. App Store review adds 1-7 days and requires disclosing HealthKit usage purpose.
- **Plan edit behavior for active trainees:** The PITFALLS.md identifies that trainer edits to an in-progress plan can confuse trainees. The resolution (snapshot-at-assignment vs. versioned plans) is a product decision not yet made — needs resolution before Phase 2.
- **Timezone strategy for week calculation:** `plan_assignments.start_date` is a `date` type (no time zone). The week resolution logic must be consistent across server (UTC) and client (local timezone). Define the canonical behavior before Phase 3.

## Sources

### Primary (HIGH confidence)
- **Next.js Official Docs (PWA Guide)** — https://nextjs.org/docs/app/guides/progressive-web-apps — Serwist recommendation, PWA manifest, push notifications
- **Next.js Route Groups Docs** — https://nextjs.org/docs/app/api-reference/file-conventions/route-groups — Route group layout separation pattern
- **Supabase RLS Docs** — https://supabase.com/docs/guides/database/postgres/row-level-security — `auth.uid()`, `app_metadata` role storage, deny-all pattern
- **Supabase RLS Troubleshooting** — https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv — Per-row subquery optimization, index requirements
- **Apple Developer HealthKit Docs** — https://developer.apple.com/documentation/healthkit — No web API confirmation; local device-only storage
- **Apple Developer: Web Push Notifications** — https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers — iOS 16.4+, home screen install required, standalone mode required
- **Apple Developer Forums: Safari PWA Storage** — https://developer.apple.com/forums/thread/710157 — 7-day inactivity eviction rule
- **Garmin Connect Developer Program FAQ** — https://developer.garmin.com/gc-developer-program/program-faq/ — Business-only approval, 1-4 week integration timeline
- **Garmin Activity API** — https://developer.garmin.com/gc-developer-program/activity-api/ — Webhook delivery, FIT files, 30+ activity types
- **TanStack Query Network Mode Docs** — https://tanstack.com/query/v4/docs/react/guides/network-mode — `networkMode: 'offlineFirst'`, `resumePausedMutations`, `setMutationDefaults`
- **TanStack Query GitHub Issue #3460** — https://github.com/TanStack/query/issues/3460 — Paused mutations not persisted across page refresh; mutationFn not serializable
- **react-native-health GitHub** — https://github.com/agencyenterprise/react-native-health — Custom dev client requirement, HealthKit entitlements
- **Serwist Issue #54** — https://github.com/serwist/serwist/issues/54 — Turbopack support status; webpack required for SW builds

### Secondary (MEDIUM confidence)
- **Terra API** — https://tryterra.co — Unified wearable API covering Garmin and HealthKit
- **Serwist + Next.js Offline Apps** — https://dev.to/sukechris/building-offline-apps-with-nextjs-and-serwist-2cbj — Runtime caching config, `reloadOnOnline: false`
- **TrueCoach Features** — https://truecoach.co/features/ — Competitor feature analysis
- **TrainHeroic Athlete Page** — https://www.trainheroic.com/athlete/ — Competitor feature analysis
- **Hevy Features** — https://www.hevyapp.com/features/ — Competitor feature analysis
- **MobiLoud: PWAs on iOS 2026** — https://www.mobiloud.com/blog/progressive-web-apps-ios — Push notification reach vs. native, iOS constraints
- **Supabase RLS Multi-Tenant Deep Dive** — https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2 — Hierarchical RLS patterns
- **Setgraph workout tracker review** — https://setgraph.app/ai-blog/best-app-to-log-workout-tested-by-lifters — In-workout UX patterns for inline last-week display

---
*Research completed: 2026-02-28*
*Ready for roadmap: yes*
