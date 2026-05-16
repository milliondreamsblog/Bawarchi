// Persona simulator. For each persona:
//   1. Creates a temp Diner with uuid "harness-<personaId>-<runId>"
//   2. Inserts backdated orders at the home restaurant (status "served")
//   3. Computes the taste vector by REPLICATING lib/taste.ts inline
//
// The recomputeTasteVector logic is copied (not imported) for the same reason
// seed-demo.mjs replicates it: Node .mjs cannot import .ts directly. Keep
// this in sync with lib/taste.ts — drift will be caught by the existing
// regression probes (seed-demo asserts the bullseye).

import crypto from "node:crypto";
import mongoose from "mongoose";
import Diner from "../../../lib/models/Diner.js";
import Order from "../../../lib/models/Order.js";
import Item from "../../../lib/models/Item.js";
import Restaurant from "../../../lib/models/Restaurant.js";

// ─── Constants — must match lib/taste.ts ─────────────────────────────
const DIMS = 768;
const HALF_LIFE_DAYS = 90;
const DECAY_LAMBDA = Math.LN2 / HALF_LIFE_DAYS;
const REPEAT_BOOST_CAP = 3;
const CONFIDENCE_FULL_AT = 6;
const COUNTED_STATUSES = ["pending", "preparing", "served"];

// ─── Replicates lib/taste.ts recomputeTasteVector ────────────────────
async function recomputeTasteVectorInline(dinerObjectId) {
  const orders = await Order.find({
    dinerId: dinerObjectId,
    status: { $in: COUNTED_STATUSES },
  })
    .sort({ createdAt: 1 })
    .lean();
  if (orders.length === 0) return { vector: null, confidence: 0, reason: "no_orders" };

  const itemIdSet = new Set();
  for (const o of orders) {
    for (const it of o.items || []) {
      if (it?.itemId) itemIdSet.add(it.itemId.toString());
    }
  }
  const items = await Item.find({ _id: { $in: Array.from(itemIdSet) } })
    .select("+embedding")
    .lean();
  const byId = new Map(items.map((i) => [i._id.toString(), i]));

  const occurrenceCount = {};
  const acc = new Array(DIMS).fill(0);
  let totalWeight = 0;
  let embeddedItemsCount = 0;
  const now = Date.now();

  for (const order of orders) {
    const created =
      order.createdAt instanceof Date
        ? order.createdAt.getTime()
        : new Date(order.createdAt).getTime();
    const ageDays = Math.max(0, (now - created) / (1000 * 60 * 60 * 24));
    const decay = Math.exp(-DECAY_LAMBDA * ageDays);
    for (const it of order.items || []) {
      if (!it?.itemId) continue;
      const id = it.itemId.toString();
      const dbItem = byId.get(id);
      if (!dbItem || !Array.isArray(dbItem.embedding) || dbItem.embedding.length !== DIMS) {
        continue;
      }
      const seen = occurrenceCount[id] || 0;
      occurrenceCount[id] = seen + 1;
      const boost = Math.min(seen + 1, REPEAT_BOOST_CAP);
      const qty = Math.max(1, Number(it.qty) || 1);
      const w = qty * decay * boost;
      for (let i = 0; i < DIMS; i++) acc[i] += w * dbItem.embedding[i];
      totalWeight += w;
      embeddedItemsCount++;
    }
  }
  if (totalWeight === 0 || embeddedItemsCount === 0) {
    return { vector: null, confidence: 0, reason: "no_embedded_items" };
  }
  let magSq = 0;
  for (const v of acc) magSq += v * v;
  const mag = Math.sqrt(magSq);
  const vector = mag > 0 ? acc.map((v) => v / mag) : acc;
  const confidence = Math.min(1, Math.log(1 + itemIdSet.size) / Math.log(CONFIDENCE_FULL_AT));
  return { vector, confidence, uniqueItems: itemIdSet.size, embeddedItemsCount };
}

// ─── Hard filters for the persona's dietary class ────────────────────
// Returned so the runner can pass them to retrieval.mjs if it wants to
// test hard-filtered retrieval. Default: harness DOES NOT pass hard filters
// because we're testing the soft vector signal alone. See README §"Methodology".
export function deriveHardFilters(persona) {
  const d = persona.tasteAxes?.dietaryClass;
  if (d === "vegan") return { isVegan: true };
  if (d === "vegetarian" || d === "jain") return { isVeg: true };
  return {};
}

