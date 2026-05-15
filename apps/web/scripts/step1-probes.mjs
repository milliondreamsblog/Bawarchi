// Step 1 smoke probes — Diner identity layer.
// Run with: node scripts/step1-probes.mjs
//
//   #1  POST /api/diner/resolve with new uuid → 200, state=anonymous
//   #2  POST /api/diner/resolve with same uuid → same dinerId (idempotent)
//   #3  POST /api/diner/attach-phone → state=opportunistic, phoneHash set
//   #4  POST /api/diner/attach-phone with different dinerId + same phone → 409 merge marker
//   #5  POST /api/diner/resolve with missing/short uuid → 400
//
// Cleanup at the end: probe diners removed from DB so the seed stays clean.

import "dotenv/config";
import mongoose from "mongoose";
import crypto from "crypto";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const results = [];
function record(name, expected, got, pass, extra = "") {
  results.push({ name, pass });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name} — expected ${expected}, got ${got}${extra ? "  " + extra : ""}`);
}

const uuidA = `probe-${crypto.randomUUID()}`;
const uuidB = `probe-${crypto.randomUUID()}`;
const phone = `+91${Math.floor(7000000000 + Math.random() * 2999999999)}`;
let dinerA = null;
let dinerB = null;

async function probe1_resolveNewUuid() {
  const r = await fetch(`${BASE}/api/diner/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid: uuidA }),
  });
  const body = await r.json();
  dinerA = body.dinerId;
  const ok = r.status === 200 && body.success && body.state === "anonymous" && !!dinerA;
  record("Probe 1  resolve new uuid → anonymous diner", "200 anonymous", `${r.status} ${body.state}`, ok);
}

async function probe2_resolveIdempotent() {
  const r = await fetch(`${BASE}/api/diner/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid: uuidA }),
  });
  const body = await r.json();
  const ok = body.dinerId === dinerA;
  record("Probe 2  resolve same uuid → same dinerId", dinerA, body.dinerId, ok);
}

async function probe3_attachPhone() {
  const r = await fetch(`${BASE}/api/diner/attach-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dinerId: dinerA, phone }),
  });
  const body = await r.json();
  const ok = r.status === 200 && body.success && body.state === "opportunistic";
  record("Probe 3  attach-phone → opportunistic", "200 opportunistic", `${r.status} ${body.state}`, ok);
}

async function probe4_phoneCollision() {
  // Create a second diner, try to bind the same phone — should 409.
  const r0 = await fetch(`${BASE}/api/diner/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid: uuidB }),
  });
  const b0 = await r0.json();
  dinerB = b0.dinerId;

  const r = await fetch(`${BASE}/api/diner/attach-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dinerId: dinerB, phone }),
  });
  const body = await r.json();
  const ok = r.status === 409 && body.merge && body.merge.reason === "phone_collision";
  record("Probe 4  phone collision → 409 merge marker", "409 phone_collision", `${r.status} ${body.merge?.reason}`, ok);
}

async function probe5_badInput() {
  const r = await fetch(`${BASE}/api/diner/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uuid: "" }),
  });
  record("Probe 5  empty uuid → 400", "400", r.status, r.status === 400);
}

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Diner = mongoose.connection.collection("diners");
    const res = await Diner.deleteMany({ uuid: { $in: [uuidA, uuidB] } });
    console.log(`\nCleanup: removed ${res.deletedCount} probe diner(s)`);
    await mongoose.disconnect();
  } catch (e) {
    console.warn("Cleanup failed (non-fatal):", e.message);
  }
}

(async () => {
  console.log(`Running Step 1 probes against ${BASE}\n`);
  try {
    await probe1_resolveNewUuid();
    await probe2_resolveIdempotent();
    await probe3_attachPhone();
    await probe4_phoneCollision();
    await probe5_badInput();
  } catch (e) {
    console.error("PROBE RUN FAILED:", e.message);
  }
  await cleanup();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} probes passed.`);
  process.exit(passed === results.length ? 0 : 1);
})();
