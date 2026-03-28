# Phase 8: Training Logs and Body Weight Progression Tracking - Research

**Researched:** 2026-03-28
**Domain:** Supabase / Next.js 16 / Drizzle ORM — data model extensions, chronological feed UI, body weight tracking with permission flow, chart reuse
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Workout completion enrichment fields** — three optional fields added to the Finish Workout confirmation screen (below existing summary): training time (minutes), kcal burned, difficulty RPE 1–10. All optional. Shown only when tapping "Finish Workout", not during the session. Saved as three new nullable columns on `workout_sessions`.
- **Training log (Log tab)** — new "Log" tab on trainee home, fourth tab (Plans | Exercises | Log | Body Weight). Flat chronological list, most recent first, spanning ALL assigned plans. Each row: date, workout/schema name, optional enrichment fields if filled. No calendar grid. Empty state when no sessions.
- **Body weight data model** — new `body_weight_logs` table: `id`, `trainee_auth_uid`, `logged_date` (date), `weight_kg` (numeric), `created_at`. One-entry-per-day constraint or multiple per day at Claude's Discretion. Weight in kg only. No body fat %, no notes in v1.
- **Body weight UI** — new "Body Weight" tab (4th tab). Default: chronological list, most recent first. "Show Chart" button toggles a line chart inline. Chart uses existing DateRangeToggle pattern (All time / Last 3 months / Last 1 month). "Log weight" button or inline form at top.
- **Trainer access permission flow** — body weight data is trainee-private by default. Trainer sees "Request body weight access" button on trainee profile. Creates a pending access record. Trainer UI shows "Access requested". Trainee sees in-app indicator on their profile. Trainee can Approve or Decline. Once approved: trainer sees Body Weight tab/section on trainee profile. Trainer or trainee can revoke. DB: `body_weight_access_requests` table (or permissions column on `trainer_trainee`) with status `pending | approved | declined`.
- **Trainee home tabs** — Plans | Exercises | Log | Body Weight. Fixed order. Default: Plans.

### Claude's Discretion

- Whether body weight entries can be edited/deleted inline
- Exact 1–10 input style for difficulty (slider, stepper, or tap-to-select row of numbers)
- How in-app access request indicator appears (badge on profile nav, banner, or inline prompt)
- Loading/skeleton states for log tab and body weight tab
- Whether `body_weight_logs` allows multiple entries per day or enforces one-per-day
- Exact visual layout of the body weight log list (compact row vs. card)
- Chart empty state design

### Deferred Ideas (OUT OF SCOPE)

- Body fat % and additional body composition metrics
- Automatic smartwatch data sync (HealthKit / Garmin API)
- Email notification to trainee for body weight access request
- REST timer between sets (TRACK-07)
- Offline logging with sync (TRACK-08)
</user_constraints>

---

## Summary

Phase 8 extends three areas of the existing codebase: (1) the Finish Workout flow gains optional enrichment fields saved to `workout_sessions`; (2) the trainee home gains a "Log" tab showing a chronological session feed; (3) the trainee home gains a "Body Weight" tab with a log list plus an inline chart, protected by a trainer-access permission flow.

All three areas follow patterns already established in the project: nullable `ALTER TABLE` columns for DB extension, Server Actions for writes, admin client for cross-RLS reads, and the existing `TabSwitcher` + `DateRangeToggle` + `ProgressChart` components for the UI. No new charting library is needed — `recharts` is already installed at `^3.8.0`. For body weight a `LineChart` from recharts replaces the existing `BarChart` used for exercise progress.

The trainer access permission flow is the most novel part of this phase. The cleanest pattern in the project for similar two-party data sharing is the `trainer_trainee_connections` table with RLS policies. The `body_weight_access_requests` table follows the same shape and is the right choice here because it is per-trainee-trainer pair, has a status lifecycle, and needs separate RLS policies for trainer writes and trainee reads/updates.

