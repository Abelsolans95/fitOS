"use client";

import { useReducer, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { SupportTicket, TicketReply, TicketCategory } from "./components/types";

// ── State ──

type View = "list" | "create" | "detail";

interface State {
  loading: boolean;
  clientId: string | null;
  trainerId: string | null;
  tickets: SupportTicket[];
  activeView: View;
  // Detail
  selectedTicketId: string | null;
  replies: TicketReply[];
  loadingReplies: boolean;
  replyContent: string;
  sending: boolean;
  // Create form
  formCategory: TicketCategory;
  formSubject: string;
  formDescription: string;
  submitting: boolean;
}

const initialState: State = {
  loading: true,
  clientId: null,
  trainerId: null,
  tickets: [],
  activeView: "list",
  selectedTicketId: null,
  replies: [],
  loadingReplies: false,
  replyContent: "",
  sending: false,
  formCategory: "general",
  formSubject: "",
  formDescription: "",
  submitting: false,
};

// ── Actions ──

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_IDS"; payload: { clientId: string; trainerId: string } }
  | { type: "SET_TICKETS"; payload: SupportTicket[] }
  | { type: "SET_VIEW"; payload: View }
  | { type: "SELECT_TICKET"; payload: string | null }
  | { type: "SET_REPLIES"; payload: TicketReply[] }
  | { type: "ADD_REPLY"; payload: TicketReply }
  | { type: "SET_LOADING_REPLIES"; payload: boolean }
  | { type: "SET_REPLY_CONTENT"; payload: string }
  | { type: "SET_SENDING"; payload: boolean }
  | { type: "SET_FORM_CATEGORY"; payload: TicketCategory }
  | { type: "SET_FORM_SUBJECT"; payload: string }
  | { type: "SET_FORM_DESCRIPTION"; payload: string }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "ADD_TICKET"; payload: SupportTicket }
  | { type: "UPDATE_TICKET_STATUS"; payload: { id: string; status: string } };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_IDS":
      return { ...state, clientId: action.payload.clientId, trainerId: action.payload.trainerId };
    case "SET_TICKETS":
      return { ...state, tickets: action.payload, loading: false };
    case "SET_VIEW":
      return { ...state, activeView: action.payload };
    case "SELECT_TICKET":
      return { ...state, selectedTicketId: action.payload, activeView: action.payload ? "detail" : "list", replies: [], replyContent: "" };
    case "SET_REPLIES":
      return { ...state, replies: action.payload, loadingReplies: false };
    case "ADD_REPLY":
      return { ...state, replies: [...state.replies, action.payload], replyContent: "", sending: false };
    case "SET_LOADING_REPLIES":
      return { ...state, loadingReplies: action.payload };
    case "SET_REPLY_CONTENT":
      return { ...state, replyContent: action.payload };
    case "SET_SENDING":
      return { ...state, sending: action.payload };
    case "SET_FORM_CATEGORY":
      return { ...state, formCategory: action.payload };
    case "SET_FORM_SUBJECT":
      return { ...state, formSubject: action.payload };
    case "SET_FORM_DESCRIPTION":
      return { ...state, formDescription: action.payload };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.payload };
    case "ADD_TICKET":
      return {
        ...state,
        tickets: [action.payload, ...state.tickets],
        activeView: "list",
        formCategory: "general",
        formSubject: "",
        formDescription: "",
        submitting: false,
      };
    case "UPDATE_TICKET_STATUS":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.id ? { ...t, status: action.payload.status as SupportTicket["status"] } : t
        ),
      };
    default:
      return state;
  }
}

// ── Hook ──

