---
phase: 8
slug: training-logs-and-body-weight-progression-tracking
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-28
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (Next.js / React) |
| **Config file** | vitest.config.ts (if exists) or package.json |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 8-01-T1 | 01 | 1 | DB Migration + Schema + Actions | type-check | `npx tsc --noEmit` | ⬜ pending |
| 8-01-T2 | 01 | 1 | FinishWorkoutButton enrichment UI | type-check | `npx tsc --noEmit` | ⬜ pending |
| 8-02-T1 | 02 | 2 | Trainee home tabs + Log tab | type-check | `npx tsc --noEmit` | ⬜ pending |
| 8-02-T2 | 02 | 2 | Body Weight tab + components | type-check | `npx tsc --noEmit` | ⬜ pending |
| 8-03-T1 | 03 | 3 | Trainer access flow + Body Weight tab | type-check | `npx tsc --noEmit` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No Wave 0 tasks needed. All plan tasks use `npx tsc --noEmit` as their automated verification command, which requires no additional test infrastructure.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Trainee logs workout session notes/RPE | Phase 8 | UI interaction required | Navigate to session page, complete session, verify log fields visible and saved |
| Body weight chart renders correctly | Phase 8 | Visual verification | Log multiple entries, navigate to body weight page, verify line chart renders |
| Access request workflow | Phase 8 | Multi-user interaction | Trainer requests access, trainee approves/declines, verify visibility changes |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands (`npx tsc --noEmit`)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 not needed — all tasks have automated commands
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
