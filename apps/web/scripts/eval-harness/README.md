# Cross-Restaurant Retrieval Evaluation Harness

An LLM-as-judge evaluation harness for measuring the cross-restaurant taste-graph retrieval quality (Pillar 3, Layer C+D). Companion to `seed-demo.mjs`, which proves ONE bullseye scenario works; this harness proves the *distribution* of scenarios works.

## What it does

For each hand-crafted diner persona:
1. Creates a temporary Diner record with a backdated order history
2. Recomputes the taste vector via the production pipeline (`lib/taste.ts` semantics)
3. Runs cross-restaurant retrieval at each target restaurant (`lib/rag.ts` semantics)
4. Scores the top-5 retrieval against the persona using an LLM judge with an anchored 4-axis rubric (0–12)
5. Also runs two baselines (random-5, popularity-5) on the same persona × restaurant pair
6. Aggregates scores: mean, σ, bootstrap 95% CI, per-axis/per-persona/per-restaurant breakdowns
7. Cleans up: deletes all harness diners + orders so the database returns to its pre-harness state

## Prerequisites

1. **Seed-demo data must exist** — the harness targets `demo-mughlai` and `demo-italian`. Run from monorepo root:
   ```
   pnpm seed:demo
   ```
2. **Environment variables** in `apps/web/.env`:
   - `MONGO_URI` — same Atlas connection your app uses
   - `GEMINI_API_KEY` — used for the judge (and as the production system's primary)
   - `OPENAI_API_KEY` *(optional)* — used as auto-fallback if Gemini rate-limits
3. **Node 18+**, run from `apps/web/` directory.

## How to run

From `apps/web/`:

```bash
# Dry run — no LLM calls, no DB writes. Validates persona schemas + cleanup hygiene.
node scripts/eval-harness/run-harness.mjs --dry-run

# Sample run — first 2 personas only, real LLM calls. ~$0.02.
node scripts/eval-harness/run-harness.mjs --sample 2

# Full run — all 10 personas, all targets. ~$0.10.
node scripts/eval-harness/run-harness.mjs

# Judge stability check — re-run a 5-eval subset at temperature 0.7 to compare with 0.0
node scripts/eval-harness/run-harness.mjs --sample 5 --judge-temp 0.7 --output results/run-temp07.json
```

## Methodology — what this measures and what it does not

**What it measures:** Quality of pure-taste-vector retrieval (no query text) at the destination restaurant, as judged by a structured rubric on synthetic diner personas. Reports mean ± σ + 95% CI versus two baselines (random + popularity).

**What it does NOT measure:**
- Real-diner satisfaction. Judge LLM ≠ real diner. The harness measures *rubric-defined retrieval quality*. Real-diner evaluation is qualitative work in Chapter 10.
- Production query-driven retrieval. The harness passes only `tasteVector` to `search()`, not `queryText`. The 0.6×text + 0.4×taste blend used in production for query-driven retrieval is not exercised here.
- Privacy / consent enforcement. That is tested by the existing probes, not by this harness.

**Limitations (also stated in §11.6):**
- v1 uses Gemini-as-judge on a Gemini-based retrieval system → same-family bias per Zheng et al. 2023. Cross-family (OpenAI-judge or Claude-judge) upgrade is a planned v2.
- The production retrieval layer does not enforce allergen-level or gluten-free hard filters; the harness reveals where the soft vector signal alone carries dietary intent. Personas P5 (Jain) and P10 (GF) probe this explicitly.
- N=10 personas is anecdote-sized, not benchmark-sized. Bootstrap 95% CI captures the uncertainty.

## How to read the results JSON

`results/run-<timestamp>.json` shape:

```json
{
  "version": {
    "runStartedAt": "...",
    "gitCommit": "...",
    "judgeModel": "gemini-2.0-flash",
    "rubricHash": "...",
    "fewShotHash": "...",
    "personaHashes": { "p001-...": "abc123" }
  },
  "results": [
    {
      "personaId": "p001-creamy-veg-mild",
      "targetRestaurantSlug": "demo-italian",
      "retrievedTop5": ["...", "...", "...", "...", "..."],
      "judge": { "dietary": 3, "flavor": 3, "bridge": 3, "ranking": 1, "total": 10, "reasoning": "..." },
      "bullseye": { "matchesInTop5": 4, "antiMatchesInTop3": 0, "precision": 0.8 },
      "baselines": {
        "random":     { "judge": {"total": 2, ...}, "bullseye": {...} },
        "popularity": { "judge": {"total": 5, ...}, "bullseye": {...} }
      }
    }
  ],
  "aggregate": {
    "system":     { "mean": 8.4, "std": 1.7, "ci95": [7.1, 9.5] },
    "random":     { "mean": 2.1, "std": 1.0, "ci95": [1.5, 2.8] },
    "popularity": { "mean": 4.5, "std": 1.4, "ci95": [3.7, 5.4] },
    "perPersona": { "p001-...": 10.0, ... },
    "perRestaurant": { "demo-italian": 8.2, "demo-mughlai": 8.6 },
    "perAxis": { "dietary": 2.8, "flavor": 2.4, "bridge": 2.1, "ranking": 1.6 },
    "bottom3": [ ... ],
    "top3": [ ... ]
  }
}
```

## How to add a new persona

Drop a JSON file in `personas/` following the schema below. The harness picks it up automatically.

```json
{
  "personaId": "p011-your-id",
  "description": "One-line plain-English description of the diner.",
  "tasteAxes": {
    "dietaryClass": "vegetarian | vegan | non-vegetarian | jain | gluten-free",
    "spicePreference": "mild | medium | hot | mixed",
    "homeCuisine": "mughlai | italian",
    "primaryTraits": ["creamy", "dairy-forward", ...],
    "avoidance": ["spicy", "fermented", ...]
  },
  "simulatedOrders": [
    {
      "homeRestaurantSlug": "demo-mughlai",
      "items": [
        { "name": "Paneer Makhani", "qty": 1, "daysAgo": 4 }
      ]
    }
  ],
  "targetRestaurantSlugs": ["demo-italian"],
  "expectedBehavior": {
    "shouldRankHigh": ["Four-Cheese Gnocchi", "Mushroom Risotto"],
    "shouldRankLow":  ["Spaghetti Bolognese"],
    "antiMatches":    ["Penne Arrabbiata"]
  }
}
```

**CRITICAL — leakage hygiene:** `expectedBehavior` is consumed ONLY by `lib/bullseye.mjs` (the deterministic precision check). It NEVER reaches the judge. Adding ground-truth answers to the persona JSON does not bias the judge score.

Use item names that ACTUALLY EXIST in the seed-demo menus (`scripts/seed-demo.mjs` lines 176–218 for the canonical lists).

## How to interpret the aggregate score

- **System mean / 12** — average rubric score across all (persona × target restaurant) pairs.
- **Versus baselines** — the system score is meaningful in relation to the two baselines. "Good" = system clearly above both. "Concerning" = system ≤ popularity baseline (the taste vector adds no signal beyond global popularity).
- **Bootstrap 95% CI** — if the CI overlaps the popularity baseline's CI, the gap is not statistically meaningful at N=10. Run more personas before claiming victory.
- **Per-axis breakdown** — if `bridge` is significantly lower than `flavor`, the system can match flavors but not cross-cuisine analogues. That's a tuning signal.

## Files

```
eval-harness/
  README.md                       this file
  rubric/
    rubric.md                     anchored 0/1/2/3 levels per axis
    few-shot.md                   one hi (10/12) + one lo (4/12) worked example
  judge-prompt.md                 system prompt template; [[RUBRIC]] + [[FEW_SHOT]] markers
  personas/                       10 hand-crafted JSON files
  baselines/
    random.mjs                    random-5 baseline
    popularity.mjs                most-ordered baseline
  lib/
    personaLoader.mjs             load + validate persona JSON; compute file hash
    cleanup.mjs                   delete harness diners (uuid: /^harness-/) + their orders
    versioning.mjs                capture model/prompt/persona/git hashes
    simulator.mjs                 create temp Diner + backdated orders + recompute taste vector
    retrieval.mjs                 vector search at destination restaurant
    bullseye.mjs                  deterministic precision check vs expectedBehavior (NEVER touches judge)
    judge.mjs                     Gemini primary, OpenAI fallback; parses JSON response
    aggregator.mjs                mean/σ/bootstrap CI/per-axis breakdowns/top3+bottom3
  run-harness.mjs                 the runner
  results/                        gitignored; timestamped JSON output
```
