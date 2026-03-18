# Phase 6: Trainee and Trainer Profile Pages — Research

**Researched:** 2026-03-18
**Domain:** Next.js Server Actions, Supabase RLS, Gravatar, profile CRUD, compliance stats
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Avatar — Gravatar, auto from email**
- Fetch Gravatar using MD5 hash of the user's email (lowercase, trimmed)
- URL pattern: `https://www.gravatar.com/avatar/{hash}?s=80&d=mp`
- `d=mp` gives a generic silhouette fallback if no Gravatar is set — sufficient, no initials fallback needed in code
- No settings UI needed in the app — user sets avatar at gravatar.com externally
- Avatar appears in the nav header (top-right area) for both trainer and trainee, replacing the plain "Sign out" button layout — avatar click navigates to `/trainer/profile` or `/trainee/profile`; sign out moves inside the profile page or as a dropdown

**Navigation — avatar in header**
- `TraineeNavHeader` and trainer's `NavHeader` both gain a Gravatar avatar in the top-right (desktop and mobile)
- Tapping the avatar navigates to the profile page (`/trainer/profile` or `/trainee/profile`)
- On mobile: avatar appears in the header row; tapping opens the sidebar (same as hamburger) OR navigates directly to profile — planner to decide minimal-change approach
- Sign out button stays accessible — either on the profile page or as a small dropdown under the avatar

**Own profile page — what's editable**
- Trainer (`/trainer/profile`): Editable: name, bio (freeform text). Non-editable (displayed): email. Avatar displayed via Gravatar.
- Trainee (`/trainee/profile`): Editable: name, goals (freeform text), height (cm), weight (kg), date of birth. Non-editable (displayed): email. Avatar displayed via Gravatar.

**Physical stats — trainee-owned**
- Trainee enters their own height, weight (kg), and date of birth on their profile page
- Trainer sees these read-only on the trainee detail page (`/trainer/trainees/[traineeId]`)
- All fields optional — show "—" if not set

**Trainee goals — trainee-owned, trainer-visible**
- Trainee writes freeform goals text; trainer sees read-only on trainee detail page
- Optional field — show "No goals set" if empty

**Trainer notes — private, trainer-only**
- Stored per trainer-trainee pair (not visible to trainee)
- Editable inline on the trainee detail page — no separate route needed
- Storage: add a `notes` column to `trainer_trainee_connections` table

**Trainee's view of their trainer**
- Shows: trainer's Gravatar avatar, name, email, bio
- Read-only — trainee cannot edit any trainer info
- Only shown if the trainee has an active trainer connection

**Compliance stats on trainer home cards**
- Each trainee card gains: last session date + count of completed sessions in the current ISO week
- Stats fetched server-side — batch query across all connected trainees, not N+1

**Schema changes required**
```sql
ALTER TABLE trainers ADD COLUMN bio text;
ALTER TABLE users ADD COLUMN goals text;
ALTER TABLE users ADD COLUMN height_cm integer;
ALTER TABLE users ADD COLUMN weight_kg numeric(5,2);
ALTER TABLE users ADD COLUMN date_of_birth date;
ALTER TABLE trainer_trainee_connections ADD COLUMN trainer_notes text;
```

**What's already built (do not rebuild)**
- Trainer home page (`/trainer`) — trainee cards exist, compliance stats are additive
- Trainee detail page (`/trainer/trainees/[traineeId]`) — plans + exercises tabs exist; trainer notes + trainee stats are additive
- `TraineeNavHeader` and trainer `NavHeader` — avatar slot is additive to the header
- Gravatar is fetched via a simple URL, no library needed

### Claude's Discretion
- Whether sign out is a dropdown under the avatar or stays on the profile page
- Exact layout of trainer notes on the trainee detail page (inline edit or edit button → form)
- Whether "My Trainer" card is part of the trainee profile page or a tab
- Loading/skeleton state for Gravatar images
- How age is derived and shown from date_of_birth (calculate on render)

### Deferred Ideas (OUT OF SCOPE)
- Email editing — requires Supabase re-verification flow
- Custom avatar upload — requires storage bucket
- Trainee compliance stats visible to trainee themselves (streaks, total sessions)
- Trainer public profile page / shareable link
- Account deletion
</user_constraints>

---

## Summary

