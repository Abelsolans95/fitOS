-- Allow clients to SELECT their own trainer_clients rows
-- This is needed for the onboarding flow: after registration, the client
-- needs to read their trainer_clients row to find their trainer.

CREATE POLICY "Clients can view own trainer_clients"
  ON trainer_clients
  FOR SELECT
  USING (client_id = auth.uid());

-- Also allow trainers to see their own clients
CREATE POLICY "Trainers can view own trainer_clients"
  ON trainer_clients
  FOR SELECT
  USING (trainer_id = auth.uid());
