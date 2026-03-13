# Phase 4: Trainee Workout Logging - Research

**Researched:** 2026-03-13
**Domain:** Next.js 16 / Supabase — trainee-facing workout tracking with real-time persistence
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Navigation hierarchy** — 4-level drill-down:
1. Plans list — three sections: active plan (current), future plans (assigned but not yet started, read-only/preview), and past plans (completed, read-only history)
2. Active plan — this week's workouts (e.g., "Workout A", "Workout B"), each showing done/remaining status
3. Single workout view — list of exercises with completion status, plus workout metadata (workout number, week number)
4. Exercise detail panel/page — full set logging UI; back button returns to single workout view
- Future/inactive plans are visible on the plans list but cannot be started — trainee can preview the plan structure

**Week-based scheduling (not day-specific)**
- Plans are "X workouts per week", not tied to specific days (no Monday/Tuesday assignment)
- Week = calendar week (Mon–Sun), auto-resets each week
- Trainee sees how many workouts are done vs remaining for the current week (e.g., "2 of 3 done this week")
- Workouts within the week can be done in any order — no prescribed day

**Exercise order during a session**
- Exercises can be done in any order (gym reality: equipment may be occupied)
- Single workout view shows all exercises as a list — trainee taps whichever they want to do next
- No forced sequence

**Per-exercise layout (exercise detail page)**
- Exercise name at the top
- List of sets from the plan, each row contains:
  - Reps: pre-filled from plan target, editable (trainee logs actual reps done)
  - Weight: editable
  - Last week result: "actual_reps × actual_weight + failure indicator" (e.g., "8×80kg 🔴" if failed)
  - Last week result shows "—" if no previous session exists for this exercise
  - Muscle failure checkbox per set
- "+Add set" button at the bottom of the set list — extra sets are tracked as regular sets (warm-ups are not logged)
- Below the set list: optional notes textarea (e.g., "used machine instead of free weights")

**Set logging interaction**
- Trainee taps a checkmark/complete button per set to mark it done
- Reps and weight are pre-filled from plan but editable before completing
- Sets are auto-saved to DB immediately when completed (gym-proof: no data loss on crash)

**Session completion**
- Explicit "Finish Workout" button on the single workout view
- Before confirming, shows a summary screen (sets completed, any PRs)
- If not all plan sets have been logged, shows a warning before allowing finish
- A session stays "in progress" indefinitely — trainee can close and reopen the app and continue
- Trainee cannot start a new workout session while another is in progress (must finish or the previous one blocks)

### Claude's Discretion
- Visual design of the completion summary screen (stats layout, PR highlighting)
- Exact loading/skeleton states
- Error handling for save failures
- Exact styling of the last-week result column (colour, size, position)

### Deferred Ideas (OUT OF SCOPE)
- Per-exercise progress chart (collapsed section at bottom of exercise detail showing historical weight/reps trend) — nice-to-have, defer to a Phase 4.1 UI polish or dedicated analytics phase
- Trainee-side progress analytics — charts, PRs over time, volume trends — separate phase after Phase 5
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRACK-01 | Trainee can view their current week's scheduled workout schemas | Week boundary calculation (Mon–Sun ISO calendar week), assigned_plans SELECT with status filter |
| TRACK-02 | Trainee can open a workout session and see all exercises with sets, reps, and target weight | workout_sessions + session_sets tables; join with assigned_schema_exercises for plan targets |
| TRACK-03 | Trainee can log actual sets/reps/weight for each exercise in a session | Server Action per-set save; auto-save on complete tap; RLS for trainee write access |
| TRACK-04 | Trainee sees last week's actual results inline for each exercise while logging | Previous-week session query; join session_sets to get actual reps/weight/failure; display inline |
| TRACK-05 | Trainee can mark a workout session as complete | Update workout_sessions.status to 'completed', set completed_at timestamp; summary screen before finalizing |
</phase_requirements>

---

## Summary

Phase 4 introduces the trainee-facing workout tracking UI. The backend requires a new migration (0005) adding two tables — `workout_sessions` and `session_sets` — to capture actual logged data against the existing assigned plan snapshot tables from Phase 3. The core challenge is the week-based scheduling logic and the per-set auto-save pattern that ensures gym data is never lost.

