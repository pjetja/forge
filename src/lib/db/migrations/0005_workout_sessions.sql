-- Phase 4: Trainee Workout Logging
-- Apply via Supabase SQL Editor
-- TODO: Apply this migration via Supabase SQL Editor before testing Phase 4

-- ── Tables ────────────────────────────────────────────────────────────────────

-- workout_sessions — one row per workout attempt (one schema per session)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_schema_id UUID NOT NULL REFERENCES assigned_schemas(id) ON DELETE RESTRICT,
  trainee_auth_uid UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- session_sets — one row per logged set within a session
CREATE TABLE session_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  assigned_schema_exercise_id UUID NOT NULL
    REFERENCES assigned_schema_exercises(id) ON DELETE RESTRICT,
  set_number INTEGER NOT NULL,  -- 1-indexed; matches plan set position
  actual_reps INTEGER NOT NULL,
  actual_weight_kg NUMERIC(6,2),
  muscle_failure BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique: one logged set per (session, exercise, set number) — enables upsert idempotency
  UNIQUE (session_id, assigned_schema_exercise_id, set_number)
);

-- ── RLS Policies ──────────────────────────────────────────────────────────────

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Trainee manages own sessions
CREATE POLICY "Trainee manages own sessions" ON workout_sessions FOR ALL
  USING (trainee_auth_uid = auth.uid())
  WITH CHECK (trainee_auth_uid = auth.uid());

-- Trainer reads sessions for their trainees (Phase 5 prep)
CREATE POLICY "Trainer reads trainee sessions" ON workout_sessions FOR SELECT
  USING (
    trainee_auth_uid IN (
      SELECT trainee_auth_uid FROM trainer_trainee_connections
      WHERE trainer_auth_uid = auth.uid()
    )
  );

ALTER TABLE session_sets ENABLE ROW LEVEL SECURITY;

-- Trainee manages own session sets (via session ownership)
CREATE POLICY "Trainee manages own session sets" ON session_sets FOR ALL
  USING (
    session_id IN (
      SELECT id FROM workout_sessions WHERE trainee_auth_uid = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM workout_sessions WHERE trainee_auth_uid = auth.uid()
    )
  );

-- Trainer reads sets for their trainees (Phase 5 prep)
CREATE POLICY "Trainer reads trainee session sets" ON session_sets FOR SELECT
  USING (
    session_id IN (
      SELECT ws.id FROM workout_sessions ws
      JOIN trainer_trainee_connections ttc
        ON ttc.trainee_auth_uid = ws.trainee_auth_uid
      WHERE ttc.trainer_auth_uid = auth.uid()
    )
  );

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_workout_sessions_trainee_status
  ON workout_sessions (trainee_auth_uid, status);
CREATE INDEX idx_workout_sessions_schema_id
  ON workout_sessions (assigned_schema_id);
CREATE INDEX idx_session_sets_session_id
  ON session_sets (session_id);
CREATE INDEX idx_session_sets_exercise_completed
  ON session_sets (assigned_schema_exercise_id, completed_at);
