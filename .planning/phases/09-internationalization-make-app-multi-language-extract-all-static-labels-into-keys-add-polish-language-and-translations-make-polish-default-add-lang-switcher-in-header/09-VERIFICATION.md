---
phase: 09-internationalization
verified: 2026-03-29T20:00:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
human_verification_completed: true
human_verification_note: "User UAT approved — tested app in both Polish and English, confirmed all pages render correctly in both locales. Four bugs found and fixed prior to UAT sign-off."
---

# Phase 09: Internationalization Verification Report

**Phase Goal:** Make the app multi-language — extract all static labels into translation keys, add Polish language and translations, make Polish the default locale, add a language switcher in both nav headers.
**Verified:** 2026-03-29
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | next-intl is installed and next.config.ts wraps config with createNextIntlPlugin() | VERIFIED | `package.json` has `"next-intl": "^4.8.3"`; `next.config.ts` calls `createNextIntlPlugin()` and exports `withNextIntl(nextConfig)` |
| 2 | Root layout renders dynamic lang attribute matching active locale | VERIFIED | `src/app/layout.tsx` calls `await getLocale()` and renders `<html lang={locale}>` |
| 3 | NextIntlClientProvider wraps children in root layout | VERIFIED | `src/app/layout.tsx` wraps `{children}` with `<NextIntlClientProvider>` |
| 4 | LanguageSwitcher appears in both trainer and trainee nav headers (desktop + mobile) | VERIFIED | Both `NavHeader.tsx` and `TraineeNavHeader.tsx` render `<LanguageSwitcher currentLocale={locale} />` in the desktop `hidden md:flex` row and in the mobile sidebar bottom section with `min-h-[44px]` wrapper |
| 5 | Clicking EN/PL in switcher sets NEXT_LOCALE cookie and reloads page | VERIFIED | `LanguageSwitcher.tsx` writes `document.cookie = \`NEXT_LOCALE=...\`` with 1-year max-age and calls `window.location.reload()` |
| 6 | First visit (no cookie) defaults to Polish locale | VERIFIED | `src/i18n/request.ts` resolves locale from `NEXT_LOCALE` cookie falling back to `DEFAULT_LOCALE = 'pl'` |
| 7 | Lato font loads latin-ext subset for Polish diacritics | VERIFIED | `src/app/layout.tsx` configures Lato with `subsets: ['latin', 'latin-ext']` |
| 8 | All auth pages display translated text (no hardcoded English strings) | VERIFIED | `LoginForm.tsx` uses `useTranslations('auth')`; `login/page.tsx` uses `getTranslations('auth')`; 15 translation call sites found across auth pages |
| 9 | Landing page (/), help page (/help), and join page (/join/[token]) display translated text | VERIFIED | All three use `getTranslations('common')` |
| 10 | All trainer pages display translated text | VERIFIED | 109 `useTranslations`/`getTranslations` call sites across trainer route group; trainer namespace has 272 fully-populated keys |
| 11 | All trainee pages display translated text | VERIFIED | 44 `useTranslations`/`getTranslations` call sites across trainee route group; trainee namespace has 121 fully-populated keys |
| 12 | Polish and English translation files have full key parity | VERIFIED | Python key extraction: common=125 keys, auth=47 keys, trainer=272 keys, trainee=121 keys — parity confirmed in all 4 namespaces |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/i18n/request.ts` | getRequestConfig reading NEXT_LOCALE cookie, merging 4 namespace files | VERIFIED | Exports `getRequestConfig`, reads cookie via `LOCALE_COOKIE` constant, merges all 4 namespaces via `Promise.all` |
| `src/i18n/constants.ts` | Shared locale constants | VERIFIED | Exports `SUPPORTED_LOCALES`, `DEFAULT_LOCALE = 'pl'`, `LOCALE_COOKIE = 'NEXT_LOCALE'` |
| `src/components/LanguageSwitcher.tsx` | PL/EN toggle component | VERIFIED | Exports `LanguageSwitcher`, uses `LOCALE_COOKIE`, `window.location.reload`, `aria-pressed`, `role="group"` |
| `messages/pl/common.json` | Polish common translations | VERIFIED | 125 keys, full diacritics (ą, ę, ó, ź confirmed in file), all sub-namespaces populated (nav, button, empty, error, label, aria, landing, help, join, dateRange, completedPlan, progression, modal, muscleGroup, day, video) |
| `messages/en/common.json` | English common translations | VERIFIED | 125 keys, mirrors Polish structure exactly |
| `messages/pl/auth.json` | Polish auth translations | VERIFIED | 47 keys, covers login, signup, forgotPassword, resetPassword, verifyEmail — not a stub |
| `messages/en/auth.json` | English auth translations | VERIFIED | 47 keys, parity confirmed |
| `messages/pl/trainer.json` | Polish trainer translations | VERIFIED | 272 keys, covers trainees, invite, exercises, plans, planDetail, traineeDetail, editPlan, assignPlan, profile, and muscle group labels |
| `messages/en/trainer.json` | English trainer translations | VERIFIED | 272 keys, parity confirmed |
| `messages/pl/trainee.json` | Polish trainee translations | VERIFIED | 121 keys, covers home, exercises, plan, workout, finishWorkout |
| `messages/en/trainee.json` | English trainee translations | VERIFIED | 121 keys, parity confirmed |
| `global.d.ts` | TypeScript IntlMessages augmentation | VERIFIED | Imports all 4 English namespace files and augments `interface IntlMessages` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `next.config.ts` | `src/i18n/request.ts` | `createNextIntlPlugin()` auto-discovery | WIRED | `createNextIntlPlugin()` called with no args; next-intl auto-discovers `src/i18n/request.ts` at default path |
| `src/app/layout.tsx` | `next-intl` | `NextIntlClientProvider` + `getLocale()` | WIRED | Both `NextIntlClientProvider` and `getLocale` imported and used |
| `src/components/LanguageSwitcher.tsx` | `src/i18n/constants.ts` | `LOCALE_COOKIE` constant | WIRED | Imports and uses `LOCALE_COOKIE` from `@/i18n/constants` |
| `src/app/(trainer)/layout.tsx` | `NavHeader.tsx` | `locale` prop | WIRED | Calls `await getLocale() as Locale` and passes `locale={locale}` to `NavHeader` |
| `src/app/(trainee)/layout.tsx` | `TraineeNavHeader.tsx` | `locale` prop | WIRED | Calls `await getLocale() as Locale` and passes `locale={locale}` to `TraineeNavHeader` |
| `NavHeader.tsx` | `LanguageSwitcher.tsx` | Render in desktop + mobile sidebar | WIRED | `<LanguageSwitcher currentLocale={locale} />` present in both desktop `hidden md:flex` section and mobile sidebar with `min-h-[44px]` wrapper |
| `TraineeNavHeader.tsx` | `LanguageSwitcher.tsx` | Render in desktop + mobile sidebar | WIRED | Same pattern as NavHeader |
| `src/app/(auth)/login/_components/LoginForm.tsx` | `messages/*/auth.json` | `useTranslations('auth')` | WIRED | Imports `useTranslations` from `next-intl`, calls `useTranslations('auth')` |
| `src/app/page.tsx` | `messages/*/common.json` | `getTranslations('common')` | WIRED | Imports and calls `getTranslations('common')` |

---

### Requirements Coverage

The requirement IDs I18N-01 through I18N-09 are phase-internal identifiers defined within the plan frontmatter. They do not appear in `.planning/REQUIREMENTS.md` (which tracks v1 product requirements only). This is consistent with the project's convention — REQUIREMENTS.md covers user-facing product features; infrastructure and quality phases use internal IDs. No orphaned requirements.

| Requirement | Source Plan | Description (inferred) | Status |
|-------------|-------------|------------------------|--------|
| I18N-01 | 09-01, 09-05 | next-intl infrastructure setup | SATISFIED |
| I18N-02 | 09-01, 09-05 | Cookie-based locale resolution, Polish default | SATISFIED |
| I18N-03 | 09-01, 09-05 | LanguageSwitcher in both nav headers | SATISFIED |
| I18N-04 | 09-01, 09-05 | Lato font latin-ext subset | SATISFIED |
| I18N-05 | 09-01, 09-05 | TypeScript IntlMessages augmentation | SATISFIED |
| I18N-06 | 09-02, 09-05 | Auth pages + public pages + shared components i18n | SATISFIED |
| I18N-07 | 09-03, 09-05 | Trainer core pages and components i18n | SATISFIED |
| I18N-08 | 09-04, 09-05 | Trainer trainee-detail pages + trainee route group i18n | SATISFIED |
| I18N-09 | 09-05 | End-to-end verification, human UAT sign-off | SATISFIED — human UAT approved |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `messages/pl/trainer.json` | 214, 221 | `"placeholder"` key | Info | Not a stub — these are translation values for `<textarea placeholder>` attributes (goals editor, trainer notes editor). Legitimate use of the word "placeholder" as a UI string, not a stub sentinel. |

No blockers or warnings. The only match for the word "placeholder" in messages is two legitimate textarea placeholder strings — not stub sentinels.

---

### Bug Fixes Verified (UAT-discovered, committed before sign-off)

All four bugs reported as fixed during UAT are confirmed resolved in the codebase:

1. **Muscle group filter chips** — `ExercisesTab.tsx` and `TraineeExercisesTab.tsx` both call `getTranslations('trainer')` and use `t()` for muscle group labels. Translation keys confirmed in `messages/pl/trainer.json` and `messages/en/trainer.json` under the `muscleGroup` namespace in `common.json`.

2. **Polish diacritics** — `messages/pl/common.json` contains correct Polish characters throughout: ą, ę, ó, ź, ć, ń, ś, ż, ź confirmed (e.g. "Biblioteka ćwiczeń", "Ćwiczenia", "Otwórz menu", "Wyloguj się").

3. **Duplicate week/workout count** — `src/app/(trainee)/trainee/page.tsx` uses `getTranslations('trainee')` with interpolation-only rendering. The translation value `"workoutsPerWeek": "{count} treningów/tydz."` contains the interpolation token; JSX does not concatenate an additional literal count.

4. **Mobile viewport overflow** — `min-w-[768px]` is confirmed absent from both `src/app/(trainer)/layout.tsx` and `src/app/(trainee)/layout.tsx`. Grep across entire `src/` directory returned no matches.

---

### Human Verification

**Status: Completed and approved.** The user performed a full UAT walkthrough and confirmed:
- Polish renders by default on first visit (no NEXT_LOCALE cookie)
- PL/EN toggle works in both trainer and trainee nav headers on desktop and mobile sidebar
- `lang` attribute on the HTML element updates dynamically to match active locale
- No raw translation keys (e.g. `common.button.save`) visible on any page
- Polish diacritics render correctly in Lato font
- All four bug fixes verified visually

---

## Summary

Phase 09 goal fully achieved. The app is multi-language with:
- Cookie-based locale resolution (no URL segments), Polish as default
- LanguageSwitcher (PL | EN) wired into both nav headers at desktop and mobile breakpoints
- All static labels extracted across auth, trainer, trainee, and public pages into 8 JSON files (4 namespaces × 2 locales)
- Full key parity across all namespaces (565 total keys, 0 mismatches)
- TypeScript type safety via `global.d.ts` IntlMessages augmentation
- Human UAT sign-off confirming both locales work end-to-end

---

_Verified: 2026-03-29_
_Verifier: Claude (gsd-verifier)_