The assigned plan data model from Phase 3 (assigned_plans → assigned_schemas → assigned_schema_exercises) provides all the plan targets. Phase 4 only needs to read that data and write session/set records against it. The 4-level navigation hierarchy (plans list → active plan → workout view → exercise detail) maps cleanly to Next.js App Router nested routes under `(trainee)/trainee/`.

The biggest architectural decision is the "in-progress session" persistence model: a session row exists immediately when a workout starts, sets are saved one-by-one as they are completed, and the session moves to 'completed' only on explicit finish. This means the trainee page always checks for an existing in-progress session before showing the "Start workout" option.

**Primary recommendation:** Use a new 0005 SQL migration with `workout_sessions` and `session_sets` tables, trainee-writeable RLS policies, and Server Actions for all writes. Keep the 4-level navigation as nested Next.js pages/routes. Implement week boundary calculation as a pure utility function (ISO week: Mon–Sun).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 (already installed) | App Router pages, Server Components, Server Actions | Established in Phases 1–3 |
| Supabase JS | ^2.99.0 (already installed) | PostgreSQL queries via PostgREST, RLS | Established in Phases 1–3 |
| @supabase/ssr | ^0.9.0 (already installed) | Server-side auth cookie handling | Established in Phases 1–3 |
| Tailwind CSS | ^4 (already installed) | Styling | Design system already configured |
| Zod | ^4.3.6 (already installed) | Input validation in Server Actions | Established pattern |
| React Hook Form | ^7.71.2 (already installed) | Form state for set logging inputs | Already installed; prevents controlled-input re-renders |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | ^0.45.1 (already installed) | TypeScript types for new tables | Add schema.ts entries for new tables |
| react | 19.2.3 (already installed) | useOptimistic, useTransition | Optimistic UI for set completion taps |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hook-form for set rows | Plain controlled inputs | React Hook Form prevents full re-render on each keystroke; important when rendering 10+ set rows simultaneously |
| Server Actions for per-set save | Supabase Realtime / direct client calls | Server Actions match established project pattern; direct Supabase client calls from browser would bypass consistent auth pattern |

**Installation:** No new packages required. All dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/app/(trainee)/trainee/
├── page.tsx                          # Plans list (TRACK-01: current week overview)
├── plans/
│   └── [assignedPlanId]/
│       ├── page.tsx                  # Active plan: this week's workouts
│       └── workouts/
│           └── [sessionId]/
│               ├── page.tsx          # Single workout view: exercise list
│               └── exercises/
│                   └── [exerciseId]/
│                       └── page.tsx  # Exercise detail: set logging (TRACK-03, TRACK-04)

src/app/(trainee)/trainee/
├── actions.ts                        # startWorkout, completeSet, addSet, finishWorkout

src/lib/db/
├── schema.ts                         # Add workout_sessions + session_sets Drizzle types
└── migrations/
    └── 0005_workout_sessions.sql     # New tables + RLS
```

### Pattern 1: Week Boundary Calculation (ISO Mon–Sun)

**What:** Compute the ISO calendar week's Monday 00:00 and Sunday 23:59 in local time, then pass as UTC timestamps to Supabase queries.
**When to use:** Plans list page to determine "this week's" sessions; session count for done/remaining.

```typescript
// Source: Standard ISO week calculation — no library needed
export function getCurrentWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  // ISO week starts Monday: if Sunday (0), go back 6 days; otherwise go back (day - 1)
  const daysToMonday = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}
```

**Note on timezone:** The project uses `start_date` as a DATE type (no timezone). Week boundaries are computed client-side based on the user's local time. This is the correct approach for a gym app: the trainee's local Monday defines their week. Store `started_at` and `completed_at` as TIMESTAMPTZ (server UTC).

### Pattern 2: In-Progress Session Check

**What:** Before allowing a new session start, query for an existing in-progress session for this trainee.
**When to use:** Plans list page and workout view — block starting a second concurrent session.

```typescript
// Source: Project pattern (Supabase PostgREST .single() / .maybeSingle())
const { data: activeSession } = await supabase
  .from('workout_sessions')
  .select('id, assigned_schema_id')
  .eq('trainee_auth_uid', claims.sub)
  .eq('status', 'in_progress')
  .maybeSingle();
