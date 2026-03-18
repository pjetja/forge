---
phase: 6
slug: trainee-and-trainer-profile-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — project uses manual/browser verification |
| **Config file** | none |
| **Quick run command** | N/A — human verify via browser |
| **Full suite command** | N/A |
| **Estimated runtime** | ~5-10 minutes manual review per wave |

---

## Sampling Rate

- **After every task commit:** Visually verify in browser
- **After every plan wave:** Run full manual checklist below
- **Before `/gsd:verify-work`:** All manual verifications must pass
- **Max feedback latency:** ~5 minutes per wave

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | Migration | manual | N/A | ✅ | ⬜ pending |
| 6-01-02 | 01 | 1 | Gravatar utility | manual | N/A | ✅ | ⬜ pending |
| 6-01-03 | 01 | 1 | GravatarAvatar component | manual | N/A | ✅ | ⬜ pending |
| 6-01-04 | 01 | 1 | NavHeader avatar | manual | N/A | ✅ | ⬜ pending |
| 6-02-01 | 02 | 2 | Trainer profile page | manual | N/A | ✅ | ⬜ pending |
| 6-02-02 | 02 | 2 | Trainer profile action | manual | N/A | ✅ | ⬜ pending |
| 6-03-01 | 03 | 2 | Trainee profile page | manual | N/A | ✅ | ⬜ pending |
| 6-03-02 | 03 | 2 | Trainee profile action | manual | N/A | ✅ | ⬜ pending |
| 6-03-03 | 03 | 2 | Trainer notes + trainee stats on detail page | manual | N/A | ✅ | ⬜ pending |
| 6-04-01 | 04 | 3 | Compliance stats on trainer home | manual | N/A | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test framework detected. Existing infrastructure (manual browser verification) covers all phase requirements.

*All verification is human-driven per project convention.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gravatar avatar renders in NavHeader | Avatar in nav | No test framework | Load app as trainer/trainee, check avatar appears top-right |
| Avatar click navigates to profile page | Nav → profile | No test framework | Click avatar, verify URL changes to /trainer/profile or /trainee/profile |
| Trainer can save name + bio | Trainer profile edit | No test framework | Fill form, submit, reload page, verify values persist |
| Trainee can save name, goals, height, weight, DOB | Trainee profile edit | No test framework | Fill all fields, submit, reload, verify values persist |
| Trainer notes saved + visible on reload | Trainer notes | No test framework | Type notes on trainee detail, save, reload, verify text persists |
| Trainee goals visible read-only to trainer | Cross-role visibility | No test framework | Login as trainer, open trainee detail, check goals section |
| Physical stats shown as chip row on trainee detail | Trainer sees stats | No test framework | Login as trainer, open trainee detail, check "175 cm · 82 kg · Age 29" row |
| Trainer card visible on trainee profile | Trainee sees trainer | No test framework | Login as trainee, open /trainee/profile, check trainer card |
| Compliance stats on trainer home: last session + count | Compliance stats | No test framework | Open /trainer, check each trainee card shows "Last workout: ..." and "N this week" |
| Missing fields show "—" / "No goals set" | Optional fields | No test framework | Leave trainee fields empty, verify trainer sees "—" / "No goals set" |
| Gravatar `d=mp` fallback renders for users without Gravatar | Avatar fallback | No test framework | Use email not registered on Gravatar, verify silhouette shows |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10 minutes per wave
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
