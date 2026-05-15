// Step 4 smoke probes — restaurant-facing diner context.
// Run with: node scripts/step4-probes.mjs
//
//   #1  Unauthenticated GET /api/admin/diner-context/<id> → 401
//   #2  Authenticated GET against an order with no dinerId → hasContext: false
//   #3  Authenticated GET against an order WITH a dinerId → hasContext: true,
//       taste summary present, predictedItems is an array, no field named
//       "orderHistory" / "previousOrders" / restaurant names from elsewhere
//
// Authenticates as super-admin using NextAuth credentials flow.

import "dotenv/config";
import mongoose from "mongoose";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const SUPER_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_PASS = process.env.SUPER_ADMIN_PASSWORD;

const results = [];
const pass = (m) => { results.push({ pass: true }); console.log("✓", m); };
const fail = (m) => { results.push({ pass: false }); console.log("✗", m); };
const info = (m) => console.log("·", m);

// Tiny cookie jar — extract from Set-Cookie, forward on each request.
const jar = new Map();
function applyCookies(setCookieList) {
  for (const raw of setCookieList || []) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}
function cookieHeader() {
  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}
async function fetchJar(url, init = {}) {
  const headers = { ...(init.headers || {}) };
  if (jar.size) headers.Cookie = cookieHeader();
  const r = await fetch(url, { ...init, headers, redirect: "manual" });
  const setCookieRaw = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  applyCookies(setCookieRaw);
  return r;
}

async function signInSuperAdmin() {
  // NextAuth credentials flow: GET csrf → POST /callback/credentials with token + creds.
  const csrfRes = await fetchJar(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  if (!csrfToken) throw new Error("No csrfToken returned");

  const form = new URLSearchParams({
    csrfToken,
    email: SUPER_EMAIL,
    password: SUPER_PASS,
    callbackUrl: BASE,
  });
  const cb = await fetchJar(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  // NextAuth returns a redirect on success — we use redirect:manual so we get 302.
  // Session cookie should now be in the jar.
  if (cb.status >= 400) throw new Error(`Sign-in failed with ${cb.status}`);

  const sess = await fetchJar(`${BASE}/api/auth/session`);
  const sessionBody = await sess.json();
  if (!sessionBody?.user?.role) {
    throw new Error("Sign-in succeeded but session has no user/role");
  }
  return sessionBody;
}

// ── Run ────────────────────────────────────────────────────────────────

// Pick orders from DB.
await mongoose.connect(process.env.MONGO_URI);
const anonOrder = await mongoose.connection
  .collection("orders")
  .findOne({ $or: [{ dinerId: null }, { dinerId: { $exists: false } }] }, { projection: { _id: 1 } });
const dinerOrder = await mongoose.connection
  .collection("orders")
  .find({ dinerId: { $ne: null } })
  .sort({ _id: -1 })
  .limit(1)
  .next();
await mongoose.disconnect();

if (!dinerOrder) {
  console.error("No order with a dinerId in DB. Place a Step-1-flow order first.");
  process.exit(1);
}
info(`Using diner order ${dinerOrder._id}`);
if (anonOrder) info(`Using anon order ${anonOrder._id}`);

// #1 unauthenticated
{
  const r = await fetch(`${BASE}/api/admin/diner-context/${dinerOrder._id}`);
  if (r.status === 401) pass("Probe 1 unauthenticated → 401");
  else fail(`Probe 1 unauthenticated: status=${r.status}`);
}

// Sign in.
try {
  const sess = await signInSuperAdmin();
  info(`Signed in as ${sess.user.email} (role=${sess.user.role})`);
} catch (e) {
  fail("Sign-in failed: " + e.message);
  console.log(`\n${results.filter((r) => r.pass).length}/${results.length} probes passed.`);
  process.exit(1);
}

// #2 anon order
if (anonOrder) {
  const r = await fetchJar(`${BASE}/api/admin/diner-context/${anonOrder._id}`);
  const body = await r.json();
  if (r.status === 200 && body.success && body.hasContext === false) {
    pass("Probe 2 anonymous order → hasContext: false");
  } else {
    fail(`Probe 2 anon order: status=${r.status} hasContext=${body.hasContext} err=${body.error}`);
  }
}

// #3 diner order
{
  const r = await fetchJar(`${BASE}/api/admin/diner-context/${dinerOrder._id}`);
  const body = await r.json();
  if (r.status !== 200 || !body.success) {
    fail(`Probe 3 diner order: status=${r.status} err=${body.error}`);
  } else if (body.hasContext !== true) {
    fail(`Probe 3 diner order: hasContext=${body.hasContext} (expected true)`);
  } else if (typeof body.taste?.summary !== "string") {
    fail(`Probe 3 diner order: missing taste.summary`);
  } else if (!Array.isArray(body.predictedItems)) {
    fail(`Probe 3 diner order: predictedItems is not an array`);
  } else {
    // Verify privacy boundary at the response shape: no fields that leak.
    const leakFields = ["orderHistory", "previousOrders", "pastOrders", "otherRestaurants"];
    const leaks = leakFields.filter((f) => Object.prototype.hasOwnProperty.call(body, f));
    if (leaks.length) {
      fail(`Probe 3 leak: response contains ${leaks.join(", ")}`);
    } else {
      pass(`Probe 3 diner order → hasContext:true summary="${body.taste.summary.slice(0, 60)}…" predictedItems=${body.predictedItems.length}`);
    }
  }
}

const passed = results.filter((r) => r.pass).length;
console.log(`\n${passed}/${results.length} probes passed.`);
process.exit(passed === results.length ? 0 : 1);
