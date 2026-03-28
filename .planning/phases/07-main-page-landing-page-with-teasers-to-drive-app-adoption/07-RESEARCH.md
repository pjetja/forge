# Phase 7: Landing Page & FAQ/Docs — Research

**Researched:** 2026-03-28
**Domain:** Next.js App Router static/public pages, middleware routing, Tailwind CSS, inline SVG
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Audience & CTAs — dual audience**
- The landing page speaks to both trainers and trainees equally
- Two primary CTAs side-by-side in the hero:
  - `Sign up as trainer` → `/signup/trainer`
  - `Join as trainee` → `/signup/trainee`
- Footer CTA: `Already have an account? Log in` → `/login`

**Logged-in user behavior — redirect away**
- Middleware redirects logged-in users away from `/` before the page renders:
  - Trainers → `/trainer`
  - Trainees → `/trainee`
- `/help` is accessible to ALL users (logged-in and logged-out) — no redirect applied to that route

**Page structure — hero + features section + footer**
Three sections only. Hero: ForgeLogo + headline "Replace the spreadsheet." + subheadline + two CTAs. Features: 3 benefit cards (Plan Builder, Workout Logging, Progress View), 3-column grid on desktop, stacked on mobile. Footer: login link + help link.

**Visual style — dark navy, existing design tokens**
- Same design system as the app: `bg-bg-page`, `bg-bg-surface`, `accent`, `text-text-primary`, `border-border`
- No new CSS variables — reuse all existing Tailwind tokens from `globals.css`
- Lato font (already applied globally via `<html>` className)

**FAQ/Docs page — `/help`**
- Separate static page at `/help`
- Content: trainer section ("How to create a plan", "How to assign a plan", "How to view trainee progress") and trainee section ("How to join a trainer", "How to log a workout")
- Accessible to all users (no auth gate)
- Linked from landing page footer and both nav headers

**Route structure**
- `/` → Landing page (unauthenticated only — logged-in users redirected)
- `/help` → FAQ/Docs page (public — accessible to all users)

**Nav header changes**
- Both `NavHeader` (trainer) and `TraineeNavHeader` (trainee) get a `Help` link pointing to `/help`

**What's already built (do not rebuild)**
- `ForgeLogo` component — reuse as-is
- All design tokens in `globals.css` — no new CSS needed
- Middleware at `src/middleware.ts` — extend with redirect logic for `/`
- Both nav header components — extend with Help link only

### Claude's Discretion
- Exact icon choices for feature cards (inline SVG only — no external icon library installed)
- Whether FAQ page uses accordion expand/collapse or plain static sections
- Exact placement of the Help link in mobile nav sidebar
- Whether the hero CTA buttons are side-by-side or stacked on very small screens
- Exact subheadline copy
- Whether features section has a section heading above the cards (e.g., "Why Forge?")

### Deferred Ideas (OUT OF SCOPE)
- "How it works" step-by-step section
- Social proof / testimonials
- App screenshots / phone mockups
- Help search
- Animated demo / GIF
</user_constraints>

---

## Summary

Phase 7 delivers two public-facing pages and three nav/middleware modifications. The work is entirely front-end: no new database migrations, no new Server Actions, no new API routes. The largest implementation surface is `src/app/page.tsx` (complete replacement of Next.js boilerplate) and `src/app/help/page.tsx` (new static route). Both are server components with zero client-side state.

The middleware already partially handles the `/` redirect (line 57 of `middleware.ts` already redirects authenticated users at `/` to their home), so that locked decision is already implemented and only needs verification — not new work. The three nav header changes are small additive modifications to existing `navLinks` arrays and their rendered JSX. The `/help` route needs to be explicitly excluded from the `publicPaths` check in middleware (currently it would fall through correctly because the `!isPublic` branch only redirects unauthenticated users to `/login`, and authenticated users at `/help` would pass through unchanged — but this needs verification against the exact logic).

The design system is entirely stable: all tokens exist in `globals.css`, no new dependencies are needed, inline SVG is the confirmed icon strategy (no lucide-react in package.json per UI-SPEC codebase scan). The UI-SPEC is approved and fully prescribes all visual decisions, leaving only FAQ content prose as Claude's discretion.

