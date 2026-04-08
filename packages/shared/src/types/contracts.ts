// ── Contract Management types ────────────────────────────────────────────────

export type ContractStatus = "draft" | "sent" | "viewed" | "signed" | "expired";

export interface ContractTemplate {
  id: string;
  trainer_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  trainer_id: string;
  client_id: string;
  template_id: string | null;
  title: string;
  content: string;
  status: ContractStatus;
  signed_at: string | null;
  signature_data: string | null;
  signer_ip: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  /** Enriched from profiles join */
  client_name?: string;
}

export const CONTRACT_STATUSES: { value: ContractStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "sent", label: "Enviado" },
  { value: "viewed", label: "Visto" },
  { value: "signed", label: "Firmado" },
  { value: "expired", label: "Expirado" },
];
