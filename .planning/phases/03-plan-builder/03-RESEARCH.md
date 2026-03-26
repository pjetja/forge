# Phase 3: Plan Builder - Research

**Researched:** 2026-03-11
**Domain:** Next.js 16 + Supabase + React 19 — complex relational data modeling, drag-and-drop UI, plan snapshot/duplication
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Navigation structure**
- Bottom nav with 3 tabs: Trainees (default landing after login), Plans, Exercise Library
- Exercise Library tab was built in Phase 2; Phase 3 adds Trainees and Plans tabs

**Trainees page**
- Card list of trainees: each card shows trainee Name + currently assigned plan
- Tap trainee -> Trainee detail page: current plan, past plans, short trainee summary

**Plans page (template list)**
- Each plan card shows: plan name + week count + assigned trainee count
- E.g., "8-Week Hypertrophy | 8 weeks | 3 trainees"

**Plan creation / weekly structure**
- Trainer sets two values on creation: number of weeks (e.g., 4, 8, 12) and workouts per week (e.g., 3, 4, 5)
- Trainer designs a single weekly template — the same pattern repeats across all weeks
- No per-week overrides; all weeks follow the same template
- View: week tabs (one week at a time), each tab shows workout slots (Workout 1, Workout 2, etc.) — not calendar days (Mon/Tue)
- Trainer assigns a schema to each workout slot in the template (e.g., Workout 1 = Push Day)

**Schema editor**
- Tapping a workout slot (schema) opens a dedicated schema editor page
- Exercise added via search/browse exercise library modal (tap "+ Add Exercise")
- Each exercise row shows inline number inputs: sets | reps | target weight
- Trainer can toggle per-exercise between single weight for all sets OR per-set weights
  - Per-set mode: row expands to show each set as a sub-row with its own weight input
- Exercises can be reordered via drag handles on each row

**Plan assignment model**
- Plans are reusable templates — created generically, assigned to trainees afterward
- Assignment creates a per-trainee copy (snapshot); editing the template does not affect existing assigned plans
- At assignment time: a review & edit step shows all exercises pre-filled with target weights from the trainee's history (last logged weight for each exercise from any previous plan)
- Trainer can adjust any weight in this review step before confirming
- Trainer also sees the trainee's last progress context for each exercise inline in this step

**Trainee plan lifecycle**
- A trainee can have only one active plan at a time
- If a new plan is assigned while one is active: new plan remains inactive/pending until the current plan is finished or terminated
- Trainee explicitly starts the plan: they see the assigned plan in a "pending" state and tap "Start Plan" to activate it (Week 1 begins from that moment)

**Editing live plans (assigned plans)**
- Trainer edits the per-trainee assigned plan copy (not the template)
- Changes are immediately live — no draft/publish step
- Trainee sees a subtle badge/notification: "Plan updated by trainer"
- Editing the template is forward-only: only future assignments use the updated template; existing assigned copies are unaffected

### Claude's Discretion
- Loading states, empty states (no plans yet, no trainees yet)
- Exact plan creation form layout
- How "terminate current plan" is surfaced to the trainee
- Design of the trainee detail page summary section

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within Phase 3 scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAN-01 | Trainer can create a named workout plan spanning multiple weeks | DB schema: `plans` table with `week_count`, `workouts_per_week`; Server Action pattern from Phase 2 |
| PLAN-02 | Trainer can define named workout schemas within a plan (e.g. "Push Day", "Pull Day") | DB schema: `workout_schemas` table linked to plan; schema editor page pattern |
| PLAN-03 | Trainer can assign workout schemas to specific days within each week | Weekly template model: `workout_slots` table with `slot_index` (1..workouts_per_week); repeats across all weeks by design |
| PLAN-04 | Trainer can add exercises to a schema with sets, reps, and target weight | `schema_exercises` table; inline inputs; drag-and-drop reorder via @dnd-kit/sortable; per-set weight via JSONB array |
| PLAN-05 | Trainer can assign a plan to a connected trainee | `assigned_plans` table; snapshot deep-copy via Postgres RPC function; review step with weight pre-fill from history |
| PLAN-06 | Trainer can duplicate (template) an existing plan to reuse for another trainee | Same deep-copy Postgres function reused; new plan record with cloned schemas/exercises |
| PLAN-07 | Trainer can edit a plan that is currently assigned to an active trainee | Edit the `assigned_plans` snapshot copy; `updated_at` badge flag for trainee notification |
</phase_requirements>