**Primary recommendation:** Implement all three capabilities in three sequential plans: Plan 1 (migration + enrichment fields), Plan 2 (Log tab), Plan 3 (Body Weight tab + trainer permission flow).

---

## Standard Stack

### Core (already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App framework, Server Actions, RSC | Project baseline |
| @supabase/ssr | ^0.9.0 | Server/client Supabase access | Project baseline |
| drizzle-orm | ^0.45.1 | Schema types, type-safe DB calls | Project baseline |
| recharts | ^3.8.0 | Charts — BarChart already used, LineChart needed for body weight | Already installed |
| tailwindcss | ^4 | Styling | Project baseline |

### No New Dependencies Required

All Phase 8 UI and data requirements are covered by the existing stack. The body weight chart requires a `LineChart` (not `BarChart`) from recharts — recharts already exports both; no new package needed.

**Installation:** none required.

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
src/
├── lib/db/migrations/
│   └── 0011_training_logs_body_weight.sql   # All Phase 8 DDL
├── app/(trainee)/trainee/
│   ├── page.tsx                              # Extend: add Log + Body Weight tabs
│   ├── log/
│   │   └── page.tsx                          # Log tab content (server component)
│   └── body-weight/
│       ├── page.tsx                          # Body Weight tab content (server component)
│       ├── actions.ts                        # logWeight, deleteWeight server actions
│       └── _components/
│           ├── BodyWeightLogForm.tsx          # "Log weight" inline form (client)
│           └── BodyWeightChart.tsx           # Toggle chart with DateRangeToggle (client)
├── app/(trainer)/trainer/trainees/[traineeId]/
│   └── _components/
│       ├── BodyWeightTab.tsx                 # Trainer view after access granted (client reads server props)
│       ├── RequestBodyWeightAccessButton.tsx # Trainer requests access (client)
│       └── RevokeBodyWeightAccessButton.tsx  # Trainer revokes access (client)
├── app/(trainee)/trainee/profile/
│   └── _components/
│       └── BodyWeightAccessRequestBanner.tsx # Pending request indicator for trainee (client)
```

### Pattern 1: Extending a Table with Nullable Columns (DB Migration)

**What:** Add columns to `workout_sessions` via `ALTER TABLE`. Add new tables for `body_weight_logs` and `body_weight_access_requests`.
**When to use:** Any time existing tables need new optional fields — project convention throughout (see migrations 0004, 0006, 0007, 0009, 0010).

```sql
-- Source: project conventions from 0009_profile_fields.sql and 0006_tempo_progression.sql
ALTER TABLE workout_sessions
  ADD COLUMN duration_minutes INTEGER,
  ADD COLUMN kcal_burned INTEGER,
  ADD COLUMN rpe INTEGER CHECK (rpe BETWEEN 1 AND 10);
```

### Pattern 2: New Table with RLS (body_weight_logs)

**What:** Trainee-owned table. Trainee has full CRUD. Trainer gets SELECT only when access is approved.
**When to use:** Any trainee-private data with conditional trainer read access.

```sql
-- Source: pattern from 0005_workout_sessions.sql
CREATE TABLE body_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_auth_uid UUID NOT NULL,
  logged_date DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (trainee_auth_uid, logged_date)  -- one entry per day; upsert on conflict
);

ALTER TABLE body_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainee manages own body weight logs" ON body_weight_logs FOR ALL
  USING (trainee_auth_uid = auth.uid())
  WITH CHECK (trainee_auth_uid = auth.uid());

-- Trainer SELECT conditional on approved access request
CREATE POLICY "Trainer reads body weight with permission" ON body_weight_logs FOR SELECT
  USING (
    trainee_auth_uid IN (
      SELECT trainee_auth_uid FROM body_weight_access_requests
      WHERE trainer_auth_uid = auth.uid()
        AND status = 'approved'
    )
  );
