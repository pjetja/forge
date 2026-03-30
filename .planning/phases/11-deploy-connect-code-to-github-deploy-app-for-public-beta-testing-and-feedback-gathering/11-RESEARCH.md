# Phase 11: Deploy — Research

**Researched:** 2026-03-30
**Domain:** Next.js 16 App Router deployment — GitHub, Vercel, Supabase production, PWA
**Confidence:** HIGH (all findings from direct codebase inspection)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Deploy platform:** Vercel (zero-config Next.js deploy, preview URLs, free tier, env var UI)
- **Supabase:** Existing project, all migrations must be applied, demo seed must run once
- **PWA:** `manifest.json` + PNG icons (192×192, 512×512) + `<link rel="manifest">` required

### Claude's Discretion

- Whether to use a custom domain or the free `*.vercel.app` domain for beta
- Whether to use Vercel CLI or GitHub-integrated deploy (import project via Vercel dashboard)
- Whether to run `drizzle-kit push` or apply SQL files manually via Supabase dashboard

### Deferred Ideas (OUT OF SCOPE)

- Native iOS/Android apps
- Service worker / offline-first capability
- Push notifications
  </user_constraints>

---

## Summary

The codebase is deployment-ready with one critical gap: `NEXT_PUBLIC_SITE_URL` env var is used
in two signup actions as the `emailRedirectTo` URL but is **absent from `.env.local.example`
and will not be set on Vercel unless explicitly added.** Without it, confirmation emails will
redirect users to `http://localhost:3000` in production.

No GitHub remote exists yet — the repo is local-only with a clean `main` history up to Phase 10
(Phase 10 has 19 uncommitted changed files that must be committed first). Vercel and GitHub CLIs
are not installed; the deployment path is: create GitHub repo via web UI → push → import into
Vercel dashboard → configure env vars → run migrations → seed → verify.

The app has no PWA `manifest.json` or PNG icons — only default Next.js SVG placeholders in
`public/`. The root layout has no `<link rel="manifest">` or PWA meta tags.

**Primary recommendation:** Commit Phase 10 first, push to GitHub, deploy via Vercel dashboard
Git integration (not CLI), set all 5 env vars in Vercel, update Supabase redirect URLs, run
`drizzle-kit push` locally pointing at prod DB, run `pnpm seed:demo` locally pointing at prod
Supabase, then add `manifest.json` + icons.

---

## 1. Codebase Readiness

### What already works for production

| Area                        | Status           | Notes                                                                                                                                                           |
| --------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | ---- | --- | ---- | ------------------------------------------------ |
| `next.config.ts`            | ✅ Ready         | Minimal config — `withNextIntl` wrapper, empty `experimental: {}`. Zero changes needed for Vercel.                                                              |
| `package.json` build script | ✅ Ready         | `"build": "next build"` — Vercel default. No custom output mode needed.                                                                                         |
| Middleware                  | ✅ Ready         | Uses `@supabase/ssr` `createServerClient` + WebCrypto `getClaims()` for edge-compatible JWT validation. No Node-specific imports.                               |
| Cookie-based locale         | ✅ Ready         | No URL prefix — works with Vercel's CDN edge routing without any special rewrite rules.                                                                         |
| Static assets matcher       | ✅ Ready         | Middleware excludes `.\*\\.(?:svg                                                                                                                               | png | jpg | jpeg | gif | webp | ico)$` — no middleware overhead on static files. |
| Auth callback route         | ✅ Ready         | Uses `new URL(request.url).origin` dynamically — automatically uses prod URL, no hardcoded strings.                                                             |
| Password reset action       | ✅ Ready         | Uses `headers().get('origin')` dynamically — safe for any domain.                                                                                               |
| Signup email redirect       | ⚠️ Needs env var | `NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'` — fallback to localhost must NOT reach production. Requires `NEXT_PUBLIC_SITE_URL` set in Vercel.             |
| `drizzle-orm` at runtime    | ✅ No issue      | `src/lib/db/schema.ts` imports drizzle types for definitions only. App queries via Supabase client exclusively. `DATABASE_URL` NOT required in Vercel env vars. |

