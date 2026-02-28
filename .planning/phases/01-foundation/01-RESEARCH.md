# Phase 1: Foundation - Research

**Researched:** 2026-03-01
**Domain:** Supabase Auth (email/password + Google OAuth), Next.js App Router middleware, role enforcement, invite-link connection flow, multi-tenant RLS
**Confidence:** HIGH (core auth and RLS patterns verified against current Supabase official docs; invite-link pattern from architecture research + verified Postgres patterns; getClaims() behavior verified against official API reference)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Sign-up flow**
- Separate sign-up pages per role: `/signup/trainer` and `/signup/trainee`
- Each page has both email/password fields AND a "Sign up with Google" button
- Role is determined by which page the user came from (not a picker after the fact)
- Email verification is required before accessing the app — verified email gates the entire app
- Password reset is deferred (admin resets manually for early users)

**Post-registration landing**
- Trainer lands on the plan builder (Phase 3 will build this — Phase 1 should show an empty state with "Create your first plan" CTA)
- Trainee lands on their current plan screen (Phase 3/4 will build this — Phase 1 shows "Waiting for your trainer to assign a plan")

**Home screens**
- Trainer home screen = roster of trainees (the roster IS the home, not a section of a dashboard)
- Trainee home screen = their currently assigned plan (empty state: "Waiting for your trainer")

**Google login**
- Supabase Google OAuth on both `/signup/trainer` and `/signup/trainee`
- Role is assigned at the OAuth signup moment based on which page button was clicked
- Returning Google users go directly to their role-appropriate home (no role re-selection)

**Invite & connection flow**
- Trainer generates a shareable link (e.g. `app.com/join/[token]`) — no code, just link
- Links do not expire and stay valid until the trainer revokes them
- When a trainee clicks the invite link:
  - If already logged in → auto-connect to the trainer immediately
  - If not logged in → redirect to `/signup/trainee` with trainer context preserved; after signup, auto-connect
- One trainer per trainee — a trainee cannot be connected to multiple trainers simultaneously
- If a trainee is already connected and clicks a different trainer's invite, they must disconnect first

**Connection management**
- Trainer can remove a trainee from their roster (trainee loses plan access)
- Trainee can also disconnect from their side
- Both actions end the connection symmetrically

**Roster UI (trainer home screen)**
- Each trainee card shows: profile photo/avatar, name, assigned plan name, last activity date, connection status (active / no plan assigned)
- Trainer can generate invite link from the roster screen (e.g. "+ Invite trainee" button)

**Session behavior**
- Sessions last 30 days, refreshed on activity
- Silent token refresh in background — user never sees a re-login prompt mid-workout
- Multiple devices simultaneously allowed (phone + laptop for trainers)

### Claude's Discretion
- Exact avatar/placeholder design when no profile photo is set
- Empty roster state illustration and copy
- Exact invite link revocation UX (button placement on roster)
- Loading states and error handling for OAuth callback

### Deferred Ideas (OUT OF SCOPE)
- Password reset flow — deferred (admin handles manually for early users)
- Profile editing (name, photo upload) — not in Phase 1 scope; Phase 1 uses whatever Google/signup provides
- Trainee connecting to multiple trainers — explicitly one trainer per trainee for v1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password | Supabase `signUp()` with email/password; separate `/signup/trainer` and `/signup/trainee` routes; role written to `app_metadata` at signup via Server Action calling `auth.admin.updateUserById()` |
| AUTH-02 | User selects role at signup (trainer or trainee) | Role determined by which signup page is used; stored in `raw_app_meta_data` via Admin API (server-only, not user-modifiable); Google OAuth role assigned in callback based on `redirectTo` query param carrying role context |
| AUTH-03 | User can log in and stay logged in across sessions | `@supabase/ssr` cookie-based sessions; middleware refreshes tokens on every request; Supabase default 30-day session with refresh; `getClaims()` validates JWT locally for fast middleware checks |
| AUTH-04 | User can log out from any page | `supabase.auth.signOut()` client-side clears session cookie; middleware immediately redirects unauthenticated requests to `/login` |
| CONN-01 | Trainer can add a trainee directly by email | Trainer submits trainee email via Server Action; creates `trainer_trainee_connections` row with `pending` status and `invited_by_email`; no Supabase auth invite sent — connection is confirmed when trainee signs up/logs in and claims the pending connection |
| CONN-02 | Trainer can generate an invite link/code for a trainee to join | Trainer clicks "+ Invite trainee"; Server Action generates `invite_token` (crypto.randomUUID()); stores in `invite_links` table with `trainer_id`; returns `app.com/join/[token]` URL; links do not expire |
| CONN-03 | Trainee can join a trainer by clicking invite link | `/join/[token]` page reads token from DB; if logged in → creates connection immediately; if not → redirects to `/signup/trainee?invite=[token]`; after signup, auto-connects using token from query param |
| CONN-04 | Trainer can view their roster of connected trainees | `trainer_trainee_connections` table queried by `trainer_id = auth.uid()`; RLS ensures isolation; trainer sees only their own connections |
</phase_requirements>

