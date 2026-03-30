---
phase: 11-deploy
plan: "01"
subsystem: infrastructure
tags: [pwa, manifest, git, env, layout]
dependency_graph:
  requires: [phase-10-complete]
  provides:
    [
      pwa-manifest,
      pwa-meta-tags,
      NEXT_PUBLIC_SITE_URL-documented,
      phase-10-committed,
    ]
  affects: [src/app/layout.tsx, .env.local.example, public/manifest.json]
tech_stack:
  added: []
  patterns: [PWA web app manifest, Apple PWA meta tags]
key_files:
  created:
    - public/manifest.json
  modified:
    - .env.local.example
    - src/app/layout.tsx
decisions:
  - Used explicit <head> element in RootLayout rather than Next.js metadata API, because manifest link and Apple PWA tags are not covered by Next.js Metadata API
  - Demo user credentials added to .env.local.example to document seed script requirements
metrics:
  duration: ~5 minutes
  completed: 2026-03-30
---

# Phase 11 Plan 01: PWA Setup & Phase 10 Commit Summary

Committed 42 Phase 10 files, added PWA web app manifest, wired Apple/Chrome PWA meta tags into root layout, documented NEXT_PUBLIC_SITE_URL in .env.local.example. Build passes with zero errors.

## Tasks Completed

| #   | Task                                           | Commit           | Files                                                                                          |
| --- | ---------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Commit Phase 10 uncommitted files              | `32d9fe4`        | 42 files (scripts/seed-demo.ts, auth actions, profile forms, migrations, seeds, planning docs) |
| 2   | Add NEXT_PUBLIC_SITE_URL to .env.local.example | `e082749`        | .env.local.example                                                                             |
| 3   | Create public/manifest.json                    | `e082749`        | public/manifest.json                                                                           |
| 4   | Generate PNG icons (SKIPPED — human action)    | —                | —                                                                                              |
| 5   | Add PWA meta tags to src/app/layout.tsx        | `e082749`        | src/app/layout.tsx                                                                             |
| 6   | Run pnpm build                                 | — (no new files) | build verified ✓                                                                               |

## Task 4 — Pending (Human Action)

Task 4 requires manual PNG export and **cannot be automated**. The user must:

1. Open `src/app/icon.svg`
2. Export at 192×192 → save as `public/icon-192.png`
3. Export at 512×512 → save as `public/icon-512.png`

Options:

- **Browser**: https://svgtopng.com or https://convertio.co/svg-png/
- **Inkscape**: `inkscape src/app/icon.svg --export-type=png --export-filename=public/icon-192.png --export-width=192 --export-height=192`
- **Node sharp**: `pnpm add -D sharp && node -e "const s=require('sharp'); s('src/app/icon.svg').resize(192).png().toFile('public/icon-192.png'); s('src/app/icon.svg').resize(512).png().toFile('public/icon-512.png');"`

After creating the PNGs, commit them:

```bash
git add public/icon-192.png public/icon-512.png && git commit -m "feat(11-01): add PWA icon PNGs (192x192 and 512x512)"
```

## Build Result

```
✓ Compiled successfully in 3.3s
✓ Finished TypeScript in 4.9s
✓ Collecting page data (21/21)
✓ Generating static pages (21/21)
```

Exit code: **0** — build passes.

Note: One deprecation warning (`middleware` file convention deprecated in favour of `proxy`) — this is pre-existing and unrelated to this plan.

## Deviations from Plan

None — plan executed exactly as written (Tasks 1–3, 5–6). Task 4 skipped as documented (human_action type).

## Known Stubs

None — no placeholder data or hardcoded empty values introduced in this plan.

## Self-Check: PASSED

- `public/manifest.json` ✓ exists
- `.env.local.example` contains `NEXT_PUBLIC_SITE_URL` ✓
- `src/app/layout.tsx` contains `rel="manifest"` ✓
- Commits `32d9fe4` and `e082749` ✓ exist
- `pnpm build` exit 0 ✓
