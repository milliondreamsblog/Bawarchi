/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import Table from "@/lib/models/Table.js";
import { requireAuth } from "@/lib/utils/apiAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id)
      .populate({
        path: "items.itemId",
        select: "name price description category image"
      })
      .populate({
        path: "restaurantId",
        select: "name address phone email logo"
      })
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status, restaurantId } = body;

    // Verify order belongs to restaurant
    const existingOrder = await Order.findById(id);
    
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (restaurantId && existingOrder.restaurantId.toString() !== restaurantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update status
    if (status) {
      existingOrder.status = status;
      await existingOrder.save();

      // Auto-free table when order is served
      if (status === "served") {
        await Table.findOneAndUpdate(
          { currentOrderId: id },
          { status: "free", occupiedAt: null, currentOrderId: null }
        );
      }
    }

    return NextResponse.json({
      success: true,
      order: existingOrder,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
