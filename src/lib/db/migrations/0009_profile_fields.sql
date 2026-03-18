-- Phase 6: Profile fields migration

-- Trainer bio
ALTER TABLE trainers ADD COLUMN bio text;

-- Trainee physical stats + goals
ALTER TABLE users ADD COLUMN goals text;
ALTER TABLE users ADD COLUMN height_cm integer;
ALTER TABLE users ADD COLUMN weight_kg numeric(5,2);
ALTER TABLE users ADD COLUMN date_of_birth date;

-- Trainer private notes per connection
ALTER TABLE trainer_trainee_connections ADD COLUMN trainer_notes text;

-- RLS: Allow trainer to UPDATE their own connection row (for trainer_notes)
-- Existing policies only cover SELECT and DELETE; trainer needs UPDATE for notes
CREATE POLICY "trainer_updates_own_connection" ON trainer_trainee_connections
  FOR UPDATE USING (trainer_auth_uid = (SELECT auth.uid()))
  WITH CHECK (trainer_auth_uid = (SELECT auth.uid()));

-- RLS: Allow trainee to read the trainer profile of their connected trainer
-- Required so trainee can see trainer name/email/bio on their profile page
CREATE POLICY "trainee_sees_connected_trainer" ON trainers
  FOR SELECT USING (
    auth_uid IN (
      SELECT trainer_auth_uid FROM trainer_trainee_connections
      WHERE trainee_auth_uid = (SELECT auth.uid())
    )
  );
