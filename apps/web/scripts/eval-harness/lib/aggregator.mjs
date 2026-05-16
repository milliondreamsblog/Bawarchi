// Aggregation: mean, σ, bootstrap 95% CI, per-axis/per-persona/per-restaurant
// breakdowns, top-3 + bottom-3 cases. Deterministic — re-running on the same
// results JSON produces identical aggregate (CI is seeded).

import crypto from "node:crypto";

function mean(xs) {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function std(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1);
  return Math.sqrt(v);
}

// Seeded PRNG for reproducible bootstrap.
function makePrng(seedStr) {
  const hash = crypto.createHash("sha256").update(seedStr).digest();
  let s = BigInt(
    "0x" +
      Array.from(hash.slice(0, 8))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
  );
  return () => {
    s = (s + 0x9e3779b97f4a7c15n) & 0xffffffffffffffffn;
    let z = s;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & 0xffffffffffffffffn;
    z = z ^ (z >> 31n);
    return Number(z & 0xffffffffn) / 0x100000000;
  };
}

// 1000-resample percentile bootstrap. With N=10 the CI is wide — that's the
// honest signal; do not pretend otherwise by upping the resamples.
export function bootstrap95(xs, seedStr = "bootstrap", resamples = 1000) {
  if (xs.length === 0) return [0, 0];
  if (xs.length === 1) return [xs[0], xs[0]];
  const prng = makePrng(seedStr);
  const means = [];
  for (let r = 0; r < resamples; r++) {
    const sample = [];
    for (let i = 0; i < xs.length; i++) {
      const idx = Math.floor(prng() * xs.length);
      sample.push(xs[idx]);
    }
    means.push(mean(sample));
  }
  means.sort((a, b) => a - b);
  const lo = means[Math.floor(0.025 * resamples)];
  const hi = means[Math.floor(0.975 * resamples)];
  return [lo, hi];
}

export function summarize(xs, seedStr) {
  return {
    n: xs.length,
    mean: round2(mean(xs)),
    std: round2(std(xs)),
    ci95: bootstrap95(xs, seedStr).map(round2),
  };
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function groupBy(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

export function aggregate(rows) {
  const systemTotals = rows.map((r) => r.judge.total);
  const randomTotals = rows.map((r) => r.baselines.random.judge.total);
  const popularityTotals = rows.map((r) => r.baselines.popularity.judge.total);

  const perPersona = {};
  for (const [pid, group] of groupBy(rows, (r) => r.personaId)) {
    perPersona[pid] = round2(mean(group.map((r) => r.judge.total)));
  }
  const perRestaurant = {};
  for (const [slug, group] of groupBy(rows, (r) => r.targetRestaurantSlug)) {
    perRestaurant[slug] = round2(mean(group.map((r) => r.judge.total)));
  }
  const perAxis = {
    dietary: round2(mean(rows.map((r) => r.judge.dietary))),
    flavor: round2(mean(rows.map((r) => r.judge.flavor))),
    bridge: round2(mean(rows.map((r) => r.judge.bridge))),
    ranking: round2(mean(rows.map((r) => r.judge.ranking))),
  };

  const sorted = [...rows].sort((a, b) => a.judge.total - b.judge.total);
  const bottom3 = sorted.slice(0, 3).map(slim);
  const top3 = sorted.slice(-3).reverse().map(slim);

  // Bullseye stats (deterministic precision/recall side metric)
  const bullseyePrecisionTop5 = rows
    .map((r) => r.bullseye.precisionTop5)
    .filter((x) => x !== null && x !== undefined);
  const antiMatchesInTop3Avg = round2(
    mean(rows.map((r) => r.bullseye.antiMatchesInTop3))
  );

  return {
    system: summarize(systemTotals, "system"),
    random: summarize(randomTotals, "random"),
    popularity: summarize(popularityTotals, "popularity"),
    deltaVsRandom: round2(mean(systemTotals) - mean(randomTotals)),
    deltaVsPopularity: round2(mean(systemTotals) - mean(popularityTotals)),
    perPersona,
    perRestaurant,
    perAxis,
    bullseye: {
      precisionTop5Mean:
        bullseyePrecisionTop5.length > 0
          ? round2(mean(bullseyePrecisionTop5))
          : null,
      antiMatchesInTop3Avg,
    },
    top3,
    bottom3,
  };
}

function slim(r) {
  return {
    personaId: r.personaId,
    target: r.targetRestaurantSlug,
    total: r.judge.total,
    axes: {
      dietary: r.judge.dietary,
      flavor: r.judge.flavor,
      bridge: r.judge.bridge,
      ranking: r.judge.ranking,
    },
    top5: r.retrievedTop5,
    reasoning: r.judge.reasoning,
  };
}
