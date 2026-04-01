-- Phase 12: Progression mode parameters (RPE target, RIR target, linear increment)
-- Migration: 0012_progression_targets.sql
-- Apply via Supabase SQL Editor — paste entire file contents and click Run

-- ── Add progression parameter columns to template exercises ───────────────────

ALTER TABLE schema_exercises
  ADD COLUMN rpe_target INTEGER CHECK (rpe_target BETWEEN 1 AND 10),
  ADD COLUMN rir_target INTEGER CHECK (rir_target BETWEEN 0 AND 5),
  ADD COLUMN weight_increment_per_week NUMERIC(5, 2);

-- ── Add progression parameter columns to assigned exercises ───────────────────

ALTER TABLE assigned_schema_exercises
  ADD COLUMN rpe_target INTEGER CHECK (rpe_target BETWEEN 1 AND 10),
  ADD COLUMN rir_target INTEGER CHECK (rir_target BETWEEN 0 AND 5),
  ADD COLUMN weight_increment_per_week NUMERIC(5, 2);

-- ── Update assign_plan() to copy the three new columns ────────────────────────

CREATE OR REPLACE FUNCTION assign_plan(
  p_plan_id UUID,
  p_trainer_auth_uid UUID,
  p_trainee_auth_uid UUID,
  -- JSON array: [{"exercise_id":"...","sets":4,"reps":8,"target_weight_kg":80,"per_set_weights":null,"tempo":"3010","progression_mode":"linear","rpe_target":8,"rir_target":null,"weight_increment_per_week":2.5}]
  p_weight_overrides JSONB DEFAULT '[]'::JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assigned_plan_id UUID;
  v_plan RECORD;
  schema_rec RECORD;
  v_assigned_schema_id UUID;
BEGIN
  SELECT * INTO v_plan FROM plans WHERE id = p_plan_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Plan not found'; END IF;

  INSERT INTO assigned_plans (source_plan_id, trainer_auth_uid, trainee_auth_uid, name, week_count, workouts_per_week, status)
    VALUES (p_plan_id, p_trainer_auth_uid, p_trainee_auth_uid, v_plan.name, v_plan.week_count, v_plan.workouts_per_week, 'pending')
  RETURNING id INTO v_assigned_plan_id;

  FOR schema_rec IN SELECT * FROM workout_schemas WHERE plan_id = p_plan_id ORDER BY sort_order LOOP
    INSERT INTO assigned_schemas (assigned_plan_id, name, slot_index, sort_order)
      VALUES (v_assigned_plan_id, schema_rec.name, schema_rec.slot_index, schema_rec.sort_order)
    RETURNING id INTO v_assigned_schema_id;

    INSERT INTO assigned_schema_exercises
      (assigned_schema_id, exercise_id, sort_order, sets, reps, target_weight_kg, per_set_weights, tempo, progression_mode, rpe_target, rir_target, weight_increment_per_week)
    SELECT
      v_assigned_schema_id,
      se.exercise_id,
      se.sort_order,
      COALESCE(
        (SELECT (elem->>'sets')::INTEGER
         FROM jsonb_array_elements(p_weight_overrides) AS elem
         WHERE elem->>'exercise_id' = se.exercise_id::TEXT
           AND elem->>'sets' IS NOT NULL),
        se.sets
      ),
      COALESCE(
        (SELECT (elem->>'reps')::INTEGER
         FROM jsonb_array_elements(p_weight_overrides) AS elem
         WHERE elem->>'exercise_id' = se.exercise_id::TEXT
           AND elem->>'reps' IS NOT NULL),
        se.reps
      ),
      COALESCE(
        (SELECT (elem->>'target_weight_kg')::NUMERIC(6,2)
         FROM jsonb_array_elements(p_weight_overrides) AS elem
         WHERE elem->>'exercise_id' = se.exercise_id::TEXT),
        se.target_weight_kg
      ),
      COALESCE(
        (SELECT elem->'per_set_weights'
         FROM jsonb_array_elements(p_weight_overrides) AS elem
         WHERE elem->>'exercise_id' = se.exercise_id::TEXT
           AND elem->'per_set_weights' IS NOT NULL
           AND elem->>'per_set_weights' != 'null'),
        se.per_set_weights
      ),
      COALESCE(
        (SELECT NULLIF(elem->>'tempo', '')
         FROM jsonb_array_elements(p_weight_overrides) AS elem
         WHERE elem->>'exercise_id' = se.exercise_id::TEXT
           AND elem->>'tempo' IS NOT NULL),
        se.tempo
      ),
      COALESCE(
        (SELECT NULLIF(elem->>'progression_mode', '')
         FROM jsonb_array_elements(p_weight_overrides) AS elem
         WHERE elem->>'exercise_id' = se.exercise_id::TEXT
           AND elem->>'progression_mode' IS NOT NULL
           AND elem->>'progression_mode' != 'null'),
        se.progression_mode,
        'none'
      ),
      COALESCE(
        (SELECT (elem->>'rpe_target')::INTEGER
         FROM jsonb_array_elements(p_weight_overrides) AS elem
         WHERE elem->>'exercise_id' = se.exercise_id::TEXT
           AND elem->>'rpe_target' IS NOT NULL),
        se.rpe_target
      ),
      COALESCE(
        (SELECT (elem->>'rir_target')::INTEGER
         FROM jsonb_array_elements(p_weight_overrides) AS elem
         WHERE elem->>'exercise_id' = se.exercise_id::TEXT
           AND elem->>'rir_target' IS NOT NULL),
        se.rir_target
      ),
      COALESCE(
        (SELECT (elem->>'weight_increment_per_week')::NUMERIC(5,2)
         FROM jsonb_array_elements(p_weight_overrides) AS elem
         WHERE elem->>'exercise_id' = se.exercise_id::TEXT
           AND elem->>'weight_increment_per_week' IS NOT NULL),
        se.weight_increment_per_week
      )
    FROM schema_exercises se
    WHERE se.schema_id = schema_rec.id
    ORDER BY se.sort_order;
  END LOOP;

  RETURN v_assigned_plan_id;
END;
$$;

-- IMPORTANT: Apply this migration via Supabase SQL Editor
-- Paste entire file contents into the SQL Editor and click Run
