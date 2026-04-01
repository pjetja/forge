---
phase: 11-deploy
plan: "04"
subsystem: infrastructure
tags: [supabase, auth, seed, e2e, production]
dependency_graph:
  requires: [11-03]
  provides: [supabase-auth-configured, demo-seed-production, e2e-verified]
  affects: []
tech_stack:
  added: []
  patterns: [Supabase Auth URL Configuration, demo seed idempotency]
key_files:
  created: []
  modified: []
decisions:
  - Site URL updated to production Vercel domain; localhost kept in Redirect URLs for local dev
  - Demo seed run directly against production using local .env.local service_role key
  - Idempotency guard confirmed: second run exits with "already seeded" message
metrics:
  duration: ~10 minutes
  completed: 2026-04-01
---

# Phase 11 Plan 04: Supabase Auth Config + Demo Seed + E2E Verification Summary

Configured Supabase Auth redirect URLs for the production domain (`https://forge-three-tau.vercel.app`), ran the demo seed against the production database, verified idempotency, and confirmed the complete end-to-end flow on the live URL.

## Tasks Completed

| #   | Task                                             | Result                                                                 |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | Configure Supabase Auth Site URL + Redirect URLs | Site URL → `https://forge-three-tau.vercel.app`; redirect URLs updated |
| 2   | Run demo seed against production                 | `✓ Created demo trainer`, `✓ Created demo trainee`                     |
| 3   | Verify demo seed idempotency                     | `✓ Demo users already seeded — nothing to do.`                         |

## Self-Check: PASSED

- Supabase Site URL set to `https://forge-three-tau.vercel.app` ✓
- `https://forge-three-tau.vercel.app/**` in Supabase Redirect URLs whitelist ✓
- `http://localhost:3000/**` retained for local dev ✓
- Demo trainer (`demo.trainer@forge.app`) and trainee (`demo.trainee@forge.app`) exist in production ✓
- `pnpm seed:demo` (second run) exits with `✓ Demo users already seeded — nothing to do.` ✓
- Demo login flow works end-to-end on live URL ✓
- Full trainer signup + email confirmation → `/trainer` dashboard working ✓
