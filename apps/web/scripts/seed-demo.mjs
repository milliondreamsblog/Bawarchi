// YC-demo seed: produces the cross-restaurant magic moment as a
// repeatable, assertion-protected fixture.
//
// What it does:
//   1. Wipes any previous `demo-*` data (idempotent).
//   2. Creates two restaurants with deliberately distant cuisines but
//      overlapping primitive flavor profiles:
//        Spice Garden  (demo-mughlai, North Indian)
//        Bella Cucina  (demo-italian, Italian)
//   3. Inserts ~15 items per restaurant. Both menus include creamy /
//      vegetarian / mild items; the Italian menu also includes a
//      deliberate anti-match (spicy arrabbiata) for the demo "what
//      about this dish?" calibrated-abstention moment.
//   4. Embeds every item via Gemini gemini-embedding-001 (768 dims).
//   5. Creates a demo Diner with a stable UUID and the dietary
//      preferences of the canonical taste-profile from piller3.md §5
//      (creamy, vegetarian-leaning, mild).
//   6. Backdates six orders at Spice Garden over six weeks per the
//      planned order history (4-of-6 contain paneer; all veg; all mild).
//   7. Recomputes the diner's taste vector (replicating lib/taste.ts —
//      kept in sync with that module by construction).
//   8. Vector-searches Bella Cucina's menu against that taste vector
//      and asserts the top picks are the bullseye matches (four-cheese
//      gnocchi, mushroom risotto, margherita, ricotta shells) and that
//      the deliberate anti-match (arrabbiata) is NOT in the top-3.
//
// Run with:  node scripts/seed-demo.mjs
// Pre-req:   GEMINI_API_KEY set; Atlas `items_vector` index already
//            provisioned (created during Pillar 2 setup).

import "dotenv/config";
import mongoose from "mongoose";
import OpenAI from "openai";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import connectDB from "../lib/db.js";
import Restaurant from "../lib/models/Restaurant.js";
import Menu from "../lib/models/Menu.js";
import Item from "../lib/models/Item.js";
import Table from "../lib/models/Table.js";
import Order from "../lib/models/Order.js";
import Diner from "../lib/models/Diner.js";

// ── Constants (must match lib/embeddings.ts + lib/taste.ts) ─────────
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const EMBEDDING_MODEL = "gemini-embedding-001";
const DIMS = 768;
const HALF_LIFE_DAYS = 90;
const DECAY_LAMBDA = Math.LN2 / HALF_LIFE_DAYS;
const REPEAT_BOOST_CAP = 3;
const CONFIDENCE_FULL_AT = 6;
const VECTOR_INDEX_NAME = "items_vector";
const COUNTED_STATUSES = ["pending", "preparing", "served"];

const DEMO_DINER_UUID = "demo-creamy-veg-mild";
const DEMO_DINER_PHONE = "+919876500001";

// ── Helpers ────────────────────────────────────────────────────────
function buildSearchDocument(item) {
  const parts = [item.name];
  if (item.description?.trim()) parts.push(item.description.trim());
  if (item.category && item.category !== "General") parts.push(`Category: ${item.category}`);
  parts.push(item.isVeg ? "Vegetarian" : "Non-vegetarian");
  if (item.isVegan) parts.push("Vegan");
  if (item.isGlutenFree) parts.push("Gluten-free");
  if (item.spiceLevel && item.spiceLevel !== "medium") parts.push(`Spice: ${item.spiceLevel}`);
  return parts.join(". ") + ".";
}

function hashPhone(phone) {
  const digits = String(phone).replace(/[^0-9]/g, "");
  return crypto.createHash("sha256").update(digits).digest("hex");
}

async function embedAll(items, gemini) {
  const inputs = items.map(buildSearchDocument);
  const res = await gemini.embeddings.create({
    model: EMBEDDING_MODEL,
    input: inputs,
    dimensions: DIMS,
  });
  return res.data.map((d) => d.embedding);
}

