# Architecture Research

**Domain:** Multi-tenant trainer/trainee workout tracking PWA with smartwatch integration
**Researched:** 2026-02-28
**Confidence:** MEDIUM-HIGH (core patterns verified; some data model details synthesized from training data + verified domain patterns)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
├──────────────────────────────┬──────────────────────────────────────┤
│  Trainee PWA (mobile-first)  │  Trainer Dashboard (desktop-friendly)│
│  - Workout logging view      │  - Client roster                     │
│  - Plan viewer               │  - Progress charts                   │
│  - Last week inline results  │  - Plan builder                      │
│  - Offline-capable           │  - Assignment manager                │
└──────────────┬───────────────┴──────────────┬───────────────────────┘
               │ HTTPS / Server Actions        │
┌──────────────▼───────────────────────────────▼───────────────────────┐
│                     NEXT.JS APP LAYER (Vercel)                        │
├──────────────────────────────────────────────────────────────────────┤
│  Middleware (auth + role guard) → Route Groups                        │
│                                                                       │
│  /(trainer)              /(trainee)            /api/                  │
│  - /trainer/dashboard    - /trainee/workout    - /garmin/callback     │
│  - /trainer/clients      - /trainee/history    - /garmin/webhook      │
│  - /trainer/plans        - /trainee/profile    - /healthkit/sync      │
│  Server Components +     Client Components +   Route Handlers         │
│  Server Actions          TanStack Query                               │
├──────────────────────────────────────────────────────────────────────┤
│                     SERVICE WORKER (Serwist)                          │
│  Static: CacheFirst │ Pages: StaleWhileRevalidate │ API: NetworkFirst │
│  IndexedDB: offline workout log queue + plan cache                    │
└──────────────────────────────────────────────────────────────────────┘
               │ Supabase JS SDK (auth context / RLS passthrough)
┌──────────────▼───────────────────────────────────────────────────────┐
│                     SUPABASE (Backend)                                │
├───────────────────┬──────────────────────────────────────────────────┤
│  Auth (JWT + RLS) │  PostgreSQL (data + RLS policies)                 │
│  - trainer role   │  - trainers, trainees, plans, logs                │
│  - trainee role   │  - Row Level Security enforces isolation          │
├───────────────────┼──────────────────────────────────────────────────┤
│  Realtime         │  Storage                                          │
│  - trainer        │  - exercise demo images                           │
│    dashboard      │  - profile photos                                 │
│    live updates   │                                                   │
└───────────────────┴──────────────────────────────────────────────────┘
               │ OAuth / Webhooks
┌──────────────▼───────────────────────────────────────────────────────┐
│               EXTERNAL SMARTWATCH SERVICES                            │
├──────────────────────────────┬───────────────────────────────────────┤
│  Garmin Connect API          │  Apple HealthKit (via iOS companion)   │
│  - OAuth 2.0 PKCE flow       │  - React Native Expo companion app     │
│  - Webhook push on activity  │  - Reads HealthKit on-demand           │
│  - FIT files + JSON          │  - POSTs to Supabase via JS SDK        │
└──────────────────────────────┴───────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Middleware | Auth check + role-based route protection before rendering | `middleware.ts` reads Supabase session JWT, redirects to login or `/unauthorized` |
| `/(trainer)` Route Group | All trainer-facing pages with trainer layout (sidebar nav) | Server Components for data-heavy views; `layout.tsx` wraps all trainer pages |
| `/(trainee)` Route Group | All trainee-facing pages with mobile bottom-nav layout | Client Components with TanStack Query for offline-capable data access |
| `/api/garmin/` Route Handlers | OAuth callback + webhook receiver for Garmin activity push | Route Handlers in `app/api/garmin/`; store tokens + activity data in Supabase |
| `/api/healthkit/` Route Handler | Receive POST from iOS companion app with HealthKit data | Validates auth token, writes heart rate + workout confirmation to `health_events` table |
| Service Worker (Serwist) | Cache static assets, stale-while-revalidate pages, queue offline mutations | `sw.ts` with `runtimeCaching` config; separate IndexedDB for offline workout log queue |
| Supabase RLS | Data isolation between trainers and their client rosters | Postgres policies using `auth.uid()` + role stored in `app_metadata` |
| iOS Companion App | Bridge between HealthKit (no web API) and Supabase | Minimal Expo app: request HealthKit permission, read workout sessions, POST to `/api/healthkit/sync` |

---

## Recommended Project Structure

