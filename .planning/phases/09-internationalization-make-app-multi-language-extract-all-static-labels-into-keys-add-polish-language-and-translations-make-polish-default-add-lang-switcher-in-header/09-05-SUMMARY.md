---
phase: 09-internationalization-make-app-multi-language-extract-all-static-labels-into-keys-add-polish-language-and-translations-make-polish-default-add-lang-switcher-in-header
plan: 05
subsystem: ui
tags: [next-intl, i18n, polish, english, verification, uat, language-switcher]

# Dependency graph
requires:
  - phase: 09-01
    provides: next-intl infrastructure, LanguageSwitcher, cookie-based locale
  - phase: 09-02
    provides: auth + public pages + shared components i18n
  - phase: 09-03
    provides: trainer core pages + components i18n
  - phase: 09-04
    provides: trainer trainee-detail pages + entire trainee route group i18n

provides:
  - End-to-end verification of complete i18n implementation
  - Bug fixes for muscle group chips, Polish diacritics, duplicate count strings, mobile min-width
  - Human UAT sign-off confirming both locales work across all pages

affects: [10-demo-users, 11-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - JSON key parity verified via flat key extraction and comparison across pl/en namespaces
    - Translation interpolation: {count} in message string, no concatenation in JSX

key-files:
  created: []
  modified:
    - messages/pl/trainer.json
    - messages/en/trainer.json
    - messages/pl/common.json
    - messages/en/common.json
    - src/app/(trainer)/layout.tsx
    - src/app/(trainee)/layout.tsx
    - src/app/(trainer)/_components/NavHeader.tsx
    - src/app/(trainee)/_components/TraineeNavHeader.tsx
    - src/app/(trainer)/trainer/trainees/[traineeId]/_components/ExercisesTab.tsx
    - src/app/(trainee)/trainee/_components/TraineeExercisesTab.tsx
    - src/app/(trainee)/trainee/page.tsx

key-decisions:
  - "min-w-[768px] removed from trainer/trainee layouts — hardcoded minimum width broke the mobile viewport and made the PL|EN switcher inaccessible on small screens"
  - "Muscle group chip labels translated via t() in both ExercisesTab components — was missing from 09-03/09-04 extraction"
  - "Duplicate count string removed — {count} already included in the translation value; appending literal count in JSX doubled the number"

patterns-established:
  - "Translation string must not mix JSX string concatenation with interpolated keys — use {placeholder} exclusively"

requirements-completed: [I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, I18N-06, I18N-07, I18N-08, I18N-09]

# Metrics
duration: 30min
completed: 2026-03-29
---

# Phase 09 Plan 05: End-to-End i18n Verification Summary

**Automated checks caught 4 bugs (muscle group chips, diacritics, duplicate counts, mobile viewport); human UAT confirmed both PL/EN locales render correctly across all pages with no raw keys visible**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-29T19:00:00Z
- **Completed:** 2026-03-29T19:30:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- pnpm build passes with zero errors; all 4 namespace JSON files have identical key structures between pl and en
- 4 bugs found and auto-fixed during automated verification: muscle group chip translations missing, Polish diacritics hardcoded in English-only path, duplicate week/workout count rendering, mobile min-width breaking viewport
- Human UAT walkthrough approved: Polish default on first visit, PL|EN toggle works in both nav headers (desktop + sidebar), lang attribute updates dynamically, no raw keys visible, diacritics render in Lato

## Task Commits

Each task was committed atomically:

1. **Task 1: Automated verification — build + scan + auto-fixes** - `f5fbdcb` (fix), `b2bacd4` (fix), `70a2cc1` (fix)
2. **Task 2: Human verification — full i18n walkthrough approved** - `4c90aa6` (chore)

## Files Created/Modified
- `messages/pl/trainer.json` - Added muscle group label translations
- `messages/en/trainer.json` - Added muscle group label translations
- `messages/pl/common.json` - Polish diacritics corrected in affected keys
- `messages/en/common.json` - Ensured key parity
- `src/app/(trainer)/layout.tsx` - Removed `min-w-[768px]` that broke mobile viewport
- `src/app/(trainee)/layout.tsx` - Removed `min-w-[768px]` that broke mobile viewport
- `src/app/(trainer)/trainer/trainees/[traineeId]/_components/ExercisesTab.tsx` - Wire muscle group chips through t()
- `src/app/(trainee)/trainee/_components/TraineeExercisesTab.tsx` - Wire muscle group chips through t()
- `src/app/(trainee)/trainee/page.tsx` - Remove duplicate {count} concatenation in workouts/week display

## Decisions Made
- `min-w-[768px]` on the trainer and trainee layout root divs was identified as a mobile-breaking constraint during UAT preparation; removed to ensure the PL|EN switcher is reachable on small screens
- Duplicate count issue: translation key value already contained `{count} tygodnie` etc., but JSX was also appending `{count}` as a literal sibling — fixed by relying solely on message interpolation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Muscle group chip labels not translated in ExercisesTab**
- **Found during:** Task 1 (grep scan for hardcoded English strings)
- **Issue:** Muscle group filter chips in both trainer and trainee ExercisesTab were rendering raw English strings (e.g., "Chest", "Back") instead of using t() calls
- **Fix:** Added muscle group translation keys to trainer.json (pl + en) and wired chips through `t()` in both ExercisesTab components
- **Files modified:** messages/pl/trainer.json, messages/en/trainer.json, ExercisesTab.tsx, TraineeExercisesTab.tsx
- **Committed in:** `f5fbdcb`

**2. [Rule 1 - Bug] Polish diacritics missing or incorrect in translation JSON**
- **Found during:** Task 1 (JSON key audit)
- **Issue:** Several Polish translation values were missing proper diacritics (e.g., ą, ę, ó, ź) — likely copy-paste from English source
- **Fix:** Corrected affected translation values in messages/pl/ files
- **Committed in:** `f5fbdcb`

**3. [Rule 1 - Bug] Duplicate week/workout count rendered twice**
- **Found during:** Task 1 (string interpolation audit)
- **Issue:** Translation message already contained `{count} tygodnie/weeks` but JSX was concatenating an additional `{count}` value inline, displaying e.g. "3 3 weeks"
- **Fix:** Removed the extra JSX count concatenation; message interpolation is the only source
- **Files modified:** src/app/(trainee)/trainee/page.tsx
- **Committed in:** `b2bacd4`

**4. [Rule 1 - Bug] min-w-[768px] on layout root breaks mobile viewport**
- **Found during:** Task 1 (pre-UAT mobile readiness check)
- **Issue:** Both trainer and trainee layout divs had `min-w-[768px]` which prevented the viewport from shrinking below 768px — the PL|EN language switcher in the sidebar was unreachable on mobile
- **Fix:** Removed the `min-w` constraint from both layout files
- **Files modified:** src/app/(trainer)/layout.tsx, src/app/(trainee)/layout.tsx
- **Committed in:** `70a2cc1`

---

**Total deviations:** 4 auto-fixed (all Rule 1 bugs)
**Impact on plan:** All four fixes necessary for correctness and mobile usability. No scope creep.

## Issues Encountered
None beyond the 4 bugs listed above, all resolved automatically.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 09 i18n implementation is complete and human-verified
- Polish renders by default; EN/PL toggle works on all pages (desktop + mobile)
- All 4 translation namespace JSON files (common, auth, trainer, trainee) have identical key structures in pl and en
- Ready for Phase 10: demo users seeded with random data + login instructions

---
*Phase: 09-internationalization*
*Completed: 2026-03-29*
