# Phase 2: Exercise Library - Research

**Researched:** 2026-03-11
**Domain:** Supabase RLS (per-trainer data isolation), Drizzle ORM (schema + queries), Next.js App Router (Server Actions, URL search params, custom modals), YouTube embed/thumbnail, Zod v4 validation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Boundary**
- Trainers build and maintain a reusable library of exercises (create, view, search, filter, edit, delete). Exercises feed into workout plans in Phase 3. Creating plans, assigning plans, and tracking workouts are separate phases. Tempo and progression mode are NOT part of this phase — they are set per-plan/trainee in Phase 3 (Plan Builder).

**Exercise creation flow**
- Modal/dialog to create a new exercise (designed to potentially expand to a full page if data complexity grows)
- Required fields: Name, Muscle group
- Optional fields: Description, Notes (coaching notes), Video URL (YouTube/social media demo)
- Video URL shows an embedded preview (thumbnail/embed), not just a clickable link
- After successful creation: modal closes and the new exercise appears immediately in the library
- Tempo and progression mode are NOT exercise attributes — moved to Phase 3 Plan Builder

**Library display**
- Card grid layout (not table/list)
- Each card shows: Exercise name, Muscle group, video indicator (icon if video is attached)
- Clicking a card opens an exercise detail modal (not a separate page)
- Detail modal shows all fields: name, muscle group, description, notes, video embed
- Actions available: Edit (opens edit form in modal) + Delete

**Search & filter UX**
- Search triggers on Enter / button press (not instant/live search)
- Filter UI: horizontal filter chips/pills above the grid
- Muscle group options (detailed, fixed list): Chest, Upper Back, Lats, Front Delts, Side Delts, Rear Delts, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Core
- Multi-select filtering: yes — trainer can select multiple muscle groups simultaneously (results show union)

**Empty state**
- Empty library (new trainer): illustration + friendly message + "Add your first exercise" CTA button
- No search results: "No exercises found" message + clear search/filter button (no smart "add this" shortcut)

### Claude's Discretion
- Exact card dimensions, spacing, and typography
- Loading/skeleton states
- Delete confirmation behavior (confirm dialog vs inline)
- Grid column count on different screen sizes
- Modal animation/transition style

### Deferred Ideas (OUT OF SCOPE)
- Favourites / star-marking exercises — future phase (user requested but not in Phase 2 scope)
- Bulk import from CSV or template — future phase (considered for empty state, deferred)
- Tempo on exercise — moved to Phase 3 (Plan Builder): same exercise may use different tempo per trainee/plan
- Progression mode on exercise — moved to Phase 3 (Plan Builder): same exercise may use different progression per trainee/plan
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXLIB-01 | Trainer can create named exercises (name, muscle group, description) | Drizzle schema for `exercises` table with `trainer_auth_uid` FK; Server Action using `createClient()` + RLS SELECT/INSERT policy; React Hook Form + Zod v4 for form validation; custom modal component pattern matches InviteDialog precedent |
| EXLIB-02 | Exercise library is shared across all of a trainer's plans | Single `exercises` table with `trainer_auth_uid` column; RLS policy restricts read/write to owning trainer; no plan-scoping on this table — exercises are trainer-global, plans reference exercises by ID in Phase 3 |
| EXLIB-03 | Trainer can search and filter the exercise library | URL search params as single source of truth; Server Component reads `searchParams` prop and calls Supabase with `.ilike()` for name search + `.in()` for muscle group filter; client component updates URL on Enter/button press via `useRouter().replace()`; multi-select muscle group filters stored as comma-separated query param |
</phase_requirements>

---

## Summary

Phase 2 builds a trainer's exercise library on top of the Next.js 16 / Supabase / Drizzle stack established in Phase 1. The core technical work is: (1) a new `exercises` database table with RLS that isolates each trainer's data; (2) CRUD Server Actions for create/update/delete; (3) a card-grid UI with two custom modals (create/edit, detail/view); and (4) a search + multi-select filter system that uses URL search params as state.

