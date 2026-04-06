// ── @fitos/shared — barrel export ────────────────────────────────────────────
// Single source of truth for cross-platform types, constants and pure utilities.

// Types
export type {
  SetType,
  SetEntryType,
  SetConfig,
  WeekConfig,
  ExerciseData,
  DayData,
  RoutineRaw,
  PreviousSet,
  PreviousLog,
  SetEntry,
  SavedSetData,
  SavedLogEntry,
  Phase,
  SummaryExerciseResult,
  SummaryData,
  InProgressSession,
  ScreenMode,
} from "./types/routine";

export type { Appointment } from "./types/appointments";

export type {
  HealthLog,
  HealthLogFormData,
  MuscleRegion,
} from "./types/health";

export type {
  Community,
  CommunityPost,
  CommunityComment,
  CommunityCommentLike,
  CommunityLike,
  CommunityTab,
} from "./types/community";

export type { Message } from "./types/messages";

export type {
  SupportTicket,
  TicketReply,
  TicketCategory,
  TicketStatus,
} from "./types/tickets";
export { TICKET_CATEGORIES, TICKET_STATUSES } from "./types/tickets";

export type {
  KnowledgeArticle,
  KnowledgeCategory,
} from "./types/knowledge";
export { KNOWLEDGE_CATEGORIES } from "./types/knowledge";

// Data
export { DAY_KEYS, DAY_LABELS, DAY_SHORT } from "./data/days";
export type { DayKey } from "./data/days";

// Anatomy
export type { MuscleZone } from "./anatomy/zones";
export {
  MUSCLE_ZONES,
  getZonesByView,
  ALL_ZONE_IDS,
  ZONE_LABELS,
  ANATOMY_VIEWBOX,
  ANATOMY_WIDTH,
  ANATOMY_HEIGHT,
} from "./anatomy/zones";

// Onboarding
export type { SectionGroup } from "./onboarding";
export { groupFieldsBySection, getEnabledSections } from "./onboarding";

// Routine logic
export type { StressIndexSet, SetsDataEntry, SessionTotals } from "./routine-logic";
export {
  calculateStressIndex,
  resolveSetEntryType,
  getSetTypeForIndex,
  createEmptySet,
  getTotalSetsCount,
  findPreviousSets,
  buildSetsData,
  buildRegistrationSetsData,
  computeAverageRpe,
  computeSessionTotals,
  computeTotalVolume,
} from "./routine-logic";

// Utils
export { formatTime } from "./utils/time";
