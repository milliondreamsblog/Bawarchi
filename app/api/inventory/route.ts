/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Item from "@/lib/models/Item.js";
import { requireAuth } from "@/lib/utils/apiAuth";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "restaurantId is required" },
        { status: 400 }
      );
    }

    const items = await Item.find({ restaurantId })
      .select("name category stock lowStockThreshold available image price")
      .sort({ stock: 1 })
      .lean();

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const body = await request.json();
    const { updates } = body; // Array of { itemId, stock, lowStockThreshold }

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: "updates array is required" },
        { status: 400 }
      );
    }

    for (const { itemId, stock, lowStockThreshold } of updates) {
      const update: any = {};
      if (stock !== undefined) {
        update.stock = stock;
        update.available = stock !== 0;
      }
      if (lowStockThreshold !== undefined) update.lowStockThreshold = lowStockThreshold;
      await Item.findByIdAndUpdate(itemId, update);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