// Replicates lib/taste.ts recomputeTasteVector — kept structurally
// identical so the demo's assertion is a true regression test for the
// production code path.
async function recomputeTasteFor(dinerId) {
  const orders = await Order.find({
    dinerId,
    status: { $in: COUNTED_STATUSES },
  })
    .sort({ createdAt: 1 })
    .lean();
  if (orders.length === 0) return null;

  const itemIdSet = new Set();
  for (const o of orders) for (const it of o.items || []) itemIdSet.add(it.itemId.toString());
  const itemIds = Array.from(itemIdSet);

  const items = await Item.find({ _id: { $in: itemIds } })
    .select("+embedding")
    .lean();
  const byId = new Map(items.map((i) => [i._id.toString(), i]));

  const occurrenceCount = {};
  const acc = new Array(DIMS).fill(0);
  let totalWeight = 0;
  let embeddedCount = 0;
  const now = Date.now();

  for (const order of orders) {
    const created =
      order.createdAt instanceof Date ? order.createdAt.getTime() : new Date(order.createdAt).getTime();
    const ageDays = Math.max(0, (now - created) / (1000 * 60 * 60 * 24));
    const decay = Math.exp(-DECAY_LAMBDA * ageDays);
    for (const it of order.items || []) {
      const id = it.itemId.toString();
      const dbItem = byId.get(id);
      if (!dbItem || !Array.isArray(dbItem.embedding) || dbItem.embedding.length !== DIMS) continue;
      const seen = occurrenceCount[id] || 0;
      occurrenceCount[id] = seen + 1;
      const boost = Math.min(seen + 1, REPEAT_BOOST_CAP);
      const qty = Math.max(1, Number(it.qty) || 1);
      const w = qty * decay * boost;
      for (let i = 0; i < DIMS; i++) acc[i] += w * dbItem.embedding[i];
      totalWeight += w;
      embeddedCount++;
    }
  }
  if (totalWeight === 0 || embeddedCount === 0) return null;

  let magSq = 0;
  for (const v of acc) magSq += v * v;
  const mag = Math.sqrt(magSq);
  const vector = mag > 0 ? acc.map((v) => v / mag) : acc;
  const confidence = Math.min(1, Math.log(1 + itemIdSet.size) / Math.log(CONFIDENCE_FULL_AT));

  await Diner.findByIdAndUpdate(dinerId, {
    $set: { tasteVector: vector, tasteConfidence: confidence, tasteVectorUpdatedAt: new Date() },
  });
  return { vector, confidence, uniqueItems: itemIdSet.size, embeddedCount };
}

async function vectorSearchAt(restaurantId, queryVector, k) {
  return Item.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector,
        numCandidates: 200,
        limit: k,
        filter: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          available: true,
        },
      },
    },
    {
      $project: {
        name: 1,
        price: 1,
        category: 1,
        isVeg: 1,
        spiceLevel: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);
}

// ── Menus ──────────────────────────────────────────────────────────
// Spice Garden — North Indian / Mughlai.
const MUGHLAI = [
  // Paneer-forward (the demo diner's bullseye)
  { name: "Paneer Makhani", description: "Cottage cheese in rich tomato cream sauce", price: 280, category: "Mains", isVeg: true, spiceLevel: "mild" },
  { name: "Paneer Butter Masala", description: "Cottage cheese in spiced butter gravy", price: 290, category: "Mains", isVeg: true, spiceLevel: "mild" },
  { name: "Paneer Tikka Masala", description: "Grilled cottage cheese in creamy curry", price: 300, category: "Mains", isVeg: true, spiceLevel: "medium" },
  { name: "Shahi Paneer", description: "Royal cottage cheese in cashew cream", price: 320, category: "Mains", isVeg: true, spiceLevel: "mild" },
  { name: "Malai Kofta", description: "Soft veg dumplings in creamy white gravy", price: 270, category: "Mains", isVeg: true, spiceLevel: "mild" },
  { name: "Dal Makhani", description: "Black lentils slow-cooked in butter and cream", price: 220, category: "Mains", isVeg: true, spiceLevel: "mild" },
  // Non-veg foils
  { name: "Butter Chicken", description: "Tandoori chicken in tomato butter sauce", price: 380, category: "Mains", isVeg: false, spiceLevel: "mild" },
  { name: "Chicken Tikka", description: "Char-grilled spiced chicken", price: 340, category: "Starters", isVeg: false, spiceLevel: "medium" },
  // Breads
  { name: "Garlic Naan", description: "Tandoor-baked bread with garlic", price: 70, category: "Breads", isVeg: true, spiceLevel: "mild" },
  { name: "Butter Naan", description: "Soft tandoor bread brushed with butter", price: 60, category: "Breads", isVeg: true, spiceLevel: "mild" },
  // Rice
  { name: "Jeera Rice", description: "Cumin-tempered basmati", price: 150, category: "Rice", isVeg: true, spiceLevel: "mild" },
  // Beverages
  { name: "Mango Lassi", description: "Sweet mango yogurt drink", price: 90, category: "Beverages", isVeg: true, spiceLevel: "mild" },
  { name: "Sweet Lassi", description: "Whipped sweet yogurt", price: 80, category: "Beverages", isVeg: true, spiceLevel: "mild" },
  // Desserts
  { name: "Gulab Jamun", description: "Milk-solid dumplings in rose syrup", price: 120, category: "Desserts", isVeg: true, spiceLevel: "mild" },
  { name: "Kulfi", description: "Traditional saffron-pistachio ice cream", price: 100, category: "Desserts", isVeg: true, spiceLevel: "mild" },
];