```

### Pattern 3: Permission Table (body_weight_access_requests)

**What:** Tracks trainer-trainee access requests with a status lifecycle.

```sql
CREATE TABLE body_weight_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_auth_uid UUID NOT NULL,
  trainee_auth_uid UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (trainer_auth_uid, trainee_auth_uid)
);

-- Trainer creates / updates own requests
CREATE POLICY "Trainer manages own body weight requests" ON body_weight_access_requests FOR ALL
  USING (trainer_auth_uid = auth.uid())
  WITH CHECK (trainer_auth_uid = auth.uid());

-- Trainee reads and updates their own incoming requests
CREATE POLICY "Trainee reads own body weight requests" ON body_weight_access_requests FOR SELECT
  USING (trainee_auth_uid = auth.uid());

CREATE POLICY "Trainee updates own body weight request status" ON body_weight_access_requests FOR UPDATE
  USING (trainee_auth_uid = auth.uid())
  WITH CHECK (trainee_auth_uid = auth.uid());
```

### Pattern 4: Extending finishWorkout Server Action

**What:** The existing `finishWorkout` action in `src/app/(trainee)/trainee/actions.ts` needs to optionally accept enrichment fields. Extend the signature, add an UPDATE for the 3 new columns after marking the session completed.
**When to use:** The action already handles the session lifecycle; enrichment is additive.

```typescript
// Source: src/app/(trainee)/trainee/actions.ts finishWorkout pattern
export async function finishWorkout(
  sessionId: string,
  enrichment?: {
    durationMinutes?: number | null;
    kcalBurned?: number | null;
    rpe?: number | null;
  }
): Promise<{ success: true; summary: ... } | { error: string }>
```

### Pattern 5: Trainee Home Tab Extension

**What:** The trainee home page (`src/app/(trainee)/trainee/page.tsx`) currently renders a flat layout with no tabs. The Exercises section lives at `/trainee/exercises` as a separate page route. The trainer-side trainee detail page (`/trainer/trainees/[traineeId]/page.tsx`) is the model for tab-based home layout — it already uses `TabSwitcher` with URL-based tab state via `searchParams`.

**Critical observation:** The trainee home page does NOT yet use `TabSwitcher`. Phase 5 added the Exercises section as a separate page (`/trainee/exercises`), NOT as a tab on the home page. Phase 8 needs to add tabs to the trainee home. The approach depends on whether Log and Body Weight become separate routes or tab sections on the home page.

**Recommendation:** Follow the trainer-side pattern — make `/trainee` a tabbed page using `TabSwitcher` with `?tab=plans|exercises|log|body-weight` URL params. The existing `/trainee/exercises` route can remain for direct deep-links (exercises detail pages link back there), and the trainee home Plans tab becomes the default. This avoids breaking existing exercise detail page back-links.

The alternative — separate route pages at `/trainee/log` and `/trainee/body-weight` — is simpler and avoids touching the home page layout. Given the existing Exercises section is already at a separate route, this is the least-risk path: keep the home page layout as-is and add new route pages. Navigation between tabs would be via links in a shared TabSwitcher-style header.

**Decision for planner:** The CONTEXT.md says "Tab order is fixed" and references trainee home becoming "4 tabs". Both patterns are valid. The separate-page approach (new routes for Log and Body Weight) matches what Phase 5 did for Exercises and avoids restructuring the home page. The tab-on-home-page approach matches the trainer profile page. The separate-page route approach is safer.

### Pattern 6: Body Weight Line Chart

**What:** The existing `ProgressChart` uses `BarChart` from recharts. Body weight needs a `LineChart` (continuous trend, not per-session bars).

```typescript
// Source: recharts LineChart — same library already in use
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// data shape: [{ label: 'Mar 28', weight: 85.5, loggedDate: '2026-03-28' }, ...]
<ResponsiveContainer width="100%" height={240}>
  <LineChart data={filteredData}>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.45)' }} tickLine={false} axisLine={false} />
    <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.45)' }} tickLine={false} axisLine={false} unit=" kg" />
    <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', fontSize: '12px' }} />
    <Line type="monotone" dataKey="weight" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
  </LineChart>
