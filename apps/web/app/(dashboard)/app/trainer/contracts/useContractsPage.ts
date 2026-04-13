"use client";

import { useReducer, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { Contract, ContractTemplate, ContractTab, ClientOption, TrainerView } from "./components/types";

// ── State ──

interface State {
  loading: boolean;
  trainerId: string | null;
  contracts: Contract[];
  templates: ContractTemplate[];
  clients: ClientOption[];
  // View
  activeView: TrainerView;
  activeTab: ContractTab;
  // Detail
  selectedContractId: string | null;
  // Create form
  formClientId: string;
  formTitle: string;
  formContent: string;
  formTemplateId: string;
  submitting: boolean;
  // Delete confirm
  confirmDeleteId: string | null;
}

const initialState: State = {
  loading: true,
  trainerId: null,
  contracts: [],
  templates: [],
  clients: [],
  activeView: "list",
  activeTab: "all",
  selectedContractId: null,
  formClientId: "",
  formTitle: "",
  formContent: "",
  formTemplateId: "",
  submitting: false,
  confirmDeleteId: null,
};

// ── Actions ──

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_TRAINER_ID"; payload: string }
  | { type: "SET_CONTRACTS"; payload: Contract[] }
  | { type: "SET_TEMPLATES"; payload: ContractTemplate[] }
  | { type: "SET_CLIENTS"; payload: ClientOption[] }
  | { type: "SET_VIEW"; payload: TrainerView }
  | { type: "SET_TAB"; payload: ContractTab }
  | { type: "SELECT_CONTRACT"; payload: string | null }
  | { type: "SET_FORM_CLIENT_ID"; payload: string }
  | { type: "SET_FORM_TITLE"; payload: string }
  | { type: "SET_FORM_CONTENT"; payload: string }
  | { type: "SET_FORM_TEMPLATE_ID"; payload: string }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "ADD_CONTRACT"; payload: Contract }
  | { type: "UPDATE_CONTRACT"; payload: Contract }
  | { type: "REMOVE_CONTRACT"; payload: string }
  | { type: "CONFIRM_DELETE"; payload: string | null }
  | { type: "RESET_FORM" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_TRAINER_ID":
      return { ...state, trainerId: action.payload };
    case "SET_CONTRACTS":
      return { ...state, contracts: action.payload, loading: false };
    case "SET_TEMPLATES":
      return { ...state, templates: action.payload };
    case "SET_CLIENTS":
      return { ...state, clients: action.payload };
    case "SET_VIEW":
      return { ...state, activeView: action.payload };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "SELECT_CONTRACT":
      return { ...state, selectedContractId: action.payload, activeView: action.payload ? "detail" : "list" };
    case "SET_FORM_CLIENT_ID":
      return { ...state, formClientId: action.payload };
    case "SET_FORM_TITLE":
      return { ...state, formTitle: action.payload };
    case "SET_FORM_CONTENT":
      return { ...state, formContent: action.payload };
    case "SET_FORM_TEMPLATE_ID":
      return { ...state, formTemplateId: action.payload };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.payload };
    case "ADD_CONTRACT":
      return { ...state, contracts: [action.payload, ...state.contracts], submitting: false };
    case "UPDATE_CONTRACT":
      return {
        ...state,
        contracts: state.contracts.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };
    case "REMOVE_CONTRACT":
      return {
        ...state,
        contracts: state.contracts.filter((c) => c.id !== action.payload),
        confirmDeleteId: null,
        selectedContractId: state.selectedContractId === action.payload ? null : state.selectedContractId,
        activeView: state.selectedContractId === action.payload ? "list" : state.activeView,
      };
    case "CONFIRM_DELETE":
      return { ...state, confirmDeleteId: action.payload };
    case "RESET_FORM":
      return { ...state, formClientId: "", formTitle: "", formContent: "", formTemplateId: "", activeView: "list" };
    default:
      return state;
  }
}

// ── Hook ──

