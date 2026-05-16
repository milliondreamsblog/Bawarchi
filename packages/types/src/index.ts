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
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  restaurantId: string;
  createdAt: string;
  updatedAt?: string;
};

/** GET /api/orders response payload. */
export type OrdersListResponse = {
  orders: OrderListItem[];
};

export type FeedbackSentimentLabel = "positive" | "neutral" | "negative";

/**
 * One review row as returned by GET /api/feedback (admin view).
 * `sentiment` is populated by the OpenAI sentiment step in the POST handler;
 * absent when the customer left no text or when the LLM was unavailable.
 */
export type FeedbackItem = {
  _id: string;
  restaurantId: string;
  orderId?: string;
  tableSlug: string;
  rating: number;
  text: string;
  sentiment?: {
    score: number;
    label: FeedbackSentimentLabel;
    tags: string[];
    summary: string;
  };
  createdAt: string;
};

export type FeedbackSummary = {
  total: number;
  avgRating: number;
  ratingDist: { star: number; count: number }[];
  sentimentCounts: { positive: number; neutral: number; negative: number };
  positivePercent: number;
};

/** GET /api/feedback?restaurantId=... response payload. */
export type FeedbackListResponse = {
  reviews: FeedbackItem[];
  summary: FeedbackSummary;
};

/**
 * One table row as returned by GET /api/tables?restaurantId=...
 * `qrUrl` is a Cloudinary-hosted QR PNG generated server-side at create time.
 */
export type TableItem = {
  _id: string;
  tableNumber: number;
  slug: string;
  restaurantId: string;
  qrUrl?: string;
  status: "free" | "occupied";
  occupiedAt?: string | null;
  currentOrderId?: string | null;
};

export type TablesListResponse = { tables: TableItem[] };

export type CreateTableRequest = {
  tableNumber: number;
  slug: string;
  restaurantId: string;
};

export type CreateTableResponse = { table: TableItem };

/**
 * One inventory row as returned by GET /api/inventory?restaurantId=...
 * The endpoint also exists at /api/items but with a smaller projection.
 */
export type InventoryItem = {
  _id: string;
  name: string;
  category?: string;
  stock: number;
  lowStockThreshold?: number;
  available: boolean;
  image?: string;
  price: number;
};

export type InventoryListResponse = { items: InventoryItem[] };

/**
 * PATCH /api/inventory bulk-update payload. `stock` setting auto-derives
 * `available` server-side (stock === 0 -> available = false).
 */
export type InventoryUpdateRequest = {
  updates: Array<{
    itemId: string;
    stock?: number;
    lowStockThreshold?: number;
  }>;
};

export type SpiceLevel = "mild" | "medium" | "hot" | "extra-hot";

/**
 * Full menu item record as stored in the items collection. Mirrors the
 * Mongoose schema at apps/web/lib/models/Item.js — image is non-nullable
 * at the schema level (every item must have a Cloudinary URL).
 */
export type ItemRecord = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  category: string;
  image: string;
  calories?: number;
  restaurantId: string;
  isVeg: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: SpiceLevel;
  stock?: number;
  lowStockThreshold?: number;
};

export type ItemsListResponse = { items: ItemRecord[] };

export type ItemFormPayload = {
  name: string;
  description?: string;
  price: number;
  category?: string;
  calories?: number;
  image: string;
  isVeg?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spiceLevel?: SpiceLevel;
  available?: boolean;
};

export type CreateItemRequest = ItemFormPayload & { restaurantId: string };
export type CreateItemResponse = { item: ItemRecord };

export type UpdateItemRequest = Partial<ItemFormPayload> & {
  restaurantId?: string;
};
export type UpdateItemResponse = { item: ItemRecord; message?: string };

/** POST /api/upload-image response shape. */
export type ImageUploadResponse = { imageUrl: string };

/**
 * One menu item as nested inside a Menu section, when the route has
 * populated the items array. Lightweight subset of ItemRecord — fields
 * the customer landing page actually renders.
 */
export type MenuItemRef = {
  _id: string;
  name: string;
  price: number;
  image?: string;
  isVeg?: boolean;
  category?: string;
  description?: string;
  available?: boolean;
};

export type MenuSection = {
  name: string;
  items: MenuItemRef[];
};

export type MenuStructure = {
  _id?: string;
  title?: string;
  sections: MenuSection[];
  restaurantId: string;
};

/** GET /api/menu?restaurantId=... response payload. */
export type MenuGetResponse = { menu: MenuStructure };

/**
 * One menu item as extracted by POST /api/menu/ingest from a photo.
 * Not yet persisted — these become Item records once the admin confirms.
 */
export type MenuIngestItem = {
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  spiceLevel: "mild" | "medium" | "hot" | null;
  confidence: number;
};

export type MenuIngestSection = {
  name: string;
  items: MenuIngestItem[];
};

/** POST /api/menu/ingest response payload. */
export type MenuIngestResponse = {
  restaurantName: string | null;
  sections: MenuIngestSection[];
  warnings: string[];
};

export type GstPercentage = 0 | 5 | 12 | 18;

/**
 * Restaurant payment + tax configuration, surfaced by
 * GET /api/restaurant/[id]/settings. Razorpay secret is returned
 * unmasked today; treat it accordingly on the client.
 */
export type RestaurantSettings = {
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  gstPercentage: GstPercentage;
};

export type GetSettingsResponse = { settings: RestaurantSettings };

export type UpdateSettingsRequest = Partial<RestaurantSettings>;

/** POST /api/native/push/register request body. */
export type RegisterPushRequest = {
  token: string;
  platform?: "ios" | "android" | "web";
  deviceName?: string;
};

/** DELETE /api/native/push/register request body. */
export type UnregisterPushRequest = {
  token: string;
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
