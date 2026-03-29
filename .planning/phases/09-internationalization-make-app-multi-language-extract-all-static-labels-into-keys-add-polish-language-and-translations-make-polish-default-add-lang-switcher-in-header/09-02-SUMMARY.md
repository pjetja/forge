---
phase: 09-internationalization
plan: 02
subsystem: ui
tags: [next-intl, i18n, internationalization, auth, landing-page, shared-components, typescript, react, nextjs]

# Dependency graph
requires:
  - phase: 09-01
    provides: next-intl infrastructure, getTranslations/useTranslations API, JSON scaffolds
provides:
  - messages/en/auth.json fully populated with ~40 keys across login/signup/forgotPassword/resetPassword/verifyEmail
  - messages/pl/auth.json fully populated with Polish translations
  - messages/en/common.json expanded with landing/help/join/dateRange/completedPlan/progression/modal sections
  - messages/pl/common.json mirroring same expanded structure
  - All 7 auth page files using t() calls — no hardcoded English strings
  - Landing page, help page, join page translated
  - DateRangeToggle, Modal, CompletedPlanColumns, ProgressionBadge, ProgressionDropdown translated
affects:
  - 09-03-string-extraction-trainer
  - 09-04-string-extraction-trainee
  - 09-05-string-extraction-remaining

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server components use getTranslations('namespace') from next-intl/server
    - Client components use useTranslations('namespace') from next-intl
    - Client-only pages (already 'use client') stay as client components and use useTranslations
    - CompletedPlanColumns converted to async server component to use getTranslations
    - Progression labels/descriptions extracted into common.progression.* key hierarchy
    - VerifyEmailFallback as separate client subcomponent — allows useTranslations in Suspense fallback

key-files:
  created: []
  modified:
    - messages/en/auth.json
    - messages/pl/auth.json
    - messages/en/common.json
    - messages/pl/common.json
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/login/_components/LoginForm.tsx
    - src/app/(auth)/signup/trainer/page.tsx
    - src/app/(auth)/signup/trainee/page.tsx
    - src/app/(auth)/forgot-password/page.tsx
    - src/app/(auth)/reset-password/page.tsx
    - src/app/(auth)/verify-email/page.tsx
    - src/components/auth/SignupForm.tsx
    - src/app/page.tsx
    - src/app/help/page.tsx
    - src/app/join/[token]/page.tsx
    - src/components/DateRangeToggle.tsx
    - src/components/Modal.tsx
    - src/components/CompletedPlanColumns.tsx
    - src/components/ProgressionBadge.tsx
    - src/components/ProgressionDropdown.tsx

key-decisions:
  - "Client-only auth pages (forgot-password, reset-password, verify-email) keep 'use client' and use useTranslations instead of getTranslations — avoids converting them to server components"
  - "VerifyEmailFallback extracted as separate named client component — React requires hooks at top level of component, cannot use hook inline in Suspense fallback prop"
  - "CompletedPlanColumns converted to async server component — was already a server component, async is required for getTranslations"
  - "ProgressionDropdown PROGRESSION_OPTIONS export retained with hardcoded labels as backward-compatible fallback — not imported elsewhere but preserved for safety"
  - "Progression keys use doubleProgression camelCase in JSON to avoid dot-notation collision with double.progression key path"

requirements-completed: [I18N-06]

# Metrics
duration: 15min
completed: 2026-03-29
---

# Phase 09 Plan 02: Auth + Public Pages + Shared Components i18n Summary

**All auth pages, landing page, help page, join page, and shared UI components use t() calls — auth.json fully populated with ~40 keys in both Polish and English locales**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-29T18:09:00Z
- **Completed:** 2026-03-29T18:24:02Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments

- messages/en/auth.json and messages/pl/auth.json fully populated with login, signup, forgotPassword, resetPassword, verifyEmail key hierarchies (~40 keys each)
- 7 auth files updated: login/page.tsx, login/_components/LoginForm.tsx, signup/trainer/page.tsx, signup/trainee/page.tsx, forgot-password/page.tsx, reset-password/page.tsx, verify-email/page.tsx
- SignupForm.tsx (shared auth component) updated with useTranslations
- Landing page (src/app/page.tsx) uses getTranslations for all marketing strings
- Help page (src/app/help/page.tsx) uses getTranslations for all FAQ content including 5 Q&A pairs
- Join page (src/app/join/[token]/page.tsx) uses getTranslations for all status/error messages
- DateRangeToggle uses useTranslations for date range labels
- Modal uses useTranslations for close button aria-label
- CompletedPlanColumns converted to async server component, uses getTranslations for section headers and empty states
- ProgressionBadge and ProgressionDropdown use useTranslations for all progression mode labels, descriptions, and aria-labels
- messages/en/common.json and messages/pl/common.json expanded with landing, help, join, dateRange, completedPlan, progression, modal sections

