# Pillar 3 — Implementation Plan & Task Tracker

> Companion to `piller3.md` (the architecture). This is the **executable plan** for the YC demo sprint: what gets built, in what order, with checkboxes to track progress.

**Last updated:** 2026-05-14 (Steps 0, 1 verified end-to-end; Step 2 code complete, awaiting fresh-order verification)
**Target:** YC demo (90-second magic moment) — cross-restaurant taste recognition working end-to-end.
**Estimated total:** 5–7 focused engineering days; 12–14 calendar days realistic.

---

## Status legend

- `[x]` done
- `[~]` in progress
- `[ ]` todo
- `[-]` deferred to V1 production (post-demo)

---

## Where we are today

| Pillar | State | Evidence in repo |
|---|---|---|
| Pillar 1 — Vision menu ingestion | `[x]` shipped | `app/api/menu/ingest/route.ts`, `components/admin/MenuIngestModal.tsx` |
| Pillar 2 — RAG AI waiter | `[x]` shipped | `lib/rag.ts`, `lib/embeddings.ts`, `app/api/ai/chat/route.ts` |
| Pillar 3 — Pre-understood diner | `[~]` Step 1 done | Diner model + identity routes + customer-page hook |
| Step 0 — Order hardening | `[x]` complete (4/4 security probes pass; 3 manual cancel-flow checks remain) | All three fixes + schema prep + `scripts/step0-probes.mjs` |
| Step 1 — Diner model + opportunistic linking | `[x]` complete (5/5 API probes pass; browser smoke remains) | `lib/models/Diner.js`, `lib/diner.ts`, `/api/diner/resolve`, `/api/diner/attach-phone`, customer page + RazorpayCheckout wiring, `scripts/step1-probes.mjs` |

---

## High-level sequence

- [x] **Step 0** — Order hardening (prerequisite, ~1 day) — code complete; 4/4 automated security probes pass
- [x] **Step 1** — Minimal Diner schema + opportunistic linking (~0.5 day) — verified end-to-end (5/5 API probes + 4/4 browser checks)
- [~] **Step 2** — Taste vector computation (~0.5 day) — code complete; awaiting fresh-order verification
- [ ] **Step 3** — Cross-restaurant retrieval (~0.5 day)
- [ ] **Step 4** — Restaurant-facing context card (~0.5 day)
- [ ] **Step 5** — Seeded demo data (~2–3 hours)
- [ ] **Step 6** — UX polish (~2–3 days)

**Decision made:** Step 0 first, then Steps 1–6 in order. Engineering rigor over visible-progress momentum.

---

## Step 0 — Order hardening (PREREQUISITE)

**Why this is first:** the same routes Pillar 3 has to touch already contain three real bugs. Fixing them while you're in the file is opportunistic refactoring at near-zero extra cost. Fixing them after Pillar 3 ships costs significantly more (re-verify routes you thought were done).

**Hard scope boundary:** only the three fixes + schema prep below. No `tipAmount`, no `notes`, no soft-delete, no diner session model. Park those in `tech-debt.md` if/when they come up.

### Fix 1 — Server-side total recomputation

**Bug:** `POST /api/orders` accepts `baseTotal`, `gstAmount`, `platformFee`, `finalAmount` from the client body and persists them verbatim (`app/api/orders/route.ts:79-98`). A customer can pay ₹50 for ₹500 of food.

- [x] Create `lib/billing.ts` with single exported `computeBilling({ restaurantId, items })` function
  - Fetches restaurant (for `gstPercentage`)
  - Fetches each item (for current `price`)
  - Validates every item's `restaurantId` matches input (tenant-isolation check, free here)
  - Returns full `BillingBreakdown` (baseTotal, gstAmount, platformFee, finalAmount, restaurantEarnings, myEarnings)
  - Throws `BillingError` (with HTTP status) on any item missing, cross-tenant, or invalid
- [x] Refactor `app/api/payments/create-order/route.ts` to call `computeBilling` — Razorpay order amount derives from server-computed `finalAmount`
- [x] Refactor `app/api/orders/route.ts` POST handler — accept only `{ restaurantId, tableSlug, items: [{ itemId, qty }], razorpayOrderId, razorpayPaymentId, dinerId?, customerPhone? }`. Drop all client-supplied billing fields.
  - Also added: fetch Razorpay order via SDK and assert `order.amount === breakdown.finalAmount * 100` (rejects post-payment item substitution with 409)
