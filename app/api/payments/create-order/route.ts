/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import Table from "@/lib/models/Table.js";
import { computeBilling, BillingError } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, currency = "INR", tableSlug, restaurantId } = body;

    if (!Array.isArray(items) || items.length === 0 || !tableSlug || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "items, tableSlug, and restaurantId are required" },
        { status: 400 }
      );
    }

    // computeBilling validates restaurant + items + tenant isolation and
    // returns the authoritative billing breakdown. Razorpay order amount
    // is anchored to this server-computed finalAmount — any subsequent
    // signature verification transitively verifies the amount because
    // it's bound to the order_id Razorpay created here.
    const { breakdown, restaurant } = await computeBilling({ restaurantId, items });

    // Verify table exists and belongs to restaurant (kept here, not in
    // computeBilling, because tableSlug is order-level, not billing-level).
    const table = await Table.findOne({ slug: tableSlug, restaurantId });
    if (!table) {
      return NextResponse.json(
        { success: false, error: "Table not found" },
        { status: 404 }
      );
    }

    const key_id = restaurant.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    const key_secret = restaurant.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured for this restaurant" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const options = {
      amount: Math.round(breakdown.finalAmount * 100), // paise; server-trusted
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        restaurantId: restaurant._id,
        tableSlug,
        baseTotal: breakdown.baseTotal.toString(),
        gstPercentage: breakdown.gstPercentage.toString(),
        gstAmount: breakdown.gstAmount.toString(),
        platformFee: breakdown.platformFee.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id,
      // Breakdown is for client display only. The orders POST will
      // recompute from items independently — it does not trust this.
      billingBreakdown: breakdown,
    });
  } catch (error: any) {
    if (error instanceof BillingError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