```
src/
├── app/
│   ├── (trainer)/                  # Trainer route group — desktop-friendly layout
│   │   ├── layout.tsx              # Trainer shell: sidebar, header
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Client roster overview
│   │   ├── clients/
│   │   │   ├── page.tsx            # All clients list
│   │   │   └── [clientId]/
│   │   │       ├── page.tsx        # Individual client progress
│   │   │       └── logs/page.tsx   # Workout log history
│   │   └── plans/
│   │       ├── page.tsx            # Plan library
│   │       ├── new/page.tsx        # Plan builder
│   │       └── [planId]/
│   │           └── edit/page.tsx   # Edit plan + schemas
│   ├── (trainee)/                  # Trainee route group — mobile-first layout
│   │   ├── layout.tsx              # Trainee shell: bottom nav
│   │   ├── workout/
│   │   │   └── page.tsx            # Current week workout view + logging
│   │   ├── history/
│   │   │   └── page.tsx            # Past workout logs
│   │   └── profile/
│   │       └── page.tsx            # Profile + smartwatch connection
│   ├── (auth)/                     # Auth pages — no app layout
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── api/
│   │   ├── garmin/
│   │   │   ├── callback/route.ts   # OAuth exchange → store tokens
│   │   │   └── webhook/route.ts    # Garmin pushes activity events here
│   │   └── healthkit/
│   │       └── sync/route.ts       # iOS companion app POSTs here
│   ├── layout.tsx                  # Root layout: providers, PWA manifest
│   └── manifest.ts                 # Web App Manifest (Next.js 15 API)
├── components/
│   ├── trainer/                    # Trainer-specific UI components
│   │   ├── PlanBuilder.tsx
│   │   ├── ClientProgressChart.tsx
│   │   └── ClientRosterTable.tsx
│   ├── trainee/                    # Trainee-specific UI components
│   │   ├── WorkoutLogger.tsx       # Core: exercise + set entry
│   │   ├── LastWeekInline.tsx      # Previous results shown in logging view
│   │   └── ExerciseCard.tsx
│   └── ui/                         # shadcn/ui components (auto-generated)
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client (for client components)
│   │   ├── server.ts               # Server client (for Server Components/Actions)
│   │   └── middleware.ts           # Supabase session refresh in middleware
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema definitions
│   │   ├── queries/
│   │   │   ├── plans.ts            # Plan-related queries
│   │   │   ├── logs.ts             # Workout log queries
│   │   │   └── trainers.ts         # Trainer/trainee queries
│   │   └── migrations/             # Drizzle Kit output
│   └── validations/
│       ├── plan.ts                 # Zod schemas for plans/exercises
│       └── log.ts                  # Zod schemas for workout logging
├── hooks/
│   ├── useWorkoutLog.ts            # TanStack Query hook for workout logging
│   ├── useOfflineQueue.ts          # IndexedDB queue for offline mutations
│   └── useTrainerClients.ts        # Trainer dashboard data hooks
├── stores/
│   └── workoutSession.ts           # Zustand: active set being logged (in-progress state)
└── sw.ts                           # Serwist service worker entry point
```

### Structure Rationale

- **Route groups `(trainer)` and `(trainee)`:** Different layouts (sidebar vs bottom-nav), different auth requirements. Route groups avoid layout pollution — trainer layout never bleeds into trainee views and vice versa. Middleware guards each group by checking the `role` claim in the JWT.
- **`lib/db/schema.ts` as single source of truth:** Drizzle schema drives both migrations and TypeScript types. All queries import types from here, eliminating drift between DB and application.
- **`components/trainer/` vs `components/trainee/`:** Prevents re-use of trainer-only UI in trainee views by accident. Shared primitives live in `components/ui/` (shadcn).
- **`stores/workoutSession.ts`:** Zustand only for in-progress workout state (which exercise is active, unsaved rep count). Server state (plans, historical logs) stays in TanStack Query.

---

## Data Model

This is the recommended PostgreSQL schema (via Drizzle ORM). Column names are snake_case matching Postgres conventions.

### Core Tables

#### `trainers`
```
trainers
├── id          uuid PK default gen_random_uuid()
├── auth_uid    uuid UNIQUE NOT NULL → auth.users(id)
├── name        text NOT NULL
├── email       text NOT NULL
├── created_at  timestamptz default now()
```
One row per trainer user. `auth_uid` links to Supabase Auth. RLS: only visible to the authenticated trainer themselves.

#### `trainees`
```
trainees
├── id           uuid PK default gen_random_uuid()
├── auth_uid     uuid UNIQUE → auth.users(id)  (null until trainee registers)
├── trainer_id   uuid NOT NULL → trainers(id)
├── name         text NOT NULL
├── email        text NOT NULL
├── invite_code  text UNIQUE (generated, sent to trainee to join)
├── joined_at    timestamptz
├── created_at   timestamptz default now()
```
Trainer creates trainee row before trainee registers. `invite_code` is how trainee claims the slot. RLS: trainer can see their own trainees; trainee can see their own row.

#### `exercise_library`
```
exercise_library
├── id           uuid PK
├── trainer_id   uuid NOT NULL → trainers(id)  (trainer-private library)
├── name         text NOT NULL
├── description  text
├── muscle_group text[]  (e.g., ["chest", "triceps"])
├── demo_url     text  (Storage URL for video/image)
├── created_at   timestamptz
```
Each trainer builds their own exercise library. No global shared library in v1 to avoid moderation complexity. RLS: trainer sees only their own exercises.

