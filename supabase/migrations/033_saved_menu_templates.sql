-- Saved menu templates: reusable menu configurations without client assignment
CREATE TABLE IF NOT EXISTS saved_menu_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE saved_menu_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers full access own templates"
  ON saved_menu_templates
  FOR ALL
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER set_updated_at_saved_menu_templates
  BEFORE UPDATE ON saved_menu_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
