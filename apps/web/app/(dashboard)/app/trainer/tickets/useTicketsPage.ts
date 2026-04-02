"use client";

import { useReducer, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { SupportTicket, TicketReply, TicketCategory, TicketStatus, TicketTab } from "./components/types";

// ── State ──

interface State {
  loading: boolean;
  trainerId: string | null;
  tickets: SupportTicket[];
  // Filters
  activeTab: TicketTab;
  filterCategory: TicketCategory | "all";
  searchQuery: string;
  // Detail view
  selectedTicketId: string | null;
  replies: TicketReply[];
  loadingReplies: boolean;
  // Reply form
  replyContent: string;
  sending: boolean;
}

const initialState: State = {
  loading: true,
  trainerId: null,
  tickets: [],
  activeTab: "all",
  filterCategory: "all",
  searchQuery: "",
  selectedTicketId: null,
  replies: [],
  loadingReplies: false,
  replyContent: "",
  sending: false,
};

// ── Actions ──

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_TRAINER_ID"; payload: string }
  | { type: "SET_TICKETS"; payload: SupportTicket[] }
  | { type: "SET_ACTIVE_TAB"; payload: TicketTab }
  | { type: "SET_FILTER_CATEGORY"; payload: TicketCategory | "all" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SELECT_TICKET"; payload: string | null }
  | { type: "SET_REPLIES"; payload: TicketReply[] }
  | { type: "ADD_REPLY"; payload: TicketReply }
  | { type: "SET_LOADING_REPLIES"; payload: boolean }
  | { type: "SET_REPLY_CONTENT"; payload: string }
  | { type: "SET_SENDING"; payload: boolean }
  | { type: "UPDATE_TICKET_STATUS"; payload: { id: string; status: TicketStatus } }
  | { type: "ADD_TICKET"; payload: SupportTicket }
  | { type: "MARK_TICKET_READ"; payload: { id: string; trainer_read_at: string } }
  | { type: "INCREMENT_UNREAD"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_TRAINER_ID":
      return { ...state, trainerId: action.payload };
    case "SET_TICKETS":
      return { ...state, tickets: action.payload, loading: false };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_FILTER_CATEGORY":
      return { ...state, filterCategory: action.payload };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SELECT_TICKET":
      return { ...state, selectedTicketId: action.payload, replies: [], replyContent: "" };
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
    case "UPDATE_TICKET_STATUS":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.id ? { ...t, status: action.payload.status } : t
        ),
      };
    case "ADD_TICKET":
      return { ...state, tickets: [action.payload, ...state.tickets] };
    case "MARK_TICKET_READ":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.id
            ? { ...t, unread_count: 0, trainer_read_at: t.trainer_read_at ?? action.payload.trainer_read_at }
            : t
        ),
      };
    case "INCREMENT_UNREAD":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload
            ? { ...t, unread_count: (t.unread_count ?? 0) + 1 }
            : t
        ),
      };
    default:
      return state;
  }
}

// ── Hook ──

