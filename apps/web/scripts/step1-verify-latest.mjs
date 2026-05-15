// Step 1 browser-smoke verifier.
// Run AFTER placing a test order: node scripts/step1-verify-latest.mjs
//
// Inspects the most recent Order in MongoDB and confirms the Step 1 plumbing
// actually wrote what it should:
//   - dinerId set on the Order (page passed it, RazorpayCheckout forwarded it)
//   - customerPhone set on the Order (Razorpay payment fetch worked)
//   - linked Diner has state=opportunistic + phoneHash set (attachPhoneHash fired)

import "dotenv/config";
import mongoose from "mongoose";

const fail = (msg) => { console.error("✗", msg); process.exitCode = 1; };
const pass = (msg) => console.log("✓", msg);
const info = (msg) => console.log("·", msg);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Orders = mongoose.connection.collection("orders");
  const Diners = mongoose.connection.collection("diners");

  const order = await Orders.find({}).sort({ _id: -1 }).limit(1).next();
  if (!order) {
    console.error("No orders in DB — place an order first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  info(`Latest order: ${order._id}  (placed ${order.createdAt?.toISOString?.() ?? "?"})`);
  info(`  finalAmount=${order.finalAmount} tableSlug=${order.tableSlug} restaurantId=${order.restaurantId}`);

  // 1. dinerId
  if (order.dinerId) {
    pass(`order.dinerId = ${order.dinerId}`);
  } else {
    fail("order.dinerId is null — page did not forward it (check /api/diner/resolve succeeded and the customer page set dinerId state)");
  }

  // 2. customerPhone
  if (order.customerPhone) {
    const masked = String(order.customerPhone).replace(/(\d{2})\d+(\d{2})/, "$1***$2");
    pass(`order.customerPhone = ${masked} (server fetched it from Razorpay)`);
  } else {
    fail("order.customerPhone is null — Razorpay payment fetch did not return a contact (check the Razorpay test transaction had a phone)");
  }

  // 3. linked Diner state + phoneHash
  if (order.dinerId) {
    const diner = await Diners.findOne({ _id: new mongoose.Types.ObjectId(order.dinerId) });
    if (!diner) {
      fail(`Diner ${order.dinerId} not found in 'diners' collection`);
    } else {
      info(`Linked diner: uuid=${diner.uuid?.slice(0, 8)}…  state=${diner.state}`);
      if (diner.state === "opportunistic") {
        pass(`diner.state = opportunistic (was anonymous; attachPhoneHash promoted it)`);
      } else {
        fail(`diner.state = ${diner.state} (expected opportunistic — attachPhoneHash didn't fire or got merge-blocked)`);
      }
      if (diner.phoneHash && /^[a-f0-9]{64}$/.test(diner.phoneHash)) {
        pass(`diner.phoneHash is a 64-char hex (sha256 OK)`);
      } else {
        fail(`diner.phoneHash invalid or unset: ${diner.phoneHash}`);
      }
    }
  }

  await mongoose.disconnect();
  if (process.exitCode) {
    console.log("\nFAIL — some Step 1 plumbing did not write what it should. See messages above.");
  } else {
    console.log("\nAll Step 1 browser-smoke checks passed.");
  }
})().catch((e) => {
  console.error("Verifier crashed:", e.message);
  process.exit(1);
});
