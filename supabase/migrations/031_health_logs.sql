-- 031: Health Logs — Registro de lesiones y molestias musculares
-- Trainer y cliente pueden reportar incidencias sobre un mapa muscular interactivo.

-- Enum-like check para tipos de incidencia y estados
CREATE TABLE IF NOT EXISTS health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_by TEXT NOT NULL CHECK (reported_by IN ('coach', 'client')),
  muscle_id TEXT NOT NULL,
  pain_score INTEGER NOT NULL CHECK (pain_score BETWEEN 1 AND 10),
  incident_type TEXT NOT NULL DEFAULT 'puntual' CHECK (incident_type IN ('puntual', 'diagnosticada', 'cronica')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recovering', 'recovered')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_health_logs_client ON health_logs(client_id);
CREATE INDEX idx_health_logs_trainer ON health_logs(trainer_id);
CREATE INDEX idx_health_logs_muscle ON health_logs(client_id, muscle_id, status);
CREATE INDEX idx_health_logs_active ON health_logs(client_id, status) WHERE status IN ('active', 'recovering');

-- Trigger updated_at (usa la función genérica de migración 021)
CREATE TRIGGER set_health_logs_updated_at
  BEFORE UPDATE ON health_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;

-- Trainer: CRUD completo sobre sus clientes
CREATE POLICY "trainer_full_access" ON health_logs
  FOR ALL
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Cliente: puede ver sus propios registros
CREATE POLICY "client_select" ON health_logs
  FOR SELECT
  USING (client_id = auth.uid());

-- Cliente: puede insertar reportes sobre sí mismo (reported_by = 'client')
CREATE POLICY "client_insert" ON health_logs
  FOR INSERT
  WITH CHECK (client_id = auth.uid() AND reported_by = 'client');

-- Cliente: puede actualizar sus propios reportes (solo los que creó)
CREATE POLICY "client_update_own" ON health_logs
  FOR UPDATE
  USING (client_id = auth.uid() AND reported_by = 'client')
  WITH CHECK (client_id = auth.uid() AND reported_by = 'client');

-- Habilitar Realtime para sincronización en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE health_logs;

-- Comentarios
COMMENT ON TABLE health_logs IS 'Registro de lesiones y molestias musculares. Tanto trainer como cliente pueden reportar.';
COMMENT ON COLUMN health_logs.muscle_id IS 'Identificador del grupo muscular (ej: quadriceps_left, chest_right, lower_back)';
COMMENT ON COLUMN health_logs.incident_type IS 'puntual = molestia puntual, diagnosticada = lesión diagnosticada, cronica = dolor crónico';
COMMENT ON COLUMN health_logs.reported_by IS 'coach = creado por el entrenador, client = creado por el cliente';