**Primary recommendation:** Implement as three sequential plans — (1) landing page `page.tsx`, (2) FAQ/Docs `help/page.tsx`, (3) nav header Help links + middleware verification.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 (installed) | Page routing, server components | Already the project framework |
| Tailwind CSS v4 | installed | Utility classes, design tokens | Project CSS layer — all tokens in `globals.css` |
| React | installed | JSX component authoring | Project framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/link` | (Next.js built-in) | Client-side navigation for CTA buttons and footer links | All internal links |
| `@supabase/ssr` | installed | `getClaims()` in middleware for auth role detection | Middleware only — already used |
| `nextjs-toploader` | installed | Progress bar on navigation | Already in root layout — no change needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline SVG icons | lucide-react | lucide-react is NOT installed; inline SVG is the project standard (confirmed by UI-SPEC and codebase scan) — do not add lucide |
| Plain static FAQ sections | Accordion with useState | Accordion requires `use client` and JS state for no real benefit on a small static page — plain sections are simpler and faster |

**Installation:** No new packages required for this phase.

---

## Architecture Patterns

### Recommended Project Structure

New files to create:
```
src/app/
├── page.tsx              # REPLACE — landing page (was Next.js boilerplate)
└── help/
    └── page.tsx          # NEW — static FAQ/Docs page
```

Files to modify:
```
src/middleware.ts                                    # verify / no change needed (see pitfall below)
src/app/(trainer)/_components/NavHeader.tsx         # add Help link to navLinks array
src/app/(trainee)/_components/TraineeNavHeader.tsx  # add Help link to navLinks array
```

### Pattern 1: Server Component Static Page (landing page)

**What:** `page.tsx` is a server component (no `'use client'`). No data fetching, no interactivity. Pure JSX with Tailwind utilities.
**When to use:** Marketing pages, static content pages — anything with no client-side state.
**Example:**
```tsx
// src/app/page.tsx — server component, no 'use client'
import Link from 'next/link';
import { ForgeLogo } from '@/components/ForgeLogo';

