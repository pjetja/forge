---
phase: 01-foundation
plan: 03
type: execute
wave: 2
depends_on:
  - "01-PLAN"
files_modified:
  - src/middleware.ts
  - src/app/(trainer)/layout.tsx
  - src/app/(trainer)/page.tsx
  - src/app/(trainee)/layout.tsx
  - src/app/(trainee)/page.tsx
autonomous: true
requirements:
  - AUTH-03
  - AUTH-04

must_haves:
  truths:
    - "Unauthenticated requests to any protected route are redirected to /login"
    - "Authenticated users with unverified email are redirected to /verify-email on any protected route"
    - "A trainee accessing a /trainer/* route is redirected to /trainee"
    - "A trainer accessing a /trainee/* route is redirected to /trainer"
    - "Sessions are silently refreshed — middleware calls createServerClient and returns updated cookies on every request"
    - "The trainer home page (/) within the trainer route group shows an empty roster state"
    - "The trainee home page (/) within the trainee route group shows a waiting-for-trainer empty state"
    - "A sign out button is accessible from both home pages and invokes the signOut Server Action"
  artifacts:
    - path: "src/middleware.ts"
      provides: "Auth guard and role-based routing using getClaims()"
      contains: "getClaims"
    - path: "src/app/(trainer)/layout.tsx"
      provides: "Trainer app shell with sign-out action wired in"
      contains: "signOut"
    - path: "src/app/(trainer)/page.tsx"
      provides: "Trainer home — empty roster state with invite CTA placeholder"
      contains: "Invite trainee"
    - path: "src/app/(trainee)/page.tsx"
      provides: "Trainee home — waiting for trainer empty state"
      contains: "Waiting"
  key_links:
    - from: "src/middleware.ts"
      to: "claims.app_metadata.role"
      via: "getClaims() local JWT validation"
      pattern: "getClaims"
    - from: "src/middleware.ts"
      to: "claims.email_confirmed_at"
      via: "email verification gate"
      pattern: "email_confirmed_at"
    - from: "src/app/(trainer)/layout.tsx"
      to: "src/app/(auth)/login/actions.ts"
      via: "signOut import"
      pattern: "import.*signOut"
---

<objective>
Wire the middleware auth guard (getClaims() + role routing + email verification gate), create the trainer and trainee route group shells with role-appropriate home screens, and connect the sign-out action. This makes the full auth loop functional: sign in → land on role home → sign out → back to login.

Purpose: Without middleware, all routes are unprotected. Without home screens, there is nowhere to land after login. This plan closes the auth loop (AUTH-03 session persistence, AUTH-04 sign out).
Output: Middleware protecting all routes, trainer home with empty roster state, trainee home with waiting state, sign-out available from both shells.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-01-SUMMARY.md

<interfaces>
<!-- Key patterns from research. Executor uses these directly. -->

getClaims() middleware pattern (from RESEARCH.md — verified against official Supabase docs):
```typescript
// getClaims() validates JWT locally (WebCrypto) — no network round-trip unless session near expiry
// Use instead of getUser() (network) or getSession() (insecure for server-side)
const { data: { claims }, error } = await supabase.auth.getClaims();
// claims.app_metadata?.role → 'trainer' | 'trainee' | undefined
// claims.email_confirmed_at → string | null  (null = email not verified)
// claims.sub → user ID string
```

Middleware cookie refresh pattern (from official Supabase SSR docs):
```typescript
// createServerClient in middleware must read cookies from request AND write updated cookies to response
// This is what makes silent token refresh work — refreshed tokens are written to response cookies
let response = NextResponse.next({ request });
const supabase = createServerClient(url, key, {
  cookies: {
    getAll() { return request.cookies.getAll(); },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      );
    },
  },
});
```

Route group structure (from RESEARCH.md):
- `(auth)` group: `/login`, `/signup/trainer`, `/signup/trainee`, `/verify-email` — no app shell
- `(trainer)` group: protected, role=trainer, has app shell
- `(trainee)` group: protected, role=trainee, has app shell