// ─── Main entry point ────────────────────────────────────────────────
export async function simulatePersona(persona, runId) {
  // 1. Build the uuid
  const safeId = persona.personaId.replace(/[^a-zA-Z0-9_-]/g, "");
  const uuid = `harness-${safeId}-${runId}`;
  const phoneHash = crypto.createHash("sha256").update(uuid).digest("hex");

  // 2. Pre-flight: verify home restaurants and items exist
  const slugs = Array.from(new Set(persona.simulatedOrders.map((o) => o.homeRestaurantSlug)));
  const homeRestaurants = await Restaurant.find({ slug: { $in: slugs } }).lean();
  const restaurantBySlug = new Map(homeRestaurants.map((r) => [r.slug, r]));
  const missing = slugs.filter((s) => !restaurantBySlug.has(s));
  if (missing.length) {
    throw new Error(
      `simulator: home restaurant slug(s) not found: ${missing.join(", ")} — did you run "pnpm seed:demo"?`
    );
  }

  // Resolve all referenced items up-front. Names come from persona JSON; we
  // look them up scoped to each home restaurant.
  const itemRefs = []; // { homeSlug, name, qty, daysAgo, item }
  for (const orderSpec of persona.simulatedOrders) {
    const r = restaurantBySlug.get(orderSpec.homeRestaurantSlug);
    const namesNeeded = orderSpec.items.map((it) => it.name);
    const items = await Item.find({
      restaurantId: r._id,
      name: { $in: namesNeeded },
    }).lean();
    const byName = new Map(items.map((i) => [i.name, i]));
    for (const it of orderSpec.items) {
      const dbItem = byName.get(it.name);
      if (!dbItem) {
        throw new Error(
          `simulator: item "${it.name}" not found at restaurant "${orderSpec.homeRestaurantSlug}" — fix persona ${persona.personaId} or extend seed-demo`
        );
      }
      itemRefs.push({
        homeSlug: orderSpec.homeRestaurantSlug,
        homeRestaurant: r,
        name: it.name,
        qty: it.qty || 1,
        daysAgo: it.daysAgo,
        item: dbItem,
      });
    }
  }

  // 3. Create the temp Diner
  const diner = await Diner.create({
    uuid,
    phoneHash, // sparse-unique; harness-uniqueness via uuid is sufficient but phoneHash satisfies schema
    state: "opportunistic",
    dietaryPrefs: {
      persistent: {
        avoid: persona.tasteAxes?.avoidance || [],
        prefer: persona.tasteAxes?.primaryTraits || [],
        hardFilters: {
          isVeg:
            persona.tasteAxes?.dietaryClass === "vegetarian" ||
            persona.tasteAxes?.dietaryClass === "jain",
          isVegan: persona.tasteAxes?.dietaryClass === "vegan",
          allergens: [],
        },
      },
    },
    consentState: { crossRestaurantRecommendations: true, tasteProfileStorage: true },
  });

  // 4. Insert backdated orders. Group items by their home restaurant; within
  // each restaurant, group by daysAgo so that items eaten on the same "day"
  // become one order (matches realistic order-history semantics).
  const groupKey = (r) => `${r.homeSlug}::${r.daysAgo}`;
  const byGroup = new Map();
  for (const ref of itemRefs) {
    const k = groupKey(ref);
    if (!byGroup.has(k)) byGroup.set(k, []);
    byGroup.get(k).push(ref);
  }
  let ordersInserted = 0;
  for (const refs of byGroup.values()) {
    const r = refs[0].homeRestaurant;
    const createdAt = new Date(Date.now() - refs[0].daysAgo * 24 * 60 * 60 * 1000);
    const lineItems = refs.map((ref) => ({ itemId: ref.item._id, qty: ref.qty }));
    const baseTotal = refs.reduce((s, ref) => s + (ref.item.price || 0) * ref.qty, 0);
    const gstPct = r.gstPercentage ?? 0;
    const gstAmount = Math.round(((baseTotal * gstPct) / 100) * 100) / 100;
    const platformFee = Math.round(((baseTotal + gstAmount) * 2) / 100 * 100) / 100;
    const finalAmount = Math.round((baseTotal + gstAmount + platformFee) * 100) / 100;
    await Order.create({
      tableSlug: `harness-${r.slug}-t1`,
      items: lineItems,
      total: finalAmount,
      baseTotal,
      gstPercentage: gstPct,
      gstAmount,
      platformFee,
      finalAmount,
      restaurantEarnings: finalAmount - platformFee,
      myEarnings: platformFee,
      status: "served",
      restaurantId: r._id,
      dinerId: diner._id,
      createdAt,
    });
    ordersInserted++;
  }

  // 5. Recompute taste vector and persist it onto the Diner doc.
  const taste = await recomputeTasteVectorInline(diner._id);
  if (taste.vector) {
    await Diner.findByIdAndUpdate(diner._id, {
      $set: {
        tasteVector: taste.vector,
        tasteConfidence: taste.confidence,
        tasteVectorUpdatedAt: new Date(),
      },
    });
  } else {
    await Diner.findByIdAndUpdate(diner._id, {
      $set: { tasteVector: null, tasteConfidence: 0, tasteVectorUpdatedAt: new Date() },
    });
  }

  return {
    dinerId: diner._id,
    uuid,
    ordersInserted,
    uniqueItemsOrdered: itemRefs.length,
    tasteConfidence: taste.confidence,
    tasteVectorReady: !!taste.vector,
    tasteReason: taste.reason || null,
  };
}
