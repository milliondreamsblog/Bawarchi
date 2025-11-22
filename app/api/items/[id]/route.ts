/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Item from "@/lib/models/Item.js";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { available, restaurantId } = body;

    // Verify item belongs to restaurant
    const existingItem = await Item.findById(id);
    
    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    if (restaurantId && existingItem.restaurantId.toString() !== restaurantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update availability
    if (typeof available === "boolean") {
      existingItem.available = available;
      await existingItem.save();
    }

    return NextResponse.json({ 
      success: true, 
      item: existingItem,
      message: `Item ${available ? 'is now available' : 'marked as unavailable'}`
    });
  } catch (error: any) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
