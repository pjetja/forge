-- Update assign_plan() to support per-exercise sets/reps overrides at assignment time
-- Migration: 0007_assign_sets_reps_override.sql
-- Apply via Supabase SQL Editor — paste entire file contents and click Run

CREATE OR REPLACE FUNCTION assign_plan(
  p_plan_id UUID,
  p_trainer_auth_uid UUID,
  p_trainee_auth_uid UUID,
  -- JSON array: [{"exercise_id":"...","sets":4,"reps":8,"target_weight_kg":80,"per_set_weights":null,"tempo":"3010","progression_mode":"linear"}]
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
      (assigned_schema_id, exercise_id, sort_order, sets, reps, target_weight_kg, per_set_weights, tempo, progression_mode)
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
