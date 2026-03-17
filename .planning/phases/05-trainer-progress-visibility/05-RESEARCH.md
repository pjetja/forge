# Phase 5: Trainer Progress Visibility — Research

**Researched:** 2026-03-17
**Domain:** Next.js 16 App Router — read-only progress views, tab-switcher patterns, cross-plan exercise aggregation queries
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### What's already built (do not rebuild)
A significant amount of Phase 5 work was completed during prior phases:
- Trainer home page (`/trainer`) — shows all trainees with active/pending plan name and status (PROG-01 ✓)
- Trainee detail page (`/trainer/trainees/[traineeId]`) — shows current, pending, and past plans
- Plan detail page — sessions grouped by week; current week vs. past weeks; in-progress banner
- Session drill-down — exercise list with sets-logged/sets-required per exercise
- Exercise log in session — shows every set (reps, weight, failure flag)
- Exercise progress page (per-plan) — weight and reps charts across sessions

Plans must acknowledge these are done and test/verify them rather than rebuild.

#### Trainee profile: two-tab layout
- Trainee detail page gains a tab switcher: **Plans** (existing content, unchanged) | **Exercises** (new)
- Default tab: Plans (preserves existing behaviour)
- URL can use a `?tab=exercises` query param for direct linking

#### Exercise tab — exercise list
- Sorted by **most recently logged** (exercises the trainee is currently training appear first)
- Search bar + muscle group filter chips — same UX as the trainer's exercise library
- Each row shows: exercise name, muscle group tag, personal best (heaviest top-set weight ever logged), last logged date
- Tapping a row navigates to the exercise progress page (cross-plan view)
- Empty state: "No exercises logged yet" when trainee hasn't completed any sessions

#### Exercise progress page (cross-plan, trainer view)
- **Data scope**: All completed sessions for this trainee that include this exercise, across ALL assigned plans
- **Primary metric**: Top-set weight per session (the heaviest single set logged in that session)
- **Date range toggle**: All time | Last 3 months | Last 1 month (simple 3-option toggle at top of chart)
- **Entry points**: (1) From the new Exercise tab on the trainee profile; (2) From the plan detail page's Exercises column (existing links already in place)
- The existing per-plan chart page at `/trainer/trainees/[traineeId]/plans/[assignedPlanId]/exercises/[exerciseId]` can be replaced or enhanced — planner to decide based on minimal-change approach

#### Full workout log history scope
- Per-plan navigation is **sufficient** — trainer taps a past plan card on the trainee profile and drills in
- No flat cross-plan "all sessions" chronological list is needed
- Past plan cards on the trainee profile stay as-is (no session count additions)

#### Trainer home page (no changes)
- Trainee cards keep their current design: name + active/upcoming plan label
- No compliance stats, no last-session date on the home page cards

#### Trainee home page: two-tab layout
- Trainee home page (`/trainee`) gains a tab switcher: **Plans** (existing content, unchanged) | **Exercises** (new)
- Default tab: Plans (preserves existing behaviour)
- URL can use a `?tab=exercises` query param for direct linking

#### Trainee Exercise tab — exercise list
- Identical design to the trainer-side exercise tab
- Sorted by most recently logged; search bar + muscle group filter chips
- Each row: exercise name + muscle group + personal best (heaviest top set ever) + last logged date
- Tapping a row navigates to the trainee's cross-plan exercise progress page
- Empty state: "No exercises logged yet" when no sessions completed

#### Trainee exercise progress page (cross-plan)
- **Data scope**: All completed sessions for the logged-in trainee that include this exercise, across ALL their assigned plans
- **Identical design to trainer view**: top-set weight as primary metric; date range toggle; start/finish/change summary cards
- **Route**: `/trainee/exercises/[exerciseId]` — `exerciseId` is base `exercise_id` UUID from the `exercises` table (not `assigned_schema_exercise_id`)
- The existing per-plan progress page at `/trainee/plans/[assignedPlanId]/exercises/[exerciseId]` is per-plan scoped and uses `assigned_schema_exercise_id` — it stays as-is or gets redirected to the new page

#### Shared logic between trainer and trainee exercise views
- The exercise list aggregation query is the same pattern for both sides — scoped to different `trainee_auth_uid` values
- The `ProgressChart` component is already shared — reuse it
- Exercise names require the admin client (exercises table is trainer-owned via RLS) — already handled in existing trainee progress page

