# Phase 10: Demo Users — Research

**Researched:** 2026-03-30
**Domain:** Next.js App Router / Supabase — demo account seeding, server-action-based auto-login, demo protection guard
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Demo accounts** — One demo trainer + one demo trainee created via Supabase Admin client. Permanent accounts, `is_demo: true` in `user_metadata`, role in `app_metadata` (matching existing codebase pattern).
- **Landing page demo section** — A dedicated section on `/` after the features section with two CTAs: "Test as Trainer" / "Test as Trainee" (PL: "Wypróbuj jako Trener" / "Wypróbuj jako Podopieczny"). Clicking auto-logs the visitor in seamlessly via a server action that calls `signInWithPassword`.
- **Password change protection** — Server action guard (primary) + UI hide (secondary). Guard checks `claims.user_metadata?.is_demo`. A "Change Password" section must be added to both profile pages (trainer and trainee) so there is UI to hide.
- **Seeded data** — Push/Pull/Legs plan with 3 schemas. ~6–8 sessions over 14 days with progressive overload. ~14 body weight entries trending downward (~84.2 → 83.5 kg).
- **Static data** — No reset. Data accumulates naturally.
- **Seed delivery** — Standalone TypeScript script at `scripts/seed-demo.ts`, run via `pnpm seed:demo`. Idempotent check before creation. Credentials from `.env.local`.

### Claude's Discretion

- Exact visual design of the demo section (card, banner, inline block)
- Whether demo CTAs use a different visual style vs. sign-up CTAs
- Exact exercise names and weight progressions in seed data
- Whether body weight access is pre-granted for demo accounts

</user_constraints>

---

## Summary

Phase 10 has three well-scoped workstreams that can be executed serially:

1. **Seed script** (`scripts/seed-demo.ts`) — TypeScript script using `createAdminClient()` to create two Supabase auth users and insert all demo data into Postgres. Idempotent: checks `trainers` table for existing demo trainer before proceeding.

2. **Landing page demo section** — New root-level server action (`src/app/actions.ts`) mirrors the existing `signIn` pattern from `(auth)/login/actions.ts`. Two `<form>` elements in `page.tsx` with `action={loginAsDemoTrainer}` / `action={loginAsDemoTrainee}`. i18n keys added to both locales.

3. **Password protection** — `updatePassword` in `reset-password/actions.ts` gains an `is_demo` early-return guard. Both profile pages add a "Change Password" section (new form + new server action using `supabase.auth.updateUser`). Profile page server components read `claims.user_metadata?.is_demo` and pass `isDemo: boolean` down to form components which conditionally suppress the section.

**Primary recommendation:** No new dependencies beyond `tsx` (dev-only, for running the seed script). No DB migration needed. No middleware changes needed (the middleware already redirects authenticated users from `/` to their dashboard, so demo login just follows the existing flow).

---

## Standard Stack

### Core

| Library                 | Version                | Purpose                                                       | Why Standard                                                |
| ----------------------- | ---------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `@supabase/supabase-js` | ^2.99.0 (installed)    | Admin client for seeding + server client for demo login guard | Established in all phases                                   |
| `tsx`                   | latest (dev-only, new) | Run `scripts/seed-demo.ts` without compiling                  | Lightest way to run TypeScript scripts in a Next.js project |
| `next-intl`             | ^4.8.3 (installed)     | i18n keys for demo section + password change labels           | Established in Phase 9                                      |

---

## Architecture Patterns

### Pattern 1: Supabase Admin user creation (seed script)

```typescript
// scripts/seed-demo.ts
import { createAdminClient } from "@/lib/supabase/admin";

const adminAuth = createAdminClient().auth.admin;

// Create demo trainer
const { data: trainerAuthData, error } = await adminAuth.createUser({
  email: DEMO_TRAINER_EMAIL,
  password: DEMO_TRAINER_PASSWORD,
  email_confirm: true,
  app_metadata: { role: "trainer" },
  user_metadata: { is_demo: true },
});
const trainerUid = trainerAuthData!.user.id;

// Insert into trainers table
const adminDb = createAdminClient();
await adminDb.from("trainers").insert({
  auth_uid: trainerUid,
  name: "Demo Trainer",
  email: DEMO_TRAINER_EMAIL,
  bio: "Demo account — explore all trainer features.",
});
```

**Idempotency check:**

```typescript
// Check if demo trainer already exists before creating
const { data: existingTrainer } = await adminDb
  .from("trainers")
  .select("auth_uid")
  .eq("email", DEMO_TRAINER_EMAIL)
  .maybeSingle();

if (existingTrainer) {
  console.log("Demo users already seeded. Skipping.");
  process.exit(0);
}
```

### Pattern 2: Demo login server action (mirrors existing login pattern)