---

## Summary

Phase 1 is entirely about identity, access, and connection. The core technical challenge is correctly wiring Supabase Auth (email/password + Google OAuth) with Next.js App Router's server-first architecture while storing role information in a tamper-proof location (`raw_app_meta_data`), enforcing email verification as an app-wide gate, and building an invite-link connection system using a simple Postgres table.

The stack choice (Next.js 15 App Router + Supabase + `@supabase/ssr`) is well-supported by official documentation. The critical findings for this phase are: (1) Supabase recently introduced `getClaims()` as the preferred middleware auth method — it validates JWT signatures locally using WebCrypto without a server round-trip unless the session is expiring, making it faster than `getUser()` while remaining secure; (2) role must be stored in `raw_app_meta_data` via the Admin API, never in a user-editable table; (3) Google OAuth role assignment requires preserving the role through the PKCE callback using the `redirectTo` query parameter or state; (4) the invite link system is implemented as a simple Postgres table with `crypto.randomUUID()` tokens — no third-party library needed.

**Primary recommendation:** Use `@supabase/ssr` with `getClaims()` in middleware for fast, secure auth. Store role in `raw_app_meta_data` via Admin API Server Action at signup. Implement invite links as a plain Postgres table with UUID tokens — simple, auditable, and fully under your control.

---

## Standard Stack

### Core (Phase 1 specific)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2 | Supabase client for auth + DB | Official client; handles session lifecycle, OAuth, cookie storage |
| `@supabase/ssr` | ^0.5 | Supabase Auth in Next.js App Router | Required for cookie-based session management in Server Components and middleware; replaces deprecated `@supabase/auth-helpers-nextjs` |
| Next.js | 15.x (App Router) | Full-stack React framework | Route groups for role separation, middleware for auth guard, Server Actions for admin-privileged operations |
| TypeScript | 5.x | Type safety | Drizzle schema types flow through to query results; RLS policy shape errors caught at compile time |

### Supporting (Phase 1 specific)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | ^3.23 | Validate signup form inputs | Validate email format, password strength server-side in Server Action before calling Supabase |
| React Hook Form | ^7 | Form state for signup/login forms | Minimal re-renders; works with Next.js Server Actions for progressive enhancement |
| Drizzle ORM | ^0.39 + `drizzle-kit` | Schema definitions + migrations | Define `trainers`, `trainees`/`users`, `invite_links`, `trainer_trainee_connections` tables; run migrations via Drizzle Kit |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `raw_app_meta_data` for role | `user_roles` table + auth hook | Auth hook approach is more flexible for complex RBAC but adds a Postgres function; `app_metadata` is sufficient for a binary trainer/trainee role and simpler to set up |
| `getClaims()` in middleware | `getUser()` in middleware | `getUser()` makes a network call to Supabase Auth on every request; `getClaims()` validates locally (faster); use `getUser()` only when you need to confirm the user still exists/isn't banned |
| UUID invite tokens | JWT-signed invite tokens | JWTs can embed payload without a DB lookup but require signing key management; plain UUIDs stored in DB are simpler, auditable, and revocable (just delete the row) |
| `crypto.randomUUID()` for invite token | `nanoid` / `uuid` package | `crypto.randomUUID()` is available in Node.js 19+ and Vercel Edge Runtime natively; no dependency needed |

