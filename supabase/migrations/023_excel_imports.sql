-- Excel import tracking table
-- Stores the raw parsed data, detected columns, and mapping decisions
-- for audit trail and potential re-import.

CREATE TABLE excel_imports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name         TEXT NOT NULL,
  file_size_bytes   INTEGER,
  sheet_count       INTEGER DEFAULT 1,

  -- Semantic column analysis results
  detected_columns  JSONB NOT NULL DEFAULT '[]',
  -- Example: [{"index":0,"header":"Ejercicio","inferred_type":"exercise_name","confidence":0.95},
  --           {"index":1,"header":"Series","inferred_type":"sets","confidence":0.88}]

  -- Raw row data from the spreadsheet
  row_data          JSONB NOT NULL DEFAULT '[]',

  -- Trainer's mapping decisions (after review/correction)
  mapping_decisions JSONB NOT NULL DEFAULT '{}',
  -- Example: {"columns":{"0":"exercise_name","1":"sets","2":"reps","3":"weight_kg"},
  --           "entities":[{"row":0,"action":"link","matched_id":"uuid","confidence":0.92}]}

  -- Import status
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','mapped','reconciled','imported','failed')),

  -- Which routine was created from this import (if any)
  result_routine_id UUID REFERENCES user_routines(id) ON DELETE SET NULL,

  error_log         TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_excel_imports_trainer ON excel_imports(trainer_id);
CREATE INDEX idx_excel_imports_status ON excel_imports(status);

-- RLS
ALTER TABLE excel_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers manage own imports"
  ON excel_imports
  FOR ALL
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER set_updated_at_excel_imports
  BEFORE UPDATE ON excel_imports
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
