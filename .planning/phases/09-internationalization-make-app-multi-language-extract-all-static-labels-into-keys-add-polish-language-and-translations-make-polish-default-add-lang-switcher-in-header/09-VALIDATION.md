---
phase: 9
slug: internationalization-make-app-multi-language-extract-all-static-labels-into-keys-add-polish-language-and-translations-make-polish-default-add-lang-switcher-in-header
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no automated tests in project |
| **Config file** | none |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx next build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx next build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 1 | i18n-setup | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 9-01-02 | 01 | 1 | i18n-setup | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 9-02-01 | 02 | 1 | extraction | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 9-03-01 | 03 | 2 | translations | manual | UI smoke test | N/A | ⬜ pending |
| 9-04-01 | 04 | 2 | lang-switcher | manual | UI smoke test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (TypeScript + Next.js build check is sufficient)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Polish text renders with correct diacritics (ą, ę, ó, ś, ź, ż, ć, ń, ł) | font-subset | Visual check only | Open app in browser, switch to Polish, verify diacritics display with Lato font (not fallback) |
| Language switcher toggles between EN and PL | lang-switcher | UI interaction | Click switcher in header, verify page reloads in selected language |
| Polish is default for new visitors | default-locale | Cookie check | Open in incognito, verify Polish text without switching |
| All UI strings translated (no English leaking in PL mode) | extraction | Visual audit | Switch to PL, navigate all pages, verify no English static text remains |

*All phase behaviors require manual UI verification (no automated test suite).*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