### Claude's Discretion
- Exact tab switcher visual style (underline tabs vs. pill tabs)
- Loading/skeleton states for exercise list and chart
- How personal best is displayed when the trainee has no logged sets (show "—")
- Chart empty state design when no data exists for the selected date range

### Deferred Ideas (OUT OF SCOPE)
- Trainee compliance stats on trainer home cards (last session date, sessions-this-week)
- Cross-plan reps trend chart
- Volume tracking (total sets × reps × weight per session) — v2 analytics
- Personal record alerts — notify trainer when a trainee sets a PR — v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROG-01 | Trainer can view all trainees with their currently assigned plans | Already built in `/trainer` page — verify it satisfies the requirement as-is |
| PROG-02 | Trainer can view a trainee's full workout log history (sets, reps, weight per session) | Per-plan drill-down already built; the new Exercise tab + cross-plan progress page completes the picture |
</phase_requirements>

---

## Summary

Phase 5 is primarily a **verification and new-page phase**, not a rebuild phase. PROG-01 is fully satisfied by the existing trainer home page, which already shows each trainee's assigned plan name and status. PROG-02 is mostly satisfied by the per-plan drill-down chain; the primary new deliverable is the **Exercise tab** on the trainee profile page (trainer side) and on the trainee home page (trainee side), plus a **cross-plan exercise progress page** for each side.

The new work decomposes into five concrete pieces: (1) tab switcher on the trainer's trainee profile page; (2) exercise list query + UI for the trainer's Exercise tab; (3) a new cross-plan exercise progress route for the trainer side; (4) tab switcher on the trainee home page; (5) exercise list query + new `/trainee/exercises/[exerciseId]` cross-plan progress route.

All chart infrastructure (`ProgressChart`, recharts) and the admin client pattern for resolving exercise names are already in place. The main new SQL pattern is the **exercise aggregation query** — joining `session_sets → assigned_schema_exercises → exercises` across all of a trainee's completed sessions to produce: distinct exercises + personal best weight + last logged date. This runs once per page load and is a straightforward Supabase chained query.

**Primary recommendation:** Build in this order — (A) trainer-side Exercise tab + cross-plan page, (B) trainee-side Exercise tab + new `/trainee/exercises/[exerciseId]` page, (C) verify PROG-01/PROG-02 via existing pages. Keep the existing per-plan progress page (`/trainee/plans/[assignedPlanId]/exercises/[exerciseId]`) intact — it uses `assigned_schema_exercise_id` as its key, while the new cross-plan page uses base `exercise_id`. No redirect needed.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router pages, Server Components, `searchParams` | Already in use throughout project |
| Supabase JS | ^2.99.0 | DB queries, RLS-respecting reads | Already in use |
| Tailwind CSS | ^4 | Styling | Already in use, same dark design system |
| recharts | ^3.8.0 | `ProgressChart` bar chart | Already in use; `ProgressChart` component shared |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Admin client (`createAdminClient`) | — | Reading `exercises` table (trainer-owned RLS) | Any page that needs exercise name/muscle group for a trainee's data |
| `useSearchParams` / `useRouter` | Next.js built-in | Tab state via `?tab=exercises`, search/filter URL params | Exercise filter bar on both Exercise tabs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL query param for tab state (`?tab=exercises`) | React `useState` | URL param is preferable — supports deep linking and browser back/forward; consistent with how exercise filters already work in `ExerciseFilterBar` |
| Client-side date filter (fetch all, filter in JS) | Server-side date filter via Supabase `.gte()` | Client-side is acceptable here because cross-plan set counts per trainee are small; server-side would require re-fetching on toggle — client-side filtering of already-fetched data is simpler and performs fine |

**No new installations required.** All dependencies are already present.

---

## Architecture Patterns

### Recommended Project Structure

New files for this phase:

```
src/app/(trainer)/trainer/trainees/[traineeId]/
├── page.tsx                                   MODIFY — add tab switcher (Plans | Exercises)
└── exercises/
    └── [exerciseId]/
        └── page.tsx                           NEW — cross-plan exercise progress (trainer view)

src/app/(trainee)/trainee/
├── page.tsx                                   MODIFY — add tab switcher (Plans | Exercises)
└── exercises/
    └── [exerciseId]/
        └── page.tsx                           NEW — cross-plan exercise progress (trainee view)
```

The existing per-plan exercise progress pages remain untouched.

### Pattern 1: Tab Switcher via `?tab=` Query Param

