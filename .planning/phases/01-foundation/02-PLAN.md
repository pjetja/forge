---
phase: 01-foundation
plan: 02
type: execute
wave: 2
depends_on:
  - "01-PLAN"
files_modified:
  - src/app/(auth)/login/page.tsx
  - src/app/(auth)/signup/trainer/page.tsx
  - src/app/(auth)/signup/trainer/actions.ts
  - src/app/(auth)/signup/trainee/page.tsx
  - src/app/(auth)/signup/trainee/actions.ts
  - src/app/(auth)/verify-email/page.tsx
  - src/app/(auth)/layout.tsx
  - src/app/auth/callback/route.ts
autonomous: true
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04

must_haves:
  truths:
    - "A trainer can register with email/password on /signup/trainer and is redirected to /verify-email"
    - "A trainee can register with email/password on /signup/trainee and is redirected to /verify-email"
    - "Both signup pages offer a 'Sign up with Google' button that initiates OAuth with role context preserved in the redirectTo URL"
    - "The auth/callback route assigns role to app_metadata on first OAuth signup and redirects returning users to their home without role re-selection"
    - "Email verification is required — the callback only considers the user authenticated after email_confirmed_at is set"
    - "The login page allows email/password login and Google login with no role selection (role already set)"
    - "Signing out calls supabase.auth.signOut() and redirects to /login"
    - "Role is stored in raw_app_meta_data via the Admin API (service_role key) — never in a user-editable table or JWT claim the user can set"
  artifacts:
    - path: "src/app/(auth)/signup/trainer/actions.ts"
      provides: "signUpTrainer Server Action"
      exports: ["signUpTrainer"]
    - path: "src/app/(auth)/signup/trainee/actions.ts"
      provides: "signUpTrainee Server Action"
      exports: ["signUpTrainee"]
    - path: "src/app/auth/callback/route.ts"
      provides: "PKCE callback: exchanges code, assigns role to app_metadata, redirects"
      exports: ["GET"]
    - path: "src/app/(auth)/login/page.tsx"
      provides: "Login page with email/password and Google OAuth"
      contains: "supabase.auth.signInWithPassword"
  key_links:
    - from: "src/app/(auth)/signup/trainer/actions.ts"
      to: "adminClient.auth.admin.updateUserById"
      via: "Server Action using createAdminClient"
      pattern: "updateUserById.*role.*trainer"
    - from: "src/app/(auth)/signup/trainer/page.tsx"
      to: "/auth/callback?role=trainer"
      via: "signInWithOAuth redirectTo"
      pattern: "role=trainer"
    - from: "src/app/auth/callback/route.ts"
      to: "app_metadata.role"
      via: "existingRole check before Admin API call"
      pattern: "existingRole.*role"
---

<objective>
Build all auth pages (login, trainer signup, trainee signup, email verification gate) with Server Actions for email/password registration, Google OAuth integration with role context preservation through the PKCE callback, and sign-out. This delivers AUTH-01, AUTH-02, AUTH-03 (session management), and AUTH-04 (sign out).

Purpose: Users cannot use the app at all without authentication. This plan makes signup and login functional end-to-end.
Output: Four auth pages, two signup Server Actions, PKCE callback route with role assignment, Google OAuth wiring on both signup pages.
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
<!-- Key types and patterns the executor needs. Verified from RESEARCH.md. -->

Supabase client imports (from Plan 01):
```typescript
import { createClient } from '@/lib/supabase/client';     // browser client
import { createClient } from '@/lib/supabase/server';     // server client
import { createAdminClient } from '@/lib/supabase/admin'; // admin — server-only
```

Drizzle schema tables (from Plan 01):
```typescript
import { trainers, users } from '@/lib/db/schema';
// trainers: { authUid, name, email, createdAt }
// users:    { authUid, name, email, role: 'trainee', createdAt }
```

Admin API for role assignment:
```typescript
await adminClient.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'trainer' | 'trainee' },
});
```

getClaims() pattern (middleware and server components):
```typescript
const { data: { claims } } = await supabase.auth.getClaims();
// claims.app_metadata?.role → 'trainer' | 'trainee' | undefined
// claims.email_confirmed_at → Date | null (null = unverified)
```

