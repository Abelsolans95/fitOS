import { StyleSheet } from "react-native";
import { colors, spacing, radius, shadows, fonts } from "../../theme";

export const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 120 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 40 },

  // Empty
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.muted, textAlign: "center", maxWidth: 260 },

  // Header
  pageLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.xs },
  title: { fontSize: 26, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xl },
  goalBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    backgroundColor: colors.cyanDim, borderWidth: 1, borderColor: colors.cyanGlow,
  },
  goalText: { fontSize: 10, fontFamily: fonts.bold, color: colors.cyan, letterSpacing: 1.5 },
  durationText: { fontSize: 12, color: colors.dimmed },

  // Week selector
  weekScroll: { marginBottom: spacing.lg },
  weekScrollContent: { gap: spacing.sm },
  weekPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  weekPillActive: { backgroundColor: colors.cyan },
  weekPillText: { fontSize: 12, fontFamily: fonts.medium, color: colors.muted },
  weekPillTextActive: { color: colors.bg },

  // Day selector
  dayRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  dayPill: {
    width: 40, height: 48, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  dayPillActive: { backgroundColor: colors.cyanDim, borderColor: colors.cyanGlow },
  dayPillEmpty: { opacity: 0.4 },
  dayPillText: { fontSize: 13, fontFamily: fonts.bold, color: colors.muted },
  dayPillTextActive: { color: colors.cyan },
  dayDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.dimmed, marginTop: 4 },
  dayDotActive: { backgroundColor: colors.cyan },

  // Day label row
  dayLabelRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: spacing.lg, paddingHorizontal: spacing.xs,
  },
  dayLabelText: { fontSize: 15, fontFamily: fonts.bold, color: colors.white },
  dayLabelMeta: { fontSize: 11, color: colors.dimmed },

  // Rest day
  restDayCard: {
    alignItems: "center", paddingVertical: 60, backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
  },
  restTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.muted },
  restSubtitle: { fontSize: 13, color: colors.dimmed, marginTop: 6 },

  // Exercise cards (overview)
  exerciseCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, ...shadows.subtle,
  },
  exerciseTop: { flexDirection: "row", gap: spacing.md },
  exerciseIndex: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: colors.cyanDim,
    alignItems: "center", justifyContent: "center",
  },
  exerciseIndexText: { fontSize: 13, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.cyan },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontFamily: fonts.bold, color: colors.white, marginBottom: 6 },
  exerciseMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaChip: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceHover,
  },
  metaChipText: { fontSize: 11, fontFamily: fonts.medium, color: colors.muted },
  anteriorInline: { fontSize: 11, color: colors.dimmed, marginTop: 6 },
  progressionInline: { fontSize: 10, color: colors.orange, marginTop: 4 },
  notesInline: { fontSize: 10, color: colors.violet, marginTop: 2 },
  videoLink: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  videoLinkText: { fontSize: 10, fontFamily: fonts.medium, color: colors.cyan },

  // Action buttons
  actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  secondaryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  secondaryBtnText: { fontSize: 14, fontFamily: fonts.medium, color: colors.white },
  primaryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.cyan,
  },
  primaryBtnGlow: {
    flex: 1, borderRadius: radius.lg, ...shadows.glow(colors.cyan),
  },
  primaryBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: radius.lg,
  },
  primaryBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.bg },

  // Rest timer
  timerContainer: {
    flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.xl,
  },
  timerLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 3, marginBottom: spacing.xxl },
  timerRing: { alignItems: "center", justifyContent: "center", width: 240, height: 240 },
  timerCenter: { position: "absolute", alignItems: "center" },
  timerValue: { fontSize: 52, fontFamily: fonts.extraBold, letterSpacing: -1, color: colors.white },
  timerExName: { fontSize: 12, color: colors.dimmed, marginTop: 4 },
  skipBtn: {
    marginTop: spacing.xxl, paddingHorizontal: 32, paddingVertical: 12, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  skipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.muted },
  nextPreview: { alignItems: "center", marginTop: spacing.xxl },
  nextLabel: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2 },
  nextName: { fontSize: 13, color: colors.muted, marginTop: 4 },

  // RPE
  rpeContainer: {
    flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.xl,
  },
  rpeLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 3 },
  rpeQuestion: { fontSize: 24, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, marginTop: spacing.md, marginBottom: spacing.xxl },
  rpeValue: { fontSize: 72, fontFamily: fonts.extraBold, letterSpacing: -0.5, marginBottom: spacing.xxl },
  rpeSliderRow: { flexDirection: "row", gap: 6 },
  rpeDot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1.5,
    borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  rpeDotText: { fontSize: 12, fontFamily: fonts.bold, color: colors.dimmed },
  rpeHints: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: spacing.xs, marginTop: spacing.sm },
  rpeHintText: { fontSize: 9, color: colors.dimmed },

  // Active training
  activeTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)",
  },
  activeCounter: { fontSize: 14, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.cyan },
  elapsedBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  elapsedText: { fontSize: 12, fontFamily: fonts.medium, color: colors.dimmed },
  progressBar: { height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.04)", marginBottom: spacing.xl, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  activeExCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md,
  },
  activeExLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2 },
  activeExName: { fontSize: 22, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, marginTop: 4 },
  activeExMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: spacing.sm },
  schemeBadge: { backgroundColor: colors.cyanDim, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  schemeText: { fontSize: 11, fontFamily: fonts.bold, color: colors.cyan },
  metaTag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5,
    borderWidth: 1, borderColor: colors.border,
  },
  metaTagText: { fontSize: 11, fontFamily: fonts.medium, color: colors.muted },
  progressionRow: {
    marginTop: spacing.sm, backgroundColor: colors.orangeDim,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  progressionText: { fontSize: 10, color: colors.orange },
  notesRow: {
    marginTop: spacing.xs, backgroundColor: colors.violetDim,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  notesText: { fontSize: 10, color: colors.violet },

  // ANTERIOR
  anteriorRow: {
    backgroundColor: "rgba(255,255,255,0.01)", borderRadius: radius.sm, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginBottom: spacing.md,
  },
  anteriorLabel: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginBottom: 4 },
  anteriorValues: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  anteriorChip: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  anteriorValue: { fontSize: 12, fontFamily: fonts.medium, color: colors.dimmed },

  // Set inputs
  setHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm, paddingHorizontal: 2 },
  setHeaderText: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 1.5, textAlign: "center" },
  setRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, paddingHorizontal: 2,
    paddingVertical: 2, borderRadius: radius.sm,
  },
  setRowDone: { opacity: 0.4 },
  setRowCurrent: { backgroundColor: "rgba(0,229,255,0.03)" },
  setNum: {
    width: 40, height: 44, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center", justifyContent: "center",
  },
  setNumText: { fontSize: 13, fontFamily: fonts.bold, color: colors.muted },
  setInput: {
    flex: 1, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: colors.bg, color: colors.white, fontSize: 16, fontFamily: fonts.medium,
    textAlign: "center", paddingHorizontal: 8,
  },
  setInputActive: { borderColor: "rgba(0,229,255,0.3)" },
  checkBtn: {
    width: 44, height: 44, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center", justifyContent: "center",
  },
  checkBtnDone: { backgroundColor: colors.greenDim },
  checkBtnActive: { backgroundColor: colors.cyan },

  // Registration mode
  regTitleWrap: { alignItems: "center" },
  regTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.white },
  regSubtitle: { fontSize: 11, color: colors.dimmed, marginTop: 2 },
  regExCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md,
  },
  regExHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  regExIdx: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: colors.cyanDim,
    alignItems: "center", justifyContent: "center",
  },
  regExIdxText: { fontSize: 10, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.cyan },
  regExName: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },
  regExMetaRow: { flexDirection: "row", gap: spacing.sm, marginTop: 2 },
  regExScheme: { fontSize: 10, fontFamily: fonts.bold, color: colors.dimmed },
  regExMeta: { fontSize: 10, color: colors.dimmed },
  regRefRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  regAnterior: { fontSize: 10, fontFamily: fonts.medium, color: colors.dimmed },
  progressBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  progressBadgeText: { fontSize: 9, fontFamily: fonts.bold },
  regSetHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  regSetHeaderText: { fontSize: 8, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 1, textAlign: "center" },
  regSetRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  regSetNum: {
    width: 32, height: 36, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center", justifyContent: "center",
  },
  regSetNumText: { fontSize: 11, fontFamily: fonts.bold, color: colors.dimmed },
  regInput: {
    flex: 1, height: 36, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: colors.bg, color: colors.white, fontSize: 14, fontFamily: fonts.medium,
    textAlign: "center", paddingHorizontal: 6,
  },
  clientNotesInput: {
    height: 32, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "transparent", color: colors.muted, fontSize: 11,
    paddingHorizontal: spacing.sm, marginTop: spacing.sm,
  },
  regRpeCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, marginTop: spacing.md,
  },
  regRpeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  regRpeValue: { fontSize: 28, fontFamily: fonts.extraBold, letterSpacing: -0.5 },

  // Summary
  summaryHeader: { alignItems: "center", marginBottom: spacing.xxl },
  summaryBadgeWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryBadge: { fontSize: 10, fontFamily: fonts.bold, color: colors.green, letterSpacing: 2 },
  summaryTitle: { fontSize: 28, fontFamily: fonts.extraBold, letterSpacing: -0.5, color: colors.white, textAlign: "center", marginTop: spacing.sm },
  summaryDay: { fontSize: 12, color: colors.dimmed, marginTop: spacing.xs },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xxl },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, alignItems: "center",
  },
  statValue: { fontSize: 22, fontFamily: fonts.extraBold, letterSpacing: -0.5 },
  statLabel: { fontSize: 8, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 1.5, marginTop: 4 },
  sectionLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.dimmed, letterSpacing: 2, marginBottom: spacing.sm },
  resultRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: 4,
  },
  resultLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  resultIdx: { width: 22, height: 22, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  resultIdxText: { fontSize: 9, fontFamily: fonts.bold, color: colors.dimmed },
  resultName: { fontSize: 13, fontFamily: fonts.medium, color: colors.white, flex: 1 },
  resultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  resultProgress: { fontSize: 9, fontFamily: fonts.bold },

  // Rest notes input
  restNotesInput: {
    width: "100%", minHeight: 44, borderRadius: radius.lg, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)", backgroundColor: colors.surface,
    color: colors.muted, fontSize: 13, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, marginTop: spacing.xl, textAlignVertical: "top",
  },

  // Saved badge
  savedBadge: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: spacing.sm, marginTop: spacing.sm,
  },
  savedBadgeText: { fontSize: 12, fontFamily: fonts.medium, color: colors.green },

  // Navigation row
  navRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    gap: spacing.md, marginTop: spacing.lg,
  },
  navBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontFamily: fonts.medium, color: colors.white },
  nextBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.cyan,
  },
  nextBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.bg },
  finishBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.green,
  },
  finishBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.bg },

  // Resume button
  resumeBtn: {
    borderRadius: radius.lg, marginBottom: spacing.md,
    ...shadows.glow(colors.orange),
  },
  resumeBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: radius.lg,
  },
  resumeBtnText: { fontSize: 15, fontFamily: fonts.bold, color: colors.bg },

  // Completed today badge
  isSessionCompletedBadge: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: radius.lg, marginTop: spacing.lg,
    backgroundColor: "rgba(0,200,83,0.1)", borderWidth: 1, borderColor: "rgba(0,200,83,0.2)",
  },
  isSessionCompletedText: { fontSize: 14, fontFamily: fonts.medium, color: colors.green },
});
