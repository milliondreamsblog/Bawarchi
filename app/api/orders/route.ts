/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import Table from "@/lib/models/Table.js";
import Item from "@/lib/models/Item.js";
import Restaurant from "@/lib/models/Restaurant.js";
import { computeBilling, BillingError } from "@/lib/billing";
import { issueCancelToken } from "@/lib/cancelToken";
import { requireAuth } from "@/lib/utils/apiAuth";
import { attachPhoneHash } from "@/lib/diner";

export async function GET(request: Request) {
  // Authenticated. Restaurants see only their own orders (restaurantId is
  // derived from session, not the query string). Super-admins may pass an
  // explicit ?restaurantId=... to scope; if omitted, no orders are returned.
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const queryRestaurantId = searchParams.get("restaurantId");

    let restaurantId: string | null = null;
    if (session!.user.role === "super-admin") {
      restaurantId = queryRestaurantId;
    } else {
      // role === "restaurant" — session.user.id is the restaurant _id
      restaurantId = (session!.user as any).id;
      if (queryRestaurantId && queryRestaurantId !== restaurantId) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "restaurantId is required" },
        { status: 400 }
      );
    }

    const orders = await Order.find({ restaurantId })
      .populate({
        path: "items.itemId",
        select: "name price description category",
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
      restaurantId,
      razorpayOrderId,
      razorpayPaymentId,
      // Schema-prep fields (Step 1 wires the actual diner logic; persisted now for forward compat)
      dinerId,
      customerPhone,
    } = body;

    if (!tableSlug || !Array.isArray(items) || items.length === 0 || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "tableSlug, items, and restaurantId are required" },
        { status: 400 }
      );
    }

    const table = await Table.findOne({ slug: tableSlug, restaurantId });
    if (!table) {
      return NextResponse.json(
        { success: false, error: "Table not found" },
        { status: 404 }
      );
    }

    // Server-trusted recomputation. Any billing field in `body` is ignored.
    const { breakdown } = await computeBilling({
      restaurantId,
      items: items.map((it: any) => ({ itemId: it.itemId, qty: it.qty })),
    });

    // Cross-check: if Razorpay paid amount diverges from what we'd charge
    // for these items right now, reject. This closes the tamper window
    // between create-order and orders POST (e.g. submitting cart B after
    // paying for cart A, or after a menu price change mid-checkout).
    //
    // Same pass also captures the contact number Razorpay collected (used
    // below to opportunistically bind a phone hash to the Diner, §4.1).
    let razorpayContact: string | null = null;
    if (razorpayOrderId) {
      const restaurant = await Restaurant.findById(restaurantId).lean();
      const key_id = (restaurant as any)?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
      const key_secret = (restaurant as any)?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
      if (!key_id || !key_secret) {
        return NextResponse.json(
          { success: false, error: "Payment gateway not configured" },
          { status: 400 }
        );
      }
      const razorpay = new Razorpay({ key_id, key_secret });
      const fetches: Promise<any>[] = [razorpay.orders.fetch(razorpayOrderId)];
      if (razorpayPaymentId) fetches.push(razorpay.payments.fetch(razorpayPaymentId));
      const [rzpOrder, rzpPayment] = await Promise.all(fetches);

      const expectedPaise = Math.round(breakdown.finalAmount * 100);
      if (Number(rzpOrder.amount) !== expectedPaise) {
        return NextResponse.json(
          {
            success: false,
            error: "Order amount mismatch — items or prices changed after payment",
          },
          { status: 409 }
        );
      }
      if (rzpPayment && typeof rzpPayment.contact === "string" && rzpPayment.contact.trim()) {
        razorpayContact = rzpPayment.contact.trim();
      }
    }

    const orderData: any = {
      tableSlug,
      items: items.map((it: any) => ({ itemId: it.itemId, qty: it.qty })),
      total: breakdown.finalAmount, // legacy field kept in sync with finalAmount
      restaurantId,
      status: "pending",
      baseTotal: breakdown.baseTotal,
      gstPercentage: breakdown.gstPercentage,
      gstAmount: breakdown.gstAmount,
      platformFee: breakdown.platformFee,
      finalAmount: breakdown.finalAmount,
      restaurantEarnings: breakdown.restaurantEarnings,
      myEarnings: breakdown.myEarnings,
    };

    if (razorpayOrderId) orderData.razorpayOrderId = razorpayOrderId;
    if (razorpayPaymentId) orderData.razorpayPaymentId = razorpayPaymentId;
    if (dinerId) orderData.dinerId = dinerId;
    const phoneForOrder = customerPhone || razorpayContact;
    if (phoneForOrder) orderData.customerPhone = phoneForOrder;

    const order = await Order.create(orderData);

    await Table.findOneAndUpdate(
      { slug: tableSlug, restaurantId },
      { status: "occupied", occupiedAt: new Date(), currentOrderId: order._id }
    );

    for (const { itemId, qty } of orderData.items) {
      const item = await Item.findById(itemId);
      if (item && item.stock > 0) {
        item.stock = Math.max(0, item.stock - qty);
        if (item.stock === 0) item.available = false;
        await item.save();
      }
    }

    // Opportunistic identity binding (§4.1). If we have both a Diner and a
    // phone from Razorpay, attach the hash. Fire-and-forget — order success
    // doesn't depend on this, and the helper handles collisions gracefully.
    if (dinerId && phoneForOrder) {
      attachPhoneHash(dinerId, phoneForOrder).catch((err) => {
        console.warn("[orders] attachPhoneHash failed:", err?.message);
      });
    }

    const { token: cancelToken } = issueCancelToken(
      order._id.toString(),
      order.createdAt
    );

    return NextResponse.json(
      { success: true, order, cancelToken },
      { status: 201 }
    );
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