#### `workout_plans`
```
workout_plans
├── id            uuid PK
├── trainer_id    uuid NOT NULL → trainers(id)
├── name          text NOT NULL
├── description   text
├── week_count    integer NOT NULL  (total weeks in program)
├── created_at    timestamptz
├── updated_at    timestamptz
```
A plan is a named multi-week program. One trainer can have many plans. RLS: trainer sees only their own plans.

#### `plan_weeks`
```
plan_weeks
├── id          uuid PK
├── plan_id     uuid NOT NULL → workout_plans(id) ON DELETE CASCADE
├── week_number integer NOT NULL  (1, 2, 3, ... N)
├── label       text  (e.g., "Deload", "Week 3 — Heavy")
```
Each week in a plan. A plan has 1..N weeks. The plan builder creates these.

#### `plan_sessions`
```
plan_sessions
├── id          uuid PK
├── week_id     uuid NOT NULL → plan_weeks(id) ON DELETE CASCADE
├── day_label   text NOT NULL  (e.g., "Monday", "Day A", "Upper Body")
├── order_index integer NOT NULL  (display order within the week)
```
A session = one day's workout within a week. A week has 1..7 sessions.

#### `plan_exercises`
```
plan_exercises
├── id              uuid PK
├── session_id      uuid NOT NULL → plan_sessions(id) ON DELETE CASCADE
├── exercise_id     uuid NOT NULL → exercise_library(id)
├── order_index     integer NOT NULL
├── target_sets     integer NOT NULL
├── target_reps     text NOT NULL  (e.g., "8-12" or "5" — text for ranges)
├── target_weight   numeric  (kg, nullable — may be bodyweight or RPE-based)
├── rest_seconds    integer
├── notes           text  (trainer instruction for this exercise in this session)
```
The plan template for a specific exercise on a specific day. `target_reps` is text to accommodate ranges like "8-12" or "AMRAP".

#### `plan_assignments`
```
plan_assignments
├── id            uuid PK
├── plan_id       uuid NOT NULL → workout_plans(id)
├── trainee_id    uuid NOT NULL → trainees(id)
├── start_date    date NOT NULL
├── active        boolean default true
├── created_at    timestamptz
```
Links a plan to a trainee with a start date. `start_date` anchors which plan week maps to which calendar week. A trainee can have one active assignment at a time.

#### `workout_logs`
```
workout_logs
├── id            uuid PK
├── trainee_id    uuid NOT NULL → trainees(id)
├── session_id    uuid → plan_sessions(id)  (null = unstructured workout)
├── logged_date   date NOT NULL
├── completed_at  timestamptz
├── notes         text
├── created_at    timestamptz
```
One row per workout session a trainee completes. Links back to the plan session being logged. RLS: trainee writes their own; trainer reads their trainees'.

#### `set_logs`
```
set_logs
├── id               uuid PK
├── workout_log_id   uuid NOT NULL → workout_logs(id) ON DELETE CASCADE
├── plan_exercise_id uuid → plan_exercises(id)  (null = free-form exercise)
├── exercise_id      uuid NOT NULL → exercise_library(id)
├── set_number       integer NOT NULL
├── actual_reps      integer
├── actual_weight    numeric  (kg)
├── rpe              integer  (Rate of Perceived Exertion, 1-10, optional)
├── skipped          boolean default false
├── logged_at        timestamptz default now()
```
One row per set. The atomic unit of workout data. Trainer progress charts are built by querying this table over time for a given `exercise_id` + `trainee_id`.

#### `health_events`
```
health_events
├── id              uuid PK
├── trainee_id      uuid NOT NULL → trainees(id)
├── source          text NOT NULL  (e.g., "apple_watch", "garmin")
├── event_type      text NOT NULL  (e.g., "workout_session", "heart_rate_avg")
├── workout_log_id  uuid → workout_logs(id)  (linked if matched to a log)
├── occurred_at     timestamptz NOT NULL
├── raw_data        jsonb  (full response from HealthKit/Garmin for future parsing)
├── duration_sec    integer
├── avg_heart_rate  integer
├── max_heart_rate  integer
├── calories        integer
├── created_at      timestamptz
```
Stores imported data from Apple Watch and Garmin. Normalized fields for common metrics; `raw_data` preserves full payload. Trainee and trainer can see this.

#### `garmin_tokens`
```
garmin_tokens
├── id              uuid PK
├── trainee_id      uuid UNIQUE NOT NULL → trainees(id)
├── access_token    text NOT NULL  (encrypt at rest)
├── refresh_token   text NOT NULL  (encrypt at rest)
├── expires_at      timestamptz
├── created_at      timestamptz
└── updated_at      timestamptz
```
Garmin OAuth tokens per trainee. Encrypt `access_token` and `refresh_token` using Supabase Vault or pgcrypto before storing. Only accessible by the trainee (RLS).

