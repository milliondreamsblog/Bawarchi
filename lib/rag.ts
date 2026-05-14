import mongoose from "mongoose";
import Item from "@/lib/models/Item.js";
import { embed, EMBEDDING_DIMENSIONS } from "@/lib/embeddings";

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
  return search({ restaurantId, queryText: query, k });
}

export interface HardFilters {
  isVeg?: boolean;
  isVegan?: boolean;
  // Allergens deferred — item schema doesn't carry allergen tags yet.
}

export interface SearchOptions {
  restaurantId: string;
  queryText?: string;
  /**
   * Pre-computed query vector — typically the diner's taste vector (Layer C).
   * If both `tasteVector` and `queryText` are provided, the effective query
   * vector is a weighted blend: 0.6 × textEmbedding + 0.4 × tasteVector.
   * That ratio leans toward the customer's current intent (what they're
   * asking about right now) while letting their long-term taste tilt the
   * results.
   */
  tasteVector?: number[];
  hardFilters?: HardFilters;
  k?: number;
}

/**
 * Unified retrieval entry point. Use this for new code; the legacy
 * `retrieveRelevantItems(query, restaurantId, k)` wraps it for back-compat.
 *
 * Hard filters are applied post-vector-search because the Atlas index only
 * has `restaurantId` and `available` as filter fields. To avoid the filter
 * shrinking the result set below k, we over-fetch and trim.
 */
export async function search(opts: SearchOptions): Promise<RetrievedItem[]> {
  const { restaurantId, queryText, tasteVector, hardFilters, k = 8 } = opts;
  if (!restaurantId) return [];

  const queryVec = await buildQueryVector(queryText, tasteVector);
  if (!queryVec) return findFallback(restaurantId, k, hardFilters);

  const oversample = hardFilters ? 4 : 1;
  const limit = k * oversample;

  const raw: RetrievedItem[] = await Item.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: queryVec,
        numCandidates: Math.max(50, limit * 10),
        limit,
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

  const filtered = hardFilters ? raw.filter((it) => applyHardFilters(it, hardFilters)) : raw;
  if (filtered.length === 0) return findFallback(restaurantId, k, hardFilters);
  return filtered.slice(0, k);
}

function applyHardFilters(item: RetrievedItem, filters: HardFilters): boolean {
  if (filters.isVegan === true && !item.isVegan) return false;
  if (filters.isVeg === true && !(item.isVeg || item.isVegan)) return false;
  return true;
}

async function buildQueryVector(
  queryText?: string,
  tasteVector?: number[]
): Promise<number[] | null> {
  const trimmedText = (queryText || "").trim();
  const hasTaste = Array.isArray(tasteVector) && tasteVector.length === EMBEDDING_DIMENSIONS;

  if (!trimmedText && !hasTaste) return null;

  if (trimmedText && hasTaste) {
    try {
      const textVec = await embed(trimmedText);
      return blendAndNormalize(textVec, tasteVector!, 0.6, 0.4);
    } catch {
      return tasteVector!; // text embed failed → fall back to pure taste
    }
  }

  if (trimmedText) {
    try {
      return await embed(trimmedText);
    } catch {
      return null;
    }
  }

  // tasteVector only — already unit-length from lib/taste.ts.
  return tasteVector!;
}

function blendAndNormalize(
  a: number[],
  b: number[],
  wa: number,
  wb: number
): number[] {
  const n = Math.min(a.length, b.length);
  const out = new Array(n);
  let magSq = 0;
  for (let i = 0; i < n; i++) {
    const v = wa * a[i] + wb * b[i];
    out[i] = v;
    magSq += v * v;
  }
  const mag = Math.sqrt(magSq);
  if (mag === 0) return out;
  for (let i = 0; i < n; i++) out[i] /= mag;
  return out;
}

async function findFallback(
  restaurantId: string,
  k: number,
  hardFilters?: HardFilters
): Promise<RetrievedItem[]> {
  if (!restaurantId) return [];
  const q: Record<string, unknown> = { restaurantId, available: true };
  if (hardFilters?.isVegan === true) q.isVegan = true;
  else if (hardFilters?.isVeg === true) q.$or = [{ isVeg: true }, { isVegan: true }];
  const items = await Item.find(q).limit(k).lean();
  return items as unknown as RetrievedItem[];
}
