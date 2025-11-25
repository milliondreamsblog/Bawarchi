/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDB from "@/lib/db.js";
import { calculateBillingBreakdown } from "@/lib/utils/billing";

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

    // Calculate billing breakdown with restaurant's GST
    const gstPercentage = restaurant.gstPercentage || 0;
    const billingBreakdown = calculateBillingBreakdown(amount, gstPercentage);

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
      amount: Math.round(billingBreakdown.finalAmount * 100), // Convert to paise, use finalAmount
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        restaurantId: restaurant._id.toString(),
        tableSlug: tableSlug,
        baseTotal: billingBreakdown.baseTotal.toString(),
        gstPercentage: gstPercentage.toString(),
        gstAmount: billingBreakdown.gstAmount.toString(),
        platformFee: billingBreakdown.platformFee.toString(),
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: key_id, // Send key_id back to frontend
      billingBreakdown, // Send complete breakdown to frontend
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
