/**
 * Short-lived order cancel tokens.
 *
 * Issued at order creation, stored client-side, required to cancel an order
 * as a customer (admins use session auth instead). Also doubles as a read
 * token for the diner's own order on /order-success.
 *
 * Token format: `<hmac>.<createdAtMs_base36>`
 *
 * The createdAtMs is encoded inside the token so issue and verify use the
 * exact same value — eliminating any chance of drift from Mongoose date
 * round-tripping, BSON precision, or different code paths reading slightly
 * different times. The HMAC binds (orderId, createdAtMs) so an attacker
 * cannot mutate the timestamp without invalidating the signature.
 *
 * Expiry is enforced by comparing `Date.now()` against the decoded
 * createdAtMs at verify time.
 */

import crypto from "crypto";

const HMAC_HEX_LEN = 16; // 8 bytes → 16 hex chars
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

function hmac(orderId: string, createdAtMs: number): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${orderId}:${createdAtMs}`)
    .digest("hex")
    .slice(0, HMAC_HEX_LEN);
}

// Note: the second arg of verify is unused (the token carries its own
// timestamp). Kept in the signature for backward compat with callers.

export interface IssuedCancelToken {
  token: string;
  expiresAt: number;
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
  const sig = hmac(orderId, createdAtMs);
  return {
    token: `${sig}.${createdAtMs.toString(36)}`,
    expiresAt: createdAtMs + windowMs,
  };
}

export type CancelTokenVerification =
  | { ok: true; createdAtMs: number }
  | { ok: false; reason: "missing" | "invalid" | "expired" };

/**
 * Verify a token against a known order.
 *
 * The `createdAt` parameter is no longer needed for HMAC verification — the
 * token carries its own timestamp. It is accepted for backward compatibility
 * with existing callers but is unused.
 */
export function verifyCancelToken(
  orderId: string,
  _createdAt: Date | number | null | undefined,
  token: string | null | undefined,
  windowMs: number = DEFAULT_WINDOW_MS
): CancelTokenVerification {
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing" };
  }

  const idx = token.lastIndexOf(".");
  if (idx <= 0 || idx >= token.length - 1) {
    return { ok: false, reason: "invalid" };
  }
  const sigPart = token.slice(0, idx);
  const tsPart = token.slice(idx + 1);

  if (sigPart.length !== HMAC_HEX_LEN) {
    return { ok: false, reason: "invalid" };
  }

  const createdAtMs = parseInt(tsPart, 36);
  if (!Number.isFinite(createdAtMs) || createdAtMs <= 0) {
    return { ok: false, reason: "invalid" };
  }

  const expected = hmac(orderId, createdAtMs);
  let sigMatch = false;
  try {
    sigMatch = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(sigPart)
    );
  } catch {
    sigMatch = false;
  }
  if (!sigMatch) return { ok: false, reason: "invalid" };

  if (Date.now() - createdAtMs > windowMs) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, createdAtMs };
}