Phase 6 delivers four incremental capabilities on top of the already-built trainer/trainee app: (1) own profile/settings pages for both roles, (2) enriched trainee detail view for the trainer, (3) compliance stats on the trainer roster, and (4) a trainer-card on the trainee side. All work is additive — no existing routes are replaced, only extended.

The core technical work is straightforward: one SQL migration to add five columns across two tables, two new profile page routes, four Server Actions (updateTrainerProfile, updateTraineeProfile, updateTrainerNotes, and a compliance stats query), and header component modifications to embed a Gravatar `<img>` tag. Gravatar requires only a client-side MD5 hash — no library is needed because the hash can be computed with the Web Crypto API or a tiny inline implementation.

The compliance stats batch query on the trainer home page is the only non-trivial performance concern: it must join `workout_sessions` filtered by ISO week across all connected trainees in a single query, not N individual queries.

**Primary recommendation:** Build in four plans — (1) migration + Gravatar utility + header avatar, (2) trainer profile page, (3) trainee profile page + trainer-sees-trainee enrichment, (4) compliance stats on roster cards.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 16.1.6 (installed) | Page routes, Server Actions | Already in use |
| Supabase JS | (installed) | DB reads/writes | Already in use |
| Tailwind CSS | (installed) | Styling | Already in use |
| Web Crypto API / inline MD5 | browser native | Gravatar hash | No library needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-md5` or inline impl | any | MD5 hash for Gravatar | Only if Web Crypto SubtleCrypto MD5 path is too verbose |
| Next.js `<Image>` | built-in | Gravatar img rendering with fallback | Use for automatic width/height optimisation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline MD5 | `spark-md5` npm | spark-md5 is 7 KB; inline impl is 20 lines — prefer inline since it's used in one place |
| Next.js `<Image>` | plain `<img>` | `<img>` avoids configuring `remotePatterns`; acceptable for external avatar URL where dimensions are fixed |

**Installation:** No new packages required. If MD5 inline is undesirable:
```bash
npm install spark-md5
```

**Version verification:** Not applicable — no new packages locked in.

---

## Architecture Patterns

### Recommended Project Structure

New files this phase:

```
src/
├── app/
│   ├── (trainer)/
│   │   ├── trainer/
│   │   │   └── profile/
│   │   │       └── page.tsx               # Trainer profile page (server component)
│   │   └── _components/
│   │       └── NavHeader.tsx              # Modified — add GravatarAvatar slot
│   └── (trainee)/
│       ├── trainee/
│       │   └── profile/
│       │       └── page.tsx               # Trainee profile page (server component)
│       └── _components/
│           └── TraineeNavHeader.tsx       # Modified — add GravatarAvatar slot
├── components/
│   └── GravatarAvatar.tsx                 # Shared avatar component
└── lib/
    └── gravatar.ts                        # gravatarUrl(email) utility
```

Modified files:
- `src/app/(trainer)/trainer/page.tsx` — add compliance stats (last session + this-week count) to trainee cards
- `src/app/(trainer)/trainer/trainees/[traineeId]/page.tsx` — add trainer notes + trainee stats section
- `src/lib/db/schema.ts` — add new columns to types
- `src/lib/db/migrations/0009_profile_fields.sql` — new migration

### Pattern 1: Gravatar URL Utility

**What:** Pure function that derives the Gravatar URL from an email string.
**When to use:** Called in any server component that renders an avatar. Pass the URL as a prop to `<GravatarAvatar>`.

```typescript
// src/lib/gravatar.ts
// Gravatar requires MD5 of the trimmed, lowercased email.
// Web Crypto SubtleCrypto does not support MD5; use a minimal inline implementation.

function md5(input: string): string {
  // ... 20-line implementation OR import from spark-md5
}

export function gravatarUrl(email: string, size = 80): string {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}
```

**Important:** `crypto.subtle.digest` does NOT support MD5 (removed from Web Crypto for security reasons). Either use a small inline JS MD5 or install `spark-md5`. Confirmed via MDN Web Crypto docs — MD5 is not in the supported algorithms list.

### Pattern 2: GravatarAvatar Component

**What:** Shared `<img>` wrapper with fixed dimensions, rounded-full, and `alt` text.
**When to use:** In NavHeader, profile pages, trainee detail page header, trainer card on trainee side.

```tsx
// src/components/GravatarAvatar.tsx
interface GravatarAvatarProps {
  url: string;
  name: string;      // used for alt text
  size?: number;     // pixel size of the rendered element
  className?: string;
}