### What needs changes before deploy

1. **Commit Phase 10** — 19 files modified/untracked. Must be committed before `git push`.
2. **Add `NEXT_PUBLIC_SITE_URL`** to `.env.local.example` (documentation gap, not a runtime blocker but a developer-experience issue — the actual Vercel env var is what matters).
3. **Create `public/manifest.json`** — required for PWA installability.
4. **Create PNG icons** — `public/icon-192.png` and `public/icon-512.png` for manifest.
5. **Add PWA meta tags** to `src/app/layout.tsx` — `<link rel="manifest">`, `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-capable">`.

### No changes needed

- `next.config.ts` — no modifications required
- `src/middleware.ts` — production-ready as-is
- All Supabase server/client helpers — production-ready
- `.gitignore` — correctly excludes `.env`, `.env*.local`, `.vercel`, `.next/`

---

## 2. Environment Variables

### Complete list (verified from codebase)

| Variable                               | Scope       | Required at     | Where Used                                                                 | Secret?                                           |
| -------------------------------------- | ----------- | --------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Public      | Build + Runtime | `middleware.ts`, `server.ts`, `client.ts`, `admin.ts`, `callback/route.ts` | No — anon URL                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public      | Build + Runtime | `middleware.ts`, `server.ts`, `client.ts`, `callback/route.ts`             | No — anon/publishable key                         |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server-only | Runtime         | `src/lib/supabase/admin.ts` only                                           | **YES — never expose to browser**                 |
| `NEXT_PUBLIC_SITE_URL`                 | Public      | Build + Runtime | `signup/trainer/actions.ts`, `signup/trainee/actions.ts`                   | No — just the production URL                      |
| `DATABASE_URL`                         | Server-only | Migration only  | `drizzle.config.ts` only (not in `src/`)                                   | Yes (contains DB password) — NOT needed in Vercel |

### Variables needed in Vercel dashboard

```
NEXT_PUBLIC_SUPABASE_URL         = https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = eyJ...  (anon/publishable key)
SUPABASE_SERVICE_ROLE_KEY        = eyJ...  (service_role key — mark as sensitive)
NEXT_PUBLIC_SITE_URL             = https://[your-app].vercel.app
```

`DATABASE_URL` is **only** needed locally (in `.env.local`) when running `drizzle-kit push` for
migrations. Do NOT add it to Vercel — the app itself does not use it.

### Critical gap: `NEXT_PUBLIC_SITE_URL` not in `.env.local.example`

The file currently documents 4 variables but omits `NEXT_PUBLIC_SITE_URL`. The `.env.local.example`
needs this entry added:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 3. Supabase Production Checklist

### Redirect URL configuration (AUTH-CRITICAL)

Supabase enforces a whitelist for `emailRedirectTo` URLs. If the production domain is not in the
whitelist, Supabase silently redirects to the `Site URL` root instead of `/auth/callback`.
This was the known blocker from Phase 1.

**Required Supabase Dashboard changes:**

1. **Auth → URL Configuration → Site URL**: Change from `http://localhost:3000` to `https://[your-app].vercel.app`
2. **Auth → URL Configuration → Redirect URLs**: Add `https://[your-app].vercel.app/**`
   - Keep `http://localhost:3000/**` for local dev (Supabase supports multiple redirect URLs)

### Migrations

11 SQL files in `src/lib/db/migrations/` (0001–0011). Must all be applied to the production
Supabase Postgres instance before the app can function.

**Two options:**

| Option       | Command                                               | When to Use                                                |
| ------------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| Drizzle push | `DATABASE_URL=postgresql://... pnpm drizzle-kit push` | Preferred — applies the schema diff, handles IF NOT EXISTS |
| Manual SQL   | Supabase Dashboard → SQL Editor, paste each file      | Fallback if drizzle push fails                             |

