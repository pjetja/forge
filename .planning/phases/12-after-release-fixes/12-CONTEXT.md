# Phase 12: After-Release Fixes — Context

**Gathered:** 2026-03-31  
**Completed:** 2026-04-01  
**Status:** ✅ Complete (all 6 plans + 2 post-phase bug-fixes committed)  
**Source:** Beta feedback gathered post-launch

<domain>
## Phase Boundary

Phase 12 addresses beta feedback with no scope creep into new features. All work subdivides into six sequential plans:

| Plan  | Title                                                               | Priority     | Status       |
| ----- | ------------------------------------------------------------------- | ------------ | ------------ |
| 12-01 | Progression mode parameters (RPE/RIR values + linear increment)     | MUST HAVE    | ✅ `02e4fb2` |
| 12-02 | Nav + UX fixes (log in nav, nav width, assign-plan discoverability) | MUST HAVE    | ✅ `717ebc6` |
| 12-03 | Trainer view: body weight tab + i18n audit                          | WOULD HAVE   | ✅ `0d3ca70` |
| 12-04 | FAQ usage flows for trainer and trainee                             | MUST HAVE    | ✅ `9d4b768` |
| 12-05 | Loading states + Gravatar docs                                      | WOULD HAVE   | ✅ `8d7df61` |
| 12-06 | Drag & drop on assigned schema editor                               | NICE TO HAVE | ✅ `c3e0593` |

</domain>

<requirements>

## Requirements (from beta feedback)

### MUST HAVE

- **FIX-01** (BLOCKED): FAQ /help page must include step-by-step usage flows for both trainer role and trainee role — what to do first, how to log a workout, etc.
- **FIX-02**: Progression mode values — when a schema exercise has `progression_mode = 'rpe'` or `'rir'`, trainer must be able to specify target RPE value (1–10) or target RIR (0–5); these are missing fields
- **FIX-03**: Workout log link in trainee top nav — currently log is only accessible as a tab on the home page; add a direct "Log" nav link
- **FIX-04**: _(Verify only)_ Workout log tab already shows kcal/duration/rpe badges — confirm this is visible and working; close if confirmed
- **FIX-05**: Nav content must align to same max-width as page content — both `NavHeader` and `TraineeNavHeader` inner rows lack `max-w-[1280px] mx-auto` wrapper; on wide screens nav items and content are misaligned
- **FIX-06**: "Assign Plan" to trainee is not obvious on the trainer's trainee-detail page — improve discoverability (the capability exists in `NextPlanSection` but is visually buried)
- **FIX-07**: RPE and RIR progression modes require configurable value fields — same as FIX-02 (these are the same gap, addressed together in Plan 12-01)

### WOULD HAVE

- **FIX-08**: Add Gravatar documentation — explain to users how to set a profile photo via gravatar.com (add to Profile page or FAQ)
- **FIX-09**: i18n audit — review Polish translation JSON files for obvious errors, untranslated keys, and wrong translations; fix identified issues
- **FIX-10**: Loading state improvements — add skeleton loaders / suspense boundaries on slow routes to improve perceived performance on Vercel free plan
- **FIX-11**: On trainer's trainee-detail page, "Body Weight" tab must always be visible (not only when access is approved); when not approved, show the access-request UI inside the tab
- **FIX-12**: Linear progression weekly increment — when `progression_mode = 'linear'`, trainer must be able to specify `weight_increment_per_week` (kg/week)

### NICE TO HAVE

- **FIX-13**: Drag & drop exercise reordering on the assigned plan schema editor (`/trainer/trainees/[id]/assigned-plans/[id]/edit`) — currently DnD works on the plan template editor but not on the assigned-plan editor

</requirements>

<codebase_state>

## Relevant Codebase Facts (verified 2026-03-31)

### Progression mode (FIX-02, FIX-07, FIX-12)

- `schema_exercises` has `progression_mode TEXT` and `tempo TEXT` added in migration 0006 — BUT these fields are **missing from Drizzle schema.ts** (type gap)
- `assigned_schema_exercises` same gap
- Neither table has `rpe_target`, `rir_target`, or `weight_increment_per_week` — these need a new migration (0012)
- `SchemaExerciseRow` (`src/app/(trainer)/trainer/_components/SchemaExerciseRow.tsx`) has only mode dropdown; no conditional value inputs
- `assign_plan()` RPC already copies `tempo` and `progression_mode`; needs updating to copy new fields too
- Trainee exercise session view does not show progression mode or target values

### Nav alignment (FIX-05)

- Both navs use `px-4` directly on the outer row divs — no `max-w-[1280px] mx-auto` inner wrapper
- Main content in layouts already uses `max-w-[1280px] mx-auto px-4`
- Fix: wrap logo row and nav links row in `<div className="max-w-[1280px] mx-auto px-4 ...">` and remove `px-4` from outer `div`

### Trainee nav (FIX-03)

- `TraineeNavHeader` navLinks: Plans (`/trainee`), Exercises (`/trainee/exercises`), Help (`/help`) — no log
- Workout log is at `/trainee?tab=log` (query param tab on home page)
- Fix: add Log link to navLinks with `isActive` using `useSearchParams()`

