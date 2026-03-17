---
phase: 05
slug: trainer-progress-visibility
status: approved
shadcn_initialized: false
preset: none
created: 2026-03-17
---

# Phase 05 — UI Design Contract

> Visual and interaction contract for frontend phases.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Manual Tailwind CSS (no shadcn) |
| Preset | none |
| Component library | Custom components — Tailwind CSS v4 |
| Icon library | Inline SVG (currentColor pattern, established project convention) |
| Font | Lato (next/font, weights 400 and 700, injected via `lato.variable` on `<html>`) |

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding (`gap-1`, `px-1.5`, `py-0.5`) |
| sm | 8px | Compact element spacing (`gap-2`, `px-2`, `py-2`, `mb-1`) |
| md | 16px | Default element spacing (`p-4`, `gap-4`, `mb-3`) |
| lg | 24px | Section padding (`space-y-6`) |
| xl | 32px | Layout gaps (`space-y-8`) |
| 2xl | 48px | Major section breaks (used for sparse empty state padding `p-12`) |
| 3xl | 64px | Page-level spacing (not used at component level) |

Exceptions: `py-3` (12px) appears on summary stat cards to give them breathing room without full `p-4`; `px-3` appears on chip elements as a standard narrow horizontal pad.

---

## Typography

4 sizes, 2 weights only — aligned with Lato font declaration (weights 400 and 700).

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Page heading (h1) | text-2xl (24px) | font-bold (700) | leading default (~1.35) |
| Section heading (h2) | text-lg (18px) | font-bold (700) | leading default |
| Body / labels / card primary | text-sm (14px) | font-bold (700) for emphasis, font-normal (400) for secondary | leading-relaxed (1.625) |
| Caption / metadata / chips | text-xs (12px) | font-normal (400) | leading default |

Notes:
- Section label / eyebrow: `text-xs uppercase tracking-wide font-bold` — uses caption size with bold weight + uppercase transform for visual distinction
- Chart section label: same as section label / eyebrow pattern
- Body emphasis (card title, exercise name): `text-sm font-bold`
- Body secondary (plan name, metadata): `text-sm font-normal opacity-60`
- No `text-base` (16px) — project body text consistently uses `text-sm`

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#0f172a` (`bg-bg-page`) | Page background, input backgrounds |
| Secondary (30%) | `#1e293b` (`bg-bg-surface`) | Cards, chart containers, filter bars, row items |
| Border | `#334155` (`border-border`) | Card borders, input borders, chip borders |
| Accent (10%) | `#10b981` (`text-accent` / `bg-accent`) | Active chips, selected tab indicator, personal best value, positive delta, CTA buttons |
| Accent hover | `#34d399` (`bg-accent-hover`) | Button hover state |
| Accent muted | `bg-accent/10` to `bg-accent/20` | Banners, avatar backgrounds, row highlight |
| Text primary | `#e2e8f0` (`text-text-primary`) | All readable text on dark surfaces |
| Text muted | `text-text-primary opacity-50` to `opacity-60` | Secondary labels, metadata, empty state copy |
| Error / destructive | `#ef4444` (`text-error`) | Error states only — no destructive actions in Phase 5 |

Accent reserved for: active tab indicator, selected filter chips, personal best weight display, positive progression delta on chart summary cards, primary action buttons.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Tab: Plans | "Plans" |
| Tab: Exercises | "Exercises" |
| Exercise list empty state heading | "No exercises logged yet" |
| Exercise list empty state body | "Completed workouts will appear here once sets are logged." |
| Date range toggle: All time | "All time" |
| Date range toggle: 3 months | "Last 3 months" |
| Date range toggle: 1 month | "Last month" |
| Exercise row: personal best label | "Best" |
| Exercise row: personal best value (no data) | "—" |
| Exercise row: last logged label | "Last logged" |
| Chart section heading: weight | "Top-set weight over time" |
| Chart empty state (no data for selected range) | "No data for this period." |
| Chart empty state (no sessions at all) | "No logged sets for this exercise yet." |
| Summary card: start label | "Start" |
| Summary card: finish label | "Finish" |
| Summary card: change label | "Change" |
| Error state (data load failure) | "Could not load exercise data. Please refresh." |
| Search input placeholder | "Search exercises..." |
| Back link: from exercise progress to exercise tab | "← Back" |
| Primary CTA | N/A (read-only phase — no primary action) |

