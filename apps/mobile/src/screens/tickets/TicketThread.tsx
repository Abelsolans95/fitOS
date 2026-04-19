import React, { useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { TICKET_CATEGORIES } from "@kuvox/shared";
import { colors, spacing, radius, fonts } from "../../theme";
import { CATEGORY_COLORS, STATUS_COLORS, STATUS_LABELS, timeAgo } from "./types";
import type { SupportTicket, TicketReply } from "./types";

interface TicketThreadProps {
  ticket: SupportTicket;
  replies: TicketReply[];
  loadingReplies: boolean;
  clientId: string;
  replyContent: string;
  sending: boolean;
  onReplyContentChange: (text: string) => void;
  onSendReply: () => void;
  onBack: () => void;
}

export default function TicketThread({
  ticket,
  replies,
  loadingReplies,
  clientId,
  replyContent,
  sending,
  onReplyContentChange,
  onSendReply,
  onBack,
}: TicketThreadProps) {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.title} numberOfLines={1}>{ticket.subject}</Text>
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: `${CATEGORY_COLORS[ticket.category]}20` }]}>
              <Text style={[s.badgeText, { color: CATEGORY_COLORS[ticket.category] }]}>
                {TICKET_CATEGORIES.find((c) => c.value === ticket.category)?.label}
              </Text>
            </View>
            <View style={[s.badge, { backgroundColor: `${STATUS_COLORS[ticket.status]}20` }]}>
              <Text style={[s.badgeText, { color: STATUS_COLORS[ticket.status] }]}>
                {STATUS_LABELS[ticket.status]}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={s.content}
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {/* Original message */}
        <View style={s.messageCard}>
          <View style={s.senderRow}>
            <View style={s.avatarCyan}><Text style={s.avatarText}>T</Text></View>
            <Text style={[s.senderName, { color: colors.cyan }]}>Tú</Text>
            <Text style={s.timeText}>{timeAgo(ticket.created_at)}</Text>
          </View>
          <Text style={s.messageText}>{ticket.description}</Text>
        </View>

        {/* Replies */}
        {loadingReplies ? (
          <ActivityIndicator size="small" color={colors.cyan} style={{ marginTop: 20 }} />
        ) : (
          replies.map((reply) => {
            const isClient = reply.sender_id === clientId;
            return (
              <View
                key={reply.id}
                style={[s.replyBubble, isClient ? s.replyClient : s.replyTrainer]}
              >
                <View style={s.senderRow}>
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

      {/* Reply input or resolved bar */}
      {ticket.status !== "resolved" ? (
        <View style={s.inputBar}>
          <TextInput
            style={s.replyInput}
            value={replyContent}
            onChangeText={onReplyContentChange}
            placeholder="Escribe tu respuesta..."
            placeholderTextColor={colors.dimmed}
            multiline
          />
          <TouchableOpacity
            style={[s.sendBtn, !replyContent.trim() && { opacity: 0.4 }]}
            onPress={onSendReply}
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
          <Text style={s.resolvedText}>Esta consulta ha sido resuelta</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backBtn: { marginRight: 12 },
  backText: { color: colors.cyan, fontSize: 14, fontFamily: fonts.semibold },
  headerContent: { flex: 1 },
  title: { color: "#fff", fontSize: 20, fontFamily: fonts.extrabold, letterSpacing: -0.5 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  content: { flex: 1, padding: spacing.md },

  // Badges
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontFamily: fonts.bold },
  timeText: { color: colors.dimmed, fontSize: 10, fontFamily: fonts.regular },

  // Original message
  messageCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", padding: spacing.md, marginBottom: spacing.sm,
  },
  senderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarCyan: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: `${colors.cyan}30`, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.cyan, fontSize: 12, fontFamily: fonts.bold },
  senderName: { fontSize: 12, fontFamily: fonts.bold },
  messageText: { color: colors.muted, fontSize: 14, fontFamily: fonts.regular, marginTop: 8, lineHeight: 20 },

  // Reply bubbles
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
  resolvedText: { color: colors.success, fontSize: 14, fontFamily: fonts.semibold },
});
