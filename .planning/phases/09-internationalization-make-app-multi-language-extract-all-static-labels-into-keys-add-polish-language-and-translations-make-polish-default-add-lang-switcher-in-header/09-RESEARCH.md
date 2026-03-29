# Phase 9: Internationalization — Research

**Researched:** 2026-03-29
**Domain:** next-intl, Next.js App Router i18n (no URL prefix, cookie-based locale)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use **next-intl** — the standard i18n solution for Next.js App Router. Works natively in both server components and client components, integrates with middleware for locale routing, well-maintained.
- **D-02:** Namespaced by feature area. Files live at `messages/` root in project root.
  - `messages/pl/common.json` — shared labels used across both roles (buttons, validation, empty states, toasts)
  - `messages/pl/auth.json` — login, signup, forgot password, reset password pages
  - `messages/pl/trainer.json` — trainer-specific UI: plan builder, trainees list, exercise library, progress views
  - `messages/pl/trainee.json` — trainee-specific UI: workout logging, plans tab, exercises tab, log tab, body weight tab
  - Mirror structure for English: `messages/en/common.json`, etc.
- **D-03:** Translation scope — all user-visible UI text: nav labels, buttons, headings, placeholders, empty state messages, form labels, error/toast messages shown to users. Skip: console.log strings, server-only internal strings, code identifiers.
- **D-04:** No URL prefix — locale stored in a cookie (`NEXT_LOCALE` or next-intl default). Existing URLs (`/trainer`, `/trainee`, etc.) remain unchanged — no link breakage.
- **D-05:** Polish is always the default locale for first-time visitors (no cookie set). Do NOT detect browser language — target users are Polish, consistent experience is preferred.
- **D-06:** Supported locales: `['pl', 'en']`. Default: `'pl'`.
- **D-07:** Text toggle: **PL | EN** — active language highlighted (e.g., accent color or bold). Minimal, fits the dark design system, no flag asset dependency.
- **D-08:** Position: right side of the header bar, before the avatar/user area. Appears in BOTH `NavHeader.tsx` (trainer) and `TraineeNavHeader.tsx` (trainee). These are separate client components — no shared component to avoid cross-route-group import.
- **D-09:** Switching language persists via cookie (next-intl default mechanism) and triggers a page re-render with the new locale.

