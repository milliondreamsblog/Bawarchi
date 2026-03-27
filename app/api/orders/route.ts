/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import Table from "@/lib/models/Table.js";
import Item from "@/lib/models/Item.js";

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

    const {
      tableSlug,
      items,
      total,
      restaurantId,
      razorpayOrderId,
      razorpayPaymentId,
      // New billing fields
      baseTotal,
      gstPercentage,
      gstAmount,
      platformFee,
      finalAmount,
      restaurantEarnings,
      myEarnings,
    } = body;

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

    // Create order with all fields (new billing fields are optional for backward compatibility)
    const orderData: any = {
      tableSlug,
      items,
      total,
      restaurantId,
      status: "pending",
    };

    // Add Razorpay IDs if present
    if (razorpayOrderId) orderData.razorpayOrderId = razorpayOrderId;
    if (razorpayPaymentId) orderData.razorpayPaymentId = razorpayPaymentId;

    // Add billing breakdown fields if present
    if (baseTotal !== undefined) orderData.baseTotal = baseTotal;
    if (gstPercentage !== undefined) orderData.gstPercentage = gstPercentage;
    if (gstAmount !== undefined) orderData.gstAmount = gstAmount;
    if (platformFee !== undefined) orderData.platformFee = platformFee;
    if (finalAmount !== undefined) orderData.finalAmount = finalAmount;
    if (restaurantEarnings !== undefined) orderData.restaurantEarnings = restaurantEarnings;
    if (myEarnings !== undefined) orderData.myEarnings = myEarnings;

    const order = await Order.create(orderData);

    // Auto-set table to occupied
    await Table.findOneAndUpdate(
      { slug: tableSlug, restaurantId },
      { status: "occupied", occupiedAt: new Date(), currentOrderId: order._id }
    );

    // Decrement stock for each item (skip if stock is -1 = unlimited)
    for (const { itemId, qty } of items) {
      const item = await Item.findById(itemId);
      if (item && item.stock > 0) {
        item.stock = Math.max(0, item.stock - qty);
        if (item.stock === 0) item.available = false;
        await item.save();
      }
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
