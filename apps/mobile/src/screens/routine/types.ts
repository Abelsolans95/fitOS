// ── Re-export shared types ──────────────────────────────────────────────────
// MobileSetConfig and MobileWeekConfig were identical to shared — use shared directly.
export type {
  SetType,
  SetEntryType,
  SetConfig,
  SetConfig as MobileSetConfig,
  WeekConfig,
  WeekConfig as MobileWeekConfig,
  ExerciseData,
  DayData,
  RoutineRaw,
  PreviousSet,
  PreviousLog,
  SavedLogEntry,
  InProgressSession,
  ScreenMode,
} from "@fitos/shared";

// Mobile's SetEntry always has `type` set (required, not optional like shared).
// Re-define with required type so mobile code can access .type without checks.
import type { SetEntry as SharedSetEntry, SetEntryType } from "@fitos/shared";

export interface SetEntry extends Omit<SharedSetEntry, "type"> {
  type: SetEntryType;
}