**Installation:**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install drizzle-orm postgres
npm install zod react-hook-form @hookform/resolvers
npm install -D drizzle-kit
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)

```
src/
├── app/
│   ├── (auth)/                         # Auth pages — no app shell, no sidebar
│   │   ├── login/page.tsx              # Email/password login + Google OAuth button
│   │   ├── signup/
│   │   │   ├── trainer/page.tsx        # Trainer signup (email/password + Google)
│   │   │   └── trainee/page.tsx        # Trainee signup (email/password + Google)
│   │   └── verify-email/page.tsx       # "Check your email" gate after signup
│   ├── (trainer)/                      # Trainer route group — protected, role=trainer
│   │   ├── layout.tsx                  # Trainer shell layout
│   │   └── page.tsx                    # Trainer home = trainee roster (CONN-04)
│   ├── (trainee)/                      # Trainee route group — protected, role=trainee
│   │   ├── layout.tsx                  # Trainee shell layout
│   │   └── page.tsx                    # Trainee home = "Waiting for trainer" empty state
│   ├── auth/
│   │   └── callback/route.ts           # PKCE callback: exchange code, set session, assign role, redirect
│   ├── join/
│   │   └── [token]/page.tsx            # Invite link landing (CONN-03)
│   └── api/
│       └── invite/route.ts             # Generate invite link (CONN-02)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # createBrowserClient (client components)
│   │   ├── server.ts                   # createServerClient (Server Components/Actions)
│   │   └── admin.ts                    # createAdminClient with service_role key (Server only)
│   └── db/
│       ├── schema.ts                   # Drizzle schema: all Phase 1 tables
│       └── migrations/                 # Drizzle Kit output
└── middleware.ts                       # Auth guard + role-based routing
```

### Pattern 1: Middleware Auth Guard with getClaims()

**What:** `middleware.ts` reads the Supabase JWT using `getClaims()` (no network round-trip for valid tokens), checks if the user is authenticated and email-verified, then enforces role-based routing.

**When to use:** Every request to protected routes. Middleware runs at the edge before any page renders.

**Why `getClaims()` over `getUser()`:** `getUser()` makes a network request to Supabase Auth on every request. `getClaims()` validates the JWT signature locally using WebCrypto (for asymmetric keys) — only hits the network if the session is about to expire. Significantly faster for middleware where every millisecond of latency matters.

**Example:**
```typescript
// src/middleware.ts
// Source: Supabase official docs https://supabase.com/docs/guides/auth/server-side/nextjs
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() validates JWT locally — no network call unless session expiring
  const { data: { claims }, error } = await supabase.auth.getClaims();

  const path = request.nextUrl.pathname;
  const publicPaths = ['/login', '/signup', '/auth', '/join'];
  const isPublic = publicPaths.some(p => path.startsWith(p));

  if (!claims || error) {
    if (!isPublic) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // Email verification gate
  if (!claims.email_confirmed_at && !isPublic) {
    return NextResponse.redirect(new URL('/verify-email', request.url));
  }

  const role = claims.app_metadata?.role as 'trainer' | 'trainee' | undefined;

  // Role-based route protection
  if (role === 'trainee' && path.startsWith('/trainer')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (role === 'trainer' && path.startsWith('/trainee')) {
    return NextResponse.redirect(new URL('/trainer', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### Pattern 2: Role Assignment at Signup via Admin API

**What:** A Server Action handles signup (both email/password and OAuth callback) and calls the Supabase Admin API to set `role` in `raw_app_meta_data`. This field is server-only and cannot be modified by the user through the Supabase JS client.

**When to use:** Immediately after `auth.signUp()` succeeds (for email/password) or in the OAuth callback route handler (for Google).

**Critical:** The Admin client uses the `service_role` key — NEVER expose this to the browser. Only call from Server Actions or Route Handlers.

**Example:**
```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only, never expose to client
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

