// Popularity-5 baseline. Returns the top-5 most-ordered items at the
// destination restaurant. Used as a stronger floor than random — the system
// must beat this for the taste-vector signal to be meaningful (otherwise
// "what's popular tonight" is a strictly better recommendation strategy).
//
// Excludes orders placed by harness diners (uuid: /^harness-/) so the
// baseline is computed against real diner behavior, not against our own
// simulated history.

import Order from "../../../lib/models/Order.js";
import Item from "../../../lib/models/Item.js";
import Restaurant from "../../../lib/models/Restaurant.js";
import Diner from "../../../lib/models/Diner.js";
import { HARNESS_UUID_PREFIX } from "../lib/cleanup.mjs";

export async function popularityBaseline({ restaurantSlug, k = 5 }) {
  const r = await Restaurant.findOne({ slug: restaurantSlug }).select("_id").lean();
  if (!r) throw new Error(`popularityBaseline: restaurant "${restaurantSlug}" not found`);

  // Find harness dinerIds to exclude from popularity counts.
  const harnessDiners = await Diner.find({ uuid: { $regex: `^${HARNESS_UUID_PREFIX}` } })
    .select("_id")
    .lean();
  const harnessIds = harnessDiners.map((d) => d._id);

  const matchOrder = { restaurantId: r._id };
  if (harnessIds.length > 0) matchOrder.dinerId = { $nin: harnessIds };

  const agg = await Order.aggregate([
    { $match: matchOrder },
    { $unwind: "$items" },
    { $group: { _id: "$items.itemId", count: { $sum: "$items.qty" } } },
    { $sort: { count: -1 } },
    { $limit: k },
  ]);

  // If there are no non-harness orders (fresh demo DB), fall back to first-k
  // by insertion order — better than nothing, and the runner can decide if
  // popularity is meaningful in that environment.
  if (agg.length === 0) {
    const items = await Item.find({ restaurantId: r._id, available: true })
      .select("name description category isVeg isVegan isGlutenFree spiceLevel price")
      .limit(k)
      .lean();
    return items.map((it) => ({ ...it, _popularityCount: 0 }));
  }

  const ids = agg.map((a) => a._id);
  const items = await Item.find({ _id: { $in: ids } })
    .select("name description category isVeg isVegan isGlutenFree spiceLevel price")
    .lean();
  // Preserve the sort order.
  const byId = new Map(items.map((it) => [it._id.toString(), it]));
  const result = agg
    .map((a) => {
      const it = byId.get(a._id.toString());
      return it ? { ...it, _popularityCount: a.count } : null;
    })
    .filter(Boolean);
  return result;
}
