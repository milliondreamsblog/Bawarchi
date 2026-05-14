// Step 2 verifier — inspects the most recent diner that has orders and
// confirms recomputeTasteVector did its work.
//
// Run with: node scripts/step2-verify-latest.mjs
//
// Prerequisites: dev server restarted (so the orders POST imports the new
// taste module), then ONE fresh order placed via the customer flow. The
// fire-and-forget hook in POST /api/orders triggers the recompute.
//
// Expected output when working: vector set, unit-length, dims=768, confidence
// in (0,1], persisted on diner record.

import "dotenv/config";
import mongoose from "mongoose";

const results = [];
const pass = (m) => { results.push({ pass: true }); console.log("✓", m); };
const fail = (m) => { results.push({ pass: false }); console.log("✗", m); };
const info = (m) => console.log("·", m);

await mongoose.connect(process.env.MONGO_URI);

// Find the latest order that has a dinerId.
const latestOrder = await mongoose.connection
  .collection("orders")
  .find({ dinerId: { $ne: null } })
  .sort({ _id: -1 })
  .limit(1)
  .next();

if (!latestOrder) {
  console.error("No orders with dinerId in DB. Place a Step-1-flow order first.");
  await mongoose.disconnect();
  process.exit(1);
}

const dinerId = latestOrder.dinerId.toString();
info(`Latest order: ${latestOrder._id}  placedAt=${latestOrder.createdAt?.toISOString?.()}`);
info(`Linked diner: ${dinerId}`);

const diner = await mongoose.connection
  .collection("diners")
  .findOne({ _id: new mongoose.Types.ObjectId(dinerId) });

if (!diner) {
  fail(`Diner ${dinerId} not found in diners collection`);
  await mongoose.disconnect();
  process.exit(1);
}

info(`  state=${diner.state}  tasteConfidence=${diner.tasteConfidence}  tasteVectorUpdatedAt=${diner.tasteVectorUpdatedAt?.toISOString?.() ?? "null"}`);

// 1. tasteVectorUpdatedAt must be set (proves the hook fired).
if (diner.tasteVectorUpdatedAt) {
  pass("tasteVectorUpdatedAt is set — hook fired");
} else {
  fail("tasteVectorUpdatedAt is null — hook never fired. Did you restart the dev server AND place a fresh order?");
}

// 2. Either we have a vector (items were embedded) or we have an explanation.
if (Array.isArray(diner.tasteVector) && diner.tasteVector.length > 0) {
  if (diner.tasteVector.length === 768) {
    pass("tasteVector has 768 dimensions");
  } else {
    fail(`tasteVector dimension wrong: ${diner.tasteVector.length}`);
  }

  // 3. Unit length within tolerance.
  let magSq = 0;
  for (const v of diner.tasteVector) magSq += v * v;
  const mag = Math.sqrt(magSq);
  if (Math.abs(mag - 1) < 1e-5) {
    pass(`tasteVector is unit length (||v|| = ${mag.toFixed(6)})`);
  } else {
    fail(`tasteVector not unit length: ||v|| = ${mag.toFixed(6)}`);
  }

  // 4. Confidence in (0, 1].
  if (diner.tasteConfidence > 0 && diner.tasteConfidence <= 1) {
    pass(`tasteConfidence in (0, 1] (= ${diner.tasteConfidence.toFixed(3)})`);
  } else {
    fail(`tasteConfidence out of expected range: ${diner.tasteConfidence}`);
  }
} else if (diner.tasteVector === null) {
  // Legitimate case if no items in this diner's orders have embeddings.
  // Walk the orders and confirm that's what's happening.
  const orders = await mongoose.connection
    .collection("orders")
    .find({ dinerId: new mongoose.Types.ObjectId(dinerId), status: { $in: ["pending", "preparing", "served"] } })
    .toArray();
  const itemIds = new Set();
  for (const o of orders) for (const it of o.items || []) itemIds.add(it.itemId.toString());
  const embedded = await mongoose.connection
    .collection("items")
    .countDocuments({ _id: { $in: [...itemIds].map((s) => new mongoose.Types.ObjectId(s)) }, embedding: { $exists: true, $ne: null } });
  info(`Vector is null. Of ${itemIds.size} unique items ordered, ${embedded} have embeddings.`);
  if (embedded === 0) {
    info("→ This is expected when no menu items have been embedded yet.");
    info("  Trigger embedding with: POST /api/admin/embed-items");
    pass("null vector explained — no embedded items, hook handled this case correctly");
  } else {
    fail(`Expected vector but got null while ${embedded} items have embeddings — recompute is broken`);
  }
} else {
  fail(`tasteVector field has unexpected shape: ${typeof diner.tasteVector}`);
}

await mongoose.disconnect();
const passed = results.filter((r) => r.pass).length;
console.log(`\n${passed}/${results.length} checks passed.`);
process.exit(passed === results.length ? 0 : 1);
