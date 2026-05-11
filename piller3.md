# Bawarchie — Complete System Architecture

**Status:** Living document. Last updated in the architecture session.
**Audience:** Founders, co-builders, future engineers.
**Scope:** All three pillars, all layers, all seams. V1 implementation and evolution path.

---

## Part 1 — What Bawarchie is, in one paragraph

Bawarchie is a dine-in restaurant platform whose core promise is the **pre-understood diner**: every diner who walks into any participating restaurant arrives with a portable taste profile derived from their orders at every other participating restaurant, enabling the restaurant to recommend, serve, and accommodate them as if they were a regular — without requiring login, surveys, or cross-restaurant disclosure of raw order history. The platform's defensibility comes from a two-sided network effect: restaurants want pre-understood diners, diners want every restaurant to treat them as a regular, and the moat is the cross-restaurant taste graph that competitors cannot replicate by copying features alone.

---

## Part 2 — Foundational architectural commitments

These are the load-bearing decisions made during architecture design. Everything downstream rests on them. They are not optional.

### 2.1 Data ownership model

Bawarchie owns the data. Restaurants and diners are both users of the platform. The platform absorbs the regulatory load in exchange for the cleanest possible moat structure. This is "Option 3" from the early data-ownership discussion.

### 2.2 Three-entity model with platform-level Diner

The three first-class entities are `Restaurant`, `Diner`, and `Order`. `Diner` is a platform-level entity, not subordinate to any `Restaurant`. `Order` is the join entity belonging to one `Restaurant` and one `Diner`. This inversion of the conventional restaurant-SaaS data model is what makes cross-restaurant taste portability possible.

### 2.3 Raw history is tenant-isolated; taste representation is platform-shared

This is the foundational privacy principle. The order log produced by a diner at restaurant A is visible to restaurant A only. The derived taste representation (the abstraction of who this person is as a diner) is platform-portable. Restaurants see _predictions_, never _evidence_. This is structurally analogous to how a credit score works.

### 2.4 The tag schema is the moat artifact

Menu items are tagged at the primitive level — ingredients, textures, cooking methods, flavor axes, dietary class, heaviness, occasion — not at the cuisine/dish-name level. This is what makes cross-cuisine matching work via vector geometry. Two competitors with the same Gemini API and the same MongoDB Atlas Vector Search produce wildly different recommendation quality based on this one upstream design choice.

### 2.5 Predictions portable, raw data isolated

A consequence of 2.3, restated as an engineering principle: the AI waiter speaks in taste-language, never history-language. The retrieval layer must not pull in or be allowed to reference specific past orders by restaurant. Prompt templates must enforce this.

### 2.6 Calibrated abstention is a feature

The system must be allowed to say "I don't have a strong read on your taste at this restaurant, here's tonight's popular instead." Confidently bad recommendations destroy trust faster than honest uncertainty. This applies at every layer that produces user-facing output.

### 2.7 Graduated trust UX

The system behaves differently for anonymous, opportunistically-linked, and fully-identified diners. Consent is structural, not a checkbox. The Diner record carries identity state and the AI waiter adapts its language to match.

---

## Part 3 — The three pillars

### 3.1 Pillar 1 — Vision menu ingestion (shipped)

Restaurant owner uploads a photo or PDF of their menu. A multimodal LLM extracts items, prices, descriptions, and primitive-level tags. Owner reviews and edits. System persists items, embeds each one in a 768-dim Gemini space, and indexes them in MongoDB Atlas Vector Search.

**Components:**

- `app/api/menu/ingest/route.ts` — vision endpoint
- `components/admin/MenuIngestModal.tsx` — 4-step modal
- Tag schema applied at extraction time (see 5.1)

**Value:** Reduces restaurant onboarding from days (manual entry of 60+ items) to roughly 5 minutes. This is the wedge that gets restaurants onto the platform.

### 3.2 Pillar 2 — RAG-grounded AI waiter (shipped, verification pending)

When a diner chats with the AI waiter, the system retrieves the 8 most relevant menu items from this restaurant via Atlas Vector Search, grounds the LLM in those items, and returns a recommendation. Replaces the "stuff the whole menu into the prompt" pattern that doesn't scale.

**Components:**

