import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { QUERY_LIMITS } from "../lib/constants";
import { colors } from "../theme";
import type { SupportTicket, TicketReply, TicketCategory, ScreenView } from "./tickets/types";
import TicketList from "./tickets/TicketList";
import CreateTicket from "./tickets/CreateTicket";
import TicketThread from "./tickets/TicketThread";

export default function TicketsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [view, setView] = useState<ScreenView>("list");

  // Detail view
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  // Keep stable ref for Realtime callback
  const selectedTicketIdRef = useRef(selectedTicketId);
  selectedTicketIdRef.current = selectedTicketId;

  // ── Load tickets ──
  const loadTickets = useCallback(async (cId: string) => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, trainer_id, client_id, category, subject, description, image_url, status, created_at, updated_at, trainer_read_at, client_read_at")
      .eq("client_id", cId)
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMITS.TICKETS);

    if (error) {
      console.error("[TicketsScreen] Error loading tickets:", error);
      Alert.alert("Error", "No se pudieron cargar las consultas");
      return;
    }

    const ticketIds = (data ?? []).map((t) => t.id);
    let unreadMap: Record<string, number> = {};
    if (ticketIds.length > 0) {
      const { data: unreadData } = await supabase
        .from("ticket_replies")
        .select("ticket_id")
        .in("ticket_id", ticketIds)
        .neq("sender_id", cId)
        .is("read_at", null);
      (unreadData ?? []).forEach((r) => {
        unreadMap[r.ticket_id] = (unreadMap[r.ticket_id] ?? 0) + 1;
      });
    }

    setTickets((data ?? []).map((t) => ({
      ...t,
      unread_count: unreadMap[t.id] ?? 0,
    })));
  }, []);

  // ── Init ──
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const init = async () => {
      setClientId(user.id);

      const [relResult] = await Promise.all([
        supabase.from("trainer_clients").select("trainer_id").eq("client_id", user.id).eq("status", "active").single(),
        loadTickets(user.id),
      ]);

      if (relResult.data) setTrainerId(relResult.data.trainer_id as string);
      setLoading(false);
    };
    init();
  }, [user?.id, loadTickets]);

  // ── Realtime ──
  useEffect(() => {
    if (!user) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    channel = supabase
      .channel(`tickets-mobile-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "ticket_replies",
        filter: `sender_id=neq.${user.id}`,
      }, (payload) => {
        const reply = payload.new as TicketReply;
        if (reply.ticket_id === selectedTicketIdRef.current) {
          setReplies((prev) => [...prev, { ...reply, sender_role: "trainer" }]);
        }
        loadTickets(user.id);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "support_tickets",
        filter: `client_id=eq.${user.id}`,
      }, () => loadTickets(user.id))
      .subscribe();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user?.id, loadTickets]);

  // ── Open ticket (load replies) ──
  const openTicket = useCallback(async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setView("detail");
    setLoadingReplies(true);
    setReplies([]);

    const { data, error } = await supabase
      .from("ticket_replies")
      .select("id, ticket_id, sender_id, content, image_url, read_at, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .limit(QUERY_LIMITS.TICKET_REPLIES);

    if (error) {
      console.error("[TicketsScreen] Error loading replies:", error);
      Alert.alert("Error", "No se pudieron cargar las respuestas");
      setLoadingReplies(false);
      return;
    }

    const enriched = (data ?? []).map((r) => ({
      ...r,
      sender_role: (r.sender_id === clientId ? "client" : "trainer") as "client" | "trainer",
    }));
    setReplies(enriched);
    setLoadingReplies(false);

    // Mark trainer replies as read
    const unreadIds = enriched.filter((r) => r.sender_role === "trainer" && !r.read_at).map((r) => r.id);
    if (unreadIds.length > 0) {
      const { error: markErr } = await supabase
        .from("ticket_replies")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
      if (markErr) console.error("[TicketsScreen] Error marking read:", markErr); // No bloqueante
    }
  }, [clientId]);

  // ── Create ticket ──
  const handleCreate = useCallback(async (category: TicketCategory, subject: string, description: string) => {
    if (!clientId || !trainerId) return;

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({ client_id: clientId, trainer_id: trainerId, category, subject, description })
      .select()
      .single();

    if (error) {
      console.error("[TicketsScreen] Error creating ticket:", error);
      Alert.alert("Error", "No se pudo crear la consulta");
      return;
    }

    setTickets((prev) => [data as SupportTicket, ...prev]);
    setView("list");
    Alert.alert("Enviada", "Tu consulta ha sido enviada al coach");
  }, [clientId, trainerId]);

  // ── Send reply ──
  const handleSendReply = useCallback(async () => {
    if (!replyContent.trim() || !selectedTicketId || !clientId) return;
    setSending(true);

    const { data, error } = await supabase
      .from("ticket_replies")
      .insert({ ticket_id: selectedTicketId, sender_id: clientId, content: replyContent.trim() })
      .select()
      .single();

    if (error) {
      console.error("[TicketsScreen] Error sending reply:", error);
      Alert.alert("Error", "No se pudo enviar la respuesta");
      setSending(false);
      return;
    }

    setReplies((prev) => [...prev, { ...(data as TicketReply), sender_role: "client" }]);
    setReplyContent("");
    setSending(false);
  }, [clientId, selectedTicketId, replyContent]);

  // ── Navigation callbacks ──
  const goToCreate = useCallback(() => setView("create"), []);
  const goToList = useCallback(() => { setView("list"); setSelectedTicketId(null); }, []);

  // ── Loading ──
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  // ── View routing ──
  if (view === "create") {
    return <CreateTicket onBack={goToList} onSubmit={handleCreate} />;
  }

  if (view === "detail" && selectedTicket && clientId) {
    return (
      <TicketThread
        ticket={selectedTicket}
        replies={replies}
        loadingReplies={loadingReplies}
        clientId={clientId}
        replyContent={replyContent}
        sending={sending}
        onReplyContentChange={setReplyContent}
        onSendReply={handleSendReply}
        onBack={goToList}
      />
    );
  }

  return (
    <View style={s.container}>
      <TicketList tickets={tickets} onOpenTicket={openTicket} onCreateNew={goToCreate} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
});