`DATABASE_URL` format for Supabase: Supabase Dashboard → Project Settings → Database →
Connection string → **Transaction mode URI** (port 6543 for pgBouncer, not 5432 direct).

> **Note:** `drizzle-kit push` is a schema-push (no migration history tracking). It's safe to
> run multiple times (idempotent for `CREATE TABLE IF NOT EXISTS`). The migrations already use
> `IF NOT EXISTS` in their SQL.

### Demo seed

The `scripts/seed-demo.ts` script:

- Uses `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`
- Has idempotency check — safe to run multiple times (exits early if demo trainer row exists)
- Creates 2 auth users (`demo-trainer@trainerforge.app`, `demo-trainee@trainerforge.app`) with `email_confirm: true` bypassing email verification
- Run via: `pnpm seed:demo` (locally, with `.env.local` pointing at production Supabase)

**Prerequisite:** Migrations must be applied before seeding (foreign key constraints).

### Email templates

Supabase's default confirmation emails use the `Site URL` as the redirect base. Once the Site URL
is updated to the production domain, email links will automatically point to production. No custom
email template changes are required for beta.

---

## 4. PWA Requirements

### Current state

The root `public/` directory contains only Next.js default SVG placeholders:
`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`

**Missing for PWA installability:**

- `public/manifest.json`
- `public/icon-192.png` (192×192 required by Chrome install criteria)
- `public/icon-512.png` (512×512 for splash screen)
- `<link rel="manifest">` in root layout
- `<meta name="theme-color">` in root layout
- `<meta name="apple-mobile-web-app-capable">` for iOS
- `<meta name="apple-mobile-web-app-status-bar-style">`

### `public/manifest.json` spec

```json
{
  "name": "Forge",
  "short_name": "Forge",
  "description": "Track your training. Forge your progress.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#4ade80",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

> Theme color `#4ade80` matches the `NextTopLoader` color in the root layout.

### Root layout additions needed

```tsx
// In src/app/layout.tsx — add to Metadata export:
export const metadata: Metadata = {
  title: "Forge",
  description: "Track your training. Forge your progress.",
  manifest: "/manifest.json",
  themeColor: "#4ade80",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Forge",
  },
};
```

Using Next.js `Metadata` API is preferred over manual `<meta>` tags — Next.js generates the
correct `<link>` and `<meta>` elements automatically from this config.

### Icon generation

Source: create a 512×512 PNG from `public/icon.svg` (the app favicon). Generate both sizes.
If `icon.svg` doesn't exist yet, create a simple branded PNG first.

> **Finding:** `public/icon.svg` is listed in the user brief but does NOT appear in the actual
> workspace `public/` directory listing (only the 5 default Next.js SVGs exist). The icon will
> need to be created from scratch or sourced before manifest icons can be generated.

---

## 5. GitHub Setup

### Current git state

- Local repo exists with full commit history (`main` branch)
- **No remote configured** (`git remote -v` returns nothing)
- Phase 10 has 19 uncommitted/modified files — must be committed first

### `.gitignore` review

The existing `.gitignore` is correct and complete:

```
.env
.env*.local          # excludes .env.local (secrets)
!.env.local.example  # keeps the example file (correct)
.vercel              # excludes Vercel CLI token/project config
.next/               # build output
*.tsbuildinfo
```

**No changes needed to `.gitignore`.**

### What must never be committed

- `.env.local` — excluded by `.env*.local` pattern ✅
- Supabase service role key — lives only in `.env.local` and Vercel dashboard ✅
- Database password (in `DATABASE_URL`) — lives only in `.env.local` ✅
- `.vercel/` directory — excluded ✅

### Secrets to configure in GitHub (if using GitHub Actions CI in future)

Not needed for Phase 11 (no CI config). For future CI:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

