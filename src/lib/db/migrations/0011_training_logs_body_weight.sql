-- Phase 8: Training Logs and Body Weight Progression Tracking
-- Apply via Supabase SQL Editor

-- 1. Add enrichment columns to workout_sessions
ALTER TABLE workout_sessions
  ADD COLUMN duration_minutes INTEGER,
  ADD COLUMN kcal_burned INTEGER,
  ADD COLUMN rpe INTEGER CHECK (rpe BETWEEN 1 AND 10);

-- 2. Body weight logs table
CREATE TABLE body_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_auth_uid UUID NOT NULL,
  logged_date DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (trainee_auth_uid, logged_date)
);

ALTER TABLE body_weight_logs ENABLE ROW LEVEL SECURITY;

-- Trainee full CRUD on own rows
CREATE POLICY "Trainee manages own body weight logs" ON body_weight_logs FOR ALL
  USING (trainee_auth_uid = (SELECT auth.uid()))
  WITH CHECK (trainee_auth_uid = (SELECT auth.uid()));

-- 3. Body weight access requests table
CREATE TABLE body_weight_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_auth_uid UUID NOT NULL,
  trainee_auth_uid UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (trainer_auth_uid, trainee_auth_uid)
);

ALTER TABLE body_weight_access_requests ENABLE ROW LEVEL SECURITY;

-- Trainer can INSERT and SELECT own request rows
CREATE POLICY "Trainer manages own body weight requests" ON body_weight_access_requests FOR ALL
  USING (trainer_auth_uid = (SELECT auth.uid()))
  WITH CHECK (trainer_auth_uid = (SELECT auth.uid()));

-- Trainee can read their incoming requests
CREATE POLICY "Trainee reads own body weight requests" ON body_weight_access_requests FOR SELECT
  USING (trainee_auth_uid = (SELECT auth.uid()));

-- Trainee can update status on their incoming requests
CREATE POLICY "Trainee updates own body weight request status" ON body_weight_access_requests FOR UPDATE
  USING (trainee_auth_uid = (SELECT auth.uid()))
  WITH CHECK (trainee_auth_uid = (SELECT auth.uid()));

-- 4. Trainer SELECT on body_weight_logs (cross-table reference — must be after body_weight_access_requests)
-- Trainer SELECT conditional on approved access request
CREATE POLICY "Trainer reads body weight with permission" ON body_weight_logs FOR SELECT
  USING (
    trainee_auth_uid IN (
      SELECT trainee_auth_uid FROM body_weight_access_requests
      WHERE trainer_auth_uid = (SELECT auth.uid())
        AND status = 'approved'
    )
  );

-- 5. Performance indexes
CREATE INDEX idx_body_weight_logs_trainee ON body_weight_logs (trainee_auth_uid, logged_date DESC);
CREATE INDEX idx_body_weight_access_trainee ON body_weight_access_requests (trainee_auth_uid);
CREATE INDEX idx_body_weight_access_trainer ON body_weight_access_requests (trainer_auth_uid);
