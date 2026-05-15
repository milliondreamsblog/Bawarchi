/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Restaurant from "@/lib/models/Restaurant.js";
import { requireAuth } from "@/lib/utils/apiAuth";

function isOwnerOrSuperAdmin(
  session: { user: { id?: string; role?: string } } | null,
  restaurantId: string
): boolean {
  if (!session?.user) return false;
  if (session.user.role === "super-admin") return true;
  return session.user.id === restaurantId;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    if (!isOwnerOrSuperAdmin(session as any, id)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const restaurant = await Restaurant.findById(id).select("-password");

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        razorpayKeyId: restaurant.razorpayKeyId,
        razorpayKeySecret: restaurant.razorpayKeySecret,
        gstPercentage: restaurant.gstPercentage || 0,
      },
    });
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

    if (!isOwnerOrSuperAdmin(session as any, id)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { razorpayKeyId, razorpayKeySecret, gstPercentage } = body;

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      );
    }

    if (gstPercentage !== undefined) {
      if (![0, 5, 12, 18].includes(gstPercentage)) {
        return NextResponse.json(
          { success: false, error: "GST percentage must be 0, 5, 12, or 18" },
          { status: 400 }
        );
      }
      restaurant.gstPercentage = gstPercentage;
    }

    if (razorpayKeyId !== undefined) restaurant.razorpayKeyId = razorpayKeyId;
    if (razorpayKeySecret !== undefined) restaurant.razorpayKeySecret = razorpayKeySecret;

    await restaurant.save();

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
