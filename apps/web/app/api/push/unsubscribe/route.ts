import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import PushSubscription from "@/lib/models/PushSubscription.js";
import { requireAuth } from "@/lib/utils/apiAuth";

export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "endpoint is required" },
        { status: 400 }
      );
    }

    await PushSubscription.deleteOne({ "subscription.endpoint": endpoint });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
