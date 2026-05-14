/**
 * Diner identity helpers — the boundary between the customer-facing flow
 * and the platform-level Diner entity.
 *
 * V1 demo scope: anonymous UUID-only identity + opportunistic phone-hash
 * binding from Razorpay. No merge logic, no consent UI, no forget primitive
 * — those land in V1 production (see piller3.md §4.1, §5.5).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import connectDB from "@/lib/db.js";
import Diner from "@/lib/models/Diner.js";

/**
 * Normalize a phone number to E.164-ish and hash it.
 * Strips spaces/dashes/parens and a leading `+`; leaves digits only.
 * Two phones that match in this canonical form will hash to the same value.
 */
export function hashPhone(phone: string): string {
  const digits = String(phone || "").replace(/[^0-9]/g, "");
  if (!digits) throw new Error("hashPhone: empty input");
  return crypto.createHash("sha256").update(digits).digest("hex");
}

/**
 * Upsert by uuid. Returns the (possibly freshly-created) Diner.
 * Safe to call on every customer-page mount; only writes when the UUID is new.
 */
export async function getOrCreateDinerByUuid(uuid: string) {
  if (!uuid || typeof uuid !== "string") {
    throw new Error("getOrCreateDinerByUuid: uuid required");
  }
  await connectDB();
  const diner = await Diner.findOneAndUpdate(
    { uuid },
    { $setOnInsert: { uuid } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return diner as any;
}

/**
 * Bind a phone hash to an existing Diner.
 *
 * Three cases:
 *   1. No diner has this phoneHash yet → set it on `dinerId`, promote state
 *      to `opportunistic`, return the updated diner.
 *   2. The phoneHash already belongs to `dinerId` → no-op, return as-is.
 *   3. The phoneHash belongs to a DIFFERENT diner → return a merge marker.
 *      Real merge logic (consent reconciliation, order re-pointing) is
 *      V1-production scope per piller3.md §4.1. For now we log and return
 *      the existing match so the caller can decide.
 */
export interface AttachPhoneResult {
  ok: boolean;
  diner?: any;
  merge?: { existingDinerId: string; reason: "phone_collision" };
}

export async function attachPhoneHash(
  dinerId: string,
  phone: string
): Promise<AttachPhoneResult> {
  if (!dinerId || !phone) {
    return { ok: false };
  }
  await connectDB();
  const phoneHash = hashPhone(phone);

  const existing = await Diner.findOne({ phoneHash }).lean();
  if (existing) {
    if ((existing as any)._id.toString() === dinerId) {
      return { ok: true, diner: existing };
    }
    console.warn(
      `[diner] phoneHash collision: existing=${(existing as any)._id} attempting=${dinerId} — merge deferred to V1 production`
    );
    return {
      ok: false,
      merge: { existingDinerId: (existing as any)._id.toString(), reason: "phone_collision" },
    };
  }

  const updated = await Diner.findByIdAndUpdate(
    dinerId,
    { $set: { phoneHash, state: "opportunistic" } },
    { new: true }
  ).lean();
  return { ok: !!updated, diner: updated };
}