**What:** The host page reads `searchParams.tab` server-side. If `tab === 'exercises'`, render the Exercise tab content; otherwise render the Plans tab (existing JSX). A client component tab bar emits `?tab=plans` / `?tab=exercises` via `router.push`.

**When to use:** Any two-tab layout where deep linking is needed.

**Example (server component host):**
```typescript
// src/app/(trainer)/trainer/trainees/[traineeId]/page.tsx
export default async function TraineeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ traineeId: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { traineeId } = await params;
  const resolvedSearch = await searchParams;
  const activeTab = resolvedSearch?.tab === 'exercises' ? 'exercises' : 'plans';

  // Fetch data for Plans tab (always needed for header)
  // Fetch data for Exercise tab only when activeTab === 'exercises'
  ...
  return (
    <div className="space-y-6">
      {/* header */}
      <TabSwitcher activeTab={activeTab} traineeId={traineeId} />
      {activeTab === 'plans' ? <PlansTabContent ... /> : <ExercisesTabContent ... />}
    </div>
  );
}
```

**Tab bar client component:**
```typescript
'use client';
// TabSwitcher — emits ?tab= param; reads from props (not useSearchParams)
// Uses router.replace to preserve other params
```

### Pattern 2: Exercise Aggregation Query

**What:** A single multi-step Supabase query that produces, for a given trainee, the list of all exercises they have ever logged sets for, along with their personal best weight and the date of their most recent set.

**When to use:** Both the trainer-side Exercise tab and the trainee-side Exercise tab use this pattern, differing only in which `trainee_auth_uid` value is used and how the RLS identity is established.

**Step-by-step query:**

```typescript
// Step 1: Get all completed session IDs for this trainee
const { data: sessions } = await supabase
  .from('workout_sessions')
  .select('id')
  .eq('trainee_auth_uid', traineeAuthUid)
  .eq('status', 'completed');

const sessionIds = (sessions ?? []).map(s => s.id);

// Step 2: Get all session_sets for those sessions, joining to exercise_id
// session_sets → assigned_schema_exercises (for exercise_id) → exercises (for name/muscle_group via admin)
const { data: setsData } = sessionIds.length > 0
  ? await supabase
      .from('session_sets')
      .select('actual_weight_kg, completed_at, assigned_schema_exercises!inner(exercise_id)')
      .in('session_id', sessionIds)
  : { data: [] };

// Step 3: Aggregate in application memory
// Group by exercise_id; compute max(actual_weight_kg) and max(completed_at)
// Then fetch exercise names + muscle_groups via admin client in one .in() call
```

**Why app-level aggregation (not SQL):** Supabase PostgREST does not expose `MAX()` GROUP BY aggregations via the standard `.select()` API. The dataset (sets per trainee) is small enough that in-memory aggregation is fast and correct.

**Personal best definition:** `max(actual_weight_kg)` across all sets ever, across all plans. A `null` weight (bodyweight set) is excluded from the max — show "—" if all sets have null weight.

### Pattern 3: Cross-Plan Progress Chart (Top-Set Weight)

**What:** For the new cross-plan exercise progress page, the chart X-axis is sessions (by date) and the Y-axis is the top-set weight for that session (max weight logged in any single set during that session for this exercise). This differs from the existing per-plan chart, which plots each individual set number as a separate bar series.

**Why top-set weight for the cross-plan view:** Across plans, the exercise may have appeared with different `assigned_schema_exercise_id` values (different `sets` counts, different targets). Comparing individual set numbers across plans would produce noisy data. Top-set weight is stable and meaningful as a progress metric across plan boundaries.

**Data query for cross-plan chart:**
```typescript
// All assigned_schema_exercise_id values for this base exercise_id, across this trainee's plans
const { data: aseRows } = await supabase
  .from('assigned_schema_exercises')
  .select('id, assigned_schema_id')
  .eq('exercise_id', exerciseId);  // base exercise_id

const aseIds = (aseRows ?? []).map(r => r.id);

// All sets for those ASE ids, in completed sessions for this trainee
const { data: setsData } = aseIds.length > 0
  ? await supabase
      .from('session_sets')
      .select('session_id, actual_weight_kg, assigned_schema_exercise_id')
      .in('assigned_schema_exercise_id', aseIds)
      .in('session_id', completedSessionIds)
  : { data: [] };

// Group by session_id; top-set weight = max(actual_weight_kg) per session
```

**Date range toggle:** A client component that receives `allData` and filters it in memory to [all, last-90-days, last-30-days] before passing to `ProgressChart`. No re-fetch needed.

