# Plan 12-03 Summary: Body-weight tab always visible + i18n audit

## What was done

### Task 1: Body-weight tab always visible

**`src/app/(trainer)/trainer/trainees/[traineeId]/page.tsx`**
- Removed the conditional `...(bodyWeightAccess === 'approved' ? [{key: 'body-weight', ...}] : [])` from the TabSwitcher `tabs` prop — the body-weight tab is now always shown
- Updated the body-weight tab render block to handle all 4 access states:
  - `null` → `<RequestBodyWeightAccessButton>` + explanation paragraph
  - `'pending'` / `'declined'` → `<RequestBodyWeightAccessButton>` (component handles its own messaging)
  - `'approved'` → `<BodyWeightTab>` with revoke button (existing behaviour)
- Removed `<RequestBodyWeightAccessButton>` from the Plans tab (no longer needed there)

**`messages/en/trainer.json` + `messages/pl/trainer.json`**
- Added `traineeDetail.bodyWeight.requestExplanation` key
  - EN: "Request access to view this trainee's body weight data."
  - PL: "Poproś o dostęp, aby zobaczyć dane dotyczące masy ciała tego podopiecznego."

### Task 2: i18n audit

All 8 translation files (en/pl × auth, common, trainee, trainer) were audited with a structural comparison script.

**Findings:**
- `common.muscleGroup.biceps` / `triceps` — identical in both locales: `"Biceps"` / `"Triceps"` — correct, these are the same words in Polish
- `trainee.startWorkout.start` — `"Start"` — correct, same in Polish
- `trainer.schemas.tempo` — `"Tempo"` — correct, loanword
- `trainer.schemas.setLabel` — `"S{number} (kg)"` — correct, abbreviation format is the same
- `trainer.exercises.videoUrlPlaceholder` — URL, intentionally same
- `trainer.traineeDetail.editPlan.status` — `"{status}"` — pure variable, nothing to translate

**Conclusion:** No missing keys, no structural mismatches, no untranslated content found.

## Acceptance criteria

- [x] Body-weight tab always visible in tab list regardless of access state
- [x] All 4 access states (null/pending/declined/approved) rendered correctly inside the tab
- [x] `requestExplanation` key added to EN and PL trainer.json
- [x] TypeScript: no errors in modified files
- [x] i18n audit: 0 missing keys, 0 structural mismatches across all 8 files