- `lib/embeddings.ts` — Gemini gemini-embedding-001 @ 768 dims
- `lib/rag.ts` — Atlas `$vectorSearch` with restaurantId + available filters
- `lib/models/Item.js` — embedding fields on Item documents
- `app/api/ai/chat/route.ts` and `app/api/ai/recommend/route.ts`
- Atlas index `items_vector` (768 dims, cosine, restaurantId + available filters)

**Pending:** End-to-end smoke test after the model swap to gemini-2.5-flash-lite.

### 3.3 Pillar 3 — Pre-understood diner system (the moat)

The identity layer, taste graph, retrieval logic, and consent framework that turn Pillars 1 and 2 from per-restaurant tools into a platform-network product. This is the new pillar that replaces "demand forecasting" from the original three-pillar scope. The full structural and runtime architecture is laid out in Part 4.

---

## Part 4 — Pillar 3 in detail (four layers)

### 4.1 Layer A — Identity and consent

The platform layer underneath everything. This is the foundation that cannot be retrofitted cheaply.

**Sub-components:**

- **Diner record** — UUID primary key, optional phoneHash (SHA-256 of E.164), identity state (anonymous / opportunistic / identified), creation timestamp.
- **Consent log** — append-only event sourced. Each entry: `{ dinerId, scope, grantedAt, mechanism, revokedAt? }`. Scopes include `cross_restaurant_recommendations`, `marketing_messages`, `analytics`, `taste_profile_storage`, `dietary_data_storage`.
- **Forget primitive** — `forgetDiner(dinerId)` operation that nullifies the Diner record, replaces dinerId references in Orders with `__forgotten__` sentinel, deletes taste vectors and dietary profile, revokes all consents, writes deletion audit entry.

**Identity resolution mechanics (deferred for full design):**

- First scan → localStorage UUID issued, Diner record created in anonymous state
- Diner provides phone at Razorpay → phoneHash computed, attached to Diner record
- If phoneHash matches an existing Diner record → merge logic with consent reconciliation
- All merges require explicit confirmation; no silent merging

**For YC demo:** hardcode demo diner UUID, skip identity resolution UI.
**For V1:** full UUID + phoneHash + opportunistic merge.

### 4.2 Layer B — Tenant data (isolated)

Restaurant-scoped data. Each Restaurant is a tenant; data inside the tenant boundary belongs to that tenant.

**Sub-components:**

- **Menu** — Items, categories, modifiers. Each Item carries the structured primitive tag schema and the 768-dim embedding. Already in place via Pillar 1.
- **Orders** — Tenant-scoped. References dinerId for the taste graph pipeline; the restaurant view filters strictly by restaurantId.
- **Quality signals** — Stratified popularity by price quartile, weighted by reorder rate. Computed asynchronously from order history (see 5.3).
- **Allergen rigor flag** — Restaurant self-declares the rigor of their allergen tagging. AI waiter language adapts.

**Critical isolation property:** Orders are dual-indexed (`{restaurantId, createdAt}` for restaurant queries; `{dinerId, createdAt}` for taste pipeline). Restaurant queries must never reach the dinerId index path. Enforced at the DataAccess seam (see 6.1).

### 4.3 Layer C — The taste graph (derivation pipeline)

The only layer with cross-tenant read access. Produces abstractions, not raw data exports.

**Sub-components:**

- **Taste vectors** — Multi-mode, context-conditional. At minimum two per diner: a general vector (all orders, time-decayed) and a current-occasion vector (orders matching current time-of-day / cuisine context). Stored on the Diner record.
- **Dietary preferences** — Stored at the food-property level, not the medical-condition level. Persistent (saved on Diner record) and transient (session-scoped, never persisted). See 5.2.
- **Tag schema** — Platform-level configuration. The primitive-level structure applied uniformly to all menu items and to taste vector derivation. See 5.1.

**Derivation logic:**

- Weighted aggregation of a diner's orders
- Repeat orders weighted heavily (twice >> once; thrice = conviction)
- Recency-weighted with exponential decay (~90 day half-life)
- Cross-restaurant repeats weighted more than same-restaurant repeats
- Confidence score computed alongside the vector — used by Layer D for abstention

**Operational mode:**

- **V1:** computed at query time when diner scans. Fine at MVP scale (10s of orders per diner).
- **Scale:** precomputed by batch job (daily or after-every-N-orders trigger), stored on Diner record. Context-conditional vector still recomputed at query time as a re-weighting of stored primitives.
- **The interface between Layer C and Layer D is "give me Diner X's taste vector(s)" — the storage-vs-fresh-computation question is a backend concern.**