**Chart format for cross-plan view:** Use a single-series chart — one data key `topSet` rather than `set1/set2/set3`. This requires either a simplified `ProgressChart` call (setCount=1, single bar series) or a thin wrapper. The existing `ProgressChart` supports `setCount=1` — this produces a single bar series cleanly.

### Anti-Patterns to Avoid

- **Rebuilding existing pages:** The plan detail page (`/trainer/trainees/[traineeId]/plans/[assignedPlanId]`), session page, and the existing per-plan exercise progress pages are complete and tested. Do not touch them.
- **Using `useState` for tab selection:** Tab state belongs in the URL. `useState` loses state on navigation and doesn't support deep links.
- **Fetching all plans/sessions in the exercise list query:** Only fetch completed session IDs — `in_progress` and `abandoned` sessions should not contribute to personal bests or last-logged dates.
- **Joining `exercises` table through RLS client for trainee-side pages:** The `exercises` table has trainer-only RLS. Always use `createAdminClient()` to resolve exercise names, exactly as the existing trainee exercise progress page does.
- **Using `assigned_schema_exercise_id` as the route key for the new cross-plan pages:** The new `/trainee/exercises/[exerciseId]` and `/trainer/trainees/[traineeId]/exercises/[exerciseId]` routes use the base `exercise_id` (from the `exercises` table). This is the stable identifier across all plans.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress chart | Custom SVG/canvas chart | `ProgressChart` component (already in codebase) | Already built, dark-themed, handles empty states |
| Date range filtering | Custom date picker UI | Simple 3-button toggle, client-side filter | CONTEXT.md: "toggle (not a calendar picker)"; simpler, gym-friendly |
| Exercise name resolution | Re-implementing RLS bypass logic | `createAdminClient()` at `@/lib/supabase/admin` | Already established; all existing exercise-progress pages use it |
| Search/filter bar | New component | Reuse `ExerciseFilterBar` pattern (or a trimmed version without the video filter) | Same UX as trainer's exercise library; muscle group filter chips are identical |
| Tab navigation | Custom routing logic | `searchParams.tab` on server + `router.replace` on client | Next.js built-in; consistent with `ExerciseFilterBar` pattern |

**Key insight:** The entire data and UI infrastructure for this phase already exists in the codebase. Phase 5 is about composing existing pieces into new views, not building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: `assigned_schema_exercise_id` vs `exercise_id` confusion

**What goes wrong:** The existing per-plan exercise progress pages use `assigned_schema_exercise_id` (the ID from `assigned_schema_exercises`) as the route param `[exerciseId]`. The new cross-plan pages must use the base `exercise_id` from the `exercises` table. Mixing these up produces 404s or wrong data.

**Why it happens:** Two different "exercise IDs" exist. Route param names collide.

**How to avoid:** Be explicit in route naming or comments. The new routes use `exerciseId` = base `exercise_id`. The existing routes use `exerciseId` = `assigned_schema_exercise_id`. Document this in page comments. When building the cross-plan pages, fetch `assigned_schema_exercises` rows by `.eq('exercise_id', exerciseId)` (base ID) to gather all ASE IDs for that exercise.

**Warning signs:** `notFound()` triggering unexpectedly; chart shows no data even when the trainee has logged the exercise.

### Pitfall 2: Tab switcher causes full page re-render on every filter interaction

**What goes wrong:** If the exercise list's search/filter state also lives in URL params on the same page as the tab switcher, navigating between tabs clears the filter state. If the tab page re-fetches heavy data on every filter change, perceived performance is poor.

**Why it happens:** All URL params are shared in one query string.

**How to avoid:** The exercise tab's search/filter params (`?q=`, `?muscles=`) should coexist with `?tab=exercises` in the URL. The `ExerciseFilterBar` already does this correctly (`useSearchParams` + `params.set()`). Verify that tab switching does not wipe `q` and `muscles` params — the tab switcher should set `tab` while preserving other params.

### Pitfall 3: Personal best showing `0 kg` for bodyweight exercises

**What goes wrong:** `actual_weight_kg` is nullable (`numeric | null`). If a trainee logs sets with no weight (pure bodyweight), the max weight is `null` (or incorrectly resolved to 0 via `parseFloat`).

**Why it happens:** `parseFloat(null)` returns `NaN`; `parseFloat("")` returns `NaN`; comparison with `>` treats `NaN` as false.

