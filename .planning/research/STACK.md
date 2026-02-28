# Stack Research

**Domain:** Mobile-first PWA — gym workout tracker with trainer/trainee roles, multi-tenant, smartwatch integration
**Researched:** 2026-02-28
**Confidence:** MEDIUM-HIGH (most core choices verified against official docs; smartwatch integration has inherent complexity requiring phase-specific research)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (App Router) | Full-stack React framework | Built-in PWA manifest support, Server Actions for forms, SSR/ISR for trainer dashboard, official Supabase starter template, Turbopack for fast DX. The canonical choice for full-stack React in 2026. |
| React | 19.x | UI layer | Bundled with Next.js 15. Server Components eliminate over-fetching for trainer dashboard; `useOptimistic` enables snappy workout logging UX without a separate state manager. |
| TypeScript | 5.x | Type safety | End-to-end type safety from DB schema (via Drizzle) through API to UI. Required for maintainable multi-role codebase. |
| Supabase | latest (JS SDK ^2) | Database, Auth, Realtime, Storage | PostgreSQL with Row-Level Security natively enforces multi-tenant isolation. Built-in Auth with JWT roles. Realtime subscriptions (WebSocket) for trainer dashboard. Storage for profile/exercise media. Open-source, no vendor lock-in. |
| Drizzle ORM | ^0.39 | Type-safe database queries | Significantly smaller bundle than Prisma (critical for edge/serverless cold starts). SQL-like TypeScript API, zero binary dependencies, runs on edge runtime. Works well with Supabase's PostgreSQL via `@supabase/supabase-js` for RLS auth passthrough or direct connection for migrations. |
| Tailwind CSS | v4.x | Utility-first styling | v4 released with CSS-first configuration (no `tailwind.config.js`). OKLCH color system. Full shadcn/ui compatibility. Mobile-first utilities are idiomatic. |
| shadcn/ui | latest (Tailwind v4 branch) | Component library | Not a dependency — copies source. Updated for Tailwind v4 and React 19. Unstyled-by-default means components work on small mobile screens without fighting design opinions. |
| Serwist | ^9.x | Service worker / offline support | Explicitly recommended by Next.js official docs for offline PWA functionality. Successor to next-pwa (unmaintained). Fork of Workbox with active maintenance. Required to cache workout plans for offline gym use. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/ssr` | ^0.5 | Supabase Auth in Next.js App Router (server/client split) | Always — required for server-side session management in App Router. Replaces deprecated `@supabase/auth-helpers-nextjs`. |
| TanStack Query (React Query) | v5 | Client-side data fetching, caching, optimistic updates | Use for all client-component data — workout logging (optimistic UI), trainer dashboard polling. Pairs with Supabase's JS client. Provides `networkMode: 'offlineFirst'` for gym use. |
| Zustand | ^5 | Lightweight global state | Use for UI state that spans components but doesn't belong in server state: active workout session (current exercise index, timer state, unsaved reps). NOT for server data — that's TanStack Query's job. |
| Zod | ^3.23 | Schema validation | Validate all form inputs and Server Action payloads on both client (React Hook Form integration) and server. Single source of truth for data shapes. |
| React Hook Form | ^7 | Form state management | Pair with Zod for controlled form inputs: exercise logging, plan creation. Minimal re-renders on mobile. Works alongside Next.js Server Actions for progressive enhancement. |
| `web-push` | ^3.6 | Web Push Notifications | Send workout reminders from Next.js Server Actions. Required for VAPID key management. iOS requires PWA installed to home screen for push to work. |
| Recharts | ^2.12 | Progress charts | Trainer progress dashboard charts (weight over time, reps). Lighter than Chart.js for this use case. Responsive out of the box. |

### Smartwatch Integration

HealthKit (Apple Watch) and Garmin require different integration strategies. This is the most complex dimension of the stack.

#### Apple Watch / Apple Health (HealthKit)

**Critical finding (HIGH confidence, verified via official Apple docs + multiple sources):**
HealthKit has NO web API. Apple Health data is stored locally on the iPhone. There is no cloud endpoint, no REST API, no OAuth flow that lets a web app or PWA directly access HealthKit data. This is a deliberate privacy architecture decision by Apple.

**Required approach:** A lightweight companion iOS app must be built to bridge HealthKit → your backend.

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| React Native + Expo (custom dev client) | Expo SDK 52+ | iOS companion app for HealthKit bridge | `react-native-health` package reads HealthKit (heart rate, workout confirmation). Requires custom Expo dev client (not Expo Go) because HealthKit needs native entitlements. Ships as a minimal utility app, not a full experience. |
| `react-native-health` | ^1.x | HealthKit data access in React Native | The standard library for HealthKit in React Native. Reads workout heart rate, calorie data, workout session confirmation. Requires `NSHealthShareUsageDescription` entitlement in iOS app. |
| Supabase JS SDK (in RN app) | ^2 | Sync HealthKit data to backend | After reading HealthKit data, the companion app POSTs to Supabase. Same auth token as the web PWA. |

**App Store note (MEDIUM confidence):** The companion iOS app needs Apple Developer Program ($99/yr) and App Store submission. Consider using TestFlight for v1 to avoid full App Store review. The companion app's sole purpose (sync health data) must be disclosed in App Store review.

#### Garmin Connect API

**Finding (HIGH confidence, verified via Garmin developer portal):**
Garmin provides a formal web API (REST + OAuth 2.0 PKCE) through the Garmin Connect Developer Program. This IS accessible from a web backend — no companion app needed.

**However:** Access requires a formal application to Garmin for "approved business developers." Review takes ~2 business days. This is a **hard dependency for v1** — apply early.

| Technology | Purpose | Notes |
|------------|---------|-------|
| Garmin Connect Developer Program API | Pull activity data (heart rate, workout type, duration) from user's Garmin device after they sync to Garmin Connect | OAuth 2.0 PKCE flow. Access tokens expire after 3 months. Supports webhooks/push notifications for near-real-time activity delivery. Covers 30+ activity types. Data arrives as FIT files + structured JSON. |
| Garmin Connect OAuth callback handler (Next.js Route Handler) | Handle OAuth redirect from Garmin, exchange code for token, store token in Supabase | Implement as `app/api/garmin/callback/route.ts`. Store tokens encrypted in Supabase. |

**Alternative (if Garmin approval is delayed):** Terra API (https://tryterra.co) is a paid unified wearable aggregator that includes Garmin, HealthKit (via mobile SDK), Fitbit, and 20+ others. Adds $0.01-0.05/user/month cost. Eliminates Garmin approval wait and companion iOS app complexity. **Recommended as v1 fallback or v1 primary if timeline is tight.**

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm | Package manager | Faster installs than npm, efficient disk usage, workspace support for monorepo (web PWA + iOS companion app) |
| Vercel | Hosting for Next.js | Native Next.js platform. Free Hobby tier for initial dev (non-commercial only); Pro at $20/user/month for production. Edge Functions for API routes near users. Note: Hobby is strictly non-commercial — upgrade before any real users. |
| ESLint + `eslint-config-next` | Linting | Bundled with Next.js. Catches common App Router mistakes. |
| Prettier | Code formatting | Consistent formatting across web + mobile codebases. |
| Husky + lint-staged | Pre-commit hooks | Prevent broken code from reaching main branch. |

---

## Installation

```bash
# Create Next.js app (App Router + TypeScript + Tailwind v4)
npx create-next-app@latest gym-ai-assistant --typescript --tailwind --app --src-dir