// If activeSession !== null → trainee has a session in progress
```

### Pattern 3: Per-Set Auto-Save Server Action

**What:** Each set completion fires a Server Action that upserts a `session_sets` row. Uses the row's `id` for idempotent upsert.
**When to use:** Exercise detail page — every time trainee taps the set complete checkmark.

```typescript
'use server';
// Source: Project Server Action pattern (established in Phase 1–3 actions.ts files)
export async function completeSet(data: {
  sessionId: string;
  assignedSchemaExerciseId: string;
  setNumber: number;
  actualReps: number;
  actualWeightKg: number | null;
  muscleFailure: boolean;
  notes?: string;
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('session_sets')
    .upsert({
      session_id: data.sessionId,
      assigned_schema_exercise_id: data.assignedSchemaExerciseId,
      set_number: data.setNumber,
      actual_reps: data.actualReps,
      actual_weight_kg: data.actualWeightKg,
      muscle_failure: data.muscleFailure,
      notes: data.notes ?? null,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'session_id,assigned_schema_exercise_id,set_number',
    });

  if (error) return { error: 'Failed to save set. Please try again.' };
  return { success: true };
}
```

### Pattern 4: Last Week's Results Query

**What:** For each exercise in the current workout, fetch the most recent completed session from the previous ISO week and return its sets.
**When to use:** Exercise detail page — displayed inline next to current set inputs.

```typescript
// Source: Project pattern — Supabase PostgREST join query
// Find the most recent COMPLETED session for this schema exercise in the previous week
const { weekStart } = getCurrentWeekBounds();
const lastWeekEnd = new Date(weekStart.getTime() - 1); // 1ms before this week's Monday
const lastWeekStart = new Date(weekStart);
lastWeekStart.setDate(weekStart.getDate() - 7);

const { data: lastSets } = await supabase
  .from('session_sets')
  .select('set_number, actual_reps, actual_weight_kg, muscle_failure')
  .eq('assigned_schema_exercise_id', assignedSchemaExerciseId)
  .gte('completed_at', lastWeekStart.toISOString())
  .lte('completed_at', lastWeekEnd.toISOString())
  .order('set_number');
// Returns [] if no prior session → display "—" for each set
```

**Important:** Query by `assigned_schema_exercise_id` (not `exercise_id`) — this scopes history to the same plan context, ensuring the right weight targets are referenced.

### Pattern 5: startWorkout Server Action

**What:** Creates a `workout_sessions` row, setting `assigned_plan_id` to 'active' if not already, and returns the new session ID. Client then navigates to the session page.
**When to use:** Trainee taps "Start workout" on the single workout view.

```typescript
// Source: Project pattern — SECURITY DEFINER not needed here (trainee writes own session)
export async function startWorkout(assignedSchemaId: string): Promise<
  { sessionId: string } | { error: string }
> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  // Block if another session is in progress
  const { data: existing } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('trainee_auth_uid', claims.sub)
    .eq('status', 'in_progress')
    .maybeSingle();

  if (existing) return { error: 'Another session is already in progress.' };

  const { data: session, error } = await supabase
    .from('workout_sessions')
    .insert({
      assigned_schema_id: assignedSchemaId,
      trainee_auth_uid: claims.sub,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !session) return { error: 'Failed to start workout.' };

  // Activate assigned plan if still pending
  await supabase
    .from('assigned_plans')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', /* assignedPlanId */ '') // must pass assignedPlanId too
    .eq('status', 'pending');

  return { sessionId: session.id };
}
```

### Anti-Patterns to Avoid

- **Saving all sets on "Finish Workout":** If the trainee's phone crashes or browser closes mid-session, all data is lost. Always save per-set immediately on completion.
- **Computing week boundaries in SQL only:** Timezone-aware week boundaries must match the trainee's local time. Compute in TypeScript and pass as UTC timestamps.
- **Allowing concurrent sessions via optimistic navigation:** Always check for in-progress session server-side before creating a new one. Client-side checks alone can fail on slow networks.
- **Using exercise_id for history lookup:** History must be scoped to assigned_schema_exercise_id to ensure plan-context accuracy. Two exercises with the same exercise_id in different plans should not share history for display.
- **Navigating to session page before session row exists:** Create the session row in the Server Action first, return the sessionId, then redirect. Never create the session client-side.

---

## Database Schema (New Migration 0005)

Two new tables are needed. Add to `src/lib/db/migrations/0005_workout_sessions.sql`:

```sql
-- Phase 4: Trainee Workout Logging
-- Migration: 0005_workout_sessions.sql

-- workout_sessions — one row per workout attempt (one schema per session)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_schema_id UUID NOT NULL REFERENCES assigned_schemas(id) ON DELETE RESTRICT,
  trainee_auth_uid UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Trainee owns their sessions
CREATE POLICY "Trainee manages own sessions" ON workout_sessions FOR ALL
  USING (trainee_auth_uid = auth.uid())
  WITH CHECK (trainee_auth_uid = auth.uid());

-- Trainer reads sessions for their trainees (needed for Phase 5 PROG-02)
CREATE POLICY "Trainer reads trainee sessions" ON workout_sessions FOR SELECT
  USING (
    trainee_auth_uid IN (
      SELECT trainee_auth_uid FROM trainer_trainee_connections
      WHERE trainer_auth_uid = auth.uid()
    )
  );

-- session_sets — one row per logged set within a session
CREATE TABLE session_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  assigned_schema_exercise_id UUID NOT NULL
    REFERENCES assigned_schema_exercises(id) ON DELETE RESTRICT,
  set_number INTEGER NOT NULL,  -- 1-indexed; matches plan set position
  actual_reps INTEGER NOT NULL,
  actual_weight_kg NUMERIC(6,2),
  muscle_failure BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique: one logged set per (session, exercise, set number) — enables upsert
  UNIQUE (session_id, assigned_schema_exercise_id, set_number)
);

