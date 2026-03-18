---
phase: 06-trainee-and-trainer-profile-pages
plan: 01
subsystem: database
tags: [gravatar, drizzle, postgres, rls, migration]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: trainers, users, trainer_trainee_connections tables + base RLS policies
provides:
  - "DB migration 0009_profile_fields.sql: 6 new profile columns across 3 tables + 2 RLS policies"
  - "src/lib/gravatar.ts: gravatarUrl() pure function using Node.js crypto MD5"
  - "src/components/GravatarAvatar.tsx: shared avatar img component with rounded-full"
  - "Updated Drizzle schema with bio, goals, heightCm, weightKg, dateOfBirth, trainerNotes"
affects:
  - 06-02-trainer-profile-page
  - 06-03-trainee-profile-page
  - 06-04-nav-avatar

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Node.js crypto.createHash('md5') for Gravatar hash (not Web Crypto, which lacks MD5)"
    - "Plain <img> tag for Gravatar (avoids remotePatterns config); d=mp param for default silhouette"
    - "text() Drizzle type for PostgreSQL date columns — PostgREST serializes date as ISO string"

key-files:
  created:
    - src/lib/db/migrations/0009_profile_fields.sql
    - src/lib/gravatar.ts
    - src/components/GravatarAvatar.tsx
  modified:
    - src/lib/db/schema.ts

key-decisions:
  - "text('date_of_birth') used in Drizzle (not date()) — PostgREST serializes PostgreSQL date as YYYY-MM-DD string, using text avoids type mismatch"
  - "GravatarAvatar has no 'use client' directive — pure presentational component, works in both server and client contexts"
  - "trainer_updates_own_connection RLS policy added — existing policies only covered SELECT/DELETE, trainer needs UPDATE to save trainer_notes"
  - "trainee_sees_connected_trainer RLS policy added to trainers table — enables trainee to read their trainer's bio/name on profile page"

patterns-established:
  - "Gravatar pattern: gravatarUrl(email, size) computed server-side, GravatarAvatar renders client-side"
  - "Profile data pattern: optional nullable columns with text type for flexible optional fields"

requirements-completed: [PROF-SCHEMA, PROF-GRAVATAR]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 6 Plan 01: Profile Foundation Summary

**DB migration adding 6 profile columns + 2 RLS policies, Node.js crypto Gravatar utility, and shared GravatarAvatar component**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T13:54:42Z
- **Completed:** 2026-03-18T13:56:01Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Migration 0009_profile_fields.sql adds bio (trainers), goals/height_cm/weight_kg/date_of_birth (users), trainer_notes (connections) + 2 targeted RLS policies
- gravatarUrl() pure function using Node.js crypto createHash MD5 — returns Gravatar URL with configurable size and d=mp fallback
- GravatarAvatar shared component renders plain img with rounded-full class, no 'use client' directive
- Drizzle schema updated with all 6 new typed columns; TypeScript check passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration SQL + Gravatar utility + GravatarAvatar component** - `d38c592` (feat)
2. **Task 2: Update Drizzle schema with new columns** - `1e3ef11` (feat)

## Files Created/Modified

- `src/lib/db/migrations/0009_profile_fields.sql` - 6 ALTER TABLE statements + trainer_updates_own_connection and trainee_sees_connected_trainer RLS policies
- `src/lib/gravatar.ts` - gravatarUrl(email, size?) using Node.js crypto MD5
- `src/components/GravatarAvatar.tsx` - Shared avatar img component, no client directive
- `src/lib/db/schema.ts` - trainers.bio, users.goals/heightCm/weightKg/dateOfBirth, trainerTraineeConnections.trainerNotes

## Decisions Made

- `text('date_of_birth')` in Drizzle instead of `date()` — PostgREST serializes PostgreSQL date columns as ISO strings; using text avoids runtime type mismatch
- GravatarAvatar uses plain `<img>` tag (not Next.js Image) — avoids needing remotePatterns config for gravatar.com; `d=mp` ensures valid fallback silhouette always loads
- Two new RLS policies in same migration: trainer_updates_own_connection (for saving notes) and trainee_sees_connected_trainer (for viewing trainer profile)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Apply migration to Supabase SQL Editor:** paste `src/lib/db/migrations/0009_profile_fields.sql` into Supabase SQL Editor and run before profile pages can be used end-to-end.

## Next Phase Readiness

- Foundation complete: migration SQL, Drizzle schema, Gravatar utility, and GravatarAvatar component are all ready
- Plans 06-02 (trainer profile page) and 06-03 (trainee profile page) can begin immediately
- Migration must be applied to Supabase before end-to-end testing

---
*Phase: 06-trainee-and-trainer-profile-pages*
*Completed: 2026-03-18*