```typescript
// src/app/actions.ts
"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAsDemoTrainer() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.DEMO_TRAINER_EMAIL!,
    password: process.env.DEMO_TRAINER_PASSWORD!,
  });
  if (error) redirect("/login");
  redirect("/trainer");
}

export async function loginAsDemoTrainee() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.DEMO_TRAINEE_EMAIL!,
    password: process.env.DEMO_TRAINEE_PASSWORD!,
  });
  if (error) redirect("/login");
  redirect("/trainee");
}
```

**Landing page integration:**

```tsx
// src/app/page.tsx — demo section (server component, React 19 form actions)
<form action={loginAsDemoTrainer}>
  <button type="submit" className="inline-flex items-center justify-center ...">
    {t('landing.testAsTrainer')}
  </button>
</form>
<form action={loginAsDemoTrainee}>
  <button type="submit" className="inline-flex items-center justify-center ...">
    {t('landing.testAsTrainee')}
  </button>
</form>
```

### Pattern 3: `is_demo` guard in server actions

```typescript
// In any password-changing server action:
const supabase = await createClient();
const claimsResult = await supabase.auth.getClaims();
const claims = claimsResult.data?.claims;
if (!claims) return { error: "Not authenticated" };

const isDemo = claims.user_metadata?.is_demo === true;
if (isDemo) return { error: "Demo accounts cannot change their password." };
// ...proceed with updateUser
```

### Pattern 4: Passing `isDemo` from server component to client form

```typescript
// In profile page.tsx:
const isDemo = !!(claimsResult.data?.claims?.user_metadata?.is_demo);

// Pass to form component:
<TrainerProfileForm initialName={name} initialBio={bio} isDemo={isDemo} />
```

```tsx
// In form component:
export function TrainerProfileForm({
  initialName,
  initialBio,
  isDemo,
}: {
  initialName: string;
  initialBio: string;
  isDemo: boolean;
}) {
  // ...
  {
    /* Only render if not demo */
  }
  {
    !isDemo && <ChangePasswordSection />;
  }
}
```

---

## Key Interfaces

### Existing login action (pattern to replicate)

```typescript
// src/app/(auth)/login/actions.ts
export async function signIn(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password" };
  const claimsResult = await supabase.auth.getClaims();
  const role = claimsResult.data?.claims?.app_metadata?.role;
  if (role === "trainer") redirect("/trainer");
  else if (role === "trainee") redirect("/trainee");
}
```

### Existing `updatePassword` action (to guard)

```typescript
// src/app/(auth)/reset-password/actions.ts
export async function updatePassword(prevState: unknown, formData: FormData) {
  // ...validate...
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });
  if (error) return { error: error.message };
  await supabase.auth.signOut();
  redirect("/login");
}
```

### Existing db schema (tables used by seed script)

| Table                         | Key columns                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `trainers`                    | `auth_uid`, `name`, `email`, `bio`                                                                                                        |
| `users`                       | `auth_uid`, `name`, `email`, `role`, `goals`                                                                                              |
| `trainer_trainee_connections` | `trainer_auth_uid`, `trainee_auth_uid`                                                                                                    |
| `exercises`                   | `trainer_auth_uid`, `name`, `muscle_group`                                                                                                |
| `plans`                       | `trainer_auth_uid`, `name`, `week_count`, `workouts_per_week`, `status`                                                                   |
| `workout_schemas`             | `plan_id`, `name`, `slot_index`, `sort_order`                                                                                             |
| `schema_exercises`            | `schema_id`, `exercise_id`, `sort_order`, `sets`, `reps`, `target_weight_kg`                                                              |
| `assigned_plans`              | `source_plan_id`, `trainer_auth_uid`, `trainee_auth_uid`, `name`, `week_count`, `workouts_per_week`, `status`, `started_at`, `sort_order` |
| `assigned_schemas`            | `assigned_plan_id`, `name`, `slot_index`, `sort_order`                                                                                    |
| `assigned_schema_exercises`   | `assigned_schema_id`, `exercise_id`, `sort_order`, `sets`, `reps`, `target_weight_kg`                                                     |
| `workout_sessions`            | `assigned_schema_id`, `trainee_auth_uid`, `status`, `started_at`, `completed_at`                                                          |
| `session_sets`                | `session_id`, `assigned_schema_exercise_id`, `set_number`, `actual_reps`, `actual_weight_kg`, `completed_at`                              |
| `body_weight_logs`            | `trainee_auth_uid`, `logged_date`, `weight_kg`                                                                                            |

### Middleware — no changes needed

The middleware at `src/middleware.ts` already:

1. Redirects unauthenticated users from private paths to `/login`
2. Redirects authenticated users visiting `/` to their home (`/trainer` or `/trainee`)
3. Prevents cross-role access

After `loginAsDemoTrainer()` sets auth cookies and redirects to `/trainer`, the middleware will let the demo trainer through since they have `app_metadata.role = 'trainer'`.

---

## Seed Data Specification

### Demo Trainer

- **Email:** from env `DEMO_TRAINER_EMAIL` (e.g. `demo-trainer@trainerforge.app`)
- **Password:** from env `DEMO_TRAINER_PASSWORD`
- **Name:** "Demo Trainer" | **Bio:** "Demo account — explore all trainer features."

