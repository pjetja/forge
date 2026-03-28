---
phase: 7
slug: main-page-landing-page-with-teasers-to-drive-app-adoption
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest / playwright (e2e) |
| **Config file** | vitest.config.ts (if exists) / playwright.config.ts |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | Landing page | build | `npm run build` | ✅ | ⬜ pending |
| 7-01-02 | 01 | 1 | Help/FAQ page | build | `npm run build` | ✅ | ⬜ pending |
| 7-01-03 | 01 | 2 | Nav links | build | `npm run build` | ✅ | ⬜ pending |
| 7-01-04 | 01 | 2 | Middleware | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Landing page renders correctly at / | Phase 7 | Visual UI verification | Open browser, visit /, verify hero + teasers |
| Help page renders at /help unauthenticated | Phase 7 | Auth flow requires browser | Visit /help while logged out, verify accessible |
| Trainer/trainee nav shows Help link | Phase 7 | UI visual verification | Log in as trainer/trainee, verify nav link |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