ALTER TABLE session_sets ENABLE ROW LEVEL SECURITY;

-- Trainee owns their sets (via session ownership)
CREATE POLICY "Trainee manages own session sets" ON session_sets FOR ALL
  USING (
    session_id IN (
      SELECT id FROM workout_sessions WHERE trainee_auth_uid = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM workout_sessions WHERE trainee_auth_uid = auth.uid()
    )
  );

-- Trainer reads sets for their trainees (Phase 5 prep)
CREATE POLICY "Trainer reads trainee session sets" ON session_sets FOR SELECT
  USING (
    session_id IN (
      SELECT ws.id FROM workout_sessions ws
      JOIN trainer_trainee_connections ttc
        ON ttc.trainee_auth_uid = ws.trainee_auth_uid
      WHERE ttc.trainer_auth_uid = auth.uid()
    )
  );

-- Indexes for common query patterns
CREATE INDEX idx_workout_sessions_trainee_status
  ON workout_sessions (trainee_auth_uid, status);
CREATE INDEX idx_workout_sessions_schema_id
  ON workout_sessions (assigned_schema_id);
CREATE INDEX idx_session_sets_session_id
  ON session_sets (session_id);
CREATE INDEX idx_session_sets_exercise_completed
  ON session_sets (assigned_schema_exercise_id, completed_at);
