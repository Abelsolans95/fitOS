import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, shadows, fonts } from "../theme";
import type { TicketCategory, TicketStatus, SupportTicket, TicketReply } from "@fitos/shared";
import { TICKET_CATEGORIES } from "@fitos/shared";

// ── Category styles ──

const CATEGORY_COLORS: Record<TicketCategory, string> = {
  nutricion: colors.success,
  rutina: colors.cyan,
  lesion: colors.error,
  general: colors.violet,
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: colors.orange,
  in_progress: colors.cyan,
  resolved: colors.success,
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Abierta",
  in_progress: "En progreso",
  resolved: "Resuelta",
};

type ScreenView = "list" | "create" | "detail";

export default function TicketsScreen() {
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [view, setView] = useState<ScreenView>("list");

  // Create form
  const [formCategory, setFormCategory] = useState<TicketCategory>("general");
  const [formSubject, setFormSubject] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detail view
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // ── Load tickets ──
  const loadTickets = useCallback(async (cId: string) => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, trainer_id, client_id, category, subject, description, image_url, status, created_at, updated_at")
      .eq("client_id", cId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[TicketsScreen] Error loading tickets:", error);
      Alert.alert("Error", "No se pudieron cargar las consultas");
      return;
    }

    // Count unread replies
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
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setClientId(user.id);

      const { data: rel } = await supabase
        .from("trainer_clients")
        .select("trainer_id")
        .eq("client_id", user.id)
        .eq("status", "active")
        .single();

      if (rel) setTrainerId(rel.trainer_id as string);
      await loadTickets(user.id);
      setLoading(false);
    };
    init();
  }, [loadTickets]);

  // ── Realtime ──
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel(`tickets-mobile-${user.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_replies" },
          (payload) => {
            const reply = payload.new as TicketReply;
            if (reply.sender_id === user.id) return;
            if (reply.ticket_id === selectedTicketId) {
              setReplies((prev) => [...prev, { ...reply, sender_role: "trainer" }]);
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            }
            loadTickets(user.id);
          })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets" },
          () => loadTickets(user.id))
        .subscribe();
    };
    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [selectedTicketId, loadTickets]);

  // ── Load replies ──
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
      .limit(200);

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
      await supabase.from("ticket_replies").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
  }, [clientId]);

  // ── Create ticket ──
  const handleCreate = useCallback(async () => {
    if (!formSubject.trim() || !formDescription.trim() || !clientId || !trainerId) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        client_id: clientId,
        trainer_id: trainerId,
        category: formCategory,
        subject: formSubject.trim(),
        description: formDescription.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("[TicketsScreen] Error creating ticket:", error);
      Alert.alert("Error", "No se pudo crear la consulta");
      setSubmitting(false);
      return;
    }

    setTickets((prev) => [data as SupportTicket, ...prev]);
    setFormSubject("");
    setFormDescription("");
    setFormCategory("general");
    setSubmitting(false);
    setView("list");
    Alert.alert("Enviada", "Tu consulta ha sido enviada al coach");
  }, [clientId, trainerId, formCategory, formSubject, formDescription]);

  // ── Send reply ──
  const handleSendReply = useCallback(async () => {
    if (!replyContent.trim() || !selectedTicketId || !clientId) return;
    setSending(true);

    const { data, error } = await supabase
      .from("ticket_replies")
      .insert({
        ticket_id: selectedTicketId,
        sender_id: clientId,
        content: replyContent.trim(),
      })
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
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [clientId, selectedTicketId, replyContent]);

  // ── Helpers ──
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  // ── CREATE VIEW ──
  if (view === "create") {
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView("list")} style={s.backBtn}>
            <Text style={s.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={s.title}>Nueva consulta</Text>
        </View>

        <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Category */}
          <Text style={s.label}>CATEGORÍA</Text>
          <View style={s.categoryGrid}>
            {TICKET_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[
                  s.categoryCard,
                  formCategory === c.value && { borderColor: CATEGORY_COLORS[c.value], backgroundColor: `${CATEGORY_COLORS[c.value]}15` },
                ]}
                onPress={() => setFormCategory(c.value)}
              >
                <Text style={[s.categoryLabel, formCategory === c.value && { color: CATEGORY_COLORS[c.value] }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Subject */}
          <Text style={s.label}>ASUNTO</Text>
          <TextInput
            style={s.input}
            value={formSubject}
            onChangeText={setFormSubject}
            placeholder="¿Sobre qué es tu consulta?"
            placeholderTextColor={colors.dimmed}
            maxLength={200}
          />

          {/* Description */}
          <Text style={s.label}>DESCRIPCIÓN</Text>
          <TextInput
            style={[s.input, { height: 140, textAlignVertical: "top" }]}
            value={formDescription}
            onChangeText={setFormDescription}
            placeholder="Describe tu duda o problema..."
            placeholderTextColor={colors.dimmed}
            multiline
          />

          {/* Submit */}
          <TouchableOpacity
            style={[s.primaryBtn, (!formSubject.trim() || !formDescription.trim()) && { opacity: 0.4 }]}
            onPress={handleCreate}
            disabled={submitting || !formSubject.trim() || !formDescription.trim()}
          >
            <Text style={s.primaryBtnText}>
              {submitting ? "Enviando..." : "Enviar consulta al coach"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── DETAIL VIEW ──
  if (view === "detail" && selectedTicket) {
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => { setView("list"); setSelectedTicketId(null); }} style={s.backBtn}>
            <Text style={s.backText}>← Volver</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title} numberOfLines={1}>{selectedTicket.subject}</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <View style={[s.badge, { backgroundColor: `${CATEGORY_COLORS[selectedTicket.category]}20` }]}>
                <Text style={[s.badgeText, { color: CATEGORY_COLORS[selectedTicket.category] }]}>
                  {TICKET_CATEGORIES.find((c) => c.value === selectedTicket.category)?.label}
                </Text>
              </View>
              <View style={[s.badge, { backgroundColor: `${STATUS_COLORS[selectedTicket.status]}20` }]}>
                <Text style={[s.badgeText, { color: STATUS_COLORS[selectedTicket.status] }]}>
                  {STATUS_LABELS[selectedTicket.status]}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={s.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Original message */}
          <View style={s.messageCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={s.avatarCyan}><Text style={s.avatarText}>T</Text></View>
              <Text style={[s.senderName, { color: colors.cyan }]}>Tú</Text>
              <Text style={s.timeText}>{timeAgo(selectedTicket.created_at)}</Text>
            </View>
            <Text style={s.messageText}>{selectedTicket.description}</Text>
          </View>

          {/* Replies */}
          {loadingReplies ? (
            <ActivityIndicator size="small" color={colors.cyan} style={{ marginTop: 20 }} />
          ) : (
            replies.map((reply) => {
              const isClient = reply.sender_role === "client";
              return (
                <View
                  key={reply.id}
                  style={[s.replyBubble, isClient ? s.replyClient : s.replyTrainer]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[s.senderName, { color: isClient ? colors.cyan : colors.violet }]}>
                      {isClient ? "Tú" : "Coach"}
                    </Text>
                    <Text style={s.timeText}>{timeAgo(reply.created_at)}</Text>
                  </View>
                  <Text style={s.messageText}>{reply.content}</Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Reply input */}
        {selectedTicket.status !== "resolved" ? (
          <View style={s.inputBar}>
            <TextInput
              style={s.replyInput}
              value={replyContent}
              onChangeText={setReplyContent}
              placeholder="Escribe tu respuesta..."
              placeholderTextColor={colors.dimmed}
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, !replyContent.trim() && { opacity: 0.4 }]}
              onPress={handleSendReply}
              disabled={sending || !replyContent.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#0A0A0F" />
              ) : (
                <Text style={s.sendBtnText}>→</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.resolvedBar}>
            <Text style={{ color: colors.success, fontSize: 14, fontFamily: fonts.semibold }}>
              Esta consulta ha sido resuelta
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  }

  // ── LIST VIEW ──
  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Consultas</Text>
          <Text style={s.subtitle}>Consulta dudas con tu entrenador</Text>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={() => setView("create")}>
          <Text style={s.newBtnText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {tickets.length === 0 ? (
        <View style={s.emptyContainer}>
          <Text style={s.emptyText}>Aún no tienes consultas</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => setView("create")}>
            <Text style={s.primaryBtnText}>Crear primera consulta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.ticketCard} onPress={() => openTicket(item.id)}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={s.ticketSubject} numberOfLines={1}>{item.subject}</Text>
                    {(item.unread_count ?? 0) > 0 && (
                      <View style={s.unreadBadge}>
                        <Text style={s.unreadText}>{item.unread_count}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.ticketDesc} numberOfLines={2}>{item.description}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={[s.badge, { backgroundColor: `${CATEGORY_COLORS[item.category]}20` }]}>
                    <Text style={[s.badgeText, { color: CATEGORY_COLORS[item.category] }]}>
                      {TICKET_CATEGORIES.find((c) => c.value === item.category)?.label}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: `${STATUS_COLORS[item.status]}20` }]}>
                    <Text style={[s.badgeText, { color: STATUS_COLORS[item.status] }]}>
                      {STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                  <Text style={s.timeText}>{timeAgo(item.created_at)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backBtn: { marginRight: 12 },
  backText: { color: colors.cyan, fontSize: 14, fontFamily: fonts.semibold },
  title: { color: "#fff", fontSize: 20, fontFamily: fonts.extrabold, letterSpacing: -0.5 },
  subtitle: { color: colors.dimmed, fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  content: { flex: 1, padding: spacing.md },
  label: {
    color: colors.dimmed, fontSize: 10, fontFamily: fonts.bold,
    letterSpacing: 2, marginTop: spacing.md, marginBottom: spacing.sm,
  },

  // Category
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: {
    flex: 1, minWidth: "45%", borderRadius: radius.lg, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", backgroundColor: colors.card,
    paddingVertical: spacing.md, alignItems: "center",
  },
  categoryLabel: { color: colors.muted, fontSize: 14, fontFamily: fonts.semibold },

  // Form inputs
  input: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14,
    fontFamily: fonts.regular, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
  },
  primaryBtn: {
    backgroundColor: colors.cyan, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.lg,
  },
  primaryBtnText: { color: "#0A0A0F", fontSize: 14, fontFamily: fonts.bold },

  // List
  newBtn: {
    backgroundColor: colors.cyan, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  newBtnText: { color: "#0A0A0F", fontSize: 12, fontFamily: fonts.bold },
  ticketCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", padding: spacing.md, marginBottom: spacing.sm,
  },
  ticketSubject: { color: "#fff", fontSize: 14, fontFamily: fonts.bold, flex: 1 },
  ticketDesc: { color: colors.muted, fontSize: 12, fontFamily: fonts.regular, marginTop: 4 },
  unreadBadge: {
    backgroundColor: colors.violet, borderRadius: 10, minWidth: 20,
    height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  unreadText: { color: "#fff", fontSize: 10, fontFamily: fonts.bold },

  // Badges
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontFamily: fonts.bold },
  timeText: { color: colors.dimmed, fontSize: 10, fontFamily: fonts.regular },

  // Detail messages
  messageCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", padding: spacing.md, marginBottom: spacing.sm,
  },
  avatarCyan: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: `${colors.cyan}30`, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.cyan, fontSize: 12, fontFamily: fonts.bold },
  senderName: { fontSize: 12, fontFamily: fonts.bold },
  messageText: { color: colors.muted, fontSize: 14, fontFamily: fonts.regular, marginTop: 8, lineHeight: 20 },

  replyBubble: { borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm, maxWidth: "85%" },
  replyClient: {
    backgroundColor: `${colors.cyan}10`, borderWidth: 1, borderColor: `${colors.cyan}30`, alignSelf: "flex-end",
  },
  replyTrainer: {
    backgroundColor: `${colors.violet}15`, borderWidth: 1, borderColor: `${colors.violet}30`, alignSelf: "flex-start",
  },

  // Input bar
  inputBar: {
    flexDirection: "row", gap: 8, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
    paddingBottom: Platform.OS === "ios" ? 30 : spacing.sm,
  },
  replyInput: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14,
    fontFamily: fonts.regular, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: colors.cyan, borderRadius: radius.lg,
    width: 44, height: 44, alignItems: "center", justifyContent: "center", alignSelf: "flex-end",
  },
  sendBtnText: { color: "#0A0A0F", fontSize: 18, fontFamily: fonts.bold },
  resolvedBar: {
    alignItems: "center", paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
    paddingBottom: Platform.OS === "ios" ? 30 : spacing.md,
  },

  // Empty
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xl },
  emptyText: { color: colors.dimmed, fontSize: 14, fontFamily: fonts.medium, marginBottom: spacing.md },
});
