---
plan: "10-02"
status: complete
date: "2026-03-30"
duration: ~5 min
files_created:
  - src/app/actions.ts
files_modified:
  - src/app/page.tsx
ts_errors: 0
---

# 10-02 Summary — Landing page demo section

## What was done

**Task 1 — `src/app/actions.ts` (created, 28 lines)**  
Two server actions with hardcoded credentials matching the seed script:

- `loginAsDemoTrainer()` → signs in as `demo-trainer@trainerforge.app` → redirects `/trainer`
- `loginAsDemoTrainee()` → signs in as `demo-trainee@trainerforge.app` → redirects `/trainee`
  On auth error, both fall back to `/login`.

**Task 2 — i18n keys verified**  
All 8 keys already present in both `messages/en/common.json` and `messages/pl/common.json` under `landing`:
`demoTitle`, `demoSubtitle`, `testAsTrainer`, `testAsTrainee`, `demoTrainerLabel`, `demoTraineeLabel`, `demoEmailLabel`, `demoPasswordLabel`.

**Task 3 — `src/app/page.tsx` (updated)**  
Added demo section between the Features `</section>` and `<footer>`:

- Two `bg-bg-surface` cards in `grid-cols-1 sm:grid-cols-2` layout
- Each card: bold role label, email + password in plain text (with dimmed prefix labels), full-width outlined login button
- `max-w-[800px]` wrapper, `border-t border-border` top separator

## Must-have verification

| Truth                                            | Status |
| ------------------------------------------------ | ------ |
| Demo section appears below Features section      | ✅     |
| Heading + subtitle in both locales               | ✅     |
| Two credential cards side by side                | ✅     |
| Each card shows email + password in plain text   | ✅     |
| Each card has CTA that auto-logs in              | ✅     |
| Trainer button → /trainer                        | ✅     |
| Trainee button → /trainee                        | ✅     |
| Labels translated per locale (8 keys)            | ✅     |
| Demo section visually distinct from sign-up CTAs | ✅     |

## Awaiting human verify (Task 4)

Open http://localhost:3000 and verify visually + test both login flows.