// Bella Cucina — Italian.
const ITALIAN = [
  // The cross-cuisine bullseyes (creamy, dairy-forward, veg, mild)
  { name: "Four-Cheese Gnocchi", description: "Pillow-soft potato gnocchi in mozzarella, parmesan, gorgonzola and ricotta cream", price: 480, category: "Pasta", isVeg: true, spiceLevel: "mild" },
  { name: "Mushroom Risotto", description: "Slow-stirred arborio rice with porcini and parmesan", price: 460, category: "Risotto", isVeg: true, spiceLevel: "mild" },
  { name: "Margherita Pizza", description: "San Marzano tomato, fresh mozzarella, basil", price: 420, category: "Pizza", isVeg: true, spiceLevel: "mild" },
  { name: "Ricotta-Stuffed Shells", description: "Pasta shells stuffed with herbed ricotta in tomato cream", price: 440, category: "Pasta", isVeg: true, spiceLevel: "mild" },
  { name: "Penne Alfredo", description: "Penne in classic parmesan-butter cream sauce", price: 380, category: "Pasta", isVeg: true, spiceLevel: "mild" },
  { name: "Caprese Salad", description: "Tomato, fresh mozzarella, basil, olive oil", price: 320, category: "Starters", isVeg: true, spiceLevel: "mild" },
  { name: "Margherita Bianca", description: "White pizza with mozzarella and ricotta", price: 440, category: "Pizza", isVeg: true, spiceLevel: "mild" },
  // Deliberate anti-match (spicy)
  { name: "Penne Arrabbiata", description: "Spicy chili-tomato penne with garlic", price: 400, category: "Pasta", isVeg: true, spiceLevel: "hot" },
  // Non-veg foils
  { name: "Spaghetti Bolognese", description: "Classic minced beef ragu over spaghetti", price: 460, category: "Pasta", isVeg: false, spiceLevel: "mild" },
  { name: "Chicken Parmigiana", description: "Breaded chicken with marinara and mozzarella", price: 520, category: "Mains", isVeg: false, spiceLevel: "mild" },
  // Desserts
  { name: "Tiramisu", description: "Mascarpone, espresso, cocoa, ladyfingers", price: 260, category: "Desserts", isVeg: true, spiceLevel: "mild" },
  { name: "Affogato", description: "Vanilla gelato drowned in hot espresso", price: 240, category: "Desserts", isVeg: true, spiceLevel: "mild" },
];

// Demo order history at Spice Garden — designed to produce a CLEAR
// creamy/veg/mild taste signal. 4 of 6 contain paneer; all-veg; all-mild.
const ORDER_HISTORY = [
  { daysAgo: 38, items: ["Paneer Makhani", "Butter Naan", "Mango Lassi"] },
  { daysAgo: 31, items: ["Paneer Butter Masala", "Garlic Naan", "Sweet Lassi"] },
  { daysAgo: 24, items: ["Dal Makhani", "Jeera Rice", "Gulab Jamun"] },
  { daysAgo: 17, items: ["Paneer Tikka Masala", "Butter Naan", "Kulfi"] },
  { daysAgo: 10, items: ["Shahi Paneer", "Butter Naan", "Mango Lassi"] },
  { daysAgo: 4, items: ["Malai Kofta", "Butter Naan", "Gulab Jamun"] },
];

const BULLSEYE_NAMES = new Set([
  "Four-Cheese Gnocchi",
  "Mushroom Risotto",
  "Margherita Pizza",
  "Ricotta-Stuffed Shells",
  "Penne Alfredo",
  "Margherita Bianca",
]);

// ── Steps ──────────────────────────────────────────────────────────
async function wipeDemo() {
  const oldRest = await Restaurant.find({ slug: { $regex: /^demo-/ } }).select("_id slug");
  const ids = oldRest.map((r) => r._id);
  if (ids.length) {
    await Item.deleteMany({ restaurantId: { $in: ids } });
    await Menu.deleteMany({ restaurantId: { $in: ids } });
    await Table.deleteMany({ restaurantId: { $in: ids } });
    await Order.deleteMany({ restaurantId: { $in: ids } });
  }
  await Restaurant.deleteMany({ _id: { $in: ids } });
  await Diner.deleteMany({ uuid: DEMO_DINER_UUID });
  console.log(`✓ Wiped ${ids.length} demo restaurant(s) + linked data + demo diner`);
}