### Claude's Discretion
- Exact cookie name and expiry for locale persistence (follow next-intl defaults)
- Whether to create a shared `LanguageSwitcher` client component in `src/components/` (acceptable since it's not a cross-route-group import — `src/components/` is shared)
- Translation key naming convention (e.g., `nav.trainees`, `button.save`, `form.email.placeholder`)
- Whether root layout `lang` attribute is updated dynamically per locale

### Deferred Ideas (OUT OF SCOPE)
- Adding a third language (e.g., German, Ukrainian) — scope for a future phase
- Browser language auto-detection — explicitly deferred; Polish default for all new visitors
- Translating server-generated emails or notifications — out of scope for this phase
- RTL language support — not applicable for pl/en
</user_constraints>

---

## Summary

Phase 9 installs next-intl 4.x (current: 4.8.3) in "without i18n routing" mode — meaning no URL locale prefixes, cookie-based locale only. This is the lightest possible next-intl setup: one plugin wrapper in `next.config.ts`, one request config file at `src/i18n/request.ts` that reads a cookie and loads the matching JSON messages, and `NextIntlClientProvider` in the root layout.

The translation file structure uses multiple JSON files per locale (four files per locale: `common`, `auth`, `trainer`, `trainee`) merged together in `getRequestConfig` using the spread operator. Each file uses nested JSON objects for namespace scoping. This manual merge is the community-standard pattern for next-intl (confirmed via official GitHub discussion #357) — no extra dependency needed.

String extraction is the largest effort: 101 TSX files across `src/app/` and `src/components/` need all user-visible strings replaced with `t('key')` calls. The existing middleware (`src/middleware.ts`) does NOT need next-intl middleware composed in — the "without i18n routing" setup skips next-intl middleware entirely. Cookie writing happens from the `LanguageSwitcher` client component directly.

**Primary recommendation:** Use next-intl 4.8.3 in "without i18n routing" mode. Skip next-intl middleware. Read locale from a cookie named `NEXT_LOCALE` in `src/i18n/request.ts`. Merge all four namespace files per locale via spread. Create one shared `LanguageSwitcher` in `src/components/`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-intl | 4.8.3 (latest) | i18n runtime: `useTranslations`, `getTranslations`, `NextIntlClientProvider`, `getRequestConfig` | Officially recommended for Next.js App Router; supports RSC and client components natively |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/headers `cookies()` | (built-in Next.js 16) | Read `NEXT_LOCALE` cookie in `src/i18n/request.ts` | Always — used in server-side locale resolution |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-intl (no URL routing) | next-intl with `[locale]` URL segment | URL routing requires full directory restructure under `app/[locale]/` — D-04 locks against this |
| Manual cookie set in `LanguageSwitcher` | next-intl `useRouter().replace()` with locale param | No-routing mode has no `useRouter` locale switching; direct cookie write + `window.location.reload()` is the correct pattern |
| Multiple JSON files merged via spread | Single large `messages/${locale}.json` | Single file is also valid but harder to maintain at scale; D-02 locks in per-namespace files |

**Installation:**
```bash
pnpm add next-intl
```

**Version verification (confirmed 2026-03-29):**
```
next-intl@4.8.3 — published latest as of npm registry query
```

---

## Architecture Patterns

### Recommended Project Structure
```
messages/
├── en/
│   ├── common.json     # shared: nav, buttons, validation, empty states
│   ├── auth.json       # login, signup, forgot/reset password
│   ├── trainer.json    # trainer-specific UI
│   └── trainee.json    # trainee-specific UI
└── pl/
    ├── common.json
    ├── auth.json
    ├── trainer.json
    └── trainee.json

src/
├── i18n/
│   └── request.ts      # getRequestConfig — reads cookie, loads + merges messages
├── components/
│   └── LanguageSwitcher.tsx   # shared client component, used in both nav headers
└── app/
    ├── layout.tsx       # wrap with NextIntlClientProvider, set lang= dynamically
    └── [all existing files — string replacement only]

next.config.ts           # wrapped with createNextIntlPlugin()
global.d.ts              # TypeScript Messages type augmentation (optional but recommended)
```

### Pattern 1: getRequestConfig with multi-file merge
**What:** Single request config function that reads locale from cookie and merges all four namespace JSON files.
**When to use:** Always — this is the entry point for all server-side translation resolution.
**Example:**
```typescript
// src/i18n/request.ts
// Source: https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing
// + https://github.com/amannn/next-intl/discussions/357 (multi-file merge pattern)
import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

const SUPPORTED_LOCALES = ['pl', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isValidLocale(value: string | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get('NEXT_LOCALE')?.value;
  const locale: Locale = isValidLocale(cookieValue) ? cookieValue : 'pl';

  const [common, auth, trainer, trainee] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/auth.json`),
    import(`../../messages/${locale}/trainer.json`),
    import(`../../messages/${locale}/trainee.json`),
  ]);

  return {
    locale,
    messages: {
      ...common.default,
      ...auth.default,
      ...trainer.default,
      ...trainee.default,
    },
  };
});
```

**Critical:** Each JSON file must use a top-level namespace key to prevent collisions:
```json
// messages/pl/common.json
{
  "common": {
    "button": { "save": "Zapisz", "cancel": "Anuluj" },
    "nav": { "trainees": "Kursanci", "plans": "Plany" },
    "empty": { "heading": "Brak danych" }
  }
}
```
```json
// messages/pl/auth.json
{
  "auth": {
    "login": { "heading": "Zaloguj sie" }
  }
}
```

### Pattern 2: next.config.ts plugin wrapper
**What:** Wraps next config with the next-intl plugin that wires up `src/i18n/request.ts` automatically.
**When to use:** Always — required for next-intl to work.
**Example:**
```typescript
// next.config.ts
// Source: https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {},
};

