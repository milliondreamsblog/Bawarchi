# Few-Shot Examples for the Judge

Two worked examples below. The judge will receive the same payload format (persona description + taste axes + target menu + top-5) and must produce the same JSON shape with the same rigor.

---

## Example A — High-scoring (10/12)

**Persona description:**
A vegetarian diner who prefers creamy, dairy-forward, mild dishes. Home cuisine is Mughlai. Avoids spicy, fermented, and raw foods. Often orders paneer-based dishes and rich cream-based gravies.

**Taste axes:**
- dietaryClass: vegetarian
- spicePreference: mild
- homeCuisine: mughlai
- primaryTraits: creamy, dairy-forward, mild
- avoidance: spicy, fermented, raw

**Target restaurant: Bella Cucina (Italian).**
Available items: Four-Cheese Gnocchi (creamy pasta), Mushroom Risotto (creamy rice), Margherita Pizza (cheese pizza), Ricotta-Stuffed Shells (cheese-stuffed pasta), Penne Alfredo (cream pasta), Caprese Salad (raw tomato + mozzarella), Margherita Bianca (white cheese pizza), Penne Arrabbiata (spicy pasta), Spaghetti Bolognese (meat ragu), Chicken Parmigiana (breaded chicken), Tiramisu (dessert), Affogato (dessert).

**Retrieved top-5 (in rank order):**
1. Four-Cheese Gnocchi
2. Mushroom Risotto
3. Penne Alfredo
4. Ricotta-Stuffed Shells
5. Margherita Bianca

**Correct judge output:**
```json
{
  "dietary": 3,
  "flavor": 3,
  "bridge": 3,
  "ranking": 1,
  "total": 10,
  "reasoning": "All 5 items are vegetarian and mild — full dietary respect. All 5 express the creamy/cheese-forward primary trait; flavor alignment is strong. Four-Cheese Gnocchi and Penne Alfredo are textbook cross-cuisine analogues of Mughlai paneer makhani and dal makhani (dairy-cream primitives), giving a strong bridge score. Ranking is the weak axis — all five items are similar in strength; the system did not clearly differentiate top-2 from bottom-3."
}
```

---

## Example B — Low-scoring (4/12)

**Persona description:**
A non-vegetarian diner who prefers HOT, spicy, smoky flavors. Home cuisine is Mughlai. Strongly avoids mild, sweet, or dairy-heavy dishes.

**Taste axes:**
- dietaryClass: non-vegetarian
- spicePreference: hot
- homeCuisine: mughlai
- primaryTraits: spicy, smoky, hot
- avoidance: mild, sweet, dairy-heavy

**Target restaurant: Bella Cucina (Italian).**
Available items: same as Example A.

**Retrieved top-5 (in rank order):**
1. Margherita Pizza
2. Caprese Salad
3. Penne Alfredo
4. Penne Arrabbiata
5. Tiramisu

**Correct judge output:**
```json
{
  "dietary": 1,
  "flavor": 1,
  "bridge": 1,
  "ranking": 1,
  "total": 4,
  "reasoning": "Persona is non-vegetarian but 4 of 5 retrieved items are vegetarian — a strong dietary mismatch (the system surfaced no meat-bearing items like Bolognese or Parmigiana). Only Penne Arrabbiata at position 4 expresses the persona's spicy primary trait; positions 1-3 actively contradict it with mild dairy-heavy dishes. No cross-cuisine bridging visible — the system surfaced items the persona would actively avoid. Ranking is inverted: the one matching item (arrabbiata) is at position 4 while three persona-opposed items occupy positions 1-3."
}
```

---

These two examples anchor the rubric's full range. Score the next evaluation with the same rigor: reference specific item names, justify each axis, and pick the closest anchored level rather than interpolating.