async function seedRestaurant({ name, slug, email, phone, gst, gstPercentage, items, gemini }) {
  const restaurant = await Restaurant.create({
    name,
    slug,
    email,
    password: await bcrypt.hash("demo123", 10),
    owner: "Demo Owner",
    phone,
    address: `${name} — demo address`,
    status: "approved",
    gstPercentage: gstPercentage ?? gst ?? 5,
  });

  const itemDocs = items.map((it) => ({
    ...it,
    available: true,
    image:
      "https://res.cloudinary.com/dkgeudrfw/image/upload/v1/restaurants/placeholder.png",
    restaurantId: restaurant._id,
  }));
  const created = await Item.insertMany(itemDocs);

  console.log(`  embedding ${created.length} items for "${name}"...`);
  const vectors = await embedAll(created, gemini);
  await Promise.all(
    created.map((it, i) =>
      Item.findByIdAndUpdate(it._id, {
        embedding: vectors[i],
        embeddedAt: new Date(),
      })
    )
  );

  // Group items into a Menu by category.
  const byCategory = new Map();
  for (const it of created) {
    const cat = it.category || "General";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(it._id);
  }
  await Menu.create({
    title: name,
    sections: Array.from(byCategory.entries()).map(([cat, list]) => ({
      name: cat,
      items: list,
    })),
    restaurantId: restaurant._id,
  });

  // A couple of tables so QR scanning works.
  await Table.insertMany([
    { tableNumber: 1, slug: `${slug}-t1`, restaurantId: restaurant._id },
    { tableNumber: 2, slug: `${slug}-t2`, restaurantId: restaurant._id },
  ]);

  return { restaurant, items: created };
}

async function placeOrder({ restaurant, tableSlug, items, dinerId, daysAgo }) {
  const lineItems = items.map((it) => ({ itemId: it._id, qty: 1 }));
  const baseTotal = items.reduce((sum, it) => sum + it.price, 0);
  const gstAmount = Math.round((baseTotal * restaurant.gstPercentage) / 100 * 100) / 100;
  const platformFee = Math.round(((baseTotal + gstAmount) * 2) / 100 * 100) / 100;
  const finalAmount = Math.round((baseTotal + gstAmount + platformFee) * 100) / 100;
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  return Order.create({
    tableSlug,
    items: lineItems,
    total: finalAmount,
    baseTotal,
    gstPercentage: restaurant.gstPercentage,
    gstAmount,
    platformFee,
    finalAmount,
    restaurantEarnings: finalAmount - platformFee,
    myEarnings: platformFee,
    status: "served",
    restaurantId: restaurant._id,
    dinerId,
    customerPhone: DEMO_DINER_PHONE,
    createdAt,
  });
}

