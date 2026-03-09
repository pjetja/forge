---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, typescript, tailwind, supabase, drizzle, postgres, rls, zod, react-hook-form]

# Dependency graph
requires: []
provides:
  - Next.js 16 App Router project scaffolded and building
  - Supabase browser client helper (createBrowserClient wrapper)
  - Supabase server client helper (async createServerClient wrapper)
  - Supabase admin client helper (service_role, bypasses RLS)
  - Drizzle schema for 4 tables: trainers, users, invite_links, trainer_trainee_connections
  - Migration SQL with full RLS policies (ready to apply)
affects:
  - 02-auth
  - 03-invite-flow
  - 04-trainer-roster
  - 05-trainee-dashboard

# Tech tracking
tech-stack:
  added:
    - next@16.1.6 (App Router, TypeScript)
    - @supabase/supabase-js@2.x
    - "@supabase/ssr@0.9.x"
    - drizzle-orm
    - drizzle-kit
    - postgres (driver)
    - zod
    - react-hook-form
    - "@hookform/resolvers"
    - tailwindcss@4
  patterns:
    - Three Supabase client helpers pattern (browser/server/admin) from official @supabase/ssr docs
    - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY naming (new Supabase dashboard naming, functionally identical to ANON_KEY)
    - Drizzle schema with pgTable + unique constraint for DB-level trainee uniqueness enforcement
    - Hand-written migration SQL (not drizzle-kit generated) to co-locate RLS policies with table creation

key-files:
  created:
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/admin.ts
    - src/lib/db/schema.ts
    - src/lib/db/migrations/0001_initial.sql
    - drizzle.config.ts
    - .env.local.example
  modified:
    - package.json
    - next.config.ts
    - tsconfig.json
    - .gitignore

key-decisions:
  - "Used NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY env var name (new Supabase dashboard naming, matches docs)"
  - "Hand-written migration SQL instead of drizzle-kit generate — allows RLS policies in same file"
  - "Next.js 16.1.6 installed (latest stable, plan specified 15 but 16 is the current create-next-app default)"
  - "Database migration pending user action — Supabase project uses new sb_secret/sb_publishable key format that does not work as PostgreSQL password; user must apply migration via SQL Editor or provide DATABASE_URL password"
  - "UNIQUE constraint trainee_unique_connection on trainer_trainee_connections.trainee_auth_uid enforces one-trainer-per-trainee at DB level"

patterns-established:
  - "Pattern 1: Supabase client split — client.ts for browser, server.ts for SSR/Actions, admin.ts for privileged ops"
  - "Pattern 2: Admin client (service_role) for all INSERT/admin operations — no INSERT RLS policies defined, enforced via server-only admin client"
  - "Pattern 3: Hand-written SQL migrations co-locate table DDL and RLS policies"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, CONN-01, CONN-02, CONN-03, CONN-04]

# Metrics
duration: 13min
completed: 2026-03-09
---

# Phase 1 Plan 01: Project Scaffold, Supabase Clients, and Drizzle Schema Summary

**Next.js 16 App Router scaffolded with @supabase/ssr client helpers (browser/server/admin), Drizzle schema for 4 tables with RLS migration SQL ready to apply**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-03-09T18:05:29Z
- **Completed:** 2026-03-09T18:18:56Z
- **Tasks:** 3 (Tasks 1-3; Task 0 was completed by user)
- **Files modified:** 17

## Accomplishments

- Next.js 16 App Router project with TypeScript, Tailwind CSS 4, ESLint — `npm run build` exits 0
- Three Supabase client helpers following official @supabase/ssr pattern; TypeScript compiles cleanly
- Drizzle schema for all 4 Phase 1 tables with UNIQUE constraint on trainee_auth_uid enforced at DB level
- Hand-written migration SQL with RLS enabled on all 4 tables + role-specific policies (ready to apply)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 project and install dependencies** - `8798b3d` (feat)
2. **Task 2: Supabase client helpers** - `60cfaa1` (feat)
3. **Task 3: Drizzle schema and database migration with RLS** - `ef4e5dd` (feat)

## Files Created/Modified