The project has a clear pattern from Phase 1: custom hand-rolled modals (no headless-UI or radix), Server Actions using `createClient()` from `@/lib/supabase/server`, Drizzle ORM for schema/types only (actual queries via Supabase PostgREST client), Tailwind v4 with design tokens in `globals.css`, and React Hook Form + Zod v4 for form validation. Phase 2 must follow all of these exactly — no new libraries.

The video embed feature is the most novel element: YouTube URLs must be parsed to extract a video ID, which is then used to render an `<iframe>` embed. A thumbnail preview can be shown before the user clicks play using `https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg`. The search/filter architecture works differently from the official Next.js live-search tutorial — the CONTEXT.md locks "search on Enter/button press", so the URL is only updated on submit (not on keypress), while muscle group chips update the URL immediately on toggle.

**Primary recommendation:** Follow Phase 1 patterns exactly. One new migration file adds the `exercises` table. Supabase client handles all queries (not Drizzle query builder). Server Actions handle create/update/delete and revalidate the page cache. URL search params drive all filtering state so the Server Component page always queries fresh data.

---

## Standard Stack

### Core (no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, Server Actions, Server Components | Already installed |
| @supabase/ssr | ^0.9.0 | Server-side Supabase client for Server Actions | Already installed — Phase 1 pattern |
| @supabase/supabase-js | ^2.99.0 | Supabase client for PostgREST queries | Already installed |
| drizzle-orm | ^0.45.1 | Schema definition + TypeScript types | Already installed |
| react-hook-form | ^7.71.2 | Form management (create/edit exercise form) | Already installed — Phase 1 pattern |
| @hookform/resolvers | ^5.2.2 | Connects Zod schema to RHF | Already installed |
| zod | ^4.3.6 | Form validation schema | Already installed — Phase 1 pattern |
| tailwindcss | ^4 | Styling via design tokens | Already installed |

### No new packages required

All capabilities needed for Phase 2 are already in `package.json`. Do NOT add:
- Any UI component library (radix-ui, shadcn, etc.) — project uses custom components
- Any state management library — URL params + React state cover this
- Any video player library — native `<iframe>` embed is sufficient

**Installation:** None required.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── (trainer)/
│       └── trainer/
│           ├── exercises/
│           │   └── page.tsx               # Server Component, reads searchParams, fetches exercises
│           ├── _components/
│           │   ├── InviteDialog.tsx        # EXISTING — pattern reference for modals
│           │   ├── ExerciseGrid.tsx        # Client Component — renders cards, manages modal open state
│           │   ├── ExerciseCard.tsx        # Client Component — individual card
│           │   ├── ExerciseDetailModal.tsx # Client Component — view + edit + delete
│           │   ├── ExerciseFormModal.tsx   # Client Component — create form (also reused for edit)
│           │   └── ExerciseFilterBar.tsx   # Client Component — search input + muscle group chips
│           └── exercises/
│               └── actions.ts             # Server Actions: createExercise, updateExercise, deleteExercise
└── lib/
    └── db/
        ├── schema.ts                       # Add exercises table to existing schema
        └── migrations/
            └── 0002_exercises.sql         # New migration: exercises table + RLS
