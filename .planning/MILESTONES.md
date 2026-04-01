# Milestones

## v1.0 Forge MVP (Shipped: 2026-04-01)

**Phases completed:** 19 phases | 59 plans | 265 commits  
**Codebase:** 130 TypeScript/TSX files · 15,566 lines  
**Timeline:** 33 days (2026-02-27 → 2026-04-01)  
**Live URL:** https://forge-three-tau.vercel.app

**What was delivered:**

- Full trainer–trainee authentication (email/password + Google OAuth, PKCE, role-based routing, invite link connection flow)
- Custom dark navy design system (Tailwind tokens, Lato font, emerald accents) + custom Forge SVG logo + Figma component library
- Exercise library: trainer-scoped CRUD with search, muscle-group filtering, and YouTube video embeds
- Multi-week plan builder: nested week → schema → exercise structure with DnD reordering, plan assignment with per-trainee weight review, plan duplication
- Trainee workout logging: session start/log/finish flow with last-week results inline per set, useOptimistic instant feedback
- Progress visibility: cross-plan exercise progress charts for both trainer and trainee views
- Profile pages: Gravatar avatars, editable name/bio/goals/stats, trainer notes per trainee, compliance stats on roster
- Landing page and /help FAQ with /guide usage flow walkthrough
- Training log enrichment (duration, kcal burned, RPE) + body weight tracking (chart + daily form) + trainer permission gate
- Full internationalisation: Polish default + English, LanguageSwitcher, ~170 i18n keys across 8 JSON files
- Demo accounts: pre-seeded Push/Pull/Legs data, one-click login from landing page, password-change guard
- Production deploy on Vercel + Supabase, GitHub CI, PWA manifest
- Post-release fixes: RPE/RIR/linear progression parameters on assign-review and exercise-detail pages, DnD on assigned schema editor, body-weight tab always visible, loading skeletons, i18n audit, Gravatar docs, /guide page

**Stats:**
- v1 requirements: 25/25 complete
- Phases: 1 → 12 (including 7 inserted sub-phases)

---
