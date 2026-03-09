---
phase: 01-foundation
plan: 05
type: execute
wave: 2
depends_on:
  - "04-PLAN"
files_modified:
  - src/app/join/[token]/page.tsx
  - src/app/(trainer)/trainer/page.tsx
autonomous: true
requirements:
  - CONN-03
  - CONN-04
gap_closure: true

must_haves:
  truths:
    - "A trainee who clicks an invite link at /join/[token] is connected to the trainer if already logged in"
    - "A trainee who clicks an invite link and is not logged in is redirected to /signup/trainee?invite=[token]"
    - "An invalid or revoked token shows a clear error — not a crash or blank page"
    - "A trainee already connected to this trainer is redirected to /trainee without creating a duplicate"
    - "A trainee already connected to a different trainer sees a conflict message (must disconnect first)"
    - "The trainer home page queries the database and renders the actual list of connected trainees"
    - "When no trainees are connected, the trainer home shows an empty state (not an error)"
  artifacts:
    - path: "src/app/join/[token]/page.tsx"
      provides: "Invite claim page — validates token, auto-connects or redirects to signup"
      min_lines: 50
    - path: "src/app/(trainer)/trainer/page.tsx"
      provides: "Trainer roster — queries trainer_trainee_connections joined with users"
  key_links:
    - from: "src/app/join/[token]/page.tsx"
      to: "invite_links table"
      via: "adminClient.from('invite_links').select"
      pattern: "invite_links.*select"
    - from: "src/app/join/[token]/page.tsx"
      to: "trainer_trainee_connections table"
      via: "adminClient.from('trainer_trainee_connections').insert"
      pattern: "trainer_trainee_connections.*insert"
    - from: "src/app/(trainer)/trainer/page.tsx"
      to: "trainer_trainee_connections joined with users"
      via: "supabase.from('trainer_trainee_connections').select"
      pattern: "trainer_trainee_connections.*select"
---

<objective>
Implement the trainee-facing invite claim page (`/join/[token]`) and replace the hardcoded empty roster on the trainer home with a real database query.

Purpose: Satisfies CONN-03 (trainee can join via invite link) and CONN-04 (trainer sees their actual roster). Both were BLOCKED — no `/join/[token]` route existed and the trainer home never queried the database.

Output: A working invite claim flow and a live roster on the trainer home.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation/01-VERIFICATION.md

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from codebase. -->

