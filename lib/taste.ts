/**
 * Taste graph — Layer C of Pillar 3 (piller3.md §4.3).
 *
 * Given a dinerId, walks all their orders across every restaurant they've
 * visited (the only allowed cross-tenant read in the system), fetches each
 * item's stored 768-dim embedding, and produces a single unit-length taste
 * vector that represents "what this person tends to order".
 *
 * Weighting per occurrence:
 *   weight = qty × recency_decay × repeat_boost
 *     recency_decay  = exp(-λ × ageDays),  λ = ln(2) / 90  (90-day half-life)
 *     repeat_boost   = min(1, 2, 3, …, capped at 3) per the doc's
 *                      "twice >> once; thrice = conviction" principle
 *
 * Confidence calibration (§2.6):
 *   confidence = log(1 + uniqueItems) / log(6), clipped to [0, 1].
 *   Roughly: 1 item ≈ 0.39, 3 items ≈ 0.77, 5+ items ≈ 1.0.
 *   Layer D uses this to fall back to "popular tonight" when below 0.4.
 *
 * V1 scope: single general taste vector. Multi-mode (general + current
 * occasion) is deferred to V1 production (§4.3).
 *
 * Trigger: called fire-and-forget from POST /api/orders after persistence.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import Item from "@/lib/models/Item.js";
import Diner from "@/lib/models/Diner.js";

const DIMS = 768;
const HALF_LIFE_DAYS = 90;
const DECAY_LAMBDA = Math.LN2 / HALF_LIFE_DAYS;
const REPEAT_BOOST_CAP = 3;
const CONFIDENCE_FULL_AT = 6;
// Orders in these states never happened from the diner's perspective.
const COUNTED_STATUSES = ["pending", "preparing", "served"];

export interface TasteResult {
  vector: number[] | null;
  confidence: number;
  orderCount: number;
  uniqueItemsCount: number;
  embeddedItemsCount: number;
  reason?: "no_orders" | "no_embedded_items";
}

export async function recomputeTasteVector(dinerId: string): Promise<TasteResult> {
  if (!dinerId) throw new Error("recomputeTasteVector: dinerId required");
  await connectDB();

  // 1. Cross-tenant load. The only place we read orders across restaurants.
  const orders = await Order.find({
    dinerId,
    status: { $in: COUNTED_STATUSES },
  })
    .sort({ createdAt: 1 })
    .lean();

  if (orders.length === 0) {
    await Diner.findByIdAndUpdate(dinerId, {
      $set: {
        tasteVector: null,
        tasteConfidence: 0,
        tasteVectorUpdatedAt: new Date(),
      },
    });
    return {
      vector: null,
      confidence: 0,
      orderCount: 0,
      uniqueItemsCount: 0,
      embeddedItemsCount: 0,
      reason: "no_orders",
    };
  }

  // 2. Collect unique item ids referenced across all orders.
  const itemIdSet = new Set<string>();
  for (const o of orders as any[]) {
    for (const it of o.items || []) {
      if (it?.itemId) itemIdSet.add(it.itemId.toString());
    }
  }
  const itemIds = Array.from(itemIdSet);

  // 3. Fetch embeddings (heavy field, `select: false` on the schema —
  // must explicitly opt in with +embedding).
  const items = await Item.find({ _id: { $in: itemIds } })
    .select("+embedding")
    .lean();
  const byId = new Map<string, any>(
    items.map((i: any) => [i._id.toString(), i])
  );

  // 4. Weighted aggregation in chronological order (repeat-boost ramps
  // with how many times we've seen each item before this occurrence).
  const occurrenceCount: Record<string, number> = {};
  const acc = new Array(DIMS).fill(0);
  let totalWeight = 0;
  let embeddedItemsCount = 0;
  const now = Date.now();

  for (const order of orders as any[]) {
    const created =
      order.createdAt instanceof Date
        ? order.createdAt.getTime()
        : new Date(order.createdAt).getTime();
    const ageDays = Math.max(0, (now - created) / (1000 * 60 * 60 * 24));
    const decay = Math.exp(-DECAY_LAMBDA * ageDays);

    for (const it of order.items || []) {
      if (!it?.itemId) continue;
      const itemId = it.itemId.toString();
      const qty = Math.max(1, Number(it.qty) || 1);
      const dbItem = byId.get(itemId);
      if (
        !dbItem ||
        !Array.isArray(dbItem.embedding) ||
        dbItem.embedding.length !== DIMS
      ) {
        continue; // item missing or unembedded — skip silently
      }

      const seenBefore = occurrenceCount[itemId] || 0;
      occurrenceCount[itemId] = seenBefore + 1;
      const repeatBoost = Math.min(seenBefore + 1, REPEAT_BOOST_CAP);
      const weight = qty * decay * repeatBoost;

      for (let i = 0; i < DIMS; i++) acc[i] += weight * dbItem.embedding[i];
      totalWeight += weight;
      embeddedItemsCount++;
    }
  }

  if (totalWeight === 0 || embeddedItemsCount === 0) {
    await Diner.findByIdAndUpdate(dinerId, {
      $set: {
        tasteVector: null,
        tasteConfidence: 0,
        tasteVectorUpdatedAt: new Date(),
      },
    });
    return {
      vector: null,
      confidence: 0,
      orderCount: orders.length,
      uniqueItemsCount: itemIdSet.size,
      embeddedItemsCount: 0,
      reason: "no_embedded_items",
    };
  }

  // 5. Normalize to unit length so downstream cosine similarity is direct.
  let magSq = 0;
  for (let i = 0; i < DIMS; i++) magSq += acc[i] * acc[i];
  const magnitude = Math.sqrt(magSq);
  const vector =
    magnitude > 0 ? acc.map((v) => v / magnitude) : (acc as number[]);

  // 6. Confidence ramps with item variety, saturates around 5+ unique items.
  const confidence = Math.min(
    1,
    Math.log(1 + itemIdSet.size) / Math.log(CONFIDENCE_FULL_AT)
  );

  await Diner.findByIdAndUpdate(dinerId, {
    $set: {
      tasteVector: vector,
      tasteConfidence: confidence,
      tasteVectorUpdatedAt: new Date(),
    },
  });

  return {
    vector,
    confidence,
    orderCount: orders.length,
    uniqueItemsCount: itemIdSet.size,
    embeddedItemsCount,
  };
}