---

## Summary

Phase 3 introduces the most complex data model in the app so far. The key architectural decision (already locked by the user) is the **template/snapshot split**: plan templates are authored once and assigned to trainees as deep-copied snapshots. Editing a template never affects live assigned plans; editing a snapshot copy is immediately visible to the trainee. This means the database must support two parallel structures that mirror each other (template tables and assigned-plan tables), or a unified table with a `source_plan_id` FK that distinguishes template rows from snapshot rows.

The most technically complex operations in this phase are: (1) the deep-copy on assignment (must atomically clone a plan with all its schemas, slots, and exercises), and (2) the schema editor's drag-and-drop exercise reordering. The supabase-js client does not support SQL transactions natively — the correct pattern for the deep-copy is a Postgres stored function called via `supabase.rpc()`. For drag-and-drop, `@dnd-kit/sortable` (v10) is the current standard with confirmed React 19 compatibility.

The navigation change (adding Trainees and Plans tabs) requires updating the existing `NavHeader` component to add two new routes. The current NavHeader already handles active-state highlighting via `pathname.startsWith(href)`, so extending it is straightforward. The Trainees page is the new default trainer landing page, replacing the current `/trainer` roster page.

**Primary recommendation:** Design the DB schema with two clean table sets (template tables and assigned-plan tables), use a Postgres RPC for the deep-copy assignment, and use @dnd-kit/sortable for exercise reordering with a `sort_order` integer column.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.3.1 | Drag-and-drop context, sensors, collision detection | Peer dependency of sortable; required |
| @dnd-kit/sortable | 10.0.0 | useSortable hook + SortableContext + arrayMove | Standard sortable list preset for dnd-kit |
| @dnd-kit/utilities | 3.2.2 | CSS.Transform.toString() helper | Required for style transform in useSortable |
| Supabase RPC | (existing @supabase/supabase-js ^2.99.0) | Atomic deep-copy via stored Postgres function | Only way to run multi-table transaction through supabase-js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | ^7.71.2 (already installed) | Form for plan creation, schema name, exercise inputs | All forms — already in project |
| zod | ^4.3.6 (already installed) | Validation schemas for plan and schema forms | All Server Action input validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/sortable | react-beautiful-dnd | react-beautiful-dnd is unmaintained (last release 2022); dnd-kit is the current community standard |
| @dnd-kit/sortable | HTML5 drag-and-drop (native) | No touch support, no accessibility, no animation helpers |
| Postgres RPC for deep-copy | Multiple sequential Server Action inserts | Multiple inserts are NOT atomic — partial failure leaves orphan rows; RPC is the correct approach |

**Installation:**
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Architecture Patterns

### Recommended Database Schema (Migration 0003_plans.sql)

The data model has two levels: **template tables** (the plan the trainer authors) and **assigned-plan tables** (the per-trainee snapshot). They are deliberately separate tables to allow independent evolution.

```
Template level:
  plans                     — template plan record (trainer_auth_uid, name, week_count, workouts_per_week)
  workout_schemas           — named schema within a plan (plan_id, name, sort_order)
  schema_exercises          — exercises in a schema (schema_id, exercise_id, sort_order, sets, reps, target_weight_kg, per_set_weights JSONB)

Assigned-plan level:
  assigned_plans            — snapshot copy of a plan assigned to a trainee (plan_id template FK, trainer_auth_uid, trainee_auth_uid, status: pending|active|completed|terminated, started_at, plan_updated_at)
  assigned_schemas          — copy of workout_schemas for this assigned plan
  assigned_schema_exercises — copy of schema_exercises for this assigned plan
```

**Key design choices:**
- `workout_slots` is NOT a separate table. Because all weeks follow the same template and slots are ordinal (Workout 1, Workout 2...), a schema's `slot_index` column (1-indexed integer, 1..workouts_per_week) is sufficient. There is no per-week variation to store.
- `per_set_weights` is a JSONB array (e.g. `[80, 82.5, 85]`) stored only when per-set mode is enabled for that exercise row. When NULL, the single `target_weight_kg` value applies to all sets.
- `assigned_plans.plan_updated_at` is a timestamp updated on any edit to an assigned plan — the trainee reads this to show the "Plan updated by trainer" badge.

### Recommended Project Structure