# Core runtime dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install drizzle-orm postgres
npm install @tanstack/react-query
npm install zustand
npm install zod react-hook-form @hookform/resolvers
npm install serwist
npm install web-push
npm install recharts

# Dev dependencies
npm install -D drizzle-kit
npm install -D @types/web-push
npm install -D tsx

# shadcn/ui (interactive CLI — adds components on demand)
npx shadcn@latest init
```

```bash
# iOS companion app (separate repo or pnpm workspace package)
npx create-expo-app@latest gym-ai-health-sync --template blank-typescript
npm install react-native-health @supabase/supabase-js
# Requires: expo prebuild + custom dev client for HealthKit entitlements
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15 (App Router) | React + Vite (SPA) | Only if you need zero server, pure static hosting. Loses Server Actions, ISR, and built-in PWA manifest support. Not appropriate here. |
| Supabase | Firebase (Firestore) | Firebase if you need Firestore's real-time NoSQL at massive scale with unpredictable document shapes. Supabase wins here: relational data model, SQL joins for trainer progress queries, RLS for multi-tenant isolation, predictable pricing. |
| Drizzle ORM | Prisma | Prisma if team is not SQL-fluent and needs visual Prisma Studio + gentler DX. Drizzle preferred here for smaller bundle (serverless perf) and edge runtime compatibility. |
| Serwist | next-pwa (`shadowwalker/next-pwa`) | next-pwa is UNMAINTAINED (last update 2+ years ago). Do not use. The `@ducanh2912/next-pwa` fork exists but Serwist is explicitly recommended by Next.js official docs. |
| TanStack Query v5 | SWR | SWR is simpler but lacks mutation management, offline mode, and cache persistence that gym tracking needs. TanStack Query v5's `networkMode: 'offlineFirst'` is built for this. |
| Terra API (fallback for smartwatch) | Direct Garmin API only | Use Terra if Garmin approval timeline threatens v1 launch. Terra adds per-user cost but eliminates approval delays and also covers Apple Health, enabling v1 without a companion iOS app. |
| React Native + Expo (iOS companion) | Swift (native iOS app) | Swift if the companion app needs to become a full-featured experience. For v1's minimal data bridge purpose, React Native shares JS knowledge with the web team. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `shadowwalker/next-pwa` | Unmaintained — last commit 2+ years ago. Breaks with Next.js 15's App Router and Turbopack. Community has moved on. | Serwist (`serwist/next`) — officially endorsed by Next.js docs |
| `@supabase/auth-helpers-nextjs` | Deprecated in favor of `@supabase/ssr`. Will not receive updates. | `@supabase/ssr` — current official package for Next.js App Router |
| Prisma (unless team insists) | Larger bundle size, binary dependency (Rust query engine), slower serverless cold starts. Prisma 7 removed the Rust engine but Drizzle is still leaner for edge. | Drizzle ORM |
| Redux Toolkit | Severe overkill for this app's state complexity. Heavy bundle. React Query + Zustand covers all needs. | TanStack Query (server state) + Zustand (local UI state) |
| Create React App (CRA) | Officially deprecated by React team. Dead project. | Next.js 15 or Vite |
| HealthKit via web/PWA directly | Technically impossible. Apple has no web HealthKit API. Any claims otherwise are wrong. | React Native Expo companion app with `react-native-health` |
| Garmin API via unofficial/reverse-engineered wrappers (e.g. `python-garminconnect`) | Violates Garmin ToS. Breaks when Garmin changes endpoints. Not viable for a product. | Official Garmin Connect Developer Program (requires business application) |
| Chart.js in React | Requires imperative DOM manipulation via refs in React. Awkward to integrate. | Recharts (React-native chart library with proper component API) |