```typescript
// app/(auth)/signup/trainer/actions.ts — Server Action
'use server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function signUpTrainer(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error || !data.user) throw error;

  // Set role in app_metadata (server-side only, user cannot change this)
  await adminClient.auth.admin.updateUserById(data.user.id, {
    app_metadata: { role: 'trainer' },
  });

  // Create trainer profile row
  await supabase.from('trainers').insert({
    auth_uid: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.full_name ?? '',
  });

  // Redirect to email verification gate
  redirect('/verify-email');
}
```

### Pattern 3: Google OAuth with Role Context Preserved

**What:** The "Sign up with Google" button on `/signup/trainer` or `/signup/trainee` passes the role through the OAuth flow via the `redirectTo` query parameter. The PKCE callback route reads the role from the query param and assigns it via Admin API.

**Critical nuance:** `signInWithOAuth` accepts a `redirectTo` URL. You can append query params to this URL (e.g., `?role=trainer`) to carry state through the Google redirect. The callback route reads this param.

**Example:**
```typescript
// app/(auth)/signup/trainer/page.tsx (client component portion)
'use client';
import { createClient } from '@/lib/supabase/client';

async function handleGoogleSignup() {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // role=trainer carried through the OAuth redirect
      redirectTo: `${window.location.origin}/auth/callback?role=trainer`,
    },
  });
}
```

```typescript
// app/auth/callback/route.ts
// Source: https://supabase.com/docs/guides/auth/social-login/auth-google
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') as 'trainer' | 'trainee' | null;
  // invite token from Google OAuth trainee flow
  const inviteToken = searchParams.get('invite');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const adminClient = createAdminClient();
      const existingRole = data.user.app_metadata?.role;

      // Only assign role on first OAuth login (new user)
      if (!existingRole && role) {
        await adminClient.auth.admin.updateUserById(data.user.id, {
          app_metadata: { role },
        });

        // Create profile row for new OAuth user
        if (role === 'trainer') {
          await supabase.from('trainers').insert({
            auth_uid: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name ?? '',
          });
        } else {
          await supabase.from('users').insert({
            auth_uid: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name ?? '',
            role: 'trainee',
          });
          // Auto-connect if invite token present
          if (inviteToken) {
            await claimInviteToken(supabase, data.user.id, inviteToken);
          }
        }
      }

      // Redirect returning users to their role-appropriate home
      const finalRole = existingRole ?? role;
      const destination = finalRole === 'trainer' ? '/trainer' : '/trainee';
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```

### Pattern 4: Invite Link Flow

**What:** Trainer generates a `crypto.randomUUID()` invite token stored in `invite_links` table. The link `app.com/join/[token]` handles both logged-in and logged-out trainees.

**When to use:** CONN-02 and CONN-03 requirements.

**Example:**
```typescript
// Database schema for invite links
// lib/db/schema.ts (Drizzle)
export const inviteLinks = pgTable('invite_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerAuthUid: uuid('trainer_auth_uid').notNull().references(() => trainers.authUid),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  // No expiry — links are permanent until revoked
});

// Unique constraint: one active connection per trainee
export const trainerTraineeConnections = pgTable('trainer_trainee_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerAuthUid: uuid('trainer_auth_uid').notNull().references(() => trainers.authUid),
  traineeAuthUid: uuid('trainee_auth_uid').notNull().unique(), // UNIQUE enforces 1 trainer per trainee
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow(),
  inviteLinkId: uuid('invite_link_id').references(() => inviteLinks.id),
}, (table) => ({
  // Ensure trainee has at most one active connection
  uniqueTrainee: unique().on(table.traineeAuthUid),
}));
```