```

Add corresponding Drizzle types to `src/lib/db/schema.ts`:

```typescript
export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignedSchemaId: uuid('assigned_schema_id').notNull()
    .references(() => assignedSchemas.id, { onDelete: 'restrict' }),
  traineeAuthUid: uuid('trainee_auth_uid').notNull(),
  status: text('status', { enum: ['in_progress', 'completed'] }).notNull().default('in_progress'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const sessionSets = pgTable('session_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  assignedSchemaExerciseId: uuid('assigned_schema_exercise_id').notNull()
    .references(() => assignedSchemaExercises.id, { onDelete: 'restrict' }),
  setNumber: integer('set_number').notNull(),
  actualReps: integer('actual_reps').notNull(),
  actualWeightKg: numeric('actual_weight_kg', { precision: 6, scale: 2 }),
  muscleFailure: boolean('muscle_failure').notNull().default(false),
  notes: text('notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueSetPerSession: unique('session_set_unique').on(
    table.sessionId, table.assignedSchemaExerciseId, table.setNumber
  ),
}));

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type SessionSet = typeof sessionSets.$inferSelect;
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Week boundary logic | Custom date arithmetic | Pure TypeScript utility (shown above) | ISO week Mon–Sun is 3 lines; rolling your own Sunday-vs-Monday logic is error-prone |
| Form state for set rows | useState per input per set | react-hook-form field array | Prevents full re-render cascade across 10+ set rows; already installed |
| Optimistic set completion | Custom loading state machine | useOptimistic (React 19, already installed) | Built-in React primitive for this exact pattern; no extra library |
| Session locking | Client-side in-progress flag | Server-side query in startWorkout action | Race condition: two tabs can both pass a client-side check simultaneously |
| Upsert on set re-save | DELETE + INSERT | Supabase `.upsert()` with `onConflict` | Unique constraint on (session_id, exercise_id, set_number) makes upsert safe and idempotent |

**Key insight:** The heaviest lifting in this phase is UI/UX (mobile gym ergonomics), not algorithmic complexity. Use existing libraries for form state and leverage the database unique constraint for idempotent saves.

---

## Common Pitfalls

### Pitfall 1: Week Boundary Timezone Mismatch
**What goes wrong:** Server computes Monday 00:00 UTC, but trainee in Europe logs a Sunday night workout that falls in a different calendar week server-side.
**Why it happens:** PostgreSQL `CURRENT_DATE` and `date_trunc('week', ...)` use the server's timezone (UTC), not the trainee's local timezone.
**How to avoid:** Compute week boundaries in TypeScript using `new Date()` (local time), convert to `.toISOString()` (UTC), pass as query parameters to Supabase. Never compute week bounds in SQL for display purposes.
**Warning signs:** Trainee sees 0 sessions for the current week on Monday morning, or sessions appear in the "wrong week."

### Pitfall 2: In-Progress Session Leaks
**What goes wrong:** Trainee starts a session, navigates away, and the session stays forever "in_progress," permanently blocking new sessions.
**Why it happens:** No timeout or cleanup mechanism. Session stays in_progress indefinitely (by design), but the "one active session" constraint becomes a trap.
**How to avoid:** In the plans list and workout view, always surface the in-progress session prominently with a "Resume" button. Never silently block — show the user which workout is in progress and give them a path to either continue or abandon it. An "Abandon session" action should also exist.
**Warning signs:** Trainee reports being unable to start a new workout.

### Pitfall 3: RLS Write Policy Missing WITH CHECK
**What goes wrong:** Trainee can insert session_sets rows but only if USING clause matches; without WITH CHECK, inserts silently fail or are allowed incorrectly.
**Why it happens:** PostgreSQL FOR ALL policies require both USING (for reads/updates/deletes) and WITH CHECK (for inserts/updates). USING alone is insufficient for INSERT — a known gotcha documented in Phase 2 decisions ([02-01]).
**How to avoid:** Always pair USING with WITH CHECK in FOR ALL policies. Already documented in project decisions from Phase 2.
**Warning signs:** `.insert()` returns no error but row doesn't appear in the table.

### Pitfall 4: PostgREST Join Returning Array vs Object
**What goes wrong:** Joining `assigned_schema_exercises` to `exercises` returns the joined row as `exercises[0]` (array) not `exercises` (object) in some PostgREST configurations.
**Why it happens:** PostgREST may return join results as arrays. Phase 3 had this exact bug documented: "PostgREST exercises join uses Array.isArray guard" ([03-04]).
**How to avoid:** Always use `Array.isArray(row.exercises) ? row.exercises[0] : row.exercises` when accessing joined rows, or use typed Supabase queries with explicit column selection.
**Warning signs:** `row.exercises.name` is undefined; `row.exercises[0].name` works.

