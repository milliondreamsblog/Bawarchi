/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
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
    const range = parseInt(searchParams.get("range") || "30", 10);

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "restaurantId is required" },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);
    startDate.setHours(0, 0, 0, 0);

    const restaurantObjId = new mongoose.Types.ObjectId(restaurantId);

    const matchStage = {
      restaurantId: restaurantObjId,
      createdAt: { $gte: startDate },
    };

    // Run all aggregations in parallel
    const [dailyRevenue, topItems, peakHours, summary, statusBreakdown] =
      await Promise.all([
        // 1. Daily revenue + order count for the past N days
        Order.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              revenue: { $sum: { $ifNull: ["$finalAmount", "$total"] } },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
        ]),

        // 2. Top selling items by quantity
        Order.aggregate([
          { $match: matchStage },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.itemId",
              totalQty: { $sum: "$items.qty" },
            },
          },
          { $sort: { totalQty: -1 } },
          { $limit: 8 },
          {
            $lookup: {
              from: "items",
              localField: "_id",
              foreignField: "_id",
              as: "item",
            },
          },
          { $unwind: "$item" },
          {
            $project: {
              _id: 0,
              name: "$item.name",
              category: "$item.category",
              totalQty: 1,
            },
          },
        ]),

        // 3. Orders by hour of day (peak hours)
        Order.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: { $hour: "$createdAt" },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, hour: "$_id", orders: 1 } },
        ]),

        // 4. Summary stats
        Order.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: { $ifNull: ["$finalAmount", "$total"] },
              },
              totalOrders: { $sum: 1 },
              totalPlatformFee: { $sum: { $ifNull: ["$platformFee", 0] } },
              totalRestaurantEarnings: {
                $sum: { $ifNull: ["$restaurantEarnings", "$total"] },
              },
              totalGst: { $sum: { $ifNull: ["$gstAmount", 0] } },
            },
          },
        ]),

        // 5. Orders by status
        Order.aggregate([
          { $match: { restaurantId: restaurantObjId } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    // Fill in missing days in dailyRevenue so the chart line is continuous
    const filledDailyRevenue = fillMissingDays(dailyRevenue, range);

    // Fill all 24 hours in peak hours
    const filledPeakHours = fillAllHours(peakHours);

    const summaryData = summary[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      totalPlatformFee: 0,
      totalRestaurantEarnings: 0,
      totalGst: 0,
    };

    const avgOrderValue =
      summaryData.totalOrders > 0
        ? summaryData.totalRevenue / summaryData.totalOrders
        : 0;

    const statusMap: Record<string, number> = {};
    statusBreakdown.forEach((s: any) => {
      statusMap[s._id] = s.count;
    });

    return NextResponse.json({
      success: true,
      data: {
        dailyRevenue: filledDailyRevenue,
        topItems,
        peakHours: filledPeakHours,
        summary: {
          totalRevenue: Math.round(summaryData.totalRevenue),
          totalOrders: summaryData.totalOrders,
          avgOrderValue: Math.round(avgOrderValue),
          totalPlatformFee: Math.round(summaryData.totalPlatformFee),
          totalRestaurantEarnings: Math.round(
            summaryData.totalRestaurantEarnings
          ),
          totalGst: Math.round(summaryData.totalGst),
        },
        statusBreakdown: {
          pending: statusMap["pending"] || 0,
          preparing: statusMap["preparing"] || 0,
          served: statusMap["served"] || 0,
        },
        range,
      },
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/** Fill in days with 0 revenue so the chart line has no gaps */
function fillMissingDays(
  data: { date: string; revenue: number; orders: number }[],
  range: number
) {
  const map = new Map(data.map((d) => [d.date, d]));
  const result = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(
      map.get(key) || {
        date: key,
        revenue: 0,
        orders: 0,
      }
    );
  }
  return result;
}

/** Ensure all 24 hours are present */
function fillAllHours(data: { hour: number; orders: number }[]) {
  const map = new Map(data.map((d) => [d.hour, d.orders]));
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${h.toString().padStart(2, "0")}:00`,
    orders: map.get(h) || 0,
  }));
}
