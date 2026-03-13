# Phase 4: Trainee Workout Logging - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

A trainee can open the app at the gym, see this week's assigned workouts, pick any one to do (any order), and log sets for each exercise with last week's results visible inline. Session is saved per set and explicitly finished. Trainer-side progress views and trainee analytics charts are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Navigation hierarchy
- 4-level drill-down:
  1. **Plans list** — current and past workout plans assigned to the trainee
  2. **Active plan** — this week's workouts (e.g., "Workout A", "Workout B"), each showing done/remaining status
  3. **Single workout view** — list of exercises with completion status, plus workout metadata (workout number, week number)
  4. **Exercise detail panel/page** — full set logging UI; back button returns to single workout view

### Week-based scheduling (not day-specific)
- Plans are "X workouts per week", not tied to specific days (no Monday/Tuesday assignment)
- Week = calendar week (Mon–Sun), auto-resets each week
- Trainee sees how many workouts are done vs remaining for the current week (e.g., "2 of 3 done this week")
- Workouts within the week can be done in any order — no prescribed day

### Exercise order during a session
- Exercises can be done in any order (gym reality: equipment may be occupied)
- Single workout view shows all exercises as a list — trainee taps whichever they want to do next
- No forced sequence

### Per-exercise layout (exercise detail page)
- Exercise name at the top
- List of sets from the plan, each row contains:
  - Reps: pre-filled from plan target, editable (trainee logs actual reps done)
  - Weight: editable
  - Last week result: "actual_reps × actual_weight + failure indicator" (e.g., "8×80kg 🔴" if failed)
  - Last week result shows "—" if no previous session exists for this exercise
  - Muscle failure checkbox per set
- "+Add set" button at the bottom of the set list — extra sets are tracked as regular sets (warm-ups are not logged)
- Below the set list: optional notes textarea (e.g., "used machine instead of free weights")

### Set logging interaction
- Trainee taps a checkmark/complete button per set to mark it done
- Reps and weight are pre-filled from plan but editable before completing
- Sets are auto-saved to DB immediately when completed (gym-proof: no data loss on crash)

### Session completion
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

</decisions>

<specifics>
## Specific Ideas

- Gym reality: exercises are NOT done in plan order — the UI must support jumping to any exercise freely
- Session persistence must be rock-solid: auto-save per set, never lose gym data
- Warm-up sets are consciously excluded — trainee only logs working sets

</specifics>

<deferred>
## Deferred Ideas

- **Per-exercise progress chart** (collapsed section at bottom of exercise detail showing historical weight/reps trend) — nice-to-have, defer to a Phase 4.1 UI polish or dedicated analytics phase
- **Trainee-side progress analytics** — charts, PRs over time, volume trends — separate phase after Phase 5

</deferred>

---

*Phase: 04-trainee-workout-logging*
*Context gathered: 2026-03-13*
