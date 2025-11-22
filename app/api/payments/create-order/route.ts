/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDB from "@/lib/db.js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = "INR", tableSlug, restaurantId } = body;

    if (!amount || !tableSlug || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "Amount, tableSlug, and restaurantId are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const Table = (await import("@/lib/models/Table.js")).default;
    const Restaurant = (await import("@/lib/models/Restaurant.js")).default;

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
    }

    // Verify table exists and belongs to restaurant
    const table = await Table.findOne({ slug: tableSlug, restaurantId: restaurantId });
    if (!table) {
      return NextResponse.json({ success: false, error: "Table not found" }, { status: 404 });
    }

    // Use restaurant keys or fallback to global env vars
    const key_id = restaurant.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    const key_secret = restaurant.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured for this restaurant" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        restaurantId: restaurant._id.toString(),
        tableSlug: tableSlug
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: key_id, // Send key_id back to frontend
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