**How to avoid:** In the aggregation logic, only consider sets where `actual_weight_kg IS NOT NULL` when computing personal best. If all sets for an exercise have null weight, display "—" (per CONTEXT.md discretion guidance), not "0 kg".

### Pitfall 4: Date range toggle re-fetching vs. client-side filtering

**What goes wrong:** If the date range toggle triggers a server re-fetch (e.g., it's a link that adds a `?range=` param), the page flickers and the chart re-renders slowly.

**Why it happens:** Developers default to server-driven filtering for consistency.

**How to avoid:** CONTEXT.md specifies "simple 3-option toggle" for fast mobile use. Fetch all data server-side; pass it to a client component that holds the toggle state and filters in memory before passing to `ProgressChart`. The total data volume (one row per completed session) is tiny.

### Pitfall 5: Trainer RLS on `workout_sessions`

**What goes wrong:** The trainer tries to read a trainee's `workout_sessions` using their own session (`createClient()`), but the RLS SELECT policy only allows trainers to read sessions for their own trainees.

**Why it happens:** This is actually already set up correctly — from STATE.md: "Trainer RLS SELECT policies added in same migration as trainee write policies — Phase 5 prep". The pitfall is forgetting to include `.eq('trainee_auth_uid', traineeId)` — without it, if the RLS somehow fails to narrow, wrong data could appear.

**How to avoid:** Always scope queries with `.eq('trainee_auth_uid', traineeId)` for trainer-side reads, even though RLS already enforces this. Defense in depth.

---

## Code Examples

Verified patterns from the existing codebase:

### Admin client for exercise names (established pattern)
```typescript
// Source: src/app/(trainer)/trainer/trainees/[traineeId]/plans/[assignedPlanId]/exercises/[exerciseId]/page.tsx
const admin = createAdminClient();
const { data: exerciseRow } = await admin
  .from('exercises')
  .select('name, muscle_group')
  .eq('id', ase.exercise_id)
  .single();
```

### Tab state via searchParams (to be implemented, consistent with ExerciseFilterBar pattern)
```typescript
// Server component — read tab from searchParams
const resolvedSearch = await searchParams;
const activeTab = resolvedSearch?.tab === 'exercises' ? 'exercises' : 'plans';

// Client tab bar — change tab while preserving other params
const params = new URLSearchParams(searchParams.toString());
params.set('tab', 'exercises');
router.replace(`${pathname}?${params.toString()}`);
```

### Cross-plan ASE lookup (new pattern for Phase 5)
```typescript
// Get all assigned_schema_exercise records for a base exercise_id
const { data: aseRows } = await supabase
  .from('assigned_schema_exercises')
  .select('id')
  .eq('exercise_id', baseExerciseId);  // base UUID from exercises table

// Then filter session_sets by those IDs
const aseIds = (aseRows ?? []).map(r => r.id);
const { data: setsData } = aseIds.length > 0
  ? await supabase
      .from('session_sets')
      .select('session_id, actual_weight_kg, completed_at')
      .in('assigned_schema_exercise_id', aseIds)
      .in('session_id', completedSessionIds)
  : { data: [] };
```

### ProgressChart — single series for top-set weight
```typescript
// Source: src/app/(trainee)/trainee/plans/[assignedPlanId]/exercises/[exerciseId]/_components/ProgressChart.tsx
// setCount=1 produces a single bar series named "Set 1"
// For top-set weight chart, use a data key of "set1" to match ProgressChart's generated key
<ProgressChart data={chartData} setCount={1} unit="kg" />
// chartData shape: [{ label: 'Mar 14', set1: 85 }, { label: 'Mar 7', set1: 82.5 }, ...]
```

### Personal best aggregation (new pattern)
```typescript
// Group sets by exercise_id; find max weight and most recent date
const exerciseMap = new Map<string, { maxWeight: number | null; lastDate: string }>();
for (const set of allSets) {
  const exerciseId = set.assigned_schema_exercises.exercise_id;
  const existing = exerciseMap.get(exerciseId);
  const weight = set.actual_weight_kg != null
    ? Math.round(parseFloat(String(set.actual_weight_kg)) * 10) / 10
    : null;
  if (!existing) {
    exerciseMap.set(exerciseId, { maxWeight: weight, lastDate: set.completed_at });
  } else {
    exerciseMap.set(exerciseId, {
      maxWeight: weight != null && (existing.maxWeight == null || weight > existing.maxWeight)
        ? weight
        : existing.maxWeight,
      lastDate: set.completed_at > existing.lastDate ? set.completed_at : existing.lastDate,
    });
  }
}
```

---

## Existing Infrastructure Inventory

What the planner must treat as done and must not rebuild:

| Feature | Route | Status |
|---------|-------|--------|
| Trainer home — trainee list with plan names | `/trainer` | Complete (PROG-01 satisfied) |
| Trainee profile — current/pending/past plans | `/trainer/trainees/[traineeId]` | Complete |
| Plan detail — weekly drill-down, exercises column | `/trainer/trainees/[traineeId]/plans/[assignedPlanId]` | Complete |
| Session detail — exercises list | `/trainer/trainees/[traineeId]/plans/[assignedPlanId]/workouts/[sessionId]` | Complete |
| Per-plan exercise progress (trainer) | `/trainer/trainees/[traineeId]/plans/[assignedPlanId]/exercises/[exerciseId]` | Complete — uses `assigned_schema_exercise_id` as key |
| Trainee home — plans list | `/trainee` | Complete |
| Per-plan exercise progress (trainee) | `/trainee/plans/[assignedPlanId]/exercises/[exerciseId]` | Complete — uses `assigned_schema_exercise_id` as key |
| ProgressChart component | `src/app/(trainee)/trainee/.../ProgressChart.tsx` | Complete — shared via import |

---

## New Deliverables for This Phase

| Deliverable | Route / File | Notes |
|-------------|-------------|-------|
| Trainer: Exercise tab on trainee profile | `/trainer/trainees/[traineeId]` (modify) | Add `?tab=exercises`; exercise list query |
| Trainer: Cross-plan exercise progress page | `/trainer/trainees/[traineeId]/exercises/[exerciseId]` (new) | Uses base `exercise_id`; top-set weight chart; date range toggle |
| Trainee: Exercise tab on home page | `/trainee` (modify) | Add `?tab=exercises`; exercise list query |
| Trainee: Cross-plan exercise progress page | `/trainee/exercises/[exerciseId]` (new) | Uses base `exercise_id`; identical design to trainer view |

---

## Open Questions

1. **Trainer cross-plan page: link from existing exercise list on plan detail page**
   - What we know: The plan detail page (`/trainer/trainees/[traineeId]/plans/[assignedPlanId]/page.tsx`) links exercises to `/trainer/trainees/${traineeId}/plans/${assignedPlanId}/exercises/${ex.id}` where `ex.id` = `assigned_schema_exercise_id`.
   - What's unclear: Should those existing links be changed to point to the new cross-plan page (using base `exercise_id`)? The cross-plan page requires the base `exercise_id`, which is available in `aseRows` on the plan detail page.
   - Recommendation: Planner should decide. Minimal-change approach: leave existing plan-detail links pointing to the per-plan page (uses `assigned_schema_exercise_id`), and only the new Exercise tab links to the cross-plan page (uses base `exercise_id`). This avoids touching the plan detail page unnecessarily.

2. **Trainee exercise progress: old per-plan page redirect?**
   - What we know: The existing page at `/trainee/plans/[assignedPlanId]/exercises/[exerciseId]` uses `assigned_schema_exercise_id`. CONTEXT.md says it "can remain or point to the new cross-plan page — planner to decide minimal-change approach."
   - What's unclear: Leaving it as-is means two separate exercise progress pages for trainees (per-plan and cross-plan). This is fine functionally.
   - Recommendation: Leave existing per-plan page untouched (it's linked from session pages). Only the new Exercises tab on the trainee home page links to the new cross-plan route.

---

## Sources

### Primary (HIGH confidence)
- Codebase audit (2026-03-17) — `src/lib/db/schema.ts`, all trainer/trainee page files listed above
- STATE.md — project decision log; confirmed trainer RLS SELECT policies added in Phase 4 migration (Phase 5 prep)
- CONTEXT.md — locked decisions, explicit scope boundaries

### Secondary (MEDIUM confidence)
- Next.js 16 App Router `searchParams` behaviour — consistent with existing codebase usage of `await searchParams` in server components; no breaking changes in this area between Next.js 15 and 16

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and existing codebase
- Architecture: HIGH — derived entirely from existing codebase patterns; no novel infrastructure
- Data queries: HIGH — schema fully read; query patterns verified against existing working pages
- Pitfalls: HIGH — derived from real bugs visible in codebase (null weight handling, ID type confusion)

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable dependencies; no fast-moving libraries involved)
