import mongoose from "mongoose";
import Item from "@/lib/models/Item.js";
import { embed } from "@/lib/embeddings";

const VECTOR_INDEX_NAME = "items_vector";

export interface RetrievedItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
  calories?: number;
  isVeg?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spiceLevel?: string;
  score?: number;
}

/**
 * Retrieve items most semantically relevant to `query` for this restaurant.
 * Falls back to a plain `find()` when items are not yet embedded (cold-start)
 * or when the embedding service errors.
 *
 * Atlas index `items_vector` must be created on the `items` collection:
 *   { type: "vector", path: "embedding", numDimensions: 768, similarity: "cosine" }
 *   { type: "filter", path: "restaurantId" }
 *   { type: "filter", path: "available" }
 */
export async function retrieveRelevantItems(
  query: string,
  restaurantId: string,
  k = 8
): Promise<RetrievedItem[]> {
  const trimmed = (query || "").trim();
  if (!trimmed || !restaurantId) return findFallback(restaurantId, k);

  let queryVec: number[];
  try {
    queryVec = await embed(trimmed);
  } catch {
    return findFallback(restaurantId, k);
  }

  const results = await Item.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: queryVec,
        numCandidates: Math.max(50, k * 10),
        limit: k,
        filter: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          available: true,
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        price: 1,
        category: 1,
        image: 1,
        calories: 1,
        isVeg: 1,
        isVegan: 1,
        isGlutenFree: 1,
        spiceLevel: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  if (!results || results.length === 0) return findFallback(restaurantId, k);
  return results as RetrievedItem[];
}

async function findFallback(restaurantId: string, k: number): Promise<RetrievedItem[]> {
  if (!restaurantId) return [];
  const items = await Item.find({ restaurantId, available: true }).limit(k).lean();
  return items as unknown as RetrievedItem[];
}