signInWithOAuth with role context:
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback?role=trainer`,
    // Include invite token when present: ?role=trainee&invite=${token}
  },
});
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Auth layout and signup Server Actions</name>
  <files>
    src/app/(auth)/layout.tsx
    src/app/(auth)/signup/trainer/actions.ts
    src/app/(auth)/signup/trainee/actions.ts
  </files>
  <action>
    Create the auth route group layout and the two Server Actions that handle email/password signup with role assignment.

    **`src/app/(auth)/layout.tsx`** — minimal layout for auth pages (no app sidebar/shell):
    ```typescript
    export default function AuthLayout({ children }: { children: React.ReactNode }) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-full max-w-md">{children}</div>
        </div>
      );
    }
    ```

    **`src/app/(auth)/signup/trainer/actions.ts`** — Server Action for trainer email/password signup:
    ```typescript
    'use server';
    import { redirect } from 'next/navigation';
    import { z } from 'zod';
    import { createClient } from '@/lib/supabase/server';
    import { createAdminClient } from '@/lib/supabase/admin';

    const SignupSchema = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      name: z.string().min(1, 'Name is required').max(100),
    });

    export async function signUpTrainer(prevState: unknown, formData: FormData) {
      const result = SignupSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
      });

      if (!result.success) {
        return { error: result.error.errors[0].message };
      }

      const { email, password, name } = result.data;
      const supabase = await createClient();

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Signup failed — please try again' };
      }

      // Set role in app_metadata via Admin API (server-only, user cannot modify)
      const adminClient = createAdminClient();
      const { error: roleError } = await adminClient.auth.admin.updateUserById(
        data.user.id,
        { app_metadata: { role: 'trainer' } }
      );

      if (roleError) {
        return { error: 'Account created but role assignment failed — contact support' };
      }

      // Create trainer profile row
      const { error: profileError } = await supabase.from('trainers').insert({
        auth_uid: data.user.id,
        email: data.user.email!,
        name,
      });

      if (profileError) {
        // Non-fatal for the auth flow — log and continue
        console.error('Trainer profile creation failed:', profileError);
      }

      redirect('/verify-email');
    }
    ```

    **`src/app/(auth)/signup/trainee/actions.ts`** — Server Action for trainee email/password signup:
    ```typescript
    'use server';
    import { redirect } from 'next/navigation';
    import { z } from 'zod';
    import { createClient } from '@/lib/supabase/server';
    import { createAdminClient } from '@/lib/supabase/admin';

    const SignupSchema = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      name: z.string().min(1, 'Name is required').max(100),
      inviteToken: z.string().optional(),
    });

    export async function signUpTrainee(prevState: unknown, formData: FormData) {
      const result = SignupSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
        inviteToken: formData.get('invite_token') || undefined,
      });

      if (!result.success) {
        return { error: result.error.errors[0].message };
      }

      const { email, password, name, inviteToken } = result.data;
      const supabase = await createClient();
      const adminClient = createAdminClient();

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Signup failed — please try again' };
      }

      // Set role in app_metadata via Admin API
      await adminClient.auth.admin.updateUserById(data.user.id, {
        app_metadata: { role: 'trainee' },
      });

      // Create trainee profile row
      await supabase.from('users').insert({
        auth_uid: data.user.id,
        email: data.user.email!,
        name,
        role: 'trainee',
      });

      // Store invite token in session cookie so it survives email verification
      // The /join/[token] redirect will happen after email confirmation
      if (inviteToken) {
        // Redirect to verify-email with invite token in query so it can be picked up post-verification
        redirect(`/verify-email?invite=${inviteToken}`);
      }

      redirect('/verify-email');
    }
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <done>
    TypeScript compiles without errors. Both Server Action files export their named functions with correct Zod validation and Admin API role assignment.
  </done>
</task>

