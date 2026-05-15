/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db.js";
import Restaurant from "@/lib/models/Restaurant.js";
import { hashPassword } from "@/lib/utils/password";

export async function POST(request: Request) {
  try {
    await connectDB();

    // Check if super admin already exists
    const existingRestaurant = await Restaurant.findOne().lean();
    if (existingRestaurant) {
      return NextResponse.json({
        success: false,
        message: "Super admin setup already completed",
      });
    }

    // Create default restaurant for seeded data
    const hashedPassword = await hashPassword("defaultpass123");
    
    const defaultRestaurant = await Restaurant.create({
      name: "Default Restaurant",
      email: "default@restaurant.com",
      password: hashedPassword,
      owner: "Default Owner",
      phone: "1234567890",
      address: "Default Address",
      status: "approved",
    });

    return NextResponse.json({
      success: true,
      message: "Setup completed",
      restaurantId: defaultRestaurant._id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