```typescript
// app/join/[token]/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function JoinPage({ params }: { params: { token: string } }) {
  const supabase = await createClient();
  const { data: { claims } } = await supabase.auth.getClaims();

  // Validate the invite token exists and is not revoked
  const { data: invite } = await supabase
    .from('invite_links')
    .select('id, trainer_auth_uid, revoked_at')
    .eq('token', params.token)
    .single();

  if (!invite || invite.revoked_at) {
    // Invalid or revoked link
    redirect('/invite-invalid');
  }

  if (!claims) {
    // Not logged in — send to trainee signup with invite token preserved
    redirect(`/signup/trainee?invite=${params.token}`);
  }

  const traineeUid = claims.sub;

  // Check for existing connection
  const { data: existing } = await supabase
    .from('trainer_trainee_connections')
    .select('trainer_auth_uid')
    .eq('trainee_auth_uid', traineeUid)
    .single();

  if (existing) {
    if (existing.trainer_auth_uid === invite.trainer_auth_uid) {
      // Already connected to this trainer
      redirect('/trainee');
    }
    // Connected to a different trainer — show conflict screen
    redirect(`/join/${params.token}/conflict`);
  }

  // Auto-connect: create the connection
  await supabase.from('trainer_trainee_connections').insert({
    trainer_auth_uid: invite.trainer_auth_uid,
    trainee_auth_uid: traineeUid,
    invite_link_id: invite.id,
  });

  redirect('/trainee');
}
```

### Pattern 5: Email Verification Gate

**What:** Supabase sends a confirmation email after `signUp()`. While unverified, `email_confirmed_at` is null in the JWT claims. Middleware redirects unverified users to `/verify-email` on every protected route attempt.

**Configuration:** In Supabase Dashboard → Auth → Email → enable "Confirm email". On hosted Supabase, this is enabled by default.

**Verified user detection in middleware:**
```typescript
const isEmailVerified = !!claims?.email_confirmed_at;
if (!isEmailVerified && !isPublic) {
  return NextResponse.redirect(new URL('/verify-email', request.url));
}
```

### Anti-Patterns to Avoid

- **Role in a user-editable table:** Any trainee can call `UPDATE users SET role = 'trainer'`. Store role exclusively in `raw_app_meta_data` via Admin API. RLS policies that read `role` from a user table are not secure.
- **`getSession()` for server-side auth:** `getSession()` reads from cookies without revalidating the JWT. In server code, always use `getClaims()` (fast, local JWT validation) or `getUser()` (network call, confirms user still exists) instead.
- **`getUser()` in middleware:** Makes a network round-trip to Supabase Auth on every single request. Use `getClaims()` instead — validates locally and only hits the network when the session is near expiry.
- **Exposing `service_role` key to client:** The Admin client (`createAdminClient`) must only be instantiated in Server Actions or Route Handlers. Never pass it to client components.
- **Not handling the "already connected" state in invite flow:** If a trainee clicks a second trainer's invite link, don't silently overwrite the existing connection — show a clear conflict screen explaining they must disconnect first.
- **RLS disabled on new tables:** Supabase creates tables with RLS disabled by default when using external tools or raw SQL. Always enable RLS and add at least a deny-all policy in the same migration that creates the table.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management and cookie refresh | Custom JWT cookie logic | `@supabase/ssr` `createServerClient` in middleware | Token expiry edge cases, secure cookie attributes (`HttpOnly`, `SameSite`, `Secure`) are all handled; hand-rolled implementations miss edge cases |
| OAuth PKCE flow | Custom code verifier/challenge | Supabase `signInWithOAuth()` + `exchangeCodeForSession()` | PKCE requires cryptographically secure random generation, SHA-256 hashing, correct base64url encoding; Supabase handles all of this |
| Password hashing | `bcrypt` or custom hash | Supabase Auth built-in | Supabase uses bcrypt with appropriate cost factors; storing passwords yourself adds compliance scope |
| Email verification | Custom email + token table | Supabase Auth built-in email confirmation | Rate limiting, token expiry, resend logic, email template management — all handled |
| Invite token storage | JWT-signed tokens | Plain UUID in `invite_links` table | JWTs require signing key management and cannot be easily revoked without a blocklist; a simple DB row can be deleted to revoke instantly |
| Role enforcement logic | Per-component auth checks | Middleware + RLS (two-layer defense) | Per-component checks are easy to forget; middleware + RLS ensures every request is guarded at two independent layers |

**Key insight:** Supabase Auth handles the hardest parts of authentication (PKCE, token refresh, email confirmation, secure storage). The only custom work is role assignment (writing to `app_metadata`) and the invite-link connection model (simple Postgres table).

---

## Common Pitfalls

### Pitfall 1: Google OAuth Role Lost on Return Visits

