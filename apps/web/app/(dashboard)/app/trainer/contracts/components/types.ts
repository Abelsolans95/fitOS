import type { ContractStatus, Contract, ContractTemplate } from "@fitos/shared";

export type { ContractStatus, Contract, ContractTemplate };

export type ContractTab = ContractStatus | "all";

export interface ClientOption {
  value: string;
  label: string;
}

export type TrainerView = "list" | "create" | "detail" | "templates";
