/**
 * Server-trusted billing.
 *
 * The single source of truth for what an order costs. Both the Razorpay
 * order amount and the persisted Order document MUST come from this
 * function — never from client-supplied numbers.
 *
 * Why: clients can tamper with prices/totals. The Razorpay signature
 * verifies the payment matches what we asked for, but if we asked for
 * the wrong amount (because we trusted the client), the signature is
 * useless. This module closes that gap by deriving every billing field
 * from server-side DB reads.
 *
 * The pure GST + platform-fee math lives in `lib/utils/billing.ts`.
 * This module is the lookup + validation layer around it.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import connectDB from "@/lib/db.js";
import Restaurant from "@/lib/models/Restaurant.js";
import Item from "@/lib/models/Item.js";
import {
  calculateBillingBreakdown,
  type BillingBreakdown,
} from "@/lib/utils/billing";

export class BillingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "BillingError";
    this.status = status;
  }
}

export interface BillingItemRequest {
  itemId: string;
  qty: number;
}

export interface ComputeBillingInput {
  restaurantId: string;
  items: BillingItemRequest[];
}

export interface ResolvedLineItem {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface ComputeBillingResult {
  breakdown: BillingBreakdown;
  restaurant: {
    _id: string;
    gstPercentage: number;
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
  };
  resolvedItems: ResolvedLineItem[];
}

/**
 * Compute the authoritative billing breakdown for a set of items.
 *
 * Validation performed (in order):
 *   1. `restaurantId` is a valid ObjectId
 *   2. `items` is a non-empty array
 *   3. Each item has a valid ObjectId and integer qty >= 1
 *   4. Restaurant exists
 *   5. Every item exists in DB
 *   6. Every item's `restaurantId` matches the input restaurantId (tenant isolation)
 *   7. Every item has a non-negative numeric price
 *
 * Throws `BillingError` with an appropriate HTTP status on any failure.
 * Callers in route handlers can map `err.status` directly to the response.
 */
export async function computeBilling(
  input: ComputeBillingInput
): Promise<ComputeBillingResult> {
  if (
    !input?.restaurantId ||
    !mongoose.Types.ObjectId.isValid(input.restaurantId)
  ) {
    throw new BillingError("Invalid restaurantId", 400);
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new BillingError("items must be a non-empty array", 400);
  }

  const requested: BillingItemRequest[] = input.items.map((it) => {
    if (!it?.itemId || !mongoose.Types.ObjectId.isValid(it.itemId)) {
      throw new BillingError(`Invalid itemId: ${it?.itemId}`, 400);
    }
    const qty = Math.floor(Number(it.qty));
    if (!Number.isFinite(qty) || qty < 1) {
      throw new BillingError(
        `Invalid qty for item ${it.itemId}: ${it.qty}`,
        400
      );
    }
    return { itemId: it.itemId, qty };
  });

  await connectDB();

  const restaurant = await Restaurant.findById(input.restaurantId).lean();
  if (!restaurant) {
    throw new BillingError("Restaurant not found", 404);
  }

  const objectIds = requested.map(
    (r) => new mongoose.Types.ObjectId(r.itemId)
  );
  const dbItems = await Item.find({ _id: { $in: objectIds } }).lean();
  const byId = new Map<string, any>(
    dbItems.map((d: any) => [d._id.toString(), d])
  );

  const resolvedItems: ResolvedLineItem[] = requested.map((req) => {
    const dbItem = byId.get(req.itemId);
    if (!dbItem) {
      throw new BillingError(`Item not found: ${req.itemId}`, 404);
    }
    if (dbItem.restaurantId?.toString() !== input.restaurantId) {
      throw new BillingError(
        `Item ${req.itemId} does not belong to this restaurant`,
        403
      );
    }
    const price = Number(dbItem.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new BillingError(
        `Item ${req.itemId} has invalid price`,
        500
      );
    }
    return {
      itemId: req.itemId,
      name: String(dbItem.name),
      price: Math.round(price * 100) / 100,
      qty: req.qty,
      lineTotal: Math.round(price * req.qty * 100) / 100,
    };
  });

  const baseTotal = resolvedItems.reduce((sum, it) => sum + it.lineTotal, 0);
  const gstPercentage = (restaurant as any).gstPercentage || 0;
  const breakdown = calculateBillingBreakdown(baseTotal, gstPercentage);

  return {
    breakdown,
    restaurant: {
      _id: (restaurant as any)._id.toString(),
      gstPercentage,
      razorpayKeyId: (restaurant as any).razorpayKeyId,
      razorpayKeySecret: (restaurant as any).razorpayKeySecret,
    },
    resolvedItems,
  };
}

export type { BillingBreakdown };
