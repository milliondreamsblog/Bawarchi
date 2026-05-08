/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Item from "@/lib/models/Item.js";
import { requireAuth } from "@/lib/utils/apiAuth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { itemId } = await params;
    const body = await request.json();
    const { stock, lowStockThreshold } = body;

    const update: any = {};
    if (stock !== undefined) {
      update.stock = stock;
      if (stock === 0) update.available = false;
      else if (stock > 0) update.available = true;
    }
    if (lowStockThreshold !== undefined) update.lowStockThreshold = lowStockThreshold;

    const item = await Item.findByIdAndUpdate(itemId, update, { new: true });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