From src/lib/db/schema.ts:
```typescript
export const inviteLinks = pgTable('invite_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerAuthUid: uuid('trainer_auth_uid').notNull(),
  token: text('token').notNull().unique(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const trainerTraineeConnections = pgTable('trainer_trainee_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerAuthUid: uuid('trainer_auth_uid').notNull(),
  traineeAuthUid: uuid('trainee_auth_uid').notNull(),
  inviteLinkId: uuid('invite_link_id'),
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow(),
  // UNIQUE constraint: trainee_unique_connection on traineeAuthUid
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUid: uuid('auth_uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: ['trainee'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

From src/lib/supabase/server.ts:
```typescript
export async function createClient(): Promise<SupabaseClient>
// getClaims() is the fast local JWT validator for Server Components
// const { data: { claims } } = await supabase.auth.getClaims()
// claims.sub = user's auth UUID
// claims.app_metadata?.role = 'trainer' | 'trainee'
```

From src/lib/supabase/admin.ts:
```typescript
export function createAdminClient(): SupabaseClient
// Bypasses RLS — use for:
// - reading invite_links by token (no trainee-read policy in migration)
// - inserting into trainer_trainee_connections (no INSERT policy — admin only)
```

RLS policies relevant to this plan (from 0001_initial.sql):
- invite_links: trainer manages own (FOR ALL WHERE trainer_auth_uid = auth.uid())
  — trainee token lookup MUST use admin client (no public read policy in this migration)
- trainer_trainee_connections:
  - trainer sees own connections (SELECT)
  - trainee sees own connection (SELECT)
  - disconnect (DELETE) — either party
  - INSERT: admin client only (no INSERT RLS policy defined)

Connection management rules (from CONTEXT.md):
- One trainer per trainee — UNIQUE constraint on trainee_auth_uid in DB
- Trainee connected to a different trainer → show conflict screen (must disconnect first)
- Already connected to this trainer → silently redirect to /trainee (idempotent)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build /join/[token] invite claim page</name>
  <files>src/app/join/[token]/page.tsx</files>
  <action>
Create the directory and file `src/app/join/[token]/page.tsx` as a Server Component.

The page handles all invite link states:
1. Invalid/revoked token → show error UI
2. Not logged in → redirect to `/signup/trainee?invite=[token]`
3. Logged-in trainee already connected to THIS trainer → redirect to `/trainee` (idempotent)
4. Logged-in trainee connected to a DIFFERENT trainer → show conflict UI (cannot auto-connect)
5. Logged-in trainee with no existing connection → insert connection row, redirect to `/trainee`
6. Logged-in trainer clicking their own invite link → redirect to `/trainer` (edge case)

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { token } = await params;

  const adminClient = createAdminClient();

  // Step 1: Validate the invite token using admin client
  // (no public RLS read policy for invite_links — admin client required)
  const { data: invite, error: inviteError } = await adminClient
    .from('invite_links')
    .select('id, trainer_auth_uid, revoked_at')
    .eq('token', token)
    .single();

  if (inviteError || !invite || invite.revoked_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center space-y-3">
          <div className="text-4xl">🔗</div>
          <h1 className="text-lg font-semibold text-gray-900">Invalid invite link</h1>
          <p className="text-sm text-gray-500">
            This invite link is invalid or has been revoked. Ask your trainer to send a new one.
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Check if trainee is logged in
  const supabase = await createClient();
  const { data: { claims } } = await supabase.auth.getClaims();

  if (!claims) {
    // Not logged in — send to trainee signup with invite token preserved
    redirect(`/signup/trainee?invite=${token}`);
  }

  const userUid = claims.sub;
  const userRole = claims.app_metadata?.role as string | undefined;

  // Step 3: Trainers should not claim invite links
  if (userRole === 'trainer') {
    redirect('/trainer');
  }

  // Step 4: Check for an existing connection for this trainee
  const { data: existing } = await adminClient
    .from('trainer_trainee_connections')
    .select('trainer_auth_uid')
    .eq('trainee_auth_uid', userUid)
    .single();

  if (existing) {
    if (existing.trainer_auth_uid === invite.trainer_auth_uid) {
      // Already connected to this trainer — idempotent success
      redirect('/trainee');
    }
    // Connected to a DIFFERENT trainer — show conflict screen
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center space-y-3">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-lg font-semibold text-gray-900">Already connected</h1>
          <p className="text-sm text-gray-500">
            You are already connected to a trainer. You must disconnect from your current trainer
            before joining a new one.
          </p>
          <a
            href="/trainee"
            className="inline-block mt-2 text-sm font-medium text-blue-600 hover:underline"
          >
            Go to your dashboard
          </a>
        </div>
      </div>
    );
  }

  // Step 5: No existing connection — create it
  const { error: insertError } = await adminClient
    .from('trainer_trainee_connections')
    .insert({
      trainer_auth_uid: invite.trainer_auth_uid,
      trainee_auth_uid: userUid,
      invite_link_id: invite.id,
    });

  if (insertError) {
    // Unique constraint violation = race condition (two simultaneous claims) — treat as success
    // Any other error shows a friendly message
    const isUniqueViolation = insertError.code === '23505';
    if (!isUniqueViolation) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center space-y-3">
            <div className="text-4xl">❌</div>
            <h1 className="text-lg font-semibold text-gray-900">Connection failed</h1>
            <p className="text-sm text-gray-500">
              Something went wrong while connecting you to your trainer. Please try the link again.
            </p>
          </div>
        </div>
      );
    }
  }

  // Successfully connected (or idempotent unique violation) — send to trainee home
  redirect('/trainee');
}
```

Important implementation notes:
- `params` must be awaited — Next.js 15+ uses async params in App Router
- Admin client is used for both the invite token lookup (no public read RLS) and the connection INSERT (no INSERT RLS policy)
- Unique constraint violation (code `'23505'`) is treated as success — race condition where two simultaneous clicks both find no connection but only one wins the INSERT; the losing request still ends up correctly connected
- The conflict screen does not offer a "disconnect" CTA in Phase 1 — that is a connection management feature for future work
  </action>
  <verify>
    <automated>cd "/Users/piotrsowinski/sources/Private/GYM AI ASSISTANT" && npx tsc --noEmit 2>&1 | grep "join" || echo "No TS errors in join page"</automated>
  </verify>
  <done>
    - `src/app/join/[token]/page.tsx` exists as a Server Component with no `'use client'` directive
    - File handles all 6 states: invalid token, not logged in, trainer role, already connected same, already connected different, new connection
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Replace trainer home stub with live roster query</name>
  <files>src/app/(trainer)/trainer/page.tsx</files>
  <action>
Replace the static empty-state stub in `src/app/(trainer)/trainer/page.tsx` with a Server Component that fetches the trainer's real connected-trainee roster.