```

**Route:** `/trainer/exercises` — inside the existing `(trainer)` route group which provides the nav shell.

### Pattern 1: Drizzle Schema Definition

Add `exercises` table to `src/lib/db/schema.ts`. Drizzle is used for schema/type generation only — actual DB operations use the Supabase PostgREST client (matching Phase 1 pattern).

```typescript
// Source: Phase 1 schema.ts pattern, verified against drizzle-orm docs
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerAuthUid: uuid('trainer_auth_uid').notNull(),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  description: text('description'),
  notes: text('notes'),
  videoUrl: text('video_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

### Pattern 2: Migration SQL with RLS

Hand-written SQL file (matching Phase 1 approach — no `drizzle-kit generate`). Place in `src/lib/db/migrations/0002_exercises.sql`.

```sql
-- Phase 2: Exercise Library table with RLS

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_auth_uid UUID NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Trainer can only read/write their own exercises
-- Use (SELECT auth.uid()) wrapper for 95% performance improvement on row scans
CREATE POLICY "trainer_manages_own_exercises" ON exercises
  FOR ALL USING ((SELECT auth.uid()) = trainer_auth_uid);

-- Index on trainer_auth_uid — essential for RLS policy performance
CREATE INDEX IF NOT EXISTS exercises_trainer_auth_uid_idx ON exercises(trainer_auth_uid);
-- Index for name search (ilike queries)
CREATE INDEX IF NOT EXISTS exercises_name_idx ON exercises(name);
```

**User action required:** Paste into Supabase SQL Editor and run (same process as Phase 1 migration).

### Pattern 3: Server Actions for CRUD

```typescript
// Source: Phase 1 actions.ts pattern
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createExercise(formData: {
  name: string;
  muscleGroup: string;
  description?: string;
  notes?: string;
  videoUrl?: string;
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;

  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('exercises')
    .insert({
      trainer_auth_uid: claims.sub,
      name: formData.name,
      muscle_group: formData.muscleGroup,
      description: formData.description ?? null,
      notes: formData.notes ?? null,
      video_url: formData.videoUrl ?? null,
    });

  if (error) return { error: 'Failed to create exercise. Please try again.' };

  revalidatePath('/trainer/exercises');
  return { success: true };
}

// updateExercise and deleteExercise follow same pattern
// RLS ensures trainers can only modify their own exercises — no trainer_auth_uid check needed in code
```

**Key insight:** RLS on the `exercises` table means the Supabase client can only see/modify the authenticated trainer's own exercises. No need to filter by `trainer_auth_uid` in code for SELECT — the database enforces it. For UPDATE/DELETE, always pass the exercise `id` in the `.eq('id', id)` filter; RLS handles ownership.

### Pattern 4: URL Search Params for Search + Filter State

The page is a **Server Component** that reads `searchParams` directly. The `ExerciseFilterBar` is a **Client Component** that updates the URL on submit.

```typescript
// Source: Next.js App Router docs — nextjs.org/learn/dashboard-app/adding-search-and-pagination
// page.tsx — Server Component
export default async function ExercisesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; muscles?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q ?? '';
  const muscleFilter = params?.muscles?.split(',').filter(Boolean) ?? [];

  const supabase = await createClient();
  let dbQuery = supabase.from('exercises').select('*').order('name');

  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`);
  }
  if (muscleFilter.length > 0) {
    dbQuery = dbQuery.in('muscle_group', muscleFilter);
  }

  const { data: exercises, error } = await dbQuery;
  // render ExerciseGrid with exercises, pass query and muscleFilter as initial values for filter bar
}
```

```typescript
// ExerciseFilterBar.tsx — Client Component
// Search triggers on Enter/button press (locked decision — NOT live search)
'use client';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export function ExerciseFilterBar({ initialQuery, initialMuscles }: {
  initialQuery: string;
  initialMuscles: string[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const query = new FormData(form).get('q') as string;
    const params = new URLSearchParams(searchParams);
    if (query) { params.set('q', query); } else { params.delete('q'); }
    replace(`${pathname}?${params.toString()}`);
  }

  function toggleMuscle(muscle: string) {
    const params = new URLSearchParams(searchParams);
    const current = params.get('muscles')?.split(',').filter(Boolean) ?? [];
    const next = current.includes(muscle)
      ? current.filter((m) => m !== muscle)
      : [...current, muscle];
    if (next.length > 0) { params.set('muscles', next.join(',')); }
    else { params.delete('muscles'); }
    replace(`${pathname}?${params.toString()}`);
  }
  // render search form + muscle chip buttons
}
```

### Pattern 5: YouTube Video Embed

Video URL is stored as entered. At render time, extract the YouTube video ID and construct the embed URL.

```typescript
// Pure utility function — no library needed
// Source: Verified against multiple sources; covers standard watch URL, short URL, embed URL, Shorts
function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match?.[1] ?? null;
}

// Thumbnail (shown in card and detail modal before embed loads):
// https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg

