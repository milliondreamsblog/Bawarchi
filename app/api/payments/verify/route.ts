/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tableSlug, restaurantId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !tableSlug || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "Missing payment verification parameters" },
        { status: 400 }
      );
    }

    // Find restaurant secret
    await (await import("@/lib/db.js")).default();
    const Restaurant = (await import("@/lib/models/Restaurant.js")).default;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
    }

    const key_secret = restaurant.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      return NextResponse.json(
        { success: false, error: "Payment configuration missing" },
        { status: 500 }
      );
    }

    // Verify signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(text)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
