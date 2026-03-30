-- Add sort_order to assigned_plans so trainers can reorder the pending queue.
-- Backfill existing rows using created_at so the initial order is stable.

ALTER TABLE assigned_plans ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Backfill: assign sort_order per (trainer, trainee) pair ordered by created_at
UPDATE assigned_plans ap
SET sort_order = sub.rn
FROM (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY trainer_auth_uid, trainee_auth_uid
           ORDER BY created_at
         ) - 1 AS rn
  FROM assigned_plans
) sub
WHERE ap.id = sub.id;
