// Step 0 smoke-test probes — security checks that don't need a browser.
// Run with: node scripts/step0-probes.mjs
//
// Probes covered here:
//   #2  client-supplied billing fields are ignored
//   #3  cross-tenant item rejected with 403
//   #7  GET /api/orders without auth → 401
//   #8  GET /api/orders/[id] without token or session → 401
//
// Probes NOT covered (require browser/Razorpay/wait):
//   #4  Cancel without token → 401   (manual: clear localStorage on order-success, click Cancel)
//   #5  Cancel with token within 5 min → success  (manual: click Cancel right after order)
//   #6  Cancel after 5 min → 400 expired  (manual: wait, then click Cancel)
//
// Probe #1 (happy path) and #9 (admin operations) are already proven by your prior dev-server logs.

import "dotenv/config";
import mongoose from "mongoose";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const results = [];

function record(name, expected, got, pass, extra = "") {
  results.push({ name, expected, got, pass, extra });
  const tick = pass ? "PASS" : "FAIL";
  console.log(`[${tick}] ${name} — expected ${expected}, got ${got}${extra ? "  " + extra : ""}`);
}

async function probe7_listOrdersNoAuth() {
  const r = await fetch(`${BASE}/api/orders?restaurantId=69fc7a6ea6f1cced08672f6a`);
  record("Probe 7  GET /api/orders unauthenticated", "401", r.status, r.status === 401);
}

async function probe8_readOrderNoTokenNoSession() {
  // Pick any real order id; we don't care which — we just want to confirm
  // that without a token and without a session, the read is rejected.
  await mongoose.connect(process.env.MONGO_URI);
  const order = await mongoose.connection.collection("orders").findOne({});
  await mongoose.disconnect();
  if (!order) {
    record("Probe 8  GET /api/orders/[id] no token/no session", "401", "SKIPPED", false, "(no orders in DB)");
    return;
  }
  const r = await fetch(`${BASE}/api/orders/${order._id}`);
  record(`Probe 8  GET /api/orders/${order._id} no token/no session`, "401", r.status, r.status === 401);
}

async function probe3_crossTenantItem() {
  // Need: a restaurantId from one restaurant, an itemId from a different
  // restaurant, plus a real tableSlug that belongs to the first restaurant.
  await mongoose.connect(process.env.MONGO_URI);
  const restaurants = await mongoose.connection
    .collection("restaurants")
    .find({}, { projection: { _id: 1, slug: 1 } })
    .toArray();

  let rA, rB;
  for (const r of restaurants) {
    const itemCount = await mongoose.connection
      .collection("items")
      .countDocuments({ restaurantId: r._id });
    const tableCount = await mongoose.connection
      .collection("tables")
      .countDocuments({ restaurantId: r._id });
    if (itemCount > 0 && tableCount > 0 && !rA) rA = r;
    else if (itemCount > 0 && rA && r._id.toString() !== rA._id.toString() && !rB) rB = r;
  }
  if (!rA || !rB) {
    await mongoose.disconnect();
    record("Probe 3  cross-tenant item", "403", "SKIPPED", false,
      "(need ≥2 restaurants with items + a table on the first)");
    return;
  }
  const tableA = await mongoose.connection
    .collection("tables")
    .findOne({ restaurantId: rA._id });
  const itemB = await mongoose.connection
    .collection("items")
    .findOne({ restaurantId: rB._id });
  await mongoose.disconnect();

  const r = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tableSlug: tableA.slug,
      restaurantId: rA._id.toString(),
      items: [{ itemId: itemB._id.toString(), qty: 1 }],
    }),
  });
  const body = await r.json().catch(() => ({}));
  record(
    `Probe 3  cross-tenant item (rA=${rA.slug}, item from rB=${rB.slug})`,
    "403",
    r.status,
    r.status === 403,
    body.error ? `(${body.error})` : ""
  );
}

async function probe2_tamperedBillingIgnored() {
  // Structural verification: send extra billing fields in the POST body and
  // confirm the server-persisted breakdown is computed from items, not from
  // those client values. We use a real itemId+restaurantId+tableSlug; no
  // Razorpay IDs so the Razorpay cross-check is skipped (this is acceptable
  // because we're testing the billing-field-rejection behavior in isolation).
  await mongoose.connect(process.env.MONGO_URI);
  const restaurants = await mongoose.connection
    .collection("restaurants")
    .find({}, { projection: { _id: 1, slug: 1, gstPercentage: 1 } })
    .toArray();
  let chosen, table, item;
  for (const r of restaurants) {
    const t = await mongoose.connection
      .collection("tables")
      .findOne({ restaurantId: r._id });
    const i = await mongoose.connection
      .collection("items")
      .findOne({ restaurantId: r._id });
    if (t && i) { chosen = r; table = t; item = i; break; }
  }
  if (!chosen) {
    await mongoose.disconnect();
    record("Probe 2  tampered billing fields ignored", "server-computed total", "SKIPPED", false,
      "(no restaurant with both a table and an item)");
    return;
  }

  const trueBase = item.price * 1; // qty=1
  const gst = (trueBase * (chosen.gstPercentage || 0)) / 100;
  const platformFee = ((trueBase + gst) * 2) / 100;
  const trueFinal = Math.round((trueBase + gst + platformFee) * 100) / 100;

  const r = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tableSlug: table.slug,
      restaurantId: chosen._id.toString(),
      items: [{ itemId: item._id.toString(), qty: 1 }],
      // Garbage billing fields the server MUST ignore:
      baseTotal: 0.01,
      gstAmount: 0,
      platformFee: 0,
      finalAmount: 0.01,
      restaurantEarnings: 0.01,
      myEarnings: 0,
      total: 0.01,
    }),
  });
  const body = await r.json().catch(() => ({}));

  // Clean up the probe order so we don't pollute the DB.
  if (body?.order?._id) {
    await mongoose.connect(process.env.MONGO_URI);
    await mongoose.connection.collection("orders").deleteOne({ _id: new mongoose.Types.ObjectId(body.order._id) });
    // Also free the table we marked occupied.
    await mongoose.connection.collection("tables").updateOne(
      { slug: table.slug, restaurantId: chosen._id },
      { $set: { status: "free", occupiedAt: null, currentOrderId: null } }
    );
    // Restore stock if the route decremented it.
    if (item.stock > 0) {
      await mongoose.connection.collection("items").updateOne(
        { _id: item._id },
        { $inc: { stock: 1 }, $set: { available: true } }
      );
    }
    await mongoose.disconnect();
  }

  if (r.status !== 201) {
    record("Probe 2  tampered billing fields ignored", "201 + server-computed total", `${r.status}`, false,
      body.error ? `(${body.error})` : "");
    return;
  }
  const persistedFinal = body.order?.finalAmount;
  const ok = Math.abs(persistedFinal - trueFinal) < 0.01;
  record(
    "Probe 2  tampered billing fields ignored",
    `finalAmount=${trueFinal}`,
    `finalAmount=${persistedFinal}`,
    ok,
    ok ? "" : "(server trusted client values!)"
  );
}

(async () => {
  console.log(`Running Step 0 probes against ${BASE}\n`);
  try {
    await probe7_listOrdersNoAuth();
    await probe8_readOrderNoTokenNoSession();
    await probe3_crossTenantItem();
    await probe2_tamperedBillingIgnored();
  } catch (e) {
    console.error("PROBE RUN FAILED:", e.message);
    process.exit(1);
  }
  console.log("");
  const passed = results.filter((r) => r.pass).length;
  console.log(`${passed}/${results.length} probes passed.`);
  process.exit(passed === results.length ? 0 : 1);
})();
