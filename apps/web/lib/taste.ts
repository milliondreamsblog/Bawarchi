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
import mongoose from "mongoose";
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

// ─────────────────────────────────────────────────────────────────────────
// Taste description (Pillar 3 §5.5 — three-tier disclosure)
//
// The ONLY place that translates a taste vector into human-readable text.
// Centralizing this enforces "taste-language not history-language" as a
// structural property of the codebase — there is no other API that turns
// a taste vector into prose, so cross-restaurant raw history cannot leak
// through prose by accident.
//
// Strategy: find items across the platform that are nearest to this taste
// vector in 768-dim cosine space, then describe the SHARED structured tags
// (dietary class, spice level, dominant categories) of those items. We
// never name those items, never name their restaurants, never expose IDs.
// The description is an abstraction of the diner's taste, not a list of
// what they've eaten.
// ─────────────────────────────────────────────────────────────────────────

const VECTOR_INDEX_NAME = "items_vector";
const NEIGHBOUR_SAMPLE = 30;

export interface TasteDescription {
  /** Confidence in [0, 1]. Below 0.4, treat the summary as a guess. */
  confidence: number;
  /** Short human sentence. Safe to put directly in restaurant-facing UI. */
  summary: string;
  /** Discrete signal tags. Useful for badges / chips in the UI. */
  tags: string[];
  /** Dietary class signal — operational, default-disclosed (§5.5 tier 1). */
  dietary: {
    leaning: "vegan" | "vegetarian" | "non-vegetarian" | "mixed";
    glutenFreeLeaning: boolean;
  };
  /** Spice tolerance — service-relevant, default-disclosed for ops safety. */
  spicePreference: "mild" | "medium" | "hot" | "mixed" | null;
  /** How many neighbour items contributed to this summary. */
  sampleCount: number;
}

const EMPTY_DESCRIPTION: TasteDescription = {
  confidence: 0,
  summary: "Not enough order history yet to predict taste.",
  tags: [],
  dietary: { leaning: "mixed", glutenFreeLeaning: false },
  spicePreference: null,
  sampleCount: 0,
};

/**
 * Produce a human-readable description of a diner's taste, scoped to what
 * is safe to show on a restaurant-side context card.
 */
export async function describeTasteForDiner(
  dinerId: string
): Promise<TasteDescription> {
  if (!dinerId) return EMPTY_DESCRIPTION;
  await connectDB();

  const diner = await Diner.findById(dinerId)
    .select("+tasteVector tasteConfidence")
    .lean();
  const d = diner as any;
  if (
    !d ||
    !Array.isArray(d.tasteVector) ||
    d.tasteVector.length !== DIMS ||
    (d.tasteConfidence ?? 0) === 0
  ) {
    return EMPTY_DESCRIPTION;
  }

  // Pull the 30 nearest items in vector space, platform-wide. We never
  // expose these items by name — we only aggregate their structured tags.
  const neighbours = await Item.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: d.tasteVector,
        numCandidates: 200,
        limit: NEIGHBOUR_SAMPLE,
        filter: { available: true },
      },
    },
    {
      $project: {
        isVeg: 1,
        isVegan: 1,
        isGlutenFree: 1,
        spiceLevel: 1,
        category: 1,
      },
    },
  ]);

  if (!Array.isArray(neighbours) || neighbours.length === 0) {
    return { ...EMPTY_DESCRIPTION, confidence: d.tasteConfidence };
  }

  const n = neighbours.length;
  let vegCount = 0;
  let veganCount = 0;
  let gfCount = 0;
  const spice: Record<string, number> = {
    mild: 0,
    medium: 0,
    hot: 0,
    "extra-hot": 0,
  };
  const cats: Record<string, number> = {};

  for (const it of neighbours as any[]) {
    if (it.isVeg) vegCount++;
    if (it.isVegan) veganCount++;
    if (it.isGlutenFree) gfCount++;
    if (it.spiceLevel && spice[it.spiceLevel] !== undefined) spice[it.spiceLevel]++;
    if (it.category && it.category !== "General") {
      cats[it.category] = (cats[it.category] || 0) + 1;
    }
  }

  const vegPct = vegCount / n;
  const veganPct = veganCount / n;
  const gfPct = gfCount / n;

  const leaning: TasteDescription["dietary"]["leaning"] =
    veganPct >= 0.7
      ? "vegan"
      : vegPct >= 0.7
      ? "vegetarian"
      : vegPct <= 0.3
      ? "non-vegetarian"
      : "mixed";

  // Dominant spice — winner-takes-all only if it commands ≥ 50% of the
  // signal; otherwise this diner is spice-tolerant in both directions.
  const spiceEntries = Object.entries(spice).sort((a, b) => b[1] - a[1]);
  const [dominantSpice, dominantCount] = spiceEntries[0] || [null, 0];
  let spicePreference: TasteDescription["spicePreference"] = null;
  if (dominantCount / n >= 0.5) {
    if (dominantSpice === "hot" || dominantSpice === "extra-hot") spicePreference = "hot";
    else if (dominantSpice === "mild") spicePreference = "mild";
    else if (dominantSpice === "medium") spicePreference = "medium";
  } else if (dominantCount / n >= 0.3) {
    spicePreference = "mixed";
  }

  const topCategories = Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k.toLowerCase());

  const tags: string[] = [];
  if (leaning === "vegan") tags.push("Vegan");
  else if (leaning === "vegetarian") tags.push("Vegetarian");
  else if (leaning === "non-vegetarian") tags.push("Non-veg friendly");
  if (gfPct >= 0.5) tags.push("Gluten-free leaning");
  if (spicePreference === "mild") tags.push("Mild spice");
  else if (spicePreference === "hot") tags.push("Spicy");
  else if (spicePreference === "medium") tags.push("Medium spice");
  for (const c of topCategories) tags.push(`Often picks ${c}`);

  const phrases: string[] = [];
  if (leaning === "vegan") phrases.push("Vegan");
  else if (leaning === "vegetarian") phrases.push("Vegetarian");
  else if (leaning === "non-vegetarian") phrases.push("Comfortable with non-veg dishes");

  if (spicePreference === "mild") phrases.push("prefers mild flavors");
  else if (spicePreference === "hot") phrases.push("enjoys spicy food");
  else if (spicePreference === "medium") phrases.push("medium spice tolerance");

  if (gfPct >= 0.5) phrases.push("often picks gluten-free");
  if (topCategories.length) {
    phrases.push(`gravitates toward ${topCategories.join(" and ")}`);
  }

  const summary =
    phrases.length > 0
      ? phrases.join(". ").replace(/^./, (c) => c.toUpperCase()) + "."
      : "Open palate — no strong lean detected yet.";

  return {
    confidence: d.tasteConfidence,
    summary,
    tags,
    dietary: { leaning, glutenFreeLeaning: gfPct >= 0.5 },
    spicePreference,
    sampleCount: n,
  };
}

// Re-export ObjectId-ness for callers that need it; keeps the import
// surface of this module self-contained.
export const _internal = { VECTOR_INDEX_NAME, DIMS, mongoose };