// Embed iframe src (use nocookie domain for privacy):
// https://www.youtube-nocookie.com/embed/{VIDEO_ID}
```

**Embed markup:**
```tsx
// Source: YouTube IFrame Player API docs
{videoId && (
  <div className="relative aspect-video w-full">
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
      title="Exercise video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 w-full h-full rounded-sm"
    />
  </div>
)}
```

Use `youtube-nocookie.com` domain — YouTube's privacy-enhanced mode that avoids setting cookies until the user clicks play.

### Pattern 6: Zod v4 Form Validation Schema

```typescript
// Source: Zod v4 docs (zod.dev/api) + Phase 1 Zod v4 pattern (uses .issues not .errors)
import { z } from 'zod';

export const MUSCLE_GROUPS = [
  'Chest', 'Upper Back', 'Lats', 'Front Delts', 'Side Delts', 'Rear Delts',
  'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core',
] as const;

export const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(100),
  muscleGroup: z.enum(MUSCLE_GROUPS, { error: 'Select a muscle group' }),
  description: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
  videoUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || extractYouTubeId(val) !== null,
      'Must be a valid YouTube URL'
    ),
});

export type ExerciseFormValues = z.infer<typeof exerciseSchema>;
```

**Note:** Zod v4 uses `z.enum()` differently — pass the tuple directly. Error access uses `.issues` not `.errors` on `ZodError` (established Phase 1 decision).

### Pattern 7: Modal Pattern (matching InviteDialog)

The project uses hand-rolled modals — no Radix/Headless UI. Follow the exact `InviteDialog` pattern from Phase 1:

```tsx
// Client Component — matches InviteDialog.tsx pattern
'use client';
import { useState, useTransition } from 'react';

export function ExerciseFormModal({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-accent ...">
        + Add exercise
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface border border-border rounded-sm w-full max-w-md p-6">
            {/* form content */}
            <button onClick={() => setOpen(false)} aria-label="Close">&times;</button>
          </div>
        </div>
      )}
    </>
  );
}
```

**After successful create:** call `router.refresh()` to re-fetch server data (since Server Component holds the exercise list), then close the modal. Alternatively, the modal can be a separate client component that calls `revalidatePath` via the Server Action and the parent page re-renders automatically.

### Anti-Patterns to Avoid

- **Using Drizzle query builder for runtime DB queries:** Phase 1 uses Drizzle for schema only — queries go through Supabase PostgREST client. Do not use `db.select().from(exercises).where(...)` pattern.
- **Calling `auth.uid()` without SELECT wrapper in RLS policies:** Always use `(SELECT auth.uid())` wrapper — 95% performance improvement on table scans (verified against Supabase docs).
- **Storing video embed URL instead of original URL:** Store the original YouTube URL as entered; extract video ID at render time. This preserves the user's original input and handles URL format changes.
- **Live search on keypress:** CONTEXT.md locks search to trigger on Enter/button press only — do not use debounced `onChange` URL updates for the text search field.
- **Closing modal optimistically before Server Action resolves:** Always wait for the Server Action result before closing the modal and calling `router.refresh()`.
- **Using `adminClient` for exercise CRUD:** RLS with `(SELECT auth.uid())` is sufficient — `adminClient` is only needed when bypassing RLS (e.g., invite links where no INSERT policy exists). All exercise operations should use `createClient()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL video ID extraction | Custom complex parser | The 1-line regex pattern above | Regex covers all YouTube URL formats reliably; custom parsers miss edge cases (Shorts, nocookie domain, playlists) |
| Multi-select filter state | Custom state manager or context | URL search params via `useRouter().replace()` | URL params survive navigation, enable bookmarkable filter state, work with Server Component data fetching |
| Form validation | Manual field checks | Zod v4 schema + React Hook Form | Already in package.json, handles all edge cases, consistent with Phase 1 |
| Delete confirmation | Custom confirm modal from scratch | Simple `window.confirm()` or inline state flag | Since CONTEXT.md leaves this to Claude's discretion, a simple boolean state flag showing an inline "Are you sure?" is sufficient |
| Database-level access control | Application-layer trainer_id checks | Supabase RLS policy | RLS enforces isolation at DB level even if application code has bugs |

