/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import Diner from "@/lib/models/Diner.js";
import { describeTasteForDiner } from "@/lib/taste";
import { search } from "@/lib/rag";
import { requireAuth } from "@/lib/utils/apiAuth";

/**
 * Restaurant-side diner context card (piller3.md §5.5).
 *
 * Three-tier disclosure:
 *   tier 1  Operational facts        — dietary class, spice tolerance
 *   tier 2  Service-relevant signals — taste summary (food-property level)
 *   tier 3  Cross-restaurant history — NEVER. Not returned by this route,
 *           not derivable from it, not even by stitching together neighbours.
 *
 * Auth: restaurant admin for the order's restaurant, or super-admin.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { orderId } = await params;

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    const o = order as any;

    const isSuperAdmin = session!.user.role === "super-admin";
    const isOwningRestaurant =
      session!.user.role === "restaurant" &&
      (session!.user as any).id === o.restaurantId.toString();
    if (!isSuperAdmin && !isOwningRestaurant) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!o.dinerId) {
      return NextResponse.json({
        success: true,
        hasContext: false,
        reason: "anonymous_order",
        message: "This order was placed without a diner identity.",
      });
    }

    const diner = await Diner.findById(o.dinerId)
      .select("state dietaryPrefs tasteConfidence")
      .lean();
    const d = diner as any;

    // Describe the diner's taste at the food-property level.
    const description = await describeTasteForDiner(o.dinerId.toString());

    // Top items from THIS restaurant matching the diner's taste. These are
    // safe to surface (same-restaurant items) and help the server pre-empt
    // up-sell / next-course conversation.
    let predictedItems: any[] = [];
    if (description.confidence >= 0.4) {
      // We need the diner's taste vector for the search. Fetch separately
      // since it's `select: false`.
      const dinerWithVec = await Diner.findById(o.dinerId)
        .select("+tasteVector")
        .lean();
      const dv = dinerWithVec as any;
      if (Array.isArray(dv?.tasteVector) && dv.tasteVector.length === 768) {
        predictedItems = await search({
          restaurantId: o.restaurantId.toString(),
          tasteVector: dv.tasteVector,
          hardFilters: d?.dietaryPrefs?.persistent?.hardFilters,
          k: 3,
        });
      }
    }

    return NextResponse.json({
      success: true,
      hasContext: true,
      identity: {
        state: d?.state || "anonymous",
        // Raw phone is order-scoped; we redact for display.
        phoneRedacted: o.customerPhone
          ? String(o.customerPhone).replace(/.(?=.{4})/g, "•")
          : null,
      },
      operational: {
        dietaryLeaning: description.dietary.leaning,
        glutenFreeLeaning: description.dietary.glutenFreeLeaning,
        spicePreference: description.spicePreference,
      },
      taste: {
        summary: description.summary,
        tags: description.tags,
        confidence: description.confidence,
        sampleCount: description.sampleCount,
      },
      predictedItems,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
