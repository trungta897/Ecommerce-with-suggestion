export const SESSION_COOKIE_NAME = 'datn_session_id';
export const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export const ACTIVITY_ACTIONS = {
  VIEW: 'VIEW',
  CLICK: 'CLICK',
  SEARCH: 'SEARCH',
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  WISHLIST_ADD: 'WISHLIST_ADD',
  PURCHASE: 'PURCHASE',
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];
