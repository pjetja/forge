# Phase 2: Exercise Library - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Trainers build and maintain a reusable library of exercises (create, view, search, filter, edit, delete). Exercises feed into workout plans in Phase 3. Creating plans, assigning plans, and tracking workouts are separate phases. Tempo and progression mode are NOT part of this phase — they are set per-plan/trainee in Phase 3 (Plan Builder).

</domain>

<decisions>
## Implementation Decisions

### Exercise creation flow
- Modal/dialog to create a new exercise (designed to potentially expand to a full page if data complexity grows)
- **Required fields:** Name, Muscle group
- **Optional fields:** Description, Notes (coaching notes), Video URL (YouTube/social media demo)
- Video URL shows an embedded preview (thumbnail/embed), not just a clickable link
- After successful creation: modal closes and the new exercise appears immediately in the library
- Tempo and progression mode are NOT exercise attributes — moved to Phase 3 Plan Builder

### Library display
- Card grid layout (not table/list)
- Each card shows: Exercise name, Muscle group, video indicator (icon if video is attached)
- Clicking a card opens an exercise detail modal (not a separate page)
- Detail modal shows all fields: name, muscle group, description, notes, video embed
- Actions available: Edit (opens edit form in modal) + Delete

### Search & filter UX
- Search triggers on Enter / button press (not instant/live search)
- Filter UI: horizontal filter chips/pills above the grid
- Muscle group options (detailed, fixed list):
  Chest, Upper Back, Lats, Front Delts, Side Delts, Rear Delts, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Core
- Multi-select filtering: yes — trainer can select multiple muscle groups simultaneously (results show union)

### Empty state
- Empty library (new trainer): illustration + friendly message + "Add your first exercise" CTA button
- No search results: "No exercises found" message + clear search/filter button (no smart "add this" shortcut)

### Claude's Discretion
- Exact card dimensions, spacing, and typography
- Loading/skeleton states
- Delete confirmation behavior (confirm dialog vs inline)
- Grid column count on different screen sizes
- Modal animation/transition style

</decisions>

<specifics>
## Specific Ideas

- Exercise detail includes a video embed (not just a URL), so trainers can see the movement without leaving the app
- Muscle group filtering uses a detailed taxonomy (13 groups) rather than generic categories — important for coaches who care about precise targeting
- Multi-select filter chips so trainers can browse e.g. "Chest + Front Delts" together when programming push days

</specifics>

<deferred>
## Deferred Ideas

- **Favourites / star-marking exercises** — future phase (user requested but not in Phase 2 scope)
- **Bulk import from CSV or template** — future phase (considered for empty state, deferred)
- **Tempo on exercise** — moved to Phase 3 (Plan Builder): same exercise may use different tempo per trainee/plan
- **Progression mode on exercise** — moved to Phase 3 (Plan Builder): same exercise may use different progression per trainee/plan

</deferred>

---

*Phase: 02-exercise-library*
*Context gathered: 2026-03-11*
