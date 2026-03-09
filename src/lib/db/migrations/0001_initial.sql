-- Phase 1 Foundation: Core tables with RLS

-- Trainer profiles
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
-- Trainers can only read/write their own row
CREATE POLICY "trainer_sees_own_row" ON trainers
  FOR ALL USING ((SELECT auth.uid()) = auth_uid);

-- Trainee/user profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('trainee')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Trainees see their own row
CREATE POLICY "user_sees_own_row" ON users
  FOR ALL USING ((SELECT auth.uid()) = auth_uid);
-- Trainers can see their connected trainees
CREATE POLICY "trainer_sees_connected_trainees" ON users
  FOR SELECT USING (
    auth_uid IN (
      SELECT trainee_auth_uid FROM trainer_trainee_connections
      WHERE trainer_auth_uid = (SELECT auth.uid())
    )
  );

-- Invite links
CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_auth_uid UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
-- Trainers manage their own invite links
CREATE POLICY "trainer_manages_own_invites" ON invite_links
  FOR ALL USING ((SELECT auth.uid()) = trainer_auth_uid);
-- Note: invite token validation is done via admin client in Server Actions
-- to avoid exposing the token lookup surface via RLS

-- Trainer-trainee connections
CREATE TABLE IF NOT EXISTS trainer_trainee_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_auth_uid UUID NOT NULL,
  trainee_auth_uid UUID NOT NULL,
  invite_link_id UUID REFERENCES invite_links(id),
  connected_at TIMESTAMPTZ DEFAULT now(),
  -- CRITICAL: database-level uniqueness — one trainer per trainee
  CONSTRAINT trainee_unique_connection UNIQUE (trainee_auth_uid)
);

ALTER TABLE trainer_trainee_connections ENABLE ROW LEVEL SECURITY;
-- Trainer sees their connections (roster)
CREATE POLICY "trainer_sees_own_connections" ON trainer_trainee_connections
  FOR SELECT USING (trainer_auth_uid = (SELECT auth.uid()));
-- Trainee sees their own connection
CREATE POLICY "trainee_sees_own_connection" ON trainer_trainee_connections
  FOR SELECT USING (trainee_auth_uid = (SELECT auth.uid()));
-- Disconnect: either party can remove (trainer removing from roster OR trainee disconnecting)
CREATE POLICY "disconnect" ON trainer_trainee_connections
  FOR DELETE USING (
    trainer_auth_uid = (SELECT auth.uid()) OR trainee_auth_uid = (SELECT auth.uid())
  );
-- Insert handled by admin client in Server Actions (bypasses RLS) — no INSERT policy needed
