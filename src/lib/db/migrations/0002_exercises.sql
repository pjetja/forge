-- Phase 2: Exercise Library
-- Apply via Supabase SQL Editor

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_auth_uid UUID NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Trainer can only read/write their own exercises
-- WITH CHECK required for INSERT (FOR ALL USING alone does not grant INSERT in all Postgres versions)
-- (SELECT auth.uid()) wrapper = 95% performance improvement over direct auth.uid() call
CREATE POLICY "trainer_manages_own_exercises" ON exercises
  FOR ALL
  USING ((SELECT auth.uid()) = trainer_auth_uid)
  WITH CHECK ((SELECT auth.uid()) = trainer_auth_uid);

-- Index for RLS policy performance (trainer isolation)
CREATE INDEX IF NOT EXISTS exercises_trainer_auth_uid_idx ON exercises(trainer_auth_uid);
-- Index for name search (.ilike() queries)
CREATE INDEX IF NOT EXISTS exercises_name_idx ON exercises(name);