### 4.4 Layer D — Retrieval and recommendation

The query-time runtime. Combines diner-side, restaurant-side, and situational signals into a ranked recommendation.

**Inputs:**

- Taste vectors (Layer C)
- Diet and allergen preferences (Layer C)
- Hard filters (vegetarian/non-veg/vegan/jain/halal, allergens — non-negotiable)
- Time-of-day and inferred occasion
- Restaurant's menu items + embeddings (Layer B)
- Stratified popularity + reorder rate (Layer B)

**Flow (see runtime flow diagram earlier in conversation):**

1. Resolve identity (Layer A read)
2. Load taste vectors and dietary state (Layer C read)
3. Apply hard filters to the restaurant's menu — remove anything dietary-incompatible
4. Vector search remaining items against taste vectors (cosine similarity in 768-dim space)
5. Blend with quality signal: `final_score = α · taste_similarity + β · stratified_popularity`
6. Confidence check — if top-N similarity below threshold, fall back to "popular tonight"

**Outputs (two-track):**

- **Exploitation track** — "Picked for your taste" — top items by combined similarity × quality
- **Exploration track** — "You might want to try" — one or two items in the novelty band (moderate similarity, one axis of unfamiliarity at a time). Trust budget grows with diner-platform relationship; light or skipped for first-time diners.

**Two destinations:**

- **Diner side** — For You section + AI waiter responses. Speaks in taste-language only.
- **Restaurant side** — Informed-server context card. Shows operational facts (dietary, allergens) and taste summary. Never shows raw history from other restaurants.

**Latency budget:** <500ms end-to-end.

---

## Part 5 — Cross-cutting concerns

### 5.1 The tag schema (the moat artifact)

The structured text fed to the embedder for each menu item. Determines what dimensions of similarity the vector space encodes. Two competitors with the same infrastructure produce wildly different quality based on this schema.

**Primitive axes (high weight in embedding):**

- **Ingredients** — cheese, curd, cream, butter, garlic, tomato, onion, fermented soy, fresh herbs, primary protein
- **Texture/form** — creamy, crispy, chewy, soft, dense, light, soup, noodle, bread-wrap, skewer, rice-bowl
- **Cooking method** — fried, grilled, simmered, raw, steamed, baked, fermented
- **Flavor axes** — spicy, sweet, sour, umami, bitter, smoky, herbaceous
- **Heaviness and occasion** — light snack, heavy main, dessert, side, shareable
- **Dietary class** — veg / non-veg / vegan / jain / halal
- **Diet-property tags** (added per the diet conversation) — `heaviness: light/medium/heavy`, `protein_density: high/medium/low`, `carb_load: low/medium/high`, `oil_level: low/medium/heavy`, `added_sugar: none/low/moderate/high`
- **Categorical flags** — deep_fried, refined_grain, whole_grain, contains_added_sugar, high_sodium, plant_forward

**Secondary axes (low weight):**

- Cuisine label
- Specific dish name

The cuisine field is for filtering ("this restaurant is Italian, search within their menu"), not for similarity weighting. Primitives dominate. This is why spaghetti and ramen become neighbors in vector space — both are "long noodle, savory sauce, slurpable, filling, casual."

**Implementation:** the Pillar 1 vision LLM, at menu ingestion time, outputs this structured tag set per dish. The text fed to the embedder is a deterministic serialization of these tags.

### 5.2 Dietary preferences (diet, not disease)

**Scope:** Diet preferences only. NOT medical conditions. This is a deliberate scope limit. Diet preferences serve a much larger user segment (health-conscious diners) at much lower regulatory risk.

**The food-property pattern:**
The diner expresses preferences in their own words ("I'm cutting back on rice and oil," "I'm trying to hit my protein target"). The system translates to underlying food-property rules (`avoid: [refined_grain, high_oil]`, `prefer: [high_protein_density]`). The medical reason, if any, is never stored — only the food rule.

**Persistent vs. transient:**

- **Persistent** (stored on Diner record) — long-term preferences, e.g. "I avoid added sugar"
- **Transient** (session-scoped only, never stored) — situational, e.g. "I want something light tonight"

**Allergens are a special case:**