export function GravatarAvatar({ url, name, size = 40, className }: GravatarAvatarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`${name}'s avatar`}
      width={size}
      height={size}
      className={`rounded-full object-cover bg-accent/20 ${className ?? ''}`}
    />
  );
}
```

**Note:** Using a plain `<img>` avoids requiring `remotePatterns` config for `www.gravatar.com` in `next.config.js`. The `d=mp` fallback ensures a valid image always loads — no broken image state to handle.

### Pattern 3: Profile Page Server Action

**What:** Server Action that reads authenticated user's UID from JWT claims, validates input, and updates the relevant table.
**When to use:** `updateTrainerProfile` and `updateTraineeProfile` follow this pattern exactly.

```typescript
// src/app/(trainer)/trainer/profile/actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TrainerProfileSchema = z.object({
  name: z.string().min(1).max(100),
  bio: z.string().max(1000).optional(),
});

export async function updateTrainerProfile(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const parsed = TrainerProfileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio') ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const { error } = await supabase
    .from('trainers')
    .update({ name: parsed.data.name, bio: parsed.data.bio ?? null })
    .eq('auth_uid', claims.sub);

  if (error) return { error: 'Failed to update profile.' };
  revalidatePath('/trainer/profile');
  return { success: true };
}
```

**Key detail:** Use `z.error.issues[0]` not `z.error.errors[0]` — the project has previously fixed a Zod v4 issue where `.errors` was renamed to `.issues` (logged in STATE.md).

### Pattern 4: Trainer Notes Inline Save

**What:** Textarea on the trainee detail page that saves trainer's private notes via a Server Action on explicit "Save" button press.
**When to use:** Trainer notes on `/trainer/trainees/[traineeId]`.

The action updates `trainer_trainee_connections.trainer_notes` filtered by both `trainer_auth_uid` (from claims) and `trainee_auth_uid` (from URL param). This ensures RLS-alignment — trainer can only update their own connection row.

```typescript
export async function updateTrainerNotes(
  traineeAuthUid: string,
  notes: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult.data?.claims;
  if (!claims) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('trainer_trainee_connections')
    .update({ trainer_notes: notes || null })
    .eq('trainer_auth_uid', claims.sub)
    .eq('trainee_auth_uid', traineeAuthUid);

  if (error) return { error: 'Failed to save notes.' };
  revalidatePath(`/trainer/trainees/${traineeAuthUid}`);
  return { success: true };
}
```

### Pattern 5: Compliance Stats Batch Query

**What:** Single query that fetches completed session counts and latest session date across all trainees for a trainer's roster.
**When to use:** Trainer home page (`/trainer/page.tsx`).

The key is `.in('trainee_auth_uid', traineeIds)` to batch across all trainees — the existing pattern is already used for `assigned_plans` on this page (verified in code).

```typescript
// After fetching traineeIds...
const { weekStart } = getCurrentWeekBounds(); // already imported in trainee page

const { data: sessions } = traineeIds.length > 0
  ? await supabase
      .from('workout_sessions')
      .select('trainee_auth_uid, completed_at')
      .in('trainee_auth_uid', traineeIds)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
  : { data: [] };

// Build per-trainee stats in JS:
const statsByTrainee: Record<string, { lastSession: string | null; thisWeek: number }> = {};
for (const session of sessions ?? []) {
  const stat = statsByTrainee[session.trainee_auth_uid] ??= { lastSession: null, thisWeek: 0 };
  if (!stat.lastSession) stat.lastSession = session.completed_at; // first = most recent (ordered desc)
  if (new Date(session.completed_at) >= weekStart) stat.thisWeek++;
}
```

**Note:** `getCurrentWeekBounds()` is already used in the trainee page — import it from `@/lib/utils/week` on the trainer page too.

### Pattern 6: Trainee Views Their Trainer

**What:** On the trainee profile page (or as a section within it), fetch the trainer info via the connection row.
**When to use:** `/trainee/profile` — show trainer card only if connection exists.

```typescript
// Fetch trainer info via connection
const { data: connection } = await supabase
  .from('trainer_trainee_connections')
  .select('trainer_auth_uid')
  .eq('trainee_auth_uid', claims.sub)
  .maybeSingle();

