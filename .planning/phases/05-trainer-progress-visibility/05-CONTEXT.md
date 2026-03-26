# Phase 5: Trainer Progress Visibility — Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Trainers can review each trainee's workout history to monitor progress, and trainees can browse their own exercise progress across all plans. This phase delivers:
1. A trainer can see all their trainees with assigned plans (PROG-01) — largely already built
2. A trainer can view a trainee's full workout log and per-exercise progress over time (PROG-02) — partially built; the trainer-side Exercise tab is the primary new deliverable
3. A trainee can view their own exercise progress history across all plans via a new Exercises tab on their home page (added to scope during discuss-phase)

Volume trends, compliance analytics, and PR notifications are out of scope — that is v2.

</domain>

<decisions>
## Implementation Decisions

### What's already built (do not rebuild)
A significant amount of Phase 5 work was completed during prior phases:
- Trainer home page (`/trainer`) — shows all trainees with active/pending plan name and status (PROG-01 ✓)
- Trainee detail page (`/trainer/trainees/[traineeId]`) — shows current, pending, and past plans
- Plan detail page — sessions grouped by week; current week vs. past weeks; in-progress banner
- Session drill-down — exercise list with sets-logged/sets-required per exercise
- Exercise log in session — shows every set (reps, weight, failure flag)
- Exercise progress page (per-plan) — weight and reps charts across sessions

Plans must acknowledge these are done and test/verify them rather than rebuild.

### Trainee profile: two-tab layout
- Trainee detail page gains a tab switcher: **Plans** (existing content, unchanged) | **Exercises** (new)
- Default tab: Plans (preserves existing behaviour)
- URL can use a `?tab=exercises` query param for direct linking

### Exercise tab — exercise list
- Sorted by **most recently logged** (exercises the trainee is currently training appear first)
- Search bar + muscle group filter chips — same UX as the trainer's exercise library
- Each row shows:
  - Exercise name
  - Muscle group tag
  - Personal best (heaviest top-set weight ever logged for this exercise)
  - Last logged date (e.g., "Mar 14")
- Tapping a row navigates to the exercise progress page (cross-plan view)
- Empty state: "No exercises logged yet" when trainee hasn't completed any sessions

### Exercise progress page (cross-plan, trainer view)
- **Data scope**: All completed sessions for this trainee that include this exercise, across ALL assigned plans
- **Primary metric**: Top-set weight per session (the heaviest single set logged in that session)
- **Date range toggle**: All time | Last 3 months | Last 1 month (simple 3-option toggle at top of chart)
- **Entry points**:
  1. From the new Exercise tab on the trainee profile
  2. From the plan detail page's Exercises column (existing links already in place)
- The existing per-plan chart page at `/trainer/trainees/[traineeId]/plans/[assignedPlanId]/exercises/[exerciseId]` can be replaced or enhanced — planner to decide based on minimal-change approach

### Full workout log history scope
- Per-plan navigation is **sufficient** — trainer taps a past plan card on the trainee profile and drills in
- No flat cross-plan "all sessions" chronological list is needed
- Past plan cards on the trainee profile stay as-is (no session count additions)

### Trainer home page (no changes)
- Trainee cards keep their current design: name + active/upcoming plan label
- No compliance stats, no last-session date on the home page cards

### Trainee home page: two-tab layout
- Trainee home page (`/trainee`) gains a tab switcher: **Plans** (existing content, unchanged) | **Exercises** (new)
- Default tab: Plans (preserves existing behaviour)
- URL can use a `?tab=exercises` query param for direct linking

### Trainee Exercise tab — exercise list
- Identical design to the trainer-side exercise tab:
  - Sorted by most recently logged
  - Search bar + muscle group filter chips
  - Each row: exercise name + muscle group + personal best (heaviest top set ever) + last logged date
- Tapping a row navigates to the trainee's cross-plan exercise progress page
- Empty state: "No exercises logged yet" when no sessions completed

### Trainee exercise progress page (cross-plan)
- **Data scope**: All completed sessions for the logged-in trainee that include this exercise, across ALL their assigned plans
- **Identical design to trainer view**: top-set weight as primary metric; date range toggle (All time / Last 3 months / Last 1 month); start/finish/change summary cards
- **Entry points**:
  1. From the new Exercises tab on the trainee home page
  2. Existing plan-detail exercise links can remain or point to the new cross-plan page — planner to decide minimal-change approach
- The existing per-plan progress page (`/trainee/plans/[assignedPlanId]/exercises/[exerciseId]`) is per-plan scoped today; the new page will be at a route that doesn't require `assignedPlanId` (e.g., `/trainee/exercises/[exerciseId]`). The `exerciseId` here should be the base `exercise_id` (UUID from the `exercises` table), not `assigned_schema_exercise_id`

### Shared logic between trainer and trainee exercise views
- The exercise list aggregation query (all exercises a person has logged + personal best + last logged) is the same pattern for both sides — just scoped to different `trainee_auth_uid` values
- The progress chart component (`ProgressChart`) is already shared — reuse it
- Exercise names require the admin client (exercises table is trainer-owned via RLS) — already handled in the existing trainee progress page

### Claude's Discretion
- Exact tab switcher visual style (underline tabs vs. pill tabs)
- Loading/skeleton states for exercise list and chart
- How personal best is displayed when the trainee has no logged sets (show "—")
- Chart empty state design when no data exists for the selected date range

</decisions>

<specifics>
## Specific Ideas

- The exercise list on both Exercise tabs (trainer and trainee side) should feel like the trainer's own exercise library — familiar UX, just filtered to exercises that person has actually logged
- Trainer side: exercise tab is on the trainee profile page; trainee side: exercise tab is on their own home page
- Personal best is the maximum `actual_weight_kg` logged in any single set, across all plans
- Date range filter on the chart is a toggle (not a calendar picker) — keeps it fast to use on mobile

</specifics>

<deferred>
## Deferred Ideas

- **Trainee compliance stats on trainer home cards** (last session date, sessions-this-week) — not in Phase 5; revisit in Phase 6 profile pages or dedicated analytics phase
- **Cross-plan reps trend chart** — the current chart shows top-set weight; reps chart could be added later
- **Volume tracking** (total sets × reps × weight per session) — v2 analytics
- **Personal record alerts** — notify trainer when a trainee sets a PR — v2

</deferred>

---

*Phase: 05-trainer-progress-visibility*
*Context gathered: 2026-03-17*
*Scope extended: trainee-side exercise progress tab added during discuss-phase*
