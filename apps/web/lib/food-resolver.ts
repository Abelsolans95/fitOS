/**
 * Backwards-compat shim — canonical implementation lives in `@fitos/shared/resolvers`.
 * Kept so existing `@/lib/food-resolver` imports (and tests) continue to work.
 */
export {
  getResolvedFoods,
  searchSimilarFoods,
  upsertFoodOverride,
} from "@fitos/shared";
export type { ResolvedFood, SimilarFoodResult } from "@fitos/shared";
