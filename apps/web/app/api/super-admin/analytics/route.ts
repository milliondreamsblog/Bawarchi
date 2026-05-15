/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db.js";
import Order from "@/lib/models/Order.js";
import Restaurant from "@/lib/models/Restaurant.js";
import { requireSuperAdmin } from "@/lib/utils/apiAuth";

export async function GET(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get("range") || "30", 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);
    startDate.setHours(0, 0, 0, 0);

    const activeMatch = {
      status: { $nin: ["cancelled", "refunded"] },
    };

    const rangeMatch = {
      ...activeMatch,
      createdAt: { $gte: startDate },
    };

    // Run all aggregations in parallel
    const [
      platformSummary,
      dailyRevenue,
      restaurantComparison,
      orderGrowth,
      restaurantGrowth,
      totalRestaurantsResult,
      activeRestaurantsResult,
    ] = await Promise.all([
      // a) Platform summary
      Order.aggregate([
        { $match: { ...rangeMatch } },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $ifNull: ["$finalAmount", "$total"] },
            },
            totalOrders: { $sum: 1 },
            totalPlatformEarnings: {
              $sum: { $ifNull: ["$myEarnings", 0] },
            },
            totalGst: { $sum: { $ifNull: ["$gstAmount", 0] } },
          },
        },
      ]),

      // b) Daily revenue
      Order.aggregate([
        { $match: { ...rangeMatch } },
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

      // c) Restaurant comparison (top 10 by revenue)
      Order.aggregate([
        { $match: { ...rangeMatch } },
        {
          $group: {
            _id: "$restaurantId",
            revenue: { $sum: { $ifNull: ["$finalAmount", "$total"] } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "restaurants",
            localField: "_id",
            foreignField: "_id",
            as: "restaurant",
          },
        },
        { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            restaurantId: "$_id",
            name: { $ifNull: ["$restaurant.name", "Unknown"] },
            revenue: 1,
            orders: 1,
          },
        },
      ]),

      // d) Growth metrics - orders per month
      Order.aggregate([
        { $match: activeMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" },
            },
            orders: { $sum: 1 },
            revenue: { $sum: { $ifNull: ["$finalAmount", "$total"] } },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            month: "$_id",
            orders: 1,
            revenue: 1,
          },
        },
      ]),

      // d) Growth metrics - new restaurants per month
      Restaurant.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" },
            },
            newRestaurants: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            month: "$_id",
            newRestaurants: 1,
          },
        },
      ]),

      // e) Total restaurants
      Restaurant.countDocuments(),

      // e) Active restaurants (with at least 1 order in range)
      Order.distinct("restaurantId", {
        ...rangeMatch,
      }),
    ]);

    // Fill in missing days for daily revenue
    const filledDailyRevenue = fillMissingDays(dailyRevenue, range);

    // Merge growth metrics
    const monthsMap = new Map<string, any>();
    orderGrowth.forEach((item: any) => {
      monthsMap.set(item.month, {
        month: item.month,
        orders: item.orders,
        revenue: item.revenue,
        newRestaurants: 0,
      });
    });
    restaurantGrowth.forEach((item: any) => {
      if (monthsMap.has(item.month)) {
        monthsMap.get(item.month).newRestaurants = item.newRestaurants;
      } else {
        monthsMap.set(item.month, {
          month: item.month,
          orders: 0,
          revenue: 0,
          newRestaurants: item.newRestaurants,
        });
      }
    });
    const growthMetrics = Array.from(monthsMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    const summaryData = platformSummary[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      totalPlatformEarnings: 0,
      totalGst: 0,
    };

    const avgOrderValue =
      summaryData.totalOrders > 0
        ? summaryData.totalRevenue / summaryData.totalOrders
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        platformSummary: {
          totalRevenue: Math.round(summaryData.totalRevenue),
          totalOrders: summaryData.totalOrders,
          totalPlatformEarnings: Math.round(summaryData.totalPlatformEarnings),
          totalGst: Math.round(summaryData.totalGst),
          avgOrderValue: Math.round(avgOrderValue),
        },
        dailyRevenue: filledDailyRevenue,
        restaurantComparison,
        growthMetrics,
        totalRestaurants: totalRestaurantsResult,
        activeRestaurants: activeRestaurantsResult.length,
        range,
      },
    });
  } catch (err: any) {
    console.error("Super admin analytics error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
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