export default function LandingPage() {
  return (
    <main className="bg-bg-page min-h-screen flex flex-col">
      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <ForgeLogo variant="horizontal" className="h-10" />
        <h1 className="text-4xl font-bold text-text-primary text-center mt-8">
          Replace the spreadsheet.
        </h1>
        {/* ... */}
      </section>
    </main>
  );
}
```

### Pattern 2: Static FAQ Page (no auth gate, no state)

**What:** `src/app/help/page.tsx` is a server component. Two sections with plain question/answer pairs separated by `<hr>` elements. No accordion state.
**When to use:** Static documentation pages accessible to all users.

### Pattern 3: Extending navLinks Array in Nav Headers

**What:** Both nav header components use a `navLinks` array that is map-rendered into both the desktop nav row and the mobile sidebar. Adding a Help link means appending one entry to the array. Because the Help page is not a "section", the `isActive` function should return `false` always (or simply check `pathname === '/help'` for a subtle active indicator — but the UI-SPEC says no active state is needed).
**When to use:** Any new top-level navigation destination.
**Example:**
```tsx
// Append to navLinks array in NavHeader.tsx and TraineeNavHeader.tsx
{
  href: '/help',
  label: 'Help',
  isActive: (_pathname: string) => false,  // no active highlight per UI-SPEC
},
```

Desktop rendering (Row 2 nav) and mobile sidebar nav will both pick up the new link automatically via the existing `navLinks.map()` render.

### Pattern 4: CTA Buttons — Link-wrapped buttons vs. `<a>` tags

**What:** The existing codebase uses `<a href="...">` on the login page for auth links. For the landing page CTA buttons, use `next/link` (`<Link href="...">`) for client-side navigation with prefetching. Style with Tailwind to look like buttons (`block`, `px-6 py-3`, `rounded-sm`, `font-bold`).
**When to use:** Any navigation that stays within the Next.js app.

### Anti-Patterns to Avoid
- **Adding `'use client'` to `page.tsx` or `help/page.tsx`:** These are purely static — no state, no event handlers, no browser APIs needed. Keep them as server components.
- **Adding new Tailwind tokens:** The UI-SPEC explicitly forbids new CSS variables. Use only existing tokens from `globals.css`.
- **Using `<a>` instead of `<Link>` for internal navigation:** `<Link>` provides prefetching and client-side routing; `<a>` causes full page reloads.
- **Adding lucide-react or any icon library:** Not installed; inline SVG is the project pattern.
- **Rendering nav headers on the landing page:** The landing page is a public marketing page with no app nav. It gets its own standalone layout (the root layout wraps all pages but provides no nav header — nav headers are only in the `(trainer)` and `(trainee)` route groups).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon graphics | Custom SVG drawn from scratch | Reuse existing inline SVG patterns from NavHeader.tsx (clipboard, chart, bolt icons already exist as reference) | Consistency with existing icon style (28×28, stroke-based, currentColor) |
| CTA button styles | New button component | Inline Tailwind classes matching the pattern from `login/page.tsx` | No shared button component exists — project pattern is inline classes |
| Font loading | Manual font setup | Already configured: Lato loaded in `layout.tsx`, `lato.variable` on `<html>`, `--font-sans` token in `globals.css` | Nothing to do — font is already globally applied |
| Auth redirect logic | Custom middleware logic | The middleware at `src/middleware.ts` already redirects `/` for authenticated users (line 57) | Verify, don't rebuild |

**Key insight:** This phase is almost entirely additive assembly work — no new infrastructure, patterns, or dependencies. The hard architectural decisions (auth, design system, routing) were made in earlier phases.

---

## Common Pitfalls

### Pitfall 1: Middleware Already Handles `/` Redirect — Verify Don't Rewrite

**What goes wrong:** Developer assumes the `/` redirect needs to be added, then adds a second redirect condition that conflicts with the existing one, or breaks the `signup` exclusion.
**Why it happens:** The CONTEXT.md says "middleware must redirect logged-in users from `/`" — but this is already implemented at line 57: `if ((path === '/login' || path === '/') && role)`.
**How to avoid:** Read `middleware.ts` carefully first. The existing condition already covers both `/login` and `/` redirect. The task is to verify this behavior is correct and that `/help` is not accidentally caught by any redirect branch.
**Warning signs:** If the implementation plan says "add redirect for `/`" without noting the existing code, the plan author missed this.

### Pitfall 2: `/help` Accidentally Redirected for Authenticated Users

**What goes wrong:** Authenticated users navigating to `/help` get redirected to `/trainer` or `/trainee` instead of seeing the help page.
**Why it happens:** A developer adds `/help` to `publicPaths` (correct) but forgets that authenticated users don't trigger the `!isPublic → /login` redirect — they instead fall through to role-based redirects. Looking at the current middleware: authenticated users at `/help` are NOT caught by any redirect branch because `/help` does not match `/login`, `/`, `/trainer/*`, or `/trainee/*`. So the current middleware already handles this correctly.
**How to avoid:** Trace the authenticated user path through middleware for `/help` explicitly in the plan verification step. The unauthenticated user path also works correctly — they're not caught by `!isPublic` because `/help` is not `/trainer/*` or `/trainee/*`, and the code only redirects them if they try to access non-public paths.
**Warning signs:** If `/help` needs to be added to `publicPaths` to work correctly for unauthenticated users — check whether the current middleware redirects unauthenticated visitors away from paths not in `publicPaths`. It does: `if (!claims || error) { if (!isPublic) { return NextResponse.redirect(new URL('/login', request.url)); } }`. So `/help` IS NOT in `publicPaths` and unauthenticated users visiting `/help` WILL be redirected to `/login`. This IS a real bug that must be fixed: add `/help` to the `publicPaths` array.

### Pitfall 3: CTA Buttons Not Meeting 44px Touch Target

**What goes wrong:** CTA buttons render at less than 44px height on mobile, failing the accessibility standard.
**Why it happens:** Forgetting to set `min-h-[44px]` or using `py-2` instead of `py-3`.
**How to avoid:** The UI-SPEC specifies `px-6 py-3 rounded-sm font-bold text-base` for both CTAs and minimum 44px height. With `text-base` (16px) + `py-3` (24px top+bottom = 48px total), this is met. Verify in browser.

### Pitfall 4: Logo Sizing in Hero

**What goes wrong:** Using `className="h-7"` (nav size) instead of `className="h-10"` (auth page size) in the hero.
**Why it happens:** Default ForgeLogo prop is `h-7`. The login page uses `h-10` for the larger marketing context — the landing page should too.
**How to avoid:** Explicitly pass `className="h-10"` per UI-SPEC and CONTEXT.md spec.

### Pitfall 5: Help Link Has Active State Highlight When Visiting `/help` from App Nav

**What goes wrong:** The Help link in `NavHeader` activates the `text-accent font-medium` class when the user is at `/help`, which looks wrong since Help is not a "section" of the app.
**Why it happens:** Default `isActive` pattern checks `pathname.startsWith(href)` — but for Help, we don't want an active state.
**How to avoid:** Set `isActive: (_pathname: string) => false` for the Help nav entry per UI-SPEC ("No active state highlight needed").

### Pitfall 6: `help/page.tsx` Route Collision

**What goes wrong:** Creating `src/app/help/page.tsx` when there is no `src/app/help/` directory yet — this is fine in Next.js App Router (directories are auto-created), but developer may confuse this with the need for a layout.tsx.
**Why it happens:** The `(trainer)` and `(trainee)` route groups have their own layouts. The help page is a public route directly under `src/app/`, sharing the root layout only — no additional layout needed.
**How to avoid:** Create `src/app/help/page.tsx` directly. No layout wrapper needed.

---

## Code Examples

Verified patterns from the existing codebase:

### Design Token Usage (from `globals.css`)
```tsx
// All available tokens — use these, no new ones
className="bg-bg-page"         // #0f172a — page background
className="bg-bg-surface"      // #1e293b — card backgrounds
className="border-border"      // #334155 — borders
className="text-text-primary"  // #e2e8f0 — all text
className="text-accent"        // #10b981 — accent (CTAs, icons)
className="hover:text-accent-hover"  // #34d399 — hover on accent elements
className="text-error"         // #ef4444 — not used in this phase
```

### ForgeLogo Usage (from `login/page.tsx`)
```tsx
// Hero size — use h-10 (auth page convention, larger than nav's h-7)
<ForgeLogo variant="horizontal" className="h-10" />
```

### Button Patterns (from `login/page.tsx` style reference)
```tsx
// Primary CTA — accent filled
<Link
  href="/signup/trainer"
  className="inline-flex items-center justify-center px-6 py-3 rounded-sm font-bold text-base bg-accent text-white hover:bg-accent-hover transition-colors min-h-[44px] cursor-pointer"
>
  Sign up as trainer
</Link>

// Secondary CTA — ghost/outline
<Link
  href="/signup/trainee"
  className="inline-flex items-center justify-center px-6 py-3 rounded-sm font-bold text-base border border-border text-text-primary hover:border-accent hover:text-accent transition-colors min-h-[44px] cursor-pointer bg-transparent"
>
  Join as trainee
</Link>
```

### Feature Card Pattern
```tsx
// bg-bg-surface card with border — matches existing card pattern from login/page.tsx
<div className="bg-bg-surface border border-border rounded-sm p-6">
  {/* Inline SVG icon — 28×28, text-accent stroke */}
  <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    {/* paths */}
  </svg>
  <h3 className="text-base font-bold text-text-primary mt-4">Build structured plans</h3>
  <p className="text-sm text-text-primary mt-2" style={{ opacity: 0.7 }}>
    Create multi-week programs with sets, reps, and weights.
  </p>