### Demo Trainee

- **Email:** from env `DEMO_TRAINEE_EMAIL`
- **Password:** from env `DEMO_TRAINEE_PASSWORD`
- **Name:** "Demo Trainee" | **Goals:** "Build strength and reduce body fat"

### Plan: "Push/Pull/Legs Program" (4 weeks, 3 workouts/week)

**Schema 0 — Push Day:**
| Exercise | Sets | Reps | Target kg |
|----------|------|------|-----------|
| Barbell Bench Press | 4 | 8 | 80 |
| Overhead Press | 3 | 8 | 55 |
| Tricep Pushdown | 3 | 12 | 30 |
| Lateral Raise | 3 | 15 | 10 |

**Schema 1 — Pull Day:**
| Exercise | Sets | Reps | Target kg |
|----------|------|------|-----------|
| Barbell Row | 4 | 8 | 75 |
| Pull-up | 3 | 8 | 0 |
| Bicep Curl | 3 | 12 | 15 |

**Schema 2 — Legs Day:**
| Exercise | Sets | Reps | Target kg |
|----------|------|------|-----------|
| Squat | 4 | 8 | 100 |
| Romanian Deadlift | 3 | 10 | 85 |
| Leg Press | 3 | 12 | 120 |

### Workout Sessions (6 sessions, 14 days ago → 3 days ago)

| Day offset | Schema   | Key weight notes                        |
| ---------- | -------- | --------------------------------------- |
| -14        | Push Day | Bench 80kg, OHP 55kg                    |
| -12        | Pull Day | Row 75kg, Curl 15kg                     |
| -10        | Legs Day | Squat 100kg, RDL 85kg                   |
| -7         | Push Day | Bench 82.5kg (+2.5), OHP 57.5kg (+2.5)  |
| -5         | Pull Day | Row 77.5kg (+2.5), Curl 17.5kg (+2.5)   |
| -3         | Legs Day | Squat 102.5kg (+2.5), RDL 87.5kg (+2.5) |

All sets: `actual_reps = target_reps`, `muscle_failure = false`.

### Body Weight Logs (14 entries)

Daily entries from day −14 to day −1. Starting weight 84.2 kg, ending ~83.5 kg.
Slight irregular variation (±0.3 kg) to look realistic.

---

## i18n Keys to Add

### `messages/pl/common.json` and `messages/en/common.json` — under `landing`

| Key                     | PL                                                                              | EN                                                          |
| ----------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `landing.demoTitle`     | Wypróbuj aplikację                                                              | Try the app                                                 |
| `landing.demoSubtitle`  | Przeglądaj Forge bez rejestracji — zaloguj się jako demo trener lub podopieczny | Explore Forge without signing up — log in as a demo account |
| `landing.testAsTrainer` | Wypróbuj jako Trener                                                            | Test as Trainer                                             |
| `landing.testAsTrainee` | Wypróbuj jako Podopieczny                                                       | Test as Trainee                                             |

### `messages/pl/trainer.json` and `messages/en/trainer.json` — under `profile`

| Key                                  | PL                                        | EN                                        |
| ------------------------------------ | ----------------------------------------- | ----------------------------------------- |
| `profile.changePasswordHeading`      | Zmień hasło                               | Change Password                           |
| `profile.changePasswordNewLabel`     | Nowe hasło                                | New password                              |
| `profile.changePasswordConfirmLabel` | Potwierdź nowe hasło                      | Confirm new password                      |
| `profile.changePasswordSubmit`       | Zmień hasło                               | Update password                           |
| `profile.changePasswordSaving`       | Aktualizowanie...                         | Updating...                               |
| `profile.changePasswordSuccess`      | Hasło zmienione. Zostaniesz wylogowany/a. | Password updated. You will be signed out. |
| `profile.changePasswordError`        | Nie udało się zmienić hasła.              | Failed to update password.                |

### `messages/pl/trainee.json` and `messages/en/trainee.json` — under `profile`

Same keys as trainer profile above (both roles get the same Change Password UX).

---

## Alternatives Considered

| Instead of                                                 | Could use                              | Why rejected                                                                                         |
| ---------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Env vars for demo credentials                              | Hardcoded constants in script          | Hardcoded secrets can accidentally be committed to git                                               |
| TypeScript seed script + tsx                               | SQL seed file (like exercises.sql)     | SQL seed can't easily use admin auth SDK to create Supabase Auth users or set user_metadata          |
| Two separate server actions for trainer/trainee demo login | Single action with a `role` form param | Two actions is cleaner: no hidden field, no parsing, no risk of role manipulation via form tampering |
| `getUser()` for is_demo check                              | `getClaims()`                          | `getClaims()` is the established pattern in this codebase; avoids extra network round-trip           |

---

_Phase: 10-demo-users_
_Researched: 2026-03-30_
