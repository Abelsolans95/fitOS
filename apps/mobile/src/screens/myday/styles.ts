import { StyleSheet } from "react-native";
import { colors, spacing, radius, shadows, fonts } from "../../theme";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 140 },

  // Header
  header: {
    marginBottom: spacing.xxl,
    marginTop: spacing.sm,
  },
  greeting: {
    fontSize: 13,
    color: colors.muted,
    letterSpacing: 0.3,
    fontFamily: fonts.medium,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.extraBold,
    color: colors.white,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.dimmed,
    marginTop: 4,
  },

  // Section
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.dimmed,
    letterSpacing: 2,
  },
  sectionStatus: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.green,
  },

  // Workout toggle
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  workoutToggle: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: 3,
    gap: 2,
    flex: 1,
  },
  workoutPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: "center",
  },
  workoutPillActive: {
    backgroundColor: colors.cyanDim,
  },
  workoutPillText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  workoutPillTextActive: {
    color: colors.cyan,
  },

  // Weight
  weightInput: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Wellness sliders
  sliderRow: {
    marginBottom: spacing.md,
  },
  sliderLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sliderLabelText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  sliderValue: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.cyan,
  },
  sliderButtons: {
    flexDirection: "row",
    gap: 6,
  },
  sliderBtn: {
    flex: 1,
    aspectRatio: 2.5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  sliderBtnActive: {
    borderColor: colors.cyanGlow,
    backgroundColor: colors.cyanDim,
  },
  sliderBtnText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  sliderBtnTextActive: {
    color: colors.cyan,
  },

  // Notes
  notesInput: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.white,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
    textAlignVertical: "top",
  },

  // Save CTA
  saveBtnWrap: {
    borderRadius: radius.lg,
    overflow: "hidden",
    marginTop: spacing.xl,
    ...shadows.glow(colors.cyan),
  },
  saveBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: fonts.extraBold,
    color: colors.bg,
  },

  // Link to meals
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  linkLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  linkHint: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.cyan,
  },
});
