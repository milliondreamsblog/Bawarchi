/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import { requireAuth } from "@/lib/utils/apiAuth";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "restaurantId is required" },
        { status: 400 }
      );
    }

    const filter: any = { restaurantId };
    if (status && status !== "all") filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate({ path: "items.itemId", select: "name price category" })
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Order ID",
      "Date",
      "Table",
      "Items",
      "Qty",
      "Base Total",
      "GST %",
      "GST Amount",
      "Platform Fee",
      "Final Amount",
      "Status",
      "Payment ID",
    ];

    const rows = orders.map((order: any) => {
      const itemNames = order.items
        .map((i: any) => `${i.itemId?.name || "Deleted Item"} x${i.qty}`)
        .join("; ");
      const totalQty = order.items.reduce((s: number, i: any) => s + i.qty, 0);

      return [
        order._id.toString(),
        new Date(order.createdAt).toLocaleString("en-IN"),
        order.tableSlug,
        `"${itemNames}"`,
        totalQty,
        order.baseTotal ?? order.total,
        order.gstPercentage ?? 0,
        order.gstAmount ?? 0,
        order.platformFee ?? 0,
        order.finalAmount ?? order.total,
        order.status,
        order.razorpayPaymentId || "",
      ];
    });

    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join(
      "\n"
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