async function withRetry(fn, label, attempts = 6, delayMs = 5000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const out = await fn();
      if (out && (Array.isArray(out) ? out.length > 0 : true)) return out;
    } catch (e) {
      console.log(`  ${label} attempt ${i}/${attempts} threw: ${e.message}`);
    }
    if (i < attempts) {
      console.log(`  ${label} attempt ${i}/${attempts} empty — waiting ${delayMs / 1000}s for Atlas to index...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in .env");
    process.exit(1);
  }
  const gemini = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: GEMINI_BASE_URL,
  });

  console.log("Connecting to MongoDB...");
  await connectDB();

  console.log("\nStep 1 — wipe previous demo data");
  await wipeDemo();

  console.log("\nStep 2 — create Spice Garden (demo-mughlai)");
  const restA = await seedRestaurant({
    name: "Spice Garden",
    slug: "demo-mughlai",
    email: "demo-mughlai@bawarchie.test",
    phone: "+919876511111",
    gstPercentage: 5,
    items: MUGHLAI,
    gemini,
  });

  console.log("\nStep 3 — create Bella Cucina (demo-italian)");
  const restB = await seedRestaurant({
    name: "Bella Cucina",
    slug: "demo-italian",
    email: "demo-italian@bawarchie.test",
    phone: "+919876522222",
    gstPercentage: 18,
    items: ITALIAN,
    gemini,
  });

  console.log("\nStep 4 — create demo diner");
  const demoDiner = await Diner.create({
    uuid: DEMO_DINER_UUID,
    phoneHash: hashPhone(DEMO_DINER_PHONE),
    state: "opportunistic",
    dietaryPrefs: {
      persistent: {
        avoid: [],
        prefer: [],
        hardFilters: { isVeg: true, isVegan: false, allergens: [] },
      },
    },
    consentState: { crossRestaurantRecommendations: true, tasteProfileStorage: true },
  });
  console.log(`  diner _id=${demoDiner._id}  uuid=${demoDiner.uuid}`);

  console.log("\nStep 5 — backdate 6 orders at Spice Garden");
  const byName = new Map(restA.items.map((it) => [it.name, it]));
  for (const spec of ORDER_HISTORY) {
    const items = spec.items.map((n) => {
      const it = byName.get(n);
      if (!it) throw new Error(`Missing seed item "${n}" at Spice Garden`);
      return it;
    });
    await placeOrder({
      restaurant: restA.restaurant,
      tableSlug: "demo-mughlai-t1",
      items,
      dinerId: demoDiner._id,
      daysAgo: spec.daysAgo,
    });
    console.log(`  ✓ ${spec.daysAgo}d ago: ${spec.items.join(", ")}`);
  }

  console.log("\nStep 6 — recompute taste vector");
  const taste = await recomputeTasteFor(demoDiner._id.toString());
  if (!taste) {
    console.error("  recomputeTaste returned null — items may not have embeddings");
    process.exit(1);
  }
  console.log(`  ✓ vector dims=${taste.vector.length}  uniqueItems=${taste.uniqueItems}  confidence=${taste.confidence.toFixed(3)}`);

  console.log("\nStep 7 — cross-restaurant vector search at Bella Cucina");
  const topAtItalian = await withRetry(
    () => vectorSearchAt(restB.restaurant._id.toString(), taste.vector, 5),
    "vector search",
    6,
    5000
  );
  if (!topAtItalian) {
    console.error("\n✗ Atlas vector search returned empty after retries.");
    console.error("  Likely cause: the items_vector index hasn't ingested the new docs yet.");
    console.error("  Wait ~1-2 minutes and re-run, or check the Atlas Search index status.");
    process.exit(2);
  }
  console.log("  Top 5 picks for our creamy-veg-mild diner at Bella Cucina:");
  for (const item of topAtItalian) {
    const bullseye = BULLSEYE_NAMES.has(item.name) ? "  ⭐" : "";
    console.log(`    ${item.score?.toFixed?.(4) ?? "?"}  ${item.name}  (${item.category}, ${item.isVeg ? "veg" : "non-veg"}, ${item.spiceLevel})${bullseye}`);
  }

  console.log("\nStep 8 — assert magic moment");
  const top5Names = topAtItalian.map((it) => it.name);
  const top3Names = top5Names.slice(0, 3);
  const bullseyeInTop5 = top5Names.filter((n) => BULLSEYE_NAMES.has(n)).length;
  const arrabbiataInTop3 = top3Names.includes("Penne Arrabbiata");

  let allOK = true;
  if (bullseyeInTop5 >= 2) {
    console.log(`  ✓ ${bullseyeInTop5} bullseye match(es) in top-5`);
  } else {
    console.log(`  ✗ only ${bullseyeInTop5} bullseye match(es) in top-5 (expected ≥2)`);
    allOK = false;
  }
  if (!arrabbiataInTop3) {
    console.log("  ✓ spicy arrabbiata correctly NOT in top-3");
  } else {
    console.log("  ✗ spicy arrabbiata appeared in top-3 — taste/spice signal weak");
    allOK = false;
  }

  console.log("\n────────────────────────────────────────────────────────");
  if (allOK) {
    console.log("✅ DEMO SEED OK — the magic moment is reproducible.");
    console.log(`  Demo diner uuid:    ${DEMO_DINER_UUID}`);
    console.log(`  Demo diner _id:     ${demoDiner._id}`);
    console.log(`  Mughlai QR URL:     /r/demo-mughlai/t/demo-mughlai-t1`);
    console.log(`  Italian QR URL:     /r/demo-italian/t/demo-italian-t1`);
    console.log("");
    console.log("  To replay the magic moment in the browser:");
    console.log("    1. On phone: open the Mughlai URL, place an order (uses demo-creamy-veg-mild UUID auto-issued or set localStorage manually)");
    console.log("    2. Visit the Italian URL — \"Picked for your taste\" should surface creamy / cheese-forward picks");
  } else {
    console.log("❌ DEMO SEED REGRESSION — the magic moment broke.");
    console.log("   Investigate before recording the demo.");
  }
  console.log("────────────────────────────────────────────────────────");

  await mongoose.disconnect();
  process.exit(allOK ? 0 : 1);
}

main().catch((err) => {
  console.error("\nseed-demo crashed:", err);
  process.exit(1);
});