- For mild allergies/preferences, treat as a strict filter
- For severe allergies, filter what we can AND surface explicit honesty: "I've filtered known peanut-containing items, but cannot guarantee no cross-contamination. Confirm with restaurant for severe allergies."
- Restaurant self-declares allergen tagging rigor; AI waiter language adapts.

**Nutritional data — three-tier roadmap (per the diet conversation):**

- **V1 (Option C)** — Relative tags only, output by the vision LLM at ingestion. No absolute numbers. AI waiter speaks in relative terms ("lighter side," "higher protein option"). Cost: near-zero added work.
- **V2 (Option A)** — Ingredient parser + IFCT/USDA nutrition database produces estimated absolute numbers. Surfaced only when diner asks. Confidence band disclosed.
- **V3 (Option B)** — Restaurants can declare verified nutritional data. Premium feature.

### 5.3 Quality signals (stratified popularity × reorder rate)

**Why:** Raw popularity is price-confounded — cheap items always outsell expensive ones. Stratified popularity (popularity _within_ a price bracket) is a quality-controlled signal.

**Computation:**

- Bracket each restaurant's menu by price quartile (adaptive per restaurant, not fixed brackets)
- Within each bracket, compute popularity by order count over a recent time window (e.g. 30 days)
- Weight by reorder rate — items that 60% of diners order _twice_ are better quality than items that 100% of diners order _once_
- `quality_signal(item) = popularity_in_bracket × reorder_rate × recency_weight`

**Where used (three places):**

1. Quality prior in Layer D's ranking — `final_score = α · taste_similarity + β · stratified_popularity`
2. Cold-start fallback for diners with no taste profile — show top-seller per bracket
3. Denominator for exploration candidates — stretch recommendations come from items that are unfamiliar to the diner but validated by other diners

**Edge cases to handle:**

- New items have no data — separate cold-start treatment, perhaps imputed via similarity
- Seasonal items — time-windowed popularity (last 30 days) handles this naturally
- Price-changed items — accept as known imperfection in V1

### 5.4 Time-of-day and occasion context

**Inputs:**

- Current time of day, day of week
- Inferred occasion (quick lunch / leisurely dinner / late-night / social weekend / etc.)
- Possibly party size if known (Razorpay payment count, future feature)

**Where used:**

- Filter+rank in Layer D — items tagged for the wrong occasion get demoted
- Disambiguation for multi-mode taste — a diner with both spicy lunch orders and mild dinner orders gets the right mode applied based on current time

### 5.5 Privacy and DPDP compliance

**Structural commitments:**

- Consent log is append-only and event-sourced (one of the few places this matters in V1)
- `forgetDiner` is a first-class primitive built from day one, not retrofitted
- Tenant isolation enforced at the DataAccess seam, not by "we'll remember to filter"
- The AI waiter cannot reference cross-restaurant history in its language (prompt-level enforcement)

**Three-tier disclosure of diner data to restaurants:**

1. **Operational facts** (allergens, dietary class) — shared with restaurant by default. Safety.
2. **Service-relevant signals** (spice preference, sweet tooth, usual spend range) — opt-in.
3. **Cross-restaurant history** — _never_ shared with restaurants. Used only by Layer C for derivation.

**What the restaurant context card shows:** Operational facts + taste summary + predicted preferences for this restaurant's menu. NOT the diner's order log at other restaurants.

---

## Part 6 — The seams (engineering discipline)

These are the abstraction boundaries that make the system evolve cheaply. Senior-engineering hygiene. Each is small to add in V1 and expensive to retrofit later.

### 6.1 DataAccess seam

All reads and writes to the database go through a `DataAccess` layer. V1 implementation is a thin wrapper around Mongoose. The interface enforces:

