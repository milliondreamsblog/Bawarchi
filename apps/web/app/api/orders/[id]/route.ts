/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import Table from "@/lib/models/Table.js";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/apiAuth";
import { verifyCancelToken } from "@/lib/cancelToken";

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
        select: "name price description category image",
      })
      .populate({
        path: "restaurantId",
        select: "name slug address phone email logo",
      })
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Authorization: either the diner who owns the order (via cancel token
    // bound to this specific orderId+createdAt — also serves as a read token
    // for /order-success) or an admin for the owning restaurant.
    const session = await auth();
    const role = (session?.user as any)?.role as string | undefined;
    const sessionId = (session?.user as any)?.id as string | undefined;

    // Normalize the order's restaurantId regardless of populate state.
    const ridRaw: any = (order as any).restaurantId;
    const orderRestaurantId: string =
      ridRaw && typeof ridRaw === "object" && ridRaw._id
        ? String(ridRaw._id)
        : ridRaw != null
        ? String(ridRaw)
        : "";

    const isAdmin =
      role === "super-admin" ||
      (role === "restaurant" && !!sessionId && sessionId === orderRestaurantId);

    if (!isAdmin) {
      const token = request.headers.get("x-cancel-token");
      const check = verifyCancelToken(
        (order as any)._id.toString(),
        (order as any).createdAt,
        token
      );
      if (!check.ok) {
        const msg =
          check.reason === "missing"
            ? "Missing x-cancel-token header"
            : check.reason === "expired"
            ? "Cancel token expired (order older than 5 minutes)"
            : "Invalid cancel token";
        return NextResponse.json(
          { success: false, error: msg, reason: check.reason },
          { status: 401 }
        );
      }
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
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const existingOrder = await Order.findById(id);

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Derive ownership from session, not request body.
    const isSuperAdmin = session!.user.role === "super-admin";
    const isOwningRestaurant =
      session!.user.role === "restaurant" &&
      (session!.user as any).id === existingOrder.restaurantId.toString();
    if (!isSuperAdmin && !isOwningRestaurant) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    if (status) {
      existingOrder.status = status;
      await existingOrder.save();

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