## Task Commits

1. **Task 1: Extract strings from auth pages + populate auth.json** — `e525ef4` (feat)
2. **Task 2: Extract strings from public pages + shared components** — `956fadd` (feat)

## Files Created/Modified

### Translation Files
- `messages/en/auth.json` — Fully populated with 40+ auth keys
- `messages/pl/auth.json` — Polish translations of all auth keys
- `messages/en/common.json` — Expanded with landing/help/join/dateRange/completedPlan/progression/modal
- `messages/pl/common.json` — Polish translations of all new common keys

### Auth Pages + Components
- `src/app/(auth)/login/page.tsx` — getTranslations('auth'), all strings replaced
- `src/app/(auth)/login/_components/LoginForm.tsx` — useTranslations('auth'), all strings replaced
- `src/app/(auth)/signup/trainer/page.tsx` — getTranslations('auth')
- `src/app/(auth)/signup/trainee/page.tsx` — getTranslations('auth')
- `src/app/(auth)/forgot-password/page.tsx` — useTranslations('auth') (client component)
- `src/app/(auth)/reset-password/page.tsx` — useTranslations('auth') (client component)
- `src/app/(auth)/verify-email/page.tsx` — useTranslations('auth'), VerifyEmailFallback subcomponent
- `src/components/auth/SignupForm.tsx` — useTranslations('auth')

### Public Pages
- `src/app/page.tsx` — getTranslations('common'), all landing strings extracted
- `src/app/help/page.tsx` — getTranslations('common'), all FAQ content extracted
- `src/app/join/[token]/page.tsx` — getTranslations('common'), all error/status messages

### Shared Components
- `src/components/DateRangeToggle.tsx` — useTranslations('common') for date range labels
- `src/components/Modal.tsx` — useTranslations('common') for close aria-label
- `src/components/CompletedPlanColumns.tsx` — async + getTranslations for section headers
- `src/components/ProgressionBadge.tsx` — useTranslations for mode labels/descriptions
- `src/components/ProgressionDropdown.tsx` — useTranslations for all text including modal

## Decisions Made

- Client auth pages (forgot-password, reset-password, verify-email) retain `use client` and use `useTranslations` — avoids unnecessary architectural changes
- `VerifyEmailFallback` extracted as a separate component so it can use `useTranslations` hook (hooks cannot be used inline in JSX props like Suspense fallback)
- `CompletedPlanColumns` converted to async server component — needed for `getTranslations`; callers are all server components so no breaking change
- Progression keys use camelCase `doubleProgression` in JSON to avoid key path collision

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error in ProgressionBadge.tsx**
- **Found during:** Task 2 build verification
- **Issue:** Unused `PROGRESSION_KEY_MAP` constant had type error — `'doubleProgression'` not assignable to `ProgressionMode` type
- **Fix:** Removed the unused `PROGRESSION_KEY_MAP` and `ProgressionMode` type declarations
- **Files modified:** `src/components/ProgressionBadge.tsx`
- **Commit:** Included in feat(09-02) Task 2 commit

**2. [Rule 3 - Blocker] next-intl not installed in node_modules**
- **Found during:** Task 1 build verification
- **Issue:** `next-intl` was in package.json (added by 09-01) but node_modules was not installed (worktree issue)
- **Fix:** Ran `pnpm install` to install all packages including next-intl
- **Commit:** Not a code change — dependency installation

## Self-Check: PASSED

- messages/pl/auth.json: exists, 2355 bytes (> 500)
- messages/en/auth.json: exists, 2239 bytes (> 500)
- src/app/(auth)/login/_components/LoginForm.tsx: contains useTranslations
- src/components/auth/SignupForm.tsx: contains useTranslations
- src/app/(auth)/forgot-password/page.tsx: contains useTranslations
- src/app/(auth)/reset-password/page.tsx: contains useTranslations
- src/app/(auth)/verify-email/page.tsx: contains useTranslations
- src/app/page.tsx: contains getTranslations
- src/app/help/page.tsx: contains getTranslations
- messages/pl/common.json: contains landing, help, join sections
- messages/en/common.json: mirrors same structure
- pnpm build: PASSED

---
*Phase: 09-internationalization*
*Completed: 2026-03-29*