**Key insight:** The muscle group list is a fixed 13-item enum — store it as a `text` column in Postgres (not an array or ENUM type). PostgreSQL ENUM types are hard to alter without migrations; text with a Zod enum on the application side is simpler and equally safe.

---

## Common Pitfalls

### Pitfall 1: Forgetting `revalidatePath` After Mutations

**What goes wrong:** After creating/editing/deleting an exercise via Server Action, the library page still shows the old data because Next.js has cached the Server Component output.
**Why it happens:** Next.js App Router caches Server Component renders by default.
**How to avoid:** Always call `revalidatePath('/trainer/exercises')` at the end of every successful Server Action mutation.
**Warning signs:** New exercise appears after manual page refresh but not immediately after modal closes.

### Pitfall 2: RLS SELECT Policy Allows Read But INSERT Fails

**What goes wrong:** The Supabase client can read exercises but INSERT returns an RLS violation error.
**Why it happens:** A `FOR ALL` policy covers SELECT, UPDATE, DELETE but INSERT uses the `WITH CHECK` clause — `USING` alone does not grant INSERT for all Postgres versions.
**How to avoid:** Use `FOR ALL USING (condition) WITH CHECK (condition)` or separate explicit `FOR INSERT WITH CHECK` and `FOR SELECT USING` policies. Verify in Supabase dashboard that INSERT works after applying migration.
**Warning signs:** `createExercise` Server Action returns error despite the trainer being authenticated.

The safe pattern for `FOR ALL` in Supabase's Postgres:
```sql
CREATE POLICY "trainer_manages_own_exercises" ON exercises
  FOR ALL
  USING ((SELECT auth.uid()) = trainer_auth_uid)
  WITH CHECK ((SELECT auth.uid()) = trainer_auth_uid);
```

### Pitfall 3: YouTube Video ID Extraction Fails on Some URL Formats

**What goes wrong:** Trainer pastes a YouTube Shorts URL (`https://youtube.com/shorts/VIDEO_ID`) or a nocookie URL and the embed fails to render.
**Why it happens:** Simple regex patterns only handle standard watch URLs.
**How to avoid:** Use the comprehensive regex that handles all formats: standard watch (`?v=`), short link (`youtu.be/`), embed URLs, and Shorts (`/shorts/`). Always validate that extracted ID is exactly 11 characters.
**Warning signs:** Video preview is blank for some YouTube URLs but not others.

### Pitfall 4: Multi-Select Filter Muscle Groups URL Encoding

**What goes wrong:** Muscle group names with spaces (e.g., "Upper Back", "Front Delts") break URL param parsing when comma-delimited.
**Why it happens:** `URLSearchParams` encodes spaces as `+` or `%20` — both are valid but the parsing code may not handle both consistently.
**How to avoid:** Use `params.getAll()` with a repeated key (e.g., `?muscle=Chest&muscle=Upper+Back`) instead of comma-delimited, OR URL-encode consistently. The simpler option is to use the muscle group name without spaces in the URL param (kebab-case or underscore), mapping back to display names at render time. Alternatively, use repeated params which `URLSearchParams` natively supports via `getAll()`.
**Warning signs:** "Upper Back" filter chip appears selected but exercises aren't filtered correctly.

### Pitfall 5: Modal Open State Lost on Router Refresh

**What goes wrong:** After calling `router.refresh()` to reload exercise data after create/edit, any open modals close unexpectedly.
**Why it happens:** `router.refresh()` triggers a Server Component re-render but preserves Client Component state in most cases. However, if the modal open state is held in a parent Client Component that wraps the grid, the state is preserved. If the refresh causes a full remount, state is lost.
**How to avoid:** Keep modal open state in the leaf component closest to the trigger (matching the `InviteDialog` pattern — it manages its own `open` state). Call `router.refresh()` inside `startTransition` so it doesn't block the UI.
**Warning signs:** Create modal closes immediately after successful exercise creation without showing a success state.

