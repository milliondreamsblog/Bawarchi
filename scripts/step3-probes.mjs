// Step 3 smoke probes — Layer D retrieval (For You + taste-aware chat).
// Run with: node scripts/step3-probes.mjs
//
//   #1  /api/ai/for-you without dinerId → 200, source=popular, fallback=true
//   #2  /api/ai/for-you without restaurantId → 400
//   #3  /api/ai/for-you with a diner that has a taste vector AND confidence>=0.4
//       → if any items are embedded, source=taste & fallback=false;
//         otherwise gracefully degrade to popular fallback (acceptable)
//   #4  /api/ai/chat with dinerId → 200 success

import "dotenv/config";
import mongoose from "mongoose";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const results = [];
const pass = (m) => { results.push({ pass: true }); console.log("✓", m); };
const fail = (m) => { results.push({ pass: false }); console.log("✗", m); };
const info = (m) => console.log("·", m);

await mongoose.connect(process.env.MONGO_URI);

// Pick the latest restaurant + latest diner with confidence ≥ 0.4.
const restaurant = await mongoose.connection
  .collection("restaurants")
  .findOne({}, { projection: { _id: 1, slug: 1, name: 1 } });
if (!restaurant) {
  console.error("No restaurants in DB.");
  await mongoose.disconnect();
  process.exit(1);
}
info(`Using restaurant ${restaurant._id} (${restaurant.slug})`);

const tastyDiner = await mongoose.connection
  .collection("diners")
  .findOne({ tasteConfidence: { $gte: 0.4 } }, { projection: { _id: 1, tasteConfidence: 1 } });
if (tastyDiner) {
  info(`Using diner ${tastyDiner._id} with tasteConfidence=${tastyDiner.tasteConfidence?.toFixed?.(3)}`);
} else {
  info("No diner with tasteConfidence ≥ 0.4 — Probe 3 will degrade gracefully.");
}

await mongoose.disconnect();

// #1 anonymous → popular
{
  const r = await fetch(`${BASE}/api/ai/for-you?restaurantId=${restaurant._id}&k=6`);
  const body = await r.json();
  const ok =
    r.status === 200 &&
    body.success &&
    body.source === "popular" &&
    body.fallback === true &&
    Array.isArray(body.items);
  if (ok) pass(`Probe 1 anonymous → popular fallback (${body.items.length} items)`);
  else fail(`Probe 1 anonymous: status=${r.status} source=${body.source} fallback=${body.fallback}`);
}

// #2 missing restaurantId
{
  const r = await fetch(`${BASE}/api/ai/for-you?k=4`);
  if (r.status === 400) pass("Probe 2 missing restaurantId → 400");
  else fail(`Probe 2 missing restaurantId: status=${r.status}`);
}

// #3 confident diner → ideally taste, but degrade is OK
if (tastyDiner) {
  const r = await fetch(`${BASE}/api/ai/for-you?restaurantId=${restaurant._id}&dinerId=${tastyDiner._id}&k=6`);
  const body = await r.json();
  if (r.status !== 200 || !body.success) {
    fail(`Probe 3 confident diner: status=${r.status} success=${body.success}`);
  } else if (body.source === "taste" && body.fallback === false) {
    pass(`Probe 3 confident diner → taste-based (${body.items.length} items, confidence=${body.confidence.toFixed(3)})`);
  } else if (body.source === "popular") {
    info(`Probe 3 confident diner returned popular fallback — likely no items in this restaurant have embeddings yet, or vector search filtered everything out. Confidence=${body.confidence.toFixed(3)}`);
    pass("Probe 3 returned a valid 200 with items (graceful degrade)");
  } else {
    fail(`Probe 3 unexpected: source=${body.source} fallback=${body.fallback}`);
  }
} else {
  info("Skipping Probe 3 — no confident diner available.");
}

// #4 chat with dinerId
{
  const r = await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "What do you recommend?" }],
      restaurantId: restaurant._id,
      dinerId: tastyDiner?._id?.toString() || null,
    }),
  });
  const body = await r.json();
  if (r.status === 200 && body.success && typeof body.message === "string") {
    pass(`Probe 4 chat with dinerId → 200 success (msg: "${body.message.slice(0, 60)}${body.message.length > 60 ? "…" : ""}")`);
  } else {
    fail(`Probe 4 chat: status=${r.status} success=${body.success} error=${body.error}`);
  }
}

const passed = results.filter((r) => r.pass).length;
console.log(`\n${passed}/${results.length} probes passed.`);
process.exit(passed === results.length ? 0 : 1);