```
src/
├── app/(trainer)/trainer/
│   ├── page.tsx                          # Trainees tab (new default landing)
│   ├── plans/
│   │   ├── page.tsx                      # Plans template list
│   │   ├── new/page.tsx                  # Plan creation form
│   │   ├── [planId]/
│   │   │   ├── page.tsx                  # Plan template editor (weekly view)
│   │   │   └── schemas/[schemaId]/
│   │   │       └── page.tsx              # Schema editor (exercises + drag)
│   ├── trainees/
│   │   └── [traineeId]/
│   │       └── page.tsx                  # Trainee detail page
│   ├── _components/
│   │   ├── NavHeader.tsx                 # UPDATE: add Trainees + Plans tabs
│   │   ├── TraineeCard.tsx               # New: trainee row card
│   │   ├── PlanCard.tsx                  # New: plan template card
│   │   ├── PlanWeekView.tsx              # New: week tabs + workout slots
│   │   ├── SchemaExerciseList.tsx        # New: drag-sortable exercise list
│   │   ├── SchemaExerciseRow.tsx         # New: single exercise row with inputs
│   │   ├── ExercisePickerModal.tsx       # New: search/browse exercises to add
│   │   └── AssignPlanModal.tsx           # New: review step + weight pre-fill
│   ├── plans/actions.ts                  # Server Actions: createPlan, updatePlan, duplicatePlan, assignPlan
│   └── trainees/actions.ts               # Server Actions: editAssignedPlan, terminatePlan
├── lib/db/
│   ├── schema.ts                         # UPDATE: add plan/schema/exercise types
│   └── migrations/
│       └── 0003_plans.sql                # New migration
```

### Pattern 1: Drag-and-Drop Exercise Reorder with @dnd-kit/sortable

**What:** Wrap exercise list in `DndContext` + `SortableContext`. Each row uses `useSortable`. On `onDragEnd`, call `arrayMove` and immediately persist new sort_order to DB via Server Action.

**When to use:** Any ordered list where user can drag to reorder.

```typescript
// Source: https://dndkit.com/presets/sortable
'use client';
import { useState, useTransition } from 'react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Individual row component
function SortableExerciseRow({ exercise }: { exercise: SchemaExercise }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: exercise.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3">
      {/* Drag handle — listeners only on handle, not entire row */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-text-primary"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      {/* ... rest of row */}
    </div>
  );
}

// Parent list component
export function SchemaExerciseList({ initialExercises, schemaId }: Props) {
  const [exercises, setExercises] = useState(initialExercises);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),  // Touch support for mobile gym use
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = exercises.findIndex((e) => e.id === active.id);
    const newIndex = exercises.findIndex((e) => e.id === over.id);
    const reordered = arrayMove(exercises, oldIndex, newIndex);
    setExercises(reordered);
    startTransition(async () => {
      await reorderExercises(schemaId, reordered.map((e) => e.id));
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        {exercises.map((exercise) => (
          <SortableExerciseRow key={exercise.id} exercise={exercise} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Pattern 2: Atomic Plan Deep-Copy via Postgres RPC

**What:** Create a Postgres stored function that copies a plan template (or assigned plan) into a new set of rows. Call it from a Server Action via `supabase.rpc()`.

**When to use:** Whenever a single atomic operation must INSERT into multiple tables. The supabase-js client has no transaction API — RPC is the only correct path.

```sql
-- In migration 0003_plans.sql
CREATE OR REPLACE FUNCTION duplicate_plan(
  source_plan_id UUID,
  new_trainer_auth_uid UUID,
  new_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_plan_id UUID;
  schema_record RECORD;
  new_schema_id UUID;
BEGIN
  -- Copy the plan header
  INSERT INTO plans (trainer_auth_uid, name, week_count, workouts_per_week, source_plan_id)
    SELECT new_trainer_auth_uid, new_name, week_count, workouts_per_week, source_plan_id
    FROM plans WHERE id = source_plan_id
  RETURNING id INTO new_plan_id;

  -- Copy each schema
  FOR schema_record IN SELECT * FROM workout_schemas WHERE plan_id = source_plan_id LOOP
    INSERT INTO workout_schemas (plan_id, name, slot_index, sort_order)
      VALUES (new_plan_id, schema_record.name, schema_record.slot_index, schema_record.sort_order)
    RETURNING id INTO new_schema_id;

    -- Copy exercises for this schema
    INSERT INTO schema_exercises
      (schema_id, exercise_id, sort_order, sets, reps, target_weight_kg, per_set_weights)
    SELECT new_schema_id, exercise_id, sort_order, sets, reps, target_weight_kg, per_set_weights
    FROM schema_exercises WHERE schema_id = schema_record.id;
  END LOOP;

  RETURN new_plan_id;
END;
$$;
```

```typescript
// Server Action calling the RPC
'use server';
export async function duplicatePlan(
  sourcePlanId: string,
  newName: string,
): Promise<{ planId: string } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { data, error } = await supabase.rpc('duplicate_plan', {
    source_plan_id: sourcePlanId,
    new_trainer_auth_uid: claims.sub,
    new_name: newName,
  });

  if (error) return { error: 'Failed to duplicate plan.' };
  return { planId: data as string };
}
```

### Pattern 3: Plan Assignment with Weight Pre-Fill

**What:** At assignment time, query the trainee's workout history (from future Phase 4 tables) for the last logged weight per exercise. For Phase 3, since no workout history exists yet (Phase 4 builds that), the review step pre-fills from the template's `target_weight_kg` values with a clear "No history available" message. The weight-from-history lookup is a Phase 4 concern — the UI must be designed to accept pre-fill data as a prop so Phase 4 can inject real history values.

```typescript
// Assignment review step: accept pre-fill map as prop
interface AssignPlanReviewProps {
  templateSchemas: SchemaWithExercises[];
  // Phase 3: always empty (no history yet). Phase 4 will populate this.
  exerciseHistory: Record<string, { lastWeight: number; lastDate: string } | null>;
  traineeId: string;
}
```

### Pattern 4: Per-Set Weight Toggle

**What:** Each exercise row has a toggle between "single weight" and "per-set weights". When per-set is active, the row expands to show N weight inputs (one per set). Data is stored as JSONB array in `per_set_weights`.

```typescript
// React state for a single exercise row's weight mode
const [perSetMode, setPerSetMode] = useState(
  exercise.perSetWeights !== null  // null = single weight mode
);

