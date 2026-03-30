-- Allow trainer to update goals for their connected trainees
CREATE POLICY "trainer_updates_connected_trainee_goals" ON users
  FOR UPDATE USING (
    auth_uid IN (
      SELECT trainee_auth_uid FROM trainer_trainee_connections
      WHERE trainer_auth_uid = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    auth_uid IN (
      SELECT trainee_auth_uid FROM trainer_trainee_connections
      WHERE trainer_auth_uid = (SELECT auth.uid())
    )
  );