export default withNextIntl(nextConfig);
```

### Pattern 3: Root layout with NextIntlClientProvider and dynamic lang
**What:** Wraps children in `NextIntlClientProvider` (passes messages to client components), and reads locale for `lang` attribute.
**When to use:** Required — without this, `useTranslations` in client components throws.
**Example:**
```typescript
// src/app/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={lato.variable}>
      <body className="antialiased">
        <NextTopLoader ... />
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```
Note: `NextIntlClientProvider` without props automatically picks up the messages from the request config.

### Pattern 4: Server component translation
**What:** Use `getTranslations` in async server components/pages.
**When to use:** In all server components that render user-visible text.
**Example:**
```typescript
// Source: https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing
import { getTranslations } from 'next-intl/server';

export default async function TrainerPage() {
  const t = await getTranslations('trainer');
  return <h1>{t('trainees.heading')}</h1>;
}
```

### Pattern 5: Client component translation
**What:** Use `useTranslations` hook in client components.
**When to use:** In all `'use client'` components that render user-visible text.
**Example:**
```typescript
// Source: https://next-intl.dev/docs/usage/messages
import { useTranslations } from 'next-intl';

export function NavHeader(...) {
  const t = useTranslations('common');
  // ...
  <Link href="/trainer">{t('nav.trainees')}</Link>
}
```

### Pattern 6: LanguageSwitcher — cookie write + reload
**What:** Client component that sets `NEXT_LOCALE` cookie and reloads page to apply new locale.
**When to use:** "Without i18n routing" mode has no `useRouter` locale API — direct cookie manipulation is the correct pattern.
**Example:**
```typescript
// src/components/LanguageSwitcher.tsx
'use client';
import { useTranslations } from 'next-intl';