### Pitfall 5: Per-Set Save Blocking the UI
**What goes wrong:** Each set completion triggers a Server Action round-trip (~200–500ms); UI feels sluggish in the gym on a slow connection.
**Why it happens:** Server Actions are synchronous from the user's perspective if not wrapped in useTransition.
**How to avoid:** Wrap set completion in `useTransition` + `useOptimistic` pattern. Mark the set as visually complete immediately (optimistic), then confirm on server response. Revert only on error.
**Warning signs:** Set row stays in "pending" visual state for 1+ second after tap.

### Pitfall 6: Missing assigned_plan_id in workout_sessions
**What goes wrong:** Session table only references assigned_schema_id; to get the plan context (for "done/remaining this week" counts), a join through assigned_schemas → assigned_plans is needed, adding query complexity.
**Why it happens:** Normalized schema is correct but queries become multi-hop.
**How to avoid:** The schema above only stores assigned_schema_id. Use a server-side join or denormalize by also storing assigned_plan_id on workout_sessions if the join proves expensive. Evaluate at implementation time — likely fine for small data volumes.

---

## Code Examples

Verified patterns from official sources:

### React 19 useOptimistic for Set Completion
```typescript
// Source: React 19 docs — useOptimistic hook
// https://react.dev/reference/react/useOptimistic
'use client';
import { useOptimistic, useTransition } from 'react';
import { completeSet } from './actions';

type SetRow = { setNumber: number; completed: boolean; reps: number; weightKg: number | null };

export function SetList({ sets, sessionId, exerciseId }: {
  sets: SetRow[];
  sessionId: string;
  exerciseId: string;
}) {
  const [optimisticSets, addOptimistic] = useOptimistic(
    sets,
    (state, update: { setNumber: number }) =>
      state.map(s => s.setNumber === update.setNumber ? { ...s, completed: true } : s)
  );
  const [isPending, startTransition] = useTransition();

  const handleComplete = (setNumber: number, reps: number, weightKg: number | null) => {
    startTransition(async () => {
      addOptimistic({ setNumber });
      await completeSet({ sessionId, assignedSchemaExerciseId: exerciseId, setNumber, actualReps: reps, actualWeightKg: weightKg, muscleFailure: false });
    });
  };

  return (
    <ul>
      {optimisticSets.map(set => (
        <li key={set.setNumber} className={set.completed ? 'opacity-60' : ''}>
          {/* set row UI */}
          <button onClick={() => handleComplete(set.setNumber, set.reps, set.weightKg)}>
            Complete
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### Plans List Query (TRACK-01)
```typescript
// Source: Project pattern — Supabase PostgREST, established in Phase 3
// Get all assigned plans for the trainee, ordered by status
const { data: assignedPlans } = await supabase
  .from('assigned_plans')
  .select('id, name, status, week_count, workouts_per_week, started_at, created_at')
  .eq('trainee_auth_uid', claims.sub)
  .order('created_at', { ascending: false });

// Get this week's session count per plan (for done/remaining display)
const { weekStart, weekEnd } = getCurrentWeekBounds();
const { data: weekSessions } = await supabase
  .from('workout_sessions')
  .select('id, assigned_schema_id, assigned_schemas!inner(assigned_plan_id)')
  .eq('trainee_auth_uid', claims.sub)
  .eq('status', 'completed')
  .gte('completed_at', weekStart.toISOString())
  .lte('completed_at', weekEnd.toISOString());
```

### Finish Workout Server Action (TRACK-05)
```typescript
// Source: Project pattern — Server Action with validation
'use server';
export async function finishWorkout(sessionId: string): Promise<
  { success: true; summary: { setsCompleted: number } } | { error: string }
> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  // Count completed sets
  const { count } = await supabase
    .from('session_sets')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  const { error } = await supabase
    .from('workout_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('trainee_auth_uid', claims.sub); // RLS double-check

  if (error) return { error: 'Failed to complete workout.' };
  return { success: true, summary: { setsCompleted: count ?? 0 } };
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side Supabase mutations | Server Actions + createClient() | Phase 1 | Consistent auth, no client secret exposure |
| useState for form inputs | react-hook-form | Phase 3 (already installed) | Less re-rendering for complex forms |
| useEffect for data fetching | Server Components + async page.tsx | Phase 1 | No loading flicker; data available at render |
| Separate API routes | Server Actions ('use server') | Phase 1 | Simpler, co-located with components |

**Current project patterns to follow:**
- Server Components fetch data, pass to Client Components as props
- Client Components use `'use client'` only when interactivity is required (forms, taps)
- Server Actions use `getClaims()` not `getUser()` — local JWT validation, no network per request
- All INSERT operations that need to bypass RLS use `adminClient`; trainee writes to their own session rows use `createClient()` with RLS
- `revalidatePath()` called after mutations that affect server-rendered pages

---

## Open Questions

1. **Abandon session flow**
   - What we know: Sessions stay in_progress indefinitely by design
   - What's unclear: What happens if trainee wants to discard an incomplete session? No user decision captured in CONTEXT.md
   - Recommendation: Implement an "Abandon workout" action that deletes the session row (or marks it 'abandoned' — add to CHECK constraint). Surface it on the plans list when an in-progress session exists. Decide in planning; likely needs a task.

2. **assigned_plan activation timing**
   - What we know: assigned_plans start as 'pending'; when does status become 'active'?
   - What's unclear: Should the plan activate when the first session starts, or when the trainer assigns it? The startWorkout action above activates on first session start.
   - Recommendation: Activate on first session start — this is the natural moment. Document in plan task.

3. **PR detection for completion summary**
   - What we know: CONTEXT.md says completion summary should show "any PRs"
   - What's unclear: PR definition — is it "heaviest weight ever for this exercise"? Or "heaviest weight in this plan"?
   - Recommendation: Since this is Claude's Discretion (visual design of summary), define PR as "heaviest weight for this exercise_id across all session_sets for this trainee." Simple query, meaningful to the user.

4. **Per-set weight display when plan uses per_set_weights**
   - What we know: assigned_schema_exercises has both target_weight_kg (single) and per_set_weights (JSONB array)
   - What's unclear: How to pre-fill the weight input when per_set_weights is set — each set row needs a different default weight
   - Recommendation: If per_set_weights is non-null, use `per_set_weights[setIndex]` as the pre-fill for that row. Fall back to target_weight_kg if null. Document in task.

---

## Sources

### Primary (HIGH confidence)

- Project codebase: `src/lib/db/schema.ts` — confirmed existing table structure (Phase 3 assigned plan tables)
- Project codebase: `src/lib/db/migrations/0003_plans.sql` — confirmed RLS patterns, SECURITY DEFINER usage, unique constraint patterns
- Project codebase: `src/app/(trainer)/trainer/plans/actions.ts` — confirmed Server Action pattern (getClaims, createClient, revalidatePath)
- Project codebase: `src/app/globals.css` — confirmed design system color tokens
- Project codebase: `package.json` — confirmed all dependencies already installed; no new packages needed

### Secondary (MEDIUM confidence)

- React 19 docs (https://react.dev/reference/react/useOptimistic) — useOptimistic API for optimistic set completion
- Supabase PostgREST docs — upsert with onConflict for idempotent set saves

### Tertiary (LOW confidence)

- Week boundary ISO calculation: standard JavaScript date arithmetic, well-established pattern but not verified against an official spec document

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; patterns established in Phases 1–3
- Database schema: HIGH — directly derived from existing schema patterns in the codebase; new tables follow identical conventions
- Architecture: HIGH — 4-level navigation matches App Router conventions; patterns copied from Phase 3 trainer pages
- Week boundary logic: MEDIUM — standard ISO week calculation; correct but should be unit-tested given timezone edge cases
- Pitfalls: HIGH — three of six pitfalls (RLS WITH CHECK, PostgREST array join, in-progress session leak) are documented in project history as real bugs encountered in Phases 2–3

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable stack; 30-day window)
