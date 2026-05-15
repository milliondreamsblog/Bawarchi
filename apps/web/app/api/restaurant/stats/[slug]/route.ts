/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Restaurant from "@/lib/models/Restaurant.js";
import Order from "@/lib/models/Order.js";
import Item from "@/lib/models/Item.js";
import Table from "@/lib/models/Table.js";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const restaurant = await Restaurant.findOne({ slug });
    
    if (!restaurant) {
      return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
    }

    const restaurantId = restaurant._id;

    // Get start of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Run queries in parallel
    const [ordersToday, totalItems, totalTables, tablesOccupied, lowStockItems, pendingOrders, revenueAgg] = await Promise.all([
      Order.countDocuments({
        restaurantId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }),
      Item.countDocuments({ restaurantId }),
      Table.countDocuments({ restaurantId }),
      Table.countDocuments({ restaurantId, status: "occupied" }),
      Item.countDocuments({
        restaurantId,
        stock: { $gt: 0, $lte: 5 },
      }),
      Order.countDocuments({ restaurantId, status: "pending" }),
      Order.aggregate([
        {
          $match: {
            restaurantId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $nin: ["cancelled", "refunded"] },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $ifNull: ["$finalAmount", "$total"] } },
          },
        },
      ]),
    ]);

    const revenueToday = revenueAgg[0]?.revenue ?? 0;

    return NextResponse.json({
      success: true,
      stats: {
        ordersToday,
        totalItems,
        totalTables,
        tablesOccupied,
        lowStockItems,
        pendingOrders,
        revenueToday,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
