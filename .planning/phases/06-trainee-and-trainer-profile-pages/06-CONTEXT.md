# Phase 6: Trainee and Trainer Profile Pages — Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers four distinct capabilities:
1. **Own profile / settings** — both trainers and trainees can edit their name; avatar shown via Gravatar (email-based, no upload); trainer has a bio field; trainee has goals + physical stats fields
2. **Trainee profile enriched (trainer view)** — trainer notes (private), trainee goals (read-only), physical stats (read-only) visible on `/trainer/trainees/[traineeId]`
3. **Compliance stats on trainer roster** — trainer home cards show last session date + sessions completed this week per trainee
4. **Trainee's view of their trainer** — a simple trainer card on the trainee side showing trainer name, email, and bio

</domain>

<decisions>
## Implementation Decisions

### Avatar — Gravatar, auto from email
- Fetch Gravatar using MD5 hash of the user's email (lowercase, trimmed)
- URL pattern: `https://www.gravatar.com/avatar/{hash}?s=80&d=mp`
- `d=mp` gives a generic silhouette fallback if no Gravatar is set — sufficient, no initials fallback needed in code
- No settings UI needed in the app — user sets avatar at gravatar.com externally
- Avatar appears in the nav header (top-right area) for both trainer and trainee, replacing the plain "Sign out" button layout — avatar click navigates to `/trainer/profile` or `/trainee/profile`; sign out moves inside the profile page or as a dropdown

### Navigation — avatar in header
- `TraineeNavHeader` and trainer's `NavHeader` both gain a Gravatar avatar in the top-right (desktop and mobile)
- Tapping the avatar navigates to the profile page (`/trainer/profile` or `/trainee/profile`)
- On mobile: avatar appears in the header row; tapping opens the sidebar (same as hamburger) OR navigates directly to profile — planner to decide minimal-change approach
- Sign out button stays accessible — either on the profile page or as a small dropdown under the avatar

### Own profile page — what's editable
**Trainer** (`/trainer/profile`):
- Editable: name, bio (freeform text, a few sentences max)
- Non-editable (displayed): email
- Avatar shown via Gravatar from their email (display only, no upload)

**Trainee** (`/trainee/profile`):
- Editable: name, goals (freeform text), height (cm), weight (kg), date of birth
- Non-editable (displayed): email
- Avatar shown via Gravatar from their email (display only, no upload)

### Physical stats — trainee-owned
- Trainee enters their own height, weight (kg), and date of birth on their profile page
- Trainer sees these read-only on the trainee detail page (`/trainer/trainees/[traineeId]`)
- All fields optional — show "—" if not set

### Trainee goals — trainee-owned, trainer-visible
- Trainee writes freeform goals text on their profile page (e.g. "lose 10kg by summer, improve squat")
- Trainer sees it read-only on the trainee detail page
- Optional field — show "No goals set" if empty

### Trainer notes — private, trainer-only
- Trainer writes private notes about each trainee (e.g. "bad left knee, avoid heavy squats")
- Stored per trainer-trainee pair (not visible to trainee)
- Editable inline on the trainee detail page — no separate route needed
- Storage: add a `notes` column to `trainer_trainee_connections` table (simplest approach, no new table)

### Trainee's view of their trainer
- A "My Trainer" section or card on the trainee's profile page (or a separate `/trainee/trainer` page — planner to decide based on minimal-change)
- Shows: trainer's Gravatar avatar, name, email, bio
- Read-only — trainee cannot edit any trainer info
- Only shown if the trainee has an active trainer connection

### Compliance stats on trainer home cards
- Each trainee card on `/trainer` gains two stats:
  - **Last session**: date of most recent completed workout session (e.g. "Last workout: Mar 14"), or "No sessions yet"
  - **This week**: count of completed sessions in the current ISO week (e.g. "2 this week")
- Stats fetched server-side on the trainer home page — batch query across all connected trainees, not N+1
- Current plan name/status already shown — compliance stats appear below it

### Schema changes required
```sql
-- trainers table: add bio
ALTER TABLE trainers ADD COLUMN bio text;

-- users table: add physical stats + goals
ALTER TABLE users ADD COLUMN goals text;
ALTER TABLE users ADD COLUMN height_cm integer;
ALTER TABLE users ADD COLUMN weight_kg numeric(5,2);
ALTER TABLE users ADD COLUMN date_of_birth date;

-- trainer_trainee_connections: add private trainer notes
ALTER TABLE trainer_trainee_connections ADD COLUMN trainer_notes text;
```

### What's already built (do not rebuild)
- Trainer home page (`/trainer`) — trainee cards exist, compliance stats are additive
- Trainee detail page (`/trainer/trainees/[traineeId]`) — plans + exercises tabs exist; trainer notes + trainee stats are additive to the existing page
- `TraineeNavHeader` and trainer `NavHeader` — avatar slot is additive to the header
- Gravatar is fetched client-side (or server-side) via a simple URL, no library needed

### Claude's Discretion
- Whether sign out is a dropdown under the avatar or stays on the profile page
- Exact layout of trainer notes on the trainee detail page (inline edit or edit button → form)
- Whether "My Trainer" card is part of the trainee profile page or a tab
- Loading/skeleton state for Gravatar images
- How age is derived and shown from date_of_birth (calculate on render)

</decisions>

<specifics>
## Specific Ideas

- Gravatar `d=mp` (mystery person silhouette) is the right fallback — clean and recognisable, no initials logic needed
- Trainer notes should feel like a sticky note — editable textarea, autosave or explicit Save button
- Compliance stats: batch the session query using `.in('trainee_auth_uid', traineeIds)` to avoid N+1
- Physical stats on the trainee detail page: a compact row of chips (e.g. "175 cm · 82 kg · Age 29") beneath the trainee name
- The trainee profile page and trainer profile page are the natural place for "destructive" account actions in future (delete account) — but that's out of scope for this phase

</specifics>

<deferred>
## Deferred Ideas

- **Email editing** — requires Supabase re-verification flow; not in this phase
- **Custom avatar upload** — requires storage bucket; Gravatar covers the use case for v1
- **Trainee compliance stats visible to trainee themselves** (streaks, total sessions) — could be on trainee profile; defer to a dedicated analytics phase
- **Trainer public profile page / shareable link** — trainee sees trainer info but no public URL in this phase
- **Account deletion** — important but its own flow; defer

</deferred>

---

*Phase: 06-trainee-and-trainer-profile-pages*
*Context gathered: 2026-03-18*