</ResponsiveContainer>
```

### Pattern 7: FinishWorkoutButton Enrichment Fields

**What:** The `FinishWorkoutButton` component (currently missing from the file system — it was referenced in the session page but not found at `_components/FinishWorkoutButton.tsx`). This is likely a client component that shows an inline confirmation panel. It needs to be found or recreated to add the enrichment fields below the summary.

**Action needed for planner:** Verify/locate `FinishWorkoutButton` before modifying it. It may live at a different path or be named differently. The session page at line 251 imports it from `./_components/FinishWorkoutButton`.

### Anti-Patterns to Avoid

- **Don't use a separate DB table for enrichment fields** — they belong on `workout_sessions` as nullable columns, matching the existing `notes` column pattern.
- **Don't add RLS policies on `body_weight_logs` that use a JOIN across three tables** — keep the trainer SELECT policy simple by joining only through `body_weight_access_requests`.
- **Don't skip the UNIQUE constraint on `body_weight_logs(trainee_auth_uid, logged_date)`** — enables safe upsert, prevents duplicate entries.
- **Don't use a modal for body weight entry** — the CONTEXT.md specifies an inline form or button at the top of the page.
- **Don't add the body weight chart to the DOM before the "Show Chart" button is clicked** — toggle with `useState` on the client component to avoid unnecessary recharts rendering.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Line chart for body weight trend | Custom SVG chart | recharts `LineChart` | Already in project, same dark theme config |
| Tab navigation with URL sync | Custom router push | `TabSwitcher` component | Already handles `?tab=` URL params, router.replace |
| Date range filtering | Custom date math | Existing `DateRangeToggle` + client-side filter pattern | Identical to `TraineeCrossPlanChart` pattern — copy it |
| DB migration format | drizzle-kit generate | Hand-written SQL migration | Project convention: all migrations are hand-written SQL with RLS in same file |
| Admin client bypass | Service role key in Server Action directly | `createAdminClient()` from `@/lib/supabase/admin` | Existing utility, correct pattern for bypassing RLS |

**Key insight:** This phase is almost entirely assembly of existing patterns. The only genuinely new element is the permission request lifecycle — and even that follows the shape of the existing `trainer_trainee_connections` table.

---

## Common Pitfalls

### Pitfall 1: FinishWorkoutButton is a Client Component — Enrichment Fields Are Async

**What goes wrong:** The enrichment fields need to be collected before `finishWorkout` is called. If the existing `FinishWorkoutButton` calls `finishWorkout` directly, adding form fields requires lifting state or refactoring the component.
**Why it happens:** The "Finish Workout" flow uses an inline confirmation panel with an `idle/confirming/submitting/done` state machine. Enrichment fields should appear in the `confirming` state, below the summary.
**How to avoid:** Add the three optional inputs to the `confirming` state panel. Pass their values to `finishWorkout` when the trainee confirms.
**Warning signs:** TypeScript error on `finishWorkout` call signature when enrichment param is added.

### Pitfall 2: Training Log Query — Joining Sessions to Schema Names Across All Plans

**What goes wrong:** The log tab needs `schema name` per session, but `workout_sessions` only stores `assigned_schema_id`. Getting the schema name requires joining `assigned_schemas`. The Supabase JS client supports embedded selects — `workout_sessions.select('id, completed_at, assigned_schemas(name)')` — but this requires the FK relationship to be defined.
**Why it happens:** The FK from `workout_sessions.assigned_schema_id` to `assigned_schemas.id` exists in the migration SQL. PostgREST infers the join automatically.
**How to avoid:** Use the embedded select pattern already used in the home page: `assigned_schemas!inner(id, name, assigned_plan_id)`. Filter by `trainee_auth_uid`, order by `completed_at DESC`, filter `status = completed`.
**Warning signs:** Empty `assigned_schemas` data in the response — check that the FK name matches PostgREST's inferred relationship name.

### Pitfall 3: Body Weight Upsert — Date vs. Timestamp

**What goes wrong:** `logged_date` is a PostgreSQL `DATE` column. PostgREST serializes it as a string like `"2026-03-28"`. If the upsert payload sends an ISO timestamp (`"2026-03-28T00:00:00.000Z"`), the unique constraint on `(trainee_auth_uid, logged_date)` may not conflict as expected.
**Why it happens:** JavaScript `new Date().toISOString()` produces a timestamp. PostgreSQL will cast it to a date, but PostgREST upsert needs the conflict target to match the column type.
**How to avoid:** Send the date as `YYYY-MM-DD` string: `new Date().toLocaleDateString('en-CA')` (ISO format `2026-03-28`). Use `onConflict: 'trainee_auth_uid,logged_date'` in the Supabase upsert call.
**Warning signs:** Duplicate entries on the same day; upsert inserting instead of updating.

### Pitfall 4: Trainer Access — RLS Must Allow Trainer to INSERT the Request Row

**What goes wrong:** The trainer creates an access request row (INSERT). If the RLS `FOR ALL` policy is written as `USING (trainer_auth_uid = auth.uid())` without a `WITH CHECK`, inserts may fail on some Postgres versions.
**Why it happens:** Known pattern — `FOR ALL USING` alone is insufficient for INSERT in all Postgres versions (documented in project STATE.md under `[02-01]`).
**How to avoid:** Always pair `USING` with `WITH CHECK` on INSERT/UPDATE policies, as done in all prior Phase migrations.

### Pitfall 5: Drizzle Schema — New Tables Need Entries

**What goes wrong:** `src/lib/db/schema.ts` must export the new table definitions for `bodyWeightLogs` and `bodyWeightAccessRequests` — otherwise TypeScript types won't be available and the planner's tasks will miss the type exports.
**Why it happens:** The schema file is the single source of truth for TypeScript types; it must stay in sync with migrations.
**How to avoid:** Add Drizzle table definitions + inferred types for both new tables in `schema.ts` in the same plan that writes the SQL migration.

### Pitfall 6: RPE Input UX — inputMode and min/max

**What goes wrong:** A standard `<input type="number" min="1" max="10">` on mobile may show a decimal keyboard. Users expect a 1–10 integer picker.
**Why it happens:** `type="number"` on mobile doesn't constrain to integers unless `step="1"` is set and `inputMode="numeric"` is added.
**How to avoid:** Use `<input type="number" min="1" max="10" step="1" inputMode="numeric">` or a tap-to-select row of 10 buttons (Claude's Discretion). The tap-select row is more gym-friendly and avoids keyboard popups.

---

## Code Examples

### Training Log Query (Server Component)

```typescript
// Source: patterns from src/app/(trainee)/trainee/page.tsx and session page
const { data: logSessions } = await supabase
  .from('workout_sessions')
  .select('id, completed_at, duration_minutes, kcal_burned, rpe, assigned_schemas!inner(name, assigned_plan_id)')
  .eq('trainee_auth_uid', claims.sub)
  .eq('status', 'completed')
  .order('completed_at', { ascending: false });
