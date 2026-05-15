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

/**
 * Authenticated principal — same shape whether resolved from a NextAuth
 * cookie (web) or from a Bearer JWT (native).
 *
 * `slug` is set for role === "restaurant"; absent for super-admin.
 */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "super-admin" | "restaurant";
  slug?: string;
};

/**
 * Shape returned by GET /api/orders for one row (with items populated).
 * The web route does `.populate({ path: "items.itemId", select: "name price description category" })`,
 * so `items[].itemId` is the populated Item object rather than just an ObjectId.
 *
 * Optional billing breakdown fields are present on orders created after the
 * server-side billing migration; older orders fall back to `total`.
 */
export type OrderListItem = {
  _id: string;
  tableSlug: string;
  items: Array<{
    itemId: {
      _id: string;
      name: string;
      price: number;
      description?: string;
      category?: string;
    };
    qty: number;
  }>;
  total: number;
  baseTotal?: number;
  gstAmount?: number;
  platformFee?: number;
  finalAmount?: number;
  status: OrderStatus;
  cancelledAt?: string;
  cancelledBy?: "customer" | "admin";
  cancellationReason?: string;
  customerPhone?: string | null;
  restaurantId: string;
  createdAt: string;
  updatedAt?: string;
};

/** GET /api/orders response payload. */
export type OrdersListResponse = {
  orders: OrderListItem[];
};

/** POST /api/auth/native request body. */
export type LoginRequest = {
  email: string;
  password: string;
};

/**
 * Payload of POST /api/auth/native on success. Combined with ApiSuccess
 * at the route, the wire shape is:
 *   { success: true, token: string, user: SessionUser }
 */
export type LoginResponse = {
  token: string;
  user: SessionUser;
};