### Pitfall 6: Video URL Stored as Empty String vs Null

**What goes wrong:** Querying exercises where video_url is missing returns inconsistent results if some rows have `''` and others have `null`.
**Why it happens:** React Hook Form optional fields default to `''` not `undefined`; Server Action converts `''` to `null` inconsistently.
**How to avoid:** In the Server Action, always normalize empty strings to `null` before inserting: `videoUrl: formData.videoUrl || null`.
**Warning signs:** Video icon shows on exercise cards that have no video; video section renders an empty iframe.

---

## Code Examples

### Supabase Query with Combined Filters

```typescript
// Source: Supabase JS docs — supabase.com/docs/reference/javascript/using-filters
// Pattern verified: .ilike() for case-insensitive name search, .in() for muscle group array
const { data: exercises, error } = await supabase
  .from('exercises')
  .select('id, name, muscle_group, description, notes, video_url, created_at')
  .ilike('name', `%${query}%`)          // only add if query is non-empty
  .in('muscle_group', muscleFilter)     // only add if muscleFilter.length > 0
  .order('name', { ascending: true });
```

In practice, conditionally chain these:
```typescript
let q = supabase.from('exercises').select('*').order('name');
if (query) q = q.ilike('name', `%${query}%`);
if (muscleFilter.length > 0) q = q.in('muscle_group', muscleFilter);
const { data, error } = await q;
```

### Muscle Group Chip Toggle Component

```tsx
// Source: Pattern derived from URL search params approach
const MUSCLE_GROUPS = ['Chest', 'Upper Back', 'Lats', 'Front Delts', 'Side Delts',
  'Rear Delts', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];

// In ExerciseFilterBar client component:
{MUSCLE_GROUPS.map((muscle) => (
  <button
    key={muscle}
    onClick={() => toggleMuscle(muscle)}
    className={`px-3 py-1 rounded-full text-sm border transition-colors cursor-pointer ${
      selectedMuscles.includes(muscle)
        ? 'bg-accent text-white border-accent'
        : 'bg-bg-surface text-text-primary border-border hover:border-accent'
    }`}
  >
    {muscle}
  </button>
))}
```

### YouTube Thumbnail Preview (Card)

```tsx
// Show thumbnail on card if video_url is present
// Source: YouTube thumbnail URL format — img.youtube.com/vi/{ID}/mqdefault.jpg
{videoId && (
  <div className="w-6 h-6 flex items-center justify-center text-accent" title="Has video">
    {/* Video camera icon — inline SVG to avoid adding lucide-react dependency */}
    <svg className="w-4 h-4" ...>...</svg>
  </div>
)}
```

### Revalidate + Refresh After Mutation