### Key Relationships Summary

```
trainers (1) ──────────── (*) trainees
trainers (1) ──────────── (*) workout_plans
trainers (1) ──────────── (*) exercise_library

workout_plans (1) ─────── (*) plan_weeks
plan_weeks (1) ────────── (*) plan_sessions
plan_sessions (1) ─────── (*) plan_exercises
plan_exercises (*) ─────── (1) exercise_library

workout_plans (*) ─────── (*) trainees  [via plan_assignments]

trainees (1) ──────────── (*) workout_logs
workout_logs (1) ──────── (*) set_logs
set_logs (*) ──────────── (1) plan_exercises  [nullable — links log to plan]

trainees (1) ──────────── (*) health_events
trainees (1) ──────────── (1) garmin_tokens
```

### RLS Policy Summary

```sql
-- Trainers see only their own data
CREATE POLICY "trainers_own_data" ON trainers
  FOR ALL USING (auth_uid = auth.uid());

-- Trainer sees their trainees
CREATE POLICY "trainer_sees_trainees" ON trainees
  FOR SELECT USING (trainer_id = (SELECT id FROM trainers WHERE auth_uid = auth.uid()));

-- Trainee sees their own row
CREATE POLICY "trainee_sees_self" ON trainees
  FOR SELECT USING (auth_uid = auth.uid());

-- Trainer sees their own plans
CREATE POLICY "trainer_sees_plans" ON workout_plans
  FOR ALL USING (trainer_id = (SELECT id FROM trainers WHERE auth_uid = auth.uid()));

-- Trainee sees plans assigned to them
CREATE POLICY "trainee_sees_assigned_plan" ON workout_plans
  FOR SELECT USING (
    id IN (
      SELECT plan_id FROM plan_assignments
      WHERE trainee_id = (SELECT id FROM trainees WHERE auth_uid = auth.uid())
      AND active = true
    )
  );

-- Trainee writes their own logs; trainer reads their trainees' logs
CREATE POLICY "trainee_writes_own_logs" ON workout_logs
  FOR INSERT WITH CHECK (
    trainee_id = (SELECT id FROM trainees WHERE auth_uid = auth.uid())
  );

CREATE POLICY "trainer_reads_client_logs" ON workout_logs
  FOR SELECT USING (
    trainee_id IN (
      SELECT id FROM trainees
      WHERE trainer_id = (SELECT id FROM trainers WHERE auth_uid = auth.uid())
    )
  );
```

Store trainer/trainee role in `raw_app_meta_data` (server-only, set at account creation, not user-modifiable). Middleware reads the JWT `app_metadata.role` claim to route to the correct route group.

---

## Architectural Patterns

### Pattern 1: Server Components for Trainer Data, Client Components for Trainee Logging

**What:** Trainer dashboard pages use React Server Components (RSC) for initial data load. Trainee workout logging uses Client Components with TanStack Query.

**When to use:** RSC when the user primarily reads data and does not need optimistic updates or offline capability. Client Components when the interaction requires immediate feedback, optimistic UI, or offline queuing.

**Trade-offs:** RSC eliminates client-side waterfall fetches for trainer dashboard (faster initial load), but cannot use browser APIs or TanStack Query's offline mode. The split is clean: read-heavy trainer views use RSC; write-heavy trainee logging uses client-side TanStack Query with optimistic updates.

**Example:**
```typescript
// app/(trainer)/clients/[clientId]/page.tsx — Server Component
// Data fetched server-side, no client JS for initial render
import { createServerClient } from '@/lib/supabase/server';

export default async function ClientProgressPage({ params }) {
  const supabase = createServerClient();
  const { data: logs } = await supabase
    .from('workout_logs')
    .select('*, set_logs(*)')
    .eq('trainee_id', params.clientId)
    .order('logged_date', { ascending: false });

  return <ClientProgressChart logs={logs} />;
}
```

```typescript
// components/trainee/WorkoutLogger.tsx — Client Component
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function WorkoutLogger({ planExercise }) {
  const queryClient = useQueryClient();

  const logSet = useMutation({
    mutationFn: (setData) => fetch('/api/logs', { method: 'POST', body: JSON.stringify(setData) }),
    // Optimistic update — works even when offline (queued)
    onMutate: async (setData) => {
      await queryClient.cancelQueries({ queryKey: ['workoutLog'] });
      const prev = queryClient.getQueryData(['workoutLog']);
      queryClient.setQueryData(['workoutLog'], (old) => [...old, setData]);
      return { prev };
    },
    onError: (err, _, ctx) => queryClient.setQueryData(['workoutLog'], ctx.prev),
    networkMode: 'offlineFirst', // Queue mutation when offline
  });

  return <SetEntry onSubmit={logSet.mutate} />;
}
```