### GitHub repo creation

GitHub CLI (`gh`) is **not installed**. Options:

1. Install `gh` CLI: `brew install gh && gh auth login` then `gh repo create forge --private`
2. Manual: Create repo at github.com → `git remote add origin <url>` → `git push -u origin main`

Recommended: Option 1 for speed (single `gh repo create` command vs manual steps).

---

## 6. Vercel Deployment

### Recommended approach: Git integration (not CLI)

Vercel CLI is **not installed**. The GitHub-integrated approach is simpler and gives automatic
preview deployments for every PR:

1. Push to GitHub
2. Vercel dashboard → "Add New Project" → Import from GitHub
3. Configure env vars in Vercel UI
4. Vercel auto-detects Next.js and sets optimal build config

### Build settings (auto-detected, no changes needed)

| Setting          | Value          | Source                              |
| ---------------- | -------------- | ----------------------------------- |
| Framework preset | Next.js        | Auto-detected                       |
| Build command    | `next build`   | `package.json` scripts              |
| Output directory | `.next`        | Next.js default                     |
| Install command  | `pnpm install` | Auto-detected from `pnpm-lock.yaml` |
| Node.js version  | 22.x           | Should be pinned                    |

### Node.js version pinning

Current dev environment is Node 22.15.1. Vercel defaults to Node 20. To pin Node 22 on Vercel:

Option A: Add `.node-version` file to repo root:

```
22
```

Option B: Add to `package.json`:

```json
"engines": {
  "node": ">=22"
}
```

Vercel respects both. Recommended: `.node-version` file (simpler, explicit).

### Vercel env vars to configure

In Vercel dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL             [All environments]  plain text
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY [All environments]  plain text
SUPABASE_SERVICE_ROLE_KEY            [All environments]  sensitive (hidden after save)
NEXT_PUBLIC_SITE_URL                 [Production only]   https://[your-app].vercel.app
                                     [Preview]           https://[branch-preview-url].vercel.app
                                     [Development]       http://localhost:3000
```

> `NEXT_PUBLIC_SITE_URL` should be set per-environment. Vercel supports environment-specific
> values. For Development env, use `http://localhost:3000`.

### No `vercel.json` needed

The app has no custom redirects, rewrites, headers, or function regions. Default Vercel
configuration handles everything. Do NOT create a `vercel.json` unless needed.

---

## 7. Deployment Order

Strict sequencing required — out of order causes broken auth redirects.

