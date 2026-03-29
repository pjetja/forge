# Phase 9: Internationalization — Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the Forge app multi-language: extract all static string literals from ~89 UI files into i18n keys, provide Polish translations (plus English as the secondary language), set Polish as the default language on first visit, and add a language switcher toggle (PL | EN) in both trainer and trainee nav headers.

This phase covers: library setup, key extraction, Polish/English translations, locale detection/persistence, and the switcher UI component. It does NOT cover adding more languages beyond pl/en, translating server-generated emails, or auto-detecting browser language.

</domain>

<decisions>
## Implementation Decisions

### i18n Library
- **D-01:** Use **next-intl** — the standard i18n solution for Next.js App Router. Works natively in both server components and client components, integrates with middleware for locale routing, well-maintained.

### Translation File Structure
- **D-02:** Namespaced by feature area. Files live at `messages/` root in project root.
  - `messages/pl/common.json` — shared labels used across both roles (buttons, validation, empty states, toasts)
  - `messages/pl/auth.json` — login, signup, forgot password, reset password pages
  - `messages/pl/trainer.json` — trainer-specific UI: plan builder, trainees list, exercise library, progress views
  - `messages/pl/trainee.json` — trainee-specific UI: workout logging, plans tab, exercises tab, log tab, body weight tab
  - Mirror structure for English: `messages/en/common.json`, etc.
- **D-03:** Translation scope — all user-visible UI text: nav labels, buttons, headings, placeholders, empty state messages, form labels, error/toast messages shown to users. Skip: console.log strings, server-only internal strings, code identifiers.

### Locale Strategy
- **D-04:** No URL prefix — locale stored in a cookie (`NEXT_LOCALE` or next-intl default). Existing URLs (`/trainer`, `/trainee`, etc.) remain unchanged — no link breakage.
- **D-05:** Polish is always the default locale for first-time visitors (no cookie set). Do NOT detect browser language — target users are Polish, consistent experience is preferred.
- **D-06:** Supported locales: `['pl', 'en']`. Default: `'pl'`.

### Language Switcher UX
- **D-07:** Text toggle: **PL | EN** — active language highlighted (e.g., accent color or bold). Minimal, fits the dark design system, no flag asset dependency.
- **D-08:** Position: right side of the header bar, before the avatar/user area. Appears in BOTH `NavHeader.tsx` (trainer) and `TraineeNavHeader.tsx` (trainee). These are separate client components — no shared component to avoid cross-route-group import.
- **D-09:** Switching language persists via cookie (next-intl default mechanism) and triggers a page re-render with the new locale.

### Claude's Discretion
- Exact cookie name and expiry for locale persistence (follow next-intl defaults)
- Whether to create a shared `LanguageSwitcher` client component in `src/components/` (acceptable since it's not a cross-route-group import — `src/components/` is shared)
- Translation key naming convention (e.g., `nav.trainees`, `button.save`, `form.email.placeholder`)
- Whether root layout `lang` attribute is updated dynamically per locale

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Nav Headers (to add switcher to)
- `src/app/(trainer)/_components/NavHeader.tsx` — trainer nav header (client component, sidebar pattern)
- `src/app/(trainee)/_components/TraineeNavHeader.tsx` — trainee nav header (separate client component)

### Root Layout (lang attribute update)
- `src/app/layout.tsx` — currently has `lang="en"` hardcoded, needs to be dynamic

### Middleware (locale detection integration point)
- `src/middleware.ts` — currently auth-only; next-intl locale middleware needs to be composed here

### Project Conventions
- `.planning/STATE.md` — Decisions section (especially: no cross-route-group imports between (trainer) and (trainee))
- `.planning/ROADMAP.md` — Phase 9 scope definition

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/` — shared component directory (acceptable for a shared `LanguageSwitcher` component since it's not a route-group import)
- Both nav headers are `'use client'` components — can use hooks for locale switching

### Established Patterns
- No cross-route-group imports between `(trainer)` and `(trainee)` — components that appear in both must be in `src/components/` or duplicated
- Server components used for data fetching in page.tsx files; nav headers are client components
- Supabase auth middleware pattern in `src/middleware.ts` — next-intl middleware must be composed with it (not replace it)
- Dark design system with accent emerald (#10b981) — active lang toggle should use this color

### Integration Points
- `src/middleware.ts` — compose next-intl locale middleware with existing Supabase auth middleware
- `src/app/layout.tsx` — update `lang` attribute dynamically; wrap with next-intl `NextIntlClientProvider`
- Both nav headers — add `LanguageSwitcher` (or inline toggle) before avatar

</code_context>

<specifics>
## Specific Ideas

- Polish is the default; English is secondary. Not the other way around.
- PL | EN text toggle (not flags). Active language should be visually distinct (accent/bold).
- No URL structure change — cookie-based locale, URLs stay clean.
- Namespaced translation files under `messages/` mirror the app's route group structure.

</specifics>

<deferred>
## Deferred Ideas

- Adding a third language (e.g., German, Ukrainian) — scope for a future phase
- Browser language auto-detection — explicitly deferred; Polish default for all new visitors
- Translating server-generated emails or notifications — out of scope for this phase
- RTL language support — not applicable for pl/en

</deferred>

---

*Phase: 09-internationalization*
*Context gathered: 2026-03-29*
