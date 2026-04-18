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

export type {
  Contract,
  ContractTemplate,
  ContractStatus,
} from "./types/contracts";
export { CONTRACT_STATUSES } from "./types/contracts";

export type {
  Lead,
  LeadSource,
  LeadStatus,
} from "./types/leads";
export { LEAD_SOURCES, LEAD_STATUSES } from "./types/leads";

export type {
  League,
  LeagueParticipant,
  LeagueMetric,
  LeagueStatus,
  Badge,
  UserBadge,
} from "./types/leagues";
export { LEAGUE_METRICS, LEAGUE_STATUSES, BADGE_ICONS } from "./types/leagues";

export type {
  DailyCheckin,
  DailyCheckinInput,
  TodayAlert,
  TodayAlertKind,
  TodayAlertClient,
  TodayPanel,
  NoWorkoutAlert,
  NoCheckinAlert,
  NewInjuryAlert,
  PendingTicketAlert,
  HighStressAlert,
  HighPainAlert,
} from "./types/daily-checkin";

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

// Resolvers (three-layer exercise/food + query cache) — cross-platform.
export {
  getResolvedExercises,
  resolveExercise,
  searchSimilarExercises,
  upsertExerciseOverride,
  getResolvedFoods,
  searchSimilarFoods,
  upsertFoodOverride,
  getCached,
  setCache,
  invalidateCache,
} from "./resolvers";
export type {
  ResolvedExercise,
  SimilarExerciseResult,
  ResolvedFood,
  SimilarFoodResult,
} from "./resolvers";
