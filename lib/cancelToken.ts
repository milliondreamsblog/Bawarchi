/**
 * Short-lived order cancel tokens.
 *
 * Issued at order creation, stored client-side, required to cancel an order
 * as a customer (admins use session auth instead). The token cryptographically
 * binds (orderId, createdAt) so it cannot be reused or forged.
 *
 * It also doubles as a read token for the diner's own order (the order-success
 * page reads /api/orders/[id] with this token instead of a session).
 *
 * Expiry is enforced both inside the token (createdAt + window) and in the
 * cancel route's timing check — defense in depth.
 */

import crypto from "crypto";

const TOKEN_BYTES = 8; // 16 hex chars after slice — collision-resistant enough for a 5-minute window
const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

function getSecret(): string {
  const s = process.env.CANCEL_TOKEN_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "CANCEL_TOKEN_SECRET must be set (>=16 chars) for order cancel-token issuance"
    );
  }
  return s;
}

function sign(orderId: string, createdAtMs: number): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${orderId}:${createdAtMs}`)
    .digest("hex")
    .slice(0, TOKEN_BYTES * 2);
}

export interface IssuedCancelToken {
  token: string;
  expiresAt: number; // epoch ms
}

/**
 * Issue a cancel token for a freshly-created order.
 * Caller passes the order's `_id` and its `createdAt` (Date or epoch ms).
 */
export function issueCancelToken(
  orderId: string,
  createdAt: Date | number,
  windowMs: number = DEFAULT_WINDOW_MS
): IssuedCancelToken {
  const createdAtMs =
    typeof createdAt === "number" ? createdAt : createdAt.getTime();
  return {
    token: sign(orderId, createdAtMs),
    expiresAt: createdAtMs + windowMs,
  };
}

export type CancelTokenVerification =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "expired" };

/**
 * Verify a token against a known order. Constant-time comparison.
 * Both the token's HMAC validity and the (now - createdAt) window are checked.
 */
export function verifyCancelToken(
  orderId: string,
  createdAt: Date | number,
  token: string | null | undefined,
  windowMs: number = DEFAULT_WINDOW_MS
): CancelTokenVerification {
  if (!token || typeof token !== "string") return { ok: false, reason: "missing" };
  const createdAtMs =
    typeof createdAt === "number" ? createdAt : createdAt.getTime();
  const expected = sign(orderId, createdAtMs);
  if (
    expected.length !== token.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  ) {
    return { ok: false, reason: "invalid" };
  }
  if (Date.now() - createdAtMs > windowMs) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true };
}
