# Cross-Restaurant Retrieval Evaluation Rubric (v1)

Score a top-5 retrieval result against a diner persona on FOUR axes, each rated 0–3. Total: 0–12.

Pick the CLOSEST anchored level for each axis. Do not interpolate. Score axes independently.

---

## Axis 1 — Dietary respect (0–3)

How well does the top-5 honor the persona's stated dietary constraints (vegetarian, vegan, gluten-free, jain, allergen avoidance)?

- **3** — All 5 items satisfy every stated dietary constraint. No violations.
- **2** — 4 of 5 satisfy. At most one soft violation (e.g., one onion-containing item for a Jain-leaning persona), no hard violations.
- **1** — 2–3 of 5 satisfy, OR exactly one HARD violation (e.g., one meat item for a strict vegetarian).
- **0** — 0–1 of 5 satisfy, OR two or more hard violations.

A *hard* violation = strict dietary class breach (meat for veg, dairy for vegan, gluten for celiac). A *soft* violation = preference miss (e.g., onion for a Jain-leaning diner).

## Axis 2 — Flavor alignment (0–3)

How well does the top-5 match the persona's PRIMARY flavor traits (e.g., creamy, spicy, sweet, smoky, light)?

- **3** — At least 4 of 5 items clearly express the persona's dominant flavor trait(s).
- **2** — 2–3 of 5 items express the dominant flavor. Remaining items are neutral, not opposed.
- **1** — Only 1 of 5 expresses the dominant flavor.
- **0** — 0 items express the dominant flavor, OR 2+ items express the OPPOSITE flavor (e.g., spicy items for a mild-preferring persona).

Infer flavor character from item names + descriptions ("Four-Cheese Gnocchi" = creamy; "Penne Arrabbiata" = spicy; "Tiramisu" = sweet).

## Axis 3 — Cross-cuisine bridge quality (0–3)

Did the system find real cross-cuisine ANALOGUES of the persona's home-cuisine favorites, or surface items by superficial cuisine label / category alone?

- **3** — Top-3 contain ≥2 items that are genuine cross-cuisine analogues — they share underlying flavor primitives (creamy, dairy-rich, mild) with the persona's `primaryTraits`. Example: a paneer-loving diner getting four-cheese gnocchi + ricotta pasta.
- **2** — Top-3 contain 1 strong analogue; the rest are category-correct but flavor-shallow.
- **1** — Top-5 contain only weak analogues — items that share dietary class but not flavor character.
- **0** — No bridging signal. Items appear randomly ordered or selected by surface attributes only (e.g., everything that says "Italian", regardless of flavor).

The persona's `tasteAxes.homeCuisine` and `primaryTraits` are the inputs. Items in the destination cuisine that *evoke* those traits = bridges. Items that share only the cuisine label = not bridges.

## Axis 4 — Ranking sensibility (0–3)

Are the TOP positions clearly stronger than the BOTTOM? A useful ranking signal means the system has confidence-discriminated, not just returned "5 okay items".

- **3** — Top-2 items are noticeably the strongest matches; bottom-2 are noticeably weaker. Clear monotonic decrease in quality from position 1 → 5.
- **2** — Some quality decrease from top to bottom but not crisp. Top-1 is best, but #2 vs #4 is close.
- **1** — Ranking appears mostly flat — top and bottom items of similar quality. System found "5 OK items" without ordering.
- **0** — Ranking is inverted (best at position 5) or actively wrong-ordered.

This axis penalizes "shotgun" retrieval. Even if the top-5 set is correct, a system that can't pick which is BEST is less useful than one that can.

---

## Output format

The judge returns JSON of this exact shape (and nothing else):

```json
{
  "dietary": 3,
  "flavor": 3,
  "bridge": 3,
  "ranking": 2,
  "total": 11,
  "reasoning": "Top-3 are strongly creamy and vegetarian (Four-Cheese Gnocchi, Mushroom Risotto, Penne Alfredo); positions 4-5 are slightly weaker but still on-profile. All items satisfy the vegetarian constraint. Gnocchi and risotto are genuine cross-cuisine analogues of Paneer Makhani's dairy-cream primitive. Ranking shows some monotonic decrease but #2 and #4 are close."
}
```

Rules:
- `total` MUST equal the sum of the four axis scores. The judge that returns a mismatched total has scored incorrectly.
- `reasoning` is 2–4 sentences, MUST reference specific item names from the retrieval, MUST justify each axis briefly.
- Output ONLY the JSON object. No prose before or after. No markdown fences.
