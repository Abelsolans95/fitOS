"use client";

import { useReducer, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { Contract, ClientContractView } from "./components/types";

// ── State ──

interface State {
  loading: boolean;
  clientId: string | null;
  contracts: Contract[];
  // View
  activeView: ClientContractView;
  selectedContractId: string | null;
  showSignature: boolean;
  signing: boolean;
}

const initialState: State = {
  loading: true,
  clientId: null,
  contracts: [],
  activeView: "list",
  selectedContractId: null,
  showSignature: false,
  signing: false,
};

// ── Actions ──

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CLIENT_ID"; payload: string }
  | { type: "SET_CONTRACTS"; payload: Contract[] }
  | { type: "SET_VIEW"; payload: ClientContractView }
  | { type: "SELECT_CONTRACT"; payload: string | null }
  | { type: "SHOW_SIGNATURE"; payload: boolean }
  | { type: "SET_SIGNING"; payload: boolean }
  | { type: "UPDATE_CONTRACT"; payload: Contract };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_CLIENT_ID":
      return { ...state, clientId: action.payload };
    case "SET_CONTRACTS":
      return { ...state, contracts: action.payload, loading: false };
    case "SET_VIEW":
      return { ...state, activeView: action.payload };
    case "SELECT_CONTRACT":
      return {
        ...state,
        selectedContractId: action.payload,
        activeView: action.payload ? "detail" : "list",
        showSignature: false,
        signing: false,
      };
    case "SHOW_SIGNATURE":
      return { ...state, showSignature: action.payload };
    case "SET_SIGNING":
      return { ...state, signing: action.payload };
    case "UPDATE_CONTRACT":
      return {
        ...state,
        contracts: state.contracts.map((c) => (c.id === action.payload.id ? action.payload : c)),
        showSignature: false,
        signing: false,
      };
    default:
      return state;
  }
}

// ── Hook ──

export function useClientContractsPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const supabase = createClient();

  // ── Load contracts ──
  const loadContracts = useCallback(async () => {
    const res = await fetch("/api/contracts");
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Error al cargar contratos");
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    dispatch({ type: "SET_CONTRACTS", payload: data.contracts ?? [] });
  }, []);

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      dispatch({ type: "SET_CLIENT_ID", payload: user.id });
      await loadContracts();
    };
    init();
  }, []);

  // ── Select contract + mark as viewed ──
  const handleSelectContract = useCallback(async (contractId: string | null) => {
    dispatch({ type: "SELECT_CONTRACT", payload: contractId });

    if (!contractId) return;

    const contract = state.contracts.find((c) => c.id === contractId);
    if (contract?.status === "sent") {
      // Mark as viewed
      const res = await fetch("/api/contracts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contractId }),
      });

      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "UPDATE_CONTRACT", payload: data.contract });
      }
    }
  }, [state.contracts]);

  // ── Sign contract ──
  const handleSign = useCallback(async (signatureData: string) => {
    if (!state.selectedContractId) return;
    dispatch({ type: "SET_SIGNING", payload: true });

    const res = await fetch("/api/contracts/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: state.selectedContractId,
        signature_data: signatureData,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Error al firmar contrato");
      dispatch({ type: "SET_SIGNING", payload: false });
      return;
    }

    dispatch({ type: "UPDATE_CONTRACT", payload: { ...data.contract, signature_data: signatureData } });
    toast.success("Contrato firmado correctamente");
  }, [state.selectedContractId]);

  const selectedContract = state.contracts.find((c) => c.id === state.selectedContractId) ?? null;

  const pendingCount = state.contracts.filter((c) => c.status === "sent" || c.status === "viewed").length;

  return {
    state,
    dispatch,
    selectedContract,
    pendingCount,
    handleSelectContract,
    handleSign,
  };
}