**What goes wrong:** A trainer signs up with Google, gets the `trainer` role set correctly. They sign out and sign in again. The `role` param is gone from the callback URL (they use the login page now), so the callback tries to set role again — or worse, the callback checks `existingRole` incorrectly and overwrites it with null.

**Why it happens:** The callback route doesn't distinguish between new OAuth signups (role must be set) and returning OAuth logins (role already set — do not touch).

**How to avoid:** In the callback route, check `data.user.app_metadata?.role` before setting role. If a role already exists, skip the `updateUserById` call and use the existing role for redirect. Only call Admin API when `existingRole` is null/undefined.

**Warning signs:** Returning users being sent to the wrong home page or losing their role.

### Pitfall 2: RLS Not Enabled on Phase 1 Tables

**What goes wrong:** `invite_links` or `trainer_trainee_connections` tables are created without RLS. Any authenticated user can read all invite links and all trainer-trainee connections across the entire platform.

**Why it happens:** Supabase's SQL Editor runs as superuser (bypasses RLS). Tests pass in development but data leaks in production client SDK calls.

**How to avoid:** Enable RLS and add a deny-all default in the same SQL migration that creates each table. Then add specific policies:

```sql
-- Example for invite_links
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "default_deny" ON invite_links FOR ALL USING (false);
CREATE POLICY "trainer_manages_own_invites" ON invite_links
  FOR ALL USING (trainer_auth_uid = auth.uid());
-- Trainee can read an invite link to claim it (just the token lookup)
CREATE POLICY "trainee_reads_invite_by_token" ON invite_links
  FOR SELECT USING (true);  -- Token itself is the secret; revoked_at gates usage
```

**Warning signs:** Testing data access via Supabase Studio SQL Editor (runs as superuser, bypasses RLS) and concluding RLS is working.

### Pitfall 3: Invite Token Preserved Through OAuth Redirect

**What goes wrong:** Trainee clicks invite link → not logged in → redirected to `/signup/trainee?invite=TOKEN` → clicks "Sign up with Google" → OAuth redirect begins → `invite` query param is lost → after OAuth, trainee lands on their home with no connection.

**Why it happens:** `signInWithOAuth` redirects to Google, then to your callback. Any local state (like the invite token from the query param) is lost unless explicitly carried through `redirectTo`.

**How to avoid:** When the trainee clicks "Sign up with Google" from `/signup/trainee?invite=TOKEN`, include the invite token in the `redirectTo`:

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/auth/callback?role=trainee&invite=${inviteToken}`,
  },
});
```

The callback route then reads `invite` from the URL and creates the connection after session exchange.

**Warning signs:** Trainees completing Google OAuth from an invite link but landing on the "Waiting for trainer" empty state instead of being connected.

### Pitfall 4: One-Trainer-Per-Trainee Constraint Enforced Only in App Code

**What goes wrong:** App code checks for existing connection before inserting. But two simultaneous requests (race condition) both find no existing connection and both insert. Trainee ends up with two connections.

**Why it happens:** Application-level uniqueness checks are not atomic.

**How to avoid:** Enforce uniqueness at the database level with a `UNIQUE` constraint on `trainer_trainee_connections.trainee_auth_uid`. The database rejects the second insert with a unique violation, which the application handles gracefully:

```sql
ALTER TABLE trainer_trainee_connections
  ADD CONSTRAINT trainee_unique_connection UNIQUE (trainee_auth_uid);
```

Handle the unique violation error in the Server Action and show a clear message.

### Pitfall 5: Session Duration Not Configured

**What goes wrong:** Users are logged out after 1 hour (Supabase default access token expiry). The requirement is 30 days of persistent login. Mid-workout logout is unacceptable.

**Why it happens:** Supabase's access token expires after 1 hour by default. Without the refresh token mechanism functioning, users see re-login prompts.

**How to avoid:** The `@supabase/ssr` middleware handles silent token refresh automatically — as long as middleware runs on every request and correctly sets refreshed cookies in the response. Verify that the middleware matcher includes all protected routes (not just API routes). In Supabase Dashboard, confirm "JWT expiry" is set to 3600s (1hr access token) and "Refresh token reuse interval" is set appropriately. The 30-day persistent session is controlled by the refresh token lifetime (default: 1 week in some configs — set to 30 days in Supabase Dashboard → Auth → General → "Refresh token expiry").

