# Phase 11: Deploy — Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 11 takes the fully built, locally validated app (Phases 1–10 complete) and makes it publicly accessible for beta testing.

1. **GitHub** — Create a GitHub repository, push code, set up branch protection. This enables CI/CD integration and collaborative access.

2. **Deployment platform** — Deploy the Next.js 16 App Router app to a hosting platform. Vercel is the natural fit (zero-config Next.js deploy, preview URLs, env var management). Alternatively Netlify or self-hosted on Render/Railway.

3. **Environment variables** — Supabase URL + anon key are safe to expose (public). Service role key must remain server-only. All env vars configured securely in the deploy platform dashboard.

4. **Supabase project** — Currently running locally or on an existing Supabase project. For production, the Supabase project must:
   - Have all DB migrations applied
   - Have the demo seed script run (`pnpm seed:demo`)
   - Have email auth configured (confirm email, redirect URLs)
   - Have the production domain added to the allowed redirect origins

5. **Domain** — Either use the free `*.vercel.app` domain for beta, or attach a custom domain if available.

6. **PWA readiness** — PROJECT.md specifies mobile-first PWA. A `manifest.json` and appropriate meta tags may need to be added for installability (home-screen icon, theme color, etc.).

</domain>

<decisions>
## Key Decisions to Make During Planning

### Deploy platform

- **Vercel** (recommended): Zero-config Next.js, automatic preview deployments, free tier, env var UI
- Alternative: Netlify, Railway, Render — more manual config needed

### Supabase email redirect URLs

- Must add production URL to Supabase `Site URL` and `Redirect URLs`
- Supabase currently has `localhost:3000` configured — production URL must be added

### PWA manifest

- PROJECT.md says PWA/installable. A `public/manifest.json` + `<link rel="manifest">` in root layout is required for installability
- The `icon.svg` favicon already exists — need PNG variants (192×192, 512×512) for manifest

### Database migrations

- Production Supabase project must have all migrations from `src/lib/db/migrations/` applied
- Can use Drizzle CLI (`drizzle-kit push`) or apply SQL files manually via Supabase dashboard

### Demo seed

- `pnpm seed:demo` must be run once against production Supabase after deploy
- Requires `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` set

</decisions>