```
Phase 10 must be complete first
        │
        ▼
Step 1: Commit Phase 10 changes
        git add -A && git commit -m "feat(10): demo users and landing page"

Step 2: Create GitHub repository
        brew install gh && gh auth login
        gh repo create forge --private --source=. --push
        # OR: manual create at github.com, then git remote add + git push

Step 3: Import project to Vercel
        vercel.com → New Project → Import from GitHub → select "forge"
        Framework: Next.js (auto-detected)
        [DO NOT deploy yet — configure env vars first]

Step 4: Add env vars in Vercel dashboard
        NEXT_PUBLIC_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        SUPABASE_SERVICE_ROLE_KEY  (sensitive)
        NEXT_PUBLIC_SITE_URL = https://[your-app].vercel.app  (for Production)
        NEXT_PUBLIC_SITE_URL = http://localhost:3000  (for Development)

Step 5: Deploy to Vercel
        Trigger deploy (click "Deploy" after env vars set, or push a commit)
        Wait for build to complete — visit the *.vercel.app URL
        Expected: app loads, redirects to /login for unauthenticated users

Step 6: Note the production URL
        Copy the *.vercel.app URL (or custom domain if configured)

Step 7: Update Supabase Auth URL Configuration
        Supabase Dashboard → Authentication → URL Configuration
        Site URL:      https://[your-app].vercel.app
        Redirect URLs: https://[your-app].vercel.app/**
                       http://localhost:3000/**  (keep for local dev)

Step 8: Apply database migrations
        In .env.local, set DATABASE_URL to production Supabase connection string
        (Dashboard → Project Settings → Database → Transaction mode URI)
        pnpm drizzle-kit push
        Confirm: 11 tables created

Step 9: Run demo seed
        Ensure .env.local points to PRODUCTION Supabase (NEXT_PUBLIC_SUPABASE_URL
        and SUPABASE_SERVICE_ROLE_KEY must be the production values)
        pnpm seed:demo
        Expected output: "✓ Demo trainer auth user created" + trainee
        (Idempotent — safe to re-run, exits early if already seeded)

Step 10: Verify production
        Open https://[your-app].vercel.app in incognito
        ✓ Loads in Polish (default locale)
        ✓ Landing page visible (unauthenticated)
        ✓ Log in as demo-trainer@trainerforge.app / DemoTrainer2026!
        ✓ Log in as demo-trainee@trainerforge.app / DemoTrainee2026!
        ✓ Signup flow: create a new account, receive confirmation email,
          click link → redirects to /auth/callback on production URL (not localhost)

Step 11: Add PWA files (can be done before or after deploy)
        Create public/icon-192.png and public/icon-512.png
        Create public/manifest.json
        Update src/app/layout.tsx metadata with manifest + themeColor + appleWebApp
        Commit → Vercel auto-redeploys
        Verify: Chrome DevTools → Application → Manifest shows no errors
        Verify: "Add to Home Screen" prompt appears on mobile
```

---

## 8. Risk Areas

### RISK-1: `NEXT_PUBLIC_SITE_URL` not set → broken email confirmation

**Severity:** Critical  
**What breaks:** Signup confirmation emails redirect to `http://localhost:3000/auth/callback` — users get a "refused to connect" error in production.  
**Trigger:** Env var missing from Vercel, OR Supabase redirect URL whitelist not updated.  
**Prevention:** Set `NEXT_PUBLIC_SITE_URL` in Step 4. Update Supabase redirect URLs in Step 7. Verify in Step 10 by completing a real signup.

### RISK-2: Supabase redirect URL whitelist not updated

**Severity:** Critical  
**What breaks:** Even with `NEXT_PUBLIC_SITE_URL` set correctly, Supabase silently redirects to `Site URL` root if production domain is not in the whitelist. Auth callback query params (`?role=trainer`, `?code=...`) are lost.  
**Prevention:** Step 7 is mandatory before any real user testing.

### RISK-3: Migrations not applied → app crashes on first DB query

**Severity:** Critical  
**What breaks:** All data operations (login, profile, exercises) fail with "relation does not exist" Postgres errors.  
**Prevention:** Run `drizzle-kit push` in Step 8 before attempting login with demo users.

### RISK-4: Seed run before migrations

**Severity:** High  
**What breaks:** Seed script creates auth users successfully (stored in Supabase Auth, which is separate) but fails when inserting into `trainers`/`trainees` tables (foreign key errors or missing tables).  
**Prevention:** Enforce Step 8 before Step 9. The idempotency check in seed only checks the `trainers` table — auth users could be orphaned if the table query fails mid-seed.

### RISK-5: Node.js version mismatch

**Severity:** Medium  
**What breaks:** Build may fail or produce runtime errors if Vercel uses Node 20 while dev uses Node 22.15.1. `react@19.2.3` and some dependencies may have Node version requirements.  
**Prevention:** Add `.node-version` file with `22` before first deploy (Step 5).

### RISK-6: Phase 10 uncommitted changes pushed dirty

**Severity:** Medium  
**What breaks:** Unstaged changes won't be in the deployed build. App may appear partially built (e.g., landing page, profile pages incomplete).  
**Prevention:** Step 1 — commit all Phase 10 changes before `git push`.

### RISK-7: SUPABASE_SERVICE_ROLE_KEY accidentally exposed

