/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import type { ApiResponse } from "@bawarchie/types";
import connectDB from "@/lib/db.js";
import Item from "@/lib/models/Item.js";
import { embed, buildSearchDocument } from "@/lib/embeddings";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "restaurantId is required" },
        { status: 400 }
      );
    }

    const items = await Item.find({ restaurantId }).lean();
    return NextResponse.json<ApiResponse<{ items: typeof items }>>({
      success: true,
      items,
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { name, description, price, category, image, calories, available, restaurantId,
            isVeg, isVegan, isGlutenFree, spiceLevel } = body;

    if (!name || !price || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "Name, price, and restaurantId are required" },
        { status: 400 }
      );
    }

    const item = await Item.create({
      name,
      description,
      price,
      category: category || "General",
      image,
      calories,
      available: available !== undefined ? available : true,
      restaurantId,
      isVeg:        !!isVeg,
      isVegan:      !!isVegan,
      isGlutenFree: !!isGlutenFree,
      spiceLevel:   spiceLevel || "medium",
    });

    try {
      const vec = await embed(buildSearchDocument(item));
      await Item.findByIdAndUpdate(item._id, { embedding: vec, embeddedAt: new Date() });
    } catch (e: any) {
      console.warn(`[items] embedding failed for ${item._id}: ${e?.message}`);
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