Plan 04 (wave 1) has already created `src/app/(trainer)/trainer/_components/InviteDialog.tsx` and `src/app/(trainer)/trainer/actions.ts`. This plan owns the final `trainer/page.tsx` and imports `InviteDialog` from Plan 04's output.

The roster query uses the standard Supabase server client (not admin) — RLS ensures the trainer only sees their own connections via the `trainer_sees_own_connections` policy. The `users` table join works because of the `trainer_sees_connected_trainees` RLS policy.

```typescript
import { createClient } from '@/lib/supabase/server';
import { InviteDialog } from './_components/InviteDialog';

interface TraineeRow {
  trainee_auth_uid: string;
  connected_at: string;
  users: {
    name: string;
    email: string;
  } | null;
}

export default async function TrainerHomePage() {
  const supabase = await createClient();
  const { data: { claims } } = await supabase.auth.getClaims();

  // Fetch connected trainees — RLS filters to this trainer's connections only
  // Join with users table to get trainee name/email
  const { data: connections, error } = await supabase
    .from('trainer_trainee_connections')
    .select(`
      trainee_auth_uid,
      connected_at,
      users!trainer_trainee_connections_trainee_auth_uid_fkey (
        name,
        email
      )
    `)
    .order('connected_at', { ascending: false });

  const trainees = (connections ?? []) as TraineeRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Your Trainees</h1>
        <InviteDialog />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Failed to load trainees. Please refresh the page.
        </div>
      )}

      {!error && trainees.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
          <div className="text-4xl text-gray-300">👥</div>
          <h2 className="font-medium text-gray-700">No trainees yet</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Invite your first client to get started. They&apos;ll receive a link to join your
            roster.
          </p>
        </div>
      )}

      {!error && trainees.length > 0 && (
        <div className="space-y-3">
          {trainees.map((connection) => {
            const trainee = connection.users;
            const initials = trainee?.name
              ? trainee.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : '?';
            const connectedDate = new Date(connection.connected_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={connection.trainee_auth_uid}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {initials}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {trainee?.name ?? 'Unknown trainee'}
                  </p>
                  <p className="text-sm text-gray-400 truncate">
                    {trainee?.email ?? connection.trainee_auth_uid}
                  </p>
                </div>
                {/* Connected date */}
                <div className="text-xs text-gray-400 flex-shrink-0">
                  Joined {connectedDate}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Supabase join syntax note:** The foreign key on `trainer_trainee_connections.trainee_auth_uid` references `users.auth_uid`. In the Supabase PostgREST query syntax, the join key must match the actual FK constraint name. If the auto-generated FK name doesn't match, use the explicit column reference:
```typescript
// Alternative if FK name lookup fails — use explicit join via .eq
const { data: connections } = await supabase
  .from('trainer_trainee_connections')
  .select('trainee_auth_uid, connected_at')
  .order('connected_at', { ascending: false });

// Then fetch user rows separately
```
If the joined query fails at runtime, fall back to two separate queries: first fetch connections, then fetch users by `auth_uid IN (...)`.
  </action>
  <verify>
    <automated>cd "/Users/piotrsowinski/sources/Private/GYM AI ASSISTANT" && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - `src/app/(trainer)/trainer/page.tsx` queries `trainer_trainee_connections` (no hardcoded empty state that ignores DB data)
    - The page renders a list of trainee cards when connections exist, and the empty-state UI when none exist
    - `<InviteDialog />` is imported and rendered in the header row
    - `npm run build` succeeds without errors
    - No `disabled` button or "Plan 04 will replace this" comment remains
  </done>
</task>

</tasks>

<verification>
`npm run build` from the project root must complete without TypeScript or build errors.

Manual verification once migration is applied and a test connection exists:
1. As a trainer at /trainer: the page shows a trainee card with initials avatar, name, email, and join date (not the hardcoded empty state)
2. Click an invite link as a logged-out user: redirected to /signup/trainee?invite=[token]
3. Click an invite link as a logged-in trainee with no connection: connection is created, redirected to /trainee
4. Click the same invite link again: redirected to /trainee without error (idempotent)
5. Click a different trainer's invite link while connected: conflict screen appears
6. Click an invalid/deleted token: invalid link error screen appears
</verification>

<success_criteria>
- `src/app/join/[token]/page.tsx` exists and handles all invite claim states (invalid, unauthenticated, trainer role, already connected same, already connected different, new connection)
- `src/app/(trainer)/trainer/page.tsx` fetches real data from `trainer_trainee_connections` and renders trainee cards
- Both files compile cleanly — `npm run build` passes
- CONN-03: Trainee can join via invite link (logged in or redirected to signup with token preserved)
- CONN-04: Trainer sees their actual connected-trainee roster (not a hardcoded empty state)
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-05-SUMMARY.md`
</output>