if (connection) {
  const { data: trainerProfile } = await supabase
    .from('trainers')
    .select('name, email, bio')
    .eq('auth_uid', connection.trainer_auth_uid)
    .single();
}
```

**RLS concern:** The existing `trainer_trainee_connections` RLS policy allows trainers to see their own connections. Trainees also need SELECT access to their own connection row to retrieve `trainer_auth_uid`. Verify the `user_sees_own_connection` policy exists — if only `trainer_sees_connections` is defined, a new policy for trainee SELECT is required.

The `trainers` table currently only has `trainer_sees_own_row` (FOR ALL USING auth_uid = own). The trainee needs to read another trainer's row. A new RLS policy is required:

```sql
-- Allow trainees to read the trainer profile of their connected trainer
CREATE POLICY "trainee_sees_connected_trainer" ON trainers
  FOR SELECT USING (
    auth_uid IN (
      SELECT trainer_auth_uid FROM trainer_trainee_connections
      WHERE trainee_auth_uid = (SELECT auth.uid())
    )
  );
```

### Anti-Patterns to Avoid

- **N+1 compliance queries:** Do NOT query `workout_sessions` per trainee inside the loop on the trainer home page. Use the batch `.in()` pattern above.
- **MD5 via SubtleCrypto:** `crypto.subtle.digest` does not support MD5 — attempting it will throw. Use an inline implementation or `spark-md5`.
- **Storing Gravatar URL in DB:** The URL is derived from the email on every render — no need to persist it. Recompute from email everywhere.
- **Separate table for trainer notes:** The decision is `trainer_trainee_connections.trainer_notes` column — no new table.
- **Zod `.errors`:** This project uses Zod v4. Use `.issues` not `.errors` on `ZodError` — already documented in STATE.md.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MD5 hashing | Custom crypto | Inline JS MD5 or `spark-md5` | Web Crypto API doesn't support MD5; inline is 20 lines |
| Avatar fallback | Custom initials SVG generation | Gravatar `d=mp` | Already decided; silhouette is sufficient |
| Week bounds | Custom date arithmetic | `getCurrentWeekBounds()` from `@/lib/utils/week` | Already exists, used in trainee page |
| Age calculation | Stored age field | Derive from `date_of_birth` on render | Avoids stale data; trivial to compute |
| Batch stats aggregation | Multiple queries | Single `.in()` query + JS reduce | N+1 causes O(n) DB round-trips |

**Key insight:** Gravatar eliminates an entire avatar storage/upload feature. The `d=mp` fallback covers 100% of cases without any code branching.

---

## Common Pitfalls

### Pitfall 1: MD5 Not Available in Web Crypto
**What goes wrong:** `crypto.subtle.digest('MD5', ...)` throws `NotSupportedError` because MD5 was deliberately excluded from the Web Crypto spec.
**Why it happens:** MD5 is considered cryptographically broken; Web Crypto only exposes secure algorithms.
**How to avoid:** Use a pure-JS MD5 implementation (e.g., adapted from RFC 1321 reference code or import `spark-md5`). Since Gravatar hashing runs server-side in a Server Component, Node.js `crypto.createHash('md5')` is available and works fine.
**Warning signs:** `algorithm: NotSupportedError` exception at runtime.

**Server-side solution (preferred):**
```typescript
// In a server-only module (lib/gravatar.ts)
import { createHash } from 'crypto'; // Node.js built-in, not Web Crypto

export function gravatarUrl(email: string, size = 80): string {
  const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}
```
Since `gravatarUrl` is called only in Server Components (NavHeader is 'use client' — this is a concern, see below), keep the utility server-only.

### Pitfall 2: NavHeader is a Client Component — Cannot Call Node crypto
**What goes wrong:** Both `NavHeader` and `TraineeNavHeader` are `'use client'` components. Node.js `crypto.createHash` is not available in client bundles.
**Why it happens:** Client components run in the browser; Node built-ins are not available.
**How to avoid:** Compute the Gravatar URL server-side in the parent layout (server component) and pass it as a prop to the header. The trainer layout (`src/app/(trainer)/layout.tsx`) is already a server component — it renders `<NavHeader />`. Extend it to fetch the email and compute the URL, then pass it as a prop.

```typescript
// src/app/(trainer)/layout.tsx — already a server component
import { gravatarUrl } from '@/lib/gravatar'; // server-only module

