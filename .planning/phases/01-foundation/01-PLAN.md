---
phase: 01-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - next.config.ts
  - tsconfig.json
  - .env.local.example
  - src/lib/supabase/client.ts
  - src/lib/supabase/server.ts
  - src/lib/supabase/admin.ts
  - src/lib/db/schema.ts
  - drizzle.config.ts
  - src/lib/db/migrations/0001_initial.sql
autonomous: true
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
  - CONN-01
  - CONN-02
  - CONN-03
  - CONN-04

user_setup:
  - service: supabase
    why: "Database and auth backend for the entire application"
    env_vars:
      - name: NEXT_PUBLIC_SUPABASE_URL
        source: "Supabase Dashboard → Project Settings → API → Project URL"
      - name: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        source: "Supabase Dashboard → Project Settings → API → anon/public key (also labelled 'publishable key' in newer dashboards)"
      - name: SUPABASE_SERVICE_ROLE_KEY
        source: "Supabase Dashboard → Project Settings → API → service_role key (keep secret)"
    dashboard_config:
      - task: "Enable email confirmation"
        location: "Supabase Dashboard → Authentication → Providers → Email → 'Confirm email' toggle ON"
      - task: "Set refresh token expiry to 30 days (2592000 seconds)"
        location: "Supabase Dashboard → Authentication → General → JWT Settings → 'Refresh token expiry'"
      - task: "Configure Google OAuth provider"
        location: "Supabase Dashboard → Authentication → Providers → Google → enable and add Client ID + Secret from Google Cloud Console"

must_haves:
  truths:
    - "Next.js 15 App Router project is scaffolded and boots without errors"
    - "All four Supabase client helpers (browser, server, admin) export without runtime errors"
    - "Drizzle schema defines all four Phase 1 tables: trainers, users, invite_links, trainer_trainee_connections"
    - "Migration SQL runs against Supabase and creates all tables"
    - "RLS is enabled on every table with correct deny-all default plus role-specific policies"
    - "UNIQUE constraint on trainer_trainee_connections.trainee_auth_uid enforced at DB level"
  artifacts:
    - path: "src/lib/supabase/client.ts"
      provides: "createBrowserClient wrapper for client components"
      exports: ["createClient"]
    - path: "src/lib/supabase/server.ts"
      provides: "createServerClient wrapper for Server Components and Actions"
      exports: ["createClient"]
    - path: "src/lib/supabase/admin.ts"
      provides: "Admin client using service_role key — server-only"
      exports: ["createAdminClient"]
    - path: "src/lib/db/schema.ts"
      provides: "Drizzle schema for all Phase 1 tables"
      exports: ["trainers", "users", "inviteLinks", "trainerTraineeConnections"]
    - path: "src/lib/db/migrations/0001_initial.sql"
      provides: "SQL migration creating tables + RLS policies"
      contains: "ALTER TABLE * ENABLE ROW LEVEL SECURITY"
  key_links:
    - from: "src/lib/supabase/server.ts"
      to: "NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      via: "environment variables"
      pattern: "NEXT_PUBLIC_SUPABASE_URL"
    - from: "src/lib/supabase/admin.ts"
      to: "SUPABASE_SERVICE_ROLE_KEY"
      via: "environment variable (server-only)"
      pattern: "SUPABASE_SERVICE_ROLE_KEY"
    - from: "src/lib/db/schema.ts"
      to: "trainer_trainee_connections"
      via: "unique constraint on trainee_auth_uid"
      pattern: "unique.*traineeAuthUid"
---

<objective>
Scaffold the Next.js 15 project, configure Supabase client helpers, and create the complete Phase 1 database schema with migrations and RLS policies. This plan produces the foundation every other plan in Phase 1 depends on.

Purpose: Nothing else can run without the project existing, the Supabase clients being importable, and the database schema being applied.
Output: Runnable Next.js project, three Supabase client helpers, Drizzle schema for four tables, migration SQL with full RLS policies applied to the Supabase database.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation/01-RESEARCH.md
</context>

<tasks>

<task type="checkpoint:human-action">
  <name>Task 0: Supabase project setup and env vars</name>
  <what-built>Nothing yet — this ensures the external dependency is ready before any code runs against it.</what-built>
  <how-to-verify>
    1. Create a new Supabase project at https://supabase.com (or use an existing project).
    2. In Supabase Dashboard → Authentication → Providers → Email: enable "Confirm email".
    3. In Supabase Dashboard → Authentication → General → JWT Settings: set "Refresh token expiry" to 2592000 (30 days).
    4. (Optional now, required before testing auth) In Authentication → Providers → Google: enable Google OAuth and paste Client ID + Client Secret from Google Cloud Console.
    5. Copy the three keys from Supabase Dashboard → Project Settings → API and paste them into `.env.local` (create from `.env.local.example`):
       - `NEXT_PUBLIC_SUPABASE_URL`
       - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the anon/public key)
       - `SUPABASE_SERVICE_ROLE_KEY` (keep this server-only)
    6. Confirm: `.env.local` exists with all three values filled in.
  </how-to-verify>
  <resume-signal>Type "ready" when .env.local is filled in with real Supabase credentials</resume-signal>