- [x] Audit `app/api/payments/verify/route.ts` — signature alone is sufficient now that the order_id is anchored to the server-computed amount at create-order time. Documented the chain of trust in a top-of-file comment; no code change.
- [x] Update `components/RazorpayCheckout.tsx` — stop sending billing fields; only send `items`.

**Acceptance:** posting a tampered `finalAmount` in the request body has zero effect on the persisted order.

### Fix 2 — Cancel authorization

**Bug:** `POST /api/orders/[id]/cancel` accepts a 5-min-window cancel from anyone with the order ID.

- [x] Create `lib/cancelToken.ts` with `issueCancelToken(orderId, createdAt)` and `verifyCancelToken(orderId, createdAt, token)` using HMAC-SHA256 truncated to 16 hex chars. New env: **`CANCEL_TOKEN_SECRET`** (>=16 chars).
- [x] `POST /api/orders` returns `cancelToken` in the response payload
- [x] `components/RazorpayCheckout.tsx` stores `cancelToken` in `localStorage` keyed by orderId (`bawarchie:cancelToken:<orderId>`)
- [x] `POST /api/orders/[id]/cancel` no longer trusts `cancelledBy` from body — derives it from credentials:
  - Admin session whose restaurant owns this order → admin cancel (any time)
  - Valid `cancelToken` bound to this order → customer cancel (5-min window)
  - Neither → 401
