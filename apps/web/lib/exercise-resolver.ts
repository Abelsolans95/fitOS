/**
 * Backwards-compat shim — canonical implementation lives in `@kuvox/shared/resolvers`.
 * Kept so existing `@/lib/exercise-resolver` imports (and tests) continue to work.
 */
export {
  getResolvedExercises,
  resolveExercise,
  searchSimilarExercises,
  upsertExerciseOverride,
} from "@kuvox/shared";
export type { ResolvedExercise, SimilarExerciseResult } from "@kuvox/shared";
