// Random-5 baseline. Picks 5 available items uniformly at random from the
// destination restaurant. Used as a sanity floor — the system should beat
// this comfortably or something is broken.
//
// Determinism: takes a seed (derived from personaId + restaurantSlug) so
// the baseline for any given (persona, restaurant) pair is stable across
// reruns. Otherwise the random baseline becomes noise the user can't reason
// about.

import crypto from "node:crypto";
import Item from "../../../lib/models/Item.js";
import Restaurant from "../../../lib/models/Restaurant.js";

function seededShuffle(arr, seedStr) {
  // Splitmix64-style PRNG seeded from sha256(seedStr).
  const hash = crypto.createHash("sha256").update(seedStr).digest();
  let s = BigInt(
    "0x" +
      hash[0].toString(16).padStart(2, "0") +
      hash[1].toString(16).padStart(2, "0") +
      hash[2].toString(16).padStart(2, "0") +
      hash[3].toString(16).padStart(2, "0") +
      hash[4].toString(16).padStart(2, "0") +
      hash[5].toString(16).padStart(2, "0") +
      hash[6].toString(16).padStart(2, "0") +
      hash[7].toString(16).padStart(2, "0")
  );
  const next = () => {
    s = (s + 0x9e3779b97f4a7c15n) & 0xffffffffffffffffn;
    let z = s;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & 0xffffffffffffffffn;
    z = z ^ (z >> 31n);
    return Number(z & 0xffffffffn) / 0x100000000;
  };
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function randomBaseline({ personaId, restaurantSlug, k = 5 }) {
  const r = await Restaurant.findOne({ slug: restaurantSlug }).select("_id").lean();
  if (!r) throw new Error(`randomBaseline: restaurant "${restaurantSlug}" not found`);
  const items = await Item.find({ restaurantId: r._id, available: true })
    .select("name description category isVeg isVegan isGlutenFree spiceLevel price")
    .lean();
  const shuffled = seededShuffle(items, `${personaId}::${restaurantSlug}::random`);
  return shuffled.slice(0, k);
}