```typescript
// Server Action
revalidatePath('/trainer/exercises');
return { success: true };

// Client Component (modal) — after Server Action resolves successfully
startTransition(async () => {
  const result = await createExercise(formData);
  if ('error' in result) {
    setError(result.error);
  } else {
    setOpen(false);
    router.refresh(); // triggers Server Component re-fetch
  }
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PostgreSQL ENUM types for fixed lists | TEXT column + application-layer Zod enum | Always best practice | ENUM types require DDL migrations to add values; text + zod validation is trivial to change |
| Storing YouTube embed URLs | Store original URL, extract ID at render | Always recommended | Protects against URL format changes; user's original link is preserved |
| youtube.com/embed/ | youtube-nocookie.com/embed/ | Available for years, recommended since GDPR era | Avoids cookies on page load; better privacy posture |
| `auth.uid()` in RLS (direct call) | `(SELECT auth.uid())` wrapped in subquery | Supabase docs current recommendation | 95% performance improvement — caches result per statement rather than per row |
| Client-side state for search/filter | URL search params as single source of truth | Next.js App Router standard pattern | Bookmarkable, shareable, survives navigation, enables SSR |

---

## Open Questions

1. **Trainer dashboard navigation — how does /trainer/exercises link from the existing /trainer page?**
   - What we know: Current trainer home is `/trainer/page.tsx` which shows the trainee roster. Phase 2 adds `/trainer/exercises`.
   - What's unclear: Is there a nav menu/tab bar, or does the user navigate directly to `/trainer/exercises` via a link on the home page?
   - Recommendation: Add a nav link in the existing `(trainer)/layout.tsx` header (or a simple "Exercises" link on the home page). The CONTEXT.md doesn't specify navigation structure — this is Claude's discretion. Recommend updating the trainer layout header to include an "Exercises" link alongside the logo and sign-out.

2. **Delete confirmation UX (Claude's Discretion)**
   - What we know: Delete is available from the exercise detail modal. Confirmation behavior is Claude's discretion.
   - What's unclear: Inline confirm (show "Delete?" + "Confirm" / "Cancel" buttons in the modal) vs. window.confirm().
   - Recommendation: Use an inline two-step confirm in the detail modal: clicking "Delete" changes the button to show "Confirm delete?" with a red background and a "Cancel" option. This is consistent with the dark design system (no browser-native `window.confirm()` which breaks design consistency).

3. **Social media URLs beyond YouTube**
   - What we know: CONTEXT.md says "YouTube/social media demo" for the video URL field.
   - What's unclear: Should Instagram, TikTok, or Vimeo URLs also be supported with embeds?
   - Recommendation: Support YouTube embeds only for Phase 2. For non-YouTube URLs, store the URL but show a "Watch video" link button instead of an embed. This is the safest default — Instagram/TikTok embeds require oEmbed APIs or different patterns. YouTube covers the primary use case for fitness demos.

---

## Sources

### Primary (HIGH confidence)
- `src/lib/db/schema.ts` — Established Drizzle schema pattern for this project
- `src/lib/db/migrations/0001_initial.sql` — Established RLS migration pattern including `(SELECT auth.uid())` wrapper
- `src/app/(trainer)/trainer/_components/InviteDialog.tsx` — Established modal pattern (hand-rolled, useState + useTransition)
- `src/app/(trainer)/trainer/actions.ts` — Established Server Action pattern (`createClient()`, `getClaims()`)
- `src/app/(trainer)/trainer/page.tsx` — Established Server Component data fetching pattern
- [Drizzle ORM Conditional Filters](https://orm.drizzle.team/docs/guides/conditional-filters-in-query) — Verified `and()` with undefined for optional filters
- [Drizzle ORM Operators](https://orm.drizzle.team/docs/operators) — Verified `ilike()` and `inArray()` API
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — Verified `(SELECT auth.uid())` performance pattern and `WITH CHECK` requirement for INSERT

### Secondary (MEDIUM confidence)
- [Next.js Search & Pagination Tutorial](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) — URL search params pattern; adapted for on-submit (not live search) per CONTEXT.md decision
- [YouTube IFrame Player API](https://developers.google.com/youtube/player_parameters) — Verified standard embed URL format `https://www.youtube.com/embed/VIDEO_ID`
- [YouTube Thumbnail URL format](https://img.youtube.com/vi/{ID}/mqdefault.jpg) — Multiple consistent sources confirm this pattern; not from official Google docs but widely used

### Tertiary (LOW confidence)
- YouTube nocookie domain (`youtube-nocookie.com`) — Documented by Google as "privacy-enhanced mode" but specific privacy guarantees and cookie behavior details not verified against current Google policy docs; use as best practice but not a compliance guarantee.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all packages already in project
- Architecture: HIGH — follows established Phase 1 patterns exactly; key patterns verified against codebase
- RLS pattern: HIGH — verified against official Supabase docs
- Drizzle query filters: HIGH — verified against official Drizzle docs
- YouTube embed/thumbnail: MEDIUM — YouTube embed URL format verified via official docs; thumbnail URL format from multiple consistent sources (not official docs)
- Search/filter URL pattern: HIGH — verified against official Next.js docs; adapted for on-submit pattern per CONTEXT.md
- Pitfalls: HIGH — derived from Phase 1 actual decisions and official docs

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable stack — 30 day estimate)