<task type="auto">
  <name>Task 2: Signup pages and login page with Google OAuth</name>
  <files>
    src/app/(auth)/signup/trainer/page.tsx
    src/app/(auth)/signup/trainee/page.tsx
    src/app/(auth)/login/page.tsx
    src/app/(auth)/verify-email/page.tsx
  </files>
  <action>
    Create all four auth pages. Signup pages are Server Components that contain a 'use client' form component. The Google OAuth button must run client-side (triggers browser redirect). Login page handles both email/password and Google OAuth.

    **`src/app/(auth)/signup/trainer/page.tsx`**:
    ```typescript
    import { SignupForm } from './_components/SignupForm';

    export default function TrainerSignupPage({
      searchParams,
    }: {
      searchParams: { [key: string]: string | undefined };
    }) {
      return (
        <div className="bg-white shadow-sm rounded-xl p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Create trainer account</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your clients and create workout plans
            </p>
          </div>
          <SignupForm role="trainer" />
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
          </p>
        </div>
      );
    }
    ```

    Create **`src/app/(auth)/signup/trainer/_components/SignupForm.tsx`** (client component shared between both signup pages — accept `role` prop):
    ```typescript
    'use client';
    import { useActionState } from 'react';
    import { createClient } from '@/lib/supabase/client';
    import { signUpTrainer } from '../actions';  // adjust import per page location

    // NOTE: Create two variants — one for trainer, one for trainee.
    // Or make a shared component in src/components/auth/SignupForm.tsx
    // that accepts: role, action (Server Action), inviteToken?
    // Use the shared approach to avoid duplication.
    ```

    PREFERRED APPROACH: Create a single reusable form component:

    **`src/components/auth/SignupForm.tsx`** (`'use client'`):
    ```typescript
    'use client';
    import { useActionState } from 'react';
    import { createClient } from '@/lib/supabase/client';

    interface SignupFormProps {
      role: 'trainer' | 'trainee';
      action: (prevState: unknown, formData: FormData) => Promise<{ error?: string }>;
      inviteToken?: string;
    }

    export function SignupForm({ role, action, inviteToken }: SignupFormProps) {
      const [state, formAction, isPending] = useActionState(action, null);

      async function handleGoogleSignup() {
        const supabase = createClient();
        const redirectTo = inviteToken
          ? `${window.location.origin}/auth/callback?role=${role}&invite=${inviteToken}`
          : `${window.location.origin}/auth/callback?role=${role}`;
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
      }

      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400">
              <span className="bg-white px-2">or</span>
            </div>
          </div>

          <form action={formAction} className="space-y-4">
            {inviteToken && (
              <input type="hidden" name="invite_token" value={inviteToken} />
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      );
    }
    ```

    Use this shared component in both signup pages, passing the correct `action` prop.

    **`src/app/(auth)/signup/trainer/page.tsx`** (updated to use shared form):
    Pass `signUpTrainer` as the action. No `inviteToken` for trainer signups.

    **`src/app/(auth)/signup/trainee/page.tsx`**:
    Read `searchParams.invite` and pass it as `inviteToken` to `SignupForm`. Pass `signUpTrainee` as the action.

    **`src/app/(auth)/verify-email/page.tsx`** — shown after email/password signup:
    ```typescript
    export default function VerifyEmailPage({
      searchParams,
    }: {
      searchParams: { invite?: string };
    }) {
      return (
        <div className="bg-white shadow-sm rounded-xl p-8 text-center space-y-4">
          <div className="text-4xl">📬</div>
          <h1 className="text-xl font-semibold">Check your inbox</h1>
          <p className="text-sm text-gray-500">
            We sent a verification link to your email address. Click it to activate your account.
          </p>
          <p className="text-xs text-gray-400">
            Didn't receive it? Check your spam folder. The link expires after 24 hours.
          </p>
        </div>
      );
    }
    ```

    **`src/app/(auth)/login/page.tsx`** — login with email/password AND Google OAuth:
    ```typescript
    import { LoginForm } from './_components/LoginForm';

    export default function LoginPage() {
      return (
        <div className="bg-white shadow-sm rounded-xl p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back</p>
          </div>
          <LoginForm />
          <p className="text-center text-sm text-gray-500">
            New here?{' '}
            <a href="/signup/trainer" className="text-blue-600 hover:underline">Trainer signup</a>
            {' '}·{' '}
            <a href="/signup/trainee" className="text-blue-600 hover:underline">Trainee signup</a>
          </p>
        </div>
      );
    }
    ```

    Create **`src/app/(auth)/login/_components/LoginForm.tsx`** (`'use client'`):
    - Email + password fields
    - Login Server Action in a sibling `actions.ts`: calls `supabase.auth.signInWithPassword({ email, password })`; on success redirects based on `claims.app_metadata?.role` → `/trainer` or `/trainee`; on error returns `{ error: error.message }`
    - Google Sign In button: calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })` — NO role in redirectTo for returning users (callback checks existingRole)
    - Sign out is NOT on this page — it belongs in the app shell (handled in later plans)
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <done>
    TypeScript compiles without errors. All four auth pages exist. The shared SignupForm component correctly accepts `role`, `action`, and optional `inviteToken` props.
  </done>
</task>

<task type="auto">
  <name>Task 3: PKCE callback route and login Server Action</name>
  <files>
    src/app/auth/callback/route.ts
    src/app/(auth)/login/actions.ts
  </files>
  <action>
    Create the OAuth PKCE callback Route Handler and the login Server Action. These are the most security-critical files in Phase 1.

    **`src/app/auth/callback/route.ts`** — PKCE exchange + role assignment for Google OAuth:
    ```typescript
    import { NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { createAdminClient } from '@/lib/supabase/admin';

    export async function GET(request: Request) {
      const { searchParams, origin } = new URL(request.url);
      const code = searchParams.get('code');
      const role = searchParams.get('role') as 'trainer' | 'trainee' | null;
      const inviteToken = searchParams.get('invite');

      if (!code) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.user) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

      const existingRole = data.user.app_metadata?.role as 'trainer' | 'trainee' | undefined;

      // Only assign role on FIRST OAuth signup (new user has no existing role)
      if (!existingRole && role) {
        const adminClient = createAdminClient();
        await adminClient.auth.admin.updateUserById(data.user.id, {
          app_metadata: { role },
        });

        // Create profile row for new OAuth user
        if (role === 'trainer') {
          await supabase.from('trainers').insert({
            auth_uid: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name ?? data.user.email ?? 'Trainer',
          });
        } else {
          await supabase.from('users').insert({
            auth_uid: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name ?? data.user.email ?? 'Trainee',
            role: 'trainee',
          });

          // Auto-connect to trainer if invite token was preserved through OAuth redirect
          if (inviteToken) {
            const adminClient = createAdminClient();
            await claimInviteToken(adminClient, data.user.id, inviteToken);
          }
        }
      }

      // Use existingRole if present (returning user), otherwise the newly assigned role
      const finalRole = (existingRole ?? role) as 'trainer' | 'trainee' | undefined;

      if (!finalRole) {
        // OAuth login on main /login page for a user with no role — shouldn't happen in production
        // but handle gracefully
        return NextResponse.redirect(`${origin}/login?error=no_role`);
      }

      const destination = finalRole === 'trainer' ? '/trainer' : '/trainee';
      return NextResponse.redirect(`${origin}${destination}`);
    }

    // Helper: claim an invite link for a newly signed-up trainee
    // Uses admin client to bypass RLS — insert into trainer_trainee_connections
    async function claimInviteToken(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminClient: any,
      traineeUid: string,
      token: string
    ) {
      try {
        const { data: invite } = await adminClient
          .from('invite_links')
          .select('id, trainer_auth_uid, revoked_at')
          .eq('token', token)
          .single();

        if (!invite || invite.revoked_at) return; // invalid or revoked

        await adminClient.from('trainer_trainee_connections').insert({
          trainer_auth_uid: invite.trainer_auth_uid,
          trainee_auth_uid: traineeUid,
          invite_link_id: invite.id,
        });
      } catch (err) {
        // Unique constraint violation = already connected — ignore
        console.error('Invite claim failed (may already be connected):', err);
      }
    }
    ```

    **`src/app/(auth)/login/actions.ts`** — Server Action for email/password login:
    ```typescript
    'use server';
    import { redirect } from 'next/navigation';
    import { z } from 'zod';
    import { createClient } from '@/lib/supabase/server';

    const LoginSchema = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    });

    export async function signIn(prevState: unknown, formData: FormData) {
      const result = LoginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
      });

      if (!result.success) {
        return { error: result.error.errors[0].message };
      }

      const { email, password } = result.data;
      const supabase = await createClient();

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error: 'Invalid email or password' }; // Generic message — don't leak which is wrong
      }

      // Read role from claims to redirect appropriately
      const { data: { claims } } = await supabase.auth.getClaims();
      const role = claims?.app_metadata?.role as 'trainer' | 'trainee' | undefined;

      if (role === 'trainer') {
        redirect('/trainer');
      } else if (role === 'trainee') {
        redirect('/trainee');
      } else {
        redirect('/'); // fallback
      }
    }

    export async function signOut() {
      'use server';
      const supabase = await createClient();
      await supabase.auth.signOut();
      redirect('/login');
    }
    ```

    Note: `signOut` is exported from this file for use in the app shell (navigation component). It will be imported in Plan 03 when the trainer and trainee layouts are built.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <done>
    TypeScript compiles without errors. The callback route handles: new OAuth signup (sets role, creates profile), returning OAuth login (skips role assignment), invite token auto-connect for new trainee OAuth. The login Server Action uses signInWithPassword and redirects by role.
  </done>
</task>

</tasks>

<verification>
1. `npm run build` exits 0
2. Visiting `/signup/trainer` renders trainer signup page with Google button and email/password form
3. Visiting `/signup/trainee` renders trainee signup page with Google button and email/password form
4. `/verify-email` renders "Check your inbox" content
5. `/login` renders login page with both auth methods
6. `src/app/auth/callback/route.ts` handles both new and returning OAuth users
</verification>

<success_criteria>
- All auth pages render without runtime errors
- TypeScript compiles cleanly
- Server Actions correctly assign roles via Admin API (service_role key)
- Google OAuth `redirectTo` carries role context (and invite token when present) through the PKCE flow
- Returning Google users are NOT re-assigned a role (existingRole check present)
- The `signOut` Server Action is exported for use by later plans
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-02-SUMMARY.md` with:
- Files created and their purpose
- Any deviations (e.g., if LoginForm ended up as a Server Action vs client component)
- Confirmation that the `claimInviteToken` helper is in the callback route
- Any TypeScript issues encountered and resolved
</output>