**Severity:** Critical (security)  
**What breaks:** The service role key bypasses all RLS policies. If it ends up in a `NEXT_PUBLIC_` variable or a client-side bundle, any user could perform admin operations.  
**Prevention:** Key is accessed only in `src/lib/supabase/admin.ts` (server-side only). Middleware, server actions, and API routes are server-only. Verified: no `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` variable exists.

### RISK-8: `manifest.json` missing → PWA not installable

**Severity:** Low (for beta)  
**What breaks:** Chrome/Safari won't show "Add to Home Screen" prompt. App works normally as a web app but cannot be installed.  
**Prevention:** Add manifest files before publicizing the beta URL to testers. Not blocking for initial deploy but required before user communications.

### RISK-9: `DATABASE_URL` accidentally added to Vercel

**Severity:** Low  
**What happens:** No runtime effect (the app doesn't read it) but unnecessarily exposes DB credentials in Vercel's environment. Mark as low risk but avoid.

---

## Environment Availability

| Dependency        | Required By       | Available | Version             | Fallback                                    |
| ----------------- | ----------------- | --------- | ------------------- | ------------------------------------------- |
| Node.js 22        | Build + runtime   | ✓         | 22.15.1             | —                                           |
| pnpm              | Install + scripts | ✓         | 10.30.1             | —                                           |
| Git               | Source control    | ✓         | (local repo exists) | —                                           |
| GitHub CLI (`gh`) | Repo creation     | ✗         | —                   | Create repo via github.com UI               |
| Vercel CLI        | Deployment        | ✗         | —                   | Deploy via Vercel dashboard Git integration |
| `drizzle-kit`     | Migrations        | ✓         | ^0.31.9 (devDep)    | Apply SQL manually in Supabase dashboard    |

**Missing dependencies with fallback:**

- `gh` CLI: Use GitHub web UI to create repo, then `git remote add origin` + `git push`
- `vercel` CLI: Use Vercel dashboard "Import Project" from GitHub (recommended anyway)

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `next.config.ts` — verified minimal config, no production changes needed
- `package.json` — verified scripts, dependency versions, packageManager
- `src/middleware.ts` — verified Supabase SSR client, edge-compatible, dynamic origin
- `src/app/layout.tsx` — verified no PWA meta tags present
- `src/app/auth/callback/route.ts` — verified dynamic `origin` from request URL
- `src/app/(auth)/signup/trainer/actions.ts` — identified `NEXT_PUBLIC_SITE_URL` gap
- `src/app/(auth)/signup/trainee/actions.ts` — confirmed same gap
- `src/app/(auth)/forgot-password/actions.ts` — verified `headers().get('origin')` safe
- `.env.local.example` — confirmed `NEXT_PUBLIC_SITE_URL` missing
- `.gitignore` — verified correct, no changes needed
- `public/` directory listing — confirmed no icon.svg, no manifest.json
- `src/lib/db/migrations/` listing — confirmed 11 migrations (0001–0011)
- `drizzle.config.ts` — confirmed `DATABASE_URL` only needed for migrations
- `scripts/seed-demo.ts` — verified idempotency, env var usage, demo credentials
- `src/i18n/constants.ts` + `request.ts` — confirmed cookie-based locale, no URL-prefix routing

## Metadata

**Confidence breakdown:**

- Codebase readiness: HIGH — direct file inspection
- Environment variables: HIGH — grep + file reads confirmed all usages
- Supabase configuration: HIGH — confirmed from code patterns + Phase 1 notes in planning dir
- PWA requirements: HIGH — directory listing confirmed no existing manifest/icons
- GitHub setup: HIGH — `git remote -v` confirmed no remote
- Vercel deployment: HIGH — standard Next.js deployment, no unusual config
- Deployment order: HIGH — derived from dependency ordering between services

**Research date:** 2026-03-30  
**Valid until:** 2026-04-30 (stable domain — Vercel/Supabase APIs don't change frequently)
