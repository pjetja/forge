# Phase 8: Training Logs and Body Weight Progression Tracking - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 8 delivers three distinct but related capabilities:

1. **Workout completion enrichment** — The Finish Workout confirmation screen gains optional fields for smartwatch data (duration, kcal) and subjective difficulty (RPE 1–10). Shown below the existing summary, all optional, saved with the session.

2. **Chronological training log** — A flat feed of all past workout sessions across all plans on the trainee home page (new "Log" tab). Each row shows date, workout name, and any optional enrichment data that was filled in.

3. **Body weight tracking** — Trainee logs their body weight (kg) over time. Lives on a new "Body Weight" tab on the trainee home. Includes a log list as default, a line chart on demand (via button), and trainer-access permission flow.

Exercise progress charts (cross-plan exercise history) are already built in Phase 5. This phase does NOT rebuild those.

</domain>

<decisions>
## Implementation Decisions

### Workout completion enrichment fields
- Three optional fields added to the Finish Workout confirmation screen, displayed **below** the existing summary:
  - **Training time** (minutes) — numeric input
  - **Kcal burned** — numeric input
  - **Difficulty** (1–10 scale) — RPE rating
- All three fields are optional — trainee can skip any or all
- Fields appear only when the trainee taps "Finish Workout" — NOT during the session
- Fields are saved to `workout_sessions` table (requires a DB migration adding 3 new nullable columns)
- These fields feed into the training log display in the Log tab

### Training log (chronological session feed)
- New **"Log" tab** on the trainee home page — trainee home becomes 4 tabs: **Plans | Exercises | Log | Body Weight**
- Flat list, most recent sessions first, spanning ALL assigned plans (past and current)
- Each session row shows:
  - Date (e.g., "Mar 28")
  - Workout/schema name (e.g., "Push Day")
  - Optional enrichment fields — show only if filled in: duration (e.g., "52 min"), kcal, difficulty (e.g., "RPE 8")
- No calendar grid view — simple chronological list only
- Empty state when no sessions completed yet

### Body weight tracking — data model
- New DB table: `body_weight_logs` with columns: `id`, `trainee_auth_uid`, `logged_date` (date, not timestamp), `weight_kg` (numeric), `created_at`
- One entry per day (unique constraint on trainee_auth_uid + logged_date) — or allow multiple per day (Claude's Discretion based on simplicity)
- Weight in kg only — no body fat %, no notes field in v1
- Trainee can log or update their weight any time

### Body weight tracking — UI placement
- New **"Body Weight" tab** on the trainee home page (4th tab: Plans | Exercises | Log | Body Weight)
- **Default view**: Chronological list of weight entries (date + weight_kg), most recent first
- **"Show Chart" button**: Reveals a line chart of weight over time inline below the button (toggle)
- Chart uses the existing `DateRangeToggle` pattern: All time | Last 3 months | Last 1 month
- "Log weight" button or inline form at the top of the page to add today's entry
- Empty state when no entries exist yet

### Trainer access to body weight data
- Body weight data is **trainee-private by default** — trainer cannot see it without permission
- Trainer sees a **"Request body weight access"** button on the trainee profile page
- Requesting creates a pending access record — trainer UI shows "Access requested"
- Trainee sees an **in-app indicator** on their profile (badge or notification prompt) about the pending request
- Trainee can **Approve** or **Decline** the request from their profile page
- Once approved:
  - Trainer sees a **Body Weight** tab/section on the trainee's profile page (same list + chart as trainee view)
  - Trainer can revoke their own request; trainee can revoke granted access
- DB: needs a `body_weight_access_requests` table (or a permissions column on `trainer_trainee` connections) with status: `pending | approved | declined`

### Trainee home page tab layout (after Phase 8)
- **Plans** (existing, default tab) | **Exercises** (Phase 5) | **Log** (new, session feed) | **Body Weight** (new)
- Tab order is fixed as above
- Default tab remains Plans

### Claude's Discretion
- Whether body weight entries can be edited/deleted inline
- Exact 1–10 input style for difficulty (slider, stepper, or tap-to-select row of numbers)
- How in-app access request indicator appears (badge on profile nav, banner, or inline prompt)
- Loading/skeleton states for log tab and body weight tab
- Whether `body_weight_logs` allows multiple entries per day or enforces one-per-day
- Exact visual layout of the body weight log list (compact row vs. card)
- Chart empty state design

</decisions>

<specifics>
## Specific Ideas

- Enrichment fields (kcal, duration, RPE) are meant for smartwatch data the trainee reads off their watch — manual entry, not a direct integration
- Body weight section will be extended in future phases with additional metrics (body fat %, measurements) — design for easy extension but don't build it yet
- The DateRangeToggle from Phase 5 is the right chart pattern — reuse it exactly
- TabSwitcher shared component already exists — extend trainee home from 2 to 4 tabs using it

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements are fully captured in decisions above.

### Existing shared components (reuse)
- `src/components/DateRangeToggle.tsx` — Date range toggle for body weight chart (same All time / Last 3 months / Last 1 month pattern)
- `src/components/TabSwitcher.tsx` — Extend trainee home tabs from 2 to 4

### Existing schema and server actions to extend
- `src/lib/db/schema.ts` — `workoutSessions` and `sessionSets` definitions; new columns needed on `workoutSessions`
- `src/app/(trainee)/trainee/plans/[assignedPlanId]/workouts/[sessionId]/page.tsx` — Existing Finish Workout flow to be enhanced with optional enrichment fields
- `src/app/(trainee)/trainee/actions.ts` — Trainee server actions (aggregation queries live here)

### Prior phase patterns to follow
- `src/app/(trainee)/trainee/exercises/[exerciseId]/page.tsx` — Cross-plan exercise progress page (model for trainee body weight page structure)
- `src/app/(trainer)/trainer/trainees/[traineeId]/page.tsx` — Trainee profile page (where trainer-side body weight tab goes)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DateRangeToggle` (src/components/DateRangeToggle.tsx): All time / Last 3 months / Last 1 month toggle — reuse for body weight chart
- `TabSwitcher` (src/components/TabSwitcher.tsx): Already used for Plans | Exercises tabs — extend to 4 tabs
- `FilterDropdown` and `MultiFilterDropdown`: Available if filtering is needed on the log tab

### Established Patterns
- Server Actions for all DB writes (no API routes) — continue this pattern for body weight log entry
- Supabase admin client for cross-RLS queries (trainer side reading trainee data)
- `workout_sessions` table already has a `notes` column — enrichment fields follow the same nullable column pattern

### Integration Points
- Trainee home page (`src/app/(trainee)/trainee/page.tsx` or layout) — add Log and Body Weight tabs
- Finish Workout button / confirmation page — add optional enrichment fields below summary
- Trainee profile page (`/trainer/trainees/[traineeId]`) — add trainer-side Body Weight tab after access granted

</code_context>

<deferred>
## Deferred Ideas

- **Body fat % and additional body composition metrics** — user confirmed v1 is weight-only; extend in a future phase
- **Automatic smartwatch data sync** (HealthKit / Garmin API) — already out of scope per REQUIREMENTS.md; manual entry covers the use case for now
- **Email notification to trainee** for body weight access request — user chose in-app only; email can be added later
- **REST timer between sets** (TRACK-07) — v2, not related to this phase
- **Offline logging with sync** (TRACK-08) — v2 feature

</deferred>

---

*Phase: 08-training-logs-and-body-weight-progression-tracking*
*Context gathered: 2026-03-28*
