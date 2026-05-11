/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import Item from "@/lib/models/Item.js";
import Table from "@/lib/models/Table.js";
import Restaurant from "@/lib/models/Restaurant.js";
import { auth } from "@/lib/auth";
import { verifyCancelToken } from "@/lib/cancelToken";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason, cancelToken } = body as { reason?: string; cancelToken?: string };

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Determine who is cancelling, by credentials — not by request body.
    //   - Admin session whose restaurant owns this order → admin cancel (any time)
    //   - Valid cancelToken bound to this order → customer cancel (5-min window)
    //   - Neither → 401
    const session = await auth();
    const isAdmin =
      session?.user &&
      (session.user.role === "super-admin" ||
        (session.user.role === "restaurant" &&
          (session.user as any).id &&
          order.restaurantId.toString() === (session.user as any).id));

    let cancelledBy: "customer" | "admin";
    if (isAdmin) {
      cancelledBy = "admin";
    } else {
      const tokenCheck = verifyCancelToken(
        order._id.toString(),
        order.createdAt,
        cancelToken
      );
      if (!tokenCheck.ok) {
        const reasonText =
          tokenCheck.reason === "expired"
            ? "Cancellation window (5 minutes) has expired"
            : "Authentication required to cancel this order";
        const status = tokenCheck.reason === "expired" ? 400 : 401;
        return NextResponse.json(
          { success: false, error: reasonText },
          { status }
        );
      }
      cancelledBy = "customer";
    }

    if (["cancelled", "refunded", "served"].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel an order that is already ${order.status}` },
        { status: 400 }
      );
    }

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
            amount: (order.finalAmount || order.total) * 100,
          });
          refundId = refund.id;
          refundStatus = "processed";
        }
      } catch (refundErr: any) {
        console.error("Refund failed:", refundErr.message);
        refundStatus = "failed";
      }
    }

    order.status = refundId ? "refunded" : "cancelled";
    order.cancelledAt = new Date();
    order.cancelledBy = cancelledBy;
    order.cancellationReason = reason || "";
    if (refundId) {
      order.refundId = refundId;
      order.refundStatus = refundStatus;
      order.refundAmount = order.finalAmount || order.total;
    }
    await order.save();

    for (const { itemId, qty } of order.items) {
      await Item.findByIdAndUpdate(itemId, {
        $inc: { stock: qty },
        $set: { available: true },
      });
    }

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