### Pattern 2: Offline Mutation Queue via TanStack Query + IndexedDB Persister

**What:** TanStack Query's `persistQueryClient` with an IndexedDB persister caches query results and paused mutations. When the trainee loses connectivity mid-workout, set logs are queued. On reconnect, `resumePausedMutations()` replays them.

**When to use:** Any mutation the trainee performs during a workout session. Do not apply to trainer mutations (trainer is typically on desktop with reliable wifi).

**Trade-offs:** Mutations survive page refresh only if mutation defaults are registered via `queryClient.setMutationDefaults()` (functions cannot be serialized, only state). This requires setup discipline: every mutation used offline must have a default registered at app startup.

**Example:**
```typescript
// app/layout.tsx — register mutation defaults at startup
queryClient.setMutationDefaults(['logSet'], {
  mutationFn: async (setData) => {
    const res = await fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(setData),
    });
    return res.json();
  },
});

// On app init, resume any mutations that were queued while offline
queryClient.resumePausedMutations();
```

```typescript
// Serwist sw.ts — cache workout plan data for offline access
import { defaultCache } from '@serwist/next/worker';
import { Serwist, StaleWhileRevalidate, CacheFirst } from 'serwist';

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: [
    {
      matcher: /\/api\/workout-plan/,
      handler: new StaleWhileRevalidate({
        cacheName: 'workout-plans',
        plugins: [new ExpirationPlugin({ maxAgeSeconds: 7 * 24 * 60 * 60 })],
      }),
    },
    ...defaultCache,
  ],
});
```

### Pattern 3: Trainer Plan → Trainee View via Plan Resolution

**What:** When a trainee opens the app, the system resolves which plan is active and which week to show. This requires computing the current week number from `plan_assignments.start_date` and today's date.

**When to use:** Every time the trainee loads the workout view.

**Trade-offs:** Week calculation is simple arithmetic but must be done consistently on both server (initial Server Component render) and client (for offline use, the client must be able to compute the same answer from cached data). Keep this logic in a shared pure function.

**Example:**
```typescript
// lib/plan-resolution.ts
export function getCurrentWeekNumber(startDate: Date, today: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekIndex = Math.floor((today.getTime() - startDate.getTime()) / msPerWeek);
  return weekIndex + 1; // 1-indexed
}

// Trainee workout page (Server Component) uses this to select the right plan_week
// The same function runs in the client for offline rendering from cached plan data
```

### Pattern 4: Role-Based Route Separation via Middleware + Route Groups

**What:** Next.js middleware reads the Supabase JWT, extracts `app_metadata.role`, and redirects unauthorized users before any page renders. Route groups `(trainer)` and `(trainee)` provide separate layouts.

**When to use:** Always. Role enforcement belongs at the edge (middleware), not inside page components.

**Trade-offs:** Middleware adds ~1ms overhead per request at Vercel edge, which is negligible. The alternative — per-page auth checks — is error-prone and easy to forget.

**Example:**
```typescript
// middleware.ts
import { createServerClient } from '@/lib/supabase/middleware';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const role = session.user.app_metadata?.role;
  const path = request.nextUrl.pathname;

  // Trainee hitting a trainer route → redirect to their dashboard
  if (role === 'trainee' && path.startsWith('/trainer')) {
    return NextResponse.redirect(new URL('/trainee/workout', request.url));
  }

  // Trainer hitting a trainee route → redirect to their dashboard
  if (role === 'trainer' && path.startsWith('/trainee')) {
    return NextResponse.redirect(new URL('/trainer/dashboard', request.url));
  }

  return response; // Contains refreshed session cookies
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Data Flow

### Request Flow 1: Trainee Logs a Set (Online)

```
Trainee taps "Log Set" button
    ↓
WorkoutLogger Client Component
    ↓ (optimistic update applied immediately to local cache)
TanStack Query useMutation (networkMode: 'offlineFirst')
    ↓ HTTPS POST to Next.js Route Handler or Server Action
Supabase JS client (with session cookies for RLS)
    ↓
PostgreSQL set_logs table (INSERT — RLS verifies trainee owns this log)
    ↓ Supabase Realtime (WebSocket)
