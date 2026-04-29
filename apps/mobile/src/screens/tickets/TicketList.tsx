import React, { memo, useCallback } from "react";
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, Platform,
} from "react-native";
import { TICKET_CATEGORIES } from "@kuvox/shared";
import { colors, spacing, radius, fonts } from "../../theme";
import { CATEGORY_COLORS, STATUS_COLORS, STATUS_LABELS, timeAgo } from "./types";
import type { SupportTicket } from "./types";

interface TicketListProps {
  tickets: SupportTicket[];
  onOpenTicket: (ticketId: string) => void;
  onCreateNew: () => void;
}

const ticketKeyExtractor = (item: SupportTicket) => item.id;

const TicketItem = memo(function TicketItem({
  item,
  onPress,
}: {
  item: SupportTicket;
  onPress: (id: string) => void;
}) {
  const handlePress = useCallback(() => onPress(item.id), [onPress, item.id]);

  return (
    <TouchableOpacity style={s.ticketCard} onPress={handlePress}>
      <View style={s.ticketRow}>
        <View style={s.ticketLeft}>
          <View style={s.ticketHeader}>
            <Text style={s.ticketSubject} numberOfLines={1}>{item.subject}</Text>
            {(item.unread_count ?? 0) > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadText}>{item.unread_count}</Text>
              </View>
            )}
          </View>
          <Text style={s.ticketDesc} numberOfLines={2}>{item.description}</Text>
        </View>
        <View style={s.ticketRight}>
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
  );
});

export default function TicketList({ tickets, onOpenTicket, onCreateNew }: TicketListProps) {
  const renderItem = useCallback(
    ({ item }: { item: SupportTicket }) => (
      <TicketItem item={item} onPress={onOpenTicket} />
    ),
    [onOpenTicket],
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.title}>Consultas</Text>
          <Text style={s.subtitle}>Consulta dudas con tu entrenador</Text>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={onCreateNew}>
          <Text style={s.newBtnText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {tickets.length === 0 ? (
        <View style={s.emptyContainer}>
          <Text style={s.emptyText}>Aún no tienes consultas</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={onCreateNew}>
            <Text style={s.primaryBtnText}>Crear primera consulta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={ticketKeyExtractor}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={renderItem}
          maxToRenderPerBatch={15}
          windowSize={10}
          removeClippedSubviews={Platform.OS === "android"}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.10)",
  },
  headerLeft: { flex: 1 },
  title: { color: "#fff", fontSize: 20, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  subtitle: { color: colors.dimmed, fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  newBtn: {
    backgroundColor: colors.cyan, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  newBtnText: { color: "#0A0A0F", fontSize: 12, fontFamily: fonts.bold },
  ticketCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)", padding: spacing.md, marginBottom: spacing.sm,
  },
  ticketRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  ticketLeft: { flex: 1, marginRight: 12 },
  ticketHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  ticketSubject: { color: "#fff", fontSize: 14, fontFamily: fonts.bold, flex: 1 },
  ticketDesc: { color: colors.muted, fontSize: 12, fontFamily: fonts.regular, marginTop: 4 },
  unreadBadge: {
    backgroundColor: colors.violet, borderRadius: 10, minWidth: 20,
    height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  unreadText: { color: "#fff", fontSize: 10, fontFamily: fonts.bold },
  ticketRight: { alignItems: "flex-end", gap: 4 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontFamily: fonts.bold },
  timeText: { color: colors.dimmed, fontSize: 10, fontFamily: fonts.regular },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xl },
  emptyText: { color: colors.dimmed, fontSize: 14, fontFamily: fonts.medium, marginBottom: spacing.md },
  primaryBtn: {
    backgroundColor: colors.cyan, borderRadius: radius.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: "center",
  },
  primaryBtnText: { color: "#0A0A0F", fontSize: 14, fontFamily: fonts.bold },
});