export function useContractsPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const supabase = createClient();

  // ── Load data ──
  const loadData = useCallback(async (trainerId: string) => {
    const [contractsRes, templatesRes, clientsRes] = await Promise.all([
      fetch("/api/contracts").then((r) => r.json()),
      supabase
        .from("contract_templates")
        .select("id, trainer_id, title, content, created_at, updated_at")
        .eq("trainer_id", trainerId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("trainer_clients")
        .select("client_id")
        .eq("trainer_id", trainerId)
        .limit(200),
    ]);

    // Set contracts
    dispatch({ type: "SET_CONTRACTS", payload: contractsRes.contracts ?? [] });

    // Set templates
    if (!templatesRes.error) {
      dispatch({ type: "SET_TEMPLATES", payload: templatesRes.data ?? [] });
    }

    // Enrich client names
    const clientIds = (clientsRes.data ?? []).map((c: { client_id: string }) => c.client_id);
    if (clientIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", clientIds);

      const options: ClientOption[] = (profiles ?? []).map((p: { user_id: string; full_name: string | null }) => ({
        value: p.user_id,
        label: p.full_name ?? "Cliente",
      }));
      dispatch({ type: "SET_CLIENTS", payload: options });
    }
  }, [supabase]);

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      dispatch({ type: "SET_TRAINER_ID", payload: user.id });
      await loadData(user.id);
    };
    init();
  }, []);

  // ── Create contract ──
  const handleCreate = useCallback(async () => {
    if (!state.formClientId || !state.formTitle.trim() || !state.formContent.trim()) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    dispatch({ type: "SET_SUBMITTING", payload: true });

    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: state.formClientId,
        title: state.formTitle.trim(),
        content: state.formContent.trim(),
        template_id: state.formTemplateId || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Error al crear contrato");
      dispatch({ type: "SET_SUBMITTING", payload: false });
      return;
    }

    // Find client name for enrichment
    const clientName = state.clients.find((c) => c.value === state.formClientId)?.label ?? "Cliente";
    dispatch({ type: "ADD_CONTRACT", payload: { ...data.contract, client_name: clientName } });
    dispatch({ type: "RESET_FORM" });
    toast.success("Contrato creado");
  }, [state.formClientId, state.formTitle, state.formContent, state.formTemplateId, state.clients]);

  // ── Send contract ──
  const handleSend = useCallback(async (contractId: string) => {
    const res = await fetch("/api/contracts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contractId, status: "sent" }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Error al enviar contrato");
      return;
    }

    dispatch({ type: "UPDATE_CONTRACT", payload: { ...data.contract, client_name: state.contracts.find((c) => c.id === contractId)?.client_name } });
    toast.success("Contrato enviado al cliente");
  }, [state.contracts]);

  // ── Expire contract ──
  const handleExpire = useCallback(async (contractId: string) => {
    const res = await fetch("/api/contracts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contractId, status: "expired" }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Error al expirar contrato");
      return;
    }

    dispatch({ type: "UPDATE_CONTRACT", payload: { ...data.contract, client_name: state.contracts.find((c) => c.id === contractId)?.client_name } });
    toast.success("Contrato expirado");
  }, [state.contracts]);

  // ── Delete contract ──
  const handleDelete = useCallback(async (contractId: string) => {
    const res = await fetch("/api/contracts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contractId }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Error al eliminar contrato");
      return;
    }

    dispatch({ type: "REMOVE_CONTRACT", payload: contractId });
    toast.success("Contrato eliminado");
  }, []);

  // ── Apply template ──
  const handleApplyTemplate = useCallback((templateId: string) => {
    const tpl = state.templates.find((t) => t.id === templateId);
    if (!tpl) return;
    dispatch({ type: "SET_FORM_TEMPLATE_ID", payload: templateId });
    dispatch({ type: "SET_FORM_TITLE", payload: tpl.title });
    dispatch({ type: "SET_FORM_CONTENT", payload: tpl.content });
  }, [state.templates]);

  // ── Filtered contracts ──
  const filteredContracts = state.contracts.filter((c) => {
    if (state.activeTab === "all") return true;
    return c.status === state.activeTab;
  });

  const selectedContract = state.contracts.find((c) => c.id === state.selectedContractId) ?? null;

  return {
    state,
    dispatch,
    filteredContracts,
    selectedContract,
    handleCreate,
    handleSend,
    handleExpire,
    handleDelete,
    handleApplyTemplate,
  };
}