type Locale = 'pl' | 'en';

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const t = useTranslations('common');

  function switchLocale(locale: Locale) {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }

  return (
    <div role="group" aria-label={t('nav.language')} className="flex items-center text-sm">
      <button
        onClick={() => currentLocale !== 'pl' && switchLocale('pl')}
        aria-pressed={currentLocale === 'pl'}
        aria-label="Zmien jezyk na polski"
        className={currentLocale === 'pl'
          ? 'text-accent font-bold cursor-default'
          : 'text-text-primary/50 hover:text-accent font-bold transition-colors cursor-pointer'}
      >
        PL
      </button>
      <span aria-hidden="true" className="text-border mx-1">|</span>
      <button
        onClick={() => currentLocale !== 'en' && switchLocale('en')}
        aria-pressed={currentLocale === 'en'}
        aria-label="Switch to English"
        className={currentLocale === 'en'
          ? 'text-accent font-bold cursor-default'
          : 'text-text-primary/50 hover:text-accent font-bold transition-colors cursor-pointer'}
      >
        EN
      </button>
    </div>
  );
}
```

`currentLocale` must be passed from the layout or nav header as a prop (obtained via `await getLocale()` in the server layout, then passed down, or via a server component wrapper).

### Anti-Patterns to Avoid
- **Composing next-intl middleware with existing Supabase middleware:** In "without i18n routing" mode, next-intl middleware is NOT needed and must NOT be added. The existing `src/middleware.ts` stays unchanged.
- **Dynamic locale in `import()` without `Promise.all`:** Always load all namespace files in parallel using `Promise.all` for performance.
- **Missing top-level namespace keys in JSON:** Without top-level keys (e.g., `{ "auth": {...} }`) the spread merge causes key collisions across files. Every namespace file must wrap its content in a unique top-level key.
- **Putting `LanguageSwitcher` in `(trainer)/` or `(trainee)/` components:** It belongs in `src/components/` — shared location, no cross-route-group import violation.
- **Using `router.replace()` for locale switching:** This only works in the "with routing" mode. In no-URL-prefix mode, set cookie + reload is the correct approach.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locale detection + fallback | Custom cookie-parsing middleware | `getRequestConfig` + `cookies()` from `next/headers` | Handles cookie absence, invalid values, server/client sync automatically |
| Passing messages to client components | Manual context/prop drilling | `NextIntlClientProvider` (zero-config in v4) | Automatically serializes only needed messages per component; avoids prop explosion |
| Pluralization, ICU message format | Custom string interpolation | next-intl built-in `{count, plural, ...}` ICU support | Handles Polish plural forms correctly (1 / 2-4 / 5+ case variants) |
| TypeScript key safety | Runtime key checks | `global.d.ts` `Messages` type augmentation | Compile-time errors on missing/wrong keys |

**Key insight:** Polish has complex plural rules (e.g., "1 kursant" / "2 kursantów" / "5 kursantów"). Don't hand-roll pluralization — use ICU format in JSON values where count-dependent strings exist.

---

## Common Pitfalls

### Pitfall 1: NextIntlClientProvider without messages on server
**What goes wrong:** `useTranslations` in a client component throws "Missing messages" error.
**Why it happens:** `NextIntlClientProvider` without configuration in v4 works automatically only when `createNextIntlPlugin()` is correctly wired in `next.config.ts` — if the plugin is missing, messages never reach the client.
**How to avoid:** Ensure `next.config.ts` exports `withNextIntl(nextConfig)`, not bare `nextConfig`.
**Warning signs:** Runtime error "Unable to find `NextIntlClientProvider`" or missing translation strings.

### Pitfall 2: Cookie name mismatch between reader and writer
**What goes wrong:** Language switcher sets a cookie but locale never changes — app keeps showing Polish (default).
**Why it happens:** `getRequestConfig` reads cookie named `NEXT_LOCALE` but `LanguageSwitcher` writes a differently-named cookie.
**How to avoid:** Standardize on `NEXT_LOCALE` throughout. Use a shared constant `LOCALE_COOKIE = 'NEXT_LOCALE'` in a `src/i18n/constants.ts` file imported by both `request.ts` and `LanguageSwitcher.tsx`.
**Warning signs:** Switching to EN shows Polish. Clear cookies, check Network tab for set-cookie header.

### Pitfall 3: JSON namespace collision on merge
**What goes wrong:** Keys from one namespace file silently overwrite keys from another after the spread merge.
**Why it happens:** If `common.json` exports `{ "button": {...} }` and `auth.json` also exports `{ "button": {...} }`, the spread `{ ...common, ...auth }` loses `common.button` keys.
**How to avoid:** Every JSON file must have a single unique top-level key matching its namespace: `common.json` → `{ "common": {...} }`, `auth.json` → `{ "auth": {...} }`, etc.
**Warning signs:** Some translations work, others fall back to key names.

### Pitfall 4: `getLocale()` called in client component
**What goes wrong:** Build error — `getLocale()` is a server-only function.
**Why it happens:** Trying to read locale for the `LanguageSwitcher` using `getLocale()` inside a `'use client'` component.
**How to avoid:** Read locale in the server layout/page and pass it as a `currentLocale` prop to `LanguageSwitcher`. Alternatively, `LanguageSwitcher` can infer current locale by reading `document.cookie` client-side on mount.
**Warning signs:** Next.js build error: "This API cannot be used in a client component."

### Pitfall 5: Missing Polish subset in Lato font
**What goes wrong:** Polish diacritics (ą, ę, ó, ś, ź, ż, ć, ń, ł) render with fallback font instead of Lato.
**Why it happens:** Current font config uses `subsets: ['latin']` — the `latin` subset covers standard ASCII. Polish diacritics are in the `latin-ext` subset.
**How to avoid:** Add `'latin-ext'` to the Lato font subsets: `subsets: ['latin', 'latin-ext']`.
**Warning signs:** Polish text shows noticeably different letterforms for characters with diacritics.

### Pitfall 6: `lang` attribute stays `"en"` after Phase 9
**What goes wrong:** Root `<html lang="en">` never updates to `"pl"` — screen readers and SEO still see English.
**Why it happens:** Root layout is currently static — hardcoded `lang="en"`. In "without i18n routing" mode, `src/app/layout.tsx` must become an async server component to call `await getLocale()`.
**How to avoid:** Convert `RootLayout` to `async` and call `const locale = await getLocale()`, then `<html lang={locale}>`.
**Warning signs:** Browser dev tools show `<html lang="en">` regardless of active locale.

---

## Code Examples

Verified patterns from official documentation:

### Message file structure (namespaced, collision-safe)
```json
// messages/pl/common.json
{
  "common": {
    "nav": {
      "trainees": "Kursanci",
      "plans": "Plany",
      "exerciseLibrary": "Biblioteka cwiczen",
      "help": "Pomoc",
      "language": "Jezyk"
    },
    "button": {
      "save": "Zapisz",
      "cancel": "Anuluj",
      "delete": "Usun",
      "add": "Dodaj",
      "edit": "Edytuj"
    },
    "empty": {
      "heading": "Brak danych",
      "body": "Sprawdz ponownie po ukonczeniu treningu."
    },
    "error": {
      "generic": "Cos poszlo nie tak. Odswiez strone."
    }
  }
}
```

```json
// messages/en/common.json
{
  "common": {
    "nav": {
      "trainees": "Trainees",
      "plans": "Plans",
      "exerciseLibrary": "Exercise Library",
      "help": "Help",
      "language": "Language"
    },
    "button": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "add": "Add",
      "edit": "Edit"
    },
    "empty": {
      "heading": "Nothing here yet",
      "body": "Check back after completing a session."
    },
    "error": {
      "generic": "Something went wrong. Please refresh the page."
    }
  }
}
```

### TypeScript type augmentation
```typescript
// global.d.ts (project root)
// Source: https://next-intl.dev/docs/workflows/typescript
import enCommon from './messages/en/common.json';
import enAuth from './messages/en/auth.json';
import enTrainer from './messages/en/trainer.json';
import enTrainee from './messages/en/trainee.json';

