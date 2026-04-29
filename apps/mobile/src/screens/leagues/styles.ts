import { StyleSheet } from "react-native";
import { colors, spacing, radius, fonts, shadows } from "../../theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.extraBold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "rgba(0,229,255,0.1)",
  },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.dimmed,
  },
  tabTextActive: {
    color: colors.cyan,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  metaText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.muted,
  },
  prize: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: "#FF9100",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.cyan,
  },
  joinBtn: {
    borderColor: "rgba(124,58,237,0.2)",
    backgroundColor: "rgba(124,58,237,0.1)",
  },
  joinBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.violet,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  leaderboard: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
    paddingTop: 12,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  leaderName: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.white,
  },
  leaderScore: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.cyan,
  },
  emptyLeaderboard: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    paddingVertical: 16,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 260,
  },
  emptyCardText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    textAlign: "center",
  },
  // Badges
  badgesGrid: {
    gap: 12,
  },
  badgesHeader: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeCard: {
    width: "47%",
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
  },
  badgeEarned: {
    borderColor: "rgba(0,229,255,0.2)",
    backgroundColor: "rgba(0,229,255,0.05)",
  },
  badgeLocked: {
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.02)",
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.dimmed,
    textAlign: "center",
    marginTop: 4,
  },
});

export const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}
