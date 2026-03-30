---
phase: 10-demo-users
plan: "01"
status: complete
completed_at: "2026-03-30"
---

# Plan 10-01 Summary: Demo Seed Script

## What was done

- Added `"tsx": "^4"` and `"dotenv": "^16"` to `devDependencies` in `package.json`
- Added `"seed:demo": "tsx scripts/seed-demo.ts"` to `scripts` in `package.json`
- Created `scripts/seed-demo.ts` — a standalone idempotent TypeScript seed script

## Files modified

| File                   | Change                                                       |
| ---------------------- | ------------------------------------------------------------ |
| `package.json`         | Added `seed:demo` script, `tsx` and `dotenv` devDependencies |
| `scripts/seed-demo.ts` | Created (252 lines)                                          |

## Seed script structure

The script runs sequentially:

1. **Idempotency check** — queries `trainers` table for demo trainer email; exits 0 if already exists
2. **Auth users** — creates 2 Supabase Auth users (`email_confirm: true`, `app_metadata.role`, `user_metadata.is_demo: true`)
3. **Profile rows** — inserts trainer into `trainers`, trainee into `users`, connection into `trainer_trainee_connections`
4. **Exercises** — inserts 10 exercises (Push: 4, Pull: 3, Legs: 3) owned by demo trainer
5. **Plan** — inserts "Push/Pull/Legs Program" (4 weeks, 3x/week) with 3 schemas and 10 schema_exercises
6. **Assigned plan snapshot** — mirrors plan/schemas/exercises into assigned_plans, assigned_schemas, assigned_schema_exercises (status: active, started 14 days ago)
7. **6 workout sessions** — 2 Push + 2 Pull + 2 Legs sessions, dated -14 to -3 days, each with all sets logged; weights increase by 2.5 kg between session 1 and session 2 per schema
8. **14 body weight logs** — daily entries from day -14 to -1, trending 84.2 → 83.5 kg

## Must-haves verified

- ✓ `pnpm seed:demo` command added and runnable via `tsx`
- ✓ Creates demo trainer (role: trainer) and demo trainee (role: trainee) with `is_demo: true` in user_metadata
- ✓ Inserts into trainers, users, trainer_trainee_connections
- ✓ 10 exercises across Push/Pull/Legs muscle groups
- ✓ Push/Pull/Legs plan with 3 schemas and 10 schema exercises
- ✓ Assigned plan snapshot (status: active)
- ✓ 6 completed sessions showing progressive overload (+2.5 kg between visits)
- ✓ 14 body weight entries with downward trend
- ✓ Idempotent: checks for existing trainer row before proceeding
- ✓ Zero TypeScript errors
