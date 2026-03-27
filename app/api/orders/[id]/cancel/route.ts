/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import Item from "@/lib/models/Item.js";
import Table from "@/lib/models/Table.js";
import Restaurant from "@/lib/models/Restaurant.js";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { reason, cancelledBy } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (["cancelled", "refunded", "served"].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel an order that is already ${order.status}` },
        { status: 400 }
      );
    }

    // For customer cancellation, enforce 5-minute window
    if (cancelledBy === "customer") {
      const elapsed = Date.now() - new Date(order.createdAt).getTime();
      if (elapsed > 5 * 60 * 1000) {
        return NextResponse.json(
          { success: false, error: "Cancellation window (5 minutes) has expired" },
          { status: 400 }
        );
      }
    }

    // Attempt Razorpay refund if payment was made
    let refundId: string | undefined;
    let refundStatus: string = "pending";

    if (order.razorpayPaymentId) {
      try {
        const restaurant = await Restaurant.findById(order.restaurantId);
        const keyId = restaurant?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
        const keySecret = restaurant?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

        if (keyId && keySecret) {
          const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
          const refund = await (razorpay.payments as any).refund(order.razorpayPaymentId, {
            amount: (order.finalAmount || order.total) * 100, // in paise
          });
          refundId = refund.id;
          refundStatus = "processed";
        }
      } catch (refundErr: any) {
        console.error("Refund failed:", refundErr.message);
        refundStatus = "failed";
      }
    }

    // Update order
    order.status = refundId ? "refunded" : "cancelled";
    order.cancelledAt = new Date();
    order.cancelledBy = cancelledBy || "admin";
    order.cancellationReason = reason || "";
    if (refundId) {
      order.refundId = refundId;
      order.refundStatus = refundStatus;
      order.refundAmount = order.finalAmount || order.total;
    }
    await order.save();

    // Restore stock for each item
    for (const { itemId, qty } of order.items) {
      await Item.findByIdAndUpdate(itemId, {
        $inc: { stock: qty },
        $set: { available: true },
      });
    }

    // Free the table
    await Table.findOneAndUpdate(
      { currentOrderId: id },
      { status: "free", occupiedAt: null, currentOrderId: null }
    );

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