---

## Code Examples

Verified patterns from official sources:

### Browser Supabase Client (Client Components)

```typescript
// src/lib/supabase/client.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

### Server Supabase Client (Server Components / Actions)

```typescript
// src/lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Admin Supabase Client (Server Actions / Route Handlers only)

```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // NEVER expose to browser
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

### Setting Role in app_metadata via Admin API

```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid
const adminClient = createAdminClient();
const { data: user, error } = await adminClient.auth.admin.updateUserById(
  userId,
  { app_metadata: { role: 'trainer' } } // 'trainer' or 'trainee'
);
```

### Phase 1 Drizzle Schema

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const trainers = pgTable('trainers', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUid: uuid('auth_uid').notNull().unique(), // references auth.users(id)
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Generic users table for trainees (and future roles)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUid: uuid('auth_uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: ['trainee'] }).notNull(), // Phase 1: trainee only
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

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
}, (table) => ({
  // CRITICAL: one trainer per trainee
  uniqueTrainee: unique('trainee_unique_connection').on(table.traineeAuthUid),
}));
```

### RLS Policies for Phase 1 Tables

```sql
-- trainers table
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainer_sees_own_row" ON trainers
  FOR ALL USING (auth_uid = auth.uid());

-- users table (trainees)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sees_own_row" ON users
  FOR ALL USING (auth_uid = auth.uid());
-- Trainer can see their connected trainees
CREATE POLICY "trainer_sees_connected_trainees" ON users
  FOR SELECT USING (
    auth_uid IN (
      SELECT trainee_auth_uid FROM trainer_trainee_connections
      WHERE trainer_auth_uid = auth.uid()
    )
  );

-- invite_links table
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainer_manages_own_invites" ON invite_links
  FOR ALL USING (trainer_auth_uid = auth.uid());
-- Anyone can read an invite link to validate a token (token is the secret)
CREATE POLICY "public_can_read_invite" ON invite_links
  FOR SELECT USING (true);

-- trainer_trainee_connections table
ALTER TABLE trainer_trainee_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainer_sees_own_connections" ON trainer_trainee_connections
  FOR SELECT USING (trainer_auth_uid = auth.uid());
CREATE POLICY "trainee_sees_own_connection" ON trainer_trainee_connections
  FOR SELECT USING (trainee_auth_uid = auth.uid());
-- Insert: Server Action with admin client handles this (bypasses RLS)
-- Delete: both trainer and trainee can disconnect
CREATE POLICY "disconnect" ON trainer_trainee_connections
  FOR DELETE USING (
    trainer_auth_uid = auth.uid() OR trainee_auth_uid = auth.uid()
  );
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | ~2023 | auth-helpers is deprecated; `@supabase/ssr` is the official package; migration guide exists |
| `getSession()` for server-side auth | `getClaims()` (preferred) or `getUser()` | Late 2024 | `getClaims()` validates JWT locally without a network call; much faster for middleware; `getSession()` is insecure for server contexts |
| `getUser()` in middleware | `getClaims()` in middleware | Late 2024/2025 | `getUser()` makes a network request on every request; `getClaims()` validates locally, only hits network when session near expiry |
| Tables created without RLS | Supabase dashboard auto-enables RLS on new tables | 2025 | Tables created via Supabase Dashboard now have RLS enabled by default; tables created via external SQL tools still need manual RLS enablement |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` env var | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` env var | Recent | Some official Supabase docs now use `PUBLISHABLE_KEY` naming; both work, but new projects may see this naming |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated, no further updates. Use `@supabase/ssr`.
- `getSession()` in server code: Insecure for server-side auth checks. Use `getClaims()` or `getUser()`.

---

## Open Questions

1. **Exact env var naming convention (`ANON_KEY` vs `PUBLISHABLE_KEY`)**
   - What we know: Recent Supabase SSR docs show `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Older docs use `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Both refer to the same key value.
   - What's unclear: Whether the Supabase dashboard now labels it "publishable key" or still "anon key".
   - Recommendation: Use whichever the Supabase dashboard shows as the label for that project. Functionally identical.

2. **Refresh token lifetime for 30-day session requirement**
   - What we know: Access tokens expire in 1 hour. Refresh tokens extend the session. The requirement is 30 days of persistent login without re-entry.
   - What's unclear: Whether the default Supabase refresh token lifetime is 30 days or shorter (varies by plan/configuration).
   - Recommendation: Check Supabase Dashboard → Auth → General configuration and explicitly set "Refresh token expiry" to 2592000 seconds (30 days). Verify during setup.

3. **Server-side `signInWithOAuth` vs client-side for SSR**
   - What we know: `signInWithOAuth()` is typically called client-side to initiate the browser redirect. Server-side OAuth initiation is possible but adds complexity.
   - What's unclear: Whether the signup pages should be Server Components (for SEO) with a client form, or fully Client Components.
   - Recommendation: Make the signup pages Server Components with a `'use client'` child for the form. The OAuth button handler (`signInWithOAuth`) must run client-side since it triggers a browser redirect.

4. **`invite_links` read policy security**
   - What we know: The token itself acts as the secret. The RLS policy "public can read invite" would allow any authenticated user to enumerate all tokens if they know the `id`.
   - What's unclear: Whether exposing invite token rows to all authenticated users is acceptable, or if lookup should go through a Server Action (bypassing RLS).
   - Recommendation: Route invite token validation through a Server Action using the admin client to avoid exposing the RLS surface. The `token` column has a `UNIQUE` constraint — only a direct token lookup is needed, not enumeration.

---

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) - middleware setup, `createServerClient`, `createBrowserClient`, `getClaims()` vs `getUser()` recommendation
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google) - PKCE callback route pattern, `signInWithOAuth` with `redirectTo`
- [Supabase admin.updateUserById](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid) - setting `app_metadata.role` server-side
- [Supabase getClaims() reference](https://supabase.com/docs/reference/javascript/auth-getclaims) - local JWT validation, `data.claims.app_metadata.role` access pattern
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - `(SELECT auth.uid())` wrapping for performance
- [Supabase RBAC Guide](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) - role storage patterns
- [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords) - email confirmation behavior; `session: null` when email unverified
- Project `.planning/research/ARCHITECTURE.md` - data model, RLS policy patterns, route group structure (researched 2026-02-28, HIGH confidence)
- Project `.planning/research/STACK.md` - `@supabase/ssr`, Next.js 15 App Router stack (researched 2026-02-28, HIGH confidence)
- Project `.planning/research/PITFALLS.md` - RLS pitfalls, role storage pitfalls (researched 2026-02-28, HIGH confidence)

### Secondary (MEDIUM confidence)
- [getClaims vs getUser discussion](https://www.answeroverflow.com/m/1456759016762900500) - practical comparison; verified against official getClaims docs
- [Supabase custom claims RBAC community repo](https://github.com/supabase-community/supabase-custom-claims) - auth hook pattern for adding role to JWT if needed in future
- [Supabase user_metadata vs app_metadata discussion](https://github.com/orgs/supabase/discussions/1148) - confirms `raw_app_meta_data` is not user-modifiable

### Tertiary (LOW confidence — flag for validation)
- Refresh token lifetime defaults: Multiple sources suggest 1 week default; official Supabase docs don't state a clear default. Validate in dashboard during project setup.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@supabase/ssr`, Next.js App Router, Drizzle ORM all verified against official docs with current-dated sources
- Architecture: HIGH — Route group pattern, middleware structure, Server Action for Admin API all verified; invite-link pattern is a straightforward Postgres table design with well-understood primitives
- `getClaims()` behavior: HIGH — verified against official API reference and GitHub issues; confirmed it validates locally for asymmetric keys
- Pitfalls: HIGH — role security, RLS configuration, OAuth state preservation all backed by official docs and known community issues
- Refresh token 30-day config: MEDIUM — needs validation during Supabase project setup

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (Supabase auth patterns are stable; `getClaims()` is relatively new — recheck if Supabase SDK major version changes)
