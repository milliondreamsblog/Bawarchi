// Deterministic precision check. The ONLY consumer of persona.expectedBehavior.
// CRITICAL: this module must NEVER be called from judge.mjs. If you find
// yourself wanting to pass expectedBehavior into the judge prompt, stop:
// that would make the harness circular (the judge grades against an answer
// key you wrote, instead of judging the retrieval independently).

export function computeBullseye(retrievedItems, expectedBehavior) {
  const expected = expectedBehavior || {};
  const high = new Set((expected.shouldRankHigh || []).map((s) => s.toLowerCase()));
  const low = new Set((expected.shouldRankLow || []).map((s) => s.toLowerCase()));
  const antiSet = new Set((expected.antiMatches || []).map((s) => s.toLowerCase()));

  const names = retrievedItems.map((it) => it.name);
  const namesLower = names.map((n) => n.toLowerCase());
  const top3 = namesLower.slice(0, 3);

  const matchesInTop5 = namesLower.filter((n) => high.has(n)).length;
  const matchesInTop3 = top3.filter((n) => high.has(n)).length;
  const antiMatchesInTop3 = top3.filter((n) => antiSet.has(n)).length;
  const lowsInTop3 = top3.filter((n) => low.has(n)).length;

  const precisionTop5 = high.size > 0 ? matchesInTop5 / Math.min(high.size, 5) : null;
  const precisionTop3 = high.size > 0 ? matchesInTop3 / Math.min(high.size, 3) : null;

  return {
    expectedHighCount: high.size,
    matchesInTop5,
    matchesInTop3,
    antiMatchesInTop3,
    lowsInTop3,
    precisionTop5,
    precisionTop3,
    retrievedNames: names,
  };
}