Trainer Dashboard (live update if trainer is viewing client's session)
```

### Request Flow 2: Trainee Logs a Set (Offline)

```
Trainee taps "Log Set" button (no network)
    ↓
TanStack Query useMutation (networkMode: 'offlineFirst')
    ↓ mutation paused, stored in IndexedDB persister
    [Zustand: UI optimistically shows set as logged]
    [Service Worker: page loads from StaleWhileRevalidate cache]
    ↓
... user completes workout offline ...
    ↓
Device regains connectivity
    ↓
queryClient.resumePausedMutations() (triggered on 'online' event)
    ↓
Queued mutations replay in order → Supabase → PostgreSQL
```

### Request Flow 3: Garmin Activity Arrives

```
Trainee completes run wearing Garmin device
    ↓
Garmin device syncs to Garmin Connect (phone/cloud)
    ↓ Garmin Connect pushes webhook to configured endpoint
POST /api/garmin/webhook (Next.js Route Handler)
    ↓ validate webhook signature
    ↓ parse FIT/JSON activity payload
    ↓ match to trainee via Garmin user ID → trainees table
INSERT into health_events (avg_heart_rate, calories, duration, raw_data)
    ↓ (optional) attempt to match to workout_logs by date/time
    ↓ Supabase Realtime pushes update
Trainer Dashboard: health event appears on client's profile
```

### Request Flow 4: Apple Watch Data Import

```
Trainee opens iOS companion app post-workout
    ↓
Companion app reads HealthKit workout session (HKWorkout)
    ↓ extract: avgHeartRate, maxHeartRate, duration, startDate, calories
    ↓ Supabase JS SDK (same auth token as PWA — user already logged in)
POST to /api/healthkit/sync (Route Handler)
    ↓ validate auth session
INSERT into health_events (source: "apple_watch", ...)
    ↓
Trainee and Trainer can view health data in the app
```

### State Management

```
Server State (TanStack Query)
├── workout plan + current week session (cached for offline)
├── set_logs for current workout log
├── historical logs for history view
└── trainer: client roster + progress charts

Local UI State (Zustand)
├── activeExerciseIndex (which exercise in today's session is expanded)
├── currentSetNumber (which set is being entered)
└── timerState (rest timer between sets)

Offline Queue (IndexedDB via TanStack Query persister)
└── paused mutations: logSet, completeWorkout
```

---

## Offline-First Considerations

### What to Cache

| Data | Strategy | TTL | Reason |
|------|----------|-----|--------|
| Active workout plan + current week | `StaleWhileRevalidate` via Service Worker | 7 days | Core data trainee needs at gym |
| Exercise library (name, demo images) | `CacheFirst` | 30 days | Rarely changes; images are large |
| Last week's set logs (inline display) | TanStack Query `persistQueryClient` (IndexedDB) | 7 days | Needed for "last week" inline view |
| Static assets (JS, CSS, fonts) | `CacheFirst` via Serwist precache | Versioned | Standard PWA practice |
| Trainer dashboard pages | `NetworkOnly` (no offline) | — | Trainer uses desktop with wifi |
| Auth endpoints | `NetworkOnly` | — | Never cache credentials |

### Offline Write Strategy

1. All workout set mutations use `networkMode: 'offlineFirst'` in TanStack Query
2. Paused mutations stored in IndexedDB via `persistQueryClient`
3. At app startup, call `queryClient.resumePausedMutations()` after session check
4. Register `setMutationDefaults` at startup so mutations can be replayed after page refresh
5. Serwist's `reloadOnOnline: false` to avoid destroying in-progress forms on reconnect
6. Show clear offline indicator (banner) so trainee knows they are operating offline

### Conflict Resolution

Conflict risk is low for this domain: set logs are immutable once submitted (no two devices edit the same set). The main risk is duplicate submission if the same mutation is queued twice. Prevent by generating a client-side UUID for each `set_log` before insertion, using `ON CONFLICT (id) DO NOTHING` in Postgres.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Garmin Connect API | OAuth 2.0 PKCE in Next.js Route Handlers; webhook push from Garmin → `/api/garmin/webhook` | Requires Garmin Developer Program approval (apply early). Tokens expire every 3 months — implement refresh. Validate webhook with Garmin's HMAC signature. |
| Apple HealthKit | iOS companion app (Expo + `react-native-health`) reads HealthKit on-demand, POSTs to `/api/healthkit/sync` | No web API. Companion app shares same Supabase auth session. Minimal app — just a sync trigger. |
| Terra API (fallback) | Unified webhook/SDK covering both Garmin and Apple Health | Use if Garmin approval or iOS companion build delays v1. Replaces both integration paths. ~$0.01-$0.05/user/month. |
| Supabase Auth | Session cookies via `@supabase/ssr`; JWT claims read in middleware | Store role in `app_metadata` (server-only field). Use `raw_app_meta_data` for trainer/trainee flag. |
| Supabase Realtime | WebSocket subscription on `workout_logs` and `health_events` tables | Trainer dashboard subscribes to their trainees' changes. Trainee does not need Realtime (they write, not watch). |
| Vercel (hosting) | Deploy Next.js app; Edge Functions for middleware | Service Worker requires webpack (not Turbopack) for Serwist builds. Use standard Next.js build for production. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Server Components ↔ Supabase | Direct Supabase server client call (no API layer) | RLS enforces security at DB level, so direct calls are safe and efficient. |
| Client Components ↔ Supabase | Via TanStack Query hooks calling Supabase JS client | Never call Supabase directly in render — always through a hook. |
| Client Components ↔ Server Actions | Next.js Server Actions (form POST) | Use for plan creation, trainee assignment — non-real-time write operations. |
| Service Worker ↔ App | Cache Storage API + `postMessage` for sync status | Serwist manages cache; app reads from cache transparently via normal fetch. |
| iOS Companion ↔ Backend | HTTPS POST to `/api/healthkit/sync` with Supabase JWT in Authorization header | Supabase JWT is shared — trainee logs in once, same session works in PWA and companion app. |
| Garmin Webhook ↔ Backend | POST from Garmin servers to Next.js Route Handler | Must be publicly accessible URL. Validate HMAC signature on every request. |

---

## Suggested Build Order

Build order is driven by dependency: you cannot build the trainee logging view without a plan to log, and you cannot show progress without logs.

```
Phase 1: Foundation
├── Supabase project setup (Auth, DB, RLS)
├── Next.js app scaffold (route groups, middleware, layouts)
├── Core schema: trainers, trainees, exercise_library
└── Auth flows: trainer signup, trainee invite + join

Phase 2: Plan Builder (trainer-facing)
├── exercise_library CRUD (trainer adds exercises)
├── workout_plans + plan_weeks + plan_sessions + plan_exercises schema
├── Plan builder UI (trainer creates multi-week plan)
└── Plan assignment (trainer assigns plan to trainee with start date)

Phase 3: Trainee Workout Logging (core trainee experience)
├── Trainee workout view (resolves current week from assignment + start_date)
├── Workout logger with inline last-week results (queries set_logs for prior week)
├── Set log submission (workout_logs + set_logs tables)
└── Workout history view

Phase 4: PWA + Offline
├── Serwist service worker (precache static assets, StaleWhileRevalidate for plan data)
├── TanStack Query persistQueryClient with IndexedDB
├── Offline mutation queue (logSet mutations survive offline)
├── PWA manifest, installability, push notification scaffolding
└── Offline indicator UI

Phase 5: Trainer Dashboard
├── Client progress view (set_logs over time per exercise per trainee)
├── Recharts progress charts (weight + reps over time)
├── Supabase Realtime subscription (trainer sees client logs in near-real-time)
└── Plan management (edit existing plans, create new versions)

Phase 6: Smartwatch Integration
├── Garmin: OAuth flow UI + token storage + webhook handler
├── Garmin: activity data → health_events table
├── Apple Watch: Expo companion app + HealthKit permission + sync endpoint
├── Link health_events to workout_logs by date/time
└── Health data visible in trainee profile and trainer client view
```

**Why this order:**
- Phases 1-3 deliver the core value loop (trainer creates plan → trainee logs workout) before any infrastructure complexity
- Phase 4 (offline) follows Phase 3 so there is real data to cache and real mutations to queue
- Phase 5 (trainer dashboard) comes after logging exists — otherwise there is nothing to display
- Phase 6 (smartwatch) is last because it is technically complex (external APIs, OAuth, companion app) and is an enhancement on top of the working core

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 trainers, 0-1K trainees | Supabase free/pro tier. Single Next.js app on Vercel Hobby → Pro. No changes needed. |
| 100-1K trainers, 1K-10K trainees | Add Supabase connection pooling (PgBouncer — already included in Supabase). Consider adding read replicas for trainer dashboard analytics queries. Index `set_logs(trainee_id, exercise_id, logged_at)` early. |
| 1K+ trainers, 10K+ trainees | `set_logs` becomes the largest table. Partition by `trainee_id` or by time range. Move analytics queries (progress charts) to a separate read replica or materialized views. Consider Supabase Enterprise. |

### Scaling Priorities

1. **First bottleneck:** `set_logs` query performance for trainer progress charts. Each chart query scans potentially thousands of rows per exercise per trainee. Fix: composite index on `(trainee_id, exercise_id, logged_at)` — add this from day one.
2. **Second bottleneck:** Garmin webhook ingestion. If many trainees sync simultaneously (post-class), webhook handler can spike. Fix: queue incoming webhooks via Supabase Edge Function + pg_queue rather than direct DB writes in the handler.

---

## Anti-Patterns

### Anti-Pattern 1: Using Global Exercise Library Before Multi-Tenant Is Proven

**What people do:** Build a shared global exercise database (all trainers share one library). Seems efficient.

**Why it's wrong:** Trainers use proprietary exercise names, custom video demos, and idiosyncratic naming conventions. A global library requires moderation, conflict resolution (two trainers both named an exercise "Bulgarian Split Squat" with different cues), and makes RLS dramatically more complex (who can edit what?).

**Do this instead:** Each trainer has a private `exercise_library` scoped by `trainer_id`. If a global library is needed later, add an `is_global` flag and handle visibility carefully. Start simple.

### Anti-Pattern 2: Storing Role in a User-Editable Profile Field

**What people do:** Add a `role` column to a `profiles` table that the user can update via the app.

**Why it's wrong:** Any client-side code can call `UPDATE profiles SET role = 'trainer'`. The RLS policies break down. A trainee can promote themselves to trainer.

**Do this instead:** Store role exclusively in `auth.users.raw_app_meta_data` (set via Supabase Admin API server-side only, at account creation). Read in middleware via JWT claim. Users cannot modify `app_metadata` through the Supabase client SDK.

### Anti-Pattern 3: Fetching Last Week's Results At Render Time Per Exercise

**What people do:** For each exercise card in the trainee workout view, fire a separate query to get last week's set logs. With 8-10 exercises in a session, this is 8-10 sequential round trips.

**Why it's wrong:** In a gym with poor wifi, 10 sequential API calls = timeout cascade. The trainee sees spinners everywhere and the page degrades badly offline.

**Do this instead:** Fetch all `set_logs` for the trainee's previous workout session in a single query at page load time. Store in TanStack Query cache. Each exercise card reads from the cache synchronously. One query, instant render from cache when offline.

### Anti-Pattern 4: Skipping Offline Mutation Defaults

**What people do:** Set up TanStack Query with `networkMode: 'offlineFirst'` and trust that mutations will resume. But do not call `queryClient.setMutationDefaults()` and do not call `resumePausedMutations()` on startup.

**Why it's wrong:** Paused mutations persist their state (parameters) but not their `mutationFn` (functions can't be serialized). After a page refresh, the app has queued mutations with no function to execute them. They silently fail or are never retried.

**Do this instead:** At app startup (before rendering), call `setMutationDefaults` for every mutation key used in offline contexts. Then call `resumePausedMutations()` after the session is confirmed. Document this pattern prominently — it must not be forgotten when adding new offline-capable mutations.

### Anti-Pattern 5: Building Trainer Dashboard Before Core Logging Works

**What people do:** Start with the trainer dashboard (it looks impressive in demos). Skip building the trainee logging flow.

**Why it's wrong:** The trainer dashboard is entirely dependent on workout logs existing. A dashboard with no real data is untestable and gives false confidence. Building it first leads to hard-to-detect schema bugs that only surface when real logging data arrives.

**Do this instead:** Build the trainee logging experience first (Phases 1-3 above). Only start on the trainer dashboard (Phase 5) once real logs exist from test accounts doing real workouts.

---

## Sources

- **Next.js Multi-Tenant Guide** — https://nextjs.org/docs/app/guides/multi-tenant — Verified recommended architecture for multi-tenant Next.js apps. Fetched 2026-02-27. Confidence: HIGH
- **Next.js Route Groups Documentation** — https://nextjs.org/docs/app/api-reference/file-conventions/route-groups — Route group pattern for layout separation. Confidence: HIGH
- **Supabase Row Level Security Docs** — https://supabase.com/docs/guides/database/postgres/row-level-security — `auth.uid()`, `auth.jwt()`, policy patterns. Confidence: HIGH
- **Supabase RLS Multi-Tenant Deep Dive (LockIn)** — https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2 — Hierarchical org/member RLS patterns, role helper functions, cascade permission patterns. Fetched 2026-02-28. Confidence: MEDIUM
- **TanStack Query Network Mode Docs** — https://tanstack.com/query/v4/docs/react/guides/network-mode — `networkMode: 'offlineFirst'`, `resumePausedMutations`, `setMutationDefaults`. Confidence: HIGH
- **TanStack Query persistQueryClient Docs** — https://tanstack.com/query/v4/docs/react/plugins/persistQueryClient — IndexedDB persister, `maxAge`, mutation persistence caveats. Confidence: HIGH
- **Serwist + Next.js Offline Apps** — https://dev.to/sukechris/building-offline-apps-with-nextjs-and-serwist-2cbj — `runtimeCaching` config, `reloadOnOnline: false` recommendation. Fetched 2026-02-28. Confidence: MEDIUM
- **MDN: Offline and Background Operation** — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation — Background Sync API, IndexedDB for offline storage patterns. Confidence: HIGH
- **Garmin Health API + Webhooks** — https://developer.garmin.com/gc-developer-program/health-api/ — Push vs pull architecture, webhook delivery. Confidence: HIGH
- **Multi-Tenant SaaS Architecture Guide** — https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/ — Supabase RLS multi-tenant patterns. Confidence: MEDIUM
- **Back4App Fitness Schema Tutorial** — https://www.back4app.com/tutorials/how-to-build-a-database-schema-for-a-fitness-tracking-application — Fitness domain entity patterns (User, Workout, Exercise, Sets). Confidence: MEDIUM (not Postgres-specific, but domain patterns are valid)
- **WebSearch: "Next.js role-based routing middleware App Router 2025"** — Multiple sources confirm middleware-first role checking pattern, route group layout separation. Confidence: MEDIUM

---

*Architecture research for: Gym AI Assistant — multi-tenant trainer/trainee PWA with smartwatch integration*
*Researched: 2026-02-28*
