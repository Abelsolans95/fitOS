import { Dimensions, StyleSheet } from "react-native";
import { colors, spacing, radius, shadows, fonts } from "../../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xxl,
    marginTop: spacing.sm,
  },
  greeting: { fontSize: 13, color: colors.muted, letterSpacing: 0.3 },
  name: {
    fontSize: 28,
    fontFamily: fonts.extraBold,
    color: colors.white,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  avatarContainer: { ...shadows.glow(colors.cyan) },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.5,
    color: colors.bg,
  },

  // Bento Grid
  bentoRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  bentoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.subtle,
  },
  bentoLarge: {
    flex: 3,
    alignItems: "center",
  },
  bentoSide: {
    flex: 2,
    gap: spacing.md,
  },
  bentoSmall: {
    flex: 1,
    justifyContent: "center",
  },
  bentoCardLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },

  // Calorie ring
  ringNumber: {
    fontSize: 26,
    fontFamily: fonts.extraBold,
    color: colors.white,
    letterSpacing: -1,
  },
  ringUnit: { fontSize: 10, color: colors.muted, marginTop: -2, letterSpacing: 1 },

  // Kcal meta
  kcalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  kcalMetaItem: { alignItems: "center" },
  kcalMetaValue: {
    fontSize: 16,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.5,
    color: colors.white,
  },
  kcalMetaLabel: { fontSize: 9, color: colors.dimmed, letterSpacing: 1, marginTop: 2 },
  kcalMetaDivider: { width: 1, height: 24, backgroundColor: colors.border },

  // Status cards
  statusIndicator: { width: 6, height: 6, borderRadius: 3, marginBottom: spacing.sm },
  bentoSmallLabel: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  bentoSmallValue: {
    fontSize: 18,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.5,
    color: colors.white,
  },
  bentoSmallUnit: { fontSize: 12, fontFamily: fonts.medium },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 2,
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },

  // Actions
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  actionCard: {
    width: (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2 - 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.white,
    lineHeight: 18,
  },

  // Health Connect card (not connected)
  healthConnectCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  healthConnectGradient: {
    padding: spacing.lg,
  },
  healthConnectContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  healthIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  healthConnectTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  healthConnectSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },

  // Health data card (connected)
  healthCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    ...shadows.subtle,
  },
  healthCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  healthCardTitle: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 2,
  },
  healthNoData: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  healthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  healthMetric: {
    width: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  healthMetricDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  healthMetricLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: fonts.medium,
  },
  healthMetricValue: {
    fontSize: 16,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.5,
  },
  healthMetricUnit: {
    fontSize: 10,
    color: colors.dimmed,
    fontFamily: fonts.medium,
    marginLeft: -2,
  },
});