// When sets count changes in per-set mode, resize the weights array
function handleSetsChange(newSets: number) {
  if (perSetMode) {
    setWeights((prev) => {
      const copy = [...prev];
      while (copy.length < newSets) copy.push(copy[copy.length - 1] ?? 0);
      return copy.slice(0, newSets);
    });
  }
}
```

### Anti-Patterns to Avoid

- **Multiple sequential inserts for the deep-copy:** Doing 3+ separate inserts from a Server Action is NOT atomic. A network error or Supabase error after the first insert leaves orphan rows. Use an RPC function.
- **Storing slot ordinals as day names (Mon/Tue):** The UX decision is ordinal slots (Workout 1, Workout 2). Storing as day names creates unnecessary mapping logic and breaks the model.
- **Re-fetching template data after assignment:** The trainee's snapshot is independent — never re-derive it from the template. Store the snapshot, read the snapshot.
- **Applying `listeners` to the entire drag row:** Attach drag `listeners` only to the drag handle element — not the whole row. Otherwise, clicking number inputs to type a value triggers a drag, which is a serious UX regression for a mobile gym app.
- **Using DndContext outside 'use client' boundary:** dnd-kit is client-only. The schema editor page must be a Client Component or delegate drag state to a Client Component child.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop exercise reorder | Custom mouse/touch event handlers | @dnd-kit/sortable + useSortable | Touch events, keyboard accessibility, auto-scroll, transform animation — all handled |
| Atomic multi-table insert | Sequential Server Action inserts | Postgres RPC function | Race conditions, partial failure, orphan rows are all real risks |
| Sort order persistence | Storing sort index as floats and recalculating | Simple integer sort_order + bulk UPDATE on reorder | Float approach has precision drift; integer bulk update is O(n) and simple |
| Form state for sets/reps/weight | Custom state reducer | react-hook-form with field arrays (useFieldArray) | Per-exercise sub-forms with validation are complex; useFieldArray handles dynamic lists cleanly |

**Key insight:** The deep-copy pattern is the highest risk area. Doing it with multiple Server Action inserts (even with error rollback logic) is inferior to a Postgres function that runs atomically in a single transaction. Invest the effort in the RPC.

---

## Common Pitfalls

### Pitfall 1: Drag listeners bleeding into number inputs
**What goes wrong:** Attaching `{...listeners}` to the entire exercise row div means any click/tap on a number input (sets, reps, weight) initiates a drag.
**Why it happens:** dnd-kit's PointerSensor captures pointerdown on the entire element.
**How to avoid:** Attach `{...listeners}` ONLY to a dedicated drag-handle element (e.g., a `⠿` icon button). Use the `activationConstraint` on PointerSensor to require a minimum drag distance.
```typescript
useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
```
**Warning signs:** Tapping a number input in the schema editor immediately starts dragging the row.

### Pitfall 2: RLS on plans vs. assigned_plans confusion
**What goes wrong:** Writing RLS policies that allow trainees to SELECT their own `assigned_schemas`/`assigned_schema_exercises` rows is complex because those rows link back to `assigned_plans.trainee_auth_uid`. Forgetting to add policies means Phase 4 (trainee workout view) can't read the plan data.
**Why it happens:** RLS is configured per-table; join-based access must be explicitly granted.
**How to avoid:** Design RLS policies for ALL Phase 3 tables upfront with Phase 4 access in mind:
  - Trainer: SELECT/INSERT/UPDATE/DELETE own plan templates and own assigned plans
  - Trainee: SELECT only their own `assigned_plans`, `assigned_schemas`, `assigned_schema_exercises`
**Warning signs:** Phase 4 trainee workout view gets empty results despite data existing.

### Pitfall 3: NavHeader tab active state for nested routes
**What goes wrong:** Adding `/trainer/plans` and `/trainer/trainees` tabs where `/trainer` also exists. `pathname.startsWith('/trainer')` matches ALL trainer routes, making the wrong tab appear active.
**Why it happens:** The current NavHeader uses `pathname.startsWith(href)` — `/trainer` as an href would match `/trainer/plans`.
**How to avoid:** The existing Trainees tab should link to `/trainer` (the root) but use exact match `pathname === '/trainer' || pathname.startsWith('/trainer/trainees')`. Plans tab links to `/trainer/plans` with `pathname.startsWith('/trainer/plans')`. Exercise Library tab links to `/trainer/exercises` (already correct).
**Warning signs:** Two tabs highlighted simultaneously.

### Pitfall 4: week_count used to generate rendered weeks vs. stored weekly template
**What goes wrong:** Treating `week_count` as a driver for N separate schema copies in the database. There is only ONE set of schemas — the weekly template. `week_count` is display metadata only (for the plan card summary and to tell Phase 4 when the plan expires).
**Why it happens:** Confusing the display model (show "Week 1", "Week 2" tabs) with the data model (only one set of schemas per plan).
**How to avoid:** `week_count` lives on `plans` table only. The schema editor shows week tabs generated from `Array.from({length: week_count})` — purely UI. All tabs display the same set of schemas (they are read-only repeated views).
**Warning signs:** Database has week_count * workouts_per_week schema rows for a single plan template.

### Pitfall 5: Assignment while active plan exists — silent overwrite
**What goes wrong:** If the assignment flow doesn't check for an existing active plan, the trainer can accidentally replace a live plan.
**Why it happens:** No guard in the Server Action.
**How to avoid:** In `assignPlan` Server Action, check if trainee has a plan with status `active` or `pending`. If yes, set new assignment to `pending` with a clear UI message: "Trainee has an active plan — this will start when their current plan ends."
**Warning signs:** Trainee's active plan silently changes.

---

## Code Examples

Verified patterns from official sources:

### Supabase RPC Call (official docs)
```typescript
// Source: https://supabase.com/docs/reference/javascript/rpc
const { data, error } = await supabase.rpc('duplicate_plan', {
  source_plan_id: '550e8400-e29b-41d4-a716-446655440000',
  new_trainer_auth_uid: claims.sub,
  new_name: 'Copy of 8-Week Hypertrophy',
});
```

### dnd-kit Minimal Sortable List (official docs)
```typescript
// Source: https://dndkit.com/presets/sortable
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// In onDragEnd:
function handleDragEnd(event) {
  const { active, over } = event;
  if (active.id !== over.id) {
    setItems((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }
}
```

### CSS Transform for useSortable (official docs)
```typescript
// Source: https://dndkit.com/presets/sortable
import { CSS } from '@dnd-kit/utilities';
const { transform, transition, setNodeRef } = useSortable({ id });
const style = { transform: CSS.Transform.toString(transform), transition };
return <div ref={setNodeRef} style={style} />;
```

### Server Action Pattern (project convention — exercises/actions.ts)
```typescript
'use server';
export async function createPlan(
  data: PlanFormData
): Promise<{ planId: string } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };
  // ... insert, check error, revalidatePath
}
```

### Existing NavHeader Extension Pattern (project convention)
```typescript
// Current navLinks in NavHeader.tsx — extend this array:
const navLinks = [
  { href: '/trainer', label: 'Trainees', exact: true },
  { href: '/trainer/plans', label: 'Plans' },
  { href: '/trainer/exercises', label: 'Exercise Library' },
];
// Active logic: exact match for /trainer, startsWith for others
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | ~2022 | react-beautiful-dnd unmaintained; dnd-kit is the community standard |
| Supabase Edge Functions for transactions | Postgres RPC (SECURITY DEFINER function) | Always preferred | RPC runs in DB transaction natively; no cold-start latency |
| Client-side sort_order floats (e.g., between 1.5) | Integer sort_order + full re-index on reorder | N/A | Float drift is a real bug after many reorders; integer bulk update is simpler |

