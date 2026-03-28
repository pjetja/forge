---
phase: 8
slug: training-logs-and-body-weight-progression-tracking
status: draft
nyquist_compliant: false
wave_0_complete: false
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

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 1 | DB Migration | integration | `npm run db:migrate` | ✅ | ⬜ pending |
| 8-01-02 | 01 | 1 | Body weight logs table | integration | `npm run db:migrate` | ✅ | ⬜ pending |
| 8-01-03 | 01 | 1 | Access requests table | integration | `npm run db:migrate` | ✅ | ⬜ pending |
| 8-02-01 | 02 | 2 | Log workout session UI | manual | — | ❌ W0 | ⬜ pending |
| 8-02-02 | 02 | 2 | Body weight entry UI | manual | — | ❌ W0 | ⬜ pending |
| 8-03-01 | 03 | 3 | Trainer body weight access | manual | — | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.

*If no test framework is set up, Wave 0 will install vitest.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Trainee logs workout session notes/RPE | Phase 8 | UI interaction required | Navigate to session page, complete session, verify log fields visible and saved |
| Body weight chart renders correctly | Phase 8 | Visual verification | Log multiple entries, navigate to body weight page, verify line chart renders |
| Access request workflow | Phase 8 | Multi-user interaction | Trainee requests access, trainer approves/declines, verify visibility changes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