signOut Server Action (from Plan 02):
```typescript
import { signOut } from '@/app/(auth)/login/actions';
// Call in a form action — not a client-side event handler
// signOut() calls supabase.auth.signOut() then redirect('/login')
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Middleware auth guard with getClaims()</name>
  <files>
    src/middleware.ts
  </files>
  <action>
    Create `src/middleware.ts` implementing the full auth guard. Use `getClaims()` — NOT `getUser()` (network call per request) and NOT `getSession()` (insecure for server-side).

    ```typescript
    import { type NextRequest, NextResponse } from 'next/server';
    import { createServerClient } from '@supabase/ssr';

    export async function middleware(request: NextRequest) {
      // Must create a new response first so we can mutate cookies for token refresh
      let response = NextResponse.next({ request });

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              // Write refreshed tokens to the response — this is what enables silent refresh
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      // getClaims(): validates JWT signature locally using WebCrypto
      // Only hits Supabase network if session is near expiry (refresh needed)
      const { data: { claims }, error } = await supabase.auth.getClaims();

      const path = request.nextUrl.pathname;

      // Public paths — no auth required
      const publicPaths = ['/login', '/signup', '/auth', '/join', '/verify-email', '/invite-invalid'];
      const isPublic = publicPaths.some(p => path.startsWith(p));

      // Not authenticated
      if (!claims || error) {
        if (!isPublic) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
        return response;
      }

      // Email verification gate — block unverified users from accessing the app
      if (!claims.email_confirmed_at && !isPublic) {
        return NextResponse.redirect(new URL('/verify-email', request.url));
      }

      const role = claims.app_metadata?.role as 'trainer' | 'trainee' | undefined;

      // Cross-role access prevention
      if (role === 'trainee' && path.startsWith('/trainer')) {
        return NextResponse.redirect(new URL('/trainee', request.url));
      }
      if (role === 'trainer' && path.startsWith('/trainee')) {
        return NextResponse.redirect(new URL('/trainer', request.url));
      }

      // Authenticated users visiting /login or /signup — redirect to their home
      if ((path === '/login' || path === '/') && role) {
        const home = role === 'trainer' ? '/trainer' : '/trainee';
        return NextResponse.redirect(new URL(home, request.url));
      }

      return response;
    }

    export const config = {
      // Match all routes except Next.js internals and static files
      matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
      ],
    };
    ```

    Key design decisions baked in (per RESEARCH.md):
    - `getClaims()` instead of `getUser()` — avoids Supabase network call on every request
    - Response cookies mutation — enables 30-day silent session refresh (requirement AUTH-03)
    - Email gate redirects to `/verify-email`, not `/login` — user knows to check email
    - Cross-role redirects prevent trainers from accidentally hitting trainee routes and vice versa
    - Visiting `/login` while authenticated bounces to role home — prevents stale login page
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <done>
    TypeScript compiles without errors. `src/middleware.ts` exists and exports `middleware` and `config`. The middleware uses `getClaims()` (not `getUser()` or `getSession()`). The matcher pattern excludes static assets.
  </done>
</task>

<task type="auto">
  <name>Task 2: Trainer and trainee route group shells with home screens</name>
  <files>
    src/app/(trainer)/layout.tsx
    src/app/(trainer)/page.tsx
    src/app/(trainee)/layout.tsx
    src/app/(trainee)/page.tsx
  </files>
  <action>
    Create trainer and trainee route group shells. These are minimal but functional layouts with a sign-out button accessible from the nav. The home screens show correct empty states per CONTEXT.md decisions.

    Per CONTEXT.md locked decisions:
    - Trainer home = roster of trainees (Plan 04 will populate it — Phase 1 shows empty state with "+ Invite trainee" button)
    - Trainee home = currently assigned plan (Phase 3/4 will build this — Phase 1 shows "Waiting for your trainer")

    **`src/app/(trainer)/layout.tsx`** — trainer app shell:
    ```typescript
    import { signOut } from '@/app/(auth)/login/actions';

    export default function TrainerLayout({ children }: { children: React.ReactNode }) {
      return (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-gray-900">GYM Assistant</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>
            </form>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        </div>
      );
    }
    ```

    **`src/app/(trainer)/page.tsx`** — trainer home (empty roster state, placeholder for Plan 04):
    ```typescript
    export default function TrainerHomePage() {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Your Trainees</h1>
            {/* Plan 04 will replace this with a functional invite button */}
            <button
              disabled
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg opacity-50 cursor-not-allowed"
            >
              + Invite trainee
            </button>
          </div>

          {/* Empty state — Plan 04 replaces this with the real roster */}
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
            <div className="text-4xl text-gray-300">👥</div>
            <h2 className="font-medium text-gray-700">No trainees yet</h2>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Invite your first client to get started. They'll receive a link to join your roster.
            </p>
          </div>
        </div>
      );
    }
    ```

    **`src/app/(trainee)/layout.tsx`** — trainee app shell:
    ```typescript
    import { signOut } from '@/app/(auth)/login/actions';

    export default function TraineeLayout({ children }: { children: React.ReactNode }) {
      return (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-gray-900">GYM Assistant</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>
            </form>
          </header>
          <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
        </div>
      );
    }
    ```

    **`src/app/(trainee)/page.tsx`** — trainee home (waiting for trainer state):
    ```typescript
    export default function TraineeHomePage() {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
          <div className="text-4xl text-gray-300">🏋️</div>
          <h1 className="text-xl font-semibold text-gray-700">Waiting for your trainer</h1>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Your trainer will assign a workout plan shortly. Once assigned, your schedule will appear here.
          </p>
        </div>
      );
    }
    ```

    Important: The `form action={signOut}` pattern works because `signOut` is a Server Action (`'use server'`). No `'use client'` needed in the layout files — they remain Server Components.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -10</automated>
  </verify>
  <done>
    `npm run build` exits 0. Both trainer and trainee route groups have layout and page files. Sign-out button uses form action with the Server Action from Plan 02. Home screens match CONTEXT.md decisions: trainer sees empty roster, trainee sees "Waiting for your trainer".
  </done>
</task>

</tasks>

<verification>
1. `npm run build` exits 0
2. `npx tsc --noEmit` exits 0
3. Middleware file uses `getClaims()` (grep: `getClaims`)
4. Middleware file does NOT use `getUser()` or `getSession()`
5. Visiting `/trainer` as an unauthenticated user in the browser redirects to `/login`
6. Visiting `/trainee` as an unauthenticated user redirects to `/login`
7. Both layout files import `signOut` from `@/app/(auth)/login/actions`
</verification>

<success_criteria>
- Middleware protects all routes with getClaims() (no network call per request)
- Email verification gate redirects unverified users to /verify-email
- Role-based routing prevents cross-role access
- Trainer home renders empty roster state with disabled "+ Invite trainee" button
- Trainee home renders "Waiting for your trainer" empty state
- Sign out is functional from both home screens via form → Server Action
- No TypeScript errors, build succeeds
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-03-SUMMARY.md` with:
- Middleware auth strategy confirmed (getClaims used, not getUser)
- Route group structure created
- Any routing edge cases discovered and handled
- Build success confirmation
</output>