</task>

<task type="auto">
  <name>Task 1: Scaffold Next.js 15 project and install dependencies</name>
  <files>
    package.json
    next.config.ts
    tsconfig.json
    .env.local.example
    .gitignore
    src/app/layout.tsx
    src/app/page.tsx
    drizzle.config.ts
  </files>
  <action>
    Bootstrap a Next.js 15 App Router project with TypeScript. If a package.json does not already exist at the project root, run:

    ```bash
    npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
    ```

    Then install Phase 1 dependencies:

    ```bash
    npm install @supabase/supabase-js @supabase/ssr
    npm install drizzle-orm postgres
    npm install zod react-hook-form @hookform/resolvers
    npm install -D drizzle-kit
    ```

    Create `.env.local.example` with placeholder comments (never commit real values):

    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your-project-url
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-NEVER-EXPOSE-TO-BROWSER
    ```

    Add `.env.local` to `.gitignore` if not already present.

    Create `drizzle.config.ts` at the project root:

    ```typescript
    import { defineConfig } from 'drizzle-kit';

    export default defineConfig({
      schema: './src/lib/db/schema.ts',
      out: './src/lib/db/migrations',
      dialect: 'postgresql',
      dbCredentials: {
        url: process.env.DATABASE_URL!,
      },
    });
    ```

    Add `DATABASE_URL` to `.env.local.example`:
    ```env
    # Database (Drizzle migrations — use Supabase connection string)
    # Supabase Dashboard → Project Settings → Database → Connection string → URI (Transaction mode)
    DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
    ```

    Update `next.config.ts` to suppress the `punycode` deprecation warning in Node 22+:

    ```typescript
    import type { NextConfig } from 'next';

    const nextConfig: NextConfig = {
      experimental: {},
    };

    export default nextConfig;
    ```

    Verify the project starts: `npm run dev` should serve on localhost:3000 without errors.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>
    `npm run build` exits 0. `package.json` lists all required dependencies. `.env.local.example` exists. `drizzle.config.ts` exists.
  </done>
</task>

<task type="auto">
  <name>Task 2: Supabase client helpers</name>
  <files>
    src/lib/supabase/client.ts
    src/lib/supabase/server.ts
    src/lib/supabase/admin.ts
  </files>
  <action>
    Create three Supabase client helpers following the official `@supabase/ssr` pattern. Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as the env var name for the anon/public key (matches current Supabase docs naming; functionally identical to `ANON_KEY`).

    **`src/lib/supabase/client.ts`** (browser client for Client Components):
    ```typescript
    // Source: https://supabase.com/docs/guides/auth/server-side/nextjs
    import { createBrowserClient } from '@supabase/ssr';

    export function createClient() {
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );
    }
    ```

    **`src/lib/supabase/server.ts`** (server client for Server Components, Server Actions, Route Handlers):
    ```typescript
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
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore — can throw in read-only Server Components; middleware handles refresh
              }
            },
          },
        }
      );
    }
    ```

    **`src/lib/supabase/admin.ts`** (admin client using service_role — server-only, NEVER import in client components):
    ```typescript
    import { createClient } from '@supabase/supabase-js';

    export function createAdminClient() {
      // CRITICAL: Only use in Server Actions or Route Handlers.
      // This key has full database access and bypasses RLS.
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
    }
    ```

    Do NOT add `'use server'` or `'use client'` directives to these files — they are plain utility modules, not Server Actions or Client Components. The caller determines usage context.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    TypeScript compiles without errors on the three helper files. Each file exports the named function.
  </done>
</task>

<task type="auto">
  <name>Task 3: Drizzle schema and database migration with RLS</name>
  <files>
    src/lib/db/schema.ts
    src/lib/db/migrations/0001_initial.sql
  </files>
  <action>
    Create the Drizzle schema for all four Phase 1 tables and a migration SQL file that creates the tables and enables RLS with correct policies.

    **`src/lib/db/schema.ts`**:
    ```typescript
    import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';

    export const trainers = pgTable('trainers', {
      id: uuid('id').primaryKey().defaultRandom(),
      authUid: uuid('auth_uid').notNull().unique(),
      name: text('name').notNull(),
      email: text('email').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    });

    // Trainee profiles (and any future non-trainer roles)
    export const users = pgTable('users', {
      id: uuid('id').primaryKey().defaultRandom(),
      authUid: uuid('auth_uid').notNull().unique(),
      name: text('name').notNull(),
      email: text('email').notNull(),
      role: text('role', { enum: ['trainee'] }).notNull(),
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
      // CRITICAL: enforces one trainer per trainee at the database level
      // Race conditions cannot produce two connections for the same trainee
      uniqueTrainee: unique('trainee_unique_connection').on(table.traineeAuthUid),
    }));
    ```

    **`src/lib/db/migrations/0001_initial.sql`** — write this by hand (not generated by Drizzle Kit, because we need RLS policies in the same migration):

    ```sql
    -- Phase 1 Foundation: Core tables with RLS

    -- Trainer profiles
    CREATE TABLE IF NOT EXISTS trainers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_uid UUID NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
    -- Trainers can only read/write their own row
    CREATE POLICY "trainer_sees_own_row" ON trainers
      FOR ALL USING ((SELECT auth.uid()) = auth_uid);

    -- Trainee/user profiles
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_uid UUID NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('trainee')),
      created_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    -- Trainees see their own row
    CREATE POLICY "user_sees_own_row" ON users
      FOR ALL USING ((SELECT auth.uid()) = auth_uid);
    -- Trainers can see their connected trainees
    CREATE POLICY "trainer_sees_connected_trainees" ON users
      FOR SELECT USING (
        auth_uid IN (
          SELECT trainee_auth_uid FROM trainer_trainee_connections
          WHERE trainer_auth_uid = (SELECT auth.uid())
        )
      );

    -- Invite links
    CREATE TABLE IF NOT EXISTS invite_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_auth_uid UUID NOT NULL,
      token TEXT NOT NULL UNIQUE,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
    -- Trainers manage their own invite links
    CREATE POLICY "trainer_manages_own_invites" ON invite_links
      FOR ALL USING ((SELECT auth.uid()) = trainer_auth_uid);
    -- Note: invite token validation is done via admin client in Server Actions
    -- to avoid exposing the token lookup surface via RLS

    -- Trainer-trainee connections
    CREATE TABLE IF NOT EXISTS trainer_trainee_connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trainer_auth_uid UUID NOT NULL,
      trainee_auth_uid UUID NOT NULL,
      invite_link_id UUID REFERENCES invite_links(id),
      connected_at TIMESTAMPTZ DEFAULT now(),
      -- CRITICAL: database-level uniqueness — one trainer per trainee
      CONSTRAINT trainee_unique_connection UNIQUE (trainee_auth_uid)
    );

    ALTER TABLE trainer_trainee_connections ENABLE ROW LEVEL SECURITY;
    -- Trainer sees their connections (roster)
    CREATE POLICY "trainer_sees_own_connections" ON trainer_trainee_connections
      FOR SELECT USING (trainer_auth_uid = (SELECT auth.uid()));
    -- Trainee sees their own connection
    CREATE POLICY "trainee_sees_own_connection" ON trainer_trainee_connections
      FOR SELECT USING (trainee_auth_uid = (SELECT auth.uid()));
    -- Disconnect: either party can remove (trainer removing from roster OR trainee disconnecting)
    CREATE POLICY "disconnect" ON trainer_trainee_connections
      FOR DELETE USING (
        trainer_auth_uid = (SELECT auth.uid()) OR trainee_auth_uid = (SELECT auth.uid())
      );
    -- Insert handled by admin client in Server Actions (bypasses RLS) — no INSERT policy needed
    ```

    After creating both files, run the migration against Supabase. Add `DATABASE_URL` to `.env.local` first (Supabase Dashboard → Project Settings → Database → Connection string → URI in Transaction mode, port 6543), then run:

    ```bash
    npx drizzle-kit migrate
    ```

    If Drizzle Kit complains about the hand-written SQL, run via psql or Supabase SQL Editor instead:
    ```bash
    psql "$DATABASE_URL" -f src/lib/db/migrations/0001_initial.sql
    ```

    Verify via Supabase Dashboard → Table Editor that all four tables exist with RLS enabled (lock icon shown).
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -5</automated>
  </verify>
  <done>
    TypeScript compiles cleanly on schema.ts. In Supabase Dashboard → Table Editor, all four tables (trainers, users, invite_links, trainer_trainee_connections) appear with the RLS lock icon active. The UNIQUE constraint on trainer_trainee_connections.trainee_auth_uid is visible in the table's constraints.
  </done>
</task>

</tasks>

<verification>
1. `npm run build` exits 0 — project compiles
2. `npx tsc --noEmit` exits 0 — no type errors
3. Supabase Dashboard shows all 4 tables with RLS enabled
4. UNIQUE constraint `trainee_unique_connection` exists on trainer_trainee_connections
5. `.env.local.example` exists and `.env.local` is in `.gitignore`
</verification>

<success_criteria>
- Next.js 15 App Router project runs (`npm run dev` serves localhost:3000)
- Three Supabase client helpers are importable from `@/lib/supabase/{client,server,admin}`
- Drizzle schema exports all four tables with correct types
- Migration SQL has been applied to the Supabase database — tables exist with RLS enabled
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-01-SUMMARY.md` with:
- What was built (scaffold, clients, schema, migration)
- Exact env var names used (PUBLISHABLE_KEY vs ANON_KEY — whichever matched the dashboard)
- Any deviations from the plan (e.g., if Drizzle Kit migration was used instead of hand-written SQL)
- Supabase project URL (without credentials)
- Confirmation that RLS is active on all 4 tables
</output>