### Workout log display (FIX-04)

- Trainee home log tab already renders kcal/duration/rpe badges — CONFIRMED implemented. This item is likely "verify and close"

### Assign plan discoverability (FIX-06)

- `NextPlanSection` exists and has "Queue Plan" button + `PlanPicker` — capability exists
- Only shown when `activePlan || pendingPlans.length > 0` (correct)
- When trainee has active plan and 0 pending plans: NextPlanSection renders with `showPicker=true` — but the section heading "Next plan(s)" isn't obvious when there are no queued plans visible
- Fix: Add a clear "+ Assign Plan" button on the Plans tab header (always visible), and/or make the NextPlanSection heading more prominent

### Body weight tab (FIX-11)

- Trainer trainee-detail: body-weight tab only added to TabSwitcher when `bodyWeightAccess === 'approved'`
- `RequestBodyWeightAccessButton` is rendered in-page (exact location needs checking) when not approved
- Fix: Always add body-weight tab to TabSwitcher; move `RequestBodyWeightAccessButton` inside the tab content

### Next migration number

- Last migration: `0011_training_logs_body_weight.sql`
- Next migration: `0012_progression_targets.sql`

</codebase_state>

<decisions>
## Implementation Decisions

### Plan 12-04 — FAQ usage flows (was BLOCKED)

- **D-01: Location** — Usage flows live in a **new separate `/guide` route** (`src/app/guide/page.tsx`). The existing `/help` page keeps its Q&A structure. Link to `/guide` from the help page.
- **D-02: Format** — Numbered steps with a short description per step (no accordion, no expandable sections). Matches the minimal, scannable style of the rest of the app.
- **D-03: Screenshots** — Text only. No images or screenshot assets needed.
- **D-04: Trainer flow** — 4 steps:
  1. Create exercises in your Exercise Library
  2. Build a plan (name it, add weeks and schemas, add exercises to each schema)
  3. Assign the plan to a trainee (review and adjust weights per trainee)
  4. Monitor progress (Trainees tab → trainee profile → session history and progress charts)
- **D-05: Trainee flow** — 3 steps:
  1. Join via trainer's invite link
  2. Log a workout (open today's scheduled session, fill in actual reps/weight/sets, finish)
  3. View exercise progress (Exercises tab or completed plan → exercise progress charts)
- **D-06: Body weight** — Body weight tracking goes to **FAQ** as a new Q&A entry in the existing `/help` page (trainees section, new `q3`). Not in the guide.

</decisions>

<post_phase_fixes>

## Post-Phase Bug Fixes (2026-04-01)

Two bugs discovered after all plans were committed and STATE.md was marked complete.

### BUG-01: Assign plan review page missing RPE/RIR/linear inputs (commit `41ac3fe`)

**Symptom:** On `/trainer/plans/[planId]/assign/[traineeId]`, selecting RPE / RIR / linear in the `ProgressionDropdown` had no effect — no additional fields appeared.

**Root cause:** Plan 12-01 added the DB columns and `SchemaExerciseRow` inputs, but the assign-review flow (`AssignReviewForm.tsx`, `page.tsx`, `actions.ts`) was never updated to carry these three fields.

**Files changed:**

- `src/app/(trainer)/trainer/trainees/actions.ts` — `ExerciseOverride` type + `overridesJson` mapping extended with `rpeTarget`, `rirTarget`, `weightIncrementPerWeek`
- `src/app/(trainer)/trainer/plans/[planId]/assign/[traineeId]/page.tsx` — `ExerciseRow` interface + DB query + `.map()` updated
- `src/app/(trainer)/trainer/plans/[planId]/assign/[traineeId]/AssignReviewForm.tsx` — 3 new state vars, conditional RPE/RIR/linear inputs rendered after `ProgressionDropdown`, values passed in `handleAssign` overrides
- `src/app/(trainer)/trainer/_components/AssignPlanModal.tsx` — nulls added for 3 new required fields to satisfy updated type

### BUG-02: Exercise detail pages missing RPE/RIR/linear display; no linear auto-increment (commit `f93c787`)

**Symptom:** Trainer and trainee exercise detail pages showed no RPE / RIR / kg/week information. On the trainee side, the default weight for an unlogged set did not auto-increment for linear progression.

**Root cause:** Both detail pages fetched `progression_mode` but never fetched `rpe_target`, `rir_target`, or `weight_increment_per_week`.

**Files changed:**

- `src/app/(trainer)/trainer/trainees/[traineeId]/plans/[assignedPlanId]/exercises/[exerciseId]/page.tsx` — DB select extended; `· RPE n`, `· RIR n`, `· +n kg/week` appended to the sets/reps summary line
- `src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/exercises/[exerciseId]/page.tsx` — DB select + type extended; "Target RPE n" / "Target RIR n" / "+n kg/week" badge chips added to header; for unlogged sets with `progression_mode = 'linear'` the default weight is `lastWeekWeight + weight_increment_per_week` (rounded to nearest 0.25 kg)

</post_phase_fixes>