- [x] Token expires hard at 5 min inside `verifyCancelToken` (defense in depth — independent of the route's timing check)
- [x] `app/order-success/order-success.tsx` reads token from localStorage and sends it as `cancelToken` in cancel body
- [ ] **ACTION REQUIRED:** add `CANCEL_TOKEN_SECRET=<>=16 char random>` to `.env` before booting the dev server

**Acceptance:** cancel without a valid token returns 401; admin cancel still works.

### Fix 3 — Read authorization

**Bug:** `GET /api/orders?restaurantId=...` and `GET /api/orders/[id]` are open.

- [x] `GET /api/orders` — `requireAuth`; restaurant role derives `restaurantId` from session, super-admin may pass `?restaurantId=`. Mismatch → 403.
- [x] `GET /api/orders/[id]` — accepts admin auth OR a valid `cancelToken` via `x-cancel-token` header. No token + no session → 401.
- [x] `PATCH /api/orders/[id]` — derives ownership from session, no longer accepts `restaurantId` from body.
- [x] `app/order-success/order-success.tsx` passes the stored token via `x-cancel-token` header on fetch.

**Acceptance:** scraping orders without auth returns 401.

### Cleanup — schema prep for Step 1

While in `lib/models/Order.js`, add fields/index that Step 1 needs. **No logic uses them yet** — just schema setup so Step 1 doesn't require a migration.

- [x] Add `dinerId: { type: ObjectId, ref: "Diner", default: null }`
- [x] Add `customerPhone: { type: String, default: null }`
- [x] Add `updatedAt` via Mongoose `timestamps: { createdAt: false, updatedAt: true }` (kept the explicit `createdAt` field to avoid breaking existing reads)
- [x] Add compound index `{ dinerId: 1, createdAt: -1 }` (sparse)
- [x] Existing index `{ restaurantId: 1 }` retained.
- Note: `POST /api/orders` accepts and persists `dinerId` + `customerPhone` already, but Step 1 wires the actual diner identity hook on the customer page. For now these stay null on real orders.

### Smoke test (end of Step 0)

Automated via `node scripts/step0-probes.mjs` against a running dev server:
- [x] `npx tsc --noEmit` passes (pre-existing push-notification errors unrelated)
- [x] `CANCEL_TOKEN_SECRET` set in `.env` (64-char hex)
- [x] Happy path: order placed end-to-end through Razorpay; persisted `finalAmount` matches paid amount (proven by dev-server logs + working order-success page)
- [x] **Probe 2** — tampered client billing fields ignored; server-computed `finalAmount` wins
- [x] **Probe 3** — cross-tenant item rejected with 403
- [x] **Probe 7** — `GET /api/orders` unauthenticated → 401
- [x] **Probe 8** — `GET /api/orders/[id]` with no session and no `x-cancel-token` → 401

Manual checks remaining (not automated — need browser + localStorage + wall-clock wait):
- [ ] **Probe 4** — Place fresh order, on `/order-success` clear `localStorage["bawarchie:cancelToken:<id>"]`, click Cancel → 401 with `reason="missing"`
- [ ] **Probe 5** — Place fresh order, click Cancel within 5 min → 200, order status = `cancelled` (or `refunded` if paid via Razorpay)
- [ ] **Probe 6** — Place fresh order, wait 5+ minutes, click Cancel → 400 with `reason="expired"`
- [ ] Commit. Push.

Out-of-scope fixes landed during testing (free wins, not in Step 0 plan):
- [x] `order-success` "Order more items" link uses stored `restaurantId.slug` instead of slugifying `name` (was producing `test-resturent-` with trailing dash because of a trailing space in the name)
- [x] `GET /api/orders/[id]` populate now includes `slug`

---

## Step 1 — Minimal Diner schema + opportunistic linking (~0.5 day)

### New file: `lib/models/Diner.js`

```js
{
  uuid: { type: String, required: true, unique: true, index: true },
  phoneHash: { type: String, sparse: true, unique: true }, // SHA-256(E.164)
  tasteVector: { type: [Number], default: null, select: false }, // 768-dim
  tasteVectorUpdatedAt: { type: Date, default: null },
  tasteConfidence: { type: Number, default: 0 }, // 0-1
  dietaryPrefs: {
    persistent: {
      avoid: [String],   // e.g. ["refined_grain", "high_oil"]
      prefer: [String],  // e.g. ["high_protein_density"]
      hardFilters: {     // dietary class — non-negotiable
        isVeg: Boolean,
        isVegan: Boolean,
        allergens: [String],
      },
    },
    // transient prefs are session-scoped, never stored
  },
  consentState: {
    crossRestaurantRecommendations: { type: Boolean, default: false },
    tasteProfileStorage: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}
```

### Tasks

- [x] Create `lib/models/Diner.js` with the schema above + `state` enum (anonymous/opportunistic/identified)
- [x] Create `lib/diner.ts` exporting:
  - `getOrCreateDinerByUuid(uuid)` → upsert anonymous diner
  - `attachPhoneHash(dinerId, phone)` → SHA-256, set state to `opportunistic`; returns `{ ok, diner }` or `{ ok: false, merge: { existingDinerId, reason } }` on phone collision
  - `hashPhone(phone)` → pure helper, normalizes to digits-only before hashing
- [x] Create `app/api/diner/resolve/route.ts` POST — `{ uuid }` → `{ success, dinerId, state, tasteConfidence, dietaryPrefs }`
- [x] Create `app/api/diner/attach-phone/route.ts` POST — `{ dinerId, phone }` → 200 on bind, 409 with merge marker on collision
- [x] Edit `app/r/[restaurantSlug]/t/[tableSlug]/page.tsx`:
  - On mount: read/write `localStorage["bawarchie:dinerUuid"]` (uses `crypto.randomUUID()` with a fallback)
  - Call `/api/diner/resolve` once
  - Hold returned `dinerId` in component state and pass to `RazorpayCheckout`
- [x] Edit `components/RazorpayCheckout.tsx`: add `dinerId` prop, forward in `POST /api/orders`
- [x] Server-side phone attach: `POST /api/orders` now fetches Razorpay payment in parallel with the order, extracts `contact`, stores on Order as `customerPhone`, and fires `attachPhoneHash(dinerId, contact)` opportunistically. Clean: no client wiring needed for phone binding.
- [x] Edit `app/api/orders/route.ts` POST — accepts and persists `dinerId`, `customerPhone`
- [x] `scripts/step1-probes.mjs` — 5/5 pass (resolve idempotency, attach-phone, collision-merge marker, bad input)

**Demo shortcut:** for the YC demo recording, hardcode the demo diner's UUID and skip the phone-attach flow entirely. For V1, do the full opportunistic merge.

---

## Step 2 — Taste vector computation (~0.5 day)

### New file: `lib/taste.ts`

```ts
export async function recomputeTasteVector(dinerId: string): Promise<{
  vector: number[];
  confidence: number;
}>
```

### Logic

1. Load all orders for this diner across all restaurants (cross-tenant read — this is the *only* allowed cross-tenant path)
2. Expand orders → flat list of `{ itemId, orderedAt, qty }`
3. For each item, fetch stored `embedding` (768-dim) — `.select("+embedding")` since the field is `select: false`
4. Compute weight per occurrence: `weight = qty × exp(-ageDays / 90) × repeatBoost(itemId)`
   - `repeatBoost`: 1× for first occurrence, 2× for second, 3× for third+ (per §4.3 "twice >> once; thrice = conviction")
5. Weighted average: `taste = normalize(Σ weight_i × embedding_i)`
6. Compute `confidence` from order count + pre-normalization vector magnitude
7. Persist `tasteVector`, `tasteConfidence`, `tasteVectorUpdatedAt` on Diner record

### Tasks

- [ ] Create `lib/taste.ts` with `recomputeTasteVector` per above
- [ ] Hook into `POST /api/orders`: after the order is persisted, fire-and-forget `recomputeTasteVector(dinerId)` if `dinerId` is set
  - V1: synchronous in-request. ~200–500ms added latency, acceptable at MVP scale.
  - V1 production: background job behind the same function signature (no callers change)
- [ ] **Skip for demo:** multi-mode vectors (general + occasion). Single vector is enough.

---

## Step 3 — Cross-restaurant retrieval (~0.5 day)

### Edit `lib/rag.ts` — new shape

Today:
```ts
retrieveRelevantItems(query: string, restaurantId, k) → items
```

New:
```ts
search({
  restaurantId,
  queryText?: string,        // optional — text from chat
  tasteVector?: number[],    // optional — diner's stored vector
  hardFilters?: { isVeg?, isVegan?, allergens? },
  k?: number,
}) → items
```

**Blending rule:**
- `tasteVector` only → use as queryVector directly
- `queryText` only → existing behavior (embed text, search)
- both → `queryVector = 0.6 × textEmbedding + 0.4 × normalize(tasteVector)`

### Tasks

- [ ] Add new exported `search(...)` to `lib/rag.ts` alongside existing `retrieveRelevantItems` (don't break the old signature yet)
- [ ] Edit `app/api/ai/chat/route.ts`:
  - Accept `dinerId` in request body
  - Fetch diner's `tasteVector` (with `.select("+tasteVector")`)
  - Pass both `queryText` (last user message) and `tasteVector` to `search`
  - Add system-prompt line: *"Speak in taste-language only — never reference dishes from other restaurants by name or location."* (§2.5 enforcement at prompt layer)
- [ ] Create `app/api/ai/for-you/route.ts` GET — `?restaurantId=...&dinerId=...`
  - Fetch diner's vector
  - **Confidence gate:** if `tasteConfidence < 0.4`, return popular-fallback (`Item.find({restaurantId, available: true}).sort({...}).limit(8)`) with a flag indicating fallback
  - Otherwise return `search({ restaurantId, tasteVector, hardFilters: diner.dietaryPrefs.persistent.hardFilters })`
- [ ] Edit customer page (`app/r/[restaurantSlug]/t/[tableSlug]/page.tsx`):
  - Add "Picked for your taste" section above the regular menu
  - Populate from `/api/ai/for-you`
  - Show subtle "Based on your taste" eyebrow vs. "Popular tonight" fallback eyebrow

---

## Step 4 — Restaurant-facing context card (~0.5 day)

A new admin-side view that shows operational facts about the diner — **never raw order history** (§5.5 three-tier disclosure).

### New file: `lib/taste/describe.ts`

```ts
describeTasteVector(vector: number[], schema: TagSchema): string
// returns: "Creamy & dairy-leaning. Mild spice. Vegetarian. Comfort-food preference."
```

This is the **only** module allowed to translate vectors into human language. Centralizing it enforces the "taste-language not history-language" rule structurally.

### Tasks

- [ ] Create `lib/taste/describe.ts` — vector → human summary using primitive tag schema
- [ ] Create admin route `app/admin/[slug]/orders/[orderId]/diner-context/page.tsx` (or modal on existing order detail)
- [ ] Show on the page:
  - Dietary class + allergens (operational facts, default disclosure)
  - Taste summary from `describeTasteVector` (service-relevant, opt-in disclosure)
  - Top 3 predicted items from THIS restaurant's menu for this diner
- [ ] Hide all cross-restaurant raw history — not even item names from other restaurants

---

## Step 5 — Seeded demo data (~2–3 hours)

**This is more important than it sounds.** Demo credibility rests on the recommendation being non-trivial, defensible, and clearly taste-driven.

### Demo diner shape

**Profile:** "Creamy, vegetarian-leaning, mild-spice, dairy-loving, North Indian preference."

**Why this shape:**
- Creamy + dairy → strong primitive that travels well (paneer → ricotta → mozzarella)
- Vegetarian → clean hard filter, demonstrably enforced
- Mild spice → differentiated from generic popular items (most popular Indian = medium-spicy)
- Coherent enough that a YC partner reading the orders can predict the recommendation themselves

**Alternative profile (also valid):** non-veg, high-protein, gym-goer. Same architecture; different aesthetic. Pick whichever is more on-brand.

### Restaurant pairing

**Restaurant A:** North Indian / Mughlai. Paneer dishes, dal makhani, butter chicken, kulfi, lassi.
**Restaurant B:** Italian. Four-cheese gnocchi, mushroom risotto, margherita, ricotta-stuffed shells, arrabiata (the deliberate non-match — see "defensive recommendation" below).

**Why:** culturally distant, both have rich dairy/vegetable traditions, visually distinct in demo video, the cross-match is immediately legible ("paneer → ricotta — yes, that's real").

**Pairs to avoid:** two North Indian, two pan-Asian, anything in same broad cuisine family. Collapses the cross-cuisine claim.

### Seeded order history at Restaurant A

6 orders over ~6 weeks, paneer appearing in 4 of 6:

| # | Days ago | Items |
|---|---|---|
| 1 | 38 | Paneer makhani, butter naan, mango lassi |
| 2 | 31 | Paneer butter masala, garlic naan, sweet lassi |
| 3 | 24 | Dal makhani, jeera rice, gulab jamun |
| 4 | 17 | Paneer tikka masala, butter naan, kulfi |
| 5 | 10 | Shahi paneer, naan, mango lassi |
| 6 | 4  | Malai kofta, butter naan, gulab jamun |

Signals produced:
- Paneer in 4/6 → strong ingredient signal
- 100% vegetarian → dietary class
- All creamy/buttery → texture primitive
- All mild → spice tolerance
- Sweet desserts present → sweet-tooth secondary signal
- Lassi → reinforces dairy

### Expected recommendation at Restaurant B

Top "For You" should include:
- **Four-cheese gnocchi** — bullseye (creamy + dairy + veg + mild)
- **Mushroom risotto with parmesan** — strong
- **Margherita pizza** — good
- **Ricotta-stuffed shells** — good

AI waiter framing must be:
> "You tend to enjoy creamy, mild, vegetarian dishes. Our four-cheese gnocchi is the closest match — vegetarian, rich, and shares the texture profile you usually go for."

**Never:**
> "I see you ordered paneer makhani at Restaurant A..."

### Defensive ("not recommended") example

Seed `arrabiata pasta` (spicy) at Restaurant B. In demo, ask the AI waiter about it. It should correctly explain *why it's not a good match*:

> "The arrabiata wouldn't be a strong match — it's spicier than what you usually go for."

This demonstrates **§2.6 calibrated abstention** naturally. Shows the system knows what it doesn't know. Much stronger demo than just "here's the magic recommendation."

### Should the demo diner have orders at Restaurant B too?

**Decision: No (Option A — Stranger).** Restaurant B has never seen them. Purer narrative for YC: "they walk into a new restaurant and get treated like a regular." Mention Option B (returning customer) as realistic future state.

### Seed script tasks

- [ ] Create `scripts/seed-demo.mjs`:
  1. Drop existing demo-* records (idempotent)
  2. Create Restaurant A (Mughlai) — run Pillar 1 ingestion on real menu photo, or load pre-extracted JSON
  3. Create Restaurant B (Italian) — same
  4. Wait for/trigger embedding computation
  5. Create demo Diner with fixed UUID (log to console for paste-into-localStorage)
  6. Create 6 backdated orders at Restaurant A per table above
  7. Trigger `recomputeTasteVector(demoDinerId)`
  8. Run a recommend query against Restaurant B's menu
  9. **Assert:** top-5 results contain ≥2 creamy + vegetarian items. If assertion fails → seed is bad, fix before recording demo.
- [ ] Add to `package.json`: `"seed:demo": "node scripts/seed-demo.mjs"`
- [ ] Document the demo diner UUID + steps in `scripts/seed-demo.README.md`

---

## Step 6 — UX polish (~2–3 days)

The work where founders consistently under-invest. Don't.

- [ ] QR scan → diner identification → "For You" appears in <2 seconds (measure & enforce)
- [ ] "For You" section visually distinct (separate eyebrow, different card style)
- [ ] Confidence indicator on the section (subtle: "Picked for your taste" vs "Popular tonight")
- [ ] AI waiter response language audited — every response speaks taste, never history
- [ ] Restaurant-facing context card feels like an internal tool, not a debug screen
- [ ] Loading states, skeleton placeholders, empty states all polished
- [ ] Test demo flow end-to-end on a real phone over real WiFi at least 10 times before recording
- [ ] Record demo 10 times, ship the best take

---

## Open design decisions

- [x] **Seed: stranger vs returning customer at Restaurant B** → **Option A (Stranger)** for demo clarity
- [x] **Sequencing: Step 0 first vs Steps 1–4 first** → **Step 0 first** for engineering rigor
- [ ] Demo diner profile: creamy vegetarian *or* high-protein gym-goer? (lean creamy vegetarian unless brand reason otherwise)
- [ ] LLM provider for chat in demo: Gemini (already configured) or OpenAI fallback? (default: Gemini)
- [ ] Where the cancel-token secret env var sits (probably `.env` alongside Razorpay secrets)

---

## Deferred to V1 production (post-demo, per §8.2)

Track these separately so they don't bleed into the demo sprint.

- [-] DataAccess seam (refactor pass once routes are stable)
- [-] LLMProvider seam — partially exists in `lib/llm.ts` but embeddings still hard-locked to Gemini; broaden later
- [-] DomainEvent emitter (consequential-write logging)
- [-] `forgetDiner` primitive + UI
- [-] Append-only consent log (event-sourced)
- [-] Diner record merge logic with explicit confirmation
- [-] Multi-mode taste vectors (general + current-occasion)
- [-] Stratified popularity computation (§5.3) + quality blending in retrieval
- [-] Two-track output (exploit + explore bands)
- [-] Three-tier disclosure UI controls for restaurants
- [-] Background-job precomputation of taste vectors
- [-] Real-phone identity resolution UI (currently demo: hardcoded UUID)
- [-] Nutritional data tiers V2 (estimator) and V3 (declared)

---

## Tech-debt parking lot (NOT in scope for Pillar 3)

Found during the Order audit but not blocking Pillar 3. Address when relevant.

- [ ] Order: add `tipAmount`, `notes`/`specialInstructions`, soft-delete flag
- [ ] Order: deprecate the legacy single `total` field once all callers use `finalAmount`
- [ ] `GET /api/orders/[id]` and `cancel` route — review broader auth model after diner sessions exist
- [ ] Add rate limiting on `/api/diner/resolve` (anyone can mint UUIDs)
- [ ] Atlas index audit — confirm `items_vector` index settings match what `lib/rag.ts` expects

---

## How to use this doc

- **Check items off as you complete them.** Don't batch — flip `[ ]` → `[x]` immediately when done.
- **Don't expand scope.** Anything new goes into "Tech-debt parking lot" or "Deferred to V1 production."
- **Update `Last updated` at the top** when you make material changes.
- **When sequencing changes**, update both the High-level sequence AND the affected step section.
- **Before recording the demo**, run `npm run seed:demo` and confirm the assertion passes.
