/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { recomputeTasteVector } from "@/lib/taste";
import { requireSuperAdmin } from "@/lib/utils/apiAuth";

// Admin-only on-demand recompute. Useful for:
//   - Debugging an individual diner's taste shape
//   - Re-running the algorithm after a code change without waiting for new orders
//   - Seed scripts (Step 5) that backdate orders and need a final compute pass
//
// Cross-tenant by design — Layer C is the one place we read across restaurants.
// Locked to super-admin since restaurants must not see other restaurants' data.
export async function POST(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const dinerId: string | undefined = body?.dinerId;
    if (!dinerId) {
      return NextResponse.json(
        { success: false, error: "dinerId is required" },
        { status: 400 }
      );
    }

    const result = await recomputeTasteVector(dinerId);
    // Don't send the 768-dim vector back over the wire — it's heavy and the
    // caller can read it from the Diner doc if they need it. Return the
    // summary stats only.
    return NextResponse.json({
      success: true,
      dinerId,
      vectorSet: !!result.vector,
      confidence: result.confidence,
      orderCount: result.orderCount,
      uniqueItemsCount: result.uniqueItemsCount,
      embeddedItemsCount: result.embeddedItemsCount,
      reason: result.reason || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
