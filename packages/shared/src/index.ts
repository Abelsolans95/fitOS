// ── @fitos/shared — barrel export ────────────────────────────────────────────
// Single source of truth for cross-platform types, constants and pure utilities.

// Types
export type {
  SetConfig,
  WeekConfig,
  ExerciseData,
  DayData,
  RoutineRaw,
  PreviousSet,
  PreviousLog,
  SetEntry,
  SavedLogEntry,
  Phase,
  SummaryExerciseResult,
  SummaryData,
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

// Data
export { DAY_KEYS, DAY_LABELS, DAY_SHORT } from "./data/days";
export type { DayKey } from "./data/days";

// Utils
export { formatTime } from "./utils/time";
