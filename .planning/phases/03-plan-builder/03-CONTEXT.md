# Phase 3: Plan Builder - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Trainers can create reusable multi-week workout plan templates, assign them to connected trainees, and edit live plans. The plan template defines a weekly structure (workout slots with schemas and exercises), which repeats across all weeks. Trainees receive assigned plans and explicitly start them when ready. Exercise Library and authentication are pre-built.

</domain>

<decisions>
## Implementation Decisions

### Navigation structure
- Bottom nav with 3 tabs: **Trainees** (default landing after login), **Plans**, **Exercise Library**
- Exercise Library tab was built in Phase 2; Phase 3 adds Trainees and Plans tabs

### Trainees page
- Card list of trainees: each card shows trainee Name + currently assigned plan
- Tap trainee → Trainee detail page: current plan, past plans, short trainee summary

### Plans page (template list)
- Each plan card shows: plan name + week count + assigned trainee count
- E.g., "8-Week Hypertrophy | 8 weeks | 3 trainees"

### Plan creation / weekly structure
- Trainer sets two values on creation: number of weeks (e.g., 4, 8, 12) and workouts per week (e.g., 3, 4, 5)
- Trainer designs a **single weekly template** — the same pattern repeats across all weeks
- No per-week overrides; all weeks follow the same template
- View: week tabs (one week at a time), each tab shows workout slots (Workout 1, Workout 2, etc.) — not calendar days (Mon/Tue)
- Trainer assigns a schema to each workout slot in the template (e.g., Workout 1 = Push Day)

### Schema editor
- Tapping a workout slot (schema) opens a **dedicated schema editor page**
- Exercise added via search/browse exercise library modal (tap "+ Add Exercise")
- Each exercise row shows inline number inputs: sets | reps | target weight
- Trainer can toggle per-exercise between **single weight for all sets** OR **per-set weights**
  - Per-set mode: row expands to show each set as a sub-row with its own weight input
- Exercises can be reordered via drag handles on each row

### Plan assignment model
- Plans are **reusable templates** — created generically, assigned to trainees afterward
- Assignment creates a **per-trainee copy** (snapshot); editing the template does not affect existing assigned plans
- At assignment time: a **review & edit step** shows all exercises pre-filled with target weights from the trainee's history (last logged weight for each exercise from any previous plan)
- Trainer can adjust any weight in this review step before confirming
- Trainer also sees the trainee's last progress context for each exercise inline in this step

### Trainee plan lifecycle
- A trainee can have only **one active plan at a time**
- If a new plan is assigned while one is active: new plan remains inactive/pending until the current plan is finished or terminated
- **Trainee explicitly starts the plan**: they see the assigned plan in a "pending" state and tap "Start Plan" to activate it (Week 1 begins from that moment)

### Editing live plans (assigned plans)
- Trainer edits the per-trainee assigned plan copy (not the template)
- Changes are **immediately live** — no draft/publish step
- Trainee sees a subtle badge/notification: "Plan updated by trainer"
- Editing the template is forward-only: only future assignments use the updated template; existing assigned copies are unaffected

### Claude's Discretion
- Loading states, empty states (no plans yet, no trainees yet)
- Exact plan creation form layout
- How "terminate current plan" is surfaced to the trainee
- Design of the trainee detail page summary section

</decisions>

<specifics>
## Specific Ideas

- The Trainees page is the trainer's home screen (default after login) — the app is trainer-centric
- Weight pre-fill at assignment time comes from the trainee's actual workout history (last logged weight per exercise from previous plans/sessions)
- Workout slots use ordinal labels ("Workout 1", "Workout 2") not day names — trainee decides which days they train

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 3 scope

</deferred>

---

*Phase: 03-plan-builder*
*Context gathered: 2026-03-11*
