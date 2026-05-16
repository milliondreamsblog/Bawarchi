// Cross-restaurant retrieval. Mirrors the production lib/rag.ts search()
// path for the "taste vector only, no query text" case. We deliberately
// do NOT pass hardFilters here — the harness is testing the soft signal
// alone, and the rubric will catch dietary violations. See README §"Methodology".

import mongoose from "mongoose";
import Item from "../../../lib/models/Item.js";
import Diner from "../../../lib/models/Diner.js";
import Restaurant from "../../../lib/models/Restaurant.js";

const VECTOR_INDEX_NAME = "items_vector";
const DIMS = 768;

export async function getTasteVector(dinerObjectId) {
  const d = await Diner.findById(dinerObjectId).select("+tasteVector tasteConfidence").lean();
  if (!d) throw new Error(`retrieval: diner ${dinerObjectId} not found`);
  if (!Array.isArray(d.tasteVector) || d.tasteVector.length !== DIMS) {
    return { vector: null, confidence: d.tasteConfidence ?? 0 };
  }
  return { vector: d.tasteVector, confidence: d.tasteConfidence ?? 0 };
}

export async function retrieveTop(restaurantSlug, tasteVector, k = 5) {
  const r = await Restaurant.findOne({ slug: restaurantSlug }).select("_id").lean();
  if (!r) throw new Error(`retrieval: restaurant slug "${restaurantSlug}" not found`);

  const results = await Item.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: tasteVector,
        numCandidates: 200,
        limit: k,
        filter: {
          restaurantId: new mongoose.Types.ObjectId(r._id),
          available: true,
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        category: 1,
        isVeg: 1,
        isVegan: 1,
        isGlutenFree: 1,
        spiceLevel: 1,
        price: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);
  return { restaurantId: r._id, items: results };
}

// Returns the destination restaurant's full available menu — used to feed
// the judge prompt so it knows what was AVAILABLE, not just what was returned.
export async function getDestinationMenu(restaurantSlug) {
  const r = await Restaurant.findOne({ slug: restaurantSlug }).select("_id name").lean();
  if (!r) throw new Error(`getDestinationMenu: restaurant slug "${restaurantSlug}" not found`);
  const items = await Item.find({ restaurantId: r._id, available: true })
    .select("name description category isVeg isVegan isGlutenFree spiceLevel price")
    .lean();
  return { restaurantId: r._id, restaurantName: r.name, items };
}