export function useClientTicketsPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const supabase = createClient();

  // ── Load tickets ──
  const loadTickets = useCallback(async (clientId: string) => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, trainer_id, client_id, category, subject, description, image_url, status, created_at, updated_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Error al cargar tus consultas");
      console.error("[useClientTicketsPage] Error loading tickets:", error);
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    // Get unread replies (from trainer, unread by client)
    const ticketIds = (data ?? []).map((t) => t.id);
    let unreadMap: Record<string, number> = {};
    if (ticketIds.length > 0) {
      const { data: unreadData } = await supabase
        .from("ticket_replies")
        .select("ticket_id")
        .in("ticket_id", ticketIds)
        .neq("sender_id", clientId)
        .is("read_at", null);
      (unreadData ?? []).forEach((r) => {
        unreadMap[r.ticket_id] = (unreadMap[r.ticket_id] ?? 0) + 1;
      });
    }

    const enriched: SupportTicket[] = (data ?? []).map((t) => ({
      ...t,
      unread_count: unreadMap[t.id] ?? 0,
    }));

    dispatch({ type: "SET_TICKETS", payload: enriched });
  }, [supabase]);

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rel } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (!rel) {
        toast.error("No se encontró tu entrenador");
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      dispatch({ type: "SET_IDS", payload: { clientId: user.id, trainerId: rel.trainer_id as string } });
      await loadTickets(user.id);
    };
    init();
  }, []);

  // ── Realtime ──
  useEffect(() => {
    if (!state.clientId) return;

    const channel = supabase
      .channel(`client-tickets-rt-${state.clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_replies" },
        (payload) => {
          const reply = payload.new as TicketReply;
          if (reply.sender_id === state.clientId) return;
          // If viewing this ticket, add the reply
          if (reply.ticket_id === state.selectedTicketId) {
            dispatch({ type: "ADD_REPLY", payload: { ...reply, sender_role: "trainer" } });
          }
          // Refresh ticket list to update unread counts
          loadTickets(state.clientId!);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_tickets" },
        (payload) => {
          const updated = payload.new as SupportTicket;
          if (updated.client_id === state.clientId) {
            dispatch({ type: "UPDATE_TICKET_STATUS", payload: { id: updated.id, status: updated.status } });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [state.clientId, state.selectedTicketId]);

  // ── Load replies ──
  const loadReplies = useCallback(async (ticketId: string) => {
    dispatch({ type: "SET_LOADING_REPLIES", payload: true });

    const { data, error } = await supabase
      .from("ticket_replies")
      .select("id, ticket_id, sender_id, content, image_url, read_at, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      toast.error("Error al cargar respuestas");
      console.error("[useClientTicketsPage] Error loading replies:", error);
      dispatch({ type: "SET_LOADING_REPLIES", payload: false });
      return;
    }

    const enriched: TicketReply[] = (data ?? []).map((r) => ({
      ...r,
      sender_role: r.sender_id === state.clientId ? "client" : "trainer",
    }));

    dispatch({ type: "SET_REPLIES", payload: enriched });

    // Mark trainer replies as read
    const unreadIds = enriched
      .filter((r) => r.sender_role === "trainer" && !r.read_at)
      .map((r) => r.id);

    if (unreadIds.length > 0) {
      await supabase
        .from("ticket_replies")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
    }
  }, [supabase, state.clientId]);

  // ── Select ticket ──
  const handleSelectTicket = useCallback((ticketId: string | null) => {
    dispatch({ type: "SELECT_TICKET", payload: ticketId });
    if (ticketId) loadReplies(ticketId);
  }, [loadReplies]);

  // ── Create ticket ──
  const handleCreateTicket = useCallback(async () => {
    if (!state.formSubject.trim() || !state.formDescription.trim() || !state.clientId || !state.trainerId) return;
    dispatch({ type: "SET_SUBMITTING", payload: true });

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        client_id: state.clientId,
        trainer_id: state.trainerId,
        category: state.formCategory,
        subject: state.formSubject.trim(),
        description: state.formDescription.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al crear consulta");
      console.error("[useClientTicketsPage] Error creating ticket:", error);
      dispatch({ type: "SET_SUBMITTING", payload: false });
      return;
    }

    dispatch({ type: "ADD_TICKET", payload: data });
    toast.success("Consulta enviada a tu entrenador");
  }, [supabase, state.formSubject, state.formDescription, state.formCategory, state.clientId, state.trainerId]);

  // ── Send reply ──
  const handleSendReply = useCallback(async () => {
    if (!state.replyContent.trim() || !state.selectedTicketId || !state.clientId) return;
    dispatch({ type: "SET_SENDING", payload: true });

    const { data, error } = await supabase
      .from("ticket_replies")
      .insert({
        ticket_id: state.selectedTicketId,
        sender_id: state.clientId,
        content: state.replyContent.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al enviar respuesta");
      console.error("[useClientTicketsPage] Error sending reply:", error);
      dispatch({ type: "SET_SENDING", payload: false });
      return;
    }

    dispatch({ type: "ADD_REPLY", payload: { ...data, sender_role: "client" } });
  }, [supabase, state.replyContent, state.selectedTicketId, state.clientId]);

  const selectedTicket = state.tickets.find((t) => t.id === state.selectedTicketId) ?? null;

  return {
    state,
    dispatch,
    selectedTicket,
    handleSelectTicket,
    handleCreateTicket,
    handleSendReply,
  };
}
