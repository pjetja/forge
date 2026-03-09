---
phase: 01-foundation
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/(trainer)/trainer/actions.ts
  - src/app/(trainer)/trainer/_components/InviteDialog.tsx
autonomous: true
requirements:
  - CONN-01
  - CONN-02
gap_closure: true

must_haves:
  truths:
    - "A trainer can click '+ Invite trainee' on their home page and receive a shareable link"
    - "The generated link has the form /join/[token] where token is a random UUID stored in invite_links"
    - "The invite button is functional — not disabled — and triggers link generation"
    - "The generated link is displayed in the UI and can be copied"
    - "Invites do not expire — invite_links rows have no expiry, only a revokable revoked_at"
  artifacts:
    - path: "src/app/(trainer)/trainer/actions.ts"
      provides: "generateInviteLink Server Action"
      exports: ["generateInviteLink"]
    - path: "src/app/(trainer)/trainer/_components/InviteDialog.tsx"
      provides: "Client component that triggers invite generation and shows the link"
      min_lines: 40
  key_links:
    - from: "src/app/(trainer)/trainer/_components/InviteDialog.tsx"
      to: "src/app/(trainer)/trainer/actions.ts"
      via: "import generateInviteLink"
      pattern: "generateInviteLink"
    - from: "src/app/(trainer)/trainer/actions.ts"
      to: "invite_links table"
      via: "adminClient.from('invite_links').insert"
      pattern: "invite_links.*insert"
---

<objective>
Implement the invite link generation feature on the trainer home page. A trainer clicks "+ Invite trainee," a Server Action inserts a UUID token into the `invite_links` table using the admin client, and the resulting shareable link (`/join/[token]`) is displayed in a dialog for the trainer to copy and share.

Purpose: Satisfies CONN-01 (trainer can add a trainee by generating a shareable invite) and CONN-02 (trainer can generate an invite link) — both were BLOCKED because the invite button was permanently disabled with no Server Action.

Output: A functional `+ Invite trainee` button that creates an invite link and shows it to the trainer.
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
```

From src/lib/supabase/server.ts:
```typescript
export async function createClient(): Promise<SupabaseClient>
// Used in Server Actions with: const supabase = await createClient()
```

From src/lib/supabase/admin.ts:
```typescript
export function createAdminClient(): SupabaseClient
// Service role client — bypasses RLS. Use for INSERT into invite_links.
```

From src/app/(trainer)/trainer/page.tsx (current stub — will be replaced):
```typescript
// Disabled placeholder button — Plan 04 will replace this
<button disabled className="...opacity-50 cursor-not-allowed">+ Invite trainee</button>
// Hardcoded empty state — Plan 05 will add the real roster
```

RLS on invite_links:
- Trainer manages own invites: FOR ALL USING (trainer_auth_uid = auth.uid())
- Token validation in Server Actions uses admin client (bypasses RLS)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create generateInviteLink Server Action</name>
  <files>src/app/(trainer)/trainer/actions.ts</files>
  <action>
Create a new file `src/app/(trainer)/trainer/actions.ts` with a single exported Server Action:

```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function generateInviteLink(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { claims }, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claims) {
    return { error: 'Not authenticated' };
  }

  const trainerAuthUid = claims.sub;
  const token = crypto.randomUUID();
  const adminClient = createAdminClient();

  const { error: insertError } = await adminClient
    .from('invite_links')
    .insert({
      trainer_auth_uid: trainerAuthUid,
      token,
    });

  if (insertError) {
    return { error: 'Failed to generate invite link. Please try again.' };
  }

  // Return the full URL — use NEXT_PUBLIC_APP_URL if set, otherwise a relative path
  // The client component will prepend window.location.origin if needed
  return { url: `/join/${token}` };
}
```

Notes:
- Uses `getClaims()` for the trainer's UID (local JWT validation, no network call)
- Uses `adminClient` (service_role) for the INSERT — the migration has no INSERT RLS policy for this table (INSERT is intended to bypass RLS via admin client, per the migration SQL comment)
- `crypto.randomUUID()` is available natively in Node.js and Vercel Edge Runtime — no dependency needed
- Returns `{ url: string }` on success or `{ error: string }` on failure — client handles both
  </action>
  <verify>
    <automated>cd "/Users/piotrsowinski/sources/Private/GYM AI ASSISTANT" && npx tsc --noEmit 2>&1 | grep -E "trainer/actions|No error" || echo "Check file exists"</automated>
  </verify>
  <done>File exists at src/app/(trainer)/trainer/actions.ts, exports `generateInviteLink`, TypeScript compiles without errors in this file</done>
</task>

<task type="auto">
  <name>Task 2: Build InviteDialog client component</name>
  <files>src/app/(trainer)/trainer/_components/InviteDialog.tsx</files>
  <action>
Create `src/app/(trainer)/trainer/_components/InviteDialog.tsx` as a Client Component. This component will be imported by the trainer home page in Plan 05.

```typescript
'use client';
import { useState, useTransition } from 'react';
import { generateInviteLink } from '../actions';

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    setLink(null);
    setError(null);
    setCopied(false);

    startTransition(async () => {
      const result = await generateInviteLink();
      if ('error' in result) {
        setError(result.error);
      } else {
        // Build full URL from relative path
        const fullUrl = `${window.location.origin}${result.url}`;
        setLink(fullUrl);
      }
    });
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        + Invite trainee
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Invite a trainee</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Share this link with your trainee. They&apos;ll be connected to your roster after
              signing up or logging in.
            </p>

            {isPending && (
              <div className="text-sm text-gray-400 animate-pulse">Generating link…</div>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {link && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700 truncate flex-1 font-mono">{link}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```
  </action>
  <verify>
    <automated>cd "/Users/piotrsowinski/sources/Private/GYM AI ASSISTANT" && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0 errors"</automated>
  </verify>
  <done>
    - `src/app/(trainer)/trainer/_components/InviteDialog.tsx` exists as a Client Component with `'use client'` directive
    - Component exports `InviteDialog` function
    - TypeScript compiles without errors in this file
  </done>
</task>

</tasks>

<verification>
Run `npx tsc --noEmit` from the project root — TypeScript must compile without errors.

Key behaviors to verify manually once migration is applied and Plan 05 has wired the component into trainer/page.tsx:
1. Navigate to /trainer as a logged-in trainer
2. Click "+ Invite trainee" — a dialog opens showing "Generating link…"
3. A link of the form `https://[host]/join/[uuid]` appears
4. Clicking "Copy link" copies to clipboard and shows "Copied!" feedback
5. Confirm in Supabase Table Editor: a new row appears in `invite_links` with the correct `trainer_auth_uid` and a UUID `token`, `revoked_at` is NULL
</verification>

<success_criteria>
- `src/app/(trainer)/trainer/actions.ts` exports `generateInviteLink` Server Action that inserts into `invite_links` using admin client
- `src/app/(trainer)/trainer/_components/InviteDialog.tsx` is a functional Client Component with `'use client'` directive that calls the action and displays the link
- TypeScript compilation passes
- Plan 05 (wave 2) will import `InviteDialog` into the trainer home page
- CONN-01 and CONN-02 are satisfiable: trainer can generate an invite link that a trainee can use to join
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-04-SUMMARY.md`
</output>
