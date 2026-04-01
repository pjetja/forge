# Phase 12: After-Release Fixes — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Session date:** 2026-04-01
**Scope:** Plan 12-04 unblock discussion (Plans 12-01 through 12-03, 12-05, 12-06 were already ready)

---

## Area: FAQ location

**Question:** Where should the usage flows live?

| Option                      | Description                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------- |
| Add to /help page           | New "Getting Started" section on the existing page                                    |
| **→ Separate /guide route** | **New route with dedicated content — keeps FAQ and onboarding conceptually separate** |
| Tabs on /help page          | Tab switcher toggling between FAQ and Getting Started                                 |

**Selected:** Separate `/guide` route

---

## Area: Format

**Question:** What format for the usage flow steps?

| Option                           | Description                                                             |
| -------------------------------- | ----------------------------------------------------------------------- |
| **→ Step-by-step numbered list** | **Numbered steps with a short description per step — clear, scannable** |
| Section headings + one-liners    | Lighter weight, less descriptive                                        |
| Accordion / expandable           | More interactive but adds complexity                                    |

**Selected:** Step-by-step numbered list

---

## Area: Screenshots

**Question:** Screenshots or text only?

| Option           | Description                                    |
| ---------------- | ---------------------------------------------- |
| **→ Text only**  | **Easier to maintain, no image assets needed** |
| With screenshots | Visual but requires image management           |

**Selected:** Text only

---

## Area: Trainer workflow steps

**Question:** Which trainer workflow steps should be documented?

| Option                               | Steps                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------- |
| **→ All 4 steps (full flow)**        | **Create exercises → Build a plan → Assign to trainee → Monitor progress** |
| 3 core steps (skip exercises)        | Build a plan → Assign → Monitor                                            |
| 3 onboarding steps (skip monitoring) | Create exercises → Build a plan → Assign                                   |

**Selected:** All 4 steps

---

## Area: Trainee workflow steps

**Question:** Which trainee workflow steps should be documented?

| Option                           | Steps                                                  |
| -------------------------------- | ------------------------------------------------------ |
| All 4 steps (full flow)          | Join → Log workout → Track body weight → View progress |
| **→ 3 steps (skip body weight)** | **Join → Log workout → View progress**                 |
| 2 essential steps only           | Join + Log a workout                                   |

**Selected:** 3 steps — Join, Log, Progress. Body weight tracking goes to FAQ as a new Q&A entry on `/help` (trainees section, q3).

---

_Phase: 12-after-release-fixes_
_Log gathered: 2026-04-01_
