-- 030_appointments.sql
-- Calendario de citas: reserva y tipos de sesión entre entrenador y cliente
-- Sincronización con Google Calendar: preparado (google_event_id), pendiente OAuth
-- Notificaciones email: preparado (email_sent_at), pendiente Resend + dominio

CREATE TABLE appointments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                     TEXT NOT NULL,
  session_type              TEXT NOT NULL DEFAULT 'presencial',
  -- 'presencial' | 'online' | 'telefonica' | 'evaluacion' | 'seguimiento'
  starts_at                 TIMESTAMPTZ NOT NULL,
  ends_at                   TIMESTAMPTZ NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' (solicitada por cliente) | 'confirmed' | 'cancelled' | 'completed'
  notes                     TEXT,
  location                  TEXT,        -- para sesiones presenciales
  meeting_url               TEXT,        -- para sesiones online
  -- Google Calendar (pendiente OAuth 2.0)
  google_event_id           TEXT,        -- ID del evento en Google Calendar del trainer
  google_calendar_synced_at TIMESTAMPTZ, -- timestamp de última sincronización
  -- Email (pendiente Resend + dominio)
  email_sent_at             TIMESTAMPTZ, -- timestamp de envío del email de confirmación
  -- Cancelación
  cancelled_by              UUID REFERENCES auth.users(id),
  cancellation_reason       TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointments_time_check CHECK (ends_at > starts_at),
  CONSTRAINT appointments_status_check CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  CONSTRAINT appointments_type_check CHECK (
    session_type IN ('presencial', 'online', 'telefonica', 'evaluacion', 'seguimiento')
  )
);

CREATE INDEX idx_appointments_trainer ON appointments(trainer_id, starts_at);
CREATE INDEX idx_appointments_client  ON appointments(client_id, starts_at);
CREATE INDEX idx_appointments_status  ON appointments(status, starts_at);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Trainer: acceso completo a sus citas
CREATE POLICY "Trainer manages own appointments" ON appointments
  FOR ALL USING (auth.uid() = trainer_id);

-- Cliente: puede ver sus citas
CREATE POLICY "Client views own appointments" ON appointments
  FOR SELECT USING (auth.uid() = client_id);

-- Cliente: puede solicitar citas (solo INSERT con status pending)
CREATE POLICY "Client requests appointment" ON appointments
  FOR INSERT WITH CHECK (
    auth.uid() = client_id
    AND status = 'pending'
  );

-- Cliente: puede cancelar sus propias citas
CREATE POLICY "Client cancels own appointment" ON appointments
  FOR UPDATE USING (auth.uid() = client_id)
  WITH CHECK (status = 'cancelled');

-- Realtime para actualizaciones en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Trigger updated_at
CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