- Tenant scoping (Order reads must include restaurantId; cross-tenant Order reads are a privileged operation used only by Layer C's derivation pipeline)
- Soft-delete and forget semantics (deletion is a state change, not a destructive operation, except via the explicit `forgetDiner` path)
- Auditability hook (for future event sourcing — see 6.3)

This is the seam where you eventually split OLTP (transactional, low-latency) from OLAP (analytical, high-throughput) without rewriting business logic.

### 6.2 LLMProvider seam

All LLM calls (embedding, chat, vision menu ingestion) go through an `LLMProvider` interface. V1 implementation: Gemini.

**Why this matters:**

- Gemini pricing has changed multiple times in the last year
- Provider outages happen
- Different query types (cheap classification vs. expensive reasoning) benefit from different models
- Enterprise pricing negotiation at scale requires multi-vendor leverage

The right pattern is `LLMProvider.embed(text)`, `LLMProvider.chat(messages)`, `LLMProvider.extractMenu(image)`. The wrong pattern is calling the Gemini SDK directly from route handlers.

### 6.3 DomainEvent seam

Consequential writes (orders placed, consent granted, profile updated, recommendation shown) go through a `DomainEvent` emitter. V1 implementation: writes to MongoDB _and_ logs the event to a structured log. The emit interface gives you a single choke point.

**Why this matters:**

- DPDP audits require "prove this taste vector was derived only from data the diner consented to"
- Analytics and product feedback loops need event streams, not table polling
- Eventually you'll want full event sourcing for compliance-relevant slices

For V1, the emitter is just a function. For V2, it writes to a real event bus. For V3, the event log becomes the source of truth and database state is derived.

---

## Part 7 — Technology choices (V1)

Deliberately boring. The infrastructure should be embarrassingly simple until pain forces otherwise.

**Stack:**

- **Frontend:** Next.js (App Router) + React + Tailwind. Already in place.
- **Backend:** Next.js API routes (TypeScript). Already in place.
- **Database:** MongoDB Atlas, M10 tier. Already in place.
- **Vector search:** Atlas Vector Search (768-dim, cosine). Already in place.
- **LLM provider:** Gemini (2.5 Flash for chat/vision, 2.5 Flash-Lite for high-volume classification, embedding-001 for embeddings). Already in place.
- **Hosting:** Vercel for everything. Already in place.
- **Payments:** Razorpay. Standard for India.
- **Identity:** localStorage UUID + opportunistic phone-hash from Razorpay. No login required for diners.
- **Admin auth:** standard email/password or magic link for restaurant owners.

**What's NOT in V1:**

- No microservices
- No Kubernetes, no Docker (Vercel handles deployment)
- No separate analytical DB (everything in Mongo until pain forces split)
- No Kafka, no event bus (DomainEvent emitter just logs)
- No Redis (Vercel KV available later if caching becomes important)
- No multi-region (Mumbai or Bangalore primary region is enough)
- No background job system (synchronous compute in request path until pain forces split)

This is the right answer for V1. Anything more is wasted effort.

---

## Part 8 — Build sequence

### 8.1 YC demo sprint (2-3 weeks)

The demo's job: prove the magic moment (cross-restaurant taste recognition) happens reliably in 90 seconds.

**Week 1-2 — Make the magic moment real:**

1. Add minimal Diner entity (UUID + taste vector field + diet prefs field)
2. Wire order-saving to update taste vector synchronously
3. Wire QR-scan to load taste vector and run RAG retrieval
4. Seed two restaurants with real menus (Pillar 1 ingestion)
5. Seed one demo diner with 4-5 real orders at restaurant A
6. Verify recommendation at restaurant B is non-trivial and defensible

**Week 2-3 — Polish + record:** 7. Build the restaurant-facing context card (one screen, one query) 8. Polish the diner-facing UX — QR scan to "For You" in <2 seconds 9. Practice the demo. Record it 10 times. Ship the best take. 10. Write the YC application referencing what's visible in the demo.

**Defer for demo:** identity resolution UI, consent UI, payment flow, multi-mode taste vectors, quality blending, two-track output, all of Part 6 seams except possibly LLMProvider.

### 8.2 V1 production sprint (post-YC, ~2-3 months)

Build the full Pillar 3 with the seams in place.

**Phase 1 — Foundation (weeks 1-3):**

- Build the DataAccess, LLMProvider, DomainEvent seams
- Full Layer A — identity resolution, consent log, forgetDiner primitive
- Migrate the demo's hardcoded Diner to the real entity

**Phase 2 — Taste graph (weeks 4-6):**

- Full Layer C — multi-mode taste vectors, dietary preferences, persistent/transient split
- Refined tag schema with primitive-level encoding
- Confidence calibration logic

**Phase 3 — Retrieval + restaurant features (weeks 7-9):**

- Full Layer D — hard filters + vector search + quality blending + confidence check
- Two-track output (exploit + explore)
- Restaurant-side context card with three-tier disclosure
- Stratified popularity computation

**Phase 4 — Polish + scale prep (weeks 10-12):**

- Menu vector caching at app layer
- Pre-computation of taste vectors via background job
- Multi-region read replica
- Compliance: real consent flow, real forget UI, real audit trail

### 8.3 Long-horizon evolution (year 2+)

Driven by scale pain, not premature optimization.

- Move analytical queries (taste vector derivation, popularity computation) to separate analytical store
- Event sourcing for compliance-relevant slices
- Multi-region active-active
- Nutritional data — V2 (estimator) then V3 (declared)
- Cross-cuisine evaluation as thesis + product evidence
- International expansion (the architecture is geography-neutral)

---

## Part 9 — Open questions and known risks

Documented honestly. These are real and worth knowing.

### 9.1 Engineering risks

- **Cross-cuisine taste matching may produce nonsense for subtle cases.** Mitigation: confidence-calibrated abstention, empirical evaluation chapter.
- **Centroid-of-orders taste vector is too simple.** Mitigation: multi-mode vectors from V1, evolve to richer representations as data grows.
- **Vector search at query time has latency variance under load.** Mitigation: caching menu vectors, eventually precomputed diner vectors.
- **LLM provider dependency is a single point of failure.** Mitigation: LLMProvider seam from V1.

### 9.2 Regulatory risks

- **DPDP Act compliance for sensitive data (dietary, health-adjacent).** Mitigation: food-property pattern (we never store medical conditions), explicit consent scoping, forget primitive from day one.
- **Cross-restaurant data sharing as a regulated activity.** Mitigation: predictions-portable / raw-data-isolated principle (raw orders never cross tenants).
- **Allergen liability.** Mitigation: explicit honesty about cross-contamination, allergen rigor self-declaration by restaurants, no false guarantee.

### 9.3 Business risks

- **Network density is required before the magic works at any new restaurant.** A diner with 1-2 orders has too thin a taste vector. Mitigation: geographic concentration (one dense neighborhood, not many cities), seeded demo data for early restaurants.
- **Indian restaurant owners are hard to sell to.** Mitigation: positioning as dine-in add-on (not POS replacement) lowers switching cost. Pillar 1 (5-minute onboarding) reduces friction.
- **Aggregator-integration gap (Swiggy, Zomato) is real.** Mitigation: focus on dine-in segment where aggregators are irrelevant. Position restaurants to keep their existing POS for delivery, use Bawarchie for dine-in.
- **Diner-side monetization is unresolved.** Mitigation: for V1, diners pay nothing; their consent is the participation. Future: premium subscription, advance reservation, etc. Pick direction by year 2.

### 9.4 Strategic risks

- **Larger players (Zomato, Swiggy Dineout) may copy the cross-restaurant idea.** Mitigation: time-to-density advantage in chosen neighborhoods. They have inherent advantages (diner identity, payment, order history) — your window is the time between proving it works and them noticing.
- **TAM at India scale (~₹100 crore ARR ceiling) may be sub-venture-scale.** Mitigation: international expansion path is real (architecture is geography-neutral). Also: diner-side monetization layer added year 2-3 can change the unit economics meaningfully.

---

## Part 10 — Architecture diagrams (referenced)

The two diagrams produced during architecture design:

1. **Pillar 3 structural architecture** — Four-layer view showing Identity & Consent, Tenant Data, Taste Graph, Retrieval, with the privacy boundary between Layers B and C.

2. **Pillar 3 runtime flow** — Sequential view of what happens when a diner scans a QR, from identity resolution through to the two-destination output (diner-side AI waiter, restaurant-side context card).

Both are inline in the architecture session. Reproduce them as needed for slides, thesis chapters, or onboarding new team members.

---

## Part 11 — How to use this document

- **For implementation:** every coding decision should be traceable to a section of this document. If it isn't, either the decision is wrong or this document is missing something.
- **For YC application:** Parts 1, 2, and 3 are the elevator pitch material. Part 9 (risks) is the "what could go wrong" answer.
- **For thesis:** Parts 2, 4, and 5 are the system design chapter. Part 9.1 and 9.2 are the limitations chapter. The evaluation chapter measures whether Part 4's claims actually hold empirically.
- **For onboarding new team members:** read in order. Don't skip.
- **For changing the architecture:** any change to Parts 2 (commitments) or 6 (seams) requires explicit discussion among co-founders. Other parts can evolve more freely.

---

_End of document._
