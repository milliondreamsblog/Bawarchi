/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Diner from "@/lib/models/Diner.js";
import Item from "@/lib/models/Item.js";
import { search } from "@/lib/rag";

const CONFIDENCE_THRESHOLD = 0.4;

/**
 * Layer D — For You feed. Given a diner and a restaurant, return either:
 *   - "Picked for your taste" — vector search of this restaurant's menu
 *     against the diner's taste vector + their hard dietary filters
 *   - "Popular tonight" — a fallback when we don't trust our taste signal
 *     yet (anonymous diner, brand-new diner, or first-time diner whose
 *     order history is too thin to predict; piller3.md §2.6 calibrated
 *     abstention).
 *
 * Always returns 200 with the same shape; the `fallback` flag tells the
 * client which UI label to render ("Picked for your taste" vs "Popular
 * tonight").
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const dinerId = searchParams.get("dinerId");
    const k = Math.max(1, Math.min(20, Number(searchParams.get("k")) || 8));

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "restaurantId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    let tasteVector: number[] | null = null;
    let tasteConfidence = 0;
    let hardFilters: { isVeg?: boolean; isVegan?: boolean } | undefined;

    if (dinerId) {
      const diner = await Diner.findById(dinerId)
        .select("+tasteVector tasteConfidence dietaryPrefs")
        .lean();
      if (diner) {
        const d = diner as any;
        tasteVector = Array.isArray(d.tasteVector) ? d.tasteVector : null;
        tasteConfidence = typeof d.tasteConfidence === "number" ? d.tasteConfidence : 0;
        const hf = d.dietaryPrefs?.persistent?.hardFilters;
        if (hf?.isVegan || hf?.isVeg) {
          hardFilters = {
            isVegan: !!hf.isVegan,
            isVeg: !!hf.isVeg,
          };
        }
      }
    }

    const usingTaste =
      Array.isArray(tasteVector) &&
      tasteVector.length === 768 &&
      tasteConfidence >= CONFIDENCE_THRESHOLD;

    if (usingTaste) {
      const items = await search({
        restaurantId,
        tasteVector: tasteVector!,
        hardFilters,
        k,
      });
      return NextResponse.json({
        success: true,
        items,
        source: "taste",
        confidence: tasteConfidence,
        fallback: false,
      });
    }

    // Popular fallback — anything available at this restaurant. Stratified
    // popularity (§5.3) is a V1-production refinement; for the demo a plain
    // limit is enough.
    const fallbackItems = await Item.find({ restaurantId, available: true })
      .limit(k)
      .lean();
    return NextResponse.json({
      success: true,
      items: fallbackItems,
      source: "popular",
      confidence: tasteConfidence,
      fallback: true,
      fallbackReason: dinerId ? "low_confidence" : "anonymous",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