```

### Body Weight Log Upsert (Server Action)

```typescript
// Source: completeSet pattern in src/app/(trainee)/trainee/actions.ts
const { error } = await supabase.from('body_weight_logs').upsert(
  {
    trainee_auth_uid: claims.sub,
    logged_date: new Date().toLocaleDateString('en-CA'), // "2026-03-28"
    weight_kg: weightKg,
  },
  { onConflict: 'trainee_auth_uid,logged_date' }
);
```

### Trainer Requests Body Weight Access (Server Action)

```typescript
// Source: admin client pattern from src/app/(trainee)/trainee/actions.ts
const admin = createAdminClient();
const { error } = await admin.from('body_weight_access_requests').upsert(
  {
    trainer_auth_uid: trainerUid,
    trainee_auth_uid: traineeId,
    status: 'pending',
  },
  { onConflict: 'trainer_auth_uid,trainee_auth_uid' }
);
```

Note: Trainer uses their own RLS with `createClient()` for this insert since the policy covers `FOR ALL USING (trainer_auth_uid = auth.uid())`. Admin client only needed if RLS blocks the insert.

### Trainee Approves/Declines Access (Server Action)

```typescript
// Trainee uses createClient() — policy allows UPDATE where trainee_auth_uid = auth.uid()
const { error } = await supabase
  .from('body_weight_access_requests')
  .update({ status: newStatus, updated_at: new Date().toISOString() })
  .eq('trainer_auth_uid', trainerUid)
  .eq('trainee_auth_uid', claims.sub);
