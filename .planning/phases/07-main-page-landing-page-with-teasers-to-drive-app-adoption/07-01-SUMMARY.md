---
phase: 07-main-page-landing-page-with-teasers-to-drive-app-adoption
plan: "01"
subsystem: public-marketing
tags: [landing-page, middleware, public-routes, server-component]
dependency_graph:
  requires: []
  provides: [landing-page-at-root, help-public-route]
  affects: [src/app/page.tsx, src/middleware.ts]
tech_stack:
  added: []
  patterns: [server-component-only, inline-svg-icons, next-link-for-internal-routes]
key_files:
  created: []
  modified:
    - src/app/page.tsx
    - src/middleware.ts
decisions:
  - Landing page is a pure server component with no 'use client' directive — no JS shipped to browser for this page
  - Inline SVG icons used per existing pattern (no lucide-react or other icon library)
  - '/help' added to publicPaths only (not to the authenticated redirect logic) — unauthenticated users pass through, authenticated users already work correctly at /help via existing fall-through logic
metrics:
  duration: "1 min"
  completed_date: "2026-03-28"
  tasks_completed: 2
  files_modified: 2
---

# Phase 07 Plan 01: Landing Page and Middleware Fix Summary

Landing page replacing Next.js boilerplate at `/` with hero, 3 feature cards, and footer; middleware updated to allow unauthenticated access to `/help`.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Replace page.tsx with landing page | 62a0522 | src/app/page.tsx |
| 2 | Add /help to middleware publicPaths | c484265 | src/middleware.ts |

## What Was Built

**Landing page (`src/app/page.tsx`):**
- Pure server component (no `use client`, no `next/image`)
- Hero section: `ForgeLogo` horizontal `h-10`, headline "Replace the spreadsheet.", subheadline at 80% opacity, two CTA buttons (primary filled accent, secondary ghost border)
- Features section: "Why Forge?" heading, 3-column grid (mobile: stacked), each card with inline SVG icon in `text-accent`, bold title, and description at 70% opacity
- Footer: login link (`text-accent`) and help link (`text-text-primary`)
- All design tokens reused from existing `globals.css` — no new CSS variables

**Middleware (`src/middleware.ts`):**
- Added `'/help'` to `publicPaths` array
- Unauthenticated visitors at `/help` now pass through without redirect to `/login`
- Authenticated users at `/help` already worked correctly via existing fall-through logic — no changes needed there

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files exist:
- src/app/page.tsx: FOUND
- src/middleware.ts: FOUND

### Commits exist:
- 62a0522: FOUND
- c484265: FOUND

## Self-Check: PASSED