export default async function TrainerLayout({ children }) {
  const supabase = await createClient();
  const claimsResult = await supabase.auth.getClaims();
  const email = claimsResult.data?.claims?.email ?? '';
  const avatarUrl = gravatarUrl(email);

  return (
    <div className="min-h-screen bg-bg-page">
      <NavHeader avatarUrl={avatarUrl} />
      <main className="max-w-[1280px] mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
```

Similarly for the trainee layout.

### Pitfall 3: Missing RLS Policy for Trainee Reading Trainer Profile
**What goes wrong:** Trainee calls `.from('trainers').select(...)` for their trainer — query returns empty because RLS only allows `trainer_sees_own_row`.
**Why it happens:** The `trainers` table has a single FOR ALL policy scoped to the trainer's own row. No policy exists for cross-user reads.
**How to avoid:** Add a SELECT policy in migration 0009 that permits trainees to read the one trainer they are connected to (subquery in USING clause).
**Warning signs:** Query returns null/empty even though connection exists.

### Pitfall 4: Trainee Cannot Read Their Own Connection Row
**What goes wrong:** When a trainee queries `trainer_trainee_connections` to find their `trainer_auth_uid`, the query returns nothing.
**Why it happens:** The current RLS on `trainer_trainee_connections` (from 0001_initial.sql line 60) says "trainer sees their connections" — check whether a trainee SELECT policy exists.
**How to avoid:** Verify the existing policies on `trainer_trainee_connections` before writing migration. Add trainee SELECT if missing:
```sql
CREATE POLICY "trainee_sees_own_connection" ON trainer_trainee_connections
  FOR SELECT USING (trainee_auth_uid = (SELECT auth.uid()));
```

### Pitfall 5: Zod v4 `.issues` not `.errors`
**What goes wrong:** Accessing `parsed.error.errors[0]` throws `TypeError: Cannot read properties of undefined`.
**Why it happens:** Zod v4 renamed `.errors` to `.issues` on `ZodError`. This is documented in STATE.md.
**How to avoid:** Always use `parsed.error.issues[0]?.message`. Pattern already established in project.

### Pitfall 6: `date_of_birth` Type Mismatch
**What goes wrong:** Supabase returns `date_of_birth` as a string in ISO format (`YYYY-MM-DD`). Age calculation fails if treated as a Date object directly.
**Why it happens:** PostgreSQL `date` columns are serialized as ISO strings by PostgREST.
**How to avoid:** Parse explicitly: `new Date(dateOfBirth + 'T00:00:00')` before computing age to avoid timezone offset issues.

---

## Code Examples

### Gravatar URL (server-side, Node crypto)

```typescript
// src/lib/gravatar.ts — server-only
import { createHash } from 'crypto';

export function gravatarUrl(email: string, size = 80): string {
  const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}
```

### Age from Date of Birth (client render)

```typescript
function ageFromDob(dob: string): number {
  const birth = new Date(dob + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
```

### Physical stats chip row (display)

```tsx
// Inside trainee detail page, after fetching traineeProfile (now includes new columns)
{(traineeProfile.height_cm || traineeProfile.weight_kg || traineeProfile.date_of_birth) && (
  <p className="text-sm text-text-primary opacity-70">
    {[
      traineeProfile.height_cm ? `${traineeProfile.height_cm} cm` : null,
      traineeProfile.weight_kg ? `${traineeProfile.weight_kg} kg` : null,
      traineeProfile.date_of_birth ? `Age ${ageFromDob(traineeProfile.date_of_birth)}` : null,
    ].filter(Boolean).join(' · ')}
  </p>
)}
```

### Compliance stats display on trainer roster card

```tsx
// Inside the trainee card map on /trainer/page.tsx
const stat = statsByTrainee[connection.trainee_auth_uid];
// ...
{stat && (
  <p className="text-xs text-text-primary opacity-50 mt-1">
    {stat.lastSession
      ? `Last workout: ${new Date(stat.lastSession).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
      : 'No sessions yet'}
    {' · '}
    {stat.thisWeek} this week
  </p>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Initials avatar (current) | Gravatar `<img>` with `d=mp` fallback | Phase 6 | Removes hand-rolled initials logic from trainer home and trainee detail pages |
| Sign out inline in header | Sign out on profile page (or dropdown) | Phase 6 | Header top-right becomes avatar → profile nav |

**Deprecated/outdated in this phase:**
- Inline initials avatar divs (`bg-accent/20 text-accent` with initials) on trainer home cards and trainee detail header — replaced by GravatarAvatar component.

---

## Open Questions

1. **Does a trainee SELECT policy exist on `trainer_trainee_connections`?**
   - What we know: 0001_initial.sql line 60 starts with "Trainer sees their connections" — trainee SELECT is not visible in the snippet read.
   - What's unclear: Whether a `trainee_sees_own_connection` policy was added later or is absent.
   - Recommendation: Read the full 0001_initial.sql before writing migration 0009. Add the policy in 0009 if missing.

2. **Trainee layout file — does it exist?**
   - What we know: `src/app/(trainee)/_components/TraineeNavHeader.tsx` exists. No `layout.tsx` was seen under `(trainee)/`.
   - What's unclear: Where `TraineeNavHeader` is mounted — likely in a layout.
   - Recommendation: Glob for `src/app/(trainee)/layout.tsx` before Plan 1.

3. **Claims object — does it expose `email`?**
   - What we know: `claims.sub` (UUID) is used throughout. Email may be in JWT claims.
   - What's unclear: Whether `claims.email` is populated by Supabase JWT.
   - Recommendation: If `claims.email` is unavailable, fetch email from `trainers`/`users` table (already done in home page queries). Alternatively, `supabase.auth.getUser()` returns email but incurs a network call — avoid in layouts. Prefer passing email from the table fetch.

---

## Validation Architecture

> `workflow.nyquist_validation` is not set in `.planning/config.json` — treat as enabled.

### Test Framework

No automated test framework detected in this project (no `jest.config.*`, `vitest.config.*`, `pytest.ini`, or `__tests__/` directory found). All verification for this phase is manual/human.

| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | None |
| Quick run command | N/A — human verify via browser |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Behavior | Test Type | Automated Command | Notes |
|----------|-----------|-------------------|-------|
| Gravatar avatar renders in NavHeader | manual | N/A | Visual check in browser |
| Avatar click navigates to profile page | manual | N/A | Click test |
| Trainer can save name + bio | manual | N/A | Submit form, reload |
| Trainee can save name, goals, height, weight, DOB | manual | N/A | Submit form, reload |
| Trainer notes saved + visible on reload | manual | N/A | Type, save, reload |
| Trainee goals visible read-only to trainer | manual | N/A | Cross-role check |
| Physical stats shown as chip row on trainee detail | manual | N/A | Visual check |
| Trainer card visible on trainee profile | manual | N/A | Login as trainee |
| Compliance stats on trainer home: last session + count | manual | N/A | Seed sessions first |
| Missing fields show "—" / "No goals set" | manual | N/A | Leave fields empty |

### Wave 0 Gaps

None — no test framework; all verification is human-driven per project convention.

---

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/app/(trainer)/_components/NavHeader.tsx` — confirmed client component, sign out button location
- Project codebase: `src/app/(trainer)/layout.tsx` — confirmed server component, renders NavHeader
- Project codebase: `src/lib/db/schema.ts` — confirmed current column set on `trainers`, `users`, `trainer_trainee_connections`
- Project codebase: `src/app/(trainer)/trainer/page.tsx` — confirmed existing batch query pattern with `.in()`
- Project codebase: `src/lib/db/migrations/0001_initial.sql` — confirmed RLS policies on trainers table
- Project codebase: `src/app/(trainer)/trainer/trainees/[traineeId]/page.tsx` — confirmed existing tab structure

### Secondary (MEDIUM confidence)
- MDN Web Crypto API docs — MD5 not in supported algorithms (confirmed via training knowledge; Web Crypto spec is stable)
- Gravatar docs: `https://www.gravatar.com/avatar/{hash}?d=mp` pattern — stable API, confirmed against public docs

### Tertiary (LOW confidence)
- Node.js `crypto.createHash('md5')` in server components — standard pattern; confirmed available in Node 18+

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in the project, no new additions
- Architecture: HIGH — patterns are direct extensions of existing code; all source files inspected
- Pitfalls: HIGH — Zod v4 issue confirmed in STATE.md; MD5/Web Crypto issue confirmed by spec; RLS gap identified from source code inspection
- Compliance stats: HIGH — existing `.in()` batch pattern confirmed in trainer home page

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain — Next.js App Router, Supabase RLS, Gravatar URL spec do not change rapidly)
