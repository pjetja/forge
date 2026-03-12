-- Phase 3: Plan Builder
-- Migration: 0003_plans.sql
-- Apply via Supabase SQL Editor — paste entire file contents and click Run

-- ── Tables ────────────────────────────────────────────────────────────────────

-- 1. plans — template plan record
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_auth_uid UUID NOT NULL,
  name TEXT NOT NULL,
  week_count INTEGER NOT NULL CHECK (week_count > 0),
  workouts_per_week INTEGER NOT NULL CHECK (workouts_per_week > 0 AND workouts_per_week <= 7),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. workout_schemas — named schemas within a plan (e.g., "Push Day")
CREATE TABLE workout_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slot_index INTEGER NOT NULL, -- 1-indexed ordinal (Workout 1, Workout 2, etc.)
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. schema_exercises — exercises within a schema
CREATE TABLE schema_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID NOT NULL REFERENCES workout_schemas(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  target_weight_kg NUMERIC(6,2),
  per_set_weights JSONB, -- array of weights e.g. [80, 82.5, 85]; NULL = single weight mode
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. assigned_plans — per-trainee snapshot copy of a plan
CREATE TABLE assigned_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  trainer_auth_uid UUID NOT NULL,
  trainee_auth_uid UUID NOT NULL,
  name TEXT NOT NULL,
  week_count INTEGER NOT NULL,
  workouts_per_week INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'terminated')),
  started_at TIMESTAMPTZ,
  plan_updated_at TIMESTAMPTZ DEFAULT now(), -- trainer bumps this on any edit; trainee reads for "Plan updated" badge
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. assigned_schemas — schema copies for an assigned plan
CREATE TABLE assigned_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_plan_id UUID NOT NULL REFERENCES assigned_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 6. assigned_schema_exercises — exercise copies for an assigned schema
CREATE TABLE assigned_schema_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_schema_id UUID NOT NULL REFERENCES assigned_schemas(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 10,
  target_weight_kg NUMERIC(6,2),
  per_set_weights JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── RLS Policies ──────────────────────────────────────────────────────────────

-- Template tables (plans, workout_schemas, schema_exercises) — trainers own their rows

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer owns their plans" ON plans FOR ALL
  USING (trainer_auth_uid = auth.uid())
  WITH CHECK (trainer_auth_uid = auth.uid());

ALTER TABLE workout_schemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer owns schemas via plan" ON workout_schemas FOR ALL
  USING (plan_id IN (SELECT id FROM plans WHERE trainer_auth_uid = auth.uid()))
  WITH CHECK (plan_id IN (SELECT id FROM plans WHERE trainer_auth_uid = auth.uid()));

ALTER TABLE schema_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer owns schema exercises" ON schema_exercises FOR ALL
  USING (schema_id IN (
    SELECT ws.id FROM workout_schemas ws
    JOIN plans p ON p.id = ws.plan_id
    WHERE p.trainer_auth_uid = auth.uid()
  ))
  WITH CHECK (schema_id IN (
    SELECT ws.id FROM workout_schemas ws
    JOIN plans p ON p.id = ws.plan_id
    WHERE p.trainer_auth_uid = auth.uid()
  ));

-- Assigned tables — trainers manage, trainees can SELECT their own

ALTER TABLE assigned_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer manages assigned plans" ON assigned_plans FOR ALL
  USING (trainer_auth_uid = auth.uid())
  WITH CHECK (trainer_auth_uid = auth.uid());
CREATE POLICY "Trainee reads own assigned plans" ON assigned_plans FOR SELECT
  USING (trainee_auth_uid = auth.uid());

ALTER TABLE assigned_schemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer manages assigned schemas" ON assigned_schemas FOR ALL
  USING (assigned_plan_id IN (SELECT id FROM assigned_plans WHERE trainer_auth_uid = auth.uid()))
  WITH CHECK (assigned_plan_id IN (SELECT id FROM assigned_plans WHERE trainer_auth_uid = auth.uid()));
CREATE POLICY "Trainee reads own assigned schemas" ON assigned_schemas FOR SELECT
  USING (assigned_plan_id IN (SELECT id FROM assigned_plans WHERE trainee_auth_uid = auth.uid()));

ALTER TABLE assigned_schema_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainer manages assigned schema exercises" ON assigned_schema_exercises FOR ALL
  USING (assigned_schema_id IN (
    SELECT ase.id FROM assigned_schemas ase
    JOIN assigned_plans ap ON ap.id = ase.assigned_plan_id
    WHERE ap.trainer_auth_uid = auth.uid()
  ))
  WITH CHECK (assigned_schema_id IN (
    SELECT ase.id FROM assigned_schemas ase
    JOIN assigned_plans ap ON ap.id = ase.assigned_plan_id
    WHERE ap.trainer_auth_uid = auth.uid()
  ));
CREATE POLICY "Trainee reads own assigned schema exercises" ON assigned_schema_exercises FOR SELECT
  USING (assigned_schema_id IN (
    SELECT ase.id FROM assigned_schemas ase
    JOIN assigned_plans ap ON ap.id = ase.assigned_plan_id
    WHERE ap.trainee_auth_uid = auth.uid()
  ));

-- ── RPC Functions ─────────────────────────────────────────────────────────────

-- duplicate_plan: atomically clone a plan template into a new plan template
CREATE OR REPLACE FUNCTION duplicate_plan(
  source_plan_id UUID,
  new_trainer_auth_uid UUID,
  new_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_plan_id UUID;
  schema_record RECORD;
  new_schema_id UUID;
BEGIN
  INSERT INTO plans (trainer_auth_uid, name, week_count, workouts_per_week)
    SELECT new_trainer_auth_uid, new_name, week_count, workouts_per_week
    FROM plans WHERE id = source_plan_id
  RETURNING id INTO new_plan_id;

  FOR schema_record IN SELECT * FROM workout_schemas WHERE plan_id = source_plan_id ORDER BY sort_order LOOP
    INSERT INTO workout_schemas (plan_id, name, slot_index, sort_order)
      VALUES (new_plan_id, schema_record.name, schema_record.slot_index, schema_record.sort_order)
    RETURNING id INTO new_schema_id;

    INSERT INTO schema_exercises
      (schema_id, exercise_id, sort_order, sets, reps, target_weight_kg, per_set_weights)
    SELECT new_schema_id, exercise_id, sort_order, sets, reps, target_weight_kg, per_set_weights
    FROM schema_exercises WHERE schema_id = schema_record.id ORDER BY sort_order;
  END LOOP;

  RETURN new_plan_id;
END;
$$;

-- assign_plan: atomically clone a plan template into assigned_plan tables for a trainee
CREATE OR REPLACE FUNCTION assign_plan(
  p_plan_id UUID,
  p_trainer_auth_uid UUID,
  p_trainee_auth_uid UUID,
  -- JSON array of weight overrides: [{"exercise_id": "...", "target_weight_kg": 80.0, "per_set_weights": null}]
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
  override JSONB;
  v_target_weight NUMERIC(6,2);
  v_per_set_weights JSONB;
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
      (assigned_schema_id, exercise_id, sort_order, sets, reps, target_weight_kg, per_set_weights)
    SELECT
      v_assigned_schema_id,
      se.exercise_id,
      se.sort_order,
      se.sets,
      se.reps,
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
