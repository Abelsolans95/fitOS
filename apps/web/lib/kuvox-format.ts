/**
 * .kuvox file generation utility.
 *
 * Generates a JSON blob following the .kuvox format spec (KUVOX_VISION.md section 10).
 * The .kuvox file is a JSON file with extension `.kuvox` containing
 * a complete routine structure importable into the Kuvox app.
 */

export interface KuvoxExercise {
  day_of_week: number;
  day_label: string;
  name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rir: number;
  rest_seconds: number;
  sets_config: unknown[];
  weekly_config: Record<string, unknown>;
}

export interface KuvoxMetadata {
  title: string;
  author: string;
  author_id: string;
  goal: string | null;
  total_weeks: number;
  training_days: string[];
}

export interface KuvoxFile {
  kuvox_version: "1.0";
  type: "routine";
  license: string;
  buyer_id: string | null;
  metadata: KuvoxMetadata;
  exercises: KuvoxExercise[];
}

/**
 * Generate a license key in KVX-xxxx-xxxx-xxxx format.
 */
export function generateLicenseKey(): string {
  const hex = () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, "0");
  return `KVX-${hex()}-${hex()}-${hex()}`;
}

interface RoutineExerciseInput {
  name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rir: number;
  rest_s: number;
  sets_config?: unknown[];
  weekly_config?: Record<string, unknown>;
  order: number;
}

interface RoutineDataInput {
  exercises: Record<string, RoutineExerciseInput[]> | RoutineExerciseInput[];
  training_days?: string[];
  total_weeks?: number;
  day_labels?: Record<string, string>;
}

interface TrainerInfo {
  full_name: string;
  trainer_id: string;
}

/**
 * Generate a .kuvox file JSON blob from routine data.
 *
 * @param routineTitle - The title of the routine
 * @param routineData - The routine JSONB data from user_routines.exercises
 * @param trainer - Trainer info (name + id)
 * @param goal - The routine goal (hipertrofia, fuerza, etc.)
 * @param totalWeeks - Total mesocycle weeks
 * @param trainingDays - Array of training day keys
 * @param license - Optional license key (auto-generated if not provided)
 * @param buyerId - Optional buyer UUID
 */
export function generateKuvoxFile(
  routineTitle: string,
  routineData: RoutineDataInput,
  trainer: TrainerInfo,
  goal: string | null,
  totalWeeks: number,
  trainingDays: string[],
  license?: string,
  buyerId?: string | null
): KuvoxFile {
  const exercises: KuvoxExercise[] = [];

  // routineData can be either a flat array or keyed by day
  if (Array.isArray(routineData.exercises ?? routineData)) {
    const flat = (routineData.exercises ?? routineData) as (RoutineExerciseInput & {
      day_of_week?: number | string;
      day_label?: string;
    })[];
    for (const ex of flat) {
      exercises.push({
        day_of_week: typeof ex.day_of_week === "number" ? ex.day_of_week : 0,
        day_label: ex.day_label ?? "",
        name: ex.name,
        sets: ex.sets,
        reps_min: ex.reps_min,
        reps_max: ex.reps_max,
        rir: ex.rir,
        rest_seconds: ex.rest_s,
        sets_config: ex.sets_config ?? [],
        weekly_config: ex.weekly_config ?? {},
      });
    }
  } else if (typeof routineData.exercises === "object") {
    // Keyed by day key (e.g. "lunes", "martes")
    const dayKeys = Object.keys(routineData.exercises);
    for (let dayIdx = 0; dayIdx < dayKeys.length; dayIdx++) {
      const dayKey = dayKeys[dayIdx];
      const dayExercises = (routineData.exercises as Record<string, RoutineExerciseInput[]>)[dayKey] ?? [];
      const dayLabel = routineData.day_labels?.[dayKey] ?? dayKey;
      for (const ex of dayExercises) {
        exercises.push({
          day_of_week: dayIdx,
          day_label: dayLabel,
          name: ex.name,
          sets: ex.sets,
          reps_min: ex.reps_min,
          reps_max: ex.reps_max,
          rir: ex.rir,
          rest_seconds: ex.rest_s,
          sets_config: ex.sets_config ?? [],
          weekly_config: ex.weekly_config ?? {},
        });
      }
    }
  }

  return {
    kuvox_version: "1.0",
    type: "routine",
    license: license ?? generateLicenseKey(),
    buyer_id: buyerId ?? null,
    metadata: {
      title: routineTitle,
      author: trainer.full_name,
      author_id: trainer.trainer_id,
      goal,
      total_weeks: totalWeeks,
      training_days: trainingDays,
    },
    exercises,
  };
}
