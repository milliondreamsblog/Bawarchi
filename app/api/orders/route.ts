/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import Table from "@/lib/models/Table.js";

export async function GET(request: Request) {
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
    
    // Populate item details to avoid null references
    const orders = await Order.find({ restaurantId })
      .populate({
        path: "items.itemId",
        select: "name price description category"
      })
      .sort({ createdAt: -1 })
      .lean();
      
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { tableSlug, items, total, restaurantId } = body;
    
    if (!tableSlug || !items || !total || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "Table slug, items, total, and restaurantId are required" },
        { status: 400 }
      );
    }

    // Get restaurant ID from table
    const table = await Table.findOne({ slug: tableSlug, restaurantId });
    if (!table) {
      return NextResponse.json(
        { success: false, error: "Table not found" },
        { status: 404 }
      );
    }

    const order = await Order.create({
      tableSlug,
      items,
      total,
      restaurantId,
      status: "pending",
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
