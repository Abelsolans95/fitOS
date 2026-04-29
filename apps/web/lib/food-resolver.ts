/**
 * Backwards-compat shim — canonical implementation lives in `@kuvox/shared/resolvers`.
 * Kept so existing `@/lib/food-resolver` imports (and tests) continue to work.
 */
export {
  getResolvedFoods,
  searchSimilarFoods,
  upsertFoodOverride,
} from "@kuvox/shared";
export type { ResolvedFood, SimilarFoodResult } from "@kuvox/shared";
