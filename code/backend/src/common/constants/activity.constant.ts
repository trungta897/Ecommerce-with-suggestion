import { ActivityType } from '@prisma/client';

export const DEBOUNCE_TTL_SECONDS = 300; // 5 minutes
export const DEFAULT_ACTIVITY_LIMIT = 10;
export const RECOMMENDATIONS_LIMIT = 8;
export const HYBRID_CACHE_TTL_SECONDS = 3600; // 1 hour for ML hybrid recommendations
export const FALLBACK_CACHE_TTL_SECONDS = 120; // 2 minutes for DB popular fallback
export const ML_SERVICE_TIMEOUT_MS = 500;
export const ML_CANDIDATE_MULTIPLIER = 8;
export const ML_MAX_CANDIDATES = 50;
export const CURRENT_PRODUCT_SEED_WEIGHT = 6;
export const SAME_CATEGORY_MAX_RATIO = 0.625; // 62.5% (within 60%-65% cap)

export const ACTIVITY_ACTION_WEIGHTS: Record<ActivityType, number> = {
  [ActivityType.PURCHASE]: 5,
  [ActivityType.ADD_TO_CART]: 3,
  [ActivityType.WISHLIST_ADD]: 2,
  [ActivityType.SEARCH]: 2,
  [ActivityType.CLICK]: 1.5,
  [ActivityType.VIEW]: 1,
  [ActivityType.REMOVE_FROM_CART]: 0,
};