---

## Stack Patterns by Variant

**If timeline is tight and smartwatch integration is blocking v1:**
- Use Terra API as the single integration point for both Apple Health and Garmin
- Terra provides a mobile SDK (handles HealthKit natively) + web API (Garmin, others)
- Cost: ~$0.01-0.05/connected user/month — negligible at v1 scale
- Eliminates the need for a companion iOS app AND Garmin approval process
- Defer building the companion app and direct Garmin integration to v2

**If building companion iOS app for HealthKit:**
- Use Expo SDK with custom dev client (NOT Expo Go — HealthKit requires native entitlements)
- `npx expo prebuild` generates native iOS project
- HealthKit entitlement must be added to `ios/YourApp/YourApp.entitlements`
- The companion app's only job: request HealthKit permission, read workout sessions on-demand, POST to Supabase

**If Garmin Connect approval is pending:**
- Build the OAuth flow UI/UX in the PWA now
- Mock the Garmin webhook handler with test data
- Swap in the real Garmin API credentials when approval arrives
- Garmin says integration takes 1-4 weeks after approval

**For the trainer dashboard (desktop-friendly):**
- Use `display: browser` (not `standalone`) mode detection to render sidebar navigation on desktop
- Responsive breakpoints: mobile-first (`sm:`, `md:`) for trainee view; `lg:` and above for trainer dashboard
- Server Components for initial data load (trainer's client list, all progress logs) — no client-side waterfall

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 15.x | React 19.x | Next.js 15 ships with React 19. Do not mix React 18 in App Router — breaking changes in Suspense behavior. |
| Serwist ^9.x | Next.js 15.x | Requires webpack config in `next.config.js` (Turbopack not yet supported for service workers — must use `--no-turbopack` flag for SW-related builds or use standard webpack). |
| shadcn/ui (Tailwind v4 branch) | Tailwind CSS v4 | shadcn v4 branch uses CSS-first config, no `tailwind.config.js`. Run `npx shadcn@latest init` to get the correct version. |
| Drizzle ORM ^0.39 | `postgres` ^3 (for direct DB) OR `@supabase/supabase-js` | Use Drizzle for schema definitions + migrations (`drizzle-kit`). Use `@supabase/supabase-js` in app code to preserve RLS auth context. |
| TanStack Query v5 | React 19 | v5 supports React 19 with no issues. Uses `useSyncExternalStore` internally. |
| `react-native-health` ^1.x | Expo SDK 52+ with custom dev client | Does NOT work in Expo Go. Requires `expo prebuild` and a real device or iOS Simulator with HealthKit capability. |

---

## Multi-Tenant Architecture Note

Supabase RLS (Row Level Security) is the mechanism for multi-tenant isolation. The recommended schema:

- `trainers` table: one row per trainer, tied to `auth.uid()`
- `trainees` table: belongs to a trainer via `trainer_id` foreign key
- `workout_plans` table: belongs to a trainer
- `workout_logs` table: belongs to a trainee

RLS policies enforce:
- Trainer can only see their own trainees (WHERE `trainer_id = auth.uid()`)
- Trainee can only see plans assigned to them (via join through trainer's assignments)
- Trainee can only write their own logs (WHERE `trainee_id = auth.uid()`)

Store trainer role in `auth.users.raw_app_meta_data` (server-side only, cannot be modified by user) rather than a user-modifiable profile field.

---

## Sources

- **Next.js Official Docs (PWA Guide)** — https://nextjs.org/docs/app/guides/progressive-web-apps — Verified Serwist recommendation, manifest API, push notifications. Fetched 2026-02-28. Confidence: HIGH
- **Next.js 15 Blog Post** — https://nextjs.org/blog/next-15 — Verified React 19 bundling, Turbopack status. Confidence: HIGH
- **Supabase RLS Docs** — https://supabase.com/docs/guides/database/postgres/row-level-security — Verified `auth.uid()` pattern, `raw_app_meta_data` for role storage. Confidence: HIGH
- **Garmin Connect Developer Program FAQ** — https://developer.garmin.com/gc-developer-program/program-faq/ — Verified business-only approval, 2-day review, 1-4 week integration timeline. Confidence: HIGH
- **Garmin Activity API** — https://developer.garmin.com/gc-developer-program/activity-api/ — Verified FIT file format, 30+ activity types, webhook delivery. Confidence: HIGH
- **Apple Developer HealthKit Docs** — https://developer.apple.com/documentation/healthkit — Verified no web API exists. Confidence: HIGH
- **themomentum.ai — "Do you need a mobile app for Apple Health"** — https://www.themomentum.ai/blog/do-you-need-a-mobile-app-to-access-apple-health-data — Confirmed native iOS app requirement, companion app pattern. Confidence: MEDIUM (not official Apple source, but consistent with official Apple docs)
- **Terra API** — https://tryterra.co — Verified unified wearable API covering both Garmin and HealthKit. Confidence: MEDIUM
- **WebSearch: "Drizzle ORM vs Prisma 2026"** — Multiple sources verified smaller bundle, edge compatibility. Confidence: MEDIUM
- **WebSearch: "next-pwa serwist Next.js 15 2025"** — Multiple sources confirm next-pwa unmaintained, Serwist is successor. Consistent with Next.js official docs. Confidence: HIGH
- **WebSearch: "Supabase vs Firebase 2026 multi-tenant"** — Multiple sources recommend Supabase for relational/SaaS use cases. Confidence: MEDIUM
- **WebSearch: "TanStack Query v5 PWA offline"** — Verified `networkMode: 'offlineFirst'`, `persistQueryClient` for offline gym use. Confidence: MEDIUM
- **react-native-health GitHub** — https://github.com/agencyenterprise/react-native-health — Verified package exists, requires custom dev client, native entitlements. Confidence: HIGH

---

*Stack research for: Gym AI Assistant — workout tracking PWA with trainer/trainee roles, multi-tenant, Apple Watch + Garmin integration*
*Researched: 2026-02-28*