**Deprecated/outdated:**
- react-beautiful-dnd: Last release 2022, React 18+ support broken, no React 19 support. Do not use.
- Supabase `supabase.from().insert()` chained for atomic operations: supabase-js v2 has no transaction support. Use RPC.

---

## Open Questions

1. **Weight history pre-fill at assignment time**
   - What we know: The user decision specifies pre-fill from "last logged weight for each exercise from any previous plan"
   - What's unclear: The `workout_sessions`/`workout_logs` tables don't exist yet (Phase 4). Phase 3 must design the `assigned_plans` assignment flow so the review step CAN accept pre-fill data, but since no history exists yet it will show template target weights (or "No history").
   - Recommendation: Design `AssignPlanModal` to accept an `exerciseHistory` prop of type `Record<exerciseId, { lastWeight: number } | null>`. In Phase 3, pass all-null. Phase 4 will populate this. Add a comment in the component indicating this is the Phase 4 injection point.

2. **Trainee "Plan updated by trainer" notification mechanism**
   - What we know: The user decision specifies a "subtle badge/notification" on the trainee's view.
   - What's unclear: Phase 3 is trainer-only; the trainee plan view is Phase 4. The badge must be readable by the trainee in Phase 4.
   - Recommendation: Add `plan_updated_at TIMESTAMPTZ` to `assigned_plans`. Update this timestamp whenever a trainer edits an assigned plan. Phase 4 reads it to show the badge if `plan_updated_at` is newer than the trainee's last session acknowledgement.

