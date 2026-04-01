# Project Retrospective

_A living document updated after each milestone. Lessons feed forward into future planning._

## Milestone: v1.0 — Forge MVP

**Shipped:** 2026-04-01  
**Phases:** 19 | **Plans:** 59 | **Commits:** 265 | **Timeline:** 33 days

### What Was Built

- Full trainer–trainee auth and invite-link connection flow (Supabase + PKCE OAuth)
- Custom dark navy design system (Tailwind tokens, emerald accent, Lato) + Forge SVG logo + Figma component library
- Exercise library with muscle-group filtering and YouTube video embeds
- Multi-week plan builder with DnD schema editor, per-trainee weight review step, plan duplication, and RPE/RIR/linear progression parameters
- Trainee workout logging with last-week results inline per set (useOptimistic for instant feedback)
- Cross-plan exercise progress charts (trainer + trainee views)
- Profile pages with Gravatar avatars, editable fields, trainer notes, compliance stats
- Public landing page, /help FAQ, and /guide usage-flow walkthrough
- Workout enrichment (duration, kcal, RPE) + body weight tracking (chart + daily form) with trainer permission gate
- Polish-default i18n with LanguageSwitcher (~170 keys across 8 JSON files)
- Demo accounts with seeded Push/Pull/Legs data and one-click login from landing page
- Vercel + Supabase production deploy with GitHub CI and PWA manifest
- Phase 12: post-release fixes based on beta feedback (progression parameter display, DnD on assigned plan editor, loading skeletons, body-weight tab, Gravatar docs)

### What Worked

- **GSD workflow** — planning → research → plan → execute → verify loop caught design issues early and kept execution fast (avg 8 min/plan in Phase 12)
- **Supabase RLS as the multi-tenancy boundary** — zero application-level tenant filtering needed; all isolation enforced at DB layer
- **Server Actions for all mutations** — eliminated API route boilerplate, gave end-to-end type safety; consistent pattern across 50+ mutations
- **Inserted sub-phases** (01.1 design system, 04.1/02.1/03.1 UI polish) — allowed focused, uninterrupted UI passes without bloating primary phases
- **useOptimistic for set logging** — gave the trainee instant feedback without complex client state; the app feels fast at the gym
- **i18n last (Phase 9)** — extracting strings after the feature set stabilized was far less painful than doing it incrementally
- **Phase 12 post-release discipline** — treating beta feedback as a distinct phase (not scope creep) kept the original roadmap clean

### What Was Inefficient

- **SUMMARY.md one_liner fields** — many phase summaries left the `one_liner` field empty or as a placeholder; the milestone archive CLI picked these up as raw "one_liner" / "One-liner:" artefacts requiring manual cleanup
- **Progression parameters added late** — RPE/RIR/linear fields were added in Phase 12 after beta, but the assign-review flow and exercise-detail pages weren't updated in the same plan; resulted in BUG-01 and BUG-02 caught post-shipping
- **ROADMAP.md grew too large** — by Phase 9 the file was 300+ lines; should have migrated to collapsed `<details>` sections earlier to keep it scannable
- **PROJECT.md Active section** — stayed stale through phases 9–12; requirements moved to production without being transferred to Validated
- **Demo seed script** — written once with hardcoded IDs; not robust to re-runs against a populated DB

### Patterns Established

- **Sub-phase numbering** (01.1, 02.1 etc.) for UI polish and non-planned insertions — works well, keeps integer phases clean
- **`createAdminClient()` for exercise name lookups from trainee routes** — RLS blocks trainee from reading `exercises` table; admin client bypass with no data leakage because it's read-only for display
- **`getClaims()` for auth checks in Server Actions** — faster than `getUser()`, avoids extra Supabase round-trip; claim-based role check is safe for our threat model
- **Design tokens as Tailwind `@theme` inline utilities** — `bg-bg-page`, `text-text-primary`, `border-border` are used consistently across 130 files; easy to retheme
- **Progression modes stored on both `schema_exercises` and `assigned_schema_exercises`** — correct: template sets defaults, assignment can override per trainee

### Key Lessons

1. **Always update the assign-review flow when adding new per-exercise fields.** Any new column on `schema_exercises`/`assigned_schema_exercises` needs to flow through: schema editor → assign-review form → actions.ts ExerciseOverride type → DB RPC → exercise detail pages. Build this checklist into the plan template.
2. **Summary files need a discipline around the `one_liner` field.** If it's empty, the CLI produces garbage. Either enforce it at execution time or write the milestone MILESTONES.md entry manually.
3. **Move requirements to Validated when they ship, not at milestone close.** Batch-updating PROJECT.md at the end is painful and error-prone.
4. **Progression parameters belong in Phase 3 (plan builder), not Phase 12.** RPE/RIR targets are part of plan design, not post-release polish. Plan for complete field coverage earlier.
5. **Keep ROADMAP.md concise from the start.** Long phase-detail sections should live in CONTEXT.md, not ROADMAP.md. ROADMAP.md is a navigation index, not execution docs.

### Cost Observations

- Model: Claude Sonnet 4.5 / 4.6 throughout
- Notable: Most plans executed under 10 minutes with zero re-planning; the few exceptions were UI polish phases that required iterative visual feedback

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change                                     |
| --------- | ------ | ----- | ---------------------------------------------- |
| v1.0      | 19     | 59    | Initial full-stack MVP build with GSD workflow |

### Top Lessons (Verified Across Milestones)

1. _Populate after v1.1_
