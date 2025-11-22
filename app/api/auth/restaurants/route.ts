/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db.js";
import Restaurant from "@/lib/models/Restaurant.js";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Check if user is super admin
    if (!session || session.user.role !== "super-admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filter = status ? { status } : {};
    const restaurants = await Restaurant.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, restaurants });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    // Check if user is super admin
    if (!session || session.user.role !== "super-admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { restaurantId, status } = body;

    if (!restaurantId || !status) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID and status are required" },
        { status: 400 }
      );
    }

    if (!["pending", "approved", "blocked"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { status },
      { new: true }
    ).select("-password");

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, restaurant });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
