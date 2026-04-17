/**
 * Backwards-compat shim — canonical implementation lives in `@fitos/shared/resolvers`.
 * Kept so existing `@/lib/exercise-resolver` imports (and tests) continue to work.
 */
export {
  getResolvedExercises,
  resolveExercise,
  searchSimilarExercises,
  upsertExerciseOverride,
} from "@fitos/shared";
export type { ResolvedExercise, SimilarExerciseResult } from "@fitos/shared";
