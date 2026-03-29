---
phase: 09-internationalization
plan: 01
subsystem: ui
tags: [next-intl, i18n, internationalization, typescript, react, nextjs]

# Dependency graph
requires:
  - phase: 06-trainee-and-trainer-profile-pages
    provides: nav headers (NavHeader, TraineeNavHeader) that this plan extends with i18n
  - phase: 01.1-ui-design-system
    provides: design tokens (text-accent, text-border, text-text-primary) used in LanguageSwitcher
provides:
  - next-intl 4.8.3 installed and configured
  - src/i18n/constants.ts — SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE
  - src/i18n/request.ts — cookie-based locale resolution merging 4 namespace files
  - src/components/LanguageSwitcher.tsx — PL/EN toggle with cookie-based switching
  - 8 translation JSON files (pl/en x common/auth/trainer/trainee)
  - global.d.ts — TypeScript IntlMessages augmentation
  - Root layout with NextIntlClientProvider and dynamic lang attribute
  - Lato font with latin-ext subset for Polish diacritics
affects:
  - 09-02-string-extraction-auth
  - 09-03-string-extraction-trainer
  - 09-04-string-extraction-trainee
  - 09-05-string-extraction-remaining

# Tech tracking
tech-stack:
  added: [next-intl@4.8.3]
  patterns:
    - Cookie-based locale without URL segments — NEXT_LOCALE cookie drives locale selection
    - Namespace-per-domain JSON files (common/auth/trainer/trainee) spread-merged at request time
    - Locale prop threading — server layouts read locale via getLocale(), pass to client components
    - useTranslations('common') for nav labels in 'use client' nav headers

key-files:
  created:
    - src/i18n/constants.ts
    - src/i18n/request.ts
    - src/components/LanguageSwitcher.tsx
    - global.d.ts
    - messages/pl/common.json
    - messages/en/common.json
    - messages/pl/auth.json
    - messages/en/auth.json
    - messages/pl/trainer.json
    - messages/en/trainer.json
    - messages/pl/trainee.json
    - messages/en/trainee.json
  modified:
    - next.config.ts
    - src/app/layout.tsx
    - src/app/(trainer)/layout.tsx
    - src/app/(trainee)/layout.tsx
    - src/app/(trainer)/_components/NavHeader.tsx
    - src/app/(trainee)/_components/TraineeNavHeader.tsx

key-decisions:
  - "Cookie-based locale (NEXT_LOCALE) without URL path segments — simpler routing, no [locale] segment needed"
  - "4 namespace JSON files per locale spread-merged in request.ts — flat message object with top-level namespace keys prevents collision"
  - "Locale prop threaded from server layout through to client nav components (not read inside client) — avoids client-side async, locale is server-authoritative"
  - "global.d.ts augments IntlMessages from English message types — EN is canonical type source, PL is translation"

patterns-established:
  - "Locale constants in src/i18n/constants.ts — all i18n code imports LOCALE_COOKIE, DEFAULT_LOCALE from here"
  - "Server layout reads locale, passes as prop — client components receive locale as prop, never call getLocale()"
  - "Translation keys use namespace prefix (common.nav.*, common.button.*) — prevents key collision across namespace files"

requirements-completed: [I18N-01, I18N-02, I18N-03, I18N-04, I18N-05]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 09 Plan 01: i18n Infrastructure Summary

**next-intl 4.8.3 installed with cookie-based locale switching, LanguageSwitcher in both nav headers, 8 translation JSON scaffolds, and Polish as default locale**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T18:08:47Z
- **Completed:** 2026-03-29T18:12:14Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- next-intl installed and wired into next.config.ts via createNextIntlPlugin()
- Root layout updated to use NextIntlClientProvider, dynamic lang attribute, and Lato latin-ext subset
- LanguageSwitcher component created with PL/EN toggle, NEXT_LOCALE cookie, and aria accessibility
- Both nav headers (trainer + trainee) updated with LanguageSwitcher and useTranslations for nav labels
- All 8 translation JSON files scaffolded with correct top-level namespace keys

## Task Commits

Each task was committed atomically:

1. **Task 1: Install next-intl + i18n infrastructure + translation JSON scaffolds** - `f6c8d13` (feat)
2. **Task 2: Create LanguageSwitcher component + wire into both nav headers** - `f81110d` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/i18n/constants.ts` - SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE exports
- `src/i18n/request.ts` - getRequestConfig reading NEXT_LOCALE cookie, merging 4 namespace files
- `src/components/LanguageSwitcher.tsx` - PL | EN toggle, window.location.reload on switch
- `global.d.ts` - TypeScript IntlMessages augmentation from English message types
- `next.config.ts` - Wrapped with createNextIntlPlugin()
- `src/app/layout.tsx` - Async, NextIntlClientProvider, dynamic lang={locale}, latin-ext subset
- `src/app/(trainer)/layout.tsx` - Added getLocale(), passes locale prop to NavHeader
- `src/app/(trainee)/layout.tsx` - Added getLocale(), passes locale prop to TraineeNavHeader
- `src/app/(trainer)/_components/NavHeader.tsx` - locale prop, LanguageSwitcher, useTranslations, labelKey pattern
- `src/app/(trainee)/_components/TraineeNavHeader.tsx` - Same pattern as NavHeader
- `messages/pl/common.json` - Polish common translations (nav, button, empty, error, label, aria)
- `messages/en/common.json` - English common translations (mirror structure)
- `messages/pl/auth.json` + `messages/en/auth.json` - Stubs with auth namespace
- `messages/pl/trainer.json` + `messages/en/trainer.json` - Stubs with trainer namespace
- `messages/pl/trainee.json` + `messages/en/trainee.json` - Stubs with trainee namespace

## Decisions Made
- Cookie-based locale without URL segments: simpler routing, no [locale] segment needed in Next.js App Router
- 4 namespace files per locale spread-merged in request.ts: flat message object prevents key collision, namespace top-level keys ('common', 'auth', etc.) provide natural grouping
- Locale prop threading: server layouts read locale via getLocale(), pass as prop to client nav headers — avoids client-side async, locale is server-authoritative
- English as canonical type source in global.d.ts — PL is translation, EN drives TypeScript IntlMessages types

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- i18n infrastructure complete: Plans 02-04 can now extract strings into their respective namespace files
- Translation keys namespaced under 'common', 'auth', 'trainer', 'trainee' — no collision possible
- LanguageSwitcher visible in both nav headers; Polish is default (no cookie = Polish)
- TypeScript is fully typed via global.d.ts — useTranslations('common') calls are type-safe

---
*Phase: 09-internationalization*
*Completed: 2026-03-29*
