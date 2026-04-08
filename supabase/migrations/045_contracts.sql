-- ============================================================================
-- Migration 045: Contract Management System
-- Tables: contract_templates, contracts
-- ============================================================================

-- ── contract_templates ──────────────────────────────────────────────────────

CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contract_templates_trainer ON contract_templates(trainer_id);

-- Updated_at trigger
CREATE TRIGGER set_contract_templates_updated_at
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Trainer can manage own templates
CREATE POLICY contract_templates_trainer_select ON contract_templates
  FOR SELECT TO authenticated
  USING (trainer_id = auth.uid());

CREATE POLICY contract_templates_trainer_insert ON contract_templates
  FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY contract_templates_trainer_update ON contract_templates
  FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY contract_templates_trainer_delete ON contract_templates
  FOR DELETE TO authenticated
  USING (trainer_id = auth.uid());


-- ── contracts ───────────────────────────────────────────────────────────────

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'expired')),
  signed_at TIMESTAMPTZ,
  signature_data TEXT,
  signer_ip TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contracts_trainer ON contracts(trainer_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_template ON contracts(template_id);

-- Updated_at trigger
CREATE TRIGGER set_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Trainer can manage contracts for their linked clients
CREATE POLICY contracts_trainer_select ON contracts
  FOR SELECT TO authenticated
  USING (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid() AND tc.client_id = contracts.client_id
    )
  );

CREATE POLICY contracts_trainer_insert ON contracts
  FOR INSERT TO authenticated
  WITH CHECK (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid() AND tc.client_id = contracts.client_id
    )
  );

CREATE POLICY contracts_trainer_update ON contracts
  FOR UPDATE TO authenticated
  USING (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid() AND tc.client_id = contracts.client_id
    )
  )
  WITH CHECK (
    trainer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid() AND tc.client_id = contracts.client_id
    )
  );

CREATE POLICY contracts_trainer_delete ON contracts
  FOR DELETE TO authenticated
  USING (
    trainer_id = auth.uid()
    AND status = 'draft'
    AND EXISTS (
      SELECT 1 FROM trainer_clients tc
      WHERE tc.trainer_id = auth.uid() AND tc.client_id = contracts.client_id
    )
  );

-- Client can view and update (for signing) their own contracts
CREATE POLICY contracts_client_select ON contracts
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY contracts_client_update ON contracts
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid() AND status IN ('sent', 'viewed'))
  WITH CHECK (client_id = auth.uid() AND status IN ('viewed', 'signed'));
