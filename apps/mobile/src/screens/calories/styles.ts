import { StyleSheet } from "react-native";
import { colors, spacing, radius, shadows, fonts } from "../../theme";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 100 },

  // Hero
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderActive,
    padding: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.xxl,
    overflow: "hidden",
    ...shadows.card,
  },
  heroLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroKcal: {
    fontSize: 56,
    fontFamily: fonts.extraBold,
    color: colors.cyan,
    letterSpacing: -3,
  },
  heroUnit: {
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 2,
    marginBottom: spacing.xl,
  },

  // Macros
  macroGrid: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },
  macroCell: { alignItems: "center", gap: 6 },
  macroBar: { width: 3, height: 16, borderRadius: 2 },
  macroValue: { fontSize: 16, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  macroLabel: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 1.5,
  },

  // Mode tabs
  modeTabContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.xxl,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  modeTabActive: {
    backgroundColor: colors.surfaceHover,
  },
  modeTabText: { fontSize: 12, fontFamily: fonts.medium, color: colors.muted },
  modeTabTextActive: { color: colors.white, fontFamily: fonts.bold },

  // Section
  sectionLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },

  // Pills
  pillScroll: { marginBottom: spacing.xl },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.cyanDim,
    borderColor: colors.cyanGlow,
  },
  pillText: { fontSize: 13, color: colors.muted, fontFamily: fonts.medium },
  pillTextActive: { color: colors.cyan, fontFamily: fonts.bold },

  // Capture
  captureRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xxl },
  captureMain: {
    flex: 2,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.glow(colors.cyan),
  },
  captureGradient: {
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  captureMainText: {
    fontSize: 15,
    fontFamily: fonts.extraBold,
    color: colors.bg,
  },
  captureSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 18,
  },
  captureSecondaryText: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.section,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyText: { fontSize: 14, fontFamily: fonts.medium, color: colors.muted },
  emptySubtext: { fontSize: 12, color: colors.dimmed, marginTop: 4 },

  // Log entries
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  logTimeBox: {
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logTime: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 0.5,
  },
  logMealType: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },
  logMacroRow: { flexDirection: "row", gap: 8, marginTop: 3 },
  logMacro: { fontSize: 11, fontFamily: fonts.medium },
  logRight: { alignItems: "flex-end" },
  logKcal: {
    fontSize: 20,
    fontFamily: fonts.extraBold,
    color: colors.white,
  },
  logKcalUnit: { fontSize: 10, color: colors.dimmed, letterSpacing: 1 },
  aiBadge: {
    backgroundColor: colors.violetDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  aiBadgeText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.violet,
    letterSpacing: 1,
  },
});