type Messages = typeof enCommon & typeof enAuth & typeof enTrainer & typeof enTrainee;

declare interface IntlMessages extends Messages {}
```

### NavHeader usage (client component)
```typescript
// src/app/(trainer)/_components/NavHeader.tsx (excerpt)
'use client';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const navLinks = [
  { href: '/trainer',          labelKey: 'common.nav.trainees',       ... },
  { href: '/trainer/plans',    labelKey: 'common.nav.plans',          ... },
  { href: '/trainer/exercises',labelKey: 'common.nav.exerciseLibrary', ... },
  { href: '/help',             labelKey: 'common.nav.help',           ... },
];

export function NavHeader({ avatarUrl, userName, locale }: { ... locale: 'pl' | 'en' }) {
  const t = useTranslations();
  // ...
  {navLinks.map(({ href, labelKey, isActive }) => (
    <Link key={href} href={href} ...>{t(labelKey)}</Link>
  ))}
  // In the header right section:
  <LanguageSwitcher currentLocale={locale} />
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next-i18next` (Pages Router) | `next-intl` (App Router native) | Next.js 13 App Router GA | next-i18next doesn't work with App Router RSC — next-intl is the current standard |
| `[locale]` URL segment required | "without i18n routing" mode added | next-intl v3 | Cookie-only locale without URL restructure is now first-class supported |
| `NextIntlClientProvider` needed manual message passing | v4: zero-config when plugin is installed | next-intl v4 | Simpler root layout setup |

**Deprecated/outdated:**
- `next-i18next`: Pages Router library — not applicable to App Router, do not use.
- next-intl v3 `i18n.ts` at project root: v4 moved to `src/i18n/request.ts` as default — the plugin auto-discovers this path.

---

## Open Questions

1. **Cookie name: `NEXT_LOCALE` vs `locale`**
   - What we know: Official docs example uses `locale` as the cookie name in the "without routing" setup. The CONTEXT.md references `NEXT_LOCALE` (the next-intl routing middleware default name).
   - What's unclear: Whether `NEXT_LOCALE` is hardcoded anywhere in next-intl internals for the no-routing setup.
   - Recommendation: Use `NEXT_LOCALE` — it matches the CONTEXT.md decision and is the well-known convention. Since `getRequestConfig` reads the cookie explicitly by name, the name is fully in our control. Define as a constant shared between `request.ts` and `LanguageSwitcher.tsx`.

2. **How does `LanguageSwitcher` receive `currentLocale` in nav headers?**
   - What we know: Nav headers (`NavHeader.tsx`, `TraineeNavHeader.tsx`) are client components. Layouts (`(trainer)/layout.tsx`, `(trainee)/layout.tsx`) are server components.
   - What's unclear: Whether to pass locale via a new prop through the layout → nav header chain, or to have `LanguageSwitcher` read `document.cookie` on the client.
   - Recommendation: Pass `locale` as a new prop from layout to nav header. Layouts already call async server functions for Gravatar — add `const locale = await getLocale()` in each layout and pass as prop. This keeps `LanguageSwitcher` a pure presentational component.

3. **String extraction scope for 101 TSX files**
   - What we know: ~101 TSX files contain user-visible strings. The four namespace files (common/auth/trainer/trainee) should cover all strings logically.
   - What's unclear: Exact count of unique string keys needed across all files — only discovered during extraction.
   - Recommendation: Extract strings file-by-file during implementation plans, namespace assignment by route group. Plan for 150-250 unique keys total across all four namespaces.

---

## Validation Architecture

`nyquist_validation` key is absent from `.planning/config.json` — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test framework installed in this project |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

This phase has no automated tests. All validation is manual UI verification:

| Behavior | Test Type | Verification |
|----------|-----------|--------------|
| Polish renders by default on first visit (no cookie) | Manual | Clear cookies, open app → all text is Polish |
| English renders when `NEXT_LOCALE=en` cookie is set | Manual | Set cookie, reload → all text is English |
| Language switcher toggles locale and persists via cookie | Manual | Click EN → page reloads in English; click PL → back to Polish |
| `lang` HTML attribute updates with locale | Manual | DevTools Elements → `<html lang="pl">` / `<html lang="en">` |
| Polish diacritics render in Lato font (no fallback) | Manual | Visual inspection of ą, ę, ó etc. in Polish UI |
| No broken/missing translations (keys not strings) | Manual | Full UI walkthrough — no `common.button.save` raw keys visible |
| All nav labels translated in both trainer + trainee headers | Manual | Check both roles' headers in PL and EN |
| Mobile sidebar switcher has ≥44px touch targets | Manual | DevTools box model check on buttons |

### Wave 0 Gaps
- No test infrastructure to scaffold — this project has no automated test suite.

---

## Sources

### Primary (HIGH confidence)
- https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing — complete setup for cookie-based no-URL-prefix mode
- https://next-intl.dev/docs/usage/messages — namespace and message organization
- https://next-intl.dev/docs/workflows/typescript — TypeScript type augmentation
- npm registry: `npm view next-intl version` → 4.8.3 (verified 2026-03-29)

### Secondary (MEDIUM confidence)
- https://github.com/amannn/next-intl/discussions/357 — official maintainer discussion confirming spread-merge pattern for multiple locale files

### Tertiary (LOW confidence)
- https://dev.to/hpouyanmehr/split-your-translations-in-next-intl-in-a-nice-way-4jof — community article on file splitting (corroborates spread-merge approach)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — next-intl 4.8.3 verified via npm registry; library selection locked by D-01
- Architecture: HIGH — "without i18n routing" setup documented in official next-intl docs with code examples; multi-file merge pattern confirmed in official GitHub discussion
- Pitfalls: HIGH — font subset gap (latin-ext) and cookie name consistency are verified real issues; `getLocale()` server-only restriction is documented Next.js API constraint
- Middleware composition: HIGH — "without i18n routing" mode explicitly does NOT use next-intl middleware; existing Supabase middleware stays unchanged

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (next-intl releases frequently; verify version before install)