---

## Component Inventory

New components needed for this phase:

| Component | Type | Reuses |
|-----------|------|--------|
| `TabSwitcher` | New client component | URL param pattern from `ExerciseFilterBar` (`useSearchParams`, `router.replace`) |
| `ExercisesTabContent` (trainer-side) | New server component | `ExerciseFilterBar` pattern; muscle group chip styling |
| `ExercisesTabContent` (trainee-side) | New server component | Same as above — identical design |
| `ExerciseProgressRow` | New client or server component | Card pattern from existing plan/exercise rows |
| Trainer cross-plan progress page | New server page | `ProgressChart` (existing); summary cards pattern from existing exercise progress page |
| Trainee cross-plan progress page | New server page | Identical to trainer view; same `ProgressChart` import |
| `DateRangeToggle` | New client component | Pill/chip toggle style; 3-button inline group; client-side state only (no URL param) |

Existing components reused unchanged:

- `ProgressChart` — `src/app/(trainee)/trainee/plans/[assignedPlanId]/exercises/[exerciseId]/_components/ProgressChart.tsx`
- `ExerciseFilterBar` — `src/app/(trainer)/trainer/_components/ExerciseFilterBar.tsx` (for trainer-side exercise list; a trimmed version without video filter used for trainee-side)
- Summary stat cards (3-column grid: Start / Finish / Change) — inline pattern from existing `ExerciseProgressPage`, reproduced in new cross-plan pages

---

## Interaction States

| Element | States |
|---------|--------|
| Tab switcher (Plans / Exercises) | Active: accent color text + underline or accent background pill; Inactive: `text-text-primary opacity-60`, no underline |
| Exercise row | Default: `bg-bg-surface border-border`; Hover: `border-accent/50` + transition-colors (matches existing plan card pattern); Tap: navigates to cross-plan progress page |
| Date range toggle button | Selected: `bg-accent text-white`; Unselected: `bg-bg-surface border-border text-text-primary`; Hover (unselected): `border-accent` |
| Search input | Empty: placeholder visible; Typing: live filter (on form submit); No results: exercise list shrinks to zero rows + inline "No exercises match your search." text |
| Muscle group filter chip | Selected: `bg-accent text-white border-accent`; Unselected: `bg-bg-surface text-text-primary border-border hover:border-accent` |
| Progress chart | Loading: chart container with `bg-bg-surface border-border` skeleton; Data present: `ProgressChart` renders bars; No data for selected date range: centered muted text inside chart container |
| Personal best value | Has data: accent-colored weight text (e.g., `85 kg`); No data: muted `—` |

Tab switcher visual style decision (CONTEXT.md discretion): use underline-style tabs — a 2px `border-b-2 border-accent` on the active tab label, muted text on inactive tab. This matches the content-dense trainer pages better than pill tabs, which add visual noise when adjacent to filter chips.

Loading/skeleton states: use empty `bg-bg-surface` containers with `animate-pulse` Tailwind class for the exercise list and chart containers. Show at least the tab switcher and page heading immediately (they are server-rendered static); only the exercise list and chart have async content.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required — `components.json` does not exist in this project |
| Third-party | none | not applicable |

No new npm packages needed. All dependencies (`recharts`, Tailwind CSS v4, Next.js 16, Supabase JS) are already installed.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS (4 sizes, 2 weights)
- [x] Dimension 5 Spacing: PASS (12px exceptions documented, multiples of 4)
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-03-17
