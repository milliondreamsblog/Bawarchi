import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import PushSubscription from "@/lib/models/PushSubscription.js";
import { requireAuth } from "@/lib/utils/apiAuth";

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { restaurantId, subscription } = await request.json();

    if (!restaurantId || !subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json(
        { success: false, error: "restaurantId and subscription are required" },
        { status: 400 }
      );
    }

    // Upsert by endpoint so the same browser doesn't create duplicates
    await PushSubscription.findOneAndUpdate(
      { "subscription.endpoint": subscription.endpoint },
      {
        restaurantId,
        subscription,
        userAgent: request.headers.get("user-agent") || "",
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