- `package.json` - Project config; name: gym-ai-assistant, Next.js 16, all Phase 1 deps
- `next.config.ts` - Updated with experimental block
- `tsconfig.json` - TypeScript config (Next.js default)
- `.gitignore` - Comprehensive Next.js gitignore patterns; .env*.local excluded
- `.env.local.example` - Placeholder for all 4 env vars (SUPABASE_URL, PUBLISHABLE_KEY, SERVICE_ROLE_KEY, DATABASE_URL)
- `drizzle.config.ts` - Drizzle Kit config pointing to src/lib/db/schema.ts
- `src/app/layout.tsx` - Root layout with Tailwind
- `src/app/page.tsx` - Default home page
- `src/lib/supabase/client.ts` - `createClient()` using createBrowserClient for Client Components
- `src/lib/supabase/server.ts` - `async createClient()` using createServerClient for Server Components/Actions
- `src/lib/supabase/admin.ts` - `createAdminClient()` using service_role key; bypasses RLS; server-only
- `src/lib/db/schema.ts` - Drizzle schema: trainers, users, inviteLinks, trainerTraineeConnections
- `src/lib/db/migrations/0001_initial.sql` - DDL + RLS policies for all 4 tables

## Decisions Made

- **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY**: New Supabase dashboard label for the anon/public key (same JWT value, new label). Used consistently across all three client helpers.
- **Next.js 16**: `create-next-app@latest` installs Next.js 16.1.6 (plan said 15, but 16 is current stable). No functional difference for Phase 1.
- **Hand-written migration**: Not using `drizzle-kit generate` — hand-written SQL allows RLS policies in the same migration file as table creation, making the security posture explicit and reviewable.
- **No INSERT RLS policies on trainer_trainee_connections**: Insert is handled exclusively via the admin client (service_role) in Server Actions, which bypasses RLS. This is intentional to prevent unauthorized connections.
- **Migration not yet applied**: See "Issues Encountered" and "User Setup Required" below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Project directory name incompatible with create-next-app**
- **Found during:** Task 1 (scaffold Next.js project)
- **Issue:** `create-next-app` refuses names with spaces and capital letters; working directory is "GYM AI ASSISTANT"
- **Fix:** Scaffolded into `/tmp/gym-ai-scaffold`, then rsync'd files to the project directory. Set `name: "gym-ai-assistant"` in package.json.
- **Files modified:** package.json (name field)
- **Verification:** `npm run build` exits 0
- **Committed in:** `8798b3d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Workaround for directory naming constraint — no functional impact.

## Issues Encountered

**Migration not applied — database password required**

The Supabase project uses the new `sb_publishable_` / `sb_secret_` key format (not traditional JWT). These keys work for the REST API (`apikey` + `Authorization` headers) but do NOT function as PostgreSQL connection passwords. The `DATABASE_URL` in `.env.local` retains the `[YOUR-PASSWORD]` placeholder because:

- `db.{project}.supabase.co` DNS does not resolve (newer Supabase projects)
- Pooler connections (`aws-0-{region}.pooler.supabase.com`) require the actual DB password
- Supabase Management API (`api.supabase.com`) requires a personal access token (`sbp_...`), not the service role key
- The PostgREST API does not support DDL (CREATE TABLE, ALTER TABLE, CREATE POLICY)
- The Supabase CLI requires a personal access token for `db push`

**The migration SQL file is correct and ready to apply.** See "User Setup Required" below.

## User Setup Required

The database migration (`0001_initial.sql`) needs to be applied manually.

**Option A — Supabase SQL Editor (recommended, no password needed):**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/zkxlejxpopaffjvqmbgz) → SQL Editor
2. Copy the contents of `src/lib/db/migrations/0001_initial.sql`
3. Paste and run — you should see "Success. No rows returned"
4. Verify in Table Editor: 4 tables with the lock icon (RLS enabled)

**Option B — Direct psql connection:**
1. Go to Supabase Dashboard → Project Settings → Database → Connection string → URI
2. Copy the connection string with your actual password
3. Update `DATABASE_URL` in `.env.local` with the real password
4. Run: `PGPASSWORD="yourpassword" psql "postgresql://postgres:yourpassword@pooler.host:5432/postgres" -f src/lib/db/migrations/0001_initial.sql`

**After applying the migration, verify:**
- Table Editor shows: trainers, users, invite_links, trainer_trainee_connections
- Each table shows the lock icon (RLS enabled)
- trainer_trainee_connections shows the `trainee_unique_connection` constraint

## Next Phase Readiness

**Ready (pending migration):** Three Supabase client helpers importable from `@/lib/supabase/{client,server,admin}`. Drizzle schema exports all 4 tables.

**Blocker for Phase 1 Plan 02 (Auth):** The database migration must be applied before auth flows can be tested — the users and trainers tables must exist. Apply via SQL Editor as described above.

**Supabase project URL:** `https://zkxlejxpopaffjvqmbgz.supabase.co`

---
*Phase: 01-foundation*
*Completed: 2026-03-09*