</div>
```

### Adding navLink to Both Nav Headers
```tsx
// Append to navLinks array — pattern is identical in NavHeader.tsx and TraineeNavHeader.tsx
const navLinks = [
  // ... existing links ...
  {
    href: '/help',
    label: 'Help',
    isActive: (_pathname: string) => false,
  },
];
```

### Middleware `/help` Fix (add to publicPaths)
```ts
// src/middleware.ts — current line 35, extend publicPaths
const publicPaths = [
  '/login', '/signup', '/auth', '/join', '/verify-email',
  '/invite-invalid', '/forgot-password', '/reset-password',
  '/help',  // ADD THIS — public FAQ page, accessible to unauthenticated users
];
```

### FAQ Item Pattern (plain static, no accordion)
```tsx
// No 'use client' needed — purely static JSX
<div className="mb-6">
  <h3 className="text-base font-bold text-text-primary mb-2">How to create a plan</h3>
  <p className="text-base text-text-primary mb-6" style={{ opacity: 0.8 }}>
    From the Plans tab, click "New Plan"...
  </p>
  <hr className="border-border" />
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/app/page.tsx` was Next.js boilerplate | Replaced with Forge landing page | This phase | Complete file replacement, not modification |
| No public help route | `/help` as new static route | This phase | New `src/app/help/` directory |
| Nav headers have no Help link | Both nav headers gain Help link | This phase | Small additive change to navLinks array |

**Deprecated/outdated:**
- `src/app/page.tsx` current content: The entire Next.js boilerplate (`next.svg`, `vercel.svg`, zinc color classes) is dead code that will be replaced.

---

## Open Questions

1. **`/help` middleware behavior for unauthenticated users**
   - What we know: `publicPaths` in middleware does not currently include `/help`
   - What's unclear: This is actually a confirmed bug, not an open question — unauthenticated users visiting `/help` will be redirected to `/login` without the fix
   - Recommendation: Plan must include adding `/help` to `publicPaths` as a task (likely in the same plan as the `help/page.tsx` creation)

2. **Opacity for muted text (subheadline, card descriptions)**
   - What we know: UI-SPEC specifies 80% opacity for hero subheadline and 70% opacity for card descriptions, but no `text-text-primary/80` Tailwind opacity modifier token is defined in `globals.css`
   - What's unclear: Whether Tailwind v4's opacity modifier (`text-text-primary/80`) works with custom CSS property colors in `@theme inline`
   - Recommendation: Use inline `style={{ opacity: 0.8 }}` or `style={{ opacity: 0.7 }}` as a safe fallback, consistent with how opacity is commonly handled with custom tokens. Alternatively test `text-text-primary/80` — Tailwind v4 supports color opacity modifiers for CSS variable colors.

3. **Hero CTA row stacking breakpoint**
   - What we know: UI-SPEC says "on very small screens (< 380px) stacked column with gap-3"
   - What's unclear: Tailwind v4 does not have a `< 380px` breakpoint by default; the smallest standard breakpoint is `sm` (640px)
   - Recommendation: Use a custom inline media query or the pattern `flex-col gap-3 min-[380px]:flex-row min-[380px]:gap-4` with Tailwind v4's arbitrary value breakpoints.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, no vitest.config, no pytest.ini found in project |
| Config file | None — Wave 0 gap |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

This phase has no formal requirement IDs mapped in REQUIREMENTS.md. The deliverables are UI-only, static pages with routing behavior. All meaningful verification is visual/manual:

| Deliverable | Behavior | Test Type | Notes |
|-------------|----------|-----------|-------|
| Landing page `/` | Renders correct sections and copy | manual-only | Visual inspection |
| Landing page `/` | Unauthenticated user sees page (no redirect) | manual-only | Browser check |
| Landing page `/` | Authenticated trainer → redirected to `/trainer` | manual-only | Browser check with session |
| Landing page `/` | Authenticated trainee → redirected to `/trainee` | manual-only | Browser check with session |
| FAQ page `/help` | Renders trainer + trainee sections | manual-only | Visual inspection |
| FAQ page `/help` | Unauthenticated user can access (no redirect to /login) | manual-only | Critical — requires `/help` in publicPaths |
| FAQ page `/help` | Authenticated user can access (no redirect to /trainer or /trainee) | manual-only | Browser check with session |
| NavHeader | Help link appears in desktop nav row | manual-only | Visual inspection |
| NavHeader | Help link appears in mobile sidebar | manual-only | Visual inspection |
| TraineeNavHeader | Help link appears in desktop nav row | manual-only | Visual inspection |
| TraineeNavHeader | Help link appears in mobile sidebar | manual-only | Visual inspection |

### Wave 0 Gaps
No automated test framework is installed. All verification for this phase is manual UI review.

*(Note: This is consistent with all prior phases in this project — no test infrastructure exists.)*

---

## Sources

### Primary (HIGH confidence)
- `src/middleware.ts` — direct code inspection, auth redirect logic
- `src/app/globals.css` — design tokens verified
- `src/components/ForgeLogo.tsx` — component API verified
- `src/app/(trainer)/_components/NavHeader.tsx` — navLinks pattern verified
- `src/app/(trainee)/_components/TraineeNavHeader.tsx` — navLinks pattern verified
- `src/app/(auth)/login/page.tsx` — button + card + logo patterns verified
- `.planning/phases/07-.../07-CONTEXT.md` — locked decisions
- `.planning/phases/07-.../07-UI-SPEC.md` — approved visual contract

### Secondary (MEDIUM confidence)
- Next.js App Router server component conventions — well-established, confirmed by project's existing page patterns
- Tailwind v4 arbitrary breakpoint syntax (`min-[380px]:`) — standard Tailwind v4 feature

### Tertiary (LOW confidence)
- Tailwind v4 opacity modifier compatibility with CSS variable colors (`text-text-primary/80`) — not verified against the specific `@theme inline` setup; inline `style={{ opacity }}` is the safe fallback

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from package.json and existing imports; no new dependencies needed
- Architecture: HIGH — direct code inspection of all files to be modified; patterns fully understood
- Pitfalls: HIGH — middleware bug (missing `/help` in publicPaths) discovered via direct code reading, not speculation
- Open questions: MEDIUM — opacity modifier and breakpoint issues are minor and have safe workarounds

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable stack, no fast-moving dependencies)