3. **assigned_plans RPC vs. separate assign action**
   - What we know: Assignment creates a per-trainee snapshot AND checks for existing active plan.
   - What's unclear: Whether to use RPC for assignment (complex logic) or a Server Action with multiple sequential awaits.
   - Recommendation: Use RPC for the assignment deep-copy. The sequential operations are: copy plan -> copy schemas -> copy exercises -> insert assigned_plan record. This is 4+ inserts that must be atomic. RPC is the correct tool.

---

## Sources

### Primary (HIGH confidence)
- https://dndkit.com/presets/sortable — Official @dnd-kit docs: useSortable hook API, SortableContext, arrayMove
- https://supabase.com/docs/reference/javascript/rpc — Official Supabase JS client RPC call syntax
- Project codebase: `src/lib/db/schema.ts`, `src/lib/db/migrations/`, `src/app/(trainer)/trainer/` — Existing patterns verified by reading source

### Secondary (MEDIUM confidence)
- npm registry (`npm show @dnd-kit/core version`, `npm show @dnd-kit/sortable peerDependencies`) — Version numbers and React compatibility verified via npm CLI
- https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html — Supabase-js lacks transaction support; RPC is the correct path

### Tertiary (LOW confidence)
- WebSearch results on PostgreSQL deep-copy patterns — General pattern confirmed (atomicity via stored function), but specific Postgres syntax verified against PostgreSQL docs knowledge

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm CLI; React 19 peer dep compatibility confirmed (`>=16.8.0`)
- Architecture: HIGH — data model derived from locked user decisions; project patterns read from source
- Drag-and-drop pattern: HIGH — verified against official dnd-kit docs
- RPC pattern: HIGH — verified against official Supabase JS docs
- Pitfalls: MEDIUM — some from codebase analysis, some from known React/Supabase patterns

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (30 days — stable stack; dnd-kit and Supabase JS are not fast-moving)