```

### finishWorkout Signature Extension

```typescript
// Extend existing finishWorkout in src/app/(trainee)/trainee/actions.ts
export async function finishWorkout(
  sessionId: string,
  enrichment?: { durationMinutes?: number | null; kcalBurned?: number | null; rpe?: number | null }
): Promise<{ success: true; summary: { setsCompleted: number; totalPlanSets: number } } | { error: string }> {
  // ... existing logic ...
  // After marking completed:
  if (enrichment && (enrichment.durationMinutes != null || enrichment.kcalBurned != null || enrichment.rpe != null)) {
    await supabase
      .from('workout_sessions')
      .update({
        duration_minutes: enrichment.durationMinutes ?? null,
        kcal_burned: enrichment.kcalBurned ?? null,
        rpe: enrichment.rpe ?? null,
      })
      .eq('id', sessionId)
      .eq('trainee_auth_uid', claims.sub);
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BarChart (exercise progress) | LineChart needed for body weight trend | Phase 8 (new) | Use `LineChart` not `BarChart` for weight trend |
| Flat trainee home (no tabs) | Tab-structured home needed | Phase 8 (new) | Decide: tab-on-page vs. separate routes |

**Deprecated/outdated:**
- Nothing deprecated for this phase — all existing patterns remain valid.

---

## Open Questions

1. **Navigation structure: tabs on `/trainee` vs. separate route pages**
   - What we know: The existing Exercises section is a separate route (`/trainee/exercises`). The trainer detail page uses tabs on the same URL. CONTEXT.md says "trainee home becomes 4 tabs".
   - What's unclear: Whether to restructure the home page to be tab-based (touching existing Plans rendering) or add Log and Body Weight as separate pages with a navigation header.
   - Recommendation: Add Log and Body Weight as separate route pages (`/trainee/log`, `/trainee/body-weight`) and add a shared navigation TabSwitcher above the existing Plans content. This is least-invasive and mirrors how Exercises was added in Phase 5. The TraineeNavHeader or a sub-header can carry the 4-tab switcher. Alternatively, keep the trainee home truly tab-based — worth the planner confirming with the existing page structure.

2. **FinishWorkoutButton location**
   - What we know: Session page (`src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/page.tsx`) imports `FinishWorkoutButton` from `./_components/FinishWorkoutButton`. The glob for that path returned no results.
   - What's unclear: The file may have been added after the git snapshot or may be named differently. The glob pattern used doesn't match anything under that path.
   - Recommendation: Planner/implementer should verify the file exists before modifying it. If it doesn't exist (unlikely given the import), it needs to be created. The state machine description in STATE.md (`idle/confirming/submitting/done`) describes its behavior.

3. **One entry per day vs. multiple per day for body_weight_logs**
   - What we know: CONTEXT.md marks this as Claude's Discretion.
   - Recommendation: Enforce one-per-day with a UNIQUE constraint and upsert semantics. This is simpler and more useful — users want to log or update their weight for a given day, not accumulate multiple readings. Upsert replaces the prior value if a user re-enters for the same date.

4. **Where to surface the pending access request indicator to the trainee**
   - What we know: CONTEXT.md marks this as Claude's Discretion (badge on profile nav, banner, or inline prompt).
   - Recommendation: Inline prompt/banner on the trainee's Body Weight tab. When a trainer has a pending request, show a dismissable banner at the top of the Body Weight tab with Approve/Decline buttons. This is contextually relevant (on the body weight page itself) and avoids a complex notification badge system.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected (no jest.config, vitest.config, pytest.ini, or test directories found) |
| Config file | None — Wave 0 gap |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOG-01 | finishWorkout saves enrichment fields (duration, kcal, rpe) to workout_sessions | unit | N/A — Wave 0 gap | ❌ Wave 0 |
| LOG-02 | Training log query returns completed sessions in reverse chronological order | unit | N/A — Wave 0 gap | ❌ Wave 0 |
| LOG-03 | Body weight upsert creates new row or updates existing row for same date | unit | N/A — Wave 0 gap | ❌ Wave 0 |
| LOG-04 | Trainer access request creates pending row; approve/decline updates status | unit | N/A — Wave 0 gap | ❌ Wave 0 |
| LOG-05 | Trainer cannot read body_weight_logs without approved access request (RLS) | manual-only | Manual DB check | N/A |
| LOG-06 | Trainee home shows 4 tabs in correct order | manual-only | Visual inspection | N/A |

### Sampling Rate
- **Per task commit:** N/A — no test framework yet
- **Per wave merge:** N/A — no test framework yet
- **Phase gate:** Manual review before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No test framework detected — this project has no automated tests. All validation is manual/visual.

*(No existing test infrastructure — all phase verification is manual inspection and end-to-end testing in the browser.)*

---

## Sources

### Primary (HIGH confidence)
- Direct code read: `src/lib/db/schema.ts` — existing table definitions, column patterns
- Direct code read: `src/lib/db/migrations/0005_workout_sessions.sql` — RLS policy patterns
- Direct code read: `src/lib/db/migrations/0009_profile_fields.sql` — ALTER TABLE nullable column pattern
- Direct code read: `src/app/(trainee)/trainee/actions.ts` — finishWorkout action to extend
- Direct code read: `src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/page.tsx` — FinishWorkoutButton usage
- Direct code read: `src/app/(trainee)/trainee/exercises/[exerciseId]/_components/TraineeCrossPlanChart.tsx` — DateRangeToggle + ProgressChart chart pattern
- Direct code read: `src/app/(trainee)/trainee/plans/[assignedPlanId]/exercises/[exerciseId]/_components/ProgressChart.tsx` — recharts BarChart implementation
- Direct code read: `src/components/TabSwitcher.tsx` — tab navigation with URL params
- Direct code read: `src/components/DateRangeToggle.tsx` — date range toggle component
- Direct code read: `src/app/(trainer)/trainer/trainees/[traineeId]/page.tsx` — trainer page tab pattern + model for trainer body weight tab
- Direct code read: `src/app/(trainee)/trainee/page.tsx` — existing trainee home (no tabs)
- Direct code read: `package.json` — recharts ^3.8.0 confirmed present

### Secondary (MEDIUM confidence)
- Project STATE.md decisions — `[02-01]` FOR ALL USING insufficient for INSERT without WITH CHECK (cross-referenced with SQL migration files)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in package.json
- Architecture: HIGH — patterns read directly from existing code
- DB migration: HIGH — hand-written SQL pattern verified from 10 existing migration files
- Pitfalls: HIGH — derived from existing code patterns and project STATE.md decisions
- Chart reuse: HIGH — recharts LineChart is in the same library, same config patterns apply

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable stack, 30-day estimate)
