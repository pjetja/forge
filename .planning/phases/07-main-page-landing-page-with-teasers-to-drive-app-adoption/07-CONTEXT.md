# Phase 7: Landing Page & FAQ/Docs — Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers two public-facing pages:
1. **Landing page** (`/`) — marketing page for unauthenticated visitors; drives trainer and trainee signups
2. **FAQ/Docs page** (`/help`) — static help documentation page; accessible to both logged-in and logged-out users

The app interior (trainer/trainee dashboards) is untouched except for adding a Help link to both nav headers.

</domain>

<decisions>
## Implementation Decisions

### Audience & CTAs — dual audience
- The landing page speaks to **both trainers and trainees equally**
- Two primary CTAs side-by-side in the hero:
  - `Sign up as trainer` → `/signup/trainer`
  - `Join as trainee` → `/signup/trainee`
- Footer CTA: `Already have an account? Log in` → `/login`

### Logged-in user behavior — redirect away
- Middleware redirects logged-in users away from `/` before the page renders:
  - Trainers → `/trainer`
  - Trainees → `/trainee`
- `/help` is accessible to ALL users (logged-in and logged-out) — no redirect applied to that route

### Page structure — hero + features section + footer
Three sections only:

**Hero:**
- ForgeLogo (horizontal variant, reuse `src/components/ForgeLogo.tsx`)
- Headline: `Replace the spreadsheet.`
- Subheadline: `Trainers build plans. Trainees log workouts. In under a minute.`
- Two CTAs: `Sign up as trainer` (accent/primary button) + `Join as trainee` (ghost/outline button)

**Features section (3 benefit cards):**
- Card 1 — Plan Builder: icon + `Build structured plans` + 1-line description
- Card 2 — Workout Logging: icon + `Log workouts in seconds` + 1-line description
- Card 3 — Progress View: icon + `Track progress over time` + 1-line description
- Layout: 3-column grid on desktop, stacked on mobile (consistent with mobile-first PWA)
- No screenshots — icon + text only

**Footer:**
- `Already have an account? Log in` → `/login`
- `Help / FAQ` → `/help`

### Visual style — dark navy, existing design tokens
- Same design system as the app: `bg-bg-page` (`#0f172a`), `bg-bg-surface` (`#1e293b`), `accent` (`#10b981`), `text-text-primary` (`#e2e8f0`), `border-border` (`#334155`)
- No new CSS variables — reuse all existing Tailwind tokens from `globals.css`
- Lato font (already applied globally via `<html>` className)

### FAQ/Docs page — `/help`
- Separate static page at `/help`
- Content: "how to use the app" documentation for both trainers and trainees
- Accessible to all users (no auth gate) — middleware must NOT redirect `/help` for logged-in users
- Linked from:
  1. Landing page footer (`Help / FAQ` link)
  2. Trainer nav header (TraineeNavHeader and NavHeader) — `Help` link or `?` icon
- Content structure: Claude's Discretion (sections for Trainers and Trainees, FAQ accordion or plain sections)

### Route structure
```
/           → Landing page (unauthenticated only — logged-in users redirected to /trainer or /trainee)
/help       → FAQ/Docs page (public — accessible to all users)
```

### Nav header changes
- Both `NavHeader` (trainer) and `TraineeNavHeader` (trainee) get a `Help` link pointing to `/help`
- Placement: Claude's Discretion (e.g., alongside existing nav items or in a footer/bottom area of mobile sidebar)

### What's already built (do not rebuild)
- `ForgeLogo` component (`src/components/ForgeLogo.tsx`) — reuse as-is
- All design tokens in `globals.css` — no new CSS needed
- Middleware at `src/middleware.ts` — extend with redirect logic for `/`
- Both nav header components — extend with Help link only

### Claude's Discretion
- Exact icon choices for feature cards (inline SVG, emoji, or lucide-react if already a dependency)
- Whether FAQ page uses accordion expand/collapse or plain static sections
- Exact placement of the Help link in mobile nav sidebar
- Whether the hero CTA buttons are side-by-side or stacked on very small screens
- Exact subheadline copy (the above is a starting suggestion)
- Whether features section has a section heading above the cards (e.g., "Why Forge?")

</decisions>

<specifics>
## Specific Ideas

- Hero headline `Replace the spreadsheet.` is intentional — it names the pain point (trainers use Google Sheets today)
- Feature card descriptions should be 10–15 words max — scannable at a glance
- The `Join as trainee` CTA should be visually secondary to `Sign up as trainer` — ghost/outline style vs filled accent button — even though it's "dual audience"; trainers are the acquisition driver
- `/help` page should have both a trainer section ("How to create a plan", "How to assign a plan", "How to view trainee progress") and a trainee section ("How to join a trainer", "How to log a workout")
- Middleware extension: add `/` to the set of routes that redirect logged-in users; `/help` must be explicitly excluded from any such redirect logic

</specifics>

<deferred>
## Deferred Ideas

- **"How it works" step-by-step section** — could be added to the landing page in a future polish pass; not needed for v1 launch
- **Social proof / testimonials** — no real users yet; placeholder is premature
- **App screenshots / phone mockups** — requires real screenshots and maintenance overhead; deferred
- **Help search** — full-text search within the FAQ page; defer to when content grows
- **Animated demo / GIF** — showing the workout logging flow; scope creep for this phase

</deferred>

<canonical_refs>
## Canonical References

- `src/app/page.tsx` — root page to replace (currently boilerplate Next.js)
- `src/middleware.ts` — extend redirect logic for `/` (logged-in users)
- `src/components/ForgeLogo.tsx` — reuse in hero
- `src/app/globals.css` — design tokens (do not add new tokens)
- `src/app/(trainer)/_components/NavHeader.tsx` — add Help link
- `src/app/(trainee)/_components/TraineeNavHeader.tsx` — add Help link
- `src/app/(auth)/login/page.tsx` — reference for dark card + button patterns

No external specs or ADRs referenced for this phase.
</canonical_refs>

---

*Phase: 07-main-page-landing-page-with-teasers-to-drive-app-adoption*
*Context gathered: 2026-03-27*
