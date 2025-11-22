/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Restaurant from "@/lib/models/Restaurant.js";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    const { id } = await params;

    if (!session || (session.user.id !== id && session.user.role !== "super-admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const restaurant = await Restaurant.findById(id).select("-password");
    
    if (!restaurant) {
      return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
    }

    // Don't send back the full secret, just a masked version or existence check if needed
    // For now, we'll send it back so they can edit it, but in a real app be careful
    return NextResponse.json({ 
      success: true, 
      settings: {
        razorpayKeyId: restaurant.razorpayKeyId,
        razorpayKeySecret: restaurant.razorpayKeySecret
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    const { id } = await params;

    if (!session || (session.user.id !== id && session.user.role !== "super-admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { razorpayKeyId, razorpayKeySecret } = body;

    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
    }

    if (razorpayKeyId !== undefined) restaurant.razorpayKeyId = razorpayKeyId;
    if (razorpayKeySecret !== undefined) restaurant.razorpayKeySecret = razorpayKeySecret;

    await restaurant.save();

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