export function useTicketsPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const supabase = createClient();

  // ── Load tickets ──
  const loadTickets = useCallback(async (trainerId: string) => {
    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select("id, trainer_id, client_id, category, subject, description, image_url, status, trainer_read_at, created_at, updated_at")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      toast.error("Error al cargar consultas");
      console.error("[useTicketsPage] Error loading tickets:", error);
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    // Enrich with client names
    const clientIds = [...new Set((tickets ?? []).map((t) => t.client_id))];
    let clientNames: Record<string, string> = {};
    if (clientIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", clientIds);
      if (profiles) {
        clientNames = Object.fromEntries(profiles.map((p) => [p.user_id, p.full_name ?? "Cliente"]));
      }
    }

    // Enrich with unread counts (replies from clients that trainer hasn't marked read)
    const { data: unreadData } = await supabase
      .from("ticket_replies")
      .select("ticket_id")
      .neq("sender_id", trainerId)
      .is("read_at", null);

    const unreadMap: Record<string, number> = {};
    (unreadData ?? []).forEach((r) => {
      unreadMap[r.ticket_id] = (unreadMap[r.ticket_id] ?? 0) + 1;
    });

    const enriched: SupportTicket[] = (tickets ?? []).map((t) => ({
      ...t,
      client_name: clientNames[t.client_id] ?? "Cliente",
      unread_count: (unreadMap[t.id] ?? 0) + (t.trainer_read_at ? 0 : 1),
    }));

    dispatch({ type: "SET_TICKETS", payload: enriched });
  }, [supabase]);

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      dispatch({ type: "SET_TRAINER_ID", payload: user.id });
      await loadTickets(user.id);
    };
    init();
  }, []);

  // ── Realtime ──
  useEffect(() => {
    if (!state.trainerId) return;

    const channel = supabase
      .channel("trainer-tickets-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_tickets", filter: `trainer_id=eq.${state.trainerId}` },
        async (payload) => {
          const ticket = payload.new as SupportTicket;
          // Enrich client name
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", ticket.client_id)
            .single();
          dispatch({
            type: "ADD_TICKET",
            payload: { ...ticket, client_name: profile?.full_name ?? "Cliente", unread_count: 1 },
          });
          toast.info("Nueva consulta recibida");
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_replies" },
        (payload) => {
          const reply = payload.new as TicketReply;
          if (reply.sender_id === state.trainerId) return;
          // If viewing this ticket, add to thread
          if (reply.ticket_id === state.selectedTicketId) {
            dispatch({ type: "ADD_REPLY", payload: { ...reply, sender_role: "client" } });
          }
          // Increment unread
          dispatch({ type: "INCREMENT_UNREAD", payload: reply.ticket_id });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [state.trainerId, state.selectedTicketId]);

  // ── Load replies for selected ticket ──
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
      console.error("[useTicketsPage] Error loading replies:", error);
      dispatch({ type: "SET_LOADING_REPLIES", payload: false });
      return;
    }

    // Enrich with sender role
    const enriched: TicketReply[] = (data ?? []).map((r) => ({
      ...r,
      sender_role: r.sender_id === state.trainerId ? "trainer" : "client",
    }));

    dispatch({ type: "SET_REPLIES", payload: enriched });

    // Mark ticket as read by trainer + mark client replies as read
    const now = new Date().toISOString();
    const ticket = state.tickets.find((t) => t.id === ticketId);

    const promises: Promise<unknown>[] = [];

    // Set trainer_read_at if not yet read
    if (ticket && !ticket.trainer_read_at) {
      promises.push(
        supabase.from("support_tickets").update({ trainer_read_at: now }).eq("id", ticketId)
      );
    }

    // Mark client replies as read
    const unreadIds = enriched
      .filter((r) => r.sender_role === "client" && !r.read_at)
      .map((r) => r.id);

    if (unreadIds.length > 0) {
      promises.push(
        supabase.from("ticket_replies").update({ read_at: now }).in("id", unreadIds)
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    // Always reset unread count locally when trainer views a ticket
    dispatch({ type: "MARK_TICKET_READ", payload: { id: ticketId, trainer_read_at: now } });
  }, [supabase, state.trainerId]);

  // ── Select ticket ──
  const handleSelectTicket = useCallback((ticketId: string | null) => {
    dispatch({ type: "SELECT_TICKET", payload: ticketId });
    if (ticketId) loadReplies(ticketId);
  }, [loadReplies]);

  // ── Send reply ──
  const handleSendReply = useCallback(async () => {
    if (!state.replyContent.trim() || !state.selectedTicketId || !state.trainerId) return;
    dispatch({ type: "SET_SENDING", payload: true });

    const { data, error } = await supabase
      .from("ticket_replies")
      .insert({
        ticket_id: state.selectedTicketId,
        sender_id: state.trainerId,
        content: state.replyContent.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al enviar respuesta");
      console.error("[useTicketsPage] Error sending reply:", error);
      dispatch({ type: "SET_SENDING", payload: false });
      return;
    }

    dispatch({
      type: "ADD_REPLY",
      payload: { ...data, sender_role: "trainer" },
    });
  }, [supabase, state.replyContent, state.selectedTicketId, state.trainerId]);

  // ── Update status ──
  const handleUpdateStatus = useCallback(async (ticketId: string, status: TicketStatus) => {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status })
      .eq("id", ticketId);

    if (error) {
      toast.error("Error al actualizar estado");
      console.error("[useTicketsPage] Error updating status:", error);
      return;
    }

    dispatch({ type: "UPDATE_TICKET_STATUS", payload: { id: ticketId, status } });
    toast.success(`Consulta marcada como "${status === "resolved" ? "Resuelta" : status === "in_progress" ? "En progreso" : "Abierta"}"`);
  }, [supabase]);

  // ── Filtered tickets ──
  const filteredTickets = state.tickets.filter((t) => {
    if (state.activeTab !== "all" && t.status !== state.activeTab) return false;
    if (state.filterCategory !== "all" && t.category !== state.filterCategory) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.client_name?.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedTicket = state.tickets.find((t) => t.id === state.selectedTicketId) ?? null;

  return {
    state,
    dispatch,
    filteredTickets,
    selectedTicket,
    handleSelectTicket,
    handleSendReply,
    handleUpdateStatus,
  };
}
