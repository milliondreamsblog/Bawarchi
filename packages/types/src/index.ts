/**
 * Universal API envelope used by every /api/* route handler.
 *
 *   Success: { success: true, ...payload }
 *   Failure: { success: false, error: string }
 *
 * Clients should narrow on `success` before reading other fields.
 */
export type ApiSuccess<T = Record<string, unknown>> = { success: true } & T;
export type ApiFailure = { success: false; error: string };
export type ApiResponse<T = Record<string, unknown>> = ApiSuccess<T> | ApiFailure;

/**
 * Order lifecycle states — mirrors the enum in apps/web/lib/models/Order.js.
 * If you change this list, change it in both places (or move the enum here
 * and import it from the Mongoose schema).
 */
export type OrderStatus =
  | "pending"
  | "preparing"
  | "served"
  | "cancelled"
  | "refunded";
